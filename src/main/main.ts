import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as url from "url";

let mainWindow: Electron.BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 900,
    minHeight: 720,
    width: 1600,
    minWidth: 1200,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true, // 是否集成 Nodejs
      webSecurity: false
    }
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:6008/#/");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "./dist/renderer/index.html"),
        protocol: "file:",
        slashes: true
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
