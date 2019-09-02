import { Client } from "node-zookeeper-client";

let nodeZookeeperClient = window.require("node-zookeeper-client");

class ZkClient {
  client?: Client;

  async connect(connectionString: string) {
    const promise = new Promise<Client>((resolve, reject) => {
      let client = nodeZookeeperClient.createClient(connectionString) as Client;
      client.once("connected", () => {
        resolve(client);
      });
      client.connect();
    });
    this.client = await promise;
  }

  async getChildren(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      (this.client as Client).getChildren(path, (error, children, stat) => {
        console.log(children);
        resolve(children);
      });
    });
  }
}

export default ZkClient;
