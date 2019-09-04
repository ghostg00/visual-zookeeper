import { Client } from "node-zookeeper-client";
import { MomentInput } from "moment";
// import { Buffer } from "buffer";
// import {  } from "zookeeper";

const Buffer = window.require("buffer");
// const ZooKeeper = window.require("zookeeper");
console.log(Buffer)
const moment = require("moment");

let nodeZookeeperClient = window.require("node-zookeeper-client");

class ZkClient {
  client?: Client;

  async connect(connectionString: string) {
    // let client = new ZooKeeper({
    //   connect: connectionString
    // });
    // console.log(client);
    // client.connect({}, (e, client) => {
    //   client.get_children("/").then(a => {
    //     console.log(a);
    //   });
    // });
    const promise = new Promise<Client>((resolve, reject) => {
      let client = nodeZookeeperClient.createClient(connectionString) as Client;
      client.once("connected", () => {
        resolve(client);
      });
      client.connect();
    });
    this.client = await promise;
  }

  async getChildren(path: string) {
    return new Promise((resolve, reject) => {
      (this.client as Client).getChildren(path, (error, children, stat) => {
        resolve(children);
      });
    });
  }

  async remove(path: string) {
    return new Promise((resolve, reject) => {
      (this.client as Client).remove(path, error => {
        resolve();
      });
    });
  }

  async getData(path: string) {
    return new Promise((resolve, reject) => {
      (this.client as Client).getData(path, (error, data, stat) => {
        console.log(data);
        const statData = [
          {
            name: "cZxid",
            description: "这个值是当前会话事物创建产生ID",
            value: this.int64(stat.czxid),
            realValue: `0x${this.hexString(stat.czxid).replace(/0+/, "")}`
          },
          {
            name: "ctime",
            description: "创建时间",
            value: this.format(this.int64(stat.ctime)),
            realValue: `${new Date(
              this.int64(stat.ctime)
            ).toString()}(${this.int64(stat.ctime)})`
          },
          {
            name: "mZxid",
            description: "最近更新节点的事物ID",
            value: this.int64(stat.mzxid),
            realValue: `0x${this.hexString(stat.mzxid).replace(/0+/, "")}`
          },
          {
            name: "mtime",
            description: "最近修改时间",
            value: this.format(this.int64(stat.mtime)),
            realValue: `${new Date(
              this.int64(stat.mtime)
            ).toString()}(${this.int64(stat.mtime)})`
          },
          {
            name: "pZxid",
            description: "该节点的子节点最后修改的事物ID",
            value: this.int64(stat.pzxid),
            realValue: `0x${this.hexString(stat.pzxid).replace(/0+/, "")}`
          },
          {
            name: "cversion",
            description: "子节点的版本号",
            value: stat.cversion,
            realValue: stat.cversion
          },
          {
            name: "dataVersion",
            description: "数据的版本号",
            value: stat.version,
            realValue: stat.version
          },
          {
            name: "aclVersion",
            description: "acl的版本号",
            value: stat.aversion,
            realValue: stat.aversion
          },
          {
            name: "ephemeralOwner",
            description: "创建此临时节点的会话ID",
            value: this.int64(stat.ephemeralOwner),
            realValue: `0x${
              this.int64(stat.ephemeralOwner) != 0
                ? this.hexString(stat.ephemeralOwner).replace(/0+/, "")
                : 0
            }`
          },
          {
            name: "dataLength",
            description: "数据长度",
            value: stat.dataLength,
            realValue: stat.dataLength
          },
          {
            name: "numChildren",
            description: "子节点的个数",
            value: stat.numChildren,
            realValue: stat.numChildren
          }
        ];
        resolve([data && data.toLocaleString(), statData]);
      });
    });
  }

  async setData(path: string, data: string) {
    return new Promise((resolve, reject) => {
      // let buffer = Buffer.from(Buffer.from(data) as Uint8Array);
      let buffer2 = new Buffer(data);
      console.log(buffer2);
      let buffer = Buffer.from(data);
      // console.log(path);
      let buffer1 = Buffer.alloc(buffer.length, buffer);
      console.log(buffer1);
      console.log(Buffer.isBuffer(buffer));
      console.log(buffer);
      // if (buffer == null ) {
      //   console.log(true);
      // }
      // assert(
      //   buffer === null || buffer === undefined|| Buffer.isBuffer(buffer),
      //   "data must be a valid buffer, null or undefined.1111"
      // );
      (this.client as Client).setData(path, buffer, -1, (error, stat) => {
        resolve();
      });
    });
  }

  hexString(longBuffer: any) {
    return (longBuffer as Buffer).toString("hex");
  }

  int64(longBuffer: any) {
    const hexString = (longBuffer as Buffer).toString("hex");
    return parseInt(hexString, 16);
  }

  format(inp: MomentInput) {
    return moment(inp).format("YYYY-MM-DD HH:mm:ss");
  }

  async getACL(path: string) {
    return new Promise((resolve, reject) => {
      (this.client as Client).getACL(path, (error, acls, stat) => {
        let acl = acls[0] as any;
        let zkACL = new ZkACL(acl.id.scheme, acl.id.id, acl.permission);
        resolve(zkACL);
      });
    });
  }
}

export class ZkACL {
  scheme: string;
  id: string;
  permissions: string;

  constructor(scheme: string, id: string, permissions: string) {
    this.scheme = scheme;
    this.id = id;
    this.permissions = permissions;
  }
}

export default ZkClient;
