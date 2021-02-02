var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const proxy = require('http-proxy-middleware');

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const apiProxy = proxy.createProxyMiddleware({ target: 'http://www.cykel-abc.dk', changeOrigin: true });
app.use('/images', apiProxy);
app.use('/grafik', apiProxy);
app.use('/usergallery', apiProxy);

app.use(indexRouter);

module.exports = app;
