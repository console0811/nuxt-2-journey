const bodyParser = require('body-parser')
const app = require('express')()

app.use(bodyParser.json())
app.all('/test', (req, res) => {
    return res.json({ data: 'data' })
})

module.exports = app