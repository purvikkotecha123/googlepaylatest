console.log('index.js is being called');
const express = require("express");
const session = require('express-session');
const https = require('https');
const { stringify } = require("querystring");
const axios = require("axios");

const PORT = process.env.PORT || 3000;



const app = express();
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(express.static(__dirname + '/js'));

let sess;
app.get('/', (req, res) => {
  res.sendFile(__dirname +  '/index.html');
});

app.post("/orders", async (req, res) => {
  console.log('testing in create order');
  const order = req.body || {
    "intent": "CAPTURE",
    "purchase_units": [
        {
            "amount": {
                "currency_code": "USD",
                "value": "55.00",
                "breakdown": {
                    "item_total": {
                        "currency_code": "USD",
                        "value": "45.00"
                    },
                    "shipping": {
                        "currency_code": "USD",
                        "value": "0"
                    },
                    "handling": {
                        "currency_code": "USD",
                        "value": "0"
                    },
                    "tax_total": {
                        "currency_code": "USD",
                        "value": "10"
                    },
                    "shipping_discount": {
                        "currency_code": "USD",
                        "value": "0"
                    }
                }
            },
            "items": [
                {
                    "name": "Moto G Mobile",
                    "description": "Item no. 1",
                    "sku": "259480034816",
                    "unit_amount": {
                        "currency_code": "USD",
                        "value": "30.00"
                    },
                    "tax": {
                        "currency_code": "USD",
                        "value": "0"
                    },
                    "quantity": "1",
                    "category": "PHYSICAL_GOODS"
                },
                {
                    "name": "Redmi Note-4 mobile",
                    "description": "Item no. 2",
                    "sku": "259480034816",
                    "unit_amount": {
                        "currency_code": "USD",
                        "value": "15.00"
                    },
                    "tax": {
                        "currency_code": "USD",
                        "value": "0"
                    },
                    "quantity": "1",
                    "category": "PHYSICAL_GOODS"
                }
            ],
            "payee": {
                "email_address": "gpay_mer1r@busines.com"
            }
        }
    ],
    "payment_source": {
        "google_pay": {
            "name": "Test Buyer",
            "phone_number": {
                "country_code": "1",
                "national_number": "18882211161"
            },
            "shipping": {
                "name": {
                    "full_name": "Test Buyer"
                },
                "address": {
                    "address_line_1": "2211 Louis Henna Blvd",
                    "address_line_2": "102gf",
                    "admin_area_1": "CA",
                    "admin_area_2": "San Jose",
                    "postal_code": "95131",
                    "country_code": "US"
                }
            },
            "decrypted_token": {
                "message_id": "cJpaRj8xrSaDA0G37wP6VF9ZC",
                "message_expiration": "1979502243000",
                "payment_method": "CARD",
                "card": {
                    "name": "Randy Ascar",
                    "number": "4000000000001091",
                    "expiry": "2025-01",
                    "brand": "VISA",
                    "last_digits": "1091",
                    "billing_address": {
                        "address_line_1": "2211 Louis Henna Blvd",
                        "address_line_2": "102gf",
                        "admin_area_1": "CA",
                        "admin_area_2": "San Jose",
                        "postal_code": "95131",
                        "country_code": "US"
                    }
                },
                "authentication_method": "CRYPTOGRAM_3DS",
                "cryptogram": "SaDA0Gw9cR37j8xrZP6VFCJpa",
                "eci_indicator": "07"
            },
            "assurance_details": {
                "account_verified": true,
                "card_holder_authenticated": false
            },
            "attributes": {
                "verification": {
                    "method": "SCA_ALWAYS"
                }
            }
        }
    }
};

  try {

    const { data } = await axios({
      url: `https://api.sandbox.paypal.com/v2/checkout/orders`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer A21AALg2WuEie_4XgSYrVkEA5LPP1IJaMt0idChNFR0MOkCrqaHu88d8PurSkKvmjhgXV-RoYsFvmWAhlTzZ7Lbrx6seZqcgA`,
      },
      data: {...order}
    });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.json({
      msg: err.message,
      details: err.toString(),
      body: req.body,
    });
  }
});

app.post("/orders/:orderId/capture", async (req, res) => {

	const {
		orderId
	} = req.params;


	const {
		data,
		headers
	} = await axios({
		url: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
		method: "post",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Prefer: 'return=representation',
			Authorization: `Bearer A21AALg2WuEie_4XgSYrVkEA5LPP1IJaMt0idChNFR0MOkCrqaHu88d8PurSkKvmjhgXV-RoYsFvmWAhlTzZ7Lbrx6seZqcgA`,
		},
	});

	const debugID = headers["paypal-debug-id"];

	res.json({
		debugID,
		...data
	});
});
    
  app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
