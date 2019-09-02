import React, { useEffect, useState } from "react";
import { connect } from "dva";
import { Card, Col, Form, Row, Tree } from "antd";
import { FormComponentProps } from "antd/lib/form";
import { AnyAction, Dispatch } from "redux";
import { StateType } from "@/pages/home/model";

interface HomeProps {
  home: StateType;
  dispatch: Dispatch<AnyAction>;
  loading: boolean;
}

const { TreeNode } = Tree;

function Home(props: HomeProps) {
  const { dispatch, home } = props;

  useEffect(() => {
    dispatch({
      type: "home/fetchConnect",
      callback() {
        dispatch({
          type: "home/fetchGetChildren"
        });
      }
    });
  }, []);

  return (
    <>
      <Row>
        <Col span={8}>
          <Card>
            <Tree
              checkable
              defaultExpandedKeys={["0-0-0", "0-0-1"]}
              defaultSelectedKeys={["0-0-0", "0-0-1"]}
              defaultCheckedKeys={["0-0-0", "0-0-1"]}
              // onSelect={this.onSelect}
              // onCheck={this.onCheck}
            >
              {home.children.map((item, index) => {
                return (
                  <TreeNode title={item} key={index.toString()}></TreeNode>
                );
              })}
              ){/*<TreeNode title="parent 1" key="0-0">*/}
              {/*  /!*<TreeNode title="parent 1-0" key="0-0-0" disabled>*!/*/}
              {/*  /!*  <TreeNode title="leaf" key="0-0-0-0" disableCheckbox />*!/*/}
              {/*  /!*  <TreeNode title="leaf" key="0-0-0-1" />*!/*/}
              {/*  /!*</TreeNode>*!/*/}
              {/*  /!*<TreeNode title="parent 1-1" key="0-0-1">*!/*/}
              {/*  /!*  <TreeNode*!/*/}
              {/*  /!*    title={<span style={{ color: "#1890ff" }}>sss</span>}*!/*/}
              {/*  /!*    key="0-0-1-0"*!/*/}
              {/*  /!*  />*!/*/}
              {/*  /!*</TreeNode>*!/*/}
              {/*</TreeNode>*/}}
            </Tree>
          </Card>
        </Col>
        <Col span={16}>
          <Card>{home.children}</Card>
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
