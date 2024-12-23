const express = require("express");
const {
  addToListA,
  getAllListA,
  getLink,
  updateProfile,
  getProfile,
  verify,verified,isLinkGenerated,
  isLinkVerfied,
  copyText
} = require("../Controllers/listAController");
const router = express.Router();

router.post("/register", addToListA);
router.get("/list", getAllListA);
router.get("/profile", getProfile);
router.put("/update-profile", updateProfile);
router.get("/link", getLink);
router.get("/isVerify",verify);
router.post("/verify",verified);
router.get("/linkGenarated",isLinkGenerated)
router.post("/linkverify",isLinkVerfied)
router.get("/CopyAD",copyText)
module.exports = router;
