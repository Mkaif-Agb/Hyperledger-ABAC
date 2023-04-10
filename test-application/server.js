const express = require('express');
const mongoose = require('mongoose');
const route = require('./routes');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var cron = require('node-cron');

// const {call} = require('./cron');

//Connection
mongoose.connect('mongodb://localhost:27017/hlf');
console.log("Connection Successful");


// MiddleWare
const app = express()
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(route)


app.listen(3000, ()=>{
    console.log('Server running on port 3000');
})