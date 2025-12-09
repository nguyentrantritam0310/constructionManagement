<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import Pagination from '../../components/common/Pagination.vue'
import ActionButton from '../../components/common/ActionButton.vue'

const router = useRouter()

const {
  constructions,
  loading,
  error,
  fetchConstructions
} = useConstructionManagement()

onMounted(() => {
  fetchConstructions()
})

const showFilter = ref(false)

// Filter variables
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref({
  start: '',
  end: ''
})

// Get unique status values from constructions
const statusOptions = computed(() => {
  const statuses = new Set(constructions.value.map(c => c.statusName))
  return Array.from(statuses)
})

// Filtered constructions
const filteredConstructions = computed(() => {
  let result = [...constructions.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(construction =>
      construction.id?.toString().includes(query) ||
      construction.constructionName?.toLowerCase().includes(query) ||
      construction.location?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(construction => construction.statusName === statusFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start) {
    const start = new Date(dateRange.value.start)
    result = result.filter(construction => {
      const constructionDate = new Date(construction.startDate)
      return constructionDate >= start
    })
  }
  if (dateRange.value.end) {
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)
    result = result.filter(construction => {
      const completionDate = new Date(construction.expectedCompletionDate)
      return completionDate <= end
    })
  }

  return result
})

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedConstructions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredConstructions.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRange.value = {
    start: '',
    end: ''
  }
  currentPage.value = 1
}

// Watch filters to reset page
watch([searchQuery, statusFilter, dateRange], () => {
  currentPage.value = 1
}, { deep: true })

const columns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày kết thúc' },
  { key: 'statusName', label: 'Trạng thái' }
]

const handleConstructionClick = (construction) => {
  router.push(`/task-status/${construction.id}`)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0" data-tour="title">Quản lý Công Trình</h1>
      <div class="d-flex gap-2" data-tour="toolbar">
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
      </div>
    </div>

    <!-- Filter Section -->
    <transition name="slide-fade">
      <div class="filter-section mb-4" v-show="showFilter" data-tour="filter">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input
                type="text"
                class="form-control"
                v-model="searchQuery"
                placeholder="Tìm kiếm theo mã, tên, địa điểm..."
              >
            </div>
          </div>
          <div class="col-md-2">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-tasks"></i>
              </span>
              <select class="form-control" v-model="statusFilter">
                <option value="">Tất cả trạng thái</option>
                <option v-for="status in statusOptions" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.start"
              placeholder="Từ ngày bắt đầu"
            >
          </div>
          <div class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.end"
              placeholder="Đến ngày hoàn thành"
            >
          </div>
          <div class="col-md-2">
            <button class="btn btn-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <DataTable v-else :columns="columns" :data="paginatedConstructions" class="construction-table"
      @row-click="handleConstructionClick" data-tour="table">
      <template #id="{ item }">
        <span class="fw-medium text-primary">CT-{{ item.id }}</span>
      </template>

      <template #constructionName="{ item }">
        <div>
          <div class="fw-medium">{{ item.constructionName }}</div>
        </div>
      </template>

      <template #location="{ item }">
        <div class="d-flex align-items-center">
          <i class="fas fa-map-marker-alt text-muted me-1"></i>
          {{ item.location }}
        </div>
      </template>

      <template #startDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar text-muted me-1"></i>
          {{ formatDate(item.startDate) }}
        </div>
      </template>

      <template #expectedCompletionDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar-check text-muted me-1"></i>
          {{ formatDate(item.expectedCompletionDate) }}
        </div>
      </template>

      <template #statusName="{ item }">
        <StatusBadge :status="item.statusName" />
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedConstructions.length }} trên {{ filteredConstructions.length }} công trình
      </div>
      <Pagination :total-items="filteredConstructions.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" data-tour="pagination" />
    </div>
    
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

.construction-table {
  margin-bottom: 2rem;
}

.construction-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.construction-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.date-info {
  font-size: 0.875rem;
  color: #495057;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-section .form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.filter-section .form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.filter-section .input-group-text {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem 0 0 0.5rem;
  padding: 0.5rem 1rem;
  color: #6c757d;
}

.filter-section .input-group .form-control {
  border-radius: 0 0.5rem 0.5rem 0;
}

.filter-section .btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.filter-section .btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.filter-section .btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #495057;
}
</style>
