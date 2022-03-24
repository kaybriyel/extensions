importScripts('config.js')
initForeground()
initSocket()

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        const { uuid, url } = await STORAGE_LOCAL.get()
        POST({
            url: `${url}/api/extension/tabs`,
            body: {
                ...tab,
                deviceId: uuid || 'Unknown'
            }
        })
    }
})

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    //console.log(message)
    switch (message.action) {
        case CMD.POST:
            POST(message.payload)
            break
        case CMD.CAPTURE:
            WS.handleData({ action: message.action, from: message.clientId, payload: message.payload })
    }
    sendResponse()
});