import { Button, Card } from "antd";
import style from "@/pages/home/style.less";
import React, { useEffect, useRef, useState } from "react";
import logEvent from "@/utils/LogEvent";
import moment from "moment";

let logArr: string[] = [];

const LogCard: React.FC<any> = props => {
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

  return (
    <Card
      style={{
        height: "calc(100% - 556px)"
      }}
      title={<span className={style.cardTitle}>日志</span>}
      bordered={false}
      headStyle={{ borderBottom: "none" }}
      bodyStyle={{ height: "calc(100% - 64px)", paddingTop: 0 }}
      extra={
        <Button
          type="link"
          icon={"delete"}
          style={{ color: "red" }}
          onClick={() => {
            logArr = [];
            setLog("");
          }}
        >
          清空日志
        </Button>
      }
    >
      <div
        ref={logDiv}
        style={{
          whiteSpace: "pre-wrap",
          overflow: "auto",
          height: "100%",
          border: "1px solid #E6E6E6",
          borderRadius: 2,
          WebkitUserSelect: "text"
        }}
      >
        {log}
      </div>
    </Card>
  );
};

export default LogCard;
