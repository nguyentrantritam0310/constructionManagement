<script setup>
import { ref, watch, computed } from 'vue'
import FilterSearch from './FilterSearch.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  searchFields: {
    type: Array,
    required: true,
    default: () => []
  },
  dateField: {
    type: String,
    required: true
  },
  statusField: {
    type: String,
    default: 'status'
  }
})

const emit = defineEmits(['update:filteredItems'])

const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({ start: null, end: null })

const filteredItems = computed(() => {
  let filtered = [...props.items]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      props.searchFields.some(field =>
        item[field]?.toLowerCase().includes(query)
      )
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(item => item[props.statusField] === statusFilter.value)
  }

  // Apply date range filter
  if (dateRangeFilter.value.start && dateRangeFilter.value.end) {
    const startDate = new Date(dateRangeFilter.value.start)
    const endDate = new Date(dateRangeFilter.value.end)
    endDate.setHours(23, 59, 59, 999) // Set to end of day

    filtered = filtered.filter(item => {
      const itemDate = new Date(item[props.dateField])
      return itemDate >= startDate && itemDate <= endDate
    })
  }

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
}
</script>

<template>
  <div class="card mb-4">
    <div class="card-body">
      <FilterSearch
        :searchQuery="searchQuery"
        :statusFilter="statusFilter"
        :dateRangeFilter="dateRangeFilter"
        @update:searchQuery="searchQuery = $event"
        @update:statusFilter="statusFilter = $event"
        @update:dateRangeFilter="dateRangeFilter = $event"
        @resetFilters="resetFilters"
      />
    </div>
  </div>
</template>