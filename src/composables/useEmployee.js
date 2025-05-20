import { ref } from 'vue'
import { employeeService } from '../services/employeeService'
import { useGlobalMessage } from './useGlobalMessage'

export function useEmployee() {
  const employees = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchEmployees = async () => {
    try {
      loading.value = true
      error.value = null
      employees.value = await employeeService.getAllEmployees()
    } catch (err) {
      console.error('Error in fetchEmployees:', err)
      error.value = 'Không thể tải danh sách công nhân'
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  return {
    employees,
    loading,
    error,
    fetchEmployees
  }
}
