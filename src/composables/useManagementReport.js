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

      // Create FormData object
      const formData = new FormData()
      formData.append('ConstructionID', reportData.constructionID)
      formData.append('ReportType', reportData.reportType)
      formData.append('Content', reportData.content)
      formData.append('Level', reportData.level)

      // Append images if they exist
      if (reportData.images && reportData.images.length > 0) {
        reportData.images.forEach(image => {
          formData.append('Images', image)
        })
      }

      const response = await api.post('/Report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      reports.value.push(response.data)
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
      console.log('🔄 Starting report update with ID:', reportId)
      console.log('📦 Full report data:', JSON.stringify(reportData, null, 2))

      // Create FormData object
      const formData = new FormData()
      formData.append('ID', reportId)
      formData.append('ConstructionID', reportData.constructionID)
      formData.append('ReportType', reportData.reportType)
      formData.append('Content', reportData.content)
      formData.append('Level', reportData.level)
      formData.append('Status', reportData.status || 'Pending')

      // Log individual field values
      console.log('🔍 Validating fields:')
      console.log('- ID:', reportId, typeof reportId)
      console.log('- ConstructionID:', reportData.constructionID, typeof reportData.constructionID)
      console.log('- ReportType:', reportData.reportType, typeof reportData.reportType)
      console.log('- Content:', reportData.content, typeof reportData.content)
      console.log('- Level:', reportData.level, typeof reportData.level)
      console.log('- Status:', reportData.status || 'Pending')

      // Append new images if they exist
      if (reportData.newImages && reportData.newImages.length > 0) {
        console.log('📸 New images to upload:', reportData.newImages.length)
        reportData.newImages.forEach((image, index) => {
          formData.append('NewImages', image)
          console.log(`- New image ${index + 1}:`, {
            name: image.name,
            type: image.type,
            size: image.size,
            lastModified: image.lastModified
          })
        })
      }

      // Always append DeletedImagePaths, even if empty
      if (reportData.deletedImagePaths && reportData.deletedImagePaths.length > 0) {
        console.log('🗑️ Images to delete:', reportData.deletedImagePaths.length)
        reportData.deletedImagePaths.forEach((path, index) => {
          const cleanPath = path.startsWith('/') ? path.slice(1) : path
          formData.append('DeletedImagePaths', cleanPath)
          console.log(`- Deleted image path ${index + 1}:`, cleanPath)
        })
      } else {
        // Add an empty string to satisfy the required field
        formData.append('DeletedImagePaths', '')
        console.log('- No images to delete, adding empty DeletedImagePaths field')
      }

      // Log complete FormData contents
      console.log('📤 Final FormData contents:')
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`)
      }

      const response = await api.put(`/Report/${reportId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ Update successful. Response:', response.data)

      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1) {
        reports.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('❌ Error updating report:', err)
      console.error('Error details:', {
        message: err.message,
        response: {
          data: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
          validationErrors: err.response?.data?.errors
        }
      })

      // Log specific validation errors if they exist
      if (err.response?.data?.errors) {
        console.error('🚫 Validation Errors:')
        Object.entries(err.response.data.errors).forEach(([field, errors]) => {
          console.error(`- ${field}:`, errors)
        })
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      loading.value = true
      const response = await api.patch(`/Report/${reportId}/status`, { status: newStatus })
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
    formData,
    fetchReports,
    fetchReportsByThiCong,
    fetchReportsByKiThuat,
    createReport,
    updateReport,
    updateReportStatus
  }
}
