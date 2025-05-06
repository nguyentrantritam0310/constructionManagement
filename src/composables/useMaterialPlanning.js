import { ref } from 'vue'
import api from '../api.js'

export function useMaterialPlanning() {
  const materials = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchMaterials = async (projectId) => {
    try {
      loading.value = true
      const response = await api.get(`/materials/project/${projectId}`)
      materials.value = response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching materials:', err)
    } finally {
      loading.value = false
    }
  }

  const updateMaterialQuantity = async (materialId, quantity) => {
    try {
      loading.value = true
      const response = await api.patch(`/materials/${materialId}/quantity`, { quantity })
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

  const saveMaterialPlan = async (projectId, materialPlan) => {
    try {
      loading.value = true
      const response = await api.post(`/materials/project/${projectId}/plan`, materialPlan)
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
    fetchMaterials,
    updateMaterialQuantity,
    saveMaterialPlan
  }
}
