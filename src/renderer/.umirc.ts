import { defineConfig } from "umi";

// ref: https://umijs.org/config/
export default defineConfig({
  history: { type: "hash" },
  outputPath: "../../dist/renderer",
  publicPath: "./",
  base: "/",
  routes: [
    {
      path: "/",
      component: "../pages/home"
    }
  ],
  antd: {},
  dva: {},
  title: "visual-zookeeper"
});
