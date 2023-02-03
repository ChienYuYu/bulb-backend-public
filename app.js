require('dotenv').config();
const express = require('express');
const app = express();
const customerAPI = require('./routes/customerAPI');
const orderAPI = require('./routes/orderAPI');
const adminAPI = require('./routes/adminAPI');
const session = require('express-session');
const MemoryStore = require('memorystore')(session) // 20230201
const cors = require('cors');
const webUrl = process.env.ORIGIN || process.env.DEV

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: process.env.MY_SESSION_SECRETKEY,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'true' , sameSite: 'None', httpOnly: true, maxAge: 86400000, }, 
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
}));

app.use(cors({
  origin: webUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/customer', customerAPI);
app.use('/order', orderAPI);
app.use('/admin', adminAPI)


// 測試頁 -----------------------------------
app.get('/', async (req, res) => {
  res.send('看到此畫面表示連線正常...')
})

module.exports = app;
