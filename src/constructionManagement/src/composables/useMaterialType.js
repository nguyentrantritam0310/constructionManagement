import { ref } from 'vue'
import { fetchUnitMeasurements } from '../services/unitMeasurementService'

export const useUnitMeasurement = () => {
  const unitMeasurements = ref([])

  const loadUnitMeasurements = async () => {
    try {
      const response = await fetchUnitMeasurements()
      unitMeasurements.value = response.data
    } catch (error) {
      console.error('Error loading unit measurements:', error)
    }
  }

  return {
    unitMeasurements,
    loadUnitMeasurements
  }
}