const prisma = require("../Utils/prisma")
const {
  parsePagination,
  buildPaginationMeta
} = require("../Utils/pagination")

// Mirrors scrapper-backend/services/staticItineraryService.js's
// normalizeShip/normalizePort — kept in sync manually since the two apps
// don't share a module. Only used here to preview what a saved row's
// shipKey/routeKey will be; the scraper is the source of truth for matching.
const normalizeShip = value =>
  String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

const normalizePortRaw = value =>
  String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

const normalizeString = value => {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeInteger = value => {
  if (value === undefined || value === null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

const mapItinerary = row => ({
  id: row.id,
  shipName: row.shipName,
  shipKey: row.shipKey,
  portFrom: row.portFrom,
  portTo: row.portTo,
  routeKey: row.routeKey,
  stops: Array.isArray(row.stops) ? row.stops : [],
  nights: row.nights,
  dealsLink: row.dealsLink,
  price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
})

const mapAlias = row => ({
  id: row.id,
  aliasKey: row.aliasKey,
  canonical: row.canonical,
  note: row.note,
  createdAt: row.createdAt
})

function buildItineraryData(body) {
  const shipName = normalizeString(body.shipName)
  const portFrom = normalizeString(body.portFrom)
  const portTo = normalizeString(body.portTo)
  const stops = Array.isArray(body.stops)
    ? body.stops.map(s => normalizeString(s)).filter(Boolean)
    : String(body.stops ?? "").split(",").map(s => normalizeString(s)).filter(Boolean)

  return {
    shipName,
    shipKey: normalizeShip(shipName),
    portFrom,
    portTo,
    routeKey: `${normalizePortRaw(portFrom)}|${normalizePortRaw(portTo)}`,
    stops,
    nights: normalizeInteger(body.nights),
    dealsLink: normalizeString(body.dealsLink),
    price: body.price !== undefined && body.price !== null && body.price !== ""
      ? Number(body.price)
      : null
  }
}

// ── StaticItinerary CRUD ────────────────────────────────────────────────────

exports.listItineraries = async (req, res) => {
  try {
    const where = {}
    const search = normalizeString(req.query.search)

    if (search) {
      where.OR = [
        { shipName: { contains: search } },
        { portFrom: { contains: search } },
        { portTo: { contains: search } }
      ]
    }

    const { page, limit, skip } = parsePagination(req.query, {
      page: 1,
      limit: 50,
      maxLimit: 200
    })

    const [total, rows] = await Promise.all([
      prisma.staticItinerary.count({ where }),
      prisma.staticItinerary.findMany({
        where,
        orderBy: { shipName: "asc" },
        skip,
        take: limit
      })
    ])

    res.json({
      success: true,
      count: rows.length,
      pagination: buildPaginationMeta(total, page, limit),
      data: rows.map(mapItinerary)
    })
  } catch (err) {
    console.error("ITINERARY LIST ERROR:", err)
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.createItinerary = async (req, res) => {
  try {
    const data = buildItineraryData(req.body)

    if (!data.shipName || data.stops.length === 0) {
      return res.status(400).json({
        success: false,
        error: "shipName and at least one stop are required"
      })
    }

    const row = await prisma.staticItinerary.create({ data })

    res.status(201).json({ success: true, data: mapItinerary(row) })
  } catch (err) {
    console.error("ITINERARY CREATE ERROR:", err)
    res.status(400).json({ success: false, error: err.message })
  }
}

exports.updateItinerary = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const data = buildItineraryData(req.body)

    if (!data.shipName || data.stops.length === 0) {
      return res.status(400).json({
        success: false,
        error: "shipName and at least one stop are required"
      })
    }

    const row = await prisma.staticItinerary.update({
      where: { id },
      data
    })

    res.json({ success: true, data: mapItinerary(row) })
  } catch (err) {
    console.error("ITINERARY UPDATE ERROR:", err)
    res.status(400).json({ success: false, error: err.message })
  }
}

exports.removeItinerary = async (req, res) => {
  try {
    await prisma.staticItinerary.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: "Itinerary deleted" })
  } catch (err) {
    console.error("ITINERARY DELETE ERROR:", err)
    res.status(400).json({ success: false, error: err.message })
  }
}

// ── PortAlias CRUD ───────────────────────────────────────────────────────────

exports.listPortAliases = async (req, res) => {
  try {
    const where = {}
    const search = normalizeString(req.query.search)

    if (search) {
      where.OR = [
        { aliasKey: { contains: search } },
        { canonical: { contains: search } }
      ]
    }

    const rows = await prisma.portAlias.findMany({
      where,
      orderBy: { aliasKey: "asc" }
    })

    res.json({ success: true, count: rows.length, data: rows.map(mapAlias) })
  } catch (err) {
    console.error("PORT ALIAS LIST ERROR:", err)
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.createPortAlias = async (req, res) => {
  try {
    const aliasKey = normalizePortRaw(req.body.aliasKey)
    const canonical = normalizePortRaw(req.body.canonical)
    const note = normalizeString(req.body.note)

    if (!aliasKey || !canonical) {
      return res.status(400).json({
        success: false,
        error: "aliasKey and canonical are required"
      })
    }

    const row = await prisma.portAlias.create({
      data: { aliasKey, canonical, note }
    })

    res.status(201).json({ success: true, data: mapAlias(row) })
  } catch (err) {
    console.error("PORT ALIAS CREATE ERROR:", err)
    res.status(400).json({ success: false, error: err.message })
  }
}

exports.updatePortAlias = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const canonical = normalizePortRaw(req.body.canonical)
    const note = normalizeString(req.body.note)

    if (!canonical) {
      return res.status(400).json({
        success: false,
        error: "canonical is required"
      })
    }

    const row = await prisma.portAlias.update({
      where: { id },
      data: { canonical, note }
    })

    res.json({ success: true, data: mapAlias(row) })
  } catch (err) {
    console.error("PORT ALIAS UPDATE ERROR:", err)
    res.status(400).json({ success: false, error: err.message })
  }
}

exports.removePortAlias = async (req, res) => {
  try {
    await prisma.portAlias.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: "Port alias deleted" })
  } catch (err) {
    console.error("PORT ALIAS DELETE ERROR:", err)
    res.status(400).json({ success: false, error: err.message })
  }
}
