const router = require('express').Router();
const exhibit = require('./exhibit/routes');
const search = require('./search/routes');
// const resource = require('./resource/routes');
// const repository = require('./repository/routes');

router.get('/', (req, res) => {
  //res.sendStatus(403);
  res.status(403).send("root") // temp
});

router.use('/exhibit', exhibit);
router.use('/search', search);

module.exports = router;
