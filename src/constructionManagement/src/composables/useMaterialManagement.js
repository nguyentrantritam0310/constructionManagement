// filepath: /constructionManagement/constructionManagement/src/composables/useMaterialManagement.js
import { ref } from 'vue'
import { createMaterial as createMaterialService, updateMaterial as updateMaterialService } from '../services/materialService'

const materials = ref([])

const createMaterial = async (materialData) => {
  try {
    const response = await createMaterialService(materialData)
    materials.value.push(response.data)
    return response.data
  } catch (error) {
    throw new Error('Error creating material: ' + error.message)
  }
}

const updateMaterial = async (id, materialData) => {
  try {
    const response = await updateMaterialService(id, materialData)
    const index = materials.value.findIndex(material => material.id === id)
    if (index !== -1) {
      materials.value[index] = response.data
    }
    return response.data
  } catch (error) {
    throw new Error('Error updating material: ' + error.message)
  }
}

export { createMaterial, updateMaterial, materials }