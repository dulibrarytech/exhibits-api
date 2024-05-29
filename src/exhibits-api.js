const app = require('./app');

const port = process.env.PORT || 5678;

app.listen(port, () => {
  console.log(`Exhibits API is running on port ${port} in ${process.env.NODE_ENV} mode`);
});