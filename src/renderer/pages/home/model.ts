import { Equipment } from '@/pages/home/data.d';
import { ModelType } from '@/declare/dva';
import Db from '@/utils/db';

let db = new Db<Equipment>('equipment');

export interface StateType {
  list?: Equipment[];
  scriptState?: Map<string, string>;
  formValue?: Equipment;
  _id?: string;
}

const model: ModelType<StateType> = {
  namespace: 'home',
  state: {
    list: [],
    scriptState: new Map<string, string>(),
    formValue: { host: '', name: '', systemVersion: '', remark: '' },
  },

  effects: {
    *fetchList({ payload, callback }, { call, put }) {
      const data = yield call([db, db.find], payload.query, payload.sort);
      callback && callback(data);
    },
    *fetchOne({ payload }, { call, put }) {
      const data = yield call([db, db.findOne], payload);
      yield put({
        type: 'formValue',
        payload: data,
      });
    },
  },

  reducers: {
    scriptState(state, { payload }) {
      return { ...state, scriptState: payload };
    },
    formValue(state, { payload }) {
      return { ...state, formValue: { ...payload, _id: undefined }, _id: payload._id };
    },
  },
};

export default model;
