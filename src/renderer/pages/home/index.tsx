import React, { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { connect } from "dva";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Icon,
  Input,
  message,
  Modal,
  Row,
  Switch,
  Table,
  Tabs,
  Tooltip,
  Tree
} from "antd";
import { Dispatch } from "redux";
import { StateType } from "@/pages/home/model";
import { AntTreeNode, TreeProps } from "antd/es/tree";
import { TreeNodeNormal } from "antd/es/tree/Tree";
import SplitPane from "react-split-pane";
import { ZkACL } from "@/utils/ZkClient";
import logEvent from "../../utils/LogEvent";
import { Event } from "node-zookeeper-client";

import style from "./style.less";
import { FormComponentProps } from "antd/es/form";
import { ModalProps } from "antd/es/modal";

const moment = require("moment");

const { TreeNode } = Tree;
const { TextArea } = Input;
const { TabPane } = Tabs;
const ButtonGroup = Button.Group;

const IconFont = Icon.createFromIconfontCN({
  scriptUrl: "http://at.alicdn.com/t/font_1396433_j73yygrrl3r.js"
});

interface HomeProps {
  home: StateType;
  dispatch: Dispatch;
}

interface CreateNodeFormProps extends FormComponentProps {
  visible: boolean;
  parentNode: string;
  onCancel: ModalProps["onCancel"];
  onCreate: ModalProps["onOk"];
}

const CreateNodeForm = Form.create<CreateNodeFormProps>({ name: "from" })(
  class extends React.Component<CreateNodeFormProps> {
    render() {
      const { visible, parentNode, onCancel, onCreate, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal
          title={"添加节点"}
          visible={visible}
          onCancel={onCancel}
          onOk={onCreate}
        >
          <Form>
            <Form.Item label="父节点">{parentNode}</Form.Item>
            <Form.Item label="节点名">
              {getFieldDecorator("nodeName", {
                rules: [{ required: true, message: "请输入节点名称" }]
              })(<Input placeholder={"请输入节点名称"} />)}
            </Form.Item>
            <Form.Item label="节点值">
              {getFieldDecorator("nodeData")(
                <TextArea placeholder={"请输入节点值"} />
              )}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  }
);

let logArr: string[] = [];

function Home(props: HomeProps) {
  const { dispatch } = props;

  const [url, setUrl] = useState(
    localStorage.getItem("connectionString") || "127.0.0.1:2181"
  );
  const [treeData, setTreeData] = useState<TreeNodeNormal[]>([]);
  const [loadedKeys, setLoadedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(false);

  const [nodePath, setNodePath] = useState("");
  const [nodeName, setNodeName] = useState("");
  const [nodeData, setNodeData] = useState("");
  const [nodeStat, setNodeStat] = useState([]);
  const [nodeACL, setNodeACL] = useState<ZkACL>(new ZkACL("", "", ""));
  const [createNodeVisible, setCreateNodeVisible] = useState(false);
  const [formRef, setFormRef] = useState<any>();
  const [log, setLog] = useState("");
  const logDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEvent.on("log", (args: any) => {
      logArr.length >= 50 && logArr.shift();
      logArr.push(
        `${moment().format("YYYY-MM-DD HH:mm:ss SSS")}:   ${args.toString()}`
      );
      setLog(logArr.join("\n"));
      if (logDiv.current != null) {
        logDiv.current.scrollTop = logDiv.current.scrollHeight;
      }
    });
  }, []);

  const connect = () => {
    dispatch({
      type: "home/connect",
      payload: { connectionString: url },
      callback() {
        refreshRootTreeNode();
        setNodePath("/");
        localStorage.setItem("connectionString", url);
        message.success("连接成功");
      }
    });
  };

  const refreshRootTreeNode = () => {
    let event: any = (event: Event) => {
      logEvent.emit("log", event);
      refreshRootTreeNode();
    };
    dispatch({
      type: "home/getChildren",
      payload: { path: "/" },
      callback(data: string[]) {
        setTreeData(
          data.map(item => {
            return { title: item, key: `/${item}` };
          })
        );
      },
      event
    });
  };

  const close = () => {
    dispatch({
      type: "home/close",
      callback() {
        setExpandedKeys([]);
        setLoadedKeys([]);
        setTreeData([]);
        setNodePath("");
        setNodeName("");
        setNodeData("");
        setNodeACL(new ZkACL("", "", ""));
        message.success("断开连接成功");
      }
    });
  };

  const onLoadData: TreeProps["loadData"] = node => {
    return new Promise(resolve => {
      let path = node.props.eventKey;
      if (node.props.children) {
        resolve();
        return;
      }
      refreshTreeNode(path, node, true, resolve);
    });
  };

  const refreshTreeNode = (
    path: string | undefined,
    node: AntTreeNode,
    watcher: any = false,
    resolve: any
  ) => {
    let event: any = null;
    if (watcher) {
      event = (event: Event) => {
        logEvent.emit("log", event);
        if (event.getType() == 4) {
          refreshTreeNode(path, node, true, resolve);
        }
      };
    }
    dispatch({
      type: "home/getChildren",
      payload: { path },
      callback(data: string[]) {
        if (data) {
          node.props.dataRef.children = data.map(item => {
            return {
              title: item,
              key: `${path}/${item}`
            };
          });
        }
        setTreeData([...treeData]);
        resolve();
      },
      event
    });
  };

  const renderTreeNodes = (data: TreeNodeNormal[]) =>
    data.map(item => {
      const oldTitle = item.title as string;
      const index = oldTitle.indexOf(searchValue);
      const beforeStr = oldTitle.substr(0, index);
      const afterStr = oldTitle.substr(index + searchValue.length);
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span style={{ color: "#f50", backgroundColor: "#3390FF" }}>
              {searchValue}
            </span>
            {afterStr}
          </span>
        ) : (
          <span>{item.title}</span>
        );
      if (item.children) {
        return (
          <TreeNode
            title={title}
            key={item.key}
            dataRef={item}
            icon={<IconFont type="icon-wenjian-" style={{ fontSize: 20 }} />}
          >
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return (
        <TreeNode
          key={item.key}
          title={title}
          dataRef={item}
          icon={<IconFont type="icon-wenjian-" style={{ fontSize: 20 }} />}
        />
      );
    });

  const getParentKey = (key: string, tree: TreeNodeNormal[]) => {
    let parentKey: string = "";
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];
      if (node.children) {
        if (node.children.some(item => item.key === key)) {
          parentKey = node.key;
        } else if (getParentKey(key, node.children)) {
          parentKey = getParentKey(key, node.children);
        }
      }
    }
    return parentKey;
  };

  const onSelectChange: ChangeEventHandler<HTMLInputElement> = e => {
    const value = e.target.value;
    const dataList: { key: string; title: string }[] = [];
    const generateList = (data: TreeNodeNormal[]) => {
      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const { key } = node;
        dataList.push({ key, title: key });
        if (node.children) {
          generateList(node.children);
        }
      }
    };
    generateList(treeData);
    const expandedKeys = dataList
      .map(item => {
        if (item.title.indexOf(value) > -1) {
          return getParentKey(item.key, treeData);
        }
        return null;
      })
      .filter((item, i, self) => item && self.indexOf(item) === i);
    setSearchValue(value);
    setExpandedKeys(expandedKeys as string[]);
    setAutoExpandParent(true);
  };

  const onExpand = (expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  const onSelectTree: TreeProps["onSelect"] = (selectedKeys, e) => {
    setSelectedKeys(selectedKeys);
    if (selectedKeys.length === 0) {
      setNodeName("");
      setNodePath("/");
      setNodeData("");
      setNodeStat([]);
      setNodeACL(new ZkACL("", "", ""));
    } else {
      setNodeName(e.node.props.title as string);
      const path = e.node.props.eventKey as string;
      setNodePath(path);
      dispatch({
        type: "home/getData",
        payload: { path },
        callback(data: [string, []]) {
          setNodeData(data[0]);
          setNodeStat(data[1]);
        }
      });
      dispatch({
        type: "home/getACL",
        payload: { path },
        callback(nodeACL: ZkACL) {
          setNodeACL(nodeACL);
        }
      });
    }
  };

  const onSetData = () => {
    dispatch({
      type: "home/setData",
      payload: { path: nodePath, data: nodeData },
      callback() {
        message.success(`${nodePath}节点值更新成功`);
      }
    });
  };

  const onCreate = () => {
    const { form } = formRef.props;
    form.validateFields((err: any, values: any) => {
      if (err) return;
      let path = `${nodePath}${nodePath === "/" ? "" : "/"}${values.nodeName}`;
      dispatch({
        type: "home/create",
        payload: {
          path,
          nodeData: values.nodeData
        },
        callback() {
          message.success(`${path}节点新增成功`);
        }
      });
      form.resetFields();
      setCreateNodeVisible(false);
    });
  };

  const onRemove = () => {
    if (nodePath) {
      Modal.confirm({
        title: "警告",
        content: "您确定要删除此节点以及子节点吗？",
        onOk: () => {
          return new Promise(resolve => {
            dispatch({
              type: "home/remove",
              payload: { path: nodePath },
              callback() {
                message.success(`${nodePath}节点值删除成功`);
                resolve();
              }
            });
          });
        }
      });
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "值",
      dataIndex: "value",
      key: "value"
    },
    {
      title: "真实值",
      dataIndex: "realValue",
      key: "realValue"
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description"
    }
  ];

  const leftDiv = (
    <div>
      <Card
        style={{
          overflow: "auto",
          height: "98.5vh",
          margin: 5,
          backgroundColor: "#F5F5F5"
        }}
        hoverable
      >
        <Row>
          <Col span={15}>
            <Input
              addonBefore="url"
              placeholder="请输入zookeeper url"
              value={url}
              defaultValue={
                localStorage.getItem("connectionString") || "127.0.0.1:2181"
              }
              onChange={event => setUrl(event.target.value)}
            />
          </Col>
          <Col span={9}>
            <Button onClick={connect}>连接</Button>
            <Button onClick={close}>断开</Button>
          </Col>
        </Row>
        <Divider>zookeeper节点</Divider>
        <Row>
          <Col span={16}>
            <Input
              placeholder="请输入节点查询(已加载节点)"
              suffix={<IconFont type={"icon-icon-1"} />}
              onChange={onSelectChange}
              allowClear
            />
          </Col>
          <Col span={7} push={1}>
            <ButtonGroup>
              <Tooltip title="新增节点">
                <Button
                  onClick={() => {
                    if (!nodePath) {
                      message.warn("请选择节点");
                    } else {
                      setCreateNodeVisible(true);
                    }
                  }}
                >
                  <IconFont type={"icon-draw"} style={{ fontSize: 20 }} />
                </Button>
              </Tooltip>
              <Tooltip title="删除节点">
                <Button onClick={onRemove}>
                  <IconFont type={"icon-icon-"} style={{ fontSize: 20 }} />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Col>
        </Row>
        <Tree
          showIcon
          selectedKeys={selectedKeys}
          loadData={onLoadData}
          loadedKeys={loadedKeys}
          onLoad={keys => setLoadedKeys(keys)}
          onSelect={onSelectTree}
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
        >
          {renderTreeNodes(treeData)}
        </Tree>
      </Card>
    </div>
  );

  return (
    <>
      <SplitPane
        split={"vertical"}
        minSize={450}
        defaultSize={parseInt(localStorage.getItem("splitPos") as string)}
        onChange={size => localStorage.setItem("splitPos", size.toString())}
      >
        {leftDiv}
        <div>
          <Card
            style={{ height: "58vh", margin: 5, backgroundColor: "#F5F5F5" }}
            hoverable
          >
            <div className="card-container">
              <Tabs type="card">
                <TabPane
                  tab={
                    <span>
                      <IconFont type={"icon-bookmark"} />
                      节点名
                    </span>
                  }
                  key="1"
                >
                  <Card className={style.tabsCard} bordered={false}>
                    {nodeName}
                  </Card>
                  <Divider style={{ margin: 0 }} />
                  <Row align={"middle"} justify={"center"}>
                    <Col>
                      <div
                        style={{
                          margin: 5,
                          height: "4vh"
                        }}
                      >
                        URL解码：
                        <Switch
                          onChange={(checked: boolean) => {
                            if (checked) {
                              setNodeName(decodeURIComponent(nodeName));
                            } else {
                              setNodeName(encodeURIComponent(nodeName));
                            }
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <IconFont type={"icon-notebook1"} />
                      节点数据
                    </span>
                  }
                  key="2"
                >
                  <Card className={style.tabsCard} bordered={false}>
                    <TextArea
                      rows={4}
                      value={nodeData}
                      autosize={{ minRows: 8, maxRows: 16 }}
                      onChange={event => setNodeData(event.target.value)}
                    />
                  </Card>
                  <Divider style={{ margin: 0 }} />
                  <Row align={"middle"} justify={"center"}>
                    <Col>
                      <div style={{ margin: 5, height: "4vh" }}>
                        <Button type="primary" onClick={onSetData}>
                          <IconFont type={"icon-paper-plane"} />
                          保存
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <IconFont type={"icon-checklist"} />
                      节点属性
                    </span>
                  }
                  key="3"
                >
                  <Table
                    columns={columns}
                    dataSource={nodeStat}
                    rowKey={"name"}
                    size={"small"}
                    pagination={false}
                    scroll={{ y: "42.5vh" }}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <IconFont type={"icon-lock"} />
                      节点权限
                    </span>
                  }
                  key="4"
                >
                  <Card className={style.tabsCard} bordered={false}>
                    <Descriptions
                      bordered
                      size={"small"}
                      layout={"horizontal"}
                      column={1}
                    >
                      <Descriptions.Item label="Schema(权限模式)">
                        {nodeACL.scheme}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID(授权对象)">
                        {nodeACL.id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Permission(权限)">
                        {nodeACL.permissions}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </TabPane>
              </Tabs>
            </div>
          </Card>
          <Card
            style={{
              height: "40vh",
              margin: 5,
              backgroundColor: "#F5F5F5"
            }}
            hoverable
          >
            <Row>
              <Col span={23}>
                <div
                  ref={logDiv}
                  style={{
                    whiteSpace: "pre-wrap",
                    overflow: "auto",
                    height: "34vh",
                    backgroundColor: "#FFF"
                  }}
                >
                  {log}
                </div>
              </Col>
              <Col span={1}>
                <div style={{ height: "34vh" }}>
                  <Tooltip title={"清空日志"}>
                    <Button
                      type="link"
                      onClick={() => {
                        logArr = [];
                        setLog("");
                      }}
                    >
                      <IconFont type={"icon-shuazi"} style={{ fontSize: 20 }} />
                    </Button>
                  </Tooltip>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </SplitPane>
      <CreateNodeForm
        wrappedComponentRef={(ref: any) => setFormRef(ref)}
        visible={createNodeVisible}
        parentNode={nodePath}
        onCancel={() => setCreateNodeVisible(false)}
        onCreate={onCreate}
      />
    </>
  );
}

const mapStateToProps = ({ home }: { home: StateType }) => ({
  home
});

export default connect(mapStateToProps)(Home);
