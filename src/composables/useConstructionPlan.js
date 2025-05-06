import { ref } from 'vue'
import api from '../api.js'

export function useConstructionPlan() {
  const plans = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchPlans = async () => {
    try {
      loading.value = true
      const response = await api.get('/ConstructionPlan')
      plans.value = response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching plans:', err)
    } finally {
      loading.value = false
    }
  }

  const createPlan = async (planData) => {
    try {
      loading.value = true
      const response = await api.post('/ConstructionPlan', planData)
      plans.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePlan = async (planId, planData) => {
    try {
      loading.value = true
      const response = await api.put(`/ConstructionPlan/${planId}`, planData)
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) {
        plans.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePlanStatus = async (planId, newStatus) => {
    try {
      loading.value = true
      const response = await api.patch(`/ConstructionPlan/${planId}/status`, { status: newStatus })
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) {
        plans.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    plans,
    loading,
    error,
    fetchPlans,
    createPlan,
    updatePlan,
    updatePlanStatus
  }
}
