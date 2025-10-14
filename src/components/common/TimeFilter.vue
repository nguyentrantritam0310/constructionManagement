<template>
  <div class="time-filter mb-3">
    <div class="d-flex flex-wrap align-items-center gap-3 py-3 border-bottom">
      <!-- Month Navigation -->
      <div class="d-flex align-items-center gap-2">
        <button 
          class="btn btn-outline-secondary btn-sm" 
          @click="goToPreviousMonth"
          title="Tháng trước"
          :disabled="loading"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="text-center px-3">
          <h6 class="mb-0 fw-semibold text-dark">{{ monthDisplayText }}</h6>
        </div>
        <button 
          class="btn btn-outline-secondary btn-sm" 
          @click="goToNextMonth"
          title="Tháng sau"
          :disabled="loading"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- Week Filter (optional) -->
      <div v-if="showWeekFilter" class="d-flex align-items-center gap-2">
        <div class="input-group" style="max-width: 200px;">
          <span class="input-group-text bg-light border-end-0 py-2">
            <i class="fas fa-calendar-week text-muted"></i>
          </span>
          <input 
            type="week" 
            class="form-control form-control-sm border-start-0" 
            v-model="localWeek"
            :disabled="loading"
          />
        </div>
        <button 
          class="btn btn-outline-success btn-sm" 
          @click="applyWeekFilter"
          :disabled="!localWeek || loading"
          title="Áp dụng lọc tuần"
        >
          <i class="fas fa-filter"></i>
        </button>
        <button 
          class="btn btn-outline-warning btn-sm" 
          @click="clearWeekFilter"
          :disabled="loading"
          title="Xóa lọc tuần"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Date Range Filter (optional) -->
      <div v-if="showDateRange" class="d-flex align-items-center gap-2">
        <div class="input-group" style="max-width: 200px;">
          <span class="input-group-text bg-light border-end-0 py-2">
            <i class="fas fa-calendar-alt text-muted"></i>
          </span>
          <input 
            type="date" 
            class="form-control form-control-sm border-start-0" 
            v-model="localStartDate"
            placeholder="Từ ngày"
            :disabled="loading"
          />
        </div>
        <span class="text-muted">-</span>
        <div class="input-group" style="max-width: 200px;">
          <input 
            type="date" 
            class="form-control form-control-sm" 
            v-model="localEndDate"
            placeholder="Đến ngày"
            :disabled="loading"
          />
        </div>
        <button 
          class="btn btn-outline-success btn-sm" 
          @click="applyDateRangeFilter"
          :disabled="!localStartDate || !localEndDate || loading"
          title="Áp dụng bộ lọc"
        >
          <i class="fas fa-filter"></i>
        </button>
        <button 
          class="btn btn-outline-warning btn-sm" 
          @click="clearDateRangeFilter"
          :disabled="loading"
          title="Xóa bộ lọc"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Quick Actions -->
      <div class="d-flex align-items-center gap-2">
        <button 
          class="btn btn-outline-primary btn-sm" 
          @click="goToCurrentMonth"
          title="Tháng hiện tại"
          :disabled="loading"
        >
          <i class="fas fa-calendar-day"></i>
        </button>
        <button 
          v-if="showRefreshButton"
          class="btn btn-outline-secondary btn-sm" 
          @click="handleRefresh"
          :disabled="loading"
          title="Làm mới dữ liệu"
        >
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  // Current selected year and month
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  month: {
    type: Number,
    default: () => new Date().getMonth() + 1
  },
  // Week filter
  week: {
    type: String,
    default: ''
  },
  // Date range filter
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  // UI options
  showWeekFilter: {
    type: Boolean,
    default: false
  },
  showDateRange: {
    type: Boolean,
    default: false
  },
  showRefreshButton: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'update:year',
  'update:month', 
  'update:week',
  'update:startDate',
  'update:endDate',
  'refresh',
  'weekChanged',
  'dateRangeChanged'
])

// Local reactive data
const localYear = ref(props.year)
const localMonth = ref(props.month)
const localWeek = ref(props.week)
const localStartDate = ref(props.startDate)
const localEndDate = ref(props.endDate)

// Watch for prop changes
watch(() => props.year, (newVal) => {
  localYear.value = newVal
})

watch(() => props.month, (newVal) => {
  localMonth.value = newVal
})

watch(() => props.week, (newVal) => {
  localWeek.value = newVal
})

watch(() => props.startDate, (newVal) => {
  localStartDate.value = newVal
})

watch(() => props.endDate, (newVal) => {
  localEndDate.value = newVal
})

// Computed
const monthDisplayText = computed(() => {
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ]
  return `${monthNames[localMonth.value - 1]} ${localYear.value}`
})

// Methods
const goToPreviousMonth = () => {
  if (localMonth.value > 1) {
    localMonth.value--
  } else {
    localMonth.value = 12
    localYear.value--
  }
  emit('update:year', localYear.value)
  emit('update:month', localMonth.value)
  clearFilters()
}

const goToNextMonth = () => {
  if (localMonth.value < 12) {
    localMonth.value++
  } else {
    localMonth.value = 1
    localYear.value++
  }
  emit('update:year', localYear.value)
  emit('update:month', localMonth.value)
  clearFilters()
}

const goToCurrentMonth = () => {
  const now = new Date()
  localYear.value = now.getFullYear()
  localMonth.value = now.getMonth() + 1
  emit('update:year', localYear.value)
  emit('update:month', localMonth.value)
  clearFilters()
}

const applyWeekFilter = () => {
  if (localWeek.value) {
    emit('update:week', localWeek.value)
    emit('weekChanged', {
      week: localWeek.value
    })
  }
}

const clearWeekFilter = () => {
  clearWeek()
  emit('weekChanged', {
    week: ''
  })
}

const clearWeek = () => {
  localWeek.value = ''
  emit('update:week', '')
}

const applyDateRangeFilter = () => {
  if (localStartDate.value && localEndDate.value) {
    emit('update:startDate', localStartDate.value)
    emit('update:endDate', localEndDate.value)
    emit('dateRangeChanged', {
      startDate: localStartDate.value,
      endDate: localEndDate.value
    })
  }
}

const clearDateRangeFilter = () => {
  clearDateRange()
  emit('dateRangeChanged', {
    startDate: '',
    endDate: ''
  })
}

const clearDateRange = () => {
  localStartDate.value = ''
  localEndDate.value = ''
  emit('update:startDate', '')
  emit('update:endDate', '')
}

const clearFilters = () => {
  clearWeek()
  clearDateRange()
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.time-filter {
  background: #fafbfc;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.time-filter .btn {
  transition: all 0.2s ease;
}

.time-filter .btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.time-filter .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-group .form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.input-group-text {
  border-color: #dee2e6;
}

.form-control {
  border-color: #dee2e6;
}
</style>
