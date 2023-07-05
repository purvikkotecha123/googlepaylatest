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

    
  app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
