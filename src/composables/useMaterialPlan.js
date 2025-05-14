import { ref } from 'vue'
import { materialPlanService } from '../services/materialPlanService'

export function useMaterialPlan() {
    const loading = ref(false)
    const error = ref(null)

    const createMaterialPlan = async (data) => {
        try {
            loading.value = true
            const response = await materialPlanService.create(data)
            return response
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    // Thêm hàm lấy MaterialPlan theo importOrderID
    const getMaterialPlanByImportOrderID = async (importOrderID) => {
        try {
            loading.value = true
            const response = await materialPlanService.getByImportOrderID(importOrderID)
            return response
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        createMaterialPlan,
        getMaterialPlanByImportOrderID
    }
}