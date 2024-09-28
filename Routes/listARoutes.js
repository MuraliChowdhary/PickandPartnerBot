const express = require('express');
const { addToListA, getAllListA,getLink } = require('../Controllers/listAController');
const router = express.Router();

router.post('/register', addToListA);
router.get('/list', getAllListA);
router.get('/link',getLink)
module.exports = router;
