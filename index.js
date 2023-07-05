
const express = require("express");
const session = require('express-session');
const https = require('https');
const { stringify } = require("querystring");
const cors = require('cors');

const PORT = process.env.PORT || 3000;



const app = express();
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(express.urlencoded({
  extended: true
}));
app.use(cors(corsOptions));

let sess;
app.get('/', (req, res) => {
  sess = req.session;
  sess.order_id;
  res.sendFile(__dirname +  '/index.html');
});
/*
 * Define the version of the Google Pay API referenced when creating your
 * configuration
 */
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
  };
  let paymentsClient = null,
    allowedPaymentMethods = null,
    merchantInfo = null;
  /* Configure your site's support for payment methods supported by the Google Pay */
  function getGoogleIsReadyToPayRequest(allowedPaymentMethods) {
    return Object.assign({}, baseRequest, {
      allowedPaymentMethods: allowedPaymentMethods,
    });
  }
  /* Fetch Default Config from PayPal via PayPal SDK */
  async function getGooglePayConfig() {
    if (allowedPaymentMethods == null || merchantInfo == null) {
      const googlePayConfig = await paypal.Googlepay().config();
      allowedPaymentMethods = googlePayConfig.allowedPaymentMethods;
      merchantInfo = googlePayConfig.merchantInfo;
    }
    return {
      allowedPaymentMethods,
      merchantInfo,
    };
  }
  /* Configure support for the Google Pay API */
  async function getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, baseRequest);
    const { allowedPaymentMethods, merchantInfo } = await getGooglePayConfig();
    paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = merchantInfo;
    paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
    return paymentDataRequest;
  }
  function onPaymentAuthorized(paymentData) {
    return new Promise(function (resolve, reject) {
      processPayment(paymentData)
        .then(function (data) {
          resolve({ transactionState: "SUCCESS" });
        })
        .catch(function (errDetails) {
          resolve({ transactionState: "ERROR" });
        });
    });
  }
  function getGooglePaymentsClient() {
    if (paymentsClient === null) {
      paymentsClient = new google.payments.api.PaymentsClient({
        environment: "TEST",
        paymentDataCallbacks: {
          onPaymentAuthorized: onPaymentAuthorized,
        },
      });
    }
    return paymentsClient;
  }
  async function onGooglePayLoaded() {
    const paymentsClient = getGooglePaymentsClient();
    const { allowedPaymentMethods } = await getGooglePayConfig();
    paymentsClient
      .isReadyToPay(getGoogleIsReadyToPayRequest(allowedPaymentMethods))
      .then(function (response) {
        if (response.result) {
          addGooglePayButton();
        }
      })
      .catch(function (err) {
        console.error(err);
      });
  }
  function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    const button = paymentsClient.createButton({
      onClick: onGooglePaymentButtonClicked,
    });
    document.getElementById("button-container").appendChild(button);
  }
  function getGoogleTransactionInfo() {
    return {
      displayItems: [
        {
          label: "Subtotal",
          type: "SUBTOTAL",
          price: "100.00",
        },
        {
          label: "Tax",
          type: "TAX",
          price: "10.00",
        },
      ],
      countryCode: "US",
      currencyCode: "USD",
      totalPriceStatus: "FINAL",
      totalPrice: "110.00",
      totalPriceLabel: "Total",
    };
  }
  async function onGooglePaymentButtonClicked() {
    const paymentDataRequest = await getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest);
  }
  async function processPayment(paymentData) {
    try {
      const { currencyCode, totalPrice } = getGoogleTransactionInfo();
      const order = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currencyCode,
              value: totalPrice,
            },
          },
        ],
      };
      /* Create Order */
      const { id } = await fetch(`/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      }).then((res) => res.json());
      const { status } = await paypal.Googlepay().confirmOrder({
        orderId: id,
        paymentMethodData: paymentData.paymentMethodData,
      });
      if (status === "APPROVED") {
        /* Capture the Order */
        const captureResponse = await fetch(`/orders/${id}/capture`, {
          method: "POST",
        }).then((res) => res.json());
        return { transactionState: "SUCCESS" };
      } else {
        return { transactionState: "ERROR" };
      }
    } catch (err) {
      return {
        transactionState: "ERROR",
        error: {
          message: err.message,
        },
      };
    }
  }
    
  app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
