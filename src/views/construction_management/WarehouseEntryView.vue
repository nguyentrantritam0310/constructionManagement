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
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import StatusBadge from '@/components/common/StatusBadge.vue'

const { showMessage } = useGlobalMessage()
const filteredOrders = ref([])

const columns = [
  { key: 'id', label: 'Mã Đơn Hàng' },
  { key: 'plannerName', label: 'Người lập kế hoạch' },
  { key: 'receiverName', label: 'Người nhập kho' },
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

const mappedOrders = computed(() => {
  return importOrders.value.map(order => {
    const planner = order.importOrderEmployee?.find(e => e.role === 'Planner')
    const receiver = order.importOrderEmployee?.find(e => e.role === 'Receiver')
      ? order.importOrderEmployee.find(e => e.role === 'Receiver')
      : null
    return {
      ...order,
      plannerName: planner ? planner.employeeName : '',
      receiverName: receiver ? receiver.employeeName : '(chưa cập nhật)'
    }
  })
})

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return mappedOrders.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  fetchImportOrders()
})

const handleConfirmEntry = () => {
  fetchImportOrders()
  showMessage('Nhập kho thành công!', 'success')

  closeDetails()
}

const handleReportIssue = async (material) => {
  try {
    await updateImportOrderStatus(selectedOrder.value.id, 'Issue')
    showMessage(`Đã báo cáo sự cố cho vật tư: ${material.name}`, 'success')
  } catch (err) {
    console.error('Error reporting issue:', err)
    showMessage('Có lỗi xảy ra khi báo cáo sự cố', 'error')
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
    showMessage('Có lỗi xảy ra khi tải thông tin vật tư', 'error')
  }
}

const closeDetails = () => {
  showDetails.value = false
  document.body.classList.remove('modal-open')
}

const formatDate = (date) => {
  if (!date || date === '0001-01-01T00:00:00') {
    return '(chưa cập nhật)'
  }
  return new Date(date).toLocaleDateString('vi-VN')
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
      <template #id="{ item }">
        <span class="fw-medium text-primary">#{{ item.id }}</span>
      </template>

      <template #plannerName="{ item }">
        <div>
          <div class="fw-medium">{{ item.plannerName }}</div>
        </div>
      </template>

      <template #receiverName="{ item }">
        <div>
          <div class="fw-medium">{{ item.receiverName }}</div>
        </div>
      </template>
      <template #importDate="{ item }">
        {{ formatDate(item.importDate) }}
      </template>
      <template #status="{ item }">
        <StatusBadge :status="item.status" />
      </template>
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

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.95em;
  font-weight: 500;
  color: #fff;
  min-width: 80px;
  text-align: center;
}

.status-pending {
  background: #f7b924;
}

.status-approved {
  background: #3498db;
}

.status-completed {
  background: #27ae60;
}

.status-rejected {
  background: #7f8c8d;
}
</style>
