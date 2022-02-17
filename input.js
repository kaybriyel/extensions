button.addEventListener("click", async() => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: addInputListener,
    });
});

function addInputListener() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => i.addEventListener('input', () => {
        let input = {},
            key = '';
        for (const { name, value }
            of i.attributes) {
            if (name === 'name' || name === 'id' || name === 'placeholder' || name === 'type') {
                key += value;
                input[name] = value;
            }
        }
        input.value = i.value;
        localStorage[key] = JSON.stringify(input)
    }))
}