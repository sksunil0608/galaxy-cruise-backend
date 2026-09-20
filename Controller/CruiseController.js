const prisma = require("../Utils/prisma")
const {
  parsePagination,
  buildPaginationMeta
} = require("../Utils/pagination")

const GROUP_ORDER = ["Suite", "Balcony", "Outside", "Inside", "Other"]

function mapCategoryToGroup(code) {
  if (!code) return "Other"
  const c = String(code).toUpperCase()
  if (c.startsWith("H")) return "Suite"
  if (c.startsWith("S")) return "Suite"
  if (c.startsWith("M")) return "Balcony"
  if (c.startsWith("B")) return "Balcony"
  if (c.startsWith("O")) return "Outside"
  if (c.startsWith("I")) return "Inside"
  return "Other"
}

function buildCabinGroups(categories = []) {
  const groupMap = new Map()

  for (const cat of categories) {
    const group = mapCategoryToGroup(cat.code)
    if (!groupMap.has(group)) groupMap.set(group, [])
    groupMap.get(group).push(cat)
  }

  const result = []
  for (const groupName of GROUP_ORDER) {
    if (!groupMap.has(groupName)) continue
    const cats = groupMap.get(groupName)
    const prices = cats
      .filter(c => c.avlResult === "OK")
      .map(c => Number(c.cabinPrice ?? 0))
      .filter(p => Number.isFinite(p) && p > 0)
    result.push({
      group: groupName,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      categories: cats
    })
  }

  for (const [groupName, cats] of groupMap) {
    if (GROUP_ORDER.includes(groupName)) continue
    const prices = cats
      .filter(c => c.avlResult === "OK")
      .map(c => Number(c.cabinPrice ?? 0))
      .filter(p => Number.isFinite(p) && p > 0)
    result.push({
      group: groupName,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      categories: cats
    })
  }

  return result
}

const pickShipDetails = (payload = {}) => ({
  image: payload.image ?? null,
  cabins: payload.cabins ?? null,
  restaurants: payload.restaurants ?? null,
  bars: payload.bars ?? null,
  pools: payload.pools ?? null,
  jacuzzis: payload.jacuzzis ?? null,
  guests: payload.guests ?? null,
  crew: payload.crew ?? null,
  balconyCabins: payload.balconyCabins ?? null,
  suites: payload.suites ?? null,
  spa: payload.spa ?? null
})

const toNumberOrNull = value =>
  value === null || value === undefined ? null : Number(value)

const mapTagForResponse = tag => ({
  id: tag.id,
  label: tag.label,
  assignedTo: tag.assignedTo,
  note: tag.note,
  color: tag.color,
  trackedLowestPrice: toNumberOrNull(tag.trackedLowestPrice),
  lastSeenPrice: toNumberOrNull(tag.lastSeenPrice),
  lastPriceDropAt: tag.lastPriceDropAt,
  lastNotifiedPrice: toNumberOrNull(tag.lastNotifiedPrice),
  categorySnapshot: tag.categorySnapshot ?? null,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt
})

const mapAlertForResponse = alert => ({
  id: alert.id,
  cruiseTagId: alert.cruiseTagId,
  cruiseCode: alert.cruise?.code ?? null,
  cruisePackage: alert.cruise?.package ?? null,
  ship: alert.cruise?.ship ?? null,
  vendor: alert.cruise?.vendor
    ? {
        id: alert.cruise.vendor.id,
        name: alert.cruise.vendor.name,
        slug: alert.cruise.vendor.slug
      }
    : null,
  tag: alert.cruiseTag
    ? {
        id: alert.cruiseTag.id,
        label: alert.cruiseTag.label,
        assignedTo: alert.cruiseTag.assignedTo,
        color: alert.cruiseTag.color
      }
    : null,
  previousPrice: toNumberOrNull(alert.previousPrice),
  currentPrice: toNumberOrNull(alert.currentPrice),
  currency: alert.currency,
  status: alert.status,
  emailSent: alert.emailSent,
  emailSentAt: alert.emailSentAt,
  readAt: alert.readAt,
  createdAt: alert.createdAt
})

function getCruiseLowestPrice(cruise) {
  const availablePrices = (cruise?.cabinCategories ?? [])
    .filter(category => category?.avlResult === "OK")
    .map(category => Number(category?.cabinPrice ?? 0))
    .filter(value => Number.isFinite(value) && value > 0)

  if (availablePrices.length === 0) {
    return null
  }

  return Math.min(...availablePrices)
}

const mapCabinForWrite = cabin => ({
  code: cabin.code,
  name: cabin.name,
  group: cabin.group ?? mapCategoryToGroup(cabin.code),
  status: cabin.status,
  avlResult: cabin.avlResult,
  totalCabins: cabin.totalCabins ?? cabin.total ?? null,
  available: cabin.avail ?? cabin.available ?? null,
  cabinPrice: cabin.cabinPrice,
  perPersonPrice: cabin.perPersonPrice,
  capacity: cabin.capacity,
  trend: cabin.trend,
  confidence: cabin.confidence,
  promotions: {
    create: (cabin.promos ?? []).map(name => ({ name }))
  }
})

const mapCruiseForWrite = (cruise, vendorId, shipId) => ({
  code: cruise.id ?? cruise.code,
  vendorId,
  shipId,
  ship: cruise.ship,
  shipCode: cruise.shipCode,
  cruiseLine: cruise.cruiseLine,
  package: cruise.package,
  routeLabel: cruise.routeLabel,
  portFrom: cruise.portFrom,
  portTo: cruise.portTo,
  nights: cruise.nights,
  startDate: cruise.startDate ? new Date(cruise.startDate) : null,
  endDate: cruise.endDate ? new Date(cruise.endDate) : null,
  trend: cruise.trend,
  confidence: cruise.confidence,
  pinned: Boolean(cruise.pinned),
  currency: cruise.currency
})

const mapCabinForResponse = category => ({
  code: category.code,
  name: category.name,
  group: category.group ?? mapCategoryToGroup(category.code),
  status: category.status,
  avlResult: category.avlResult,
  totalCabins: category.totalCabins,
  avail: category.available,
  available: category.available,
  cabinPrice: Number(category.cabinPrice ?? 0),
  perPersonPrice: Number(category.perPersonPrice ?? 0),
  capacity: category.capacity,
  trend: category.trend,
  confidence: category.confidence,
  promos: (category.promotions ?? []).map(promotion => promotion.name)
})

const mapCruiseForResponse = cruise => {
  const cabinCategories = cruise.cabinCategories.map(mapCabinForResponse)
  return {
  id: cruise.code,
  ship: cruise.ship,
  shipCode: cruise.shipCode,
  cruiseLine: cruise.cruiseLine,
  package: cruise.package,
  portFrom: cruise.portFrom,
  portTo: cruise.portTo,
  routeLabel: cruise.routeLabel,
  nights: cruise.nights,
  startDate: cruise.startDate,
  endDate: cruise.endDate,
  trend: cruise.trend,
  confidence: cruise.confidence,
  pinned: cruise.pinned,
  currency: cruise.currency,
  tags: (cruise.tags ?? []).map(tag => ({
    ...mapTagForResponse(tag)
  })),
  lowestPrice: getCruiseLowestPrice(cruise),
  vendor: cruise.vendor
    ? {
        id: cruise.vendor.id,
        name: cruise.vendor.name,
        slug: cruise.vendor.slug,
        url: cruise.vendor.url
      }
    : null,
  promotions: (cruise.promotions ?? []).map(promotion => promotion.name),
  shipDetails: cruise.shipRef
    ? {
        code: cruise.shipRef.code,
        name: cruise.shipRef.name,
        image: cruise.shipRef.image,
        cabins: cruise.shipRef.cabins,
        restaurants: cruise.shipRef.restaurants,
        bars: cruise.shipRef.bars,
        pools: cruise.shipRef.pools,
        jacuzzis: cruise.shipRef.jacuzzis,
        guests: cruise.shipRef.guests,
        crew: cruise.shipRef.crew,
        balconyCabins: cruise.shipRef.balconyCabins,
        suites: cruise.shipRef.suites,
        spa: cruise.shipRef.spa
      }
    : null,
  itineraryStops: (cruise.itineraryStops ?? [])
    .sort((a, b) => (a.order ?? a.day ?? 0) - (b.order ?? b.day ?? 0))
    .map(s => ({
      day: s.day,
      date: s.date,
      time: s.time,
      activity: s.activity,
      port: s.port,
      country: s.country
    })),
  cabinCategories,
  cabinGroups: buildCabinGroups(cabinCategories),
  cabinsUpdatedAt: cruise.cabinsUpdatedAt ?? null,
  updatedAt: cruise.updatedAt ?? null,
  createdAt: cruise.createdAt ?? null
  }
}

const mapCruiseSummaryForResponse = cruise => ({
  id: cruise.code,
  ship: cruise.ship,
  shipCode: cruise.shipCode,
  cruiseLine: cruise.cruiseLine,
  package: cruise.package,
  portFrom: cruise.portFrom,
  portTo: cruise.portTo,
  routeLabel: cruise.routeLabel,
  nights: cruise.nights,
  startDate: cruise.startDate,
  endDate: cruise.endDate,
  trend: cruise.trend,
  confidence: cruise.confidence,
  pinned: cruise.pinned,
  currency: cruise.currency,
  tags: (cruise.tags ?? []).map(tag => ({
    ...mapTagForResponse(tag)
  })),
  lowestPrice: getCruiseLowestPrice(cruise),
  vendor: cruise.vendor
    ? {
        id: cruise.vendor.id,
        name: cruise.vendor.name,
        slug: cruise.vendor.slug,
        url: cruise.vendor.url
      }
    : null,
  cabinsUpdatedAt: cruise.cabinsUpdatedAt ?? null,
  updatedAt: cruise.updatedAt ?? null,
  createdAt: cruise.createdAt ?? null
})

function buildCruiseWhere(query = {}) {
  const where = {}

  if (query.vendorId) {
    where.vendorId = Number(query.vendorId)
  }

  if (query.shipCode) {
    where.shipCode = query.shipCode
  }

  if (query.ship) {
    where.ship = {
      contains: String(query.ship).trim()
    }
  }

  if (query.vendorName) {
    where.vendor = {
      name: {
        contains: String(query.vendorName).trim()
      }
    }
  }

  if (query.cruiseLine) {
    where.cruiseLine = query.cruiseLine
  }

  if (query.nights) {
    where.nights = Number(query.nights)
  }

  if (query.portFrom) {
    where.portFrom = query.portFrom
  }

  if (query.portTo) {
    where.portTo = query.portTo
  }

  if (query.route) {
    where.routeLabel = query.route
  }

  if (query.startDateFrom || query.startDateTo) {
    where.startDate = {}

    if (query.startDateFrom) {
      where.startDate.gte = new Date(query.startDateFrom)
    }

    if (query.startDateTo) {
      where.startDate.lte = new Date(query.startDateTo)
    }
  }

  if (query.endDateFrom || query.endDateTo) {
    where.endDate = {}

    if (query.endDateFrom) {
      where.endDate.gte = new Date(query.endDateFrom)
    }

    if (query.endDateTo) {
      where.endDate.lte = new Date(query.endDateTo)
    }
  }

  if (query.search) {
    const search = String(query.search).trim()

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { ship: { contains: search } },
        { package: { contains: search } },
        { routeLabel: { contains: search } },
        {
          vendor: {
            name: {
              contains: search
            }
          }
        }
      ]
    }
  }

  const tagFilters = []

  if (query.tagged === "true") {
    tagFilters.push({
      tags: {
        some: {}
      }
    })
  }

  if (query.tag) {
    tagFilters.push({
      tags: {
        some: {
          label: {
            contains: String(query.tag).trim()
          }
        }
      }
    })
  }

  if (query.assignedTo) {
    tagFilters.push({
      tags: {
        some: {
          assignedTo: {
            contains: String(query.assignedTo).trim()
          }
        }
      }
    })
  }

  if (tagFilters.length > 0) {
    where.AND = [...(where.AND ?? []), ...tagFilters]
  }

  return where
}

function getCruiseQueryArgs(where, detail = "full") {
  if (detail === "summary") {
    return {
      where,
      select: {
        code: true,
        ship: true,
        shipCode: true,
        cruiseLine: true,
        package: true,
        portFrom: true,
        portTo: true,
        routeLabel: true,
        nights: true,
        startDate: true,
        endDate: true,
        trend: true,
        confidence: true,
        pinned: true,
        currency: true,
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            url: true
          }
        },
        tags: {
          select: {
            id: true,
            label: true,
            assignedTo: true,
            note: true,
            color: true,
            trackedLowestPrice: true,
            lastSeenPrice: true,
            lastPriceDropAt: true,
            lastNotifiedPrice: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        cabinCategories: {
          select: {
            avlResult: true,
            cabinPrice: true
          }
        }
      }
    }
  }

  return {
    where,
    include: {
      vendor: true,
      shipRef: true,
      promotions: true,
      itineraryStops: true,
      tags: {
        orderBy: {
          createdAt: "desc"
        }
      },
      cabinCategories: {
        include: {
          promotions: true
        }
      }
    }
  }
}

async function ensureVendor(vendorId) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId }
  })

  if (!vendor) {
    throw new Error(`Vendor ${vendorId} not found`)
  }

  return vendor
}

async function upsertShip(cruise, vendorId) {
  const shipCode = cruise.shipCode || cruise.ship

  if (!shipCode) {
    return null
  }

  const shipDetails = pickShipDetails(cruise.shipDetails)

  return prisma.ship.upsert({
    where: { code: shipCode },
    update: {
      name: cruise.ship || shipCode,
      vendorId,
      ...shipDetails
    },
    create: {
      code: shipCode,
      name: cruise.ship || shipCode,
      vendorId,
      ...shipDetails
    }
  })
}

async function replaceNestedCruiseData(existingCruiseId, cruise) {
  const categories = await prisma.cabinCategory.findMany({
    where: { cruiseId: existingCruiseId },
    select: { id: true }
  })

  const cabinCategoryIds = categories.map(category => category.id)

  if (cabinCategoryIds.length > 0) {
    await prisma.cabinPromotion.deleteMany({
      where: { cabinCategoryId: { in: cabinCategoryIds } }
    })

    await prisma.cabin.deleteMany({
      where: { cabinCategoryId: { in: cabinCategoryIds } }
    })
  }

  await prisma.cabinCategory.deleteMany({
    where: { cruiseId: existingCruiseId }
  })

  await prisma.cruisePromotion.deleteMany({
    where: { cruiseId: existingCruiseId }
  })

  return {
    promotions: {
      create: (cruise.promotions ?? []).map(name => ({ name }))
    },
    cabinCategories: {
      create: (cruise.cabinCategories ?? []).map(mapCabinForWrite)
    }
  }
}

async function saveCruisePayload(cruise, fallbackVendorId) {
  const vendorId = Number(cruise.vendorId ?? fallbackVendorId)

  if (!vendorId) {
    throw new Error("vendorId is required")
  }

  if (!cruise.id && !cruise.code) {
    throw new Error("Cruise code/id is required")
  }

  await ensureVendor(vendorId)

  const ship = await upsertShip(cruise, vendorId)
  const cruiseData = mapCruiseForWrite(cruise, vendorId, ship?.id ?? null)

  const existingCruise = await prisma.cruise.findFirst({
    where: { code: cruiseData.code },
    select: { id: true }
  })

  if (existingCruise) {
    const nestedData = await replaceNestedCruiseData(existingCruise.id, cruise)

    await prisma.cruise.update({
      where: { id: existingCruise.id },
      data: {
        ...cruiseData,
        ...nestedData
      }
    })
  } else {
    await prisma.cruise.create({
      data: {
        ...cruiseData,
        promotions: {
          create: (cruise.promotions ?? []).map(name => ({ name }))
        },
        cabinCategories: {
          create: (cruise.cabinCategories ?? []).map(mapCabinForWrite)
        }
      }
    })
  }

  return prisma.cruise.findFirst({
    where: { code: cruiseData.code },
    include: {
      vendor: true,
      shipRef: true,
      promotions: true,
      itineraryStops: true,
      tags: {
        orderBy: { createdAt: "desc" }
      },
      cabinCategories: {
        include: { promotions: true }
      }
    }
  })
}

async function getCruiseWithRelations(code) {
  return prisma.cruise.findFirst({
    where: { code },
    include: {
      vendor: true,
      shipRef: true,
      promotions: true,
      itineraryStops: true,
      tags: {
        orderBy: { createdAt: "desc" }
      },
      cabinCategories: {
        include: { promotions: true }
      }
    }
  })
}

function normalizeTagPayload(payload = {}) {
  const label = String(payload.label ?? "").trim()

  if (!label) {
    throw new Error("label is required")
  }

  return {
    label,
    assignedTo: payload.assignedTo ? String(payload.assignedTo).trim() : null,
    note: payload.note ? String(payload.note).trim() : null,
    color: payload.color ? String(payload.color).trim() : null
  }
}

exports.listPriceAlerts = async (req, res) => {
  try {
    const status = String(req.query.status ?? "unread").trim()
    const limit = Math.min(Number(req.query.limit ?? 20), 100)

    const where = {}

    if (status && status !== "all") {
      where.status = status
    }

    const alerts = await prisma.cruiseTagAlert.findMany({
      where,
      include: {
        cruiseTag: true,
        cruise: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    })

    res.json({
      success: true,
      count: alerts.length,
      data: alerts.map(mapAlertForResponse)
    })
  } catch (err) {
    console.error("CRUISE ALERT LIST ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.markPriceAlertRead = async (req, res) => {
  try {
    const alertId = Number(req.params.alertId)

    const alert = await prisma.cruiseTagAlert.update({
      where: { id: alertId },
      data: {
        status: "read",
        readAt: new Date()
      },
      include: {
        cruiseTag: true,
        cruise: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    res.json({
      success: true,
      data: mapAlertForResponse(alert)
    })
  } catch (err) {
    console.error("CRUISE ALERT READ ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.listTags = async (req, res) => {
  try {
    const [tagSummary, assignees, unreadAlerts] = await Promise.all([
      prisma.cruiseTag.groupBy({
        by: ["label"],
        _count: {
          label: true
        },
        orderBy: {
          label: "asc"
        }
      }),
      prisma.cruiseTag.findMany({
        where: {
          assignedTo: {
            not: null
          }
        },
        distinct: ["assignedTo"],
        select: {
          assignedTo: true
        },
        orderBy: {
          assignedTo: "asc"
        }
      }),
      prisma.cruiseTagAlert.count({
        where: {
          status: "unread"
        }
      })
    ])

    res.json({
      success: true,
      data: {
        tags: tagSummary.map(tag => ({
          label: tag.label,
          count: tag._count.label
        })),
        assignees: assignees.map(entry => entry.assignedTo).filter(Boolean),
        unreadAlerts
      }
    })
  } catch (err) {
    console.error("CRUISE TAG LIST ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.addTag = async (req, res) => {
  try {
      const cruise = await prisma.cruise.findFirst({
        where: {
          code: req.params.code
        },
        include: {
          cabinCategories: {
            select: {
              code: true,
              name: true,
              group: true,
              avlResult: true,
              cabinPrice: true,
              perPersonPrice: true,
              available: true,
              totalCabins: true,
              confidence: true
            }
          }
        }
      })

    if (!cruise) {
      return res.status(404).json({
        success: false,
        error: "Cruise not found"
      })
    }

    const tagData = normalizeTagPayload(req.body)
    const currentLowestPrice = getCruiseLowestPrice(cruise)

    const categorySnapshot = (cruise.cabinCategories ?? []).map(cat => ({
      code: cat.code,
      name: cat.name,
      group: cat.group,
      avlResult: cat.avlResult,
      cabinPrice: cat.cabinPrice != null ? Number(cat.cabinPrice) : null,
      perPersonPrice: cat.perPersonPrice != null ? Number(cat.perPersonPrice) : null,
      available: cat.available,
      totalCabins: cat.totalCabins,
      confidence: cat.confidence
    }))

      await prisma.cruiseTag.create({
        data: {
          cruiseId: cruise.id,
          ...tagData,
          trackedLowestPrice: currentLowestPrice,
          lastSeenPrice: currentLowestPrice,
          categorySnapshot
        }
      })

    const updatedCruise = await getCruiseWithRelations(req.params.code)

    res.status(201).json({
      success: true,
      data: mapCruiseForResponse(updatedCruise)
    })
  } catch (err) {
    console.error("CRUISE TAG CREATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.updateTag = async (req, res) => {
  try {
    const cruise = await prisma.cruise.findFirst({
      where: {
        code: req.params.code
      },
      select: {
        id: true
      }
    })

    if (!cruise) {
      return res.status(404).json({
        success: false,
        error: "Cruise not found"
      })
    }

    const existingTag = await prisma.cruiseTag.findFirst({
      where: {
        id: Number(req.params.tagId),
        cruiseId: cruise.id
      }
    })

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: "Tag not found"
      })
    }

    const tagData = normalizeTagPayload(req.body)

    await prisma.cruiseTag.update({
      where: {
        id: existingTag.id
      },
      data: tagData
    })

    const updatedCruise = await getCruiseWithRelations(req.params.code)

    res.json({
      success: true,
      data: mapCruiseForResponse(updatedCruise)
    })
  } catch (err) {
    console.error("CRUISE TAG UPDATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.removeTag = async (req, res) => {
  try {
    const cruise = await prisma.cruise.findFirst({
      where: {
        code: req.params.code
      },
      select: {
        id: true
      }
    })

    if (!cruise) {
      return res.status(404).json({
        success: false,
        error: "Cruise not found"
      })
    }

    const existingTag = await prisma.cruiseTag.findFirst({
      where: {
        id: Number(req.params.tagId),
        cruiseId: cruise.id
      }
    })

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: "Tag not found"
      })
    }

    await prisma.cruiseTagAlert.deleteMany({
      where: {
        cruiseTagId: existingTag.id
      }
    })

    await prisma.cruiseTag.delete({
      where: {
        id: existingTag.id
      }
    })

    const updatedCruise = await getCruiseWithRelations(req.params.code)

    res.json({
      success: true,
      data: mapCruiseForResponse(updatedCruise)
    })
  } catch (err) {
    console.error("CRUISE TAG DELETE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.search = async (req, res) => {
  try {
    const where = buildCruiseWhere(req.query)
    const detail = req.query.detail === "summary" ? "summary" : "full"
    const { page, limit, skip } = parsePagination(req.query, {
      page: 1,
      limit: detail === "summary" ? 50 : 20,
      maxLimit: detail === "summary" ? 200 : 50
    })

    const [total, cruises] = await Promise.all([
      prisma.cruise.count({ where }),
      prisma.cruise.findMany({
        ...getCruiseQueryArgs(where, detail),
        orderBy: {
          startDate: "asc"
        },
        skip,
        take: limit
      })
    ])

    const data =
      detail === "summary"
        ? cruises.map(mapCruiseSummaryForResponse)
        : cruises.map(mapCruiseForResponse)

    res.json({
      success: true,
      count: data.length,
      pagination: buildPaginationMeta(total, page, limit),
      data
    })
  } catch (err) {
    console.error("CRUISE SEARCH ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.create = async (req, res) => {
  try {
    const cruise = await saveCruisePayload(req.body, req.body.vendorId)

    res.status(201).json({
      success: true,
      data: mapCruiseForResponse(cruise)
    })
  } catch (err) {
    console.error("CRUISE CREATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.getOne = async (req, res) => {
  try {
    const code = req.params.code

    const cruise = await getCruiseWithRelations(code)

    if (!cruise) {
      return res.status(404).json({
        success: false,
        error: "Cruise not found"
      })
    }

    res.json({
      success: true,
      data: mapCruiseForResponse(cruise)
    })
  } catch (err) {
    console.error("CRUISE GET ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const cruise = await saveCruisePayload(
      {
        ...req.body,
        id: req.params.code
      },
      req.body.vendorId
    )

    res.json({
      success: true,
      data: mapCruiseForResponse(cruise)
    })
  } catch (err) {
    console.error("CRUISE UPDATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const cruise = await prisma.cruise.findFirst({
      where: { code: req.params.code },
      include: {
        cabinCategories: {
          select: { id: true }
        }
      }
    })

    if (!cruise) {
      return res.status(404).json({
        success: false,
        error: "Cruise not found"
      })
    }

    const cabinCategoryIds = cruise.cabinCategories.map(category => category.id)

  if (cabinCategoryIds.length > 0) {
      await prisma.cabinPromotion.deleteMany({
        where: { cabinCategoryId: { in: cabinCategoryIds } }
      })

      await prisma.cabin.deleteMany({
        where: { cabinCategoryId: { in: cabinCategoryIds } }
      })
    }

    await prisma.itineraryStop.deleteMany({
      where: { cruiseId: cruise.id }
    })

    await prisma.cabinCategory.deleteMany({
      where: { cruiseId: cruise.id }
    })

    await prisma.cruisePromotion.deleteMany({
      where: { cruiseId: cruise.id }
    })

    await prisma.cruiseTagAlert.deleteMany({
      where: { cruiseId: cruise.id }
    })

    await prisma.cruiseTag.deleteMany({
      where: { cruiseId: cruise.id }
    })

    await prisma.cruise.delete({
      where: { id: cruise.id }
    })

    res.json({
      success: true,
      message: "Cruise deleted"
    })
  } catch (err) {
    console.error("CRUISE DELETE ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.bulkImport = async (req, res) => {
  try {
    const vendorId = Number(req.body.vendorId)
    const cruises = Array.isArray(req.body.cruises) ? req.body.cruises : []

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: "vendorId is required"
      })
    }

    if (cruises.length === 0) {
      return res.status(400).json({
        success: false,
        error: "cruises array is required"
      })
    }

    const savedCruises = []

    for (const cruise of cruises) {
      const saved = await saveCruisePayload(cruise, vendorId)
      savedCruises.push(mapCruiseForResponse(saved))
    }

    res.json({
      success: true,
      count: savedCruises.length,
      data: savedCruises
    })
  } catch (err) {
    console.error("CRUISE IMPORT ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.overview = async (req,res)=>{

  try{

    const totalCruises = await prisma.cruise.count()

    const totalVendors = await prisma.vendor.count()

    const ships = await prisma.ship.count()

    const ports = await prisma.cruise.groupBy({
      by:["portFrom"]
    })


    const vendors = await prisma.vendor.findMany({
      include:{
        _count:{
          select:{
            cruises:true
          }
        }
      }
    })


    const vendorOverview = vendors.map(v=>({
      vendor_id:v.id,
      vendor_name:v.name,
      cruise_count:v._count.cruises
    }))


    res.json({
      success:true,
      overview:{
        total_cruises:totalCruises,
        total_vendors:totalVendors,
        total_ships:ships,
        total_ports:ports.length
      },
      vendor_breakdown:vendorOverview
    })

  }catch(err){

    console.error("OVERVIEW ERROR:",err)

    res.status(500).json({
      success:false,
      error:err.message
    })

  }

}

exports.compare = async (req,res)=>{

  try{

    const { ids, codes } = req.query
    const codeArray = (codes ?? "")
      .split(",")
      .map(code => code.trim())
      .filter(Boolean)

    const idArray = (ids ?? "")
      .split(",")
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))

    if(idArray.length === 0 && codeArray.length === 0){
      return res.status(400).json({
        success:false,
        message:"ids or codes query parameter required"
      })
    }

    const cruises = await prisma.cruise.findMany({
      where:{
        OR:[
          idArray.length > 0 ? { id:{ in:idArray } } : undefined,
          codeArray.length > 0 ? { code:{ in:codeArray } } : undefined
        ].filter(Boolean)
      },
      include:{
        vendor:true,
        shipRef:true,
        promotions:true,
        itineraryStops:true,
        tags: {
          orderBy: {
            createdAt: "desc"
          }
        },
        cabinCategories:{
          include:{
            promotions:true
          }
        }
      },
      orderBy:{
        startDate:"asc"
      }
    })

    res.json({
      success:true,
      count:cruises.length,
      data:cruises.map(mapCruiseForResponse)
    })

  }catch(err){

    console.error("COMPARE ERROR:",err)

    res.status(500).json({
      success:false,
      error:err.message
    })

  }

}

// Infer deck number from cabin number prefix when no explicit deck stored.
// Standard cruise numbering: 4-digit cabin → first digit = deck (e.g. 8239 → 8)
//                            5-digit cabin → first 2 digits = deck (e.g. 10109 → 10)
function inferDeckNumber(cabinNumber) {
  if (!cabinNumber || !/^\d+$/.test(cabinNumber)) return null
  const len = cabinNumber.length
  if (len < 3) return null
  const prefixLen = len >= 5 ? 2 : 1
  const n = parseInt(cabinNumber.slice(0, prefixLen), 10)
  return Number.isFinite(n) ? n : null
}

exports.getCategoryDecks = async (req, res) => {
  try {
    const { code, categoryCode } = req.params

    // `code` is unique per vendor, NOT globally (CCS A/B and GoHal-Cunard can
    // share the same POLAR voyage code) — findUnique throws when more than one
    // cruise shares this code. Numeric ids (the actual globally-unique PK) are
    // looked up directly; string codes fall back to findFirst.
    const cruise = /^\d+$/.test(code)
      ? await prisma.cruise.findUnique({ where: { id: Number(code) } })
      : await prisma.cruise.findFirst({ where: { code } })
    if (!cruise) {
      return res.status(404).json({ success: false, error: "Cruise not found" })
    }

    const [category, shipDecks] = await Promise.all([
      prisma.cabinCategory.findUnique({
        where: { cruiseId_code: { cruiseId: cruise.id, code: categoryCode } },
        include: { cabins: { orderBy: [{ deckNumber: "asc" }, { cabinNumber: "asc" }] } }
      }),
      cruise.shipId
        ? prisma.shipDeck.findMany({
            where: { shipId: cruise.shipId },
            select: { name: true, deckNumber: true, image: true }
          })
        : Promise.resolve([])
    ])

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" })
    }

    // Build deck image lookup: match by deckName or deckNumber
    const deckImageByName   = new Map(shipDecks.map(d => [d.name?.toLowerCase(), d.image]))
    const deckImageByNumber = new Map(shipDecks.map(d => [String(d.deckNumber), d.image]))

    // Group cabins by deck, inferring deck from cabin number when not stored
    const deckMap = new Map()
    for (const cabin of category.cabins) {
      const deckNum  = cabin.deckNumber ?? inferDeckNumber(cabin.cabinNumber)
      const deckLbl  = cabin.deckName ?? (deckNum != null ? `Deck ${deckNum}` : null)
      const groupKey = deckNum != null ? String(deckNum) : (deckLbl ?? "__unassigned__")

      if (!deckMap.has(groupKey)) {
        const deckImage =
          deckImageByName.get(deckLbl?.toLowerCase()) ??
          deckImageByNumber.get(String(deckNum)) ??
          null
        deckMap.set(groupKey, {
          deckNumber: deckNum,
          deckName:   deckLbl ?? "Unassigned",
          deckImage,
          cabins: []
        })
      }
      deckMap.get(groupKey).cabins.push({
        cabinNumber: cabin.cabinNumber,
        capacity:    cabin.capacity,
        status:      cabin.status ?? "Available"
      })
    }

    const decks = [...deckMap.values()]
      .sort((a, b) => (a.deckNumber ?? 9999) - (b.deckNumber ?? 9999))

    res.json({
      success: true,
      data: { code: categoryCode, decks }
    })
  } catch (err) {
    console.error("CATEGORY DECKS ERROR:", err)
    res.status(500).json({ success: false, error: err.message })
  }
}
