import 'mocha';
import * as renderer from 'react-test-renderer';
import * as React from 'react';
import xs, {Stream} from 'xstream';
import * as ReactNative from 'react-native';
import {run} from '@cycle/run';
import {ScreenSource, h, makeComponent, ContextData} from '../src/index';
const assert = require('assert');
const {View, Text} = ReactNative;

class Touchable extends React.PureComponent<any, any> {
  public press() {
    if (this.props.onPress) {
      this.props.onPress(null);
    }
  }

  public render() {
    return this.props.children;
  }
}

describe('makeComponent', function() {
  it('converts an MVI Cycle app into a React component', function(done) {
    function main(sources: {Screen: ScreenSource}) {
      const inc$ = sources.Screen.select('button').events('press');
      const count$ = inc$.fold((acc: number, x: any) => acc + 1, 0);
      const vdom$ = count$.map((i: number) =>
        h(Touchable, {selector: 'button'}, [h(View, [h(Text, {}, '' + i)])]),
      );
      return {Screen: vdom$};
    }

    function testDriver(vdom$: Stream<React.ReactElement<any>>) {
      let turn = 0;
      const ctx = new ContextData();
      const RootComponent = makeComponent(vdom$, ctx);
      const r = renderer.create(React.createElement(RootComponent));
      const root = r.root;
      const check = () => {
        const to = root.findByType(Touchable);
        const view = to.props.children;
        const text = view.props.children;
        assert.strictEqual(text.props.children, `${turn}`);
        to.instance.press();
        turn++;
        if (turn === 3) {
          done();
        }
      };
      setTimeout(check, 50);
      setTimeout(check, 100);
      setTimeout(check, 150);
      return new ScreenSource(ctx);
    }

    run(main, {Screen: testDriver});
  });

  it('no synchronous race conditions with handler registration', done => {
    function main(sources: {Screen: ScreenSource}) {
      const inc$ = xs.create({
        start(listener: any) {
          setTimeout(() => {
            sources.Screen
              .select('button')
              .events('press')
              .addListener(listener);
          }, 30);
        },
        stop() {},
      });
      const count$ = inc$.fold((acc: number, x: any) => acc + 1, 0);
      const vdom$ = count$.map((i: number) =>
        h(Touchable, {selector: 'button'}, [h(View, [h(Text, {}, '' + i)])]),
      );
      return {Screen: vdom$};
    }

    function testDriver(vdom$: Stream<React.ReactElement<any>>) {
      let turn = 0;
      const ctx = new ContextData();
      const RootComponent = makeComponent(vdom$, ctx);
      const r = renderer.create(React.createElement(RootComponent));
      const root = r.root;
      const check = () => {
        const to = root.findByType(Touchable);
        const view = to.props.children;
        const text = view.props.children;
        assert.strictEqual(text.props.children, `${turn}`);
        to.instance.press();
        turn++;
        if (turn === 3) {
          done();
        }
      };
      setTimeout(check, 100);
      setTimeout(check, 150);
      setTimeout(check, 200);
      return new ScreenSource(ctx);
    }

    run(main, {Screen: testDriver});
  });
});
