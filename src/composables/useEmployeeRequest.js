import { ref } from 'vue'
import { employeeRequestService } from '../services/employeeRequestService'
import { useGlobalMessage } from './useGlobalMessage'

export function useEmployeeRequest() {
  const employeeRequests = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchEmployeeRequests = async () => {
    try {
      loading.value = true
      error.value = null
      employeeRequests.value = await employeeRequestService.getAll()
    } catch (err) {
      console.error('Error in fetchEmployeeRequests:', err)
      error.value = 'Không thể tải danh sách đơn yêu cầu '
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  const createEmployeeRequest = async (data) => {
    try {
      loading.value = true
      error.value = null
      await employeeRequestService.create(data)
      await fetchEmployeeRequests()
      showMessage('Tạo đơn thành công!', 'success')
    } catch (err) {
      console.error('Error in createEmployeeRequest:', err)
      error.value = 'Không thể tạo đơn'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createMultipleEmployeeRequests = async (machines) => {
    try {
      loading.value = true
      error.value = null

      const creationPromises = machines.map(machine => employeeRequestService.create(machine));
      await Promise.all(creationPromises);

      await fetchEmployeeRequests(); // Fetch only once after all creations
      showMessage(`Đã thêm thành công ${machines.length} đơn.`, 'success');
    } catch (err) {
      console.error('Error in createMultipleEmployeeRequests:', err);
      const errorMessage = err.response?.data?.title || 'Không thể tạo hàng loạt đơn.';
      error.value = errorMessage;
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const updateEmployeeRequest = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      await employeeRequestService.update(id, data)
      await fetchEmployeeRequests()
      showMessage('Cập nhật đơn thành công!', 'success')
    } catch (err) {
      console.error('Error in updateEmployeeRequest:', err)
      error.value = 'Không thể cập nhật đơn'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteEmployeeRequest = async (id) => {
    try {
      loading.value = true
      error.value = null
      await employeeRequestService.deleteById(id)
      await fetchEmployeeRequests()
      showMessage('Xóa đơn thành công!', 'success')
    } catch (err) {
      console.error('Error in deleteEmployeeRequest:', err)
      error.value = 'Không thể xóa đơn'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    employeeRequests,
    loading,
    error,
    fetchEmployeeRequests,
    createEmployeeRequest,
    updateEmployeeRequest,
    deleteEmployeeRequest,
    createMultipleEmployeeRequests
  }
}
