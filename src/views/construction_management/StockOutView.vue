<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useStockOut } from '../../composables/useStockOut'

const {
  exportOrders,
  loading,
  error,
  fetchExportOrders,
  updateExportOrderStatus,
  createExportOrder,
  plans,
  employees,
  fetchPlans,
  fetchEmployees
} = useStockOut()

onMounted(async () => {
  await Promise.all([
    fetchExportOrders(),
    fetchPlans(),
    fetchEmployees()
  ])
})

const columns = [
  { key: 'id', label: 'Mã Phiếu Xuất' },
  { key: 'constructionName', label: 'Tên Công Trình' },
  { key: 'constructionItemName', label: 'Tên Hạng Mục' },
  { key: 'exportDate', label: 'Ngày Xuất' },
  { key: 'employeeName', label: 'Người Xuất' },
]

const showDetails = ref(false)
const showCreateForm = ref(false)
const selectedStockOut = ref(null)
const actualQuantities = ref([])

// Form data for creating new export order
const newExportOrder = ref({
  planID: null,
  employeeID: null,
  material_ExportOrders: [],
  materialName: []
})

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedExportOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return exportOrders.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleCreateExportOrder = async () => {
  try {
    const selectedPlan = plans.value.find(p => p.id === newExportOrder.value.planID)
    const selectedEmployee = employees.value.find(e => e.id === newExportOrder.value.employeeID)

    const exportOrderData = {
      ...newExportOrder.value,
      constructionName: selectedPlan.constructionName,
      constructionItemName: selectedPlan.constructionItemName,
      exportDate: new Date().toISOString(),
      employeeName: selectedEmployee.name
    }

    await createExportOrder(exportOrderData)
    showCreateForm.value = false
    alert('Tạo phiếu xuất thành công!')
    // Reset form
    newExportOrder.value = {
      planID: null,
      employeeID: null,
      material_ExportOrders: [],
      materialName: []
    }
  } catch (err) {
    console.error('Error creating export order:', err)
    alert('Có lỗi xảy ra khi tạo phiếu xuất')
  }
}

const handleConfirmStockOut = async () => {
  try {
    await updateExportOrderStatus(selectedStockOut.value.id, 'Completed')
    alert('Xuất kho thành công!')
    closeDetails()
  } catch (err) {
    console.error('Error confirming stock out:', err)
    alert('Có lỗi xảy ra khi xác nhận xuất kho')
  }
}

const handleReportIssue = async (material) => {
  try {
    await updateExportOrderStatus(selectedStockOut.value.id, 'Issue')
    alert(`Đã báo cáo sự cố cho vật tư: ${material.name}`)
  } catch (err) {
    console.error('Error reporting issue:', err)
    alert('Có lỗi xảy ra khi báo cáo sự cố')
  }
}

const openDetails = (stockOut) => {
  selectedStockOut.value = stockOut
  actualQuantities.value = stockOut.material_ExportOrders.map((material, index) => ({
    name: stockOut.materialName[index],
    expected: material.quantity,
    actual: material.quantity,
    note: material.note || ''
  }))
  showDetails.value = true
  document.body.classList.add('modal-open')
}

const closeDetails = () => {
  showDetails.value = false
  document.body.classList.remove('modal-open')
}

const addMaterial = () => {
  newExportOrder.value.material_ExportOrders.push({
    materialID: null,
    quantity: 0,
    note: ''
  })
  newExportOrder.value.materialName.push('')
}

const removeMaterial = (index) => {
  newExportOrder.value.material_ExportOrders.splice(index, 1)
  newExportOrder.value.materialName.splice(index, 1)
}

// Format plan option text
const formatPlanOption = (plan) => {
  return `${plan.constructionName} - ${plan.constructionItemName}`
}

const formatDate = (date, isActualCompletion = false) => {
  if (!date) {
    return isActualCompletion ? '(Chưa cập nhật)' : '-'
  }
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Xuất Kho</h1>
      <ActionButton type="primary" icon="fas fa-plus" @click="showCreateForm = true">
        Tạo Phiếu Xuất
      </ActionButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <!-- Data Table -->
    <template v-else>
      <DataTable :columns="columns" :data="paginatedExportOrders" @row-click="openDetails">
        <template #exportDate="{ item }">
          <div class="date-info">
            <i class="fas fa-calendar-check text-muted"></i>
            {{ formatDate(item.exportDate) }}
          </div>
        </template>
      </DataTable>

      <!-- Phân trang -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <div class="text-muted">
          Hiển thị {{ paginatedExportOrders.length }} trên {{ exportOrders.length }} phiếu xuất
        </div>
        <Pagination
          :total-items="exportOrders.length"
          :items-per-page="itemsPerPage"
          :current-page="currentPage"
          @update:currentPage="handlePageChange"
        />
      </div>
    </template>

    <!-- Modal for Stock Out Details -->
    <ModalDialog v-model:show="showDetails" title="Chi Tiết Phiếu Xuất" size="lg">
      <div v-if="selectedStockOut">
        <h4>Dự Án: {{ selectedStockOut.constructionName }}</h4>
        <h5>Hạng mục: {{ selectedStockOut.constructionItemName}}</h5>
        <p>Ngày Xuất: {{ formatDate(selectedStockOut.exportDate) }}</p>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Tên Vật Tư</th>
              <th>Số Lượng Yêu Cầu</th>
              <th>Số Lượng Thực Xuất</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(material, index) in actualQuantities" :key="index">
              <td>{{ material.name }}</td>
              <td>{{ material.expected }}</td>
              <td>
                {{material.actual}}
              </td>
              <td>
                {{material.note || 'Không có ghi chú'}}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ModalDialog>

    <!-- Modal for Create Export Order -->
    <ModalDialog v-model:show="showCreateForm" title="Tạo Phiếu Xuất" size="lg">
      <form @submit.prevent="handleCreateExportOrder">
        <div class="mb-3">
          <label class="form-label">Kế Hoạch</label>
          <select v-model="newExportOrder.planID" class="form-select" required>
            <option value="">Chọn kế hoạch</option>
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ formatPlanOption(plan) }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Danh Sách Vật Tư</h6>
            <button type="button" class="btn btn-primary btn-sm" @click="addMaterial">
              <i class="fas fa-plus"></i> Thêm Vật Tư
            </button>
          </div>

          <div v-for="(material, index) in newExportOrder.material_ExportOrders" :key="index" class="card mb-2">
            <div class="card-body">
              <div class="row">
                <div class="col-md-5">
                  <label class="form-label">Tên Vật Tư</label>
                  <input type="text" v-model="newExportOrder.materialName[index]" class="form-control" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Số Lượng</label>
                  <input type="number" v-model="material.quantity" class="form-control" required min="1">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Ghi Chú</label>
                  <input type="text" v-model="material.note" class="form-control">
                </div>
                <div class="col-md-1 d-flex align-items-end">
                  <button type="button" class="btn btn-danger btn-sm" @click="removeMaterial(index)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-end">
          <ActionButton type="primary" icon="fas fa-save" @click="handleCreateExportOrder">
            Tạo Phiếu Xuất
          </ActionButton>
          <ActionButton type="secondary" icon="fas fa-times" @click="showCreateForm = false">
            Hủy
          </ActionButton>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

.construction-table {
  margin-bottom: 2rem;
}

.construction-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.construction-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
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
