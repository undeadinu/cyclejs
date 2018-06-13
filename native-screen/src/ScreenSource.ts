import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {HandlersPerSelector, ContextData} from './context';

export class ScreenSource {
  private selector: string | null;
  private ctx: ContextData;

  constructor(
    ctx: ContextData = new ContextData(),
    selector: string | null = null,
  ) {
    this.ctx = ctx;
    this.selector = selector;
  }

  public select(selector: string): ScreenSource {
    return new ScreenSource(this.ctx, selector);
  }

  public events(eventType: string): Stream<any> {
    if (this.selector === null) {
      return adapt(xs.empty());
    } else {
      return adapt(this.ctx.getHandler(this.selector, eventType));
    }
  }
}
