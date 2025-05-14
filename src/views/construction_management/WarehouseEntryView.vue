<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useWarehouseEntry } from '../../composables/useWarehouseEntry'
import { useMaterialPlan } from '../../composables/useMaterialPlan'
import WarehouseEntryForm from '../../components/warehouse/WarehouseEntryForm.vue'

const filteredOrders = ref([])

const columns = [
  { key: 'id', label: 'Mã Đơn Hàng' },
  { key: 'employeeName', label: 'Người lập kế hoạch' },
  { key: 'importDate', label: 'Ngày Đặt' },
  { key: 'status', label: 'Trạng thái' }
]

const showDetails = ref(false)
const selectedOrder = ref(null)
const materialPlans = ref([])

const {
  importOrders,
  loading,
  error,
  formData,
  fetchImportOrders,
  createImportOrder,
  updateImportOrder,
  updateImportOrderStatus
} = useWarehouseEntry()

const { getMaterialPlanByImportOrderID } = useMaterialPlan()

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return importOrders.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  fetchImportOrders()
})

const handleConfirmEntry = async () => {
  try {
    await updateImportOrderStatus(selectedOrder.value.id, 'Completed')
    alert('Nhập kho thành công!')
    closeDetails()
  } catch (err) {
    console.error('Error confirming entry:', err)
    alert('Có lỗi xảy ra khi xác nhận nhập kho')
  }
}

const handleReportIssue = async (material) => {
  try {
    await updateImportOrderStatus(selectedOrder.value.id, 'Issue')
    alert(`Đã báo cáo sự cố cho vật tư: ${material.name}`)
  } catch (err) {
    console.error('Error reporting issue:', err)
    alert('Có lỗi xảy ra khi báo cáo sự cố')
  }
}

const openDetails = async (order) => {
  try {
    selectedOrder.value = order
    // Fetch material plans for this import order
    const plans = await getMaterialPlanByImportOrderID(order.id)
    materialPlans.value = plans
    showDetails.value = true
    document.body.classList.add('modal-open')
  } catch (err) {
    console.error('Error fetching material plans:', err)
    alert('Có lỗi xảy ra khi tải thông tin vật tư')
  }
}

const closeDetails = () => {
  showDetails.value = false
  document.body.classList.remove('modal-open')
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Nhập Kho</h1>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter :items="importOrders" :searchFields="['supplier']" dateField="date" statusField="status"
      v-model:filteredItems="filteredOrders" />

    <!-- Danh sách đơn hàng -->
    <DataTable :columns="columns" :data="paginatedOrders" @row-click="openDetails">
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedOrders.length }} trên {{ filteredOrders.length }} đơn hàng
      </div>
      <Pagination :total-items="filteredOrders.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Modal for Order Details -->
    <ModalDialog v-model:show="showDetails" title="Chi Tiết Đơn Hàng" size="xl">
      <div v-if="selectedOrder">
        <WarehouseEntryForm mode="update" :order="selectedOrder" :material-plans="materialPlans"
          @submit="handleConfirmEntry" @cancel="closeDetails" />
      </div>
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
