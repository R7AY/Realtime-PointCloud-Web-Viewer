const express = require('express')

const app = express()

app.use(express.static('./html'))

app.listen(80, () => {
  console.log('server is running')
})
