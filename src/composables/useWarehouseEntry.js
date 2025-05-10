import { ref } from 'vue'
import api from '../api.js'

export function useWarehouseEntry() {
  const importOrders = ref([])
  const loading = ref(false)
  const error = ref(null)
  const formData = ref({
    supplier: '',
    importDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    materials: []
  })

  const fetchImportOrders = async () => {
    try {
      loading.value = true
      const response = await api.get('/ImportOrder')
      importOrders.value = response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching import orders:', err)
    } finally {
      loading.value = false
    }
  }

  const createImportOrder = async (orderData) => {
    try {
      loading.value = true
      const response = await api.post('/ImportOrder', orderData)
      importOrders.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateImportOrder = async (orderId, orderData) => {
    try {
      loading.value = true
      const response = await api.put(`/ImportOrder/${orderId}`, orderData)
      const index = importOrders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        importOrders.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateImportOrderStatus = async (orderId, newStatus) => {
    try {
      loading.value = true
      const response = await api.patch(`/ImportOrder/${orderId}/status`, { status: newStatus })
      const index = importOrders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        importOrders.value[index] = response.data
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
    importOrders,
    loading,
    error,
    formData,
    fetchImportOrders,
    createImportOrder,
    updateImportOrder,
    updateImportOrderStatus
  }
}
