importScripts('config.js')
initForeground()
initSocket()

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete' && tab.url) {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    switch (message.action) {
        case 'POST':
            POST(message.payload)
            break
    }
    sendResponse()
});