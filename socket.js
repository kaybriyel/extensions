async function initSocket() {
  const { uuid, socketUrl } = await storageLocal.get()
  const ID = `${uuid}-BG`

  if (ws && ws.readyState === 1 && ws.id === ID) return
  if (ws && ws.readyState === 1) {
    ws.onclose = null
    ws.close()
  }
  ws = new WebSocket(socketUrl)
  ws.emit = ({ clientId, payload }) => ws.send(JSON.stringify({ action: 'SEND', payload: { clientId, payload } }))
  ws.onopen = () => {
    ws.onmessage = ({ data }) => {
      try {
        handleData(JSON.parse(data))
      } catch (error) { }
    }
  }

  ws.onclose = () => setTimeout(() => initSocket(ID), 2000)

  async function handleData({ action, from, payload }) {
    console.log(action, from, payload)
    let data = 'NOT MATCH'
    try {
      switch (action) {
        case 'HI': data = await register()
          break
        case CMD.TAB: data = await tab(payload)
          break
        case CMD.TABS: data = await tabs(payload)
          break
        case CMD.GOTO: data = await goto(payload)
          break
        case CMD.SET_STORAGE: data = await setStorage(payload)
          break
        case CMD.GET_STORAGE: data = await getStorage(payload)
          break
        case CMD.HELP: return ws.emit(handleData.toString)
      }
    } catch (error) {
      data = error.message
    }
    if (data !== 'NOT MATCH') {
      action += '_RES'
      ws.emit({ action, clientId: from, payload: data })
    }
  }

  function tab(payload) {
    return chrome.tabs.query(payload)
  }

  function tabs(payload) {
    return chrome.tabs.query(payload)
  }

  function goto(payload) {
    if (payload.options?.length) {
      payload.options.forEach(option => {
        chrome.tabs.create(option)
      })
      return 'CREATED'
    }
  }

  function register() {
    console.log('init socket with id ', ID)
    ws.send(JSON.stringify({
      action: 'ID',
      payload: ID
    }))
  }

  function getStorage(payload) {
    const { type = '' } = payload

    if (type === CMD.LOCAL)
      return storageLocal.get()
    else if (type === CMD.SYNC)
      return storageSync.get()
  }

  function setStorage(payload) {
    const { type = '', values } = payload

    if (type === CMD.LOCAL)
      return storageLocal.set({ ...values })
    else if (type === CMD.SYNC)
      return storageSync.set({ ...values })
  }
}

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
  if (info.status === 'complete') {
    initSocket()
  }
})