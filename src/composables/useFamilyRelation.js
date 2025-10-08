import { ref } from 'vue'
import { familyRelationService } from '../services/familyRelationService'

export function useFamilyRelation() {
  const familyRelations = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch family relations by employee ID
  const fetchFamilyRelationsByEmployeeId = async (employeeId) => {
    try {
      loading.value = true
      error.value = null
      const familyRelationsData = await familyRelationService.getFamilyRelationsByEmployeeId(employeeId)
      familyRelations.value = familyRelationsData
      console.log('Family relations loaded:', familyRelations.value)
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách quan hệ gia đình'
      console.error('Error fetching family relations:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch all family relations
  const fetchAllFamilyRelations = async () => {
    try {
      loading.value = true
      error.value = null
      const familyRelationsData = await familyRelationService.getAllFamilyRelations()
      familyRelations.value = familyRelationsData
      console.log('All family relations loaded:', familyRelations.value)
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách quan hệ gia đình'
      console.error('Error fetching family relations:', err)
    } finally {
      loading.value = false
    }
  }

  // Get family relation by ID
  const getFamilyRelationById = async (id) => {
    try {
      loading.value = true
      error.value = null
      return await familyRelationService.getFamilyRelationById(id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin quan hệ gia đình'
      console.error('Error fetching family relation:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Create new family relation
  const createFamilyRelation = async (familyRelationData) => {
    try {
      loading.value = true
      error.value = null
      const result = await familyRelationService.createFamilyRelation(familyRelationData)
      // Refresh the list if we have an employee ID
      if (familyRelationData.employeeID) {
        await fetchFamilyRelationsByEmployeeId(familyRelationData.employeeID)
      }
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi tạo quan hệ gia đình mới'
      error.value = errorMessage
      console.error('Error creating family relation:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Update family relation
  const updateFamilyRelation = async (familyRelationData) => {
    try {
      loading.value = true
      error.value = null
      const result = await familyRelationService.updateFamilyRelation(familyRelationData)
      // Refresh the list if we have an employee ID
      if (familyRelationData.employeeID) {
        await fetchFamilyRelationsByEmployeeId(familyRelationData.employeeID)
      }
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi cập nhật quan hệ gia đình'
      error.value = errorMessage
      console.error('Error updating family relation:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Delete family relation
  const deleteFamilyRelation = async (id, employeeId = null) => {
    try {
      loading.value = true
      error.value = null
      await familyRelationService.deleteFamilyRelation(id)
      // Refresh the list if we have an employee ID
      if (employeeId) {
        await fetchFamilyRelationsByEmployeeId(employeeId)
      }
      return true
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi xóa quan hệ gia đình'
      error.value = errorMessage
      console.error('Error deleting family relation:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Format family relation data for form submission
  const formatFamilyRelationForSubmit = (familyRelationData) => {
    console.log('Formatting family relation data for submit:', familyRelationData)
    const formattedData = {
      relativeName: familyRelationData.relativeName,
      startDate: new Date(familyRelationData.startDate).toISOString(),
      endDate: new Date(familyRelationData.endDate).toISOString(),
      employeeID: familyRelationData.employeeID,
      relationShipName: familyRelationData.relationShipName
    }
    
    // Include ID for update operations
    if (familyRelationData.id) {
      formattedData.id = familyRelationData.id
    }
    
    console.log('Formatted data:', formattedData)
    return formattedData
  }

  // Format family relation data for display
  const formatFamilyRelationData = (familyRelation) => {
    return {
      ...familyRelation,
      startDate: new Date(familyRelation.startDate).toLocaleDateString('vi-VN'),
      endDate: new Date(familyRelation.endDate).toLocaleDateString('vi-VN'),
      id: familyRelation.id
    }
  }

  return {
    familyRelations,
    loading,
    error,
    fetchFamilyRelationsByEmployeeId,
    fetchAllFamilyRelations,
    getFamilyRelationById,
    createFamilyRelation,
    updateFamilyRelation,
    deleteFamilyRelation,
    formatFamilyRelationData,
    formatFamilyRelationForSubmit
  }
}
