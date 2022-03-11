importScripts('config.js');
importScripts(initalConfig.foreground)
importScripts(initalConfig.socket)

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete') {
        const { uuid, url } = await storageLocal.get('uuid')
        post({
            url: `${url}/api/extension/tabs`,
            body: {
                ...tab,
                deviceId: uuid || 'Unknown'
            }
        })
    }
})