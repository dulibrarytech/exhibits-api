/**
 * Exhibits client api
 * /repository 
 * Interface for elastic search api
 */

const router = require('express').Router();
const controller = require('./controller');

router.get('/', (req, res) => {
    res.sendStatus(403);
});

module.exports = router;