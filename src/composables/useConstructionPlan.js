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

  const createMultiplePlans = async (plansToCreate) => {
    try {
      loading.value = true
      error.value = null

      const creationPromises = plansToCreate.map(plan => planService.create(plan));
      await Promise.all(creationPromises);

      // The view will be responsible for fetching data again
      showMessage(`Đã thêm thành công ${plansToCreate.length} kế hoạch.`, 'success');
    } catch (err) {
      console.error('Error in createMultiplePlans:', err);
      const errorMessage = err.response?.data?.title || 'Không thể tạo hàng loạt kế hoạch.';
      error.value = errorMessage;
      showMessage(errorMessage, 'error');
      throw err;
    } finally {
      loading.value = false;
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
    createMultiplePlans,
    updatePlan,
    updatePlanStatus,
    resetFormData
  }
}
