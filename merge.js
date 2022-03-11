const fs = require('fs')

const file = ['config.js', 'background.js', 'foreground.js', 'socket.js'].map(f => fs.readFileSync(f)).join('\n\n\n')

fs.writeFileSync('merged', file)