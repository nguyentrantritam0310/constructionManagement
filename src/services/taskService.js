import axios from 'axios'

const API_URL = 'http://localhost:5244/api'

export const taskService = {
  // Lấy danh sách task theo plan ID
  getTasksByPlanId: async (planId) => {
    try {
      const response = await axios.get(`/ConstructionTask/${planId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  // Lấy danh sách task theo item (hạng mục) ID
  getTasksByItemId: async (itemId) => {
    try {
      const response = await axios.get(`${API_URL}/ConstructionTask/item/${itemId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching tasks by item:', error)
      throw error
    }
  },

  // Thêm nhiệm vụ mới
  createTask: async (taskData) => {
    try {
      const response = await axios.post(`${API_URL}/ConstructionTask`, taskData)
      return response.data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Sửa nhiệm vụ
  updateTask: async (id, taskData) => {
    try {
      const response = await axios.put(`${API_URL}/ConstructionTask/${id}`, taskData)
      return response.data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Chuyển trạng thái nhiệm vụ
  changeTaskStatus: async (id, status) => {
    try {
      const response = await axios.patch(`${API_URL}/ConstructionTask/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Error changing task status:', error)
      throw error
    }
  },

  // Cập nhật actualWorkload cho task
  updateActualWorkload: async (id, actualWorkload) => {
    try {
      const response = await axios.patch(
        `http://localhost:5244/api/ConstructionTask/${id}/actual`,
        { actualWorkload }
      )
      return response.data
    } catch (error) {
      console.error('Error updating actualWorkload:', error)
      throw error
    }
  },
}
