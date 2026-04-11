/**
 * Pagination utility for Mongoose queries.
 * Usage: const { data, pagination } = await paginate(Model, filter, options)
 */
const paginate = async (Model, filter = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20))
  const skip = (page - 1) * limit

  const sort = options.sort || { createdAt: -1 }
  const select = options.select || ''
  const populate = options.populate || ''

  const [total, data] = await Promise.all([
    Model.countDocuments(filter),
    Model.find(filter)
      .select(select)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ])

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

module.exports = { paginate }
