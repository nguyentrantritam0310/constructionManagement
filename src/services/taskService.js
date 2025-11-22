import api from '../api'

export const taskService = {
  // Lấy danh sách task theo plan ID
  getTasksByPlanId: async (planId) => {
    try {
      const response = await api.get(`/ConstructionTask/${planId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  // Lấy danh sách task theo item (hạng mục) ID
  getTasksByItemId: async (itemId) => {
    try {
      const response = await api.get(`/ConstructionTask/item/${itemId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching tasks by item:', error)
      throw error
    }
  },

  // Thêm nhiệm vụ mới
  createTask: async (taskData) => {
    try {
      const response = await api.post('/ConstructionTask', taskData)
      return response.data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Sửa nhiệm vụ
  updateTask: async (id, taskData) => {
    try {
      const response = await api.put(`/ConstructionTask/${id}`, taskData)
      return response.data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Chuyển trạng thái nhiệm vụ
  changeTaskStatus: async (id, status) => {
    try {
      const response = await api.patch(`/ConstructionTask/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Error changing task status:', error)
      throw error
    }
  },

  // Cập nhật actualWorkload cho task
  updateActualWorkload: async (id, actualWorkload) => {
    try {
      const response = await api.patch(`/ConstructionTask/${id}/actual`, { actualWorkload })
      return response.data
    } catch (error) {
      console.error('Error updating actualWorkload:', error)
      throw error
    }
  },
}
