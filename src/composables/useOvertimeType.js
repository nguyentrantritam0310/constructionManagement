import { ref } from 'vue';
import { overtimeTypeService } from '../services/overtimeTypeService';
import { useGlobalMessage } from './useGlobalMessage';

export function useOvertimeType() {
  const overtimeTypes = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const { showMessage } = useGlobalMessage();

  const fetchOvertimeTypes = async () => {
    try {
      loading.value = true;
      error.value = null;
      const data = await overtimeTypeService.getAll();
      overtimeTypes.value = data;
      console.log('OvertimeTypes loaded:', data);
    } catch (err) {
      console.error('Error in fetchOvertimeTypes:', err);
      error.value = 'Không thể tải danh sách loại tăng ca';
      showMessage(error.value, 'error');
    } finally {
      loading.value = false;
    }
  };

  return {
    overtimeTypes,
    loading,
    error,
    fetchOvertimeTypes,
  };
}
