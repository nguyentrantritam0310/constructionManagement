import { ref } from 'vue'
import { payrollAdjustmentService} from '../services/payrollAdjustmentService'
import { useGlobalMessage } from './useGlobalMessage'

export function usePayrollAdjustment() {
  const payrollAdjustments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchPayrollAdjustments = async () => {
    try {
      loading.value = true
      error.value = null
      payrollAdjustments.value = await payrollAdjustmentService.getAll()
    } catch (err) {
      console.error('Error in fetchPayrollAdjustments:', err)
      error.value = 'Không thể tải danh sách khoản cộng trừ '
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  const createPayrollAdjustment = async (data) => {
    try {
      loading.value = true
      error.value = null
      await payrollAdjustmentService.create(data)
      await fetchPayrollAdjustments()
      showMessage('Tạo khoản cộng trừ thành công!', 'success')
    } catch (err) {
      console.error('Error in createPayrollAdjustment:', err)
      error.value = 'Không thể tạo khoản cộng trừ'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createMultiplePayrollAdjustments = async (adjustments) => {
    try {
      loading.value = true
      error.value = null

      const creationPromises = adjustments.map(adjustment => payrollAdjustmentService.create(adjustment));
      await Promise.all(creationPromises);

      await fetchPayrollAdjustments(); // Fetch only once after all creations
      showMessage(`Đã thêm thành công ${adjustments.length} khoản cộng trừ.`, 'success');
    } catch (err) {
      console.error('Error in createMultiplePayrollAdjustments:', err);
      const errorMessage = err.response?.data?.title || 'Không thể tạo hàng loạt khoản cộng trừ.';
      error.value = errorMessage;
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const updatePayrollAdjustment = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      await payrollAdjustmentService.update(id, data)
      await fetchPayrollAdjustments()
      showMessage('Cập nhật khoản cộng trừ thành công!', 'success')
    } catch (err) {
      console.error('Error in updatePayrollAdjustment:', err)
      error.value = 'Không thể cập nhật khoản cộng trừ'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePayrollAdjustment = async (id) => {
    try {
      loading.value = true
      error.value = null
      await payrollAdjustmentService.deleteById(id)
      await fetchPayrollAdjustments()
      showMessage('Xóa khoản cộng trừ thành công!', 'success')
    } catch (err) {
      console.error('Error in deletePayrollAdjustment:', err)
      error.value = 'Không thể xóa khoản cộng trừ'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    payrollAdjustments,
    loading,
    error,
    fetchPayrollAdjustments,
    createPayrollAdjustment,
    updatePayrollAdjustment,
    deletePayrollAdjustment,
    createMultiplePayrollAdjustments
  }
}
