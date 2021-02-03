const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const proxy = require('http-proxy-middleware');

const indexRouter = require('./routes/index');

const app = express();

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
