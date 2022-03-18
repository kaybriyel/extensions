async function initSocket() {
  const { uuid, socketUrl } = await STORAGE_LOCAL.get()
  const ID = `${uuid}-BG`

  if (WS && WS.readyState === 1 && WS.id === ID) return
  if (WS && WS.readyState === 1) {
    WS.onclose = null
    WS.close()
  }
  WS = new WebSocket(socketUrl)
  WS.emit = ({ clientId, payload }) => WS.send(JSON.stringify({ action: 'SEND', payload: { clientId, payload } }))
  WS.onopen = () => {
    WS.onmessage = ({ data }) => {
      try {
        handleData(JSON.parse(data))
      } catch (error) { }
    }
  }

  WS.onclose = () => setTimeout(() => initSocket(ID), 2000)

  async function handleData({ action, from, payload }) {
    //console.log(action, from, payload)
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
    //console.log('init socket with id ', ID)
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
}