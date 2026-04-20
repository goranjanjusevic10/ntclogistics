const express = require('express')
const axios = require('axios')
const qs = require('querystring')

const app = express()
app.use(express.json())

const processedOrders = new Set()

app.get('/', (req, res) => {
  res.send('Middleware radi')
})

app.post('/shopify/order', async (req, res) => {
  const o = req.body
  const extCode = `NTC-${o.id}`

  if (processedOrders.has(extCode)) {
    console.log("DUPLICATE ORDER SKIPPED:", extCode)
    return res.sendStatus(200)
  }

  processedOrders.add(extCode)

  const shipment = {
    username: "gaia",
    password: "gaia24862",

    variant: "sending",
    direct_delivery: "0",

    receiver_name: o.shipping_address?.name,
    receiver_phone: o.phone || o.shipping_address?.phone || "000000000",
    receiver_city: o.shipping_address?.city,
    receiver_post_code: o.shipping_address?.zip,
    receiver_address: o.shipping_address?.address1,
    receiver_country_code: "ME",

    ext_code: extCode,

    // FIKSNO
    shipment_value: 0,
    money_return: "0",
    payer: "sender",
    payment_type: "account",

    content: [
      {
        pack_type: "collete",
        weight: 0,
        volume: 0
      }
    ]
  }

  console.log("SENDING:", shipment)

  try {
    const response = await axios.post(
      "http://app.ntclogistics.me/api/index.php",
      qs.stringify({
        act: "new_shipment",
        data: JSON.stringify(shipment)
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    )

    if (response.data.report === 'ok') {
      console.log("DELIVERY RESPONSE:", response.data)
    } else if (String(response.data.report).includes('already exists')) {
      console.log("ALREADY EXISTS - OK:", extCode)
    } else {
      console.log("DELIVERY RESPONSE:", response.data)
    }

  } catch (e) {
    console.error("DELIVERY ERROR:", e.response?.data || e.message)
  }

  res.sendStatus(200)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
