import { reactive, ref } from 'vue'
import { planService } from '../services/planService'
import { useGlobalMessage } from './useGlobalMessage'

const { showMessage } = useGlobalMessage()

export function useConstructionPlan() {
  const plans = ref([])
  const loading = ref(false)
  const error = ref(null)
  const formData = reactive({
    id: '',
    constructionID: '',
    constructionItemID: '',
    employeeID: '',
    startDate: '',
    expectedCompletionDate: '',
    constructionStatusID: 1
  })

  const fetchPlans = async () => {
    try {
      loading.value = true
      const data = await planService.getAll()
      plans.value = data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể tải danh sách kế hoạch', 'error')
      console.error('Error fetching plans:', err)
    } finally {
      loading.value = false
    }
  }

  const createPlan = async (planData) => {
    try {
      console.log('📤 Dữ liệu gửi đi:', planData)
      loading.value = true
      const data = await planService.create(planData)
      plans.value.push(data)
      showMessage('Tạo kế hoạch thành công', 'success')
      return data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể tạo kế hoạch', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePlan = async (planId, planData) => {
    try {
      console.log('📤 Dữ liệu gửi đi:', planId, planData)
      loading.value = true
      const data = await planService.update(planId, planData)
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) {
        plans.value[index] = data
      }
      showMessage('Cập nhật kế hoạch thành công', 'success')
      return data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể cập nhật kế hoạch', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePlanStatus = async (planId, statusId) => {
    try {
      console.log('📤 Dữ liệu gửi đi:', planId, statusId)
      loading.value = true
      const data = await planService.updateStatus(planId, statusId)
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) {
        plans.value[index] = data
      }
      showMessage('Cập nhật trạng thái thành công', 'success')
      return data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể cập nhật trạng thái', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetFormData = () => {
    Object.assign(formData, {
      id: '',
      constructionID: '',
      constructionItemID: '',
      employeeID: '',
      startDate: '',
      expectedCompletionDate: '',
      constructionStatusID: 1
    })
  }

  return {
    plans,
    loading,
    error,
    formData,
    fetchPlans,
    createPlan,
    updatePlan,
    updatePlanStatus,
    resetFormData
  }
}
