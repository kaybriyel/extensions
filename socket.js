let ws

const CMD = {
  TAB: 'TAB',
  TABS: 'TABS',
  GOTO: 'GOTO',
  HELP: 'HELP',
  EXEC: 'EXEC'
}

function initSocket(ID = Math.random() * 10000) {
  console.log('init socket with id ', ID)

  if (ws && ws.readyState === 1) return
  ws = new WebSocket(socketUrl)
  ws.emit = ({ clientId, payload }) => ws.send(JSON.stringify({ action: 'SEND', payload: {  clientId, payload } }))
  ws.onopen = () => {
    ws.onmessage = ({ data }) => {
      try {
        handleData(JSON.parse(data))
      } catch (error) { ws.send(JSON.stringify(error)) }
    }
  }

  ws.onclose = () => setTimeout(() => initSocket(ID), 2000)

  function handleData({ action, payload }) {
    console.log(action)
    switch (action) {
      case 'HI': return register()
      case CMD.TAB: return tab(payload)
      case CMD.TABS: return tabs(payload)
      case CMD.GOTO: return goto(payload)
      case CMD.HELP: return ws.emit(handleData.toString)
    }
  }

  async function tab(payload) {
    const tab = await chrome.tabs.query({ currentWindow: false, active: true })
    ws.emit({ clientId: payload.from, payload: tab })
  }

  async function tabs(payload) {
    const tabs = await chrome.tabs.query({ currentWindow: false })
    ws.emit({clientId: payload.from, payload: tabs})
  }

  async function goto(payload) {
    chrome.tabs.create(payload)
    ws.emit({ clientId: payload.from, payload: 'CREATED' })
  }

  function register() {
    ws.send(JSON.stringify({
      action: 'ID',
      payload: ID
    }))
  }
}

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
  if(info.status === 'complete') {
    if (!ws) initSocket(uuid + '-BG')
    else ws.emit({ action: CMD.TAB, payload: tab })
  }
})