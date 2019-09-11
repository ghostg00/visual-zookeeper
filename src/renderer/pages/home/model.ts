import { ModelType } from "@/declare/dva";
import ZkClient from "@/utils/ZkClient";
import { Event } from "node-zookeeper-client";
import logEvent from "../../utils/LogEvent";

let zkClient = new ZkClient();

export interface StateType {
  nodeStat: [];
}

const event = (event: Event) => {
  // console.log("getData", event);
  logEvent.emit("log", event);
};

const model: ModelType<StateType> = {
  namespace: "home",
  state: { nodeStat: [] },

  effects: {
    *connect({ payload, callback }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.connect],
        payload.connectionString || "127.0.0.1:2181"
      );
      data && callback && callback(data);
    },
    *close({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.close]);
      callback && callback(data);
    },
    *getChildren({ payload, callback, event }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.getChildren],
        payload.path,
        event
      );
      callback && callback(data);
    },
    *create({ payload, callback }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.create],
        payload.path,
        payload.nodeData
      );
      callback && callback(data);
    },
    *remove({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.remove], payload.path);
      callback && callback(data);
    },
    *getData({ payload, callback }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.getData],
        payload.path,
        event
      );
      yield put({
        type: "getDataReducer",
        payload: data
      });
      callback && callback(data[0]);
    },
    *setData({ payload, callback }, { call, put }) {
      yield call([zkClient, zkClient.setData], payload.path, payload.data);
      // yield put({
      //   type: "getData",
      //   payload
      // });
      callback && callback();
    },
    *getACL({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.getACL], payload.path);
      callback && callback(data);
    }
  },
  // @ts-ignore
  reducers: {
    getDataReducer(state, { payload }) {
      return { ...state, nodeStat: payload[1] };
    }
  }
};

export default model;
