import React, { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { connect } from "dva";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Icon,
  Input,
  message,
  Modal,
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
import { ColumnProps } from "antd/lib/table";
import { Row } from "antd/lib/grid";
import CreateNodeForm, {
  CreateNodeFormProps
} from "@/pages/home/components/CreateNodeForm";

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

let logArr: string[] = [];

function Home(props: HomeProps) {
  const { dispatch } = props;

  const [url, setUrl] = useState(
    localStorage.getItem("connectionString") || "127.0.0.1:2181"
  );
  // const [treeData, setTreeData] = useState<TreeNodeNormal[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeNormal[]>([]);
  const [loadedKeys, setLoadedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(false);

  const [rootNode, setRootNode] = useState("/");
  const [nodePath, setNodePath] = useState("");
  const [nodeName, setNodeName] = useState("");
  const [nodeData, setNodeData] = useState("");
  const [nodeStat, setNodeStat] = useState([]);
  const [nodeACL, setNodeACL] = useState<ZkACL>(new ZkACL("", "", ""));
  const [createNodeVisible, setCreateNodeVisible] = useState(false);
  const [formRef, setFormRef] = useState();
  const [log, setLog] = useState("");
  const [decodeURI, setDecodeURI] = useState(false);
  const [isAuto, setIsAuto] = useState(localStorage.getItem("isAuto") === "1");
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
  const event: any = (event: Event) => {
    logEvent.emit("log", event);
    refreshRootTreeNode();
  };

  const refreshRootTreeNode = () => {
    dispatch({
      type: "home/getChildrenTree",
      payload: { rootNode },
      callback(data: TreeNodeNormal[]) {
        setTreeData(data);
      },
      event: isAuto ? event : undefined
    });
  };

  const close = async () => {
    return new Promise(resolve => {
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
          resolve();
        }
      });
    });
  };

  const renderTreeNodes = (data: TreeNodeNormal[]) =>
    data.map(item => {
      const oldTitle = item.title as string;
      const index = oldTitle.indexOf(searchValue);
      const beforeStr = oldTitle.substr(0, index);
      const afterStr = oldTitle.substr(index + searchValue.length);
      let title = item.title;
      if (index > -1) {
        title = (
          <span>
            {beforeStr}
            <span style={{ color: "#f50", backgroundColor: "#3390FF" }}>
              {searchValue}
            </span>
            {afterStr}
          </span>
        );
      }
      if (item.children && item.children.length > 0) {
        return (
          <TreeNode
            key={item.key}
            title={title}
            dataRef={item}
            icon={<IconFont type="icon-folder" style={{ fontSize: 20 }} />}
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
      setNodeName((e.node.props.title as any).props.children[2]);
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
    const { form } = formRef.props as CreateNodeFormProps;
    form.validateFields((err: any, values: any) => {
      if (err) return;
      let path = `${nodePath}${nodePath === "/" ? "" : "/"}${
        values.zkNodeName
      }`;
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

  const columns: ColumnProps<{}>[] = [
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
          <Col span={9}>
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
          <Col span={4}>
            <Input
              placeholder="根节点"
              onChange={e => {
                setRootNode(e.target.value);
              }}
            />
          </Col>
          <Col span={11}>
            <Button
              type={"primary"}
              onClick={connect}
              style={{ marginRight: 5, marginLeft: 5 }}
            >
              连接
            </Button>
            <Button type={"primary"} onClick={close} style={{ marginRight: 5 }}>
              断开
            </Button>
            <Button
              type={"primary"}
              onClick={refreshRootTreeNode}
              style={{ marginRight: 5 }}
            >
              刷新
            </Button>
            <Tooltip title="是否自动刷新数据">
              <Switch
                checked={isAuto}
                checkedChildren={<Icon type="check" />}
                unCheckedChildren={<Icon type="close" />}
                onChange={checked => {
                  setIsAuto(checked);
                  localStorage.setItem("isAuto", checked ? "1" : "0");
                }}
              />
            </Tooltip>
          </Col>
        </Row>
        <Divider>zookeeper节点</Divider>
        <Row>
          <Col span={12}>
            <Input
              placeholder="请输入节点查询(已加载节点)"
              suffix={<IconFont type={"icon-icon-1"} />}
              onChange={onSelectChange}
              allowClear
            />
          </Col>
          <Col span={11} push={1}>
            <ButtonGroup>
              <Tooltip title="新增节点">
                <Button
                  style={{ marginRight: 5 }}
                  disabled={!(treeData.length > 0)}
                  onClick={() => {
                    if (!nodePath) {
                      message.warn("请选择节点");
                    } else {
                      setCreateNodeVisible(true);
                    }
                  }}
                >
                  新增节点
                  {/*<IconFont type={"icon-draw"} style={{ fontSize: 20 }} />*/}
                </Button>
              </Tooltip>
              <Tooltip title="删除节点">
                <Button disabled={!(treeData.length > 0)} onClick={onRemove}>
                  删除节点
                  {/*<IconFont type={"icon-icon-"} style={{ fontSize: 20 }} />*/}
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Col>
        </Row>
        <Row style={{ overflow: "auto", height: "81vh" }}>
          <Tree
            showIcon
            selectedKeys={selectedKeys}
            onSelect={onSelectTree}
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
          >
            {renderTreeNodes(treeData)}
          </Tree>
        </Row>
      </Card>
    </div>
  );

  return (
    <>
      <SplitPane
        split={"vertical"}
        minSize={600}
        maxSize={900}
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
                      <IconFont type={"icon-notebook1"} />
                      节点数据
                    </span>
                  }
                  key="1"
                >
                  <Card className={style.tabsCard} bordered={false}>
                    <div style={{ height: "22vh", overflow: "auto" }}>
                      节点路径：{nodePath}
                      <br />
                      <br />
                      节点名：
                      {decodeURI ? decodeURIComponent(nodeName) : nodeName}
                    </div>
                    <Row align={"middle"} justify={"center"}>
                      <Col>
                        <div
                          style={{
                            margin: 5,
                            height: "4vh"
                          }}
                        >
                          URL解码：
                          <Switch onChange={checked => setDecodeURI(checked)} />
                        </div>
                      </Col>
                    </Row>
                    <TextArea
                      rows={4}
                      value={nodeData}
                      autosize={{ minRows: 4, maxRows: 4 }}
                      onChange={event => setNodeData(event.target.value)}
                    />
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
                  </Card>
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <IconFont type={"icon-checklist"} />
                      节点属性
                    </span>
                  }
                  key="2"
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
                  key="3"
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
