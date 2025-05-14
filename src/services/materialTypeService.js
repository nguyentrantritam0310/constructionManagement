import api from '../api.js'

export const fetchMaterialTypes = async () => {
  try {
    const response = await api.get('/MaterialType')
    return response.data
  } catch (error) {
    console.error('Error fetching material types:', error)
    throw error
  }
}
