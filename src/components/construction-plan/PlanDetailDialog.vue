<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import DataTable from '../common/DataTable.vue'
import ActionButton from '../common/ActionButton.vue'
import CreateTaskDialog from './CreateTaskDialog.vue'
import Pagination from '../common/Pagination.vue'
import { useTask } from '../../composables/useTask'
import StatusBadge from '../common/StatusBadge.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import UpdateButton from '../common/UpdateButton.vue'
import ChangeStatusButton from '../common/ChangeStatusButton.vue'
import StatusChangeDialog from '../common/StatusChangeDialog.vue'

const { showMessage } = useGlobalMessage()

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
  updateTasks,
  fetchTasksByItemId,
  changeTaskStatus,
  updateActualWorkload
} = useTask()

onMounted(() => {
  fetchTasks(props.plan.id)
})

const allTasksOfCategory = ref([])

onMounted(async () => {
  if (props.plan.constructionItemID) {
    allTasksOfCategory.value = await fetchTasksByItemId(props.plan.constructionItemID)
  }
})

// Nếu plan thay đổi thì cũng fetch lại
watch(() => props.plan, async (newPlan) => {
  if (newPlan && newPlan.constructionItemID) {
    allTasksOfCategory.value = await fetchTasksByItemId(newPlan.constructionItemID)
  }
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
  { key: 'workload', label: 'Khối lượng hoạch định' },
  { key: 'currentVolume', label: 'Khối lượng hiện tại' },
  { key: 'actualWorkload', label: 'Khối lượng thực tế' },
  { key: 'statusName', label: 'Trạng thái' },
]

const hasUnsavedChanges = ref(false)
const showConfirmDialog = ref(false)
const showCreateTaskDialog = ref(false)

const showEditTaskDialog = ref(false)
const editingTask = ref(null)

const showStatusDialog = ref(false)
const selectedTask = ref(null)

const handleEditTask = (task) => {
  editingTask.value = { ...task }
  showEditTaskDialog.value = true
}

const handleEditTaskSubmit = async (updatedTask) => {
  console.log('handleEditTaskSubmit', updatedTask)
  try {
    await updateTask(updatedTask.id, {
      id: updatedTask.id,
      constructionStatusID: updatedTask.constructionStatusID ?? 1,
      constructionPlanID: props.plan.id,
      workload: parseFloat(updatedTask.workload ?? updatedTask.plannedVolume ?? 0)
    })
    await fetchTasks(props.plan.id)
    allTasksOfCategory.value = await fetchTasksByItemId(props.plan.constructionItemID)
    showEditTaskDialog.value = false
    editingTask.value = null
  } catch (err) {
    // showMessage đã có trong useTask
  }
}

const isEditable = computed(() => {
  return props.plan.statusName === 'In Progress' ||
    props.plan.statusName === 'Đang thi công' ||
    props.plan.statusName === 'Pending' ||
    props.plan.statusName === 'Chờ khởi công'

})

const validateVolume = (value, task) => {
  const volume = parseFloat(value)
  if (isNaN(volume) || volume < 0) {
    return false
  }
  // Khối lượng thực tế không vượt quá hoạch định
  if (volume > task.workload) {
    showMessage('Khối lượng thực tế không được vượt quá khối lượng hoạch định', 'error')
    return false
  }
  return true
}

const handleVolumeChange = (task, value) => {
  // Không cho sửa nếu trạng thái không hợp lệ
  const forbidden = ['Chờ khởi công', 'Hủy bỏ', 'Tạm dừng']
  if (forbidden.includes(task.statusName)) {
    showMessage('Không thể sửa khối lượng thực tế khi nhiệm vụ đang ở trạng thái: ' + task.statusName, 'error')
    return
  }
  if (!validateVolume(value, task)) {
    return
  }
  const index = tasks.value.findIndex(t => t.id === task.id)
  if (index !== -1) {
    tasks.value[index].actualWorkload = parseFloat(value)
    tasks.value[index].currentVolume = task.workload - parseFloat(value)
    hasUnsavedChanges.value = true
  }
}

const handleCreateTask = async (newTask) => {
  try {
    // newTask cần có constructionPlanID, workload, constructionStatusID
    await createTask({
      ...newTask,
      constructionPlanID: props.plan.id,
      constructionStatusID: 1 // hoặc trạng thái mặc định
    })
    await fetchTasks(props.plan.id)
    allTasksOfCategory.value = await fetchTasksByItemId(props.plan.constructionItemID)
    showCreateTaskDialog.value = false
  } catch (err) {
    // showMessage đã có trong useTask
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
      showMessage('Vui lòng kiểm tra lại khối lượng nhập vào', 'error')
      return
    }

    // Lặp qua tất cả nhiệm vụ và gọi API cập nhật actualWorkload
    for (const task of tasks.value) {
      await updateActualWorkload(task.id, task.actualWorkload)
    }

    // KHÔNG emit('submit', ...) nếu không muốn đóng modal
    hasUnsavedChanges.value = false
    showMessage('Cập nhật khối lượng thực tế thành công', 'success')
  } catch (err) {
    console.error('Error updating actualWorkload:', err)
  }
}

const handleChangeStatus = (task) => {
  selectedTask.value = { ...task }
  showStatusDialog.value = true
}

const handleStatusSubmit = async ({ newStatus, item }) => {
  try {
    await changeTaskStatus(item.id, newStatus)
    await fetchTasks(props.plan.id)
    allTasksOfCategory.value = await fetchTasksByItemId(props.plan.constructionItemID)
    showStatusDialog.value = false
    selectedTask.value = null
    // showMessage đã nằm trong useTask
    hasUnsavedChanges.value = true
  } catch (error) {
    // showMessage đã nằm trong useTask
  }
}

const groupedTasks = computed(() => {
  const groups = {}
  props.existingTasks.forEach(t => {
    const key = t.planName || t.planId || 'Chưa rõ kế hoạch'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return groups
})
</script>

<template>
  <ModalDialog :show="show" @update:show="handleClose" title="Chi Tiết Kế Hoạch Thi Công" size="xl">
    <div class="plan-detail">
      <div class="alert alert-info mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="alert-heading">{{ plan.planName }}</h5>
            <p class="mb-0">Trạng thái:
              <StatusBadge :status="plan.statusName" />
            </p>
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

          <template #workload="{ item }">
            <span>{{ item.workload }} {{ item.unitOfMeasurementName }}</span>
          </template>

          <template #actualWorkload="{ item }">
            <input type="number" class="form-control form-control-sm" :value="item.actualWorkload"
              :disabled="['Chờ khởi công', 'Hủy bỏ', 'Tạm dừng', 'Hoàn thành'].includes(item.statusName)"
              @input="(e) => handleVolumeChange(item, e.target.value)" min="0" :max="item.workload" step="0.01" />
          </template>

          <template #currentVolume="{ item }">
            <span>{{ item.currentVolume ?? (item.workload - (item.actualWorkload || 0)) }} {{ item.unitOfMeasurementName
            }}</span>
          </template>

          <template #statusName="{ item }">
            <StatusBadge :status="item.statusName" />
          </template>

          <template #actions="{ item }">
            <div class="d-flex justify-content-center gap-2">
              <UpdateButton @click.stop="handleEditTask(item)" />
              <ChangeStatusButton @click.stop="handleChangeStatus(item)" />
            </div>
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
    <CreateTaskDialog v-if="showCreateTaskDialog" :show="showCreateTaskDialog" :existingTasks="allTasksOfCategory"
      :totalWorkload="(tasks[0]?.totalWorkload ?? plan.totalWorkload ?? 0)"
      :unit="(tasks[0]?.unitOfMeasurementName ?? plan.unitOfMeasurementName ?? '')"
      @update:show="showCreateTaskDialog = $event" @submit="handleCreateTask" />

    <!-- Edit Task Dialog -->
    <CreateTaskDialog v-if="showEditTaskDialog" :show="showEditTaskDialog" :task="editingTask" mode="edit"
      :existingTasks="allTasksOfCategory" :totalWorkload="(tasks[0]?.totalWorkload ?? plan.totalWorkload ?? 0)"
      :unit="(tasks[0]?.unitOfMeasurementName ?? plan.unitOfMeasurementName ?? '')"
      @update:show="showEditTaskDialog = $event" @submit="handleEditTaskSubmit" />

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

    <!-- Status Change Dialog -->
    <StatusChangeDialog v-if="showStatusDialog && selectedTask" :show="showStatusDialog" :item="selectedTask"
      type="task" title="Thay Đổi Trạng Thái Nhiệm Vụ" @update:show="showStatusDialog = $event"
      @submit="handleStatusSubmit" />
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

:deep(.col-actions) {
  width: 60px;
  text-align: center;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
