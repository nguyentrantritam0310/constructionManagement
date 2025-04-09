<script setup>
import { ref, watch } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import DataTable from '../common/DataTable.vue'
import ActionButton from '../common/ActionButton.vue'
import CreateTaskDialog from './CreateTaskDialog.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  plan: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:show', 'submit'])

// Giả lập dữ liệu chi tiết nhiệm vụ (sau này sẽ lấy từ API)
const tasks = ref([
  {
    id: 1,
    taskCode: 'NV001',
    name: 'Đào móng Block A - Phần 1',
    unit: 'm3',
    plannedVolume: 50,
    currentVolume: 30,
    monthlyPlan: 20,
    actualVolume: 0
  },
  {
    id: 2,
    taskCode: 'NV002',
    name: 'Đào móng Block A - Phần 2',
    unit: 'm3',
    plannedVolume: 50,
    currentVolume: 20,
    monthlyPlan: 30,
    actualVolume: 0
  }
])

const columns = [
  { key: 'taskCode', label: 'Mã nhiệm vụ' },
  { key: 'name', label: 'Tên nhiệm vụ' },
  { key: 'unit', label: 'Đơn vị' },
  { key: 'plannedVolume', label: 'Khối lượng hoạch định' },
  { key: 'currentVolume', label: 'Khối lượng hiện tại' },
  { key: 'monthlyPlan', label: 'Kế hoạch tháng' },
  { key: 'actualVolume', label: 'Khối lượng thực tế' },
  { key: 'progress', label: 'Tiến độ' }
]

const hasUnsavedChanges = ref(false)
const showConfirmDialog = ref(false)
const showCreateTaskDialog = ref(false)

const validateVolume = (value) => {
  const volume = parseFloat(value)
  return !isNaN(volume) && volume >= 0
}

const handleVolumeChange = (task, value) => {
  if (!validateVolume(value)) {
    alert('Vui lòng nhập khối lượng hợp lệ')
    return
  }

  const index = tasks.value.findIndex(t => t.id === task.id)
  if (index !== -1) {
    tasks.value[index].actualVolume = parseFloat(value)
    hasUnsavedChanges.value = true
  }
}

const handleCreateTask = (newTask) => {
  tasks.value.push({
    id: tasks.value.length + 1,
    taskCode: `NV${String(tasks.value.length + 1).padStart(3, '0')}`,
    ...newTask,
    currentVolume: 0,
    actualVolume: 0
  })
  showCreateTaskDialog.value = false
}

const handleClose = () => {
  if (hasUnsavedChanges.value) {
    showConfirmDialog.value = true
  } else {
    emit('update:show', false)
  }
}

const handleConfirmClose = (confirm) => {
  showConfirmDialog.value = false
  if (confirm) {
    emit('update:show', false)
  }
}

const handleSubmit = () => {
  const invalidTasks = tasks.value.filter(
    task => task.actualVolume > 0 && !validateVolume(task.actualVolume)
  )

  if (invalidTasks.length > 0) {
    alert('Vui lòng kiểm tra lại khối lượng nhập vào')
    return
  }

  emit('submit', {
    ...props.plan,
    tasks: tasks.value.map(task => ({
      ...task,
      currentVolume: task.actualVolume > 0 ? task.actualVolume : task.currentVolume
    }))
  })
  hasUnsavedChanges.value = false
}

const getTotalProgress = () => {
  const totalPlanned = tasks.value.reduce((sum, task) => sum + task.plannedVolume, 0)
  const totalCurrent = tasks.value.reduce((sum, task) => sum + task.currentVolume, 0)
  return totalPlanned > 0 ? (totalCurrent / totalPlanned) * 100 : 0
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="handleClose"
    title="Chi Tiết Kế Hoạch Thi Công"
    size="xl"
  >
    <div class="plan-detail">
      <div class="alert alert-info mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="alert-heading">{{ plan.planName }}</h5>
            <p class="mb-0">Trạng thái: {{ plan.status }}</p>
          </div>
          <button
            class="btn btn-primary"
            @click="showCreateTaskDialog = true"
            :disabled="plan.status !== 'In Progress'"
          >
            <i class="fas fa-plus me-2"></i>
            Thêm Nhiệm Vụ
          </button>
        </div>
      </div>

      <!-- Tổng tiến độ -->
      <div class="mb-4">
        <h6>Tổng tiến độ:</h6>
        <div class="progress" style="height: 25px;">
          <div
            class="progress-bar"
            :style="{
              width: `${getTotalProgress()}%`,
              backgroundColor: getTotalProgress() >= 100 ? '#28a745' : '#007bff'
            }"
          >
            {{ Math.round(getTotalProgress()) }}%
          </div>
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="tasks"
      >
        <template #actualVolume="{ item }">
          <input
            type="number"
            class="form-control form-control-sm"
            :value="item.actualVolume"
            :disabled="plan.status !== 'In Progress'"
            @input="(e) => handleVolumeChange(item, e.target.value)"
          />
        </template>

        <template #progress="{ item }">
          <div class="progress" style="height: 20px;">
            <div
              class="progress-bar"
              :style="{
                width: `${(item.currentVolume / item.plannedVolume) * 100}%`,
                backgroundColor: item.currentVolume >= item.plannedVolume ? '#28a745' : '#007bff'
              }"
            >
              {{ Math.round((item.currentVolume / item.plannedVolume) * 100) }}%
            </div>
          </div>
        </template>
      </DataTable>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
        >
          Hủy
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="plan.status !== 'In Progress' || !hasUnsavedChanges"
        >
          Xác nhận
        </button>
      </div>
    </div>

    <!-- Create Task Dialog -->
    <CreateTaskDialog
      v-if="showCreateTaskDialog"
      :show="showCreateTaskDialog"
      @update:show="showCreateTaskDialog = $event"
      @submit="handleCreateTask"
    />

    <!-- Confirm Dialog -->
    <ModalDialog
      v-if="showConfirmDialog"
      :show="showConfirmDialog"
      @update:show="showConfirmDialog = $event"
      title="Xác nhận"
      size="sm"
    >
      <div class="text-center">
        <p>Thông tin vẫn chưa được lưu bạn có chắc muốn thoát không?</p>
        <div class="d-flex justify-content-center gap-2 mt-3">
          <button
            class="btn btn-secondary"
            @click="handleConfirmClose(false)"
          >
            Không đồng ý
          </button>
          <button
            class="btn btn-primary"
            @click="handleConfirmClose(true)"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </ModalDialog>
  </ModalDialog>
</template>

<style scoped>
.plan-detail {
  min-height: 400px;
}

.progress {
  margin: 0;
  background-color: #e9ecef;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  transition: width 0.3s ease;
}

:deep(.table) {
  margin-bottom: 0;
}

:deep(.form-control-sm) {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style>
