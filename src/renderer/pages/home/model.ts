import { ModelType } from "@/declare/dva";
import ZkClient from "@/utils/ZkClient";
import { Event } from "node-zookeeper-client";
import logEvent from "../../utils/LogEvent";

let zkClient = new ZkClient();

export interface StateType {}

const event = (event: Event) => {
  logEvent.emit("log", event);
};

const model: ModelType<StateType> = {
  namespace: "home",
  state: {},

  effects: {
    *connect({ payload }, { call, put }) {
      const data = yield call([zkClient, zkClient.connect], payload.url);
      if (data) return data;
    },
    *close({ payload }, { call, put }) {
      return yield call([zkClient, zkClient.close]);
    },
    *getChildren({ payload, callback, event }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.getChildren],
        payload.path,
        event
      );
      callback && callback(data);
    },
    *getChildrenTree({ payload, event }, { call, put }) {
      return yield call(
        [zkClient, zkClient.getChildrenTree],
        payload.rootNode,
        event
      );
    },
    *create({ payload }, { call, put }) {
      return yield call(
        [zkClient, zkClient.create],
        payload.path,
        payload.nodeData
      );
    },
    *remove({ payload }, { call, put }) {
      return yield call([zkClient, zkClient.remove], payload.path);
    },
    *getData({ payload }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.getData],
        payload.path,
        event
      );
      yield put({
        type: "getDataReducer",
        payload: data
      });
      return data;
    },
    *setData({ payload }, { call, put }) {
      return yield call(
        [zkClient, zkClient.setData],
        payload.path,
        payload.data
      );
    },
    *getACL({ payload }, { call, put }) {
      return yield call([zkClient, zkClient.getACL], payload.path);
    }
  },
  reducers: {}
};

export default model;
