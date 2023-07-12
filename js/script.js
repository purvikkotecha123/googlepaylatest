console.log('hello from script.js');
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
    console.log('merchantInfo'+JSON.stringify(merchantInfo));
    console.log('allowedPaymentMethods'+JSON.stringify(allowedPaymentMethods));
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
      console.log('paymentDataRequest'+JSON.stringify(paymentDataRequest));
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
          price: "45.00",
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
      totalPrice: "55.00",
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
   /* Create Order on the Server Side */
        const orderResonse = await fetch(`/orders`,{
          method:'POST',
          headers : {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        })
        
        if(!orderResonse.ok) {
            throw new Error("error creating order")
        }

        const { id } = await orderResonse.json()
        console.log({ id })
      const { status } = await paypal.Googlepay().confirmOrder({
        orderId: id,
        paymentMethodData: paymentData.paymentMethodData,
      });
         console.log({ status })
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
