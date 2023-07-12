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
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "GBP",
          value: "110",
        },
        payee: {
          merchant_id: "HPGAPD52A93QN"
        }
      },
    ],
  };

  try {

    const { data } = await axios({
      url: `https://api.sandbox.paypal.com/v2/checkout/orders`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer A21AAJ6NX12qVR703S235Ms46x-eOBYgJ4Qf74wKPxHJx_uk_vqnS4XqfFyf9-7UQ5XSEY86kPJexx6H9__GmCvz2LDNk-L2g`,
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
			Authorization: `Bearer A21AAJ6NX12qVR703S235Ms46x-eOBYgJ4Qf74wKPxHJx_uk_vqnS4XqfFyf9-7UQ5XSEY86kPJexx6H9__GmCvz2LDNk-L2g`,
		},
	});

	const debugID = headers["paypal-debug-id"];

	res.json({
		debugID,
		...data
	});
});
    
  app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
