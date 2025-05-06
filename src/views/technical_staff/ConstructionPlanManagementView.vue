<script setup>
import { ref, onMounted, computed } from 'vue'
import ConstructionPlanList from '../../components/construction-plan/ConstructionPlanList.vue'
import CreatePlanForm from '../../components/construction-plan/CreatePlanForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import FilterSearch from '../../components/common/FilterSearch.vue'
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

// Thêm các biến cho bộ lọc
const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({
  start: null,
  end: null
})

// Tính toán danh sách dự án đã lọc
const filteredProjects = computed(() => {
  return plans.value.filter(project => {
    // Lọc theo từ khóa tìm kiếm
    const matchesSearch = searchQuery.value === '' ||
      project.constructionName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      project.id.toString().includes(searchQuery.value)

    // Lọc theo trạng thái
    const matchesStatus = statusFilter.value === 'all' ||
      project.statusName === statusFilter.value

    // Lọc theo khoảng thời gian
    const matchesDateRange = !dateRangeFilter.value.start || !dateRangeFilter.value.end ||
      (new Date(project.startDate) >= new Date(dateRangeFilter.value.start) &&
        new Date(project.startDate) <= new Date(dateRangeFilter.value.end))

    return matchesSearch && matchesStatus && matchesDateRange
  })
})

// Reset bộ lọc
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateRangeFilter.value = {
    start: null,
    end: null
  }
}

onMounted(() => {
  fetchPlans()
})

const handleCreatePlan = (planData) => {
  // Xử lý tạo kế hoạch
  console.log('Creating plan:', planData)
  showCreateForm.value = false
}

const handleUpdatePlan = (updatedPlan) => {
  const index = plans.value.findIndex(p => p.id === updatedPlan.id)
  if (index !== -1) {
    plans.value[index] = updatedPlan
    // Thêm thông báo thành công nếu cần
  }
}

const handleUpdateStatus = ({ plan, newStatus }) => {
  const index = plans.value.findIndex(p => p.id === plan.id)
  if (index !== -1) {
    plans.value[index] = { ...plan, status: newStatus }
    // Thêm thông báo thành công nếu cần
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

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProjects.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Kế Hoạch Thi Công</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Tạo Kế Hoạch Mới" @click="showCreateForm = true">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Bộ lọc và tìm kiếm -->
    <div class="card mb-4">
      <div class="card-body">
        <FilterSearch :searchQuery="searchQuery" :statusFilter="statusFilter" :dateRangeFilter="dateRangeFilter"
          @update:searchQuery="searchQuery = $event" @update:statusFilter="statusFilter = $event"
          @update:dateRangeFilter="dateRangeFilter = $event" @resetFilters="resetFilters" />
      </div>
    </div>

    <!-- Danh sách kế hoạch -->
    <ConstructionPlanList :plans="paginatedPlans" @update-plan="handleUpdatePlan" @update-status="handleUpdateStatus"
      @update-volume="handleUpdateVolume" />

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedPlans.length }} trên {{ filteredProjects.length }} kế hoạch
      </div>
      <Pagination :total-items="filteredProjects.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <ModalDialog v-model:show="showCreateForm" title="Tạo Kế Hoạch Thi Công" size="lg">
      <CreatePlanForm @submit="handleCreatePlan" @cancel="showCreateForm = false" />
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
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