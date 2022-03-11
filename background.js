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