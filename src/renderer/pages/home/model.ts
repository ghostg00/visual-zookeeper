import { ZKServer } from "@/pages/home/data.d";
import { ModelType } from "@/declare/dva";
import ZkClient from "@/utils/zk-client";

let zkClient = new ZkClient();

export interface StateType {
  // treeData: [];
  nodeData: string;
  nodeStat: [];
  nodeACl: [];
}

const model: ModelType<StateType> = {
  namespace: "home",
  state: { nodeData: "", nodeACl: [], nodeStat: [] },

  effects: {
    *fetchConnect({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.connect], "localhost:2181");
      callback && callback(data);
    },
    *fetchGetChildren({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.getChildren], payload.path);
      callback && callback(data);
    },
    *fetchGetData({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.getData], payload.path);
      console.log(data);
      yield put({
        type: "getData",
        payload: data
      });
    },
    *fetchGetACL({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.getACL], payload.path);
      yield put({
        type: "getACL",
        payload: data
      });
    }
  },
  // @ts-ignore
  reducers: {
    getData(state, { payload }) {
      console.log(payload[1]);
      return { ...state, nodeData: payload[0], nodeStat: payload[1] };
    },
    getACL(state, { payload }) {
      return { ...state, nodeACl: payload };
    }
  }
};

export default model;
