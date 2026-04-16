const express = require('express')
const axios = require('axios')
const qs = require('querystring')

const app = express()
app.use(express.json())

// CONFIG (prebaci kasnije u ENV)
const CONFIG = {
  username: "gaia",
  password: "gaia24862",
  apiUrl: "http://app.ntclogistics.me/api/index.php"
}

// test ruta
app.get('/', (req, res) => {
  res.send('Middleware radi')
})

// helper — validacija
function validateOrder(o) {
  const addr = o.shipping_address || {}
  if (!addr.name) return "Nedostaje ime primaoca"
  if (!addr.address1) return "Nedostaje adresa"
  if (!addr.city && !addr.zip) return "Nedostaje grad ili poštanski broj"
  if (!o.line_items || !o.line_items.length) return "Nema stavki"
  return null
}

// helper — COD logika
function isCOD(o) {
  return o.financial_status !== "paid"
}

// SHOPIFY WEBHOOK
app.post('/shopify/order', async (req, res) => {
  const o = req.body

  // VALIDACIJA
  const error = validateOrder(o)
  if (error) {
    console.error("VALIDATION ERROR:", error)
    return res.status(400).send(error)
  }

  const addr = o.shipping_address || {}

  const shipment = {
    username: CONFIG.username,
    password: CONFIG.password,

    variant: "sending",
    direct_delivery: "0",

    receiver_name: addr.name,
    receiver_phone: o.phone || addr.phone || "000000000",
    receiver_city: addr.city,
    receiver_post_code: addr.zip,
    receiver_address: addr.address1,
    receiver_country_code: "ME",

    ext_code: String(o.id),

    shipment_value: isCOD(o) ? o.total_price : 0,
    money_return: isCOD(o) ? "1" : "0",

    payer: "sender",
    payment_type: isCOD(o) ? "cash" : "account",

    content: o.line_items.map(i => ({
      pack_type: "collete",
      weight: i.grams ? i.grams / 1000 : 1,
      volume: 0
    }))
  }

  console.log("SENDING:", shipment)

  try {
    const response = await axios.post(
      CONFIG.apiUrl,
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

    console.log("DELIVERY RESPONSE:", response.data)

  } catch (e) {
    console.error("DELIVERY ERROR:", e.response?.data || e.message)
  }

  res.sendStatus(200)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
