const express  = require("express")
const router = express.Router()
const {userjoinedController} = require("../Controllers/WebhookNotifier")
router.post("/user-joined",userjoinedController)


module.exports = router