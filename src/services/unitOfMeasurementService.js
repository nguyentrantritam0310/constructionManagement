import api from '../api.js'

export const fetchUnitofMeasurements = async () => {
  try {
    const response = await api.get('/UnitofMeasurement')
    return response.data
  } catch (error) {
    console.error('Error fetching Unit of Measurement:', error)
    throw error
  }
}
