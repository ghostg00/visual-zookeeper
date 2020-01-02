import style from "@/pages/home/style.less";
import { Col, Row } from "antd/lib/grid";
import React from "react";
import { Icon } from "antd";
// @ts-ignore
import device from "current-device";
import * as Electron from "electron";
let electron = window.require("electron") as Electron.AllElectron;


const Header: React.ComponentType<any> = props => {
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
          <Icon
            type="minus"
            style={{ fontSize: 22, marginRight: 8 }}
            onClick={() => currentWindow.minimize()}
          />
          <Icon
            type="close"
            style={{ fontSize: 22, marginRight: 8 }}
            onClick={() => currentWindow.close()}
          />
        </Col>
      );
    }
  };

  return (
    <Row
      className={style.header}
      type={"flex"}
      align={"middle"}
      justify={"space-between"}
    >
      <Col span={4} offset={10}>
        <span
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,1)",
            lineHeight: 22,
            marginLeft: 10
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
