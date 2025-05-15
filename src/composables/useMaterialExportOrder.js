import { ref } from 'vue'
import { materialExportOrderService } from '../services/materialExportOrderService'

export function useMaterialExportOrder() {
    const loading = ref(false)
    const error = ref(null)

    const createMaterialExportOrder = async (data) => {
        try {
            loading.value = true
            return await materialExportOrderService.create(data)
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        createMaterialExportOrder
    }
}