console.log('index.js is being called');
const express = require("express");
const session = require('express-session');
const https = require('https');
const { stringify } = require("querystring");

const PORT = process.env.PORT || 3000;



const app = express();
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(express.static(__dirname + '/js'));

let sess;
app.get('/', (req, res) => {
  res.sendFile(__dirname +  '/index.html');
});

app.post("/orders", (req, res) => {
  console.log('inside order creation server side');
  const item_obj = {
    "intent" : "CAPTURE",
    "purchase_units" : [ 
        {
            "reference_id" : "ABC",
            "description" : "Chess Board",
            "amount" : {
                "currency_code" : "USD",
                "value" : "25",
                "breakdown" : {
                    "item_total" : {
                        "currency_code" : "USD",
                        "value" : "25",
                    }
                }
            },
            "items" : [{
                "name" : "Chess Board",
                "description" : "Wooden Chess Board",
                "sku" : "sku01",
                "unit_amount" : {
                    "currency_code" : "USD",
                     "value" : "25",
                },
                "quantity" : "1",
                "category" : "PHYSICAL_GOODS"
            }]
        }
    ]
  };

  create_order(item_obj).then((response) => {
    console.log("response.id: " + response.id);
    sess.order_id = response.id;
    res.send(response);
  });
});

const create_order = (item_obj) => {
  return new Promise(resolve => {
    get_access_token().then((access_token) => {
      console.log('access token'+access_token);
    const options = {
      hostname: 'api.sandbox.paypal.com',
      path: '/v2/checkout/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }
    const my_callback = function(res){

      let str='';

      res.on('data',function(chunk){
          str+=chunk;
      });

      res.on('end',function(){
         let obj=JSON.parse(str);
         console.log("logging here create order response"+JSON.stringify(obj));
         resolve(obj);
      });
      
    }
    let request = https.request(options,my_callback);
    request.write(JSON.stringify(item_obj));
    request.end();
    
  });

  });
};

const get_oauth = () => {
  return new Promise(resolve => {
      console.log('In Auth');
      const data = 'grant_type=client_credentials';

      const options = {
        hostname: 'api.sandbox.paypal.com',
        path: '/v1/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length,
          'Authorization': 'Basic ' + Buffer.from('AQ5A5s5kavR8FYH9DHdbsj3sYXga8ydPgFRRDkd-zY-lsSWIlROPtQ4aGkSkIy9UH5bLd-KOuCUGVcLN:EN8SZ4DJkRByueBAuF-1f2hVBEKazQvJKoBILwoPcNkuiXPCUGZqJ0e1CCzT4nLGhTNKqwsfw1ZgAdyP').toString('base64')
        }
      }
      const my_callback = function(res){

        let str='';

        res.on('data',function(chunk){
            str+=chunk;
        });

        res.on('end',function(){
            obj=JSON.parse(str);
            console.log("logging here get access token"+JSON.stringify(obj));
            resolve(obj);
        });
      }
      let request = https.request(options, my_callback);
      request.write(data);
      request.end();

    });
};
const get_access_token = () => {
  return new Promise(resolve => {
    get_oauth().then((response) => {
      resolve(response.access_token);
    });
  });
};
    
  app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
