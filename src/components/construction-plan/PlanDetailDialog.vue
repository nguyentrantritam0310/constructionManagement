<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import DataTable from '../common/DataTable.vue'
import ActionButton from '../common/ActionButton.vue'
import CreateTaskDialog from './CreateTaskDialog.vue'
import Pagination from '../common/Pagination.vue'
import { useToast } from '../../composables/useToast'
import { useTask } from '../../composables/useTask'
import StatusBadge from '../common/StatusBadge.vue'

const { showSuccess, showError } = useToast()

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

const {
  tasks,
  loading,
  error,
  fetchTasks,
  createTask,
  updateTask,
  updateTasks
} = useTask()

onMounted(() => {
  fetchTasks(props.plan.id)
})

// Phân trang
const currentPage = ref(1)
const itemsPerPage = 5

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return tasks.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

// Fetch tasks when plan changes
watch(() => props.plan, async (newPlan) => {
  if (newPlan && newPlan.id) {
    console.log('Fetching tasks for plan:', newPlan.id)
    await fetchTasks(newPlan.id)
  }
}, { immediate: true })

const columns = [
  { key: 'id', label: 'Mã nhiệm vụ' },
  { key: 'unit', label: 'Đơn vị' },
  { key: 'workload', label: 'Khối lượng hoạch định' },
  { key: 'currentVolume', label: 'Khối lượng hiện tại' },
  { key: 'actualVolume', label: 'Khối lượng thực tế' },
  { key: 'statusName', label: 'Trạng thái' }
]

const hasUnsavedChanges = ref(false)
const showConfirmDialog = ref(false)
const showCreateTaskDialog = ref(false)

const isEditable = computed(() => {
  return props.plan.statusName === 'In Progress' ||
    props.plan.statusName === 'Đang thi công' ||
    props.plan.statusName === 1
})

const validateVolume = (value, task) => {
  const volume = parseFloat(value)
  if (isNaN(volume) || volume < 0) {
    return false
  }
  // Kiểm tra không vượt quá khối lượng hoạch định
  if (volume > task.plannedVolume) {
    showError('Khối lượng thực tế không được vượt quá khối lượng hoạch định')
    return false
  }
  return true
}

const handleVolumeChange = (task, value) => {
  if (!validateVolume(value, task)) {
    return
  }

  const index = tasks.value.findIndex(t => t.id === task.id)
  if (index !== -1) {
    tasks.value[index].currentVolume = parseFloat(value)
    // Tính khối lượng thực tế = khối lượng hoạch định - khối lượng hiện tại
    tasks.value[index].actualVolume = task.workload - parseFloat(value)
    hasUnsavedChanges.value = true
  }
}

const handleCreateTask = async (newTask) => {
  try {
    // Kiểm tra trùng lặp tên nhiệm vụ
    if (tasks.value.some(t => t.name === newTask.name)) {
      showError('Tên nhiệm vụ đã tồn tại')
      return
    }

    const taskData = {
      ...newTask,
      constructionPlanID: props.plan.id,
      constructionStatusID: 1, // Mặc định là trạng thái mới
      workload: 0 // Khối lượng thực tế ban đầu là 0
    }

    await createTask(props.plan.id, taskData)
    showCreateTaskDialog.value = false
  } catch (err) {
    console.error('Error creating task:', err)
  }
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

const handleSubmit = async () => {
  try {
    const invalidTasks = tasks.value.filter(
      task => task.workload > 0 && !validateVolume(task.workload, task)
    )

    if (invalidTasks.length > 0) {
      showError('Vui lòng kiểm tra lại khối lượng nhập vào')
      return
    }

    await updateTasks(props.plan.id, tasks.value)
    emit('submit', {
      ...props.plan,
      tasks: tasks.value
    })
    hasUnsavedChanges.value = false
  } catch (err) {
    console.error('Error updating tasks:', err)
  }
}
</script>

<template>
  <ModalDialog :show="show" @update:show="handleClose" title="Chi Tiết Kế Hoạch Thi Công" size="xl">
    <div class="plan-detail">
      <div class="alert alert-info mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="alert-heading">{{ plan.planName }}</h5>
            <p class="mb-0">Trạng thái: {{ plan.status }}</p>
          </div>
          <button class="btn btn-primary" @click="showCreateTaskDialog = true" :disabled="!isEditable">
            <i class="fas fa-plus me-2"></i>
            Thêm Nhiệm Vụ
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <template v-else>
        <DataTable :columns="columns" :data="paginatedTasks">
          <template #currentVolume="{ item }">
            <input
              type="number"
              class="form-control form-control-sm"
              :value="item.currentVolume"
              :disabled="!isEditable"
              @input="(e) => handleVolumeChange(item, e.target.value)"
              min="0"
              :max="item.workload"
              step="0.01"
            />
          </template>

          <template #actualVolume="{ item }">
            <span>{{ item.actualVolume || 0 }}</span>
          </template>

          <template #statusName="{ item }">
            <StatusBadge :status="item.statusName" />
          </template>
        </DataTable>

        <!-- Phân trang -->
        <div class="d-flex justify-content-between align-items-center mt-4">
          <div class="text-muted">
            Hiển thị {{ paginatedTasks.length }} trên {{ tasks.length }} nhiệm vụ
          </div>
          <Pagination :total-items="tasks.length" :items-per-page="itemsPerPage" :current-page="currentPage"
            @update:currentPage="handlePageChange" />
        </div>
      </template>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          Hủy
        </button>
        <button type="button" class="btn btn-primary" @click="handleSubmit"
          :disabled="!isEditable || !hasUnsavedChanges">
          Xác nhận
        </button>
      </div>
    </div>

    <!-- Create Task Dialog -->
    <CreateTaskDialog v-if="showCreateTaskDialog" :show="showCreateTaskDialog"
      @update:show="showCreateTaskDialog = $event" @submit="handleCreateTask" />

    <!-- Confirm Dialog -->
    <ModalDialog v-if="showConfirmDialog" :show="showConfirmDialog" @update:show="showConfirmDialog = $event"
      title="Xác nhận" size="sm">
      <div class="text-center">
        <p>Thông tin vẫn chưa được lưu bạn có chắc muốn thoát không?</p>
        <div class="d-flex justify-content-center gap-2 mt-3">
          <button class="btn btn-secondary" @click="handleConfirmClose(false)">
            Không đồng ý
          </button>
          <button class="btn btn-primary" @click="handleConfirmClose(true)">
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
