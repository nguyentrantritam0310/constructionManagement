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
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

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
const showFilter = ref(false)

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

const filteredOrders = computed(() => {
  let result = [...importOrders.value]

  // Map the orders with planner and receiver info
  result = result.map(order => {
    const planner = order.importOrderEmployee?.find(e => e.role === 'Planner')
    const receiver = order.importOrderEmployee?.find(e => e.role === 'Receiver')
    return {
      ...order,
      plannerName: planner ? planner.employeeName : '',
      receiverName: receiver ? receiver.employeeName : '(chưa cập nhật)'
    }
  })

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(order =>
      order.id?.toString().includes(query) ||
      order.plannerName?.toLowerCase().includes(query) ||
      order.receiverName?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(order => order.status === statusFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(order => {
      const orderDate = new Date(order.importDate)
      return orderDate >= start && orderDate <= end
    })
  }

  return result
})

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
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

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRange.value = {
    start: null,
    end: null
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Nhập Kho</h1>
      <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
        Lọc
      </ActionButton>
    </div>

    <!-- Filter Section -->
    <transition name="slide-fade">
      <div class="filter-section mb-4" v-show="showFilter">
      <div class="row g-3 align-items-center">
        <div class="col-lg-3 col-md-6">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-search"></i>
            </span>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Tìm kiếm..."
            >
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-tasks"></i>
            </span>
            <select class="form-control" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Rejected">Từ chối</option>
              <option value="Completed">Hoàn thành</option>
            </select>
          </div>
        </div>
        <div class="col-lg-4 col-md-8">
          <div class="d-flex gap-2">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-calendar"></i>
              </span>
              <input
                type="date"
                class="form-control"
                v-model="dateRange.start"
                placeholder="Từ ngày"
              >
            </div>
            <div class="input-group">
              <input
                type="date"
                class="form-control"
                v-model="dateRange.end"
                placeholder="Đến ngày"
              >
            </div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4">
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fas fa-undo me-2"></i>Đặt lại
          </button>
        </div>
      </div>
      </div>
    </transition>

    <!-- Danh sách đơn hàng -->
    <DataTable :columns="columns" :data="paginatedOrders" @row-click="openDetails">
      <template #id="{ item }">
        <span class="fw-medium text-primary">#{{ item.id }}</span>
      </template>

      <template #plannerName="{ item }">
        <div class="fw-medium">{{ item.plannerName }}</div>
      </template>

      <template #receiverName="{ item }">
        <div class="fw-medium">{{ item.receiverName }}</div>
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

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.input-group-text {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem 0 0 0.5rem;
  padding: 0.5rem 1rem;
  color: #6c757d;
}

.input-group .form-control {
  border-radius: 0 0.5rem 0.5rem 0;
}

.input-group + .input-group {
  margin-left: 0.5rem;
}

.gap-2 {
  gap: 0.5rem;
}


.btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #495057;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 992px) {
  .d-flex.gap-2 {
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group + .input-group {
    margin-left: 0;
  }
}
</style>
