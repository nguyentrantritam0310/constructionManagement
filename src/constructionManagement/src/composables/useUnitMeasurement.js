import { ref } from 'vue'
import { fetchUnitMeasurements } from '../services/unitMeasurementService'

export const useUnitMeasurement = () => {
  const unitMeasurements = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadUnitMeasurements = async () => {
    loading.value = true
    error.value = null
    try {
      unitMeasurements.value = await fetchUnitMeasurements()
    } catch (err) {
      error.value = 'Failed to load unit measurements'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  return {
    unitMeasurements,
    loading,
    error,
    loadUnitMeasurements
  }
}