<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ConstructionPlanList from '../../components/construction-plan/ConstructionPlanList.vue'
import PlanForm from '../../components/construction-plan/PlanForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import Pagination from '../../components/common/Pagination.vue'
import TourGuide from '../../components/common/TourGuide.vue'
import AIChatbotButton from '../../components/common/AIChatbotButton.vue'
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
const showTourGuide = ref(false)
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

// Tour Guide Steps
const tourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý kế hoạch thi công. Tại đây bạn có thể xem, tạo, và quản lý các kế hoạch thi công của công trình.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ với các chức năng chính. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form"]',
    message: 'Đây là form tạo kế hoạch thi công. Bạn có thể chọn công trình, hạng mục, chỉ huy phụ trách, ngày bắt đầu và ngày kết thúc dự kiến. Sau khi điền đầy đủ, bấm "Lưu" để tạo kế hoạch.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc kế hoạch theo mã, tên công trình, hạng mục, trạng thái và khoảng thời gian.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo mã, tên công trình, hạng mục. Chọn trạng thái từ dropdown. Chọn khoảng thời gian từ ngày đến ngày. Bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách kế hoạch ra file Excel để lưu trữ hoặc xử lý thêm.'
  },
  {
    target: '[data-tour="import-modal"]',
    message: 'Đây là modal nhập Excel. Bạn có thể tải file mẫu, điền thông tin kế hoạch vào file Excel, sau đó chọn file và bấm "Xử lý" để import vào hệ thống.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(4)'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Hướng dẫn" (nút này) sẽ mở lại tour hướng dẫn để bạn xem lại các tính năng bất cứ lúc nào.'
  },
  {
    target: '[data-tour="table"]',
    message: 'Đây là bảng danh sách kế hoạch thi công. Bạn có thể xem thông tin chi tiết của từng kế hoạch. Click vào hàng để xem chi tiết kế hoạch. Cột "Thao tác" chứa các nút để cập nhật và đổi trạng thái kế hoạch.'
  },
  {
    target: '[data-tour="plan-detail-modal"]',
    message: 'Đây là modal chi tiết kế hoạch thi công. Tại đây bạn có thể xem và quản lý các nhiệm vụ thi công của kế hoạch, cũng như theo dõi khối lượng công việc. Hãy để tôi hướng dẫn từng phần!',
    action: {
      type: 'function',
      func: async () => {
        // Tìm và click vào hàng đầu tiên trong bảng để mở modal chi tiết
        await new Promise(resolve => setTimeout(resolve, 100))
        const tableRow = document.querySelector('[data-tour="table"] tbody tr')
        if (tableRow) {
          tableRow.click()
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  },
  {
    target: '[data-tour="plan-header"]',
    message: 'Đây là phần header của modal chi tiết. Bạn có thể thấy tên kế hoạch và trạng thái hiện tại của kế hoạch. Nút "Thêm Nhiệm Vụ" cho phép bạn thêm nhiệm vụ thi công mới vào kế hoạch này.'
  },
  {
    target: '[data-tour="add-task-button"]',
    message: 'Nút "Thêm Nhiệm Vụ" cho phép bạn thêm nhiệm vụ thi công mới vào kế hoạch. Mỗi nhiệm vụ sẽ có khối lượng hoạch định riêng và được quản lý độc lập.'
  },
  {
    target: '[data-tour="tasks-table"]',
    message: 'Đây là bảng danh sách nhiệm vụ thi công của kế hoạch. Mỗi nhiệm vụ có mã nhiệm vụ, khối lượng hoạch định, khối lượng hiện tại, khối lượng thực tế và trạng thái. Hãy để tôi giải thích chi tiết về logic khối lượng!'
  },
  {
    target: '[data-tour="workload-column"]',
    message: 'Cột "Khối lượng hoạch định" hiển thị khối lượng công việc đã được lên kế hoạch ban đầu cho nhiệm vụ này. Đây là mục tiêu cần đạt được.'
  },
  {
    target: '[data-tour="actual-workload-input"]',
    message: 'Cột "Khối lượng thực tế" là khối lượng công việc đã hoàn thành thực tế. Bạn có thể nhập trực tiếp vào ô này để cập nhật tiến độ. Lưu ý: Khối lượng thực tế không được vượt quá khối lượng hoạch định.'
  },
  {
    target: '[data-tour="current-volume-column"]',
    message: 'Cột "Khối lượng hiện tại" được tính tự động bằng công thức: Khối lượng hoạch định - Khối lượng thực tế. Đây là phần công việc còn lại chưa hoàn thành. Khi bạn cập nhật khối lượng thực tế, khối lượng hiện tại sẽ tự động thay đổi.'
  },
  {
    target: '[data-tour="plan-actions"]',
    message: 'Sau khi bạn cập nhật khối lượng thực tế cho các nhiệm vụ, bấm nút "Xác nhận" để lưu các thay đổi. Nút này chỉ hoạt động khi có thay đổi chưa được lưu. Nút "Hủy" sẽ đóng modal mà không lưu thay đổi.'
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều kế hoạch hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn!',
    action: {
      type: 'function',
      func: async () => {
        // Đóng modal chi tiết nếu đang mở
        const detailModal = document.querySelector('[data-tour="plan-detail-modal"]')
        if (detailModal && detailModal.closest('.modal.show')) {
          const closeBtn = detailModal.querySelector('[data-tour="plan-actions"] .btn-secondary')
          if (closeBtn) {
            closeBtn.click()
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
        if (showImportModal.value) {
          showImportModal.value = false
        }
        if (showCreateForm.value) {
          showCreateForm.value = false
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
]

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  // Mở filter section nếu chưa mở
  if (!showFilter.value) {
    showFilter.value = true
  }
  // Đợi một chút để UI render xong
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 data-tour="title">Quản Lý Kế Hoạch Thi Công</h1>
      <div class="d-flex gap-2" data-tour="toolbar">
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
        <div class="filter-section mb-4" v-show="showFilter" data-tour="filter">
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
      data-tour="table"
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
        data-tour="pagination"
      />
    </div>

    <ModalDialog v-model:show="showCreateForm" title="Tạo Kế Hoạch Thi Công" size="lg">
      <div data-tour="create-form">
        <PlanForm mode="create" @close="handleCreatePlan" />
      </div>
    </ModalDialog>

    <!-- Import Excel Modal -->
    <ModalDialog v-model:show="showImportModal" title="Nhập kế hoạch từ Excel" size="lg" data-tour="import-modal">
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
