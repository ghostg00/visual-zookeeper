import { ZKServer } from "@/pages/home/data.d";
import { ModelType } from "@/declare/dva";
import ZkClient from "@/utils/zk-client";

let zkClient = new ZkClient();

export interface StateType {
  children: string[];
}

const model: ModelType<StateType> = {
  namespace: "home",
  state: { children: [] },

  effects: {
    *fetchConnect({ payload, callback }, { call, put }) {
      const data = yield call([zkClient, zkClient.connect], "localhost:2181");
      callback && callback(data);
    },
    *fetchGetChildren({ payload }, { call, put }) {
      const data = yield call([zkClient, zkClient.getChildren], "/dubbo");
      yield put({
        type: "getChildren",
        payload: data
      });
    }
  },

  reducers: {
    getChildren(state, { payload }) {
      return {
        ...state,
        children: [...payload]
      };
    }
  }
};

export default model;
