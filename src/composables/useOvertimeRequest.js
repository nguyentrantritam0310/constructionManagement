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

  const submitOvertimeRequestForApproval = async (voucherCode, notes) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.submitForApproval(voucherCode, notes);
      await fetchOvertimeRequests();
      showMessage('Gửi duyệt thành công!', 'success');
    } catch (err) {
      console.error('Error in submitOvertimeRequestForApproval:', err);
      error.value = err.response?.data?.message || err.message || 'Không thể gửi duyệt';
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const approveOvertimeRequest = async (voucherCode, notes) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.approve(voucherCode, notes);
      await fetchOvertimeRequests();
      showMessage('Duyệt đơn thành công!', 'success');
    } catch (err) {
      console.error('Error in approveOvertimeRequest:', err);
      error.value = err.response?.data?.message || err.message || 'Không thể duyệt đơn';
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const rejectOvertimeRequest = async (voucherCode, notes) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.reject(voucherCode, notes);
      await fetchOvertimeRequests();
      showMessage('Từ chối đơn thành công!', 'success');
    } catch (err) {
      console.error('Error in rejectOvertimeRequest:', err);
      error.value = err.response?.data?.message || err.message || 'Không thể từ chối đơn';
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const returnOvertimeRequest = async (voucherCode, notes) => {
    try {
      loading.value = true;
      error.value = null;
      await overtimeRequestService.return(voucherCode, notes);
      await fetchOvertimeRequests();
      showMessage('Trả lại đơn thành công!', 'success');
    } catch (err) {
      console.error('Error in returnOvertimeRequest:', err);
      error.value = err.response?.data?.message || err.message || 'Không thể trả lại đơn';
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
    submitOvertimeRequestForApproval,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    returnOvertimeRequest,
  };
}
