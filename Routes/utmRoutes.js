const express = require("express");
const { createUTM, trackUTM } = require("../Controllers/utmTrackingController");
const router = express.Router();

router.post("/create", createUTM);
router.post("/track-click", trackUTM);

module.exports = router;
