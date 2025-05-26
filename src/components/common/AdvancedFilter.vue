<script setup>
import { ref, watch, computed } from 'vue'
import FilterSearch from './FilterSearch.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  searchFields: {
    type: Array,
    required: true,
    default: () => []
  },
  dateField: {
    type: String,
    default: null
  },
  statusField: {
    type: String,
    default: null
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  customFilters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filteredItems'])

const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({ start: null, end: null })
const customFilterValues = ref({})

// Khởi tạo giá trị cho các custom filter
props.customFilters.forEach(filter => {
  customFilterValues.value[filter.field] = filter.type === 'select' ? 'all' : ''
})

const filteredItems = computed(() => {
  if (!props.items || !Array.isArray(props.items)) {
    return []
  }

  let filtered = [...props.items]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      props.searchFields.some(field => {
        const value = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj?.[key], item)
          : item[field]
        return String(value)?.toLowerCase().includes(query)
      })
    )
  }

  // Apply status filter if statusField is provided
  if (props.statusField && statusFilter.value !== 'all') {
    filtered = filtered.filter(item => {
      const status = props.statusField.includes('.')
        ? props.statusField.split('.').reduce((obj, key) => obj?.[key], item)
        : item[props.statusField]
      return status === statusFilter.value
    })
  }

  // Apply date range filter if dateField is provided
  if (props.dateField && dateRangeFilter.value.start && dateRangeFilter.value.end) {
    const startDate = new Date(dateRangeFilter.value.start)
    const endDate = new Date(dateRangeFilter.value.end)
    endDate.setHours(23, 59, 59, 999) // Set to end of day

    filtered = filtered.filter(item => {
      const itemDate = new Date(item[props.dateField])
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  // Apply custom filters
  props.customFilters.forEach(filter => {
    const filterValue = customFilterValues.value[filter.field]
    if (filterValue && filterValue !== 'all') {
      filtered = filtered.filter(item => {
        const itemValue = filter.field.includes('.')
          ? filter.field.split('.').reduce((obj, key) => obj?.[key], item)
          : item[filter.field]

        switch (filter.type) {
          case 'select':
            return itemValue === filterValue
          case 'number':
            return filter.operator === '>'
              ? Number(itemValue) > Number(filterValue)
              : Number(itemValue) < Number(filterValue)
          case 'boolean':
            return itemValue === (filterValue === 'true')
          default:
            return String(itemValue).includes(filterValue)
        }
      })
    }
  })

  return filtered
})

// Watch for changes in filtered items and emit updates
watch(filteredItems, (newValue) => {
  emit('update:filteredItems', newValue)
}, { immediate: true })

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateRangeFilter.value = { start: null, end: null }
  props.customFilters.forEach(filter => {
    customFilterValues.value[filter.field] = filter.type === 'select' ? 'all' : ''
  })
}
</script>

<template>
  <div class="card mb-4">
    <div class="card-body">
      <FilterSearch
        :searchQuery="searchQuery"
        :statusFilter="statusFilter"
        :dateRangeFilter="dateRangeFilter"
        :statusOptions="statusOptions"
        :customFilters="customFilters"
        :customFilterValues="customFilterValues"
        :showDateFilter="!!dateField"
        :showStatusFilter="!!statusField"
        @update:searchQuery="searchQuery = $event"
        @update:statusFilter="statusFilter = $event"
        @update:dateRangeFilter="dateRangeFilter = $event"
        @update:customFilter="(field, value) => customFilterValues[field] = value"
        @resetFilters="resetFilters"
      />
    </div>
  </div>
</template>
