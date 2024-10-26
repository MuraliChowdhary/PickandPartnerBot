const express = require("express");
const { addToListB, getAllListB } = require("../Controllers/listBController");
const router = express.Router();

router.post("/register", addToListB);
router.get("/", getAllListB);

module.exports = router;
