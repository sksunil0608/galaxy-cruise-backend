const prisma = require("../Utils/prisma")
const {
  parsePagination,
  buildPaginationMeta
} = require("../Utils/pagination")
const {
  destroyImage,
  uploadImage,
  uploadImageFromUrl
} = require("../Utils/cloudinary")

const normalizeInteger = value => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

const normalizeString = value => {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeCabinCodes = value => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return [...new Set(value.map(item => normalizeString(item)).filter(Boolean))]
  }

  return [...new Set(String(value)
    .split(",")
    .map(item => normalizeString(item))
    .filter(Boolean))]
}

const slugify = value =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const mapDeckSection = section => ({
  id: section.id,
  title: section.title,
  sectionType: section.sectionType,
  cabinCodes: Array.isArray(section.cabinCodes) ? section.cabinCodes : [],
  description: section.description,
  rawPayload: section.rawPayload
})

const mapDeck = deck => ({
  id: deck.id,
  name: deck.name,
  deckNumber: deck.deckNumber,
  description: deck.description,
  image: deck.image,
  imagePublicId: deck.imagePublicId,
  rawPayload: deck.rawPayload,
  createdAt: deck.createdAt,
  sections: (deck.sections || []).map(mapDeckSection)
})

const mapShip = ship => ({
  id: ship.id,
  code: ship.code,
  name: ship.name,
  vendorId: ship.vendorId,
  image: ship.image,
  cabins: ship.cabins,
  restaurants: ship.restaurants,
  bars: ship.bars,
  pools: ship.pools,
  jacuzzis: ship.jacuzzis,
  guests: ship.guests,
  crew: ship.crew,
  balconyCabins: ship.balconyCabins,
  suites: ship.suites,
  spa: ship.spa,
  createdAt: ship.createdAt,
  vendor: ship.vendor
    ? {
        id: ship.vendor.id,
        name: ship.vendor.name,
        slug: ship.vendor.slug,
        url: ship.vendor.url
      }
    : null,
  cruiseCount: ship._count?.cruises ?? ship.cruises?.length ?? 0
})

const buildShipData = body => ({
  code: body.code,
  name: body.name,
  vendorId: body.vendorId ? Number(body.vendorId) : null,
  image: body.image ?? null,
  cabins: body.cabins ?? null,
  restaurants: body.restaurants ?? null,
  bars: body.bars ?? null,
  pools: body.pools ?? null,
  jacuzzis: body.jacuzzis ?? null,
  guests: body.guests ?? null,
  crew: body.crew ?? null,
  balconyCabins: body.balconyCabins ?? null,
  suites: body.suites ?? null,
  spa: body.spa ?? null
})

const buildDeckSectionsInput = sections =>
  (Array.isArray(sections) ? sections : [])
    .map(section => ({
      title: normalizeString(section.title),
      sectionType: normalizeString(section.sectionType),
      cabinCodes: normalizeCabinCodes(section.cabinCodes),
      description: normalizeString(section.description),
      rawPayload: section.rawPayload ?? null
    }))
    .filter(section => section.title)

exports.list = async (req, res) => {
  try {
    const where = {}

    if (req.query.vendorId) {
      const vendorId = Number(req.query.vendorId)
      // Match ships actually used by this vendor's cruises, not just
      // Ship.vendorId — that field can be null/stale for ships whose
      // cruises were ingested before vendorId backfilling existed.
      where.OR = [
        { vendorId },
        { cruises: { some: { vendorId } } }
      ]
    }

    const { page, limit, skip } = parsePagination(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    })

    const [total, ships] = await Promise.all([
      prisma.ship.count({ where }),
      prisma.ship.findMany({
        where,
        include: {
          vendor: true,
          _count: {
            select: {
              cruises: true
            }
          }
        },
        orderBy: {
          name: "asc"
        },
        skip,
        take: limit
      })
    ])

    res.json({
      success: true,
      count: ships.length,
      pagination: buildPaginationMeta(total, page, limit),
      data: ships.map(mapShip)
    })
  } catch (err) {
    console.error("SHIP LIST ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.getOne = async (req, res) => {
  try {
    const ship = await prisma.ship.findUnique({
      where: { code: req.params.code },
      include: {
        vendor: true,
        decks: {
          include: { sections: { orderBy: { id: "asc" } } },
          orderBy: { deckNumber: "asc" }
        },
        cruises: {
          select: {
            code: true,
            package: true,
            startDate: true,
            endDate: true,
            routeLabel: true,
            nights: true
          },
          orderBy: {
            startDate: "asc"
          }
        }
      }
    })

    if (!ship) {
      return res.status(404).json({
        success: false,
        error: "Ship not found"
      })
    }

    res.json({
      success: true,
      data: {
        ...mapShip(ship),
        decks: (ship.decks || []).map(mapDeck),
        cruises: ship.cruises
      }
    })
  } catch (err) {
    console.error("SHIP GET ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.create = async (req, res) => {
  try {
    const ship = await prisma.ship.create({
      data: buildShipData(req.body),
      include: {
        vendor: true,
        _count: {
          select: {
            cruises: true,
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: mapShip(ship)
    })
  } catch (err) {
    console.error("SHIP CREATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const ship = await prisma.ship.update({
      where: { code: req.params.code },
      data: buildShipData({
        ...req.body,
        code: req.params.code
      }),
      include: {
        vendor: true,
        _count: {
          select: {
            cruises: true,
          }
        }
      }
    })

    res.json({
      success: true,
      data: mapShip(ship)
    })
  } catch (err) {
    console.error("SHIP UPDATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.createDeck = async (req, res) => {
  try {
    const ship = await prisma.ship.findUnique({
      where: { code: req.params.code }
    })

    if (!ship) {
      return res.status(404).json({
        success: false,
        error: "Ship not found"
      })
    }

    const name = normalizeString(req.body.name)

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Deck name is required"
      })
    }

    const imageSource = normalizeString(req.body.imageData) || normalizeString(req.body.imageUrl)
    const uploadedImage = await (imageSource
      ? uploadImage(imageSource, {
      folder: `cruisesaga/ships/${slugify(ship.code)}/decks`,
      publicId: `${slugify(ship.code)}-${slugify(name)}-${Date.now()}`
      })
      : Promise.resolve(null))

    const deck = await prisma.shipDeck.create({
      data: {
        shipId: ship.id,
        name,
        deckNumber: normalizeInteger(req.body.deckNumber),
        description: normalizeString(req.body.description),
        image: uploadedImage?.secureUrl ?? null,
        imagePublicId: uploadedImage?.publicId ?? null,
        rawPayload: req.body.rawPayload ?? null,
        sections: {
          create: buildDeckSectionsInput(req.body.sections)
        }
      },
      include: {
        sections: {
          orderBy: {
            id: "asc"
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: mapDeck(deck)
    })
  } catch (err) {
    console.error("SHIP DECK CREATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.updateDeck = async (req, res) => {
  try {
    const ship = await prisma.ship.findUnique({
      where: { code: req.params.code }
    })

    if (!ship) {
      return res.status(404).json({
        success: false,
        error: "Ship not found"
      })
    }

    const existingDeck = await prisma.shipDeck.findFirst({
      where: {
        id: Number(req.params.deckId),
        shipId: ship.id
      },
      include: {
        sections: true
      }
    })

    if (!existingDeck) {
      return res.status(404).json({
        success: false,
        error: "Deck not found"
      })
    }

    let uploadedImage = null
    const nextImageUrl = normalizeString(req.body.imageUrl)
    const nextImageData = normalizeString(req.body.imageData)

    if (nextImageData || (nextImageUrl && nextImageUrl !== existingDeck.image)) {
      uploadedImage = await uploadImage(nextImageData || nextImageUrl, {
        folder: `cruisesaga/ships/${slugify(ship.code)}/decks`,
        publicId: `${slugify(ship.code)}-${slugify(req.body.name || existingDeck.name)}-${Date.now()}`
      })
    }

    const deck = await prisma.$transaction(async tx => {
      await tx.shipDeckSection.deleteMany({
        where: {
          deckId: existingDeck.id
        }
      })

      return tx.shipDeck.update({
        where: {
          id: existingDeck.id
        },
        data: {
          name: normalizeString(req.body.name) || existingDeck.name,
          deckNumber: normalizeInteger(req.body.deckNumber),
          description: normalizeString(req.body.description),
          image: uploadedImage?.secureUrl ?? existingDeck.image,
          imagePublicId: uploadedImage?.publicId ?? existingDeck.imagePublicId,
          rawPayload: req.body.rawPayload ?? existingDeck.rawPayload ?? null,
          sections: {
            create: buildDeckSectionsInput(req.body.sections)
          }
        },
        include: {
          sections: {
            orderBy: {
              id: "asc"
            }
          }
        }
      })
    })

    if (uploadedImage?.publicId && existingDeck.imagePublicId && existingDeck.imagePublicId !== uploadedImage.publicId) {
      await destroyImage(existingDeck.imagePublicId).catch(error => {
        console.error("SHIP DECK OLD IMAGE DELETE ERROR:", error)
      })
    }

    res.json({
      success: true,
      data: mapDeck(deck)
    })
  } catch (err) {
    console.error("SHIP DECK UPDATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.removeDeck = async (req, res) => {
  try {
    const ship = await prisma.ship.findUnique({
      where: { code: req.params.code }
    })

    if (!ship) {
      return res.status(404).json({
        success: false,
        error: "Ship not found"
      })
    }

    const deck = await prisma.shipDeck.findFirst({
      where: {
        id: Number(req.params.deckId),
        shipId: ship.id
      }
    })

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: "Deck not found"
      })
    }

    await prisma.$transaction(async tx => {
      await tx.shipDeckSection.deleteMany({
        where: {
          deckId: deck.id
        }
      })

      await tx.shipDeck.delete({
        where: { id: deck.id }
      })
    })

    if (deck.imagePublicId) {
      await destroyImage(deck.imagePublicId).catch(error => {
        console.error("SHIP DECK DELETE IMAGE ERROR:", error)
      })
    }

    res.json({
      success: true,
      message: "Deck deleted"
    })
  } catch (err) {
    console.error("SHIP DECK DELETE ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const ship = await prisma.ship.findUnique({
      where: { code: req.params.code },
      include: {
        _count: {
          select: {
            cruises: true,
          }
        }
      }
    })

    if (!ship) {
      return res.status(404).json({
        success: false,
        error: "Ship not found"
      })
    }

    if (ship._count.cruises > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete ship while cruises are linked to it"
      })
    }


    await prisma.ship.delete({
      where: { code: req.params.code }
    })

    res.json({
      success: true,
      message: "Ship deleted"
    })
  } catch (err) {
    console.error("SHIP DELETE ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
