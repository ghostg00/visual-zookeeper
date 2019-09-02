import { AnyAction, Reducer } from "redux";
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
