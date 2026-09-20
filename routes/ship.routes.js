const router = require("express").Router()
const ShipController = require("../Controller/ShipController")
const auth = require("../middleware/auth")
const permission = require("../middleware/permission")

router.get("/", auth, permission("ships.view"), ShipController.list)
router.get("/:code", auth, permission("ships.view"), ShipController.getOne)
router.post("/", auth, permission("ships.create"), ShipController.create)
router.put("/:code", auth, permission("ships.update"), ShipController.update)
router.post("/:code/decks", auth, permission("ships.update"), ShipController.createDeck)
router.put("/:code/decks/:deckId", auth, permission("ships.update"), ShipController.updateDeck)
router.delete("/:code/decks/:deckId", auth, permission("ships.update"), ShipController.removeDeck)
router.delete("/:code", auth, permission("ships.delete"), ShipController.remove)

module.exports = router
