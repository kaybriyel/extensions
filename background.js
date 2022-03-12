importScripts('config.js')
initForeground()

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete') {
        const { uuid, url } = await STORAGE_LOCAL.get()
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