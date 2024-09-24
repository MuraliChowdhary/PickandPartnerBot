const express = require('express');
const { addToListA, getAllListA } = require('../Controllers/listAController');
const router = express.Router();

router.post('/register', addToListA);
router.get('/list', getAllListA);

module.exports = router;
