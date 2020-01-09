import React, { ChangeEventHandler, useEffect, useState } from "react";
import { connect } from "dva";
import {
  Button,
  Card,
  Descriptions,
  Input,
  message,
  Modal,
  Spin,
  Switch,
  Table,
  Tabs,
  Tree
} from "antd";
import { StateType } from "@/pages/home/model";
import { TreeProps } from "antd/es/tree";
import { TreeNodeNormal } from "antd/es/tree/Tree";
import { ZkACL } from "@/utils/ZkClient";
import logEvent from "../../utils/LogEvent";
import { Event } from "node-zookeeper-client";
import style from "./style.less";
import { Col, Row } from "antd/lib/grid";
import CreateNodeForm, {
  CreateNodeFormProps
} from "@/pages/home/components/CreateNodeForm";
import { useLocalStorageState } from "@umijs/hooks";
import LogCard from "@/pages/home/components/LogCard";
import { Dispatch } from "@/declare/dva";
import Header from "@/pages/home/components/Header";
import { ColumnsType } from "antd/lib/table/Table";
import {
  DeleteOutlined,
  PlusOutlined,
  RedoOutlined
} from "@ant-design/icons/lib";

const { DirectoryTree } = Tree;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface HomeProps {
  home: StateType;
  dispatch: Dispatch;
}

interface NodeAttribute {
  name: string;
  value: string;
  realValue: string;
  description: string;
}

const Home: React.FC<HomeProps> = props => {
  const { dispatch } = props;

  const [url, setUrl] = useLocalStorageState("url", "127.0.0.1:2181");
  const [isAuto, setIsAuto] = useLocalStorageState("isAuto", false);

  const [treeLoading, setTreeLoading] = useState(false);
  const [treeNodeData, setTreeNodeData] = useState<TreeNodeNormal[]>([]);
  const [treeData, setTreeData] = useState<TreeNodeNormal[]>([]);
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
  const [decodeURI, setDecodeURI] = useState(false);

  useEffect(() => refreshRootTreeNode(), [isAuto]);
  useEffect(() => setTreeLoading(false), [treeData]);
  useEffect(() => onSelectChange(searchValue), [searchValue]);

  const connect = () => {
    dispatch({
      type: "home/connect",
      payload: url
    }).then(() => {
      refreshRootTreeNode();
      setNodePath("/");
      message.success("连接成功");
    });
  };
  const event: any = (event: Event) => {
    logEvent.emit("log", event);
    isAuto && refreshRootTreeNode();
  };

  const refreshRootTreeNode = () => {
    setTreeLoading(true);
    dispatch({
      type: "home/getChildrenTree",
      payload: { rootNode },
      event: isAuto ? event : undefined
    }).then((data: TreeNodeNormal[]) => {
      setTreeNodeData(data);
      setTreeData(renderTreeNodes(data));
    });
  };

  const close = async () => {
    return new Promise(resolve => {
      dispatch({
        type: "home/close"
      }).then(() => {
        setExpandedKeys([]);
        setTreeData([]);
        setNodePath("");
        setNodeName("");
        setNodeData("");
        setNodeACL(new ZkACL("", "", ""));
        message.success("断开连接成功");
        resolve();
      });
    });
  };

  const renderTreeNodes: (data: TreeNodeNormal[]) => TreeNodeNormal[] = (
    data: TreeNodeNormal[]
  ) =>
    data.map(item => {
      const oldTitle = item.title as string;
      const index = oldTitle.indexOf(searchValue);
      const beforeStr = oldTitle.substr(0, index);
      const afterStr = oldTitle.substr(index + searchValue.length);
      let title = item.title;
      const key = item.key;
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
        return {
          title,
          key,
          dataRef: item,
          children: renderTreeNodes(item.children!)
        };
      }
      return { title, key, isLeaf: true, dataRef: item };
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

  const onSelectChange = (value: string) => {
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
    generateList(treeNodeData);
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
    setTreeData(renderTreeNodes(treeNodeData));
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
      setNodeName(e.node.props.dataRef.title);
      const path = e.node.props.eventKey as string;
      setNodePath(path);
      dispatch({
        type: "home/getData",
        payload: { path }
      }).then((data: [string, []]) => {
        setNodeData(data[0]);
        setNodeStat(data[1]);
      });
      dispatch({
        type: "home/getACL",
        payload: { path }
      }).then((nodeACL: ZkACL) => setNodeACL(nodeACL));
    }
  };

  const onSetData = () => {
    if (nodePath && nodeData) {
      dispatch({
        type: "home/setData",
        payload: { path: nodePath, data: nodeData }
      }).then(() => message.success(`${nodePath}节点值更新成功`));
    }
  };

  const onCreate: CreateNodeFormProps["onCreate"] = ({
    zkNodeName,
    nodeData
  }) => {
    const path = `${nodePath}${nodePath === "/" ? "" : "/"}${zkNodeName}`;
    dispatch({
      type: "home/create",
      payload: {
        path,
        nodeData
      }
    }).then(() => {
      message.success(`${path}节点新增成功`);
      setCreateNodeVisible(false);
    });
  };

  const onRemove = () => {
    if (nodePath) {
      Modal.confirm({
        title: "警告",
        content: "您确定要删除选中节点以及子节点吗？",
        okText: "确定",
        cancelText: "取消",
        onOk: () => {
          return new Promise(resolve => {
            dispatch({
              type: "home/remove",
              payload: { path: selectedKeys }
            }).then(() => {
              setSelectedKeys([]);
              message.success(`节点删除成功`);
              resolve();
            });
          });
        }
      });
    }
  };

  const columns: ColumnsType<NodeAttribute> = [
    {
      title: "名称",
      dataIndex: "name",
      width: 150
    },
    {
      title: "值",
      dataIndex: "value",
      width: 200
    },
    {
      title: "真实值",
      dataIndex: "realValue",
      ellipsis: true
    },
    {
      title: "描述",
      dataIndex: "description",
      ellipsis: true
    }
  ];

  const leftCard = (
    <Card
      style={{
        height: "100%",
        marginRight: 15
      }}
      bodyStyle={{ height: "100%" }}
      bordered={false}
    >
      {/*<Row type={"flex"} align={"middle"} justify={"space-between"}>*/}
      {/*  <Col>*/}
      {/*    <span className={style.cardTitle}>节点选项</span>*/}
      {/*  </Col>*/}
      {/*<Col>*/}
      {/*  <Input*/}
      {/*    placeholder="根节点"*/}
      {/*    onChange={e => setRootNode(e.target.value)}*/}
      {/*  />*/}
      {/*</Col>*/}
      {/*  <Col>*/}
      {/*    <Button type={"primary"} onClick={connect} style={{ marginRight: 5 }}>*/}
      {/*      连接*/}
      {/*    </Button>*/}
      {/*    <Button type={"primary"} onClick={close}>*/}
      {/*      断开*/}
      {/*    </Button>*/}
      {/*  </Col>*/}
      {/*</Row>*/}
      <Row align={"middle"} justify={"space-between"}>
        <Col span={14}>
          <Input
            style={{ marginBottom: 20 }}
            addonBefore="URL"
            placeholder="请输入zookeeper url"
            value={url}
            onChange={event => setUrl(event.target.value)}
          />
        </Col>
        <Col>
          <Button
            type={"primary"}
            onClick={connect}
            style={{ marginRight: 5, marginBottom: 20 }}
          >
            连接
          </Button>
          <Button type={"primary"} onClick={close}>
            断开
          </Button>
        </Col>
      </Row>
      <Card
        title={<span className={style.cardTitle}>zookeeper节点</span>}
        style={{ height: "calc(100% - 52px)" }}
        size={"small"}
        bodyStyle={{ height: "calc(100% - 38px)" }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            节点是否自动更新&nbsp;&nbsp;
            <Switch
              checked={isAuto}
              onChange={checked => {
                setIsAuto(checked);
                // refreshRootTreeNode();
              }}
            />
          </Col>
          <Col>
            <Button
              type={"link"}
              icon={<PlusOutlined />}
              disabled={!(treeData.length > 0)}
              style={{ padding: "0 5px" }}
              onClick={() => {
                if (!nodePath) {
                  message.warn("请选择节点");
                } else {
                  setCreateNodeVisible(true);
                }
              }}
            >
              新增
            </Button>
            <Button
              type={"link"}
              icon={<DeleteOutlined />}
              style={{
                color: treeData.length > 0 ? "red" : undefined,
                padding: "0 5px"
              }}
              disabled={!(treeData.length > 0)}
              onClick={onRemove}
            >
              删除
            </Button>
            <Button
              type={"link"}
              icon={<RedoOutlined />}
              style={{ padding: "0 5px" }}
              disabled={!(treeData.length > 0)}
              onClick={refreshRootTreeNode}
            >
              刷新
            </Button>
          </Col>
        </Row>
        <Row>
          <Input
            style={{ marginTop: 10 }}
            placeholder="请输入节点名称查询"
            // prefix={<Searc />}
            onChange={e => setSearchValue(e.target.value)}
            allowClear
          />
        </Row>
        <div
          style={{
            overflow: "auto",
            height: "calc(100% - 74px)"
          }}
        >
          <Spin spinning={treeLoading} style={{ width: "100%" }}>
            <DirectoryTree
              multiple
              treeData={treeData}
              selectedKeys={selectedKeys}
              onSelect={onSelectTree}
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
            />
          </Spin>
        </div>
      </Card>
    </Card>
  );

  const rightCard = (
    <Card
      style={{ marginBottom: 15 }}
      bordered={false}
      bodyStyle={{ height: "100%" }}
    >
      <div className="card-container" style={{ height: "100%" }}>
        <Tabs style={{ height: "100%" }}>
          <TabPane
            tab={<span className={style.cardTitle}>节点数据</span>}
            key="1"
            style={{ height: 457 }}
          >
            <div
              style={{
                height: 270,
                wordBreak: "break-word",
                overflow: "auto",
                WebkitUserSelect: "text"
              }}
            >
              <p>
                节点路径：{nodePath.substring(0, nodePath.lastIndexOf("/"))}
              </p>
              <p>
                节点名称：{decodeURI ? decodeURIComponent(nodeName) : nodeName}
              </p>
            </div>
            <div style={{ lineHeight: "48px" }}>
              URL解码：
              <Switch onChange={checked => setDecodeURI(checked)} />
            </div>
            <TextArea
              value={nodeData}
              autoSize={{ minRows: 4, maxRows: 4 }}
              onChange={event => setNodeData(event.target.value)}
            />
            <Row align={"middle"}>
              <Col>
                <div style={{ marginTop: 10 }}>
                  <Button type="primary" onClick={onSetData}>
                    保存
                  </Button>
                </div>
              </Col>
            </Row>
          </TabPane>
          <TabPane
            tab={<span className={style.cardTitle}>节点属性</span>}
            key="2"
          >
            <Table<NodeAttribute>
              rowKey={"name"}
              size={"small"}
              columns={columns}
              dataSource={nodeStat}
              pagination={false}
              style={{ WebkitUserSelect: "text" }}
            />
          </TabPane>
          <TabPane
            tab={<span className={style.cardTitle}>节点权限</span>}
            key="3"
          >
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
          </TabPane>
        </Tabs>
      </div>
    </Card>
  );

  return (
    <>
      <Header />
      <div
        style={{
          background: "rgba(242,245,247,1)",
          height: "calc(100% - 48px)",
          padding: 15
        }}
      >
        <Row style={{ position: "unset", height: "100%" }}>
          <Col span={10} style={{ height: "100%" }}>
            {leftCard}
          </Col>
          <Col span={14} style={{ height: "100%" }}>
            {rightCard}
            <LogCard />
          </Col>
        </Row>
      </div>
      <CreateNodeForm
        visible={createNodeVisible}
        parentNode={nodePath}
        onCancel={() => setCreateNodeVisible(false)}
        onCreate={onCreate}
      />
    </>
  );
};

export default connect(({ home }: { home: StateType }) => ({
  home
}))(Home);
