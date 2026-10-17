/** Parse ?page= & ?limit= into safe { page, limit, offset }. */
function getPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

/** Consistent collection envelope. */
function paginated(items, total, page, limit) {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = { getPagination, paginated };
