import xs, {Stream} from 'xstream';
import * as React from 'react';

export type Handlers = {
  [evType: string]: Stream<any>;
};

export type HandlersPerSelector = {
  [selector: string]: Handlers;
};

export type ListenersPerSelector = {
  [selector: string]: () => void;
};

export class ContextData {
  public handlers: HandlersPerSelector;
  public listeners: ListenersPerSelector;

  constructor() {
    this.handlers = {};
    this.listeners = {};
  }

  public getSelectorHandlers(selector: string) {
    return this.handlers[selector] || {};
  }

  public getHandler(selector: string, evType: string) {
    this.handlers[selector] = this.handlers[selector] || {};
    if (!this.handlers[selector][evType]) {
      this.handlers[selector][evType] = xs.create<any>();
      if (this.listeners[selector]) {
        this.listeners[selector]();
      }
    }
    return this.handlers[selector][evType];
  }

  public subscribe(selector: string, listener: () => void) {
    this.listeners[selector] = listener;
    const that = this;
    return function unsubscribe() {
      delete that.listeners[selector];
    };
  }
}

export const HandlersContext = React.createContext({});
