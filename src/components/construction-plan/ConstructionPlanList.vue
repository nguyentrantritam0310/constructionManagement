<script setup>
import { ref, computed } from 'vue'
import DataTable from '../common/DataTable.vue'
import StatusBadge from '../common/StatusBadge.vue'
import ActionButton from '../common/ActionButton.vue'
import UpdatePlanDialog from './UpdatePlanDialog.vue'
import ChangeStatusDialog from './ChangeStatusDialog.vue'
import PlanDetailDialog from './PlanDetailDialog.vue'
import Pagination from '../common/Pagination.vue'
import UpdateButton from '../common/UpdateButton.vue'
import ChangeStatusButton from '../common/ChangeStatusButton.vue'

const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-plan', 'update-status', 'update-volume'])

const showUpdateDialog = ref(false)
const showStatusDialog = ref(false)
const showDetailDialog = ref(false)
const selectedPlan = ref(null)
const currentPage = ref(1)
const itemsPerPage = 10

const columns = [
  { key: 'planName', label: 'Tên Kế Hoạch' },
  { key: 'projectCode', label: 'Mã Công Trình' },
  { key: 'itemCode', label: 'Mã Hạng Mục' },
  { key: 'supervisor', label: 'Chỉ Huy Phụ Trách' },
  { key: 'startDate', label: 'Ngày Bắt Đầu' },
  { key: 'endDate', label: 'Ngày Kết Thúc' },
  { key: 'status', label: 'Trạng Thái' }
]

// Tính toán dữ liệu cho trang hiện tại
const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.plans.slice(start, end)
})

const handleRowClick = (plan) => {
  console.log('Row clicked:', plan)
  selectedPlan.value = { ...plan }
  showDetailDialog.value = true
}

const handleUpdateClick = (plan, event) => {
  event.stopPropagation()
  selectedPlan.value = { ...plan }
  showUpdateDialog.value = true
}

const handleStatusClick = (plan, event) => {
  event.stopPropagation()
  selectedPlan.value = { ...plan }
  showStatusDialog.value = true
}

const handleUpdateSubmit = (updatedPlan) => {
  emit('update-plan', updatedPlan)
  showUpdateDialog.value = false
  selectedPlan.value = null
}

const handleStatusSubmit = (newStatus) => {
  emit('update-status', {
    plan: selectedPlan.value,
    newStatus
  })
  showStatusDialog.value = false
  selectedPlan.value = null
}

const handleDetailSubmit = (updatedPlan) => {
  emit('update-volume', updatedPlan)
  showDetailDialog.value = false
  selectedPlan.value = null
}

const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="plan-list">
    <DataTable
      :columns="columns"
      :data="paginatedPlans"
      @row-click="handleRowClick"
    >
      <template #status="{ item }">
        <StatusBadge :status="item.status" type="construction" />
      </template>

      <template #actions="{ item }">
        <div class="d-flex gap-2" @click.stop>
          <UpdateButton
            @click="(e) => handleUpdateClick(item, e)"
          />
          <ChangeStatusButton
            @click="(e) => handleStatusClick(item, e)"
          />
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div class="d-flex justify-content-center mt-4">
      <Pagination
        :total-items="plans.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Dialogs -->
    <PlanDetailDialog
      v-if="selectedPlan"
      :show="showDetailDialog"
      :plan="selectedPlan"
      @update:show="showDetailDialog = $event"
      @submit="handleDetailSubmit"
    />

    <UpdatePlanDialog
      v-if="selectedPlan"
      :show="showUpdateDialog"
      :plan="selectedPlan"
      @update:show="showUpdateDialog = $event"
      @submit="handleUpdateSubmit"
    />

    <ChangeStatusDialog
      v-if="selectedPlan"
      :show="showStatusDialog"
      :plan="selectedPlan"
      @update:show="showStatusDialog = $event"
      @submit="handleStatusSubmit"
    />
  </div>
</template>

<style scoped>
.plan-list {
  position: relative;
}

:deep(.table) {
  transition: opacity 0.3s ease;
}

:deep(.table.loading) {
  opacity: 0.6;
}

/* Add transition for page changes */
.plan-list {
  position: relative;
}

:deep(.table) {
  transition: opacity 0.3s ease;
}

:deep(.table.loading) {
  opacity: 0.6;
}

.progress {
  height: 20px;
  background-color: #e9ecef;
  border-radius: 4px;
}

.progress-bar {
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 20px;
  transition: width 0.3s ease;
}
</style>