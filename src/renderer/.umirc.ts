import { IConfig } from "umi-types";

// ref: https://umijs.org/config/
const config: IConfig = {
  treeShaking: true,
  history: "hash",
  outputPath: "../../dist/renderer",
  publicPath: "./",
  base: "/",
  routes: [
    {
      path: "/",
      component: "../pages/home"
    }
  ],
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      "umi-plugin-react",
      {
        antd: true,
        dva: true,
        dynamicImport: { webpackChunkName: true },
        title: "visual-zookeeper",
        dll: false,

        routes: {
          exclude: [
            /models\//,
            /services\//,
            /model\.(t|j)sx?$/,
            /service\.(t|j)sx?$/,
            /components\//
          ]
        }
      }
    ]
  ]
};

export default config;
