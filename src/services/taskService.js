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

  // Tạo task mới
  createTask: async (planId, taskData) => {
    try {
      const response = await axios.post(`${API_URL}/ConstructionTask`, {
        ...taskData,
        constructionPlanID: planId,
        constructionStatusID: 1 // Mặc định là trạng thái mới
      })
      return response.data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Cập nhật task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await axios.put(`${API_URL}/ConstructionTask/${taskId}`, taskData)
      return response.data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Cập nhật nhiều task cùng lúc
  updateTasks: async (planId, tasks) => {
    try {
      const response = await axios.put(`${API_URL}/ConstructionTask/plan/${planId}`, tasks)
      return response.data
    } catch (error) {
      console.error('Error updating tasks:', error)
      throw error
    }
  }
}
