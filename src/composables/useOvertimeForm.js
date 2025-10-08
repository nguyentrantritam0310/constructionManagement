import { ref } from 'vue';
import { overtimeFormService } from '../services/overtimeFormService';
import { useGlobalMessage } from './useGlobalMessage';

export function useOvertimeForm() {
  const overtimeForms = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const { showMessage } = useGlobalMessage();

  const fetchOvertimeForms = async () => {
    try {
      loading.value = true;
      error.value = null;
      const data = await overtimeFormService.getAll();
      overtimeForms.value = data;
      console.log('OvertimeForms loaded:', data);
    } catch (err) {
      console.error('Error in fetchOvertimeForms:', err);
      error.value = 'Không thể tải danh sách hình thức tăng ca';
      showMessage(error.value, 'error');
    } finally {
      loading.value = false;
    }
  };

  return {
    overtimeForms,
    loading,
    error,
    fetchOvertimeForms,
  };
}
