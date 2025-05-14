import { ref } from 'vue'
import { importOrderEmployeeService } from '../services/importOrderEmployeeService'

export function useImportOrderEmployee() {
    const loading = ref(false)
    const error = ref(null)

    const createImportOrderEmployee = async (data) => {
        try {
            loading.value = true
            return await importOrderEmployeeService.create(data)
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
        createImportOrderEmployee
    }
}