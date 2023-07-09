const readline = require('readline-sync')
require('fs').writeFileSync('config.json', JSON.stringify({ "username": readline.question(`Enter your Scratch username: `),
"password": new Buffer(readline.question(`Enter your Scratch password: (do NOT share this with others!) `, { hideEchoBack: true })).toString('base64'),
"id": readline.question(`Enter the id of your Scratch project: `) }))