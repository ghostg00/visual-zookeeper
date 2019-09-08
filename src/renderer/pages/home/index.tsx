import React, {
  ChangeEventHandler,
  RefObject,
  useEffect,
  useRef,
  useState
} from "react";
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
import { AnyAction, Dispatch } from "redux";
import { StateType } from "@/pages/home/model";
import { AntTreeNode, TreeProps } from "antd/es/tree";
import { TreeNodeNormal } from "antd/es/tree/Tree";
import { SearchProps } from "antd/es/input";
import SplitPane from "react-split-pane";
import { ZkACL } from "@/utils/ZkClient";
import logEvent from "./LogEvent";
import { Event } from "node-zookeeper-client";

import style from "./style.less";
import { FormComponentProps } from "antd/es/form";
import { ModalProps } from "antd/es/modal";
import InputElement from "antd/es/auto-complete/InputElement";

const moment = require("moment");

const { TreeNode } = Tree;
const { Search, TextArea } = Input;
const { TabPane } = Tabs;
const ButtonGroup = Button.Group;

const IconFont = Icon.createFromIconfontCN({
  scriptUrl: "//at.alicdn.com/t/font_1396433_vjkoke3azt.js"
});

interface HomeProps {
  home: StateType;
  dispatch: Dispatch<AnyAction>;
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

function Home(props: HomeProps) {
  const { dispatch, home } = props;
  const [treeData, setTreeData] = useState<TreeNodeNormal[]>([]);
  const [nodePath, setNodePath] = useState("");
  const [nodeName, setNodeName] = useState("");
  const [nodeData, setNodeData] = useState("");
  const [createNodeVisible, setCreateNodeVisible] = useState(false);
  const [nodeACL, setNodeACL] = useState<ZkACL>(new ZkACL("", "", ""));
  const [formRef, setFormRef] = useState<any>();
  const [logArr, setLogArr] = useState<string[]>([]);
  const [log, setLog] = useState("");
  const logDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEvent.on("log", (event: Event) => {
      // console.log("log", event);
      // console.log("logArr", logArr);
      logArr.length == 20 && logArr.shift();
      logArr.push(
        `${moment().format("YYYY-MM-DD HH:mm:ss SSS")}: ${event.toString()}`
      );
      setLogArr(logArr);
      setLog(logArr.join("\n"));
      if (logDiv.current != null) {
        logDiv.current.scrollTop = logDiv.current.scrollHeight;
      }
    });
  }, []);

  const connect: SearchProps["onSearch"] = value => {
    dispatch({
      type: "home/connect",
      payload: { connectionString: value }, //118.25.172.148:2181
      callback() {
        dispatch({
          type: "home/getChildren",
          payload: { path: "/" },
          callback(data: string[]) {
            let treeData: TreeNodeNormal[] = data.map(item => {
              return { title: item, key: `/${item}` };
            });
            setTreeData(treeData);
          }
        });
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
      refreshTreeNode(path, node, resolve);
    });
  };

  const refreshTreeNode = (
    path: string | undefined,
    node: AntTreeNode,
    resolve: any
  ) => {
    dispatch({
      type: "home/getChildren",
      payload: { path },
      callback(data: string[]) {
        console.log("refreshTreeNode getChildren", data);
        node.props.dataRef.children = data.map(item => {
          return {
            title: item,
            key: `${path}/${item}`
          };
        });
        setTreeData([...treeData]);
        resolve();
      },
      event(event: any) {
        console.log("refreshTreeNodeevent", event);
        refreshTreeNode(path, node, resolve);
      }
    });
  };

  const renderTreeNodes = (data: TreeNodeNormal[]) =>
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode
            title={item.title}
            key={item.key}
            dataRef={item}
            icon={<IconFont type="icon-folder" />}
          >
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return (
        <TreeNode
          key={item.key}
          {...item}
          dataRef={item}
          icon={<IconFont type="icon-folder" />}
        />
      );
    });

  const onSelectChange: ChangeEventHandler<HTMLInputElement> = e => {
    const value = e.target.value;
    console.log(treeData);
    // const expandedKeys = dataList
    //   .map(item => {
    //     if (item.title.indexOf(value) > -1) {
    //       return getParentKey(item.key, gData);
    //     }
    //     return null;
    //   })
    //   .filter((item, i, self) => item && self.indexOf(item) === i);
    // this.setState({
    //   expandedKeys,
    //   searchValue: value,
    //   autoExpandParent: true
    // });
  };

  const onClickTree: TreeProps["onClick"] = (e, node) => {
    setNodeName(node.props.title as string);
    const path = node.props.eventKey as string;
    setNodePath(path);
    dispatch({
      type: "home/getData",
      payload: { path },
      callback(nodeData: string) {
        setNodeData(nodeData);
      }
    });
    dispatch({
      type: "home/getACL",
      payload: { path },
      callback(nodeACL: ZkACL) {
        setNodeACL(nodeACL);
      }
    });
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
      let path = `${nodePath}/${values.nodeName}`;
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
        <Search
          addonBefore="url"
          placeholder="请输入zookeeper url"
          enterButton={
            <span>
              <IconFont type={"icon-lianjie"} />
              连接
            </span>
          }
          onSearch={connect}
          defaultValue={"106.12.84.136:2181"}
        />
        <Divider>zookeeper节点</Divider>
        <Row>
          <Col span={16}>
            <Input
              placeholder="请输入节点查询"
              suffix={<IconFont type={"icon-icon-1"} />}
              onChange={onSelectChange}
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
        <Tree showIcon loadData={onLoadData} onClick={onClickTree}>
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
                    dataSource={home.nodeStat}
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
                      <Descriptions.Item label="Schema(权限模式)" span={2}>
                        {nodeACL.scheme}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID(授权对象)">
                        {nodeACL.id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Permission(权限)" span={2}>
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
                        setLogArr([...logArr]);
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
