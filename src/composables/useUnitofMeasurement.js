import { ref } from 'vue'
import { fetchUnitofMeasurements } from '../services/unitOfMeasurementService'

export function useUnitofMeasurement() {
  const unitMeasurements = ref([])
  const loadUnitMeasurements = async () => {
    try {
      const data = await fetchUnitofMeasurements()
      unitMeasurements.value = data
    } catch (error) {
      console.error('Error loading unit measurements:', error)
    }
  }

  return {
    unitMeasurements,
    loadUnitMeasurements
  }
}