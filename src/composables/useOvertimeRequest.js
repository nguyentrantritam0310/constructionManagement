import { ref } from 'vue';
import { overtimeRequestService } from '../services/overtimeRequestService';
import { useGlobalMessage } from './useGlobalMessage';

export function useOvertimeRequest() {
  const overtimeRequests = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const { showMessage } = useGlobalMessage();

  const fetchOvertimeRequests = async () => {
    try {
      loading.value = true;
      error.value = null;
      overtimeRequests.value = await overtimeRequestService.getAll();
    } catch (err) {
      console.error('Error in fetchOvertimeRequests:', err);
      error.value = 'Không thể tải danh sách đơn tăng ca';
      showMessage(error.value, 'error');
    } finally {
      loading.value = false;
    }
  };

  const createOvertimeRequest = async (data) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.create(data);
      await fetchOvertimeRequests();
      showMessage('Tạo đơn tăng ca thành công!', 'success');
    } catch (err) {
      console.error('Error in createOvertimeRequest:', err);
      error.value = 'Không thể tạo đơn tăng ca';
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateOvertimeRequest = async (voucherCode, data) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.update(voucherCode, data);
      await fetchOvertimeRequests();
      showMessage('Cập nhật đơn tăng ca thành công!', 'success');
    } catch (err) {
      console.error('Error in updateOvertimeRequest:', err);
      error.value = 'Không thể cập nhật đơn tăng ca';
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteOvertimeRequest = async (voucherCode) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.delete(voucherCode);
      await fetchOvertimeRequests();
      showMessage('Xóa đơn tăng ca thành công!', 'success');
    } catch (err) {
      console.error('Error in deleteOvertimeRequest:', err);
      error.value = 'Không thể xóa đơn tăng ca';
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    overtimeRequests,
    loading,
    error,
    fetchOvertimeRequests,
    createOvertimeRequest,
    updateOvertimeRequest,
    deleteOvertimeRequest,
  };
}
