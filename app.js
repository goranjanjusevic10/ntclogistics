const express = require('express')
const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Middleware radi')
})

app.post('/shopify/order', (req, res) => {
  console.log('ORDER RECEIVED:', req.body)
  res.sendStatus(200)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
