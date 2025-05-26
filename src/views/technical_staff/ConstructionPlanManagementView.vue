<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ConstructionPlanList from '../../components/construction-plan/ConstructionPlanList.vue'
import PlanForm from '../../components/construction-plan/PlanForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useConstructionPlan } from '../../composables/useConstructionPlan'

const showCreateForm = ref(false)
const {
  plans,
  loading,
  error,
  fetchPlans,
  createPlan,
  updatePlan,
  updatePlanStatus
} = useConstructionPlan()

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const filteredPlans = computed(() => {
  let result = [...plans.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(plan =>
      plan.id?.toString().includes(query) ||
      plan.constructionName?.toLowerCase().includes(query) ||
      plan.constructionItemName?.toLowerCase().includes(query) ||
      plan.employeeName?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(plan => plan.statusName === statusFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(plan => {
      const planDate = new Date(plan.startDate)
      return planDate >= start && planDate <= end
    })
  }

  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRange.value = {
    start: null,
    end: null
  }
}

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPlans.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  fetchPlans()
})

const handleCreatePlan = () => {
  showCreateForm.value = false
  fetchPlans() // Refresh the list after creating
}

const handleUpdatePlan = async () => {
  await fetchPlans() // Refresh the list after updating
}

const handleUpdateStatus = async ({ plan, newStatus }) => {
  try {
    // Load lại dữ liệu
    await fetchPlans()
  } catch (error) {
    console.error('Error reloading plans:', error)
  }
}

const handleUpdateVolume = (updatedPlan) => {
  const index = plans.value.findIndex(p => p.id === updatedPlan.id)
  if (index !== -1) {
    plans.value[index] = {
      ...updatedPlan,
      currentVolume: updatedPlan.actualVolume
    }
    // Thêm thông báo thành công
  }
}

const formatDate = (date) => {
  if (!date || date === '0001-01-01T00:00:00') {
    return '(chưa cập nhật)'
  }
  return new Date(date).toLocaleDateString('vi-VN')
}

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Chờ khởi công', label: 'Chờ khởi công' },
  { value: 'Đang thi công', label: 'Đang thi công' },
  { value: 'Tạm dừng', label: 'Tạm dừng' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
  { value: 'Hủy bỏ', label: 'Hủy bỏ' }
]
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Kế Hoạch Thi Công</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Tạo Kế Hoạch Mới" @click="showCreateForm = true">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Filter Section -->
    <div class="filter-section mb-4">
      <div class="row g-3">
        <div class="col-md-4">
          <input
            type="text"
            class="form-control"
            v-model="searchQuery"
            placeholder="Tìm kiếm theo mã, tên công trình, hạng mục..."
          >
        </div>
        <div class="col-md-2">
          <select class="form-control" v-model="statusFilter">
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ khởi công">Chờ khởi công</option>
            <option value="Đang thi công">Đang thi công</option>
            <option value="Tạm dừng">Tạm dừng</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Hủy bỏ">Hủy bỏ</option>
          </select>
        </div>
        <div class="col-md-2">
          <input
            type="date"
            class="form-control"
            v-model="dateRange.start"
            placeholder="Từ ngày"
          >
        </div>
        <div class="col-md-2">
          <input
            type="date"
            class="form-control"
            v-model="dateRange.end"
            placeholder="Đến ngày"
          >
        </div>
        <div class="col-md-2">
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fas fa-undo me-2"></i>Đặt lại
          </button>
        </div>
      </div>
    </div>

    <!-- Danh sách kế hoạch -->
    <ConstructionPlanList
      :plans="paginatedPlans"
      @update-plan="handleUpdatePlan"
      @update-status="handleUpdateStatus"
      @update-volume="handleUpdateVolume"
    />

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedPlans.length }} trên {{ filteredPlans.length }} kế hoạch
      </div>
      <Pagination
        :total-items="filteredPlans.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <ModalDialog v-model:show="showCreateForm" title="Tạo Kế Hoạch Thi Công" size="lg">
      <PlanForm mode="create" @close="handleCreatePlan" />
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
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
</style>
