import {createElement, forwardRef, PureComponent} from 'react';
import {HandlersContext, ContextData} from './context';

export type PropsExtensions = {
  selector?: string;
};

function createElementSpreading<P>(
  type: React.ComponentType<P>,
  props: P | null,
  children: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  if (typeof children === 'string') {
    return createElement(type, props, children);
  } else {
    return createElement(type, props, ...children);
  }
}

const wrapperComponents: Map<any, React.ComponentType<any>> = new Map();

type IncoProps = {
  targetProps: any;
  targetRef: any;
  target: any;
  ctx: ContextData;
};

type IncoState = {
  flip: boolean;
};

class Incorporator extends PureComponent<IncoProps, IncoState> {
  constructor(props: IncoProps) {
    super(props);
    this.state = {flip: false};
    this.selector = props.targetProps.selector;
  }

  private selector: string;
  private unsubscribe: any;

  public componentDidMount() {
    const {targetProps, ctx} = this.props;
    const selector = targetProps.selector;
    this.unsubscribe = ctx.subscribe(selector, () => {
      this.setState((prev: any) => ({flip: !prev.flip}));
    });
  }

  private incorporateHandlers<P>(
    props: P & PropsExtensions,
    ctx: ContextData,
  ): P {
    const handlers = ctx.getSelectorHandlers(this.selector);
    const handlerEventTypes = Object.keys(handlers);
    const N = handlerEventTypes.length;
    for (let i = 0; i < N; ++i) {
      const evType = handlerEventTypes[i];
      const onFoo = `on${evType[0].toUpperCase()}${evType.slice(1)}`;
      props[onFoo] = (ev: any) => handlers[evType]._n(ev);
    }
    return props;
  }

  public render() {
    const {target, targetProps, targetRef, ctx} = this.props;
    this.incorporateHandlers(targetProps, ctx);
    if (targetRef) {
      targetProps.ref = targetRef;
    }
    if (targetProps.children) {
      return createElementSpreading(target, targetProps, targetProps.children);
    } else {
      return createElement(target, targetProps);
    }
  }

  public componentWillUnmount() {
    this.unsubscribe();
  }
}

function incorporate(type: any) {
  if (!wrapperComponents.has(type)) {
    wrapperComponents.set(
      type,
      forwardRef<any, any>((props, ref) =>
        createElement(HandlersContext.Consumer, null, (ctx: ContextData) =>
          createElement(Incorporator, {
            targetProps: {...props},
            targetRef: ref,
            target: type,
            ctx: ctx,
          }),
        ),
      ),
    );
  }
  return wrapperComponents.get(type) as React.ComponentType<any>;
}

function hyperscriptProps<P>(
  type: React.ComponentType<P>,
  props: P & PropsExtensions,
): React.ReactElement<P> {
  if (!props.selector) {
    return createElement(type, props);
  } else {
    return createElement(incorporate(type), props);
  }
}

function hyperscriptChildren<P>(
  type: React.ComponentType<P>,
  children: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  return createElementSpreading(type, null, children);
}

function hyperscriptPropsChildren<P>(
  type: React.ComponentType<P>,
  props: P & PropsExtensions,
  children: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  if (!props.selector) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(incorporate(type), props, children);
  }
}

export function h<P>(
  type: React.ComponentType<P>,
  a?: (P & PropsExtensions) | string | Array<React.ReactElement<any>>,
  b?: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  if (a === undefined && b === undefined) {
    return createElement(type, null);
  }
  if (b === undefined && (typeof a === 'string' || Array.isArray(a))) {
    return hyperscriptChildren(type, a);
  }
  if (b === undefined && typeof a === 'object' && !Array.isArray(a)) {
    return hyperscriptProps(type, a);
  }
  if (
    a !== undefined &&
    typeof a !== 'string' &&
    !Array.isArray(a) &&
    b !== undefined
  ) {
    return hyperscriptPropsChildren(type, a, b);
  } else {
    throw new Error('Unexpected usage of h() function');
  }
}
