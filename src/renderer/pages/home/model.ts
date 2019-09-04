import { ZKServer } from "@/pages/home/data.d";
import { ModelType } from "@/declare/dva";
import ZkClient from "@/utils/zk-client";

let zkClient = new ZkClient();

export interface StateType {
  nodeStat: [];
}

const model: ModelType<StateType> = {
  namespace: "home",
  state: { nodeStat: [] },

  effects: {
    *connect({ payload, callback }, { call, put }) {
      const data = yield call(
        [zkClient, zkClient.connect],
        payload.connectionString || "localhost:2181"
      );
      callback && callback(data);
    },
    *getChildren({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.getChildren], payload.path);
      callback && callback(data);
    },
    *getData({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.getData], payload.path);
      yield put({
        type: "getDataReducer",
        payload: data
      });
      callback && callback(data[0]);
    },
    *setData({ payload, callback }, { call, put }) {
      yield call([zkClient, zkClient.setData], payload.path, payload.data);
      yield put({
        type: "getData",
        payload
      });
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
