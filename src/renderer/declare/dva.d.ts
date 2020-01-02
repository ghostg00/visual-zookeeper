import { Action, AnyAction, Reducer } from 'redux';
import { EffectsCommandMap, Model } from "dva";

declare type Effect<S> = (
  action: AnyAction,
  effects: EffectsCommandMap & { select: <T>(func: (state: S) => T) => T }
) => void;

// @ts-ignore
declare interface ModelType<S> extends Model {
  namespace: string;
  state?: S;
  effects?: {
    [key: string]: Effect<S>;
  };
  reducers?: {
    [key: string]: Reducer<S>;
  };
}

declare interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T): Promise<any>;
}
