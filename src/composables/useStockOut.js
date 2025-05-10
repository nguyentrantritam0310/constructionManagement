import { ref } from 'vue'
import { exportOrderService } from '@/services/exportOrderService.js'

export function useStockOut() {
  const exportOrders = ref([])
  const loading = ref(false)
  const error = ref(null)
  const formData = ref({
    constructionID: '',
    exportDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    materials: []
  })

  const fetchExportOrders = async () => {
    try {
      loading.value = true
      const response = await exportOrderService.getAll()
      exportOrders.value = response // Không cần .data vì service đã xử lý
      console.log('Fetched export orders:', exportOrders.value)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching export orders:', err)
    } finally {
      loading.value = false
    }
  }

  const createExportOrder = async (orderData) => {
    try {
      loading.value = true
      const response = await exportOrderService.create(orderData)
      exportOrders.value.push(response)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateExportOrder = async (orderId, orderData) => {
    try {
      loading.value = true
      const response = await exportOrderService.update(orderId, orderData)
      const index = exportOrders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        exportOrders.value[index] = response
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateExportOrderStatus = async (orderId, newStatus) => {
    try {
      loading.value = true
      const response = await exportOrderService.updateStatus(orderId, newStatus)
      const index = exportOrders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        exportOrders.value[index] = response
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    exportOrders,
    loading,
    error,
    formData,
    fetchExportOrders,
    createExportOrder,
    updateExportOrder,
    updateExportOrderStatus
  }
}
