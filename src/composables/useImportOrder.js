import { ref } from 'vue'
import { importOrderService } from '../services/importOrderService'

export function useImportOrder() {
    const loading = ref(false)
    const error = ref(null)

    const createImportOrder = async (data) => {
        try {
            loading.value = true
            console.log('Calling createImportOrder API with data:', data) // Debug
            const response = await importOrderService.create(data)
            console.log('createImportOrder response:', response) // Debug
            return response
        } catch (err) {
            console.error('Error in createImportOrder:', err) // Debug lỗi
            throw err
        } finally {
            loading.value = false
        }
    }
    const getByDirector = async (data) => {
        try {
            loading.value = true
            const response = await importOrderService.getByDirector(data)
            return response
        } catch (err) {
            throw err
        } finally {
            loading.value = false
        }
    }


    return {
        loading,
        error,
        createImportOrder,
        getByDirector
    }
}