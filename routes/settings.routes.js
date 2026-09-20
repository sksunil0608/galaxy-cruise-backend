const router = require("express").Router()
const ctrl = require("../Controller/SettingsController")
const auth = require("../middleware/auth")
const permission = require("../middleware/permission")

// Any signed-in dashboard user needs to READ the scraper URL (every scraper
// action in the UI depends on it), but changing where the app points is an
// admin-level action.
router.get("/", auth, ctrl.listSettings)
router.put("/:key", auth, permission("settings.manage"), ctrl.updateSetting)

module.exports = router
