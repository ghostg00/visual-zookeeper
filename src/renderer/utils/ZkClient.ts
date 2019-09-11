import { Client, Event, Stat } from "node-zookeeper-client";
import { MomentInput } from "moment";
import logEvent from "./LogEvent";

const moment = require("moment");
const { Buffer } = window.require("buffer");
const nodeZookeeperClient = window.require("node-zookeeper-client");

class ZkClient {
  client?: any;

  async connect(connectionString: string) {
    if (this.client) return;
    const promise = new Promise<Client>(resolve => {
      let client = nodeZookeeperClient.createClient(connectionString) as Client;
      client.once("connected", () => {
        resolve(client);
      });
      client.on("state", state => {
        logEvent.emit("log", state);
      });
      client.connect();
    });
    this.client = await promise;
    return true;
  }

  async close() {
    return new Promise(resolve => {
      (this.client as Client).close();
      this.client = null;
      resolve();
    });
  }

  async getChildren(path: string, watcher: (event: Event) => void) {
    return new Promise(resolve => {
      if (watcher) {
        this.client.getChildren(path, watcher, (error: any, children: any) => {
          resolve(children);
        });
      } else {
        this.client.getChildren(path, (error: any, children: any) => {
          resolve(children);
        });
      }
    });
  }

  async remove(path: string) {
    return new Promise(resolve => {
      this.client.remove(path, (e: any) => {
        resolve();
      });
    });
  }

  async create(path: string, data: string, mode: number = 0) {
    return new Promise(resolve => {
      let client = this.client as Client;
      if (data) {
        let buffer = Buffer.from(data);
        client.create(path, buffer, mode, () => resolve());
      } else {
        client.create(path, mode, () => resolve());
      }
    });
  }

  async getData(path: string, watcher: (event: Event) => void) {
    return new Promise(resolve => {
      (this.client as Client).getData(path, watcher, (error, data, stat) => {
        const statData = extracted(stat);
        resolve([data && data.toLocaleString(), statData]);
      });
    });
  }

  async setData(path: string, data: string) {
    return new Promise(resolve => {
      let buffer = Buffer.from(data);
      (this.client as Client).setData(path, buffer, -1, () => {
        resolve();
      });
    });
  }

  async getACL(path: string) {
    return new Promise(resolve => {
      (this.client as Client).getACL(path, (error, acls) => {
        let acl = acls[0] as any;
        let zkACL = new ZkACL(acl.id.scheme, acl.id.id, acl.permission);
        resolve(zkACL);
      });
    });
  }
}

const hexString = (longBuffer: any) => {
  return (longBuffer as Buffer).toString("hex");
};

const int64 = (longBuffer: any) => {
  const hexString = (longBuffer as Buffer).toString("hex");
  return parseInt(hexString, 16);
};

const format = (inp: MomentInput) => {
  return moment(inp).format("YYYY-MM-DD HH:mm:ss");
};

const extracted = (stat: Stat) => {
  return [
    {
      name: "cZxid",
      description: "这个值是当前会话事物创建产生ID",
      value: int64(stat.czxid),
      realValue: `0x${hexString(stat.czxid).replace(/0+/, "")}`
    },
    {
      name: "ctime",
      description: "创建时间",
      value: format(int64(stat.ctime)),
      realValue: `${new Date(int64(stat.ctime)).toString()}(${int64(
        stat.ctime
      )})`
    },
    {
      name: "mZxid",
      description: "最近更新节点的事物ID",
      value: int64(stat.mzxid),
      realValue: `0x${hexString(stat.mzxid).replace(/0+/, "")}`
    },
    {
      name: "mtime",
      description: "最近修改时间",
      value: format(int64(stat.mtime)),
      realValue: `${new Date(int64(stat.mtime)).toString()}(${int64(
        stat.mtime
      )})`
    },
    {
      name: "pZxid",
      description: "该节点的子节点最后修改的事物ID",
      value: int64(stat.pzxid),
      realValue: `0x${hexString(stat.pzxid).replace(/0+/, "")}`
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
      value: int64(stat.ephemeralOwner),
      realValue: `0x${
        int64(stat.ephemeralOwner) != 0
          ? hexString(stat.ephemeralOwner).replace(/0+/, "")
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
};

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
