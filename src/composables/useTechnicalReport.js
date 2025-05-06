import { ref } from 'vue'
import api from '../api.js'

export function useTechnicalReport() {
  const reports = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchReports = async () => {
    try {
      loading.value = true
      const response = await api.get('/Report')
      reports.value = response.data
      status: response.statusLogs?.[0]?.status || 'Pending'
    } catch (err) {
      error.value = err.message
      console.error('Error fetching reports:', err)
    } finally {
      loading.value = false
    }
  }

  const createReport = async (reportData) => {
    try {
      loading.value = true
      const response = await api.post('/reports', reportData)
      reports.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateReport = async (reportId, reportData) => {
    try {
      loading.value = true
      const response = await api.put(`/reports/${reportId}`, reportData)
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1) {
        reports.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      loading.value = true
      const response = await api.patch(`/reports/${reportId}/status`, { status: newStatus })
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1) {
        reports.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
    updateReport,
    updateReportStatus
  }
}
