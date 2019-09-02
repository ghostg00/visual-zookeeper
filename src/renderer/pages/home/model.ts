import { ZKServer } from "@/pages/home/data.d";
import { ModelType } from "@/declare/dva";
import Db from "@/utils/db";

let db = new Db<ZKServer>("zookeeper");

export interface StateType {}

const model: ModelType<StateType> = {
  namespace: "home",
  state: {},

  effects: {
    // *fetchList({ payload, callback }, { call, put }) {
    //   const data = yield call([db, db.find], payload.query, payload.sort);
    //   callback && callback(data);
    // },
    // *fetchOne({ payload }, { call, put }) {
    //   const data = yield call([db, db.findOne], payload);
    //   yield put({
    //     type: "formValue",
    //     payload: data
    //   });
    // }
  },

  reducers: {
    // formValue(state, { payload }) {
    //   return {
    //     ...state,
    //     formValue: { ...payload, _id: undefined },
    //     _id: payload._id
    //   };
    // }
  }
};

export default model;
