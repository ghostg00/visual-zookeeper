import { Client, Event, Exception, Stat } from "node-zookeeper-client";
import moment, { MomentInput } from "moment";
import logEvent from "./LogEvent";
import { TreeNodeNormal } from "antd/es/tree/Tree";
import { message } from "antd";

const { Buffer } = window.require("buffer");
const nodeZookeeperClient = window.require("node-zookeeper-client");

class ZkClient {
  client: Client | any;
  url: string | any;

  async connect(url: string) {
    if (this.client) return;
    console.log(url);
    this.url = url;
    const promise = new Promise<Client>((resolve) => {
      let client = nodeZookeeperClient.createClient(url) as Client;
      let connected = false;
      client.once("connected", () => {
        connected = true;
        resolve(client);
      });
      client.on("state", (state) => {
        logEvent.emit("log", state);
      });
      client.connect();
      setTimeout(() => {
        if (!connected) message.error("连接超时！请检查url及服务是否正常");
      }, 3000);
    });
    this.client = await promise;
    return true;
  }

  async close() {
    return new Promise((resolve) => {
      if (!this.client) return;
      (this.client as Client).close();
      this.client = null;
      resolve();
    });
  }

  async getChildren(path: string, watcher: (event: Event) => void) {
    return new Promise((resolve) => {
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

  async getChildrenTree(rootNode: string, watcher: (event: Event) => void) {
    if (!watcher) {
      await this.close();
      await this.connect(this.url);
    }
    return new Promise((resolve) => {
      if (!this.client) return [];
      this.client.listSubTreeBFS(
        rootNode.startsWith("/") ? rootNode : "/" + rootNode,
        (error: any, children: string[]) => {
          if (!children) {
            return [];
          }
          children.shift();
          let trees: TreeNodeNormal[] = [];
          let list: (TreeNodeNormal & { parentKey: string })[] = children.map(
            (item) => {
              let strings = item.split("/");
              return {
                key: item,
                title: strings[strings.length - 1],
                parentKey: item.substring(0, item.lastIndexOf("/")),
                children: [],
              };
            }
          );
          for (const node1 of list) {
            let root = true;
            for (const node2 of list) {
              if (node1.parentKey === node2.key) {
                root = false;
                (node2.children as TreeNodeNormal[]).push(node1);
              }
            }
            root && trees.push(node1);
          }
          resolve(trees);
          if (watcher) {
            for (const child of children) {
              this.client.getChildren(
                child,
                watcher,
                (error: Error | Exception, children: string[], stat: Stat) => {}
              );
            }
          }
        }
      );
    });
  }

  async remove(path: string[]) {
    const removePath = [...path];
    return new Promise((resolve) => {
      const deleteRecursive = () => {
        let value = removePath.shift();
        if (value) {
          this.client.removeRecursive(value, () => {
            deleteRecursive();
          });
        } else {
          resolve(removePath);
        }
      };
      deleteRecursive();
    });
  }

  async create(path: string, data: string, mode: number = 0) {
    return new Promise((resolve) => {
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
    return new Promise((resolve) => {
      (this.client as Client).getData(path, watcher, (error, data, stat) => {
        const statData = extracted(stat);
        resolve([data && data.toLocaleString(), statData]);
      });
    });
  }

  async setData(path: string, data: string) {
    return new Promise((resolve) => {
      let buffer = Buffer.from(data);
      (this.client as Client).setData(path, buffer, -1, () => {
        resolve();
      });
    });
  }

  async getACL(path: string) {
    return new Promise((resolve) => {
      (this.client as Client).getACL(path, (error, acls) => {
        let acl = acls[0] as any;
        let zkACL = new ZkACL(acl.id.scheme, acl.id.id, acl.permission);
        resolve(zkACL);
      });
    });
  }
}

const hexString = (longBuffer: any) => (longBuffer as Buffer).toString("hex");

const int64 = (longBuffer: any) => parseInt(hexString(longBuffer), 16);

const format = (inp: MomentInput) => moment(inp).format("YYYY-MM-DD HH:mm:ss");
const extracted = (stat: Stat) => {
  return [
    {
      name: "cZxid",
      description: "这个值是当前会话事物创建产生ID",
      value: int64(stat.czxid),
      realValue: `0x${hexString(stat.czxid).replace(/0+/, "")}`,
    },
    {
      name: "ctime",
      description: "创建时间",
      value: format(int64(stat.ctime)),
      realValue: `${new Date(int64(stat.ctime)).toString()}(${int64(
        stat.ctime
      )})`,
    },
    {
      name: "mZxid",
      description: "最近更新节点的事物ID",
      value: int64(stat.mzxid),
      realValue: `0x${hexString(stat.mzxid).replace(/0+/, "")}`,
    },
    {
      name: "mtime",
      description: "最近修改时间",
      value: format(int64(stat.mtime)),
      realValue: `${new Date(int64(stat.mtime)).toString()}(${int64(
        stat.mtime
      )})`,
    },
    {
      name: "pZxid",
      description: "该节点的子节点最后修改的事物ID",
      value: int64(stat.pzxid),
      realValue: `0x${hexString(stat.pzxid).replace(/0+/, "")}`,
    },
    {
      name: "cversion",
      description: "子节点的版本号",
      value: stat.cversion,
      realValue: stat.cversion,
    },
    {
      name: "dataVersion",
      description: "数据的版本号",
      value: stat.version,
      realValue: stat.version,
    },
    {
      name: "aclVersion",
      description: "acl的版本号",
      value: stat.aversion,
      realValue: stat.aversion,
    },
    {
      name: "ephemeralOwner",
      description: "创建此临时节点的会话ID",
      value: int64(stat.ephemeralOwner),
      realValue: `0x${
        int64(stat.ephemeralOwner) != 0
          ? hexString(stat.ephemeralOwner).replace(/0+/, "")
          : 0
      }`,
    },
    {
      name: "dataLength",
      description: "数据长度",
      value: stat.dataLength,
      realValue: stat.dataLength,
    },
    {
      name: "numChildren",
      description: "子节点的个数",
      value: stat.numChildren,
      realValue: stat.numChildren,
    },
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
