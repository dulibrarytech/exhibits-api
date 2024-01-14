const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

const api = require('./api');
const { notFound, errorHandler } = require('./middlewares/errors.middleware');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/public'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'public', 'index.html'));
  });
}

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
