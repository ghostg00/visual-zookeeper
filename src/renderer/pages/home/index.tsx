import React, { useEffect, useState } from "react";
import { connect } from "dva";
import { Card, Col, Form, Input, Row, Switch, Table, Tabs, Tree } from "antd";
import { FormComponentProps } from "antd/lib/form";
import { AnyAction, Dispatch } from "redux";
import { StateType } from "@/pages/home/model";
import { AntTreeNode } from "antd/lib/tree";
import { TreeProps } from "antd/es/tree";
import { TreeNodeNormal } from "antd/es/tree/Tree";
import { CardTabListType } from "antd/lib/card";

interface HomeProps {
  home: StateType;
  dispatch: Dispatch<AnyAction>;
  loading: boolean;
}

const { TreeNode, DirectoryTree } = Tree;
const { Search } = Input;
const { TabPane } = Tabs;

function Home(props: HomeProps) {
  const { dispatch, home } = props;
  const [treeData, setTreeData] = useState<TreeNodeNormal[]>([]);
  const [nodeName, setNodeName] = useState<string>("");

  useEffect(() => {
    dispatch({
      type: "home/fetchConnect",
      callback() {
        dispatch({
          type: "home/fetchGetChildren",
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
  }, []);

  const onLoadData: TreeProps["loadData"] = node =>
    new Promise(resolve => {
      let path = node.props.eventKey;
      if (node.props.children) {
        resolve();
        return;
      }
      dispatch({
        type: "home/fetchGetChildren",
        payload: { path },
        callback(data: string[]) {
          node.props.dataRef.children = data.map(item => {
            return {
              title: item,
              key: `${path}/${item}`
            };
          });
          setTreeData(treeData);
          resolve();
        }
      });
    });

  const renderTreeNodes = (data: TreeNodeNormal[]) =>
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} {...item} dataRef={item} />;
    });

  const onClickTree: TreeProps["onClick"] = (e, node) => {
    setNodeName(node.props.title as string);
    dispatch({
      type: "home/fetchGetData",
      payload: { path: node.props.eventKey }
    });
    dispatch({
      type: "home/fetchGetACL",
      payload: { path: node.props.eventKey }
    });
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

  return (
    <>
      <Row>
        <Col span={8}>
          <Card
            style={{ overflow: "auto", minHeight: "100%", margin: 5 }}
            hoverable
          >
            <Search
              placeholder="请输入节点"
              onSearch={value => console.log(value)}
              style={{ width: 200 }}
            />
            <DirectoryTree loadData={onLoadData} onClick={onClickTree}>
              {renderTreeNodes(treeData)}
            </DirectoryTree>
          </Card>
        </Col>
        <Col span={16}>
          <Card>
            <Tabs style={{ height: 800 }}>
              <TabPane tab="节点名" key="1">
                {nodeName}
                <Row align={"middle"} justify={"center"}>
                  <Col>
                    URL解码:
                    <Switch
                      onChange={(checked: boolean, event: MouseEvent) => {
                        if (checked) {
                          setNodeName(decodeURIComponent(nodeName));
                        } else {
                          setNodeName(encodeURIComponent(nodeName));
                        }
                      }}
                    />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="节点值" key="2">
                {home.nodeData}
              </TabPane>
              <TabPane tab="节点属性" key="3">
                <Table
                  columns={columns}
                  dataSource={home.nodeStat}
                  rowKey={"name"}
                  size={"small"}
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="节点权限" key="4">
                {/*{home.nodeACl}*/}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </>
  );
}

const mapStateToProps = ({
  home,
  loading
}: {
  home: StateType;
  loading: { models: { [key: string]: boolean } };
}) => ({
  home,
  loading: loading.models.home
});

export default connect(mapStateToProps)(Home);
