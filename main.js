const { app, BrowserWindow } = require("electron");
const windowStateKeeper = require("electron-window-state");
const robot = require("robotjs");
const jsQR = require("jsqr");
const ioHook = require("iohook");

let currentKeyCode, mainWindow, throttleId;
let x, y, width, height;

const TIMING = 500;

function setup() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 100,
    defaultHeight: 100,
  });

  mainWindow = new BrowserWindow({
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

  mainWindowState.manage(mainWindow);
  mainWindow.loadFile("index.html");
  mainWindow.on("resize", setGeometry);
  mainWindow.on("move", setGeometry);
  mainWindow.webContents.send("change-state", "inactive");

  ioHook.on("mousewheel", handleGlobalTrigger);
  ioHook.start();

  setGeometry();
  setInterval(getKeyCode, TIMING);
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

function handleGlobalTrigger() {
  if (throttleId) return;
  throttleId = setTimeout(() => {
    if (currentKeyCode) {
      try {
        robot.keyTap(currentKeyCode);
      } catch (error) {
        console.warn(`Invalid Key: ${currentKeyCode}`);
      }
    }
    throttleId = undefined;
  }, TIMING);
}

function setGeometry() {
  [x, y] = mainWindow.getPosition();
  [width, height] = mainWindow.getSize();
}

app.whenReady().then(setup);

app.on("before-quit", () => {
  ioHook.unload();
});
