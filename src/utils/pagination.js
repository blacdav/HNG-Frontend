export function getCollectionItems(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.profiles)) return payload.data.profiles
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.profiles)) return payload.profiles
  return []
}

export function getPaginationSource(payload) {
  return {
    ...(payload ?? {}),
    ...(payload?.data ?? {}),
    ...(payload?.pagination ?? {}),
    ...(payload?.meta ?? {}),
    ...(payload?.data?.pagination ?? {}),
    ...(payload?.data?.meta ?? {}),
  }
}

export function getCollectionCount(payload) {
  const source = getPaginationSource(payload)
  const total = Number(
    source.total ??
      source.totalCount ??
      source.total_count ??
      source.totalItems ??
      source.total_items ??
      source.count_all ??
      source.itemCount ??
      source.item_count ??
      payload?.count ??
      payload?.data?.count ??
      payload?.total ??
      payload?.data?.total ??
      0,
  )

  if (total > 0) return total

  return getCollectionItems(payload).length
}

export function normalizePagination(payload, fallbackPage, fallbackLimit) {
  const source = getPaginationSource(payload)
  const page = Number(
    source.page ??
      source.currentPage ??
      source.current_page ??
      fallbackPage,
  ) || fallbackPage
  const limit = Number(
    source.limit ??
      source.perPage ??
      source.per_page ??
      fallbackLimit,
  ) || fallbackLimit
  const totalItems = getCollectionCount(payload)
  const totalPages = Math.max(
    1,
    Number(
      source.totalPages ??
        source.total_pages ??
        source.lastPage ??
        source.last_page ??
        source.pages ??
        (limit > 0 ? Math.ceil(totalItems / limit) : 1),
    ) || 1,
  )
  const hasPreviousPage =
    Boolean(
      source.hasPreviousPage ??
      source.hasPrevPage ??
      source.has_prev_page ??
      source.prevPage ??
      source.prev_page
    ) ||
    page > 1
  const hasNextPage =
    Boolean(
      source.hasNextPage ??
      source.hasMore ??
      source.has_next_page ??
      source.nextPage ??
      source.next_page
    ) ||
    page < totalPages

  return {
    page,
    limit,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
  }
}
