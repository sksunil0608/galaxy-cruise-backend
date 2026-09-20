const prisma = require("../Utils/prisma")

// Only these keys are writable through the API — an open key/value endpoint
// would let anyone with dashboard access stash arbitrary rows here.
const ALLOWED_KEYS = {
  scraperUrl: {
    label: "Scraper backend URL",
    // Reject anything that isn't an absolute http(s) origin: the frontend
    // concatenates this with paths like `/api/scrapers/...`, so a relative or
    // malformed value silently breaks every scraper action.
    validate: value => {
      if (typeof value !== "string" || value.trim() === "") {
        return "URL is required"
      }
      let parsed
      try {
        parsed = new URL(value.trim())
      } catch {
        return "Must be a valid absolute URL, e.g. https://scraper.example.com"
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "URL must start with http:// or https://"
      }
      return null
    },
    // Strip any trailing slash so callers can always append "/api/..." safely.
    normalize: value => value.trim().replace(/\/+$/, "")
  }
}

exports.listSettings = async (req, res) => {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: Object.keys(ALLOWED_KEYS) } }
    })

    const byKey = Object.fromEntries(rows.map(r => [r.key, r]))

    const data = Object.entries(ALLOWED_KEYS).map(([key, def]) => ({
      key,
      label: def.label,
      value: byKey[key]?.value ?? null,
      updatedAt: byKey[key]?.updatedAt ?? null
    }))

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params
    const def = ALLOWED_KEYS[key]

    if (!def) {
      return res.status(400).json({
        success: false,
        error: `Unknown setting "${key}"`
      })
    }

    const rawValue = req.body?.value
    const validationError = def.validate(rawValue)
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError })
    }

    const value = def.normalize(rawValue)

    const saved = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })

    res.json({
      success: true,
      data: { key: saved.key, label: def.label, value: saved.value, updatedAt: saved.updatedAt }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
