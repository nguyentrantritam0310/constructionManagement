<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import Pagination from '../../components/common/Pagination.vue'
import FormField from '../../components/common/FormField.vue'
import { useStockOut } from '../../composables/useStockOut'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useConstructionPlan } from '../../composables/useConstructionPlan'
import { useUser } from '../../composables/useUser'
import { useMaterialNorm } from '../../composables/useMaterialNorm'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
import { useMaterialExportOrder } from '../../composables/useMaterialExportOrder'
import { useAuth } from '../../composables/useAuth'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import StockOutDetail from '../../components/warehouse/StockOutDetail.vue'

const { showMessage } = useGlobalMessage()

const {
  exportOrders,
  loading,
  error,
  fetchExportOrders,
  updateExportOrderStatus,
  createExportOrder
} = useStockOut()

const {
  constructions,
  fetchConstructions,
  fetchConstructionItems
} = useConstructionManagement()

const {
  plans,
  fetchPlans
} = useConstructionPlan()

const {
  users,
  fetchUsers
} = useUser()

const { materialNorms, fetchMaterialNormsByItem } = useMaterialNorm()
const { materials, fetchMaterials, updateMaterialStock } = useMaterialManagement()
const { createMaterialExportOrder } = useMaterialExportOrder()
const { currentUser } = useAuth()
const employeeID = computed(() => currentUser.value?.id)

const createOrderError = ref('')

const filteredExportOrders = ref([])

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xuất kho' },
  { value: 'Completed', label: 'Đã xuất kho' },
  { value: 'Issue', label: 'Có vấn đề' }
]

const searchQuery = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const paginatedExportOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredExportOrders.value.slice(start, end)
})

const resetFilters = () => {
  searchQuery.value = ''
  dateRange.value = {
    start: null,
    end: null
  }
}

onMounted(async () => {
  await Promise.all([
    fetchExportOrders(),
    fetchConstructions(),
    fetchPlans(),
    fetchUsers(),
    fetchMaterials()
  ])
})

// Options cho select công trình
const constructionOptions = computed(() =>
  constructions.value.map(c => ({
    value: c.id,
    label: c.constructionName
  }))
)

// Options cho select hạng mục (lọc theo công trình đã chọn)
const constructionItemOptions = computed(() => {
  if (!newExportOrder.value.constructionID) return []
  const construction = constructions.value.find(
    c => c.id === newExportOrder.value.constructionID
  )
  if (!construction || !construction.constructionItems) return []
  return construction.constructionItems.map(item => ({
    value: item.id,
    label: item.itemName // hoặc item.constructionItemName nếu đúng tên trường
  }))
})

const filteredConstructionItems = computed(() => {
  if (!constructions.value.length || !newExportOrder.value.constructionID) return []
  const selectedID = Number(newExportOrder.value.constructionID)
  const selectedConstruction = constructions.value.find(construction => construction.id === selectedID)
  return selectedConstruction?.constructionItems || []
})

const materialOptions = computed(() =>
  materials.value.map(m => ({
    value: m.id,
    label: m.materialName
  }))
)

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
  materialName: [],
  constructionID: null,
  constructionItemID: null
})

watch(() => newExportOrder.value.constructionID, () => {
  newExportOrder.value.constructionItemID = null
})

watch(() => newExportOrder.value.constructionItemID, async (newVal) => {
  newExportOrder.value.material_ExportOrders = []
  newExportOrder.value.materialName = []
  if (newVal) {
    await fetchMaterialNormsByItem(newVal)
    // Đổ dữ liệu vật tư từ API vào danh sách vật tư xuất
    if (materialNorms.value && materialNorms.value.length > 0) {
      materialNorms.value.forEach(norm => {
        newExportOrder.value.material_ExportOrders.push({
          materialID: norm.materialID,
          quantity: norm.quantity,
          unitOfMeasurement: norm.unitOfMeasurement,
          stockQuantity: norm.stockQuantity
        })
        newExportOrder.value.materialName.push(norm.materialName)
      })
    }
  }
})

watch(
  () => newExportOrder.value.material_ExportOrders.map(m => m.materialID),
  (newIDs, oldIDs) => {
    newIDs.forEach((id, idx) => {
      if (id) {
        const found = materials.value.find(m => m.id === Number(id))
        if (found) {
          newExportOrder.value.material_ExportOrders[idx].unitOfMeasurement = found.unitOfMeasurement
        }
      } else {
        newExportOrder.value.material_ExportOrders[idx].unitOfMeasurement = ''
      }
    })
  },
  { deep: true }
)

const currentPage = ref(1)
const itemsPerPage = 5

const handleCreateExportOrder = async () => {
  // Kiểm tra số lượng xuất không vượt tồn kho
  const invalidMaterials = newExportOrder.value.material_ExportOrders.filter(material => {
    const found = materials.value.find(m => m.id === material.materialID)
    return material.quantity > (found?.stockQuantity ?? 0)
  })

  if (invalidMaterials.length > 0) {
    const names = invalidMaterials
      .map(mat => materials.value.find(m => m.id === mat.materialID)?.materialName || 'Không xác định')
      .join(', ')
    createOrderError.value = `Các vật tư sau có số lượng xuất lớn hơn số lượng tồn kho: ${names}. Vui lòng nhập lại hoặc bổ sung vật tư.`
    return
  } else {
    createOrderError.value = ''
  }

  try {
    // 1. Tạo ExportOrder đúng schema API
    const exportOrderData = {
      employeeID: employeeID.value,
      constructionItemID: newExportOrder.value.constructionItemID,
      exportDate: new Date().toISOString()
    }
    const createdOrder = await createExportOrder(exportOrderData)

    // 2. Tạo từng MaterialExportOrder
    for (const material of newExportOrder.value.material_ExportOrders) {
      await createMaterialExportOrder({
        materialID: material.materialID,
        exportOrderID: createdOrder.id,
        quantity: material.quantity
      })

      // 3. Cập nhật tồn kho vật tư
      const found = materials.value.find(m => m.id === material.materialID)
      if (found) {
        const newStock = (found.stockQuantity || 0) - (material.quantity || 0)
        await updateMaterialStock(material.materialID, newStock)
      }
    }

    showCreateForm.value = false
    showMessage('Tạo phiếu xuất thành công!', 'success')
    // Reset form
    newExportOrder.value = {
      planID: null,
      employeeID: null,
      material_ExportOrders: [],
      materialName: [],
      constructionID: null,
      constructionItemID: null
    }
    await fetchExportOrders()
  } catch (err) {
    console.error('Error creating export order:', err)
    showMessage('Có lỗi xảy ra khi tạo phiếu xuất', 'error')
  }
}

const handleConfirmStockOut = async () => {
  try {
    await updateExportOrderStatus(selectedStockOut.value.id, 'Completed')
    showMessage('Xuất kho thành công!', 'success')
    closeDetails()
  } catch (err) {
    console.error('Error confirming stock out:', err)
    showMessage('Có lỗi xảy ra khi xác nhận xuất kho', 'error')
  }
}

const handleReportIssue = async (material) => {
  try {
    await updateExportOrderStatus(selectedStockOut.value.id, 'Issue')
    showMessage(`Đã báo cáo sự cố cho vật tư: ${material.name}`, 'success')
  } catch (err) {
    console.error('Error reporting issue:', err)
    showMessage('Có lỗi xảy ra khi báo cáo sự cố', 'error')
  }
}

const openDetails = (stockOut) => {
  selectedStockOut.value = stockOut
  actualQuantities.value = stockOut.material_ExportOrders.map((material, index) => {
    const stock = materials.value.find(m => m.id === material.materialID)?.stockQuantity || 0
    const actual = material.quantity
    return {
      name: stockOut.materialName[index],
      actual,
      id: material.materialID,
      stock,
      remaining: stock - actual,
      unitOfMeasurement: materials.value.find(m => m.id === material.materialID)?.unitOfMeasurement
    }
  })
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

    <!-- Filter Section -->
    <div class="filter-section mb-4">
      <AdvancedFilter
        :items="exportOrders"
        :searchFields="['id', 'materialName', 'constructionName']"
        :customFilters="[
          {
            field: 'quantity',
            type: 'number',
            label: 'Số lượng',
            operator: '>'
          }
        ]"
        dateField="exportDate"
        v-model:filteredItems="filteredExportOrders"
      />
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
        <template #id="{ item }">
          <span class="fw-medium text-primary">#{{ item.id }}</span>
        </template>

        <template #constructionName="{ item }">
          <div>
            <div class="fw-medium">{{ item.constructionName }}</div>
          </div>
        </template>
        <template #constructionItemName="{ item }">
          <div>
            <div class="fw-medium">{{ item.constructionItemName }}</div>
          </div>
        </template>


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
        <Pagination :total-items="exportOrders.length" :items-per-page="itemsPerPage" :current-page="currentPage"
          @update:currentPage="handlePageChange" />
      </div>
    </template>

    <!-- Modal for Stock Out Details -->
    <ModalDialog v-model:show="showDetails" title="Chi Tiết Phiếu Xuất" size="xl">
      <StockOutDetail
        v-if="selectedStockOut"
        :stock-out="selectedStockOut"
        :actual-quantities="actualQuantities"
        @close="closeDetails"
        @confirm="handleConfirmStockOut"
      />
    </ModalDialog>

    <!-- Modal for Create Export Order -->
    <ModalDialog v-model:show="showCreateForm" title="Tạo Phiếu Xuất" size="lg">
      <form @submit.prevent="handleCreateExportOrder">
        <FormField label="Công Trình" type="select" v-model="newExportOrder.constructionID"
          :options="constructionOptions" required />
        <FormField label="Hạng Mục" type="select" v-model="newExportOrder.constructionItemID" :options="filteredConstructionItems.map(item => ({
          value: item.id,
          label: item.constructionItemName
        }))" required />

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
                <div class="col-md-4">
                  <FormField label="Tên Vật Tư" type="select" v-model="material.materialID" :options="materialOptions"
                    required
                    :disabled="!!material.materialID && !!(materialNorms.value?.find(norm => norm.materialID === material.materialID))" />
                </div>
                <div class="col-md-2">
                  <FormField label="Đơn Vị" type="text" v-model="material.unitOfMeasurement" :disabled="true" />
                </div>
                <div class="col-md-2">
                  <FormField label="Tồn kho" type="number" v-model="material.stockQuantity" required min="1"
                    :disabled="true" />
                </div>
                <div class="col-md-3">
                  <FormField label="Số Lượng Xuất" type="number" v-model="material.quantity" required min="1" />
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
        <div v-if="createOrderError" class="alert alert-danger">
          {{ createOrderError }}
        </div>
        <div class="text-end">
          <ActionButton type="primary" icon="fas fa-save" buttonType="submit">
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

.badge {
  font-size: 1rem;
  padding: 0.5em 1em;
  border-radius: 0.5em;
  margin-left: 0.5em;
}

/* New styles for stock out details */
.stock-out-details {
  background: #fff;
  border-radius: 0.75rem;
}

.detail-header {
  padding: 1.5rem;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.project-name {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.95rem;
}

.meta-item i {
  font-size: 1rem;
}

.export-summary {
  background: #fff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  color: #64748b;
  font-size: 0.9rem;
}

.summary-item .value {
  font-weight: 600;
  color: #2c3e50;
}

.materials-section {
  padding: 1.5rem;
}

.section-title {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.materials-table {
  margin-bottom: 0;
}

.materials-table thead th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  padding: 1rem;
  font-size: 0.9rem;
  border-bottom: 2px solid #e2e8f0;
}

.materials-table tbody td {
  padding: 1rem;
  vertical-align: middle;
}

.material-id {
  font-family: monospace;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.material-name {
  font-weight: 500;
  color: #1e293b;
}

.quantity-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.quantity-badge.stock {
  background: #f1f5f9;
  color: #475569;
}

.quantity-badge.export {
  background: #e0f2fe;
  color: #0369a1;
}

.quantity-badge.remaining {
  background: #f0fdf4;
  color: #166534;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.btn {
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #1e293b;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .project-meta {
    flex-direction: column;
    gap: 0.75rem;
  }

  .export-summary {
    margin-top: 1rem;
  }

  .materials-table {
    font-size: 0.9rem;
  }

  .quantity-badge {
    padding: 0.2rem 0.5rem;
  }
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

.btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
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
</style>
