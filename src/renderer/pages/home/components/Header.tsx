import React from "react";
import style from "@/pages/home/style.less";
import { Col, Row } from "antd/lib/grid";
// @ts-ignore
import device from "current-device";
import * as Electron from "electron";
import { CloseOutlined, MinusOutlined } from "@ant-design/icons";

let electron = window.require("electron") as Electron.AllElectron;

const Header: React.FC = () => {
  const renderWindowsHeaderOperate = () => {
    if (device.windows()) {
      const currentWindow = electron.remote.getCurrentWindow();
      return (
        <Col
          style={{
            WebkitAppRegion: "no-drag",
            color: "rgba(255,255,255,1)"
          }}
        >
          <MinusOutlined
            style={{ fontSize: 22, marginRight: 8 }}
            onClick={() => currentWindow.minimize()}
          />
          <CloseOutlined
            style={{ fontSize: 22, marginRight: 8 }}
            onClick={() => currentWindow.close()}
          />
        </Col>
      );
    }
  };

  return (
    <Row className={style.header} align={"middle"} justify={"space-between"}>
      <Col span={4} offset={10}>
        <span
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,1)"
          }}
        >
          Visual-Zookeeper
        </span>
      </Col>
      {renderWindowsHeaderOperate()}
    </Row>
  );
};

export default Header;
