const express    = require("express")
const router     = express.Router()
const optAuth    = require("../middleware/optionalAuth")
const auth       = require("../middleware/auth")
const Activity   = require("../Controller/ActivityController")

router.post("/", optAuth, Activity.log)
router.get("/",  auth,    Activity.list)

module.exports = router
