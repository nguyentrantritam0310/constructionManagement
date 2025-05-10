import { ref } from 'vue'
import api from '../api.js'

export function useMaterialManagement() {
  const materials = ref([])
  const loading = ref(false)
  const error = ref(null)
  const formData = ref({
    materialName: '',
    materialTypeID: '',
    stockQuantity: 0,
    unitPrice: 0,
    status: 'Available'
  })

  const fetchMaterials = async () => {
    try {
      loading.value = true
      const response = await api.get('/Material')
      materials.value = response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching materials:', err)
    } finally {
      loading.value = false
    }
  }

  const createMaterial = async (materialData) => {
    try {
      loading.value = true
      const response = await api.post('/Material', materialData)
      materials.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMaterial = async (materialId, materialData) => {
    try {
      loading.value = true
      const response = await api.put(`/Material/${materialId}`, materialData)
      const index = materials.value.findIndex(m => m.id === materialId)
      if (index !== -1) {
        materials.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMaterialStatus = async (materialId, newStatus) => {
    try {
      loading.value = true
      const response = await api.patch(`/Material/${materialId}/status`, { status: newStatus })
      const index = materials.value.findIndex(m => m.id === materialId)
      if (index !== -1) {
        materials.value[index] = response.data
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
    materials,
    loading,
    error,
    formData,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    updateMaterialStatus
  }
}
