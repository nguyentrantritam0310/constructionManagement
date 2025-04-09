<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ConstructionPlanList from '../../components/construction/ConstructionPlanList.vue'
import CreatePlanDialog from '../../components/construction/CreatePlanDialog.vue'
import UpdatePlanDialog from '../../components/construction/UpdatePlanDialog.vue'

const router = useRouter()
const showCreateDialog = ref(false)
const showUpdateDialog = ref(false)
const selectedPlan = ref(null)
const plans = ref([])

// Giả lập lấy dữ liệu từ API
const fetchPlans = async () => {
  try {
    // Trong thực tế, đây sẽ là API call
    plans.value = [
      {
        planId: 'PLAN001',
        planName: 'Kế Hoạch Đổ Móng',
        projectCode: 'PRJ001',
        itemCode: 'ITEM001',
        supervisor: 'Nguyễn Văn A',
        startDate: '2024-02-01',
        endDate: '2024-03-15',
        status: 'In Progress'
      },
      {
        planId: 'PLAN002',
        planName: 'Kế Hoạch Xây Tường',
        projectCode: 'PRJ001',
        itemCode: 'ITEM002',
        supervisor: 'Nguyễn Văn B',
        startDate: '2024-03-16',
        endDate: '2024-04-30',
        status: 'Pending'
      },
      {
        planId: 'PLAN003',
        planName: 'Kế Hoạch Lắp Điện',
        projectCode: 'PRJ001',
        itemCode: 'ITEM003',
        supervisor: 'Trần Văn C',
        startDate: '2024-04-01',
        endDate: '2024-05-15',
        status: 'Not Started'
      }
    ]
  } catch (error) {
    console.error('Error fetching plans:', error)
  }
}

// Gọi fetchPlans khi component được mount
onMounted(() => {
  fetchPlans()
})

const handleCreatePlan = (newPlan) => {
  console.log('Creating new plan:', newPlan)
  plans.value.push({ ...newPlan, planId: `PLAN${plans.value.length + 1}` })
  showCreateDialog.value = false
}

const handleUpdatePlan = (updatedPlan) => {
  console.log('Updating plan:', updatedPlan)
  const index = plans.value.findIndex(p => p.planId === updatedPlan.planId)
  if (index !== -1) {
    plans.value[index] = updatedPlan
  }
  showUpdateDialog.value = false
  selectedPlan.value = null
}

const openUpdateDialog = (plan) => {
  selectedPlan.value = { ...plan }
  showUpdateDialog.value = true
}

// Cleanup function khi component unmount
const cleanup = () => {
  showCreateDialog.value = false
  showUpdateDialog.value = false
  selectedPlan.value = null
}

// Thêm beforeRouteLeave guard
const beforeRouteLeave = (to, from, next) => {
  cleanup()
  next()
}

defineExpose({
  beforeRouteLeave
})
</script>

<template>
  <div class="construction-plan">
    <div class="page-header">
      <h1>Quản Lý Kế Hoạch Thi Công</h1>
      <button class="btn-create" @click="showCreateDialog = true">
        <i class="fas fa-plus"></i>
        <span>Thêm Kế Hoạch</span>
      </button>
    </div>

    <ConstructionPlanList
      :plans="plans"
      @update="openUpdateDialog"
    />

    <CreatePlanDialog
      v-if="showCreateDialog"
      v-model:show="showCreateDialog"
      @submit="handleCreatePlan"
    />

    <UpdatePlanDialog
      v-if="selectedPlan"
      v-model:show="showUpdateDialog"
      :plan="selectedPlan"
      @submit="handleUpdatePlan"
    />
  </div>
</template>

<style scoped>
.construction-plan {
  padding: 2rem;
  animation: fadeIn 0.5s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

h1 {
  margin: 0;
  color: #333;
  position: relative;
}

h1::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #3498db;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

h1:hover::after {
  transform: scaleX(1);
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #3498db;
  color: white;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
}

.btn-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #2980b9;
}

.btn-create i {
  margin-right: 0.5rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
