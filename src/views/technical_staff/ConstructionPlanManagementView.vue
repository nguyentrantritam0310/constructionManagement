<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ConstructionPlanList from '../../components/construction-plan/ConstructionPlanList.vue'
import PlanForm from '../../components/construction-plan/PlanForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useConstructionPlan } from '../../composables/useConstructionPlan'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const showCreateForm = ref(false)
const {
  plans,
  loading,
  error,
  fetchPlans,
  createPlan,
  createMultiplePlans,
  updatePlan,
  updatePlanStatus
} = useConstructionPlan()
const { showMessage } = useGlobalMessage()

const showImportModal = ref(false)
const file = ref(null)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const filteredPlans = computed(() => {
  let result = [...plans.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(plan =>
      plan.id?.toString().includes(query) ||
      plan.constructionName?.toLowerCase().includes(query) ||
      plan.constructionItemName?.toLowerCase().includes(query) ||
      plan.employeeName?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(plan => plan.statusName === statusFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(plan => {
      const planDate = new Date(plan.startDate)
      return planDate >= start && planDate <= end
    })
  }

  return result
})

const showFilter = ref(false)
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRange.value = { start: null, end: null }
}

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPlans.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  fetchPlans()
})

const handleCreatePlan = () => {
  showCreateForm.value = false
  fetchPlans() // Refresh the list after creating
}

const handleUpdatePlan = async () => {
  await fetchPlans() // Refresh the list after updating
}

const handleUpdateStatus = async ({ plan, newStatus }) => {
  try {
    // Load lại dữ liệu
    await fetchPlans()
  } catch (error) {
    // Error handled by service
  }
}

const handleUpdateVolume = (updatedPlan) => {
  const index = plans.value.findIndex(p => p.id === updatedPlan.id)
  if (index !== -1) {
    plans.value[index] = {
      ...updatedPlan,
      currentVolume: updatedPlan.actualVolume
    }
    // Thêm thông báo thành công
  }
}

const exportToExcel = async () => {
  if (filteredPlans.value.length === 0) {
    alert('Không có dữ liệu để xuất.')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Plans')

  worksheet.columns = [
    { header: 'Mã Kế hoạch', key: 'id', width: 15 },
    { header: 'Tên Công trình', key: 'constructionName', width: 30 },
    { header: 'Tên Hạng mục', key: 'constructionItemName', width: 30 },
    { header: 'Người phụ trách', key: 'employeeName', width: 25 },
    { header: 'Ngày BĐ', key: 'startDate', width: 15 },
    { header: 'Ngày KTDK', key: 'expectedCompletionDate', width: 15 },
    { header: 'Trạng thái', key: 'statusName', width: 20 }
  ]

  filteredPlans.value.forEach(plan => {
    worksheet.addRow({
      ...plan,
      startDate: plan.startDate ? new Date(plan.startDate).toLocaleDateString('vi-VN') : '',
      expectedCompletionDate: plan.expectedCompletionDate ? new Date(plan.expectedCompletionDate).toLocaleDateString('vi-VN') : ''
    })
  })

  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
  })

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Danh_sach_ke_hoach.xlsx')
}

const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook()
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập')

  dataSheet.columns = [
    { header: 'ID Công trình', key: 'constructionID', width: 20 },
    { header: 'ID Hạng mục', key: 'constructionItemID', width: 20 },
    { header: 'ID Chỉ huy', key: 'employeeID', width: 20 },
    { header: 'Ngày Bắt Đầu (yyyy-mm-dd)', key: 'startDate', width: 25 },
    { header: 'Ngày Kết Thúc (yyyy-mm-dd)', key: 'expectedCompletionDate', width: 25 }
  ]
  dataSheet.getRow(1).eachCell(cell => { cell.font = { bold: true } })

  const instructionSheet = workbook.addWorksheet('Hướng dẫn')
  instructionSheet.columns = [
    { header: 'Tên cột', key: 'column', width: 30 },
    { header: 'Mô tả', key: 'description', width: 60 },
    { header: 'Bắt buộc', key: 'required', width: 15 }
  ]
  instructionSheet.getRow(1).eachCell(cell => { cell.font = { bold: true } })
  instructionSheet.addRows([
    { column: 'ID Công trình', description: 'ID của công trình (tham khảo danh sách công trình).', required: 'Có' },
    { column: 'ID Hạng mục', description: 'ID của hạng mục thuộc công trình trên (tham khảo chi tiết công trình).', required: 'Có' },
    { column: 'ID Chỉ huy', description: 'ID của nhân viên chỉ huy trưởng (tham khảo danh sách nhân viên).', required: 'Có' },
    { column: 'Ngày Bắt Đầu', description: 'Ngày bắt đầu kế hoạch theo định dạng YYYY-MM-DD.', required: 'Có' },
    { column: 'Ngày Kết Thúc', description: 'Ngày kết thúc dự kiến theo định dạng YYYY-MM-DD.', required: 'Có' }
  ])

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Mau_Nhap_Ke_Hoach.xlsx')
}

const handleFileUpload = (event) => {
  const target = event.target
  if (target && target.files) {
    file.value = target.files[0]
  }
}

const processImport = () => {
  if (!file.value) {
    showMessage('Vui lòng chọn một file Excel.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showMessage('File Excel không có dữ liệu.', 'error');
        return;
      }

      const plansToCreate = jsonData.map(row => ({
        constructionID: Number(row['ID Công trình']),
        constructionItemID: Number(row['ID Hạng mục']),
        employeeID: Number(row['ID Chỉ huy']),
        startDate: row['Ngày Bắt Đầu (yyyy-mm-dd)'],
        expectedCompletionDate: row['Ngày Kết Thúc (yyyy-mm-dd)'],
        constructionStatusID: 1 // Default status
      })).filter(p => p.constructionID && p.constructionItemID && p.employeeID);

      if (plansToCreate.length === 0) {
        showMessage('Không tìm thấy dữ liệu hợp lệ trong file.', 'error');
        return;
      }

      await createMultiplePlans(plansToCreate);
      await fetchPlans();
      file.value = null;
      showImportModal.value = false;
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error);
      showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error');
    }
  };
  reader.readAsArrayBuffer(file.value);
}

const formatDate = (date) => {
  if (!date || date === '0001-01-01T00:00:00') {
    return '(chưa cập nhật)'
  }
  return new Date(date).toLocaleDateString('vi-VN')
}

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Chờ khởi công', label: 'Chờ khởi công' },
  { value: 'Đang thi công', label: 'Đang thi công' },
  { value: 'Tạm dừng', label: 'Tạm dừng' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
  { value: 'Hủy bỏ', label: 'Hủy bỏ' }
]
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản Lý Kế Hoạch Thi Công</h1>
      <div class="d-flex gap-2">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateForm = true">
         Thêm
      </ActionButton>
      <!-- Icon bộ lọc -->
      <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
        Lọc
      </ActionButton>
      <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel">
        Xuất Excel
      </ActionButton>
      <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
        Nhập Excel
      </ActionButton>
      </div>
    </div>

    <!-- Filter Section -->
      <transition name="slide-fade">
        <div class="filter-section mb-4" v-show="showFilter">
          <div class="row g-3">
            <div class="col-md-4">
              <input
                type="text"
                class="form-control"
                v-model="searchQuery"
                placeholder="Tìm kiếm theo mã, tên công trình, hạng mục..."
              >
            </div>
            <div class="col-md-2">
              <select class="form-control" v-model="statusFilter">
                <option value="">Tất cả trạng thái</option>
                <option value="Chờ khởi công">Chờ khởi công</option>
                <option value="Đang thi công">Đang thi công</option>
                <option value="Tạm dừng">Tạm dừng</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Hủy bỏ">Hủy bỏ</option>
              </select>
            </div>
            <div class="col-md-2">
              <input
                type="date"
                class="form-control"
                v-model="dateRange.start"
                placeholder="Từ ngày"
              >
            </div>
            <div class="col-md-2">
              <input
                type="date"
                class="form-control"
                v-model="dateRange.end"
                placeholder="Đến ngày"
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

    <!-- Danh sách kế hoạch -->
    <ConstructionPlanList
      :plans="paginatedPlans"
      @update-plan="handleUpdatePlan"
      @update-status="handleUpdateStatus"
      @update-volume="handleUpdateVolume"
    />

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedPlans.length }} trên {{ filteredPlans.length }} kế hoạch
      </div>
      <Pagination
        :total-items="filteredPlans.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <ModalDialog v-model:show="showCreateForm" title="Tạo Kế Hoạch Thi Công" size="lg">
      <PlanForm mode="create" @close="handleCreatePlan" />
    </ModalDialog>

    <!-- Import Excel Modal -->
    <ModalDialog v-model:show="showImportModal" title="Nhập kế hoạch từ Excel" size="lg">
      <div class="p-4">
        <p>Vui lòng tải file mẫu và điền thông tin theo đúng định dạng được cung cấp trong sheet "Hướng dẫn".</p>
        <ActionButton type="secondary" icon="fas fa-download me-2" @click="downloadExcelTemplate">
          Tải file mẫu
        </ActionButton>
        <hr class="my-4">
        <h5>Tải lên file đã điền</h5>
        <div class="input-group">
          <input type="file" class="form-control" @change="handleFileUpload" accept=".xlsx, .xls">
          <button class="btn btn-primary" @click="processImport" :disabled="!file">
            <i class="fas fa-upload me-2"></i> Xử lý
          </button>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
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

/* .btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
} */

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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
