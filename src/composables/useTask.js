import { ref } from 'vue'
import { taskService } from '../services/taskService'
import { useGlobalMessage } from './useGlobalMessage'

const { showMessage } = useGlobalMessage()

export const useTask = () => {
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Lấy danh sách task theo plan ID
  const fetchTasks = async (planId) => {
    try {
      loading.value = true
      error.value = null
      const data = await taskService.getTasksByPlanId(planId)
      tasks.value = data
    } catch (err) {
      error.value = 'Không thể tải danh sách nhiệm vụ'
      showMessage('Không thể tải danh sách nhiệm vụ', 'error')
    } finally {
      loading.value = false
    }
  }

  // Lấy danh sách task theo item (hạng mục) ID
  const fetchTasksByItemId = async (itemId) => {
    try {
      loading.value = true
      error.value = null
      const data = await taskService.getTasksByItemId(itemId)
      return data
    } catch (err) {
      error.value = 'Không thể tải danh sách nhiệm vụ theo hạng mục'
      showMessage('Không thể tải danh sách nhiệm vụ theo hạng mục', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  // Thêm nhiệm vụ mới
  const createTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData)
      showMessage('Thêm nhiệm vụ thành công', 'success')
      return newTask
    } catch (err) {
      showMessage('Không thể thêm nhiệm vụ mới', 'error')
      throw err
    }
  }

  // Sửa nhiệm vụ
  const updateTask = async (id, taskData) => {
    try {
      const updatedTask = await taskService.updateTask(id, taskData)
      showMessage('Cập nhật nhiệm vụ thành công', 'success')
      return updatedTask
    } catch (err) {
      showMessage('Không thể cập nhật nhiệm vụ', 'error')
      throw err
    }
  }

  // Chuyển trạng thái nhiệm vụ
  const changeTaskStatus = async (id, status) => {
    try {
      const result = await taskService.changeTaskStatus(id, status)
      showMessage('Cập nhật trạng thái nhiệm vụ thành công', 'success')
      return result
    } catch (err) {
      showMessage('Không thể cập nhật trạng thái nhiệm vụ', 'error')
      throw err
    }
  }

  // Cập nhật actualWorkload cho task
  const updateActualWorkload = async (id, actualWorkload) => {
    try {
      const result = await taskService.updateActualWorkload(id, actualWorkload)
      showMessage('Cập nhật khối lượng thực tế thành công', 'success')
      return result
    } catch (err) {
      showMessage('Không thể cập nhật khối lượng thực tế', 'error')
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTasksByItemId,
    createTask,
    updateTask,
    changeTaskStatus,
    updateActualWorkload
  }
}
