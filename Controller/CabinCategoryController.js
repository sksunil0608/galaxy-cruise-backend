const prisma = require("../Utils/prisma")
const {
  parsePagination,
  buildPaginationMeta
} = require("../Utils/pagination")

const mapCabinCategory = category => ({
  id: category.id,
  cruiseId: category.cruiseId,
  code: category.code,
  name: category.name,
  type: category.type,
  status: category.status,
  avlResult: category.avlResult,
  total: category.total,
  avail: category.available,
  available: category.available,
  cabinPrice: Number(category.cabinPrice ?? 0),
  perPersonPrice: Number(category.perPersonPrice ?? 0),
  voyageFare: Number(category.voyageFare ?? 0),
  portCharges: Number(category.portCharges ?? 0),
  capacity: category.capacity,
  childBeds: category.childBeds,
  trend: category.trend,
  range7d: category.range7d,
  confidence: category.confidence,
  promos: category.promotions.map(promotion => promotion.name),
  classifications: (category.classifications ?? []).map(classification => ({
    linkType: classification.linkType,
    code: classification.code,
    name: classification.name,
    description: classification.description,
    rank: classification.rank,
    shipCode: classification.shipCode
  })),
  cruise: category.cruise
    ? {
        id: category.cruise.id,
        code: category.cruise.code,
        ship: category.cruise.ship,
        shipCode: category.cruise.shipCode,
        package: category.cruise.package
      }
    : null
})

const buildCabinCategoryData = body => ({
  cruiseId: Number(body.cruiseId),
  code: body.code,
  name: body.name,
  type: body.type ?? null,
  status: body.status ?? null,
  avlResult: body.avlResult ?? null,
  total: body.total ?? null,
  available: body.avail ?? body.available ?? null,
  cabinPrice: body.cabinPrice ?? null,
  perPersonPrice: body.perPersonPrice ?? null,
  voyageFare: body.voyageFare ?? null,
  portCharges: body.portCharges ?? null,
  capacity: body.capacity ?? null,
  childBeds: body.childBeds ?? null,
  trend: body.trend ?? null,
  range7d: body.range7d ?? null,
  confidence: body.confidence ?? null
})

async function replacePromotions(cabinCategoryId, promos = []) {
  await prisma.cabinPromotion.deleteMany({
    where: { cabinCategoryId }
  })

  if (promos.length > 0) {
    await prisma.cabinPromotion.createMany({
      data: promos.map(name => ({
        cabinCategoryId,
        name
      }))
    })
  }
}

async function replaceClassifications(cabinCategoryId, classifications = []) {
  await prisma.cabinCategoryClassification.deleteMany({
    where: { cabinCategoryId }
  })

  const validClassifications = classifications.filter(
    classification => classification?.linkType && classification?.code
  )

  if (validClassifications.length > 0) {
    await prisma.cabinCategoryClassification.createMany({
      data: validClassifications.map(classification => ({
        cabinCategoryId,
        linkType: classification.linkType,
        code: classification.code,
        name: classification.name ?? null,
        description: classification.description ?? null,
        rank: classification.rank ?? null,
        shipCode: classification.shipCode ?? null
      }))
    })
  }
}

exports.list = async (req, res) => {
  try {
    const where = {}

    if (req.query.cruiseId) {
      where.cruiseId = Number(req.query.cruiseId)
    }

    const { page, limit, skip } = parsePagination(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    })

    const [total, categories] = await Promise.all([
      prisma.cabinCategory.count({ where }),
      prisma.cabinCategory.findMany({
        where,
        include: {
          promotions: true,
          classifications: true,
          cruise: true
        },
        orderBy: [
          { cruiseId: "asc" },
          { code: "asc" }
        ],
        skip,
        take: limit
      })
    ])

    res.json({
      success: true,
      count: categories.length,
      pagination: buildPaginationMeta(total, page, limit),
      data: categories.map(mapCabinCategory)
    })
  } catch (err) {
    console.error("CABIN CATEGORY LIST ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.getOne = async (req, res) => {
  try {
    const category = await prisma.cabinCategory.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        promotions: true,
        classifications: true,
        cruise: true
      }
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Cabin category not found"
      })
    }

    res.json({
      success: true,
      data: mapCabinCategory(category)
    })
  } catch (err) {
    console.error("CABIN CATEGORY GET ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

exports.create = async (req, res) => {
  try {
    const category = await prisma.cabinCategory.create({
      data: {
        ...buildCabinCategoryData(req.body),
        promotions: {
          create: (req.body.promos ?? []).map(name => ({ name }))
        },
        classifications: {
          create: (req.body.classifications ?? [])
            .filter(classification => classification?.linkType && classification?.code)
            .map(classification => ({
              linkType: classification.linkType,
              code: classification.code,
              name: classification.name ?? null,
              description: classification.description ?? null,
              rank: classification.rank ?? null,
              shipCode: classification.shipCode ?? null
            }))
        }
      },
      include: {
        promotions: true,
        classifications: true,
        cruise: true
      }
    })

    res.status(201).json({
      success: true,
      data: mapCabinCategory(category)
    })
  } catch (err) {
    console.error("CABIN CATEGORY CREATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.update = async (req, res) => {
  try {
    const categoryId = Number(req.params.id)

    await prisma.cabinCategory.update({
      where: { id: categoryId },
      data: buildCabinCategoryData(req.body)
    })

    await replacePromotions(categoryId, req.body.promos ?? [])
    await replaceClassifications(categoryId, req.body.classifications ?? [])

    const category = await prisma.cabinCategory.findUnique({
      where: { id: categoryId },
      include: {
        promotions: true,
        classifications: true,
        cruise: true
      }
    })

    res.json({
      success: true,
      data: mapCabinCategory(category)
    })
  } catch (err) {
    console.error("CABIN CATEGORY UPDATE ERROR:", err)

    res.status(400).json({
      success: false,
      error: err.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const categoryId = Number(req.params.id)

    await prisma.cabinCategoryClassification.deleteMany({
      where: { cabinCategoryId: categoryId }
    })

    await prisma.cabinPromotion.deleteMany({
      where: { cabinCategoryId: categoryId }
    })

    await prisma.cabinCategory.delete({
      where: { id: categoryId }
    })

    res.json({
      success: true,
      message: "Cabin category deleted"
    })
  } catch (err) {
    console.error("CABIN CATEGORY DELETE ERROR:", err)

    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
