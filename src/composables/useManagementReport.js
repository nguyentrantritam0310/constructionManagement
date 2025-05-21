import { ref } from 'vue'
import api from '../api.js'

export function useManagementReport() {
  const reports = ref([])
  const loading = ref(false)
  const error = ref(null)
  const formData = ref({
    constructionID: '',
    reportType: '',
    content: '',
    level: '',
    status: 'Pending',
    reportDate: new Date().toISOString().split('T')[0],
    attachments: []
  })

  const fetchReports = async () => {
    try {
      loading.value = true
      const response = await api.get('/Report')
      reports.value = response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching reports:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchReportsByThiCong = async () => {
    try {
      loading.value = true
      const response = await api.get('/Report/thicong')
      reports.value = response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching reports:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchReportsByKiThuat = async () => {
    try {
      loading.value = true
      const response = await api.get('/Report/kithuat')
      reports.value = response.data
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
      console.log('📝 Starting report creation')

      // Ensure reportData is FormData
      if (!(reportData instanceof FormData)) {
        throw new Error('Expected FormData object for report creation')
      }

      // Log request details
      console.log('📤 Request details:')
      console.log('- Endpoint: /Report')
      console.log('- Method: POST')
      console.log('- Content-Type: multipart/form-data')
      console.log('- FormData contents:')
      for (let [key, value] of reportData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? `File(${value.name}, ${value.type})` : value}`)
      }

      const response = await api.post('/Report', reportData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ Report created successfully:', response.data)
      reports.value.push(response.data)
      return response.data
    } catch (err) {
      console.error('❌ Error creating report:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText
      })

      // Log detailed error information
      if (err.response) {
        console.error('Response details:', {
          data: err.response.data,
          headers: err.response.headers,
          validationErrors: err.response.data?.errors
        })

        // Handle specific error cases
        if (err.response.status === 400) {
          const errorMessage = err.response.data?.errors
            ? Object.entries(err.response.data.errors)
                .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                .join('\n')
            : err.response.data?.message || 'Invalid request data'
          error.value = `Validation error: ${errorMessage}`
        } else {
          error.value = `Server error: ${err.response.statusText}`
        }
      } else if (err.request) {
        console.error('No response received:', err.request)
        error.value = 'No response received from server'
      } else {
        console.error('Error setting up request:', err.message)
        error.value = err.message
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateReport = async (reportId, reportData) => {
    try {
      loading.value = true
      console.log('🔄 Starting report update')

      // Ensure reportData is FormData
      if (!(reportData instanceof FormData)) {
        throw new Error('Expected FormData object for report update')
      }

      // Get ID from either parameter or FormData
      const id = reportId || reportData.get('ID')
      if (!id) {
        throw new Error('Report ID is required for update')
      }

      // Log request details
      console.log('📤 Request details:')
      console.log('- Endpoint:', `/Report/${id}`)
      console.log('- Method: PUT')
      console.log('- Content-Type: multipart/form-data')
      console.log('- FormData contents:')

      // Log all form data entries
      const formDataEntries = {};
      for (let [key, value] of reportData.entries()) {
        formDataEntries[key] = value instanceof File ? `File(${value.name})` : value;
        console.log(`  ${key}: ${value instanceof File ? `File(${value.name}, ${value.type})` : value}`)
      }

      // Validate that required fields are present
      const requiredFields = ['ID', 'ConstructionID', 'ReportType', 'Content', 'Level'];
      const missingFields = requiredFields.filter(field => !formDataEntries[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await api.put(`/Report/${id}`, reportData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ Report updated successfully:', response.data)

      // Update local state
      const index = reports.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reports.value[index] = response.data
      }
      return response.data
    } catch (err) {
      console.error('❌ Error updating report:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText
      })

      // Log detailed error information
      if (err.response) {
        console.error('Response details:', {
          data: err.response.data,
          headers: err.response.headers,
          validationErrors: err.response.data?.errors
        })

        // Handle specific error cases
        if (err.response.status === 400) {
          const errorMessage = err.response.data?.errors
            ? Object.entries(err.response.data.errors)
                .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                .join('\n')
            : err.response.data?.message || 'Invalid request data'
          error.value = `Validation error: ${errorMessage}`
        } else {
          error.value = `Server error: ${err.response.statusText}`
        }
      } else if (err.request) {
        console.error('No response received:', err.request)
        error.value = 'No response received from server'
      } else {
        console.error('Error setting up request:', err.message)
        error.value = err.message
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateReportStatus = async (reportId, status, note = '') => {
    try {
      loading.value = true
      const statusDTO = {
        id: reportId,
        status: status,
        note: note || (status === 1 ? 'Đã duyệt báo cáo' : 'Đã từ chối báo cáo')
      }

      const response = await api.put(`/Report/${reportId}/status`, statusDTO)

      // Update local state
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1) {
        reports.value[index] = response.data
      }
      return response.data
    } catch (err) {
      console.error('Error updating report status:', err)
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    reports,
    loading,
    error,
    formData,
    fetchReports,
    fetchReportsByThiCong,
    fetchReportsByKiThuat,
    createReport,
    updateReport,
    updateReportStatus
  }
}
