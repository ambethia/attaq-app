const { app, BrowserWindow, globalShortcut } = require("electron");
const windowStateKeeper = require("electron-window-state");
const robot = require("robotjs");
const jsQR = require("jsqr");
const path = require("path");

let currentKeyCode;
let mainWindow;
let x, y, width, height;

function setup() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 100,
    defaultHeight: 100,
  });
  const win = new BrowserWindow({
    frame: false,
    transparent: true,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindowState.manage(win);
  win.loadFile("index.html");
  mainWindow = win;

  win.on("resize", setGeometry);
  win.on("move", setGeometry);
  setGeometry();

  const ret = globalShortcut.register("`", pressGlobalKey);
  if (!ret) console.warn("Registration of shortcut failed.");
  mainWindow.webContents.send("change-state", "inactive");
  setInterval(getKeyCode, 1000);
}

function getKeyCode() {
  let capture;
  try {
    if (!(x && y && width && height)) return;
    capture = robot.screen.capture(x, y, width, height);
    const code = jsQR(
      capture.image,
      capture.byteWidth / capture.bytesPerPixel,
      capture.height
    );
    if (code) {
      const nextKey = code.data.toLowerCase();
      if (currentKeyCode != nextKey) {
        if (!currentKeyCode) {
          mainWindow.webContents.send("change-state", "active");
        }
        currentKeyCode = nextKey;
      }
    } else {
      if (currentKeyCode) {
        mainWindow.webContents.send("change-state", "inactive");
      }
      currentKeyCode = null;
    }
  } catch (error) {}
}

function pressGlobalKey() {
  if (currentKeyCode) {
    robot.keyTap(currentKeyCode);
  }
}

function setGeometry() {
  [x, y] = mainWindow.getPosition();
  [width, height] = mainWindow.getSize();
}

app.whenReady().then(setup);
