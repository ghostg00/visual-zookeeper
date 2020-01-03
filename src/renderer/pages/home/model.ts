import { ModelType } from "@/declare/dva";
import ZkClient from "@/utils/ZkClient";
import { Event } from "node-zookeeper-client";
import logEvent from "../../utils/LogEvent";

let zkClient = new ZkClient();

export interface StateType {}

const event = (event: Event) => {
  logEvent.emit("log", event);
};

const model: ModelType<{}> = {
  namespace: "home",
  state: {},

  effects: {
    *connect({ payload }, { call }) {
      const data = yield call([zkClient, zkClient.connect], payload);
      if (data) return data;
    },
    *close({ payload }, { call }) {
      return yield call([zkClient, zkClient.close]);
    },
    *getChildren({ payload, callback, event }, { call }) {
      const data = yield call(
        [zkClient, zkClient.getChildren],
        payload.path,
        event
      );
      callback && callback(data);
    },
    *getChildrenTree({ payload, event }, { call }) {
      return yield call(
        [zkClient, zkClient.getChildrenTree],
        payload.rootNode,
        event
      );
    },
    *create({ payload }, { call }) {
      return yield call(
        [zkClient, zkClient.create],
        payload.path,
        payload.nodeData
      );
    },
    *remove({ payload }, { call }) {
      return yield call([zkClient, zkClient.remove], payload.path);
    },
    *getData({ payload }, { call }) {
      const data = yield call(
        [zkClient, zkClient.getData],
        payload.path,
        event
      );
      return data;
    },
    *setData({ payload }, { call }) {
      return yield call(
        [zkClient, zkClient.setData],
        payload.path,
        payload.data
      );
    },
    *getACL({ payload }, { call }) {
      return yield call([zkClient, zkClient.getACL], payload.path);
    }
  },
  reducers: {}
};

export default model;
