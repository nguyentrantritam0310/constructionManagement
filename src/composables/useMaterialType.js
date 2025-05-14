import { ref, onMounted } from 'vue'
import { fetchMaterialTypes } from '../services/materialTypeService'

export const useMaterialType = () => {
  const materialTypes = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadMaterialTypes = async () => {
    try {
      loading.value = true
      materialTypes.value = await fetchMaterialTypes()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadMaterialTypes()
  })

  return {
    materialTypes,
    loading,
    error,
    loadMaterialTypes
  }
}
