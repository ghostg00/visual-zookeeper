import Nedb from "nedb";

export interface BaseDoc {
  _id?: string;
}

class Db<T extends BaseDoc> {
  nedb: Nedb;

  constructor(filename?: string) {
    this.nedb = new Nedb({ filename: filename || "db.json", autoload: true });
  }

  insert(docs: T[]) {
    return new Promise((resolve, reject) => {
      this.nedb.insert(docs, (err, document) => {
        resolve(document);
      });
    });
  }

  update(doc: T) {
    return new Promise((resolve, reject) => {
      this.nedb.update({ _id: doc._id }, doc, {}, (err, document) => {
        resolve(document);
      });
    });
  }

  remove(ids: string[]) {
    return new Promise((resolve, reject) => {
      this.nedb.remove({ _id: { $in: ids } }, { multi: true }, (err, n) => {
        resolve(n);
      });
    });
  }

  find(query = {}, sort = {}) {
    return new Promise<T[]>((resolve, reject) => {
      this.nedb
        .find<T>(query)
        .sort(sort)
        .exec((err, documents: T[]) => {
          resolve(documents);
        });
    });
  }

  findOne(id: string) {
    return new Promise<T>((resolve, reject) => {
      this.nedb.findOne({ _id: id }, (err, document: T) => {
        resolve(document);
      });
    });
  }
}

export default Db;
