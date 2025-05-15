import { ref } from 'vue'
import { materialNormService } from '../services/materialNormService'
import { useGlobalMessage } from './useGlobalMessage'
const { showMessage } = useGlobalMessage()

export function useMaterialNorm() {
  const materialNorms = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchMaterialNorms = async (constructionId) => {
    try {
      loading.value = true
      error.value = null
      const data = await materialNormService.getMaterialNormsByConstructionId(constructionId)
      materialNorms.value = data
    } catch (err) {
      error.value = 'Không thể tải định lượng vật tư'
      showMessage('Không thể tải định lượng vật tư', 'error')
      console.error('Error in fetchMaterialNorms:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchMaterialNormsByItem = async (constructionItemId) => {
    try {
      loading.value = true
      error.value = null
      const data = await materialNormService.getMaterialNormsByConstructionItemId(constructionItemId)
      materialNorms.value = data
    } catch (err) {
      error.value = 'Không thể tải định lượng vật tư'
      showMessage('Không thể tải định lượng vật tư', 'error')
      console.error('Error in fetchMaterialNormsByItem:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    materialNorms,
    loading,
    error,
    fetchMaterialNorms,
    fetchMaterialNormsByItem
  }
}
