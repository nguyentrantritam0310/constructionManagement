<script setup>
import { ref, computed } from 'vue'
import DataTable from '../common/DataTable.vue'
import StatusBadge from '../common/StatusBadge.vue'
import PlanDetailDialog from './PlanDetailDialog.vue'
import UpdateButton from '../common/UpdateButton.vue'
import StatusChangeDialog from '../common/StatusChangeDialog.vue'
import ChangeStatusButton from '../common/ChangeStatusButton.vue'
import { useConstructionPlan } from '../../composables/useConstructionPlan'
import { useToast } from '../../composables/useToast'
import PlanForm from './PlanForm.vue'
import ModalDialog from '../common/ModalDialog.vue'

const { plans, updatePlanStatus, fetchPlans } = useConstructionPlan()
const { showSuccess, showError } = useToast()

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
  { key: 'id', label: 'Mã KH' },
  { key: 'constructionName', label: 'Tên Công Trình' },
  { key: 'constructionItemName', label: 'Tên Hạng Mục' },
  { key: 'employeeName', label: 'Chỉ Huy Phụ Trách' },
  { key: 'startDate', label: 'Ngày BĐ', class: 'col-date' },
  { key: 'expectedCompletionDate', label: 'Ngày KTDK', class: 'col-date' },
  { key: 'actualCompletionDate', label: 'Ngày KTTT', class: 'col-date' },
  { key: 'statusName', label: 'Trạng Thái', class: 'col-status' },
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

const handleStatusSubmit = async (data) => {
  try {
    const { newStatus, item } = data
    await updatePlanStatus(item.id, newStatus)
    await fetchPlans()
    emit('update-status', {
      plan: item,
      newStatus
    })
    showStatusDialog.value = false
    selectedPlan.value = null
  } catch (error) {
    console.error('Error updating status:', error)
    showError('Không thể cập nhật trạng thái')
  }
}

const handleDetailSubmit = (updatedPlan) => {
  emit('update-volume', updatedPlan)
  showDetailDialog.value = false
  selectedPlan.value = null
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const formatDate = (date, isActualCompletion = false) => {
  if (!date) {
    return isActualCompletion ? '(Chưa cập nhật)' : '-'
  }
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="plan-list">
    <DataTable :columns="columns" :data="paginatedPlans" @row-click="handleRowClick" class="plan-table">
      <template #id="{ item }">
        <span class="fw-medium text-primary">{{ item.id }}</span>
      </template>

      <template #constructionName="{ item }">
        <div>
          <div class="fw-medium">{{ item.constructionName }}</div>
        </div>
      </template>

      <template #constructionItemName="{ item }">
        <div>
          <div class="fw-medium">{{ item.constructionItemName }}</div>
        </div>
      </template>

      <template #startDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar text-muted"></i>
          {{ formatDate(item.startDate) }}
        </div>
      </template>

      <template #expectedCompletionDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar-check text-muted"></i>
          {{ formatDate(item.expectedCompletionDate) }}
        </div>
      </template>

      <template #actualCompletionDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar-check text-muted"></i>
          {{ formatDate(item.actualCompletionDate, true) }}
        </div>
      </template>

      <template #statusName="{ item }">
        <StatusBadge :status="item.statusName" />
      </template>

      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="handleUpdateClick(item, $event)" />
          <ChangeStatusButton @click.stop="handleStatusClick(item, $event)" />
        </div>
      </template>
    </DataTable>

    <!-- Dialogs -->
    <PlanDetailDialog v-if="selectedPlan" :show="showDetailDialog" :plan="selectedPlan"
      @update:show="showDetailDialog = $event" @submit="handleDetailSubmit" />

    <ModalDialog v-if="selectedPlan" v-model:show="showUpdateDialog" title="Cập Nhật Kế Hoạch" size="lg">
      <PlanForm v-if="selectedPlan" mode="update" :plan="selectedPlan" @close="handleUpdateSubmit" />
    </ModalDialog>

    <StatusChangeDialog v-if="selectedPlan" :show="showStatusDialog" :item="selectedPlan" type="plan"
      title="Thay Đổi Trạng Thái Kế Hoạch" @update:show="showStatusDialog = $event" @submit="handleStatusSubmit" />
  </div>
</template>

<style scoped>
.plan-list {
  position: relative;
  animation: fadeIn 0.3s ease-out;
}

.plan-table {
  margin: 0;
}

.plan-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.plan-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.plan-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.plan-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
  white-space: nowrap;
  font-style: italic;
}

.date-info i {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.gap-2 {
  gap: 0.5rem;
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
