<script setup>
import { ref } from 'vue'
import ConstructionPlanList from '../../components/construction-plan/ConstructionPlanList.vue'
import CreatePlanForm from '../../components/construction-plan/CreatePlanForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'

const showCreateForm = ref(false)
const plans = ref([
  {
    id: 'PLAN001',
    planName: 'Kế hoạch đổ móng Block A',
    projectCode: 'PRJ001',
    itemCode: 'ITEM001',
    supervisor: 'Nguyễn Văn A',
    startDate: '2024-03-01',
    endDate: '2024-04-01',
    status: 'In Progress',
    currentVolume: 70,
    plannedVolume: 100,
    unit: 'm3'
  }
  // Thêm dữ liệu mẫu khác...
])

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
</script>

<template>
  <div class="container-fluid py-4">

    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Kế Hoạch Thi Công</h1>
      <ActionButton
        icon="fas fa-plus"
        type="primary"
        tooltip="Tạo Kế Hoạch Mới"
        @click="showCreateForm = true"
      >
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <ConstructionPlanList
      :plans="plans"
      @update-plan="handleUpdatePlan"
      @update-status="handleUpdateStatus"
      @update-volume="handleUpdateVolume"
    />

    <ModalDialog
      v-model:show="showCreateForm"
      title="Tạo Kế Hoạch Thi Công"
      size="lg"
    >
      <CreatePlanForm
        @submit="handleCreatePlan"
        @cancel="showCreateForm = false"
      />
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>