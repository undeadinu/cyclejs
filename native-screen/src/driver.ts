import {PureComponent, Component, ReactElement, createElement} from 'react';
import xs, {Stream, Listener, Subscription} from 'xstream';
import {AppRegistry, View} from 'react-native';
import {ScreenSource} from './ScreenSource';
import {HandlersContext, HandlersPerSelector, ContextData} from './context';

type ViewStreamProps = {
  stream: Stream<ReactElement<any>>;
};

type ViewStreamState = {
  reactElem: ReactElement<any> | null;
};

class ViewStream extends PureComponent<ViewStreamProps, ViewStreamState> {
  private reactElemSub?: Subscription;

  constructor(props: ViewStreamProps) {
    super(props);
    this.state = {reactElem: null};
  }

  public componentDidMount() {
    this.reactElemSub = this.props.stream.subscribe({
      next: (elem: ReactElement<any>) => {
        this.setState(() => ({reactElem: elem}));
      },
    });
  }

  public render() {
    return this.state.reactElem;
  }

  public componentWillUnmount() {
    if (this.reactElemSub) {
      this.reactElemSub.unsubscribe();
      this.reactElemSub = undefined;
    }
  }
}

export function makeComponent(
  vdom$: Stream<ReactElement<any>>,
  ctx: ContextData = new ContextData(),
) {
  return class NativeScreen extends Component<any, {}> {
    public render() {
      return createElement(
        HandlersContext.Provider,
        {value: ctx},
        createElement(ViewStream, {stream: vdom$}),
      );
    }
  };
}

export function makeScreenDriver(appKey: string) {
  return function reactNativeDriver(vdom$: Stream<ReactElement<any>>) {
    const ctx = new ContextData();
    AppRegistry.registerComponent(appKey, () => makeComponent(vdom$, ctx));
    return new ScreenSource(ctx);
  };
}
