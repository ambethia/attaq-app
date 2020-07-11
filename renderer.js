const { ipcRenderer } = require("electron");

const mainEl = document.querySelector("main");

ipcRenderer.on("change-state", (_, status) => {
  mainEl.className = status;
});
