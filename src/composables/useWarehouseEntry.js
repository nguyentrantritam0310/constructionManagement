import { ref } from 'vue'
import api from '../api.js'
import { importOrderService } from '../services/importOrderService'
import { materialPlanService } from '../services/materialPlanService'
import { useImportOrderEmployee } from './useImportOrderEmployee'
import { useMaterialManagement } from './useMaterialManagement'

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

  const { createImportOrderEmployee } = useImportOrderEmployee()
  const { updateMaterialStock, fetchMaterialById } = useMaterialManagement()

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

  const confirmWarehouseEntry = async (importOrderID, materials, employeeID) => {
    try {
      loading.value = true
      // 1. Cập nhật từng vật tư
      for (const m of materials) {
        await materialPlanService.updateQuantityAndNote({
          importOrderID,
          materialID: m.materialID,
          constructionItemID: m.constructionItemID,
          importQuantity: m.actualQuantity,
          note: m.note
        })
        // Lấy thông tin vật tư hiện tại
        let material = null
        try {
          material = await fetchMaterialById(m.materialID)
        } catch (e) {
          // Nếu lỗi thì bỏ qua cập nhật tồn kho
          continue
        }
        // Cộng thêm số lượng nhập vào tồn kho
        const newStock = (material?.stockQuantity || 0) + (m.actualQuantity || 0)
        await updateMaterialStock(m.materialID, newStock)
      }
      // 2. Gọi API thêm ImportOrderEmployee với vai trò Receiver
      await createImportOrderEmployee({
        importOrderId: importOrderID,
        employeeID: employeeID,
        role: 'Receiver'
      })
      // 3. Sau khi xong hết, cập nhật trạng thái đơn nhập kho
      await importOrderService.updateStatus(importOrderID, 3) // 3 = Completed
      return true
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
    updateImportOrderStatus,
    confirmWarehouseEntry
  }
}
