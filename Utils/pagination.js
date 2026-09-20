function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parsePagination(query = {}, defaults = {}) {
  const page = toPositiveInt(query.page, defaults.page ?? 1)
  const requestedLimit = toPositiveInt(query.limit, defaults.limit ?? 20)
  const maxLimit = defaults.maxLimit ?? 100
  const limit = Math.min(requestedLimit, maxLimit)
  const skip = (page - 1) * limit

  return {
    page,
    limit,
    skip
  }
}

function buildPaginationMeta(total, page, limit) {
  const safeTotal = Number(total ?? 0)
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit))

  return {
    total: safeTotal,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  }
}

module.exports = {
  parsePagination,
  buildPaginationMeta
}
