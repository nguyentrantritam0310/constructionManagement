import { ref, computed } from 'vue'

export function useFilter(items, options = {}) {
  const searchQuery = ref('')
  const sortBy = ref(options.defaultSortBy || '')
  const sortDirection = ref(options.defaultSortDirection || 'asc')
  const filters = ref(options.defaultFilters || {})

  const filteredItems = computed(() => {
    let result = [...items.value]

    // Apply search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item => {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(query)
        )
      })
    }

    // Apply filters
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => item[key] === value)
      }
    })

    // Apply sorting
    if (sortBy.value) {
      result.sort((a, b) => {
        const aValue = a[sortBy.value]
        const bValue = b[sortBy.value]

        if (typeof aValue === 'string') {
          return sortDirection.value === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        return sortDirection.value === 'asc'
          ? aValue - bValue
          : bValue - aValue
      })
    }

    return result
  })

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  const setSort = (field) => {
    if (sortBy.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortDirection.value = 'asc'
    }
  }

  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  const clearFilters = () => {
    searchQuery.value = ''
    sortBy.value = options.defaultSortBy || ''
    sortDirection.value = options.defaultSortDirection || 'asc'
    filters.value = { ...options.defaultFilters } || {}
  }

  return {
    searchQuery,
    sortBy,
    sortDirection,
    filters,
    filteredItems,
    setSearchQuery,
    setSort,
    setFilter,
    clearFilters
  }
}
