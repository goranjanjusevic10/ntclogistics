const express = require('express')
const axios = require('axios')
const https = require('https')

const app = express()

app.use(express.json())

// SSL workaround (samo za test)
const agent = new https.Agent({
  rejectUnauthorized: false
})

// test ruta
app.get('/', (req, res) => {
  res.send('Middleware radi')
})

// SHOPIFY WEBHOOK
app.post('/shopify/order', async (req, res) => {
  const o = req.body

  const shipment = {
    username: "goran",
    password: "goran123",

    receiver_name: o.shipping_address?.name,
    receiver_phone: o.phone || o.shipping_address?.phone,
    receiver_city: o.shipping_address?.city,
    receiver_address: o.shipping_address?.address1,

    ext_code: String(o.id),

    payer: "sender",
    payment_type: "cash",

    content: o.line_items.map(i => ({
      pack_type: "collete",
      weight: 1,
      volume: 0
    }))
  }

  console.log("SENDING:", shipment)

  try {
    const response = await axios.post(
      "http://app.ntclogistics.me/api",
      new URLSearchParams({
        act: "new_shipment",
        data: JSON.stringify(shipment)
      }),
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    )

    console.log("DELIVERY RESPONSE:", response.data)

  } catch (e) {
    console.error("DELIVERY ERROR:", e.message)
  }

  res.sendStatus(200)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
