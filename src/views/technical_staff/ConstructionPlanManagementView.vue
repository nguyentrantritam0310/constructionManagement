<script setup>
import { ref, onMounted, computed } from 'vue'
import ConstructionPlanList from '../../components/construction-plan/ConstructionPlanList.vue'
import PlanForm from '../../components/construction-plan/PlanForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
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

const filteredPlans = ref([])

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
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Kế Hoạch Thi Công</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Tạo Kế Hoạch Mới" @click="showCreateForm = true">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter
      :items="plans"
      :searchFields="['constructionName', 'location', 'id']"
      dateField="startDate"
      statusField="statusName"
      v-model:filteredItems="filteredPlans"
    />

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

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
