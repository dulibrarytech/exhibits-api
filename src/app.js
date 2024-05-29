const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

const api = require('./api');
const { notFound, errorHandler } = require('./middlewares/errors.middleware');

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendStatus(403)
});

app.use('/api/v1', api);
app.use(notFound);
app.use(errorHandler);

// TODO add api key verification

module.exports = app;
