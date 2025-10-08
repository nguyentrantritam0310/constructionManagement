import { ref } from 'vue'
import { workshiftService } from '../services/workshiftService'
import { useGlobalMessage } from './useGlobalMessage'

export function useWorkShift() {
  const workshifts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchWorkShifts = async () => {
    try {
      loading.value = true
      error.value = null
      workshifts.value = await workshiftService.getAll()
    } catch (err) {
      console.error('Error in fetchWorkShifts:', err)
      error.value = 'Không thể tải danh sách ca làm '
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  const createWorkShifts = async (data) => {
      try {
        loading.value = true
        error.value = null
        await workshiftService.create(data)
        await fetchWorkShifts()
        showMessage('Tạo ca làm thành công!', 'success')
      } catch (err) {
        console.error('Error in createWorkShift:', err)
        error.value = 'Không thể tạo ca làm'
        showMessage(error.value, 'error')
        throw err
      } finally {
        loading.value = false
      }
    }
  
    const updateWorkShift = async (id, data) => {
      try {
        loading.value = true
        error.value = null
        await workshiftService.update(id, data)
        await fetchWorkShifts()
        showMessage('Cập nhật ca làm thành công!', 'success')
      } catch (err) {
        error.value = 'Không thể cập nhật ca làm'
        showMessage(error.value, 'error')
        throw err
      } finally {
        loading.value = false
      }
    }
  
    const deleteWorkShift = async (id) => {
      try {
        loading.value = true
        error.value = null
        await workshiftService.delete(id)
        await fetchWorkShifts()
        showMessage('Xóa ca làm thành công!', 'success')
      } catch (err) {
        error.value = 'Không thể xóa ca làm'
        showMessage(error.value, 'error')
        throw err
      } finally {
        loading.value = false
      }
    }
  

  return {
    workshifts,
    loading,
    error,
    fetchWorkShifts,
    createWorkShifts,
    updateWorkShift,
    deleteWorkShift
  }
}
