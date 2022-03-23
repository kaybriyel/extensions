async function initSocket() {
  const { uuid, socketUrl, socketHost } = await STORAGE_LOCAL.get()
  const ID = `${uuid}-BG`

  if (WS && WS.readyState === 1 && WS.id === ID) return
  if (WS && WS.readyState === 1) {
    WS.onclose = null
    WS.close()
  }
  WS = new WebSocket(socketUrl || INITAL_CONFIG.socketUrl)
  WS.emit = ({ clientId, payload }) => WS.send(JSON.stringify({ action: 'SEND', payload: { clientId, payload } }))
  WS.onopen = () => {
    WS.onmessage = ({ data }) => {
      try {
        WS.handleData(JSON.parse(data))
      } catch (error) { }
    }
  }

  WS.onclose = () => setTimeout(() => initSocket(ID), 2000)

  WS.handleData = async function ({ action, from, payload }) {
    console.log(action, from, payload)
    let data = 'NOT MATCH'
    try {
      switch (action) {
        case 'HI': data = await register()
          break
        case CMD.TAB: data = await tab(...payload)
          break
        case CMD.GOTO: data = await goto(...payload)
          break
        case CMD.SET_STORAGE: data = await setStorage(...payload)
          break
        case CMD.GET_STORAGE: data = await getStorage(...payload)
          break
        case CMD.CAPTURE: data = await capture()
          break
        case CMD.HELP: return WS.emit({ action, clientId: from, payload: CMD })
      }
    } catch (error) {
      data = error.message
    }
    if (data !== 'NOT MATCH') {
      action += '_RES'
      WS.emit({ action, clientId: from, payload: data })
    }
  }

  function tab(payload = {}) {
    return chrome.tabs.query(payload)
  }

  function goto(...payload) {
    if (payload.length) {
      payload.forEach(option => {
        chrome.tabs.create(option)
      })
      return 'CREATED'
    }
  }

  function register() {
    console.log('init socket with id ', ID)
    WS.send(JSON.stringify({
      action: 'ID',
      payload: ID
    }))
  }

  function getStorage(type) {
    if (type === CMD.LOCAL)
      return STORAGE_LOCAL.get()
    else if (type === CMD.SYNC)
      return STORAGE_SYNC.get()

    return { validKeys: [CMD.SYNC, CMD.LOCAL] }
  }

  function setStorage(type, kv) {

    if (type === CMD.LOCAL)
      return STORAGE_LOCAL.set({ ...kv })
    else if (type === CMD.SYNC)
      return STORAGE_SYNC.set({ ...kv })

    return { validKeys: [CMD.SYNC, CMD.LOCAL] }
  }

  async function capture() {
    const images = []
    const tabs = await chrome.tabs.query({ active: true })
    for(const { url, windowId } of tabs) {
      const img = await chrome.tabs.captureVisibleTab(windowId)
      const res = await POST({ url: `${socketHost}/images`, headers: { 'Content-Type': 'text/plain', deviceId: uuid, url: btoa(url) }, body: img })
      if(res.ok) images.push(await res.text())
    }
    return { images }
  }
}