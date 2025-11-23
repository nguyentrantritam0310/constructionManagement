<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import Pagination from '../../components/common/Pagination.vue'
import { useMaterialNorm } from '../../composables/useMaterialNorm'
import { useImportOrder } from '../../composables/useImportOrder'
import { useMaterialPlan } from '../../composables/useMaterialPlan'
import { useUser } from '../../composables/useUser'
import { useAuth } from '../../composables/useAuth'
import { useImportOrderEmployee } from '../../composables/useImportOrderEmployee'
import TourGuide from '../../components/common/TourGuide.vue'
import AIChatbotButton from '../../components/common/AIChatbotButton.vue'

const selectedConstruction = ref(null)
const showConfirmDialog = ref(false)
const materials = ref([])
const materialPlan = ref([])
const loading = ref(false)
const showMaterialNormDialog = ref(false)
const constructionError = ref('')

const showMessageDialog = ref(false)
const messageDialogContent = ref('')
const messageDialogType = ref('success') // 'success' hoặc 'error'
const showFilter = ref(false)

function showMessage(content, type = 'success') {
  messageDialogContent.value = content
  messageDialogType.value = type
  showMessageDialog.value = true
}

const {
  constructions,
  fetchConstructions
} = useConstructionManagement()

const {
  materialNorms,
  loading: materialNormLoading,
  error: materialNormError,
  fetchMaterialNorms
} = useMaterialNorm()

const { createImportOrder } = useImportOrder()
const { createMaterialPlan } = useMaterialPlan()
const { users } = useUser() // Lấy thông tin user hiện tại

const { currentUser } = useAuth()
const { createImportOrderEmployee } = useImportOrderEmployee()

// Lấy employeeID từ currentUser
const employeeID = computed(() => currentUser.value?.id)

const currentPage = ref(1)
const itemsPerPage = 5

// Filter variables
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref({
  start: '',
  end: ''
})

// Filtered constructions
const filteredConstructions = computed(() => {
  let result = [...constructions.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(construction =>
      construction.id?.toString().includes(query) ||
      construction.constructionName?.toLowerCase().includes(query) ||
      construction.location?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(construction => construction.statusName === statusFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start) {
    const start = new Date(dateRange.value.start)
    result = result.filter(construction => {
      const constructionDate = new Date(construction.startDate)
      return constructionDate >= start
    })
  }
  if (dateRange.value.end) {
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)
    result = result.filter(construction => {
      const completionDate = new Date(construction.expectedCompletionDate)
      return completionDate <= end
    })
  }

  return result
})

// Get unique status values
const statusOptions = computed(() => {
  const statuses = new Set(constructions.value.map(c => c.statusName))
  return Array.from(statuses)
})

const paginatedConstructions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredConstructions.value.slice(start, end)
})

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRange.value = {
    start: '',
    end: ''
  }
  currentPage.value = 1
}

// Watch filters to reset page
watch([searchQuery, statusFilter, dateRange], () => {
  currentPage.value = 1
}, { deep: true })

const currentMaterialPage = ref(1)
const materialItemsPerPage = 5

const paginatedMaterials = computed(() => {
  const start = (currentMaterialPage.value - 1) * materialItemsPerPage
  const end = start + materialItemsPerPage
  return materials.value.slice(start, end)
})

// Thêm computed property để nhóm định mức theo hạng mục
const groupedMaterialNorms = computed(() => {
  const groups = {}
  materialNorms.value.forEach(norm => {
    if (!groups[norm.constructionItemName]) {
      groups[norm.constructionItemName] = []
    }
    groups[norm.constructionItemName].push(norm)
  })
  return groups
})

// Thêm computed property để tính tổng số lượng cho từng vật tư
const materialTotals = computed(() => {
  const totals = {}
  materialNorms.value.forEach(norm => {
    const key = `${norm.materialID}-${norm.materialName}`
    if (!totals[key]) {
      totals[key] = {
        materialName: norm.materialName,
        totalQuantity: 0,
        unitOfMeasurement: norm.unitOfMeasurement,
        totalAmount: 0
      }
    }
    totals[key].totalQuantity += parseInt(norm.quantity)
    totals[key].totalAmount += parseInt(norm.quantity) * parseFloat(norm.price)
  })
  return Object.values(totals)
})

// Thêm computed property để tính tổng thành tiền
const grandTotal = computed(() => {
  return materialTotals.value.reduce((sum, material) => sum + material.totalAmount, 0)
})

onMounted(async () => {
  try {
    await fetchConstructions()
    constructionError.value = ''
  } catch (error) {
    constructionError.value = 'Không thể tải danh sách công trình'
  }
})

const constructionColumns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày hoàn thành dự kiến' },
  { key: 'statusName', label: 'Trạng thái' }
]

const materialColumns = [
  { key: 'materialID', label: 'Mã vật tư' },
  { key: 'materialName', label: 'Tên vật tư' },
  { key: 'workSubTypeVariantDescription', label: 'Công tác' },
  { key: 'unitOfMeasurement', label: 'Đơn vị' },
  { key: 'quantity', label: 'Định mức' },
  { key: 'price', label: 'Đơn giá' },
  { key: 'total', label: 'Thành tiền' }
]

const handleConstructionSelect = async (construction) => {
  selectedConstruction.value = construction
  showMaterialNormDialog.value = true
  try {
    await fetchMaterialNorms(construction.id)
  } catch (error) {
    showMessage('Không thể tải thông tin vật tư', 'error')
  }
}

const handleQuantityChange = (norm, value) => {
  const newQuantity = parseInt(value)
  if (isNaN(newQuantity) || newQuantity < 0) {
    showMessage('Vui lòng nhập số lượng hợp lệ', 'error')
    return
  }

  const index = materialNorms.value.findIndex(
    n => n.materialID === norm.materialID &&
      n.workSubTypeVariantDescription === norm.workSubTypeVariantDescription
  )

  if (index !== -1) {
    materialNorms.value[index].quantity = newQuantity
  }
}

const handleSavePlan = async () => {
  console.log('handleSavePlan called') // Debug
  if (!selectedConstruction.value) {
    showMessage('Vui lòng chọn công trình', 'error')
    return
  }

  if (!employeeID.value) {
    showMessage('Không thể xác định người dùng hiện tại', 'error')
    return
  }

  try {
    loading.value = true
    console.log(materialNorms.value) // Debug

    // Tạo ImportOrder
    const importOrderData = {
      importDate: new Date().toISOString(), // Thời gian hiện tại
      status: 'Pending'
    }
    console.log('ImportOrder data:', importOrderData) // Debug
    const importOrder = await createImportOrder(importOrderData)
    console.log('Created ImportOrder:', importOrder) // Debug

    const importOrderEmployeeData = {
      importOrderId: importOrder.id,
      employeeID: employeeID.value,
      role: 'Planner' // hoặc role phù hợp
    }
    console.log('ImportOrderEmployee data:', importOrderEmployeeData) // Debug
    // POST ImportOrderEmployee sau khi tạo ImportOrder
    const importOrderEmployee = await createImportOrderEmployee(importOrderEmployeeData)
    console.log('Created ImportOrderEmployee:', importOrderEmployee) // Debug


    // Tạo MaterialPlan cho từng vật tư
    for (const material of materialNorms.value) { // Iterate over materialNorms.value
      const materialPlanData = {
        importOrderID: importOrder.id,
        materialID: material.materialID,
        constructionItemID: material.constructionItemID,
        importQuantity: material.quantity,
        note: ''
      }
      console.log('MaterialPlan data:', materialPlanData) // Debug
      const createdMaterialPlan = await createMaterialPlan(materialPlanData)
      materialPlan.value.push(createdMaterialPlan) // Push to materialPlan array
    }

    console.log('MaterialPlan value:', materialPlan.value) // Debug
    showMessage('Lưu kế hoạch vật tư thành công', 'success')
    showMaterialNormDialog.value = false
  } catch (error) {
    console.error('Error in handleSavePlan:', error) // Debug lỗi
    showMessage('Không thể lưu kế hoạch vật tư', 'error')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  showConfirmDialog.value = true
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleMaterialPageChange = (page) => {
  currentMaterialPage.value = page
}

// Tour Guide Steps
const showTourGuide = ref(false)
const tourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang lập kế hoạch vật tư. Tại đây bạn có thể chọn công trình và lập kế hoạch vật tư cần nhập kho cho công trình đó.'
  },
  {
    target: '[data-tour="filter-button"]',
    message: 'Nút "Lọc" cho phép bạn ẩn/hiện phần lọc để tìm kiếm công trình theo mã, tên, địa điểm, trạng thái hoặc khoảng thời gian.'
  },
  {
    target: '[data-tour="filter-section"]',
    message: 'Đây là phần lọc. Bạn có thể tìm kiếm công trình theo mã, tên hoặc địa điểm, lọc theo trạng thái, hoặc chọn khoảng thời gian từ ngày bắt đầu đến ngày hoàn thành dự kiến. Bấm "Đặt lại" để xóa tất cả bộ lọc.',
    action: {
      type: 'function',
      func: async () => {
        // Đảm bảo filter section được mở
        if (!showFilter.value) {
          showFilter.value = true
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  },
  {
    target: '[data-tour="construction-table"]',
    message: 'Đây là bảng danh sách công trình. Bạn có thể xem thông tin về mã công trình, tên công trình, địa điểm, ngày bắt đầu, ngày hoàn thành dự kiến và trạng thái. Click vào một hàng để xem và lập kế hoạch vật tư cho công trình đó.'
  },
  {
    target: '[data-tour="construction-table"]',
    message: 'Hãy để tôi mở modal định lượng vật tư cho bạn. Tôi sẽ click vào hàng đầu tiên trong bảng.',
    action: {
      type: 'function',
      func: async () => {
        // Đợi một chút để đảm bảo bảng đã render
        await new Promise(resolve => setTimeout(resolve, 300))
        // Tìm bảng và click vào hàng đầu tiên
        const table = document.querySelector('[data-tour="construction-table"]')
        if (table) {
          const firstRow = table.querySelector('tbody tr')
          if (firstRow) {
            firstRow.click()
            // Đợi modal mở
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
    }
  },
  {
    target: '[data-tour="material-norm-modal"]',
    message: 'Đây là modal định lượng vật tư. Bạn có thể xem thông tin công trình đã chọn, tổng hợp vật tư, và chi tiết định mức vật tư theo từng hạng mục thi công.'
  },
  {
    target: '[data-tour="material-summary"]',
    message: 'Đây là bảng tổng hợp vật tư. Bảng này hiển thị tổng số lượng và thành tiền cho từng loại vật tư cần nhập kho. Bạn có thể xem tổng thành tiền ở phía dưới.'
  },
  {
    target: '[data-tour="material-detail"]',
    message: 'Đây là phần chi tiết định mức vật tư theo từng hạng mục thi công. Mỗi hạng mục có một bảng riêng hiển thị các vật tư cần thiết. Bạn có thể chỉnh sửa số lượng định mức trong cột "Định mức" để điều chỉnh kế hoạch vật tư.'
  },
  {
    target: '[data-tour="save-button"]',
    message: 'Nút "Lưu kế hoạch" cho phép bạn lưu kế hoạch vật tư đã chỉnh sửa. Sau khi lưu, kế hoạch sẽ được gửi lên giám đốc để duyệt.',
    action: {
      type: 'function',
      func: async () => {
        // Đóng modal trước khi tiếp tục
        await new Promise(resolve => setTimeout(resolve, 300))
        const modal = document.querySelector('[data-tour="material-norm-modal"]')
        if (modal) {
          const closeButton = modal.querySelector('.btn-close')
          if (closeButton) {
            closeButton.click()
          } else {
            // Nếu không tìm thấy, thử tìm nút Hủy
            const cancelButton = modal.querySelector('button')
            if (cancelButton && (cancelButton.textContent.includes('Hủy') || cancelButton.textContent.includes('Cancel'))) {
              cancelButton.click()
            }
          }
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều công trình hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn!'
  }
]

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
}
</script>

<template>
  <div class="container-fluid py-4 material-planning">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
      <h2 class="mb-0" data-tour="title">Kế Hoạch Vật Tư</h2>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter" data-tour="filter-button">
          Lọc
        </ActionButton>
        <div class="alert alert-info d-flex align-items-center mb-0 guide-alert">
          <i class="fas fa-info-circle me-2 text-primary" style="font-size: 1.4rem;"></i>
          <span>Vui lòng chọn một công trình bên dưới để xem và lập kế hoạch vật tư.</span>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <transition name="slide-fade">
      <div class="filter-section mb-4" v-show="showFilter" data-tour="filter-section">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input
                type="text"
                class="form-control"
                v-model="searchQuery"
                placeholder="Tìm kiếm theo mã, tên, địa điểm..."
              >
            </div>
          </div>
          <div class="col-md-2">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-tasks"></i>
              </span>
              <select class="form-control" v-model="statusFilter">
                <option value="">Tất cả trạng thái</option>
                <option v-for="status in statusOptions" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.start"
              placeholder="Từ ngày bắt đầu"
            >
          </div>
          <div class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.end"
              placeholder="Đến ngày hoàn thành"
            >
          </div>
          <div class="col-md-2">
            <button class="btn btn-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Bỏ card, chỉ còn DataTable và phân trang -->
    <div>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="constructionError" class="alert alert-danger" role="alert">
        {{ constructionError }}
      </div>

      <DataTable v-else :columns="constructionColumns" :data="paginatedConstructions"
        @row-click="handleConstructionSelect" class="id" data-tour="construction-table">
        <template #id="{ item }">
          <span class="fw-medium text-primary">{{ item.id }}</span>
        </template>

        <template #constructionName="{ item }">
          <div>
            <div class="fw-medium">{{ item.constructionName }}</div>
          </div>
        </template>

        <template #location="{ item }">
          <div class="d-flex align-items-center">
            <i class="fas fa-map-marker-alt text-muted me-1"></i>
            {{ item.location }}
          </div>
        </template>

        <template #startDate="{ item }">
          <div class="date-info">
            <i class="fas fa-calendar text-muted"></i>
            {{ formatDate(item.startDate) }}
          </div>
        </template>

        <template #expectedCompletionDate="{ item }">
          <div class="date-info">
            <i class="fas fa-calendar-check text-muted"></i>
            {{ formatDate(item.expectedCompletionDate) }}
          </div>
        </template>

        <template #statusName="{ item }">
          <StatusBadge :status="item.statusName" />
        </template>
      </DataTable>

      <!-- Phân trang công trình -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <div class="text-muted">
          Hiển thị {{ paginatedConstructions.length }} trên {{ filteredConstructions.length }} công trình
        </div>
        <Pagination :total-items="filteredConstructions.length" :items-per-page="itemsPerPage" :current-page="currentPage"
          @update:currentPage="handlePageChange" data-tour="pagination" />
      </div>
    </div>

    <!-- Material Norm Dialog -->
    <ModalDialog v-if="showMaterialNormDialog" :show="showMaterialNormDialog"
      @update:show="showMaterialNormDialog = $event" title="Định lượng vật tư" size="xl" data-tour="material-norm-modal">
      <div class="material-norm-dialog">
        <div class="alert alert-info mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="alert-heading">{{ selectedConstruction?.constructionName }}</h5>
              <p class="mb-0">Địa điểm: {{ selectedConstruction?.location }}</p>
            </div>
          </div>
        </div>

        <div v-if="materialNormLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="materialNormError" class="alert alert-danger" role="alert">
          {{ materialNormError }}
        </div>

        <div v-else>
          <!-- Hiển thị tổng số lượng cho từng vật tư -->
          <div class="card mb-4" data-tour="material-summary">
            <div class="card-header text-white">
              <h5 class="mb-0">Tổng hợp vật tư</h5>
            </div>
            <div class="card-body p-0">
              <DataTable :columns="[
                { key: 'materialName', label: 'Tên vật tư' },
                { key: 'totalQuantity', label: 'Tổng số lượng' },
                { key: 'unitOfMeasurement', label: 'Đơn vị' },
                { key: 'totalAmount', label: 'Thành tiền' }
              ]" :data="materialTotals">
                <template #totalQuantity="{ item }">
                  <span class="fw-bold">{{ item.totalQuantity }}</span>
                </template>
                <template #totalAmount="{ item }">
                  <span class="fw-bold">{{ formatCurrency(item.totalAmount) }}</span>
                </template>
              </DataTable>
            </div>
          </div>

          <!-- Hiển thị tổng thành tiền -->
          <div class="alert alert-success mb-4">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Tổng thành tiền:</h5>
              <h4 class="mb-0">{{ formatCurrency(grandTotal) }}</h4>
            </div>
          </div>

          <!-- Hiển thị chi tiết theo hạng mục -->
          <div v-for="(norms, itemName) in groupedMaterialNorms" :key="itemName" class="mb-4" data-tour="material-detail">
            <div class="card">
              <div class="card-header bg-light">
                <h5 class="mb-0">{{ itemName }}</h5>
              </div>
              <div class="card-body p-0">
                <DataTable :columns="materialColumns" :data="norms">
                  <template #quantity="{ item }">
                    <input type="number" class="form-control form-control-sm" :value="item.quantity"
                      @input="(e) => handleQuantityChange(item, e.target.value)" min="0" step="1"
                      @keypress="(e) => !/^\d*$/.test(e.key) && e.preventDefault()" />
                  </template>

                  <template #price="{ item }">
                    {{ formatCurrency(item.price) }}
                  </template>

                  <template #total="{ item }">
                    {{ formatCurrency(item.quantity * parseFloat(item.price)) }}
                  </template>
                </DataTable>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <ActionButton type="primary" icon="fas fa-save" @click="handleSavePlan" data-tour="save-button">
            Lưu kế hoạch
          </ActionButton>
          <ActionButton type="secondary" icon="fas fa-times" @click="handleCancel">
            Hủy
          </ActionButton>
        </div>
      </div>
    </ModalDialog>

    <!-- Dialog xác nhận hủy -->
    <ModalDialog v-model:show="showConfirmDialog" title="Xác nhận" size="sm">
      <div class="p-3">
        <p>Bạn có muốn lưu kế hoạch vật tư không?</p>
        <div class="d-flex justify-content-end gap-2">
          <ActionButton type="secondary" @click="showConfirmDialog = false">
            Không
          </ActionButton>
          <ActionButton type="primary" @click="handleSavePlan">
            Có
          </ActionButton>
        </div>
      </div>
    </ModalDialog>

    <!-- Dialog hiển thị thông báo -->
    <ModalDialog v-if="showMessageDialog" :show="showMessageDialog" @update:show="showMessageDialog = false"
      :title="messageDialogType === 'success' ? 'Thành công' : 'Lỗi'" size="sm">
      <div
        :class="['alert', messageDialogType === 'success' ? 'alert-success' : 'alert-danger', 'mb-0', 'text-center']">
        {{ messageDialogContent }}
      </div>
      <div class="d-flex justify-content-center mt-3">
        <button class="btn btn-primary" @click="showMessageDialog = false">Đóng</button>
      </div>
    </ModalDialog>
    
    <!-- Tour Guide -->
    <TourGuide 
      :show="showTourGuide" 
      :steps="tourSteps" 
      @update:show="showTourGuide = $event" 
      @complete="handleTourComplete" 
    />
    <AIChatbotButton 
      message="Xin chào! Tôi có thể giúp gì cho bạn?" 
      title="Trợ lý AI"
      @guide-click="startTour"
    />
  </div>
</template>

<style scoped>
.material-planning {
  animation: fadeIn 0.3s ease-out;
}

.material-norm-dialog {
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.construction-table {
  margin-bottom: 0;
}

.construction-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.construction-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.construction-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.construction-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.table input {
  width: 100px;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
  white-space: nowrap;
  font-style: italic;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.form-control-sm {
  width: 100px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.card-header h5 {
  color: #495057;
  font-size: 1.1rem;
}

.card-header.bg-primary {
  background-color: #0d6efd !important;
}

.alert-success {
  background-color: #d1e7dd;
  border-color: #badbcc;
  color: #0f5132;
}

.alert-success h4 {
  color: #0f5132;
}

.fw-bold {
  font-weight: 600;
}

.guide-alert {
  font-size: 1rem;
  padding: 0.5rem 1rem;
  background: #e9f6ff;
  border: 1px solid #b6e0fe;
  color: #0c5460;
  border-radius: 0.5rem;
  min-width: 340px;
  max-width: 600px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-section .form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.filter-section .form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.filter-section .input-group-text {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem 0 0 0.5rem;
  padding: 0.5rem 1rem;
  color: #6c757d;
}

.filter-section .input-group .form-control {
  border-radius: 0 0.5rem 0.5rem 0;
}

.filter-section .btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.filter-section .btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.filter-section .btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #495057;
}

.gap-2 {
  gap: 0.5rem;
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

@media (max-width: 768px) {
  .guide-alert {
    margin-top: 1rem;
    width: 100%;
    min-width: unset;
    max-width: unset;
    justify-content: center;
  }
}
</style>
