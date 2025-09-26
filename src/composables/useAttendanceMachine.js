import { ref } from 'vue'
import { attendanceMachineService } from '../services/attendanceMachineService'
import { useGlobalMessage } from './useGlobalMessage'

export function useAttendanceMachine() {
  const attendanceMachines = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchAttendanceMachines = async () => {
    try {
      loading.value = true
      error.value = null
      attendanceMachines.value = await attendanceMachineService.getAll()
    } catch (err) {
      console.error('Error in fetchAttendanceMachines:', err)
      error.value = 'Không thể tải danh sách máy chấm công '
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  const createAttendanceMachine = async (data) => {
    try {
      loading.value = true
      error.value = null
      await attendanceMachineService.create(data)
      await fetchAttendanceMachines()
      showMessage('Tạo máy chấm công thành công!', 'success')
    } catch (err) {
      console.error('Error in createAttendanceMachine:', err)
      error.value = 'Không thể tạo máy chấm công'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createMultipleAttendanceMachines = async (machines) => {
    try {
      loading.value = true
      error.value = null

      const creationPromises = machines.map(machine => attendanceMachineService.create(machine));
      await Promise.all(creationPromises);

      await fetchAttendanceMachines(); // Fetch only once after all creations
      showMessage(`Đã thêm thành công ${machines.length} máy chấm công.`, 'success');
    } catch (err) {
      console.error('Error in createMultipleAttendanceMachines:', err);
      const errorMessage = err.response?.data?.title || 'Không thể tạo hàng loạt máy chấm công.';
      error.value = errorMessage;
      showMessage(error.value, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const updateAttendanceMachine = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      await attendanceMachineService.update(id, data)
      await fetchAttendanceMachines()
      showMessage('Cập nhật máy chấm công thành công!', 'success')
    } catch (err) {
      console.error('Error in updateAttendanceMachine:', err)
      error.value = 'Không thể cập nhật máy chấm công'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAttendanceMachine = async (id) => {
    try {
      loading.value = true
      error.value = null
      await attendanceMachineService.deleteById(id)
      await fetchAttendanceMachines()
      showMessage('Xóa máy chấm công thành công!', 'success')
    } catch (err) {
      console.error('Error in deleteAttendanceMachine:', err)
      error.value = 'Không thể xóa máy chấm công'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    attendanceMachines,
    loading,
    error,
    fetchAttendanceMachines,
    createAttendanceMachine,
    updateAttendanceMachine,
    deleteAttendanceMachine,
    createMultipleAttendanceMachines
  }
}
