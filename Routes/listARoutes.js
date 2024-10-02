const express = require("express");
const {
  addToListA,
  getAllListA,
  getLink,
  updateProfile,
  getProfile,
} = require("../Controllers/listAController");
const router = express.Router();

router.post("/register", addToListA);
router.get("/list", getAllListA);
router.get("/profile", getProfile);
router.put("/update-profile", updateProfile);
router.get("/link", getLink);
module.exports = router;
