<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateButton from '../../components/common/UpdateButton.vue'
import ChangeStatusButton from '../../components/common/ChangeStatusButton.vue'
import StatusChangeDialog from '../../components/common/StatusChangeDialog.vue'
import ConstructionForm from '../../components/construction/ConstructionForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import ActionButton from '@/components/common/ActionButton.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const { showMessage } = useGlobalMessage()
const router = useRouter()

const {
  constructions,
  selectedConstruction,
  fetchConstructions,
  createConstruction,
  createMultipleConstructions,
  updateConstruction,
  updateConstructionStatus,
  fetchConstructionDetail
} = useConstructionManagement()

const showCreateDialog = ref(false)
const showUpdateDialog = ref(false)
const showStatusDialog = ref(false)
const showImportModal = ref(false)
const file = ref(null)

const currentPage = ref(1)
const itemsPerPage = 5

const searchQuery = ref('')
const statusFilter = ref('')
const dateRangeFilter = ref({
  start: null,
  end: null
})

const columns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày BĐ', class: 'col-date' },
  { key: 'expectedCompletionDate', label: 'Ngày KTDK', class: 'col-date' },
  { key: 'actualCompletionDate', label: 'Ngày KTTT', class: 'col-date' },
  { key: 'statusName', label: 'Trạng thái', class: 'col-status' }
]

// Filtered constructions
const filteredConstructions = computed(() => {
  return constructions.value.filter(construction => {
    const matchesSearch = searchQuery.value === '' ||
      construction.constructionName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      construction.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      construction.id.toString().includes(searchQuery.value)

    const matchesStatus = statusFilter.value === '' ||
      construction.statusName === statusFilter.value

    const matchesDateRange = !dateRangeFilter.value.start || !dateRangeFilter.value.end ||
      (new Date(construction.startDate) >= new Date(dateRangeFilter.value.start) &&
        new Date(construction.startDate) <= new Date(dateRangeFilter.value.end))

    return matchesSearch && matchesStatus && matchesDateRange
  })
})

// Update paginated constructions to use filtered data
const paginatedConstructions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredConstructions.value.slice(start, end)
})

const handleRowClick = (construction) => {
  router.push(`/construction-management/${construction.id}`) // Chuyển đến trang chi tiết công trình
}

onMounted(async () => {
  try {
    await fetchConstructions()
  } catch (error) {
    console.error('Error fetching constructions:', error)
    showMessage('Không thể tải danh sách công trình', 'error')
  }
})

const handleUpdateConstructionStatus = async (data) => {
  try {
    await updateConstructionStatus(data.item.id, data.newStatus)
    showMessage('Cập nhật trạng thái thành công', 'success')
    await fetchConstructions() // Refresh the list after status change
    showStatusDialog.value = false
  } catch (err) {
    console.error('Error updating status:', err)
    showMessage('Không thể cập nhật trạng thái', 'error')
  }
}

const openCreateForm = () => {
  selectedConstruction.value = null
  showCreateDialog.value = true
}

const closeCreateForm = () => {
  showCreateDialog.value = false
}

const openUpdateForm = async (constructionId) => {
  try {
    const construction = await fetchConstructionDetail(constructionId)
    if (construction) {
      selectedConstruction.value = construction
      showUpdateDialog.value = true
    }
  } catch (error) {
    console.error('Error fetching construction details:', error)
    showMessage('Không thể tải thông tin công trình', 'error')
  }
}

const closeUpdateForm = () => {
  showUpdateDialog.value = false
}

const openStatusDialog = (construction) => {
  selectedConstruction.value = construction
  showStatusDialog.value = true
}

const handleCreateSubmit = async () => {
  try {
    await fetchConstructions() // Chỉ refresh danh sách sau khi tạo
    showCreateDialog.value = false
  } catch (err) {
    console.error('Error refreshing constructions:', err)
    showMessage('Không thể cập nhật danh sách công trình', 'error')
  }
}

const handleUpdateSubmit = async () => {
  try {
    await fetchConstructions() // Chỉ refresh danh sách sau khi cập nhật
    showUpdateDialog.value = false
    selectedConstruction.value = null
  } catch (err) {
    console.error('Error refreshing constructions:', err)
    showMessage('Không thể cập nhật danh sách công trình', 'error')
  }
}

const exportToExcel = async () => {
  const dataToExport = filteredConstructions.value
  if (dataToExport.length === 0) {
    showMessage('Không có dữ liệu để xuất.', 'info')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Constructions')

  // Define columns
  worksheet.columns = [
    { header: 'Mã công trình', key: 'id', width: 15 },
    { header: 'Tên công trình', key: 'constructionName', width: 40 },
    { header: 'Địa điểm', key: 'location', width: 40 },
    { header: 'Ngày BĐ', key: 'startDate', width: 15 },
    { header: 'Ngày KTDK', key: 'expectedCompletionDate', width: 15 },
    { header: 'Ngày KTTT', key: 'actualCompletionDate', width: 15 },
    { header: 'Trạng thái', key: 'statusName', width: 20 }
  ]

  // Add data
  dataToExport.forEach(item => {
    worksheet.addRow({
      ...item,
      startDate: item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '',
      expectedCompletionDate: item.expectedCompletionDate ? new Date(item.expectedCompletionDate).toLocaleDateString('vi-VN') : '',
      actualCompletionDate: item.actualCompletionDate ? new Date(item.actualCompletionDate).toLocaleDateString('vi-VN') : ''
    })
  })

  // Style header
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Danh_sach_cong_trinh.xlsx')
}

const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook()
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập')
  const instructionSheet = workbook.addWorksheet('Hướng dẫn')

  // Data Sheet
  dataSheet.columns = [
    { header: 'Tên Dự Án', key: 'constructionName', width: 40 },
    { header: 'Loại Dự Án (ID)', key: 'constructionTypeID', width: 20 },
    { header: 'Địa Điểm', key: 'location', width: 40 },
    { header: 'Tổng Diện Tích (m²)', key: 'totalArea', width: 20 },
    { header: 'Ngày Bắt Đầu (yyyy-mm-dd)', key: 'startDate', width: 20 },
    { header: 'Ngày Hoàn Thành Dự Kiến (yyyy-mm-dd)', key: 'expectedCompletionDate', width: 30 }
  ]
  dataSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
  })

  // Instruction Sheet
  instructionSheet.columns = [
    { header: 'Tên cột', key: 'column', width: 30 },
    { header: 'Mô tả', key: 'description', width: 50 },
    { header: 'Bắt buộc', key: 'required', width: 15 },
    { header: 'Ví dụ', key: 'example', width: 30 }
  ]
  instructionSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
  })
  instructionSheet.addRows([
    { column: 'Tên Dự Án', description: 'Tên của công trình xây dựng.', required: 'Có', example: 'Tòa nhà Landmark 81' },
    { column: 'Loại Dự Án (ID)', description: 'ID của loại dự án. 1: Cầu đường, 2: Nhà ở, 3: Công nghiệp, 4: Thủy lợi.', required: 'Có', example: '2' },
    { column: 'Địa Điểm', description: 'Địa chỉ thi công công trình.', required: 'Có', example: '208 Nguyễn Hữu Cảnh, P.22, Q.Bình Thạnh, TP.HCM' },
    { column: 'Tổng Diện Tích (m²)', description: 'Tổng diện tích xây dựng, chỉ nhập số.', required: 'Có', example: '241000' },
    { column: 'Ngày Bắt Đầu', description: 'Ngày bắt đầu thi công theo định dạng YYYY-MM-DD.', required: 'Có', example: '2024-01-15' },
    { column: 'Ngày Hoàn Thành Dự Kiến', description: 'Ngày dự kiến hoàn thành theo định dạng YYYY-MM-DD.', required: 'Có', example: '2026-01-15' }
  ])

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Mau_Nhap_Cong_Trinh.xlsx')
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

      const constructionsToCreate = jsonData.map(row => ({
        constructionName: row['Tên Dự Án'],
        constructionTypeID: Number(row['Loại Dự Án (ID)']),
        location: row['Địa Điểm'],
        totalArea: Number(row['Tổng Diện Tích (m²)']),
        startDate: row['Ngày Bắt Đầu (yyyy-mm-dd)'],
        expectedCompletionDate: row['Ngày Hoàn Thành Dự Kiến (yyyy-mm-dd)'],
        constructionStatusID: 1 // Default status
      })).filter(c => c.constructionName && c.constructionTypeID);

      if (constructionsToCreate.length === 0) {
        showMessage('Không tìm thấy dữ liệu hợp lệ trong file.', 'error');
        return;
      }

      await createMultipleConstructions(constructionsToCreate);
      await fetchConstructions();
      file.value = null;
      showImportModal.value = false;
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error);
      showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error');
    }
  };
  reader.readAsArrayBuffer(file.value);
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const formatDate = (date, isActualCompletion = false) => {
  if (!date) {
    return isActualCompletion ? '(Chưa cập nhật)' : '-'
  }
  if (date === '0001-01-01T00:00:00') {
    return '(Chưa cập nhật)'
  }
  return new Date(date).toLocaleDateString('vi-VN')
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRangeFilter.value = { start: null, end: null }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản Lý Công Trình</h1>
      <div class="d-flex gap-2">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="openCreateForm">
          Thêm</ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" class="form-control" v-model="searchQuery" placeholder="Tìm kiếm công trình...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Chờ khởi công">Chờ khởi công</option>
              <option value="Đang thi công">Đang thi công</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Hủy bỏ">Hủy bỏ</option>
            </select>
          </div>
          <div class="col-md-4">
            <div class="input-group">
              <input type="date" class="form-control" v-model="dateRangeFilter.start" placeholder="Từ ngày">
              <input type="date" class="form-control" v-model="dateRangeFilter.end" placeholder="Đến ngày">
            </div>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" @click="resetFilters">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Constructions Table -->
    <DataTable :columns="columns" :data="paginatedConstructions" @row-click="handleRowClick"
      class="construction-table">
      <template #id="{ item }">
        <span class="fw-medium text-primary">CT-{{ item.id }}</span>
      </template>
      <template #constructionName="{ item }">
        <div class="fw-medium">{{ item.constructionName }}</div>
      </template>
      <template #location="{ item }">
        {{ item.location }}
      </template>
      <template #startDate="{ item }">
        {{ formatDate(item.startDate) }}
      </template>
      <template #expectedCompletionDate="{ item }">
        {{ formatDate(item.expectedCompletionDate) }}
      </template>
      <template #actualCompletionDate="{ item }">
        {{ formatDate(item.actualCompletionDate, true) }}
      </template>
      <template #statusName="{ item }">
        <StatusBadge :status="item.statusName" />
      </template>
      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="openUpdateForm(item.id)" />
          <ChangeStatusButton @click.stop="openStatusDialog(item)" />
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedConstructions.length }} trên {{ filteredConstructions.length }} công trình
      </div>
      <Pagination :total-items="filteredConstructions.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Create Dialog -->
    <ModalDialog v-model:show="showCreateDialog" title="Thêm Công Trình Mới" size="lg">
      <ConstructionForm mode="create" @close="handleCreateSubmit" />
    </ModalDialog>

    <!-- Update Dialog -->
    <ModalDialog v-model:show="showUpdateDialog" title="Cập Nhật Công Trình" size="lg">
      <ConstructionForm v-if="selectedConstruction" mode="update" :construction="selectedConstruction"
        @close="handleUpdateSubmit" />
    </ModalDialog>

    <!-- Status Change Dialog -->
    <StatusChangeDialog v-if="showStatusDialog && selectedConstruction" :show="showStatusDialog"
      :item="selectedConstruction" type="construction" title="Thay Đổi Trạng Thái Công Trình"
      @update:show="showStatusDialog = $event" @submit="handleUpdateConstructionStatus" />

    <!-- Import Excel Modal -->
    <ModalDialog v-model:show="showImportModal" title="Nhập công trình từ Excel" size="lg">
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


