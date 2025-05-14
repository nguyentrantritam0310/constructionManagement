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

  // Tạo task mới
  const createTask = async (planId, taskData) => {
    try {
      loading.value = true
      error.value = null
      const newTask = await taskService.createTask(planId, taskData)
      tasks.value.push(newTask)
      showMessage('Thêm nhiệm vụ thành công', 'success')
      return newTask
    } catch (err) {
      error.value = 'Không thể thêm nhiệm vụ mới'
      showMessage('Không thể thêm nhiệm vụ mới', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cập nhật task
  const updateTask = async (taskId, taskData) => {
    try {
      loading.value = true
      error.value = null
      const updatedTask = await taskService.updateTask(taskId, taskData)
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      showMessage('Cập nhật nhiệm vụ thành công', 'success')
      return updatedTask
    } catch (err) {
      error.value = 'Không thể cập nhật nhiệm vụ'
      showMessage('Không thể cập nhật nhiệm vụ', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cập nhật nhiều task cùng lúc
  const updateTasks = async (planId, tasksData) => {
    try {
      loading.value = true
      error.value = null
      const updatedTasks = await taskService.updateTasks(planId, tasksData)
      tasks.value = updatedTasks
      showMessage('Cập nhật nhiệm vụ thành công', 'success')
      return updatedTasks
    } catch (err) {
      error.value = 'Không thể cập nhật nhiệm vụ'
      showMessage('Không thể cập nhật nhiệm vụ', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTasks
  }
}
