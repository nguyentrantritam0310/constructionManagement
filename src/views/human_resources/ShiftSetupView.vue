<!-- filepath: c:\Users\nguye\OneDrive\Desktop\ConstructionManagement\vue-app\src\views\human_resources\ShiftSetupView.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useWorkShift } from '../../composables/useWorkShift'
import { useAttendanceMachine } from '../../composables/useAttendanceMachine'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import WorkShiftForm from '@/components/common/workshift/WorkShiftForm.vue'
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import AttendanceMachineForm from '@/components/common/workshift/AttendanceMachineForm.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import TourGuide from '@/components/common/TourGuide.vue'
const {
  workshifts,
  fetchWorkShifts,
  createWorkShifts,
  updateWorkShift,
  deleteWorkShift
} = useWorkShift()
const {
  attendanceMachines,
  fetchAttendanceMachines,
  createAttendanceMachine,
  updateAttendanceMachine,
  deleteAttendanceMachine,
  createMultipleAttendanceMachines
} = useAttendanceMachine()

const showCreateForm = ref(false)
const showCreateFormAttendanceMachine = ref(false)
const showUpdateForm = ref(false)
const showUpdateFormAttendanceMachine = ref(false)
const selectedItem = ref(null)
const showImportModal = ref(false)
const showFilter = ref(false)
const showTourGuide = ref(false)
const { showMessage } = useGlobalMessage()
onMounted(async () => {
  await fetchWorkShifts()
  await fetchAttendanceMachines()
})

const openUpdateForm = (id) => {
  const found = workshifts.value.find(w => w.id === id || w.ID === id)
  selectedItem.value = found
  showUpdateForm.value = true
}

const handleUpdateWorkShift = async (payload) => {
  const id = selectedItem.value.id || selectedItem.value.ID
  await updateWorkShift(id, { ...payload, id })
  showUpdateForm.value = false
  selectedItem.value = null
  await fetchWorkShifts()
}

const handleDeleteWorkShift = async (item) => {
   if (confirm(`Bạn có chắc chắn muốn xóa ca làm "${item.name}" không?`)) {
    await deleteWorkShift(item.code || item.ID)
  }
}

const activeTab = ref('shift')

const tabs = [
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'machine', label: 'Máy chấm công' }
]

const handleCreateWorkShift = async (payload) => {
  await createWorkShifts(payload)
  showCreateForm.value = false
  await fetchWorkShifts()
}
const handleCreateMachine = async (formData) => {
  await createAttendanceMachine(formData)
  showCreateFormAttendanceMachine.value = false
}

// Phân trang ca làm việc
const shiftCurrentPage = ref(1)
const shiftItemsPerPage = ref(5)
const shiftColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'code', label: 'Mã ca' },
  { key: 'name', label: 'Tên ca' },
  { key: 'in', label: 'Giờ vào' },
  { key: 'out', label: 'Giờ ra' },
]
const findEarliestTime = (times) => {
  if (!times.length) return '--:--'
  return times.reduce((a, b) => {
    const timeA = new Date(`2000-01-01T${a}`)
    const timeB = new Date(`2000-01-01T${b}`)
    return timeA < timeB ? a : b
  })
}

const findLatestTime = (times) => {
  if (!times.length) return '--:--'
  return times.reduce((a, b) => {
    const timeA = new Date(`2000-01-01T${a}`)
    const timeB = new Date(`2000-01-01T${b}`)
    return timeA > timeB ? a : b
  })
}

const shiftData = computed(() => {
  return workshifts.value.map((shift, index) => {
    if (!shift.shiftDetails || shift.shiftDetails.length === 0) {
      return {
        stt: index + 1,
        code: shift.id,
        name: shift.shiftName,
        in: '--:--',
        out: '--:--',
        shiftName: shift.shiftName,
        id: shift.id
      }
    }
    
    const startTimes = shift.shiftDetails.map(d => d.StartTime || d.startTime)
    const endTimes = shift.shiftDetails.map(d => d.EndTime || d.endTime)
    
    const validStartTimes = startTimes.filter(time => time !== '00:00:00')
    const validEndTimes = endTimes.filter(time => time !== '00:00:00')
    
    return {
      stt: index + 1,
      code: shift.id,
      name: shift.shiftName,
      in: findEarliestTime(validStartTimes),
      out: findLatestTime(validEndTimes),
      shiftName: shift.shiftName,
      id: shift.id
    }
  })
})

// Filter variables for shifts
const shiftSearchQuery = ref('')

const filteredShiftData = computed(() => {
  let result = [...shiftData.value]

  if (shiftSearchQuery.value) {
    const query = shiftSearchQuery.value.toLowerCase()
    result = result.filter(shift =>
      shift.code?.toString().includes(query) ||
      shift.name?.toLowerCase().includes(query) ||
      shift.shiftName?.toLowerCase().includes(query)
    )
  }

  return result
})

const resetShiftFilters = () => {
  shiftSearchQuery.value = ''
  shiftCurrentPage.value = 1
}

const paginatedShiftData = computed(() => {
  const start = (shiftCurrentPage.value - 1) * shiftItemsPerPage.value
  return filteredShiftData.value.slice(start, start + shiftItemsPerPage.value)
})

// Phân trang máy chấm công
const machineCurrentPage = ref(1)
const machineItemsPerPage = ref(5)
const machineColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'id', label: 'Mã máy chấm công' },
  { key: 'attendanceMachineName', label: 'Tên máy chấm công' },
  { key: 'longitude', label: 'Tọa độ X' },
  { key: 'latitude', label: 'Tọa độ Y' },
  { key: 'allowedRadius', label: 'Bán kính cho phép (m)' },
]
const machineData = computed(() => {
  return attendanceMachines.value.map((machine, index) => ({
    ...machine,
    stt: index + 1,
  }))
})

// Filter variables for machines
const machineSearchQuery = ref('')

const filteredMachineData = computed(() => {
  let result = [...machineData.value]

  if (machineSearchQuery.value) {
    const query = machineSearchQuery.value.toLowerCase()
    result = result.filter(machine =>
      machine.id?.toString().includes(query) ||
      machine.attendanceMachineName?.toLowerCase().includes(query) ||
      machine.longitude?.toString().includes(query) ||
      machine.latitude?.toString().includes(query)
    )
  }

  return result
})

const resetMachineFilters = () => {
  machineSearchQuery.value = ''
  machineCurrentPage.value = 1
}

const paginatedMachineData = computed(() => {
  const start = (machineCurrentPage.value - 1) * machineItemsPerPage.value
  return filteredMachineData.value.slice(start, start + machineItemsPerPage.value)
})

const applyHeaderStyle = (row) => {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
}

const applyDataStyle = (cell) => {
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
}

const autoFitColumns = (worksheet) => {
  worksheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, val.length)
    })
    column.width = maxLength + 2
  })
}

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('WorkShift')

  worksheet.columns = shiftColumns.map(c => ({ header: c.label, key: c.key, width: 15 }))
  
  shiftData.value.forEach(row => {
    worksheet.addRow(row)
  })

  applyHeaderStyle(worksheet.getRow(1))
  
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber !== 1) {
      row.eachCell(applyDataStyle)
    }
  })

  autoFitColumns(worksheet)

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'WorkShift.xlsx')
}

const exportToExcelAttendanceMachine = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('AttendanceMachine')

  worksheet.columns = machineColumns.map(c => ({ header: c.label, key: c.key, width: 15 }))
  
  machineData.value.forEach(row => {
    worksheet.addRow(row)
  })

  applyHeaderStyle(worksheet.getRow(1))
  
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber !== 1) {
      row.eachCell(applyDataStyle)
    }
  })

  autoFitColumns(worksheet)

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'AttendanceMachine.xlsx')
}

// IMPORT EXCEL
const file = ref(null);

const handleFileUpload = (event) => {
  const target = event.target;
  if (target && target.files) {
    file.value = target.files[0];
  }
};

const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();

  // --- Sheet 1: Dữ liệu ---
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập');
  const headers = [
    { header: 'Tên máy chấm công', key: 'attendanceMachineName', width: 30 },
    { header: 'Kinh độ (Longitude)', key: 'longitude', width: 20 },
    { header: 'Vĩ độ (Latitude)', key: 'latitude', width: 20 },
    { header: 'Bán kính cho phép (m)', key: 'allowedRadius', width: 25 },
  ];
  dataSheet.columns = headers;

  // Style header
  dataSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Add example row
  dataSheet.addRow({
    attendanceMachineName: 'Máy chấm công Vinhome',
    longitude: '106.722153',
    latitude: '10.790434',
    allowedRadius: 50
  });

  // --- Sheet 2: Hướng dẫn ---
  const instructionSheet = workbook.addWorksheet('Hướng dẫn');
  instructionSheet.columns = [
    { header: 'Tên cột', key: 'column', width: 30 },
    { header: 'Mô tả', key: 'description', width: 50 },
    { header: 'Bắt buộc', key: 'required', width: 15 },
    { header: 'Ví dụ', key: 'example', width: 30 },
  ];

  // Style header for instruction sheet
  instructionSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
  });

  // Add instruction data
  instructionSheet.addRows([
    { column: 'Tên máy chấm công', description: 'Tên để nhận dạng máy chấm công.', required: 'Có', example: 'Máy chấm công cổng chính' },
    { column: 'Kinh độ (Longitude)', description: 'Tọa độ kinh độ của máy chấm công. Là một số thập phân.', required: 'Có', example: '106.722153' },
    { column: 'Vĩ độ (Latitude)', description: 'Tọa độ vĩ độ của máy chấm công. Là một số thập phân.', required: 'Có', example: '10.790434' },
    { column: 'Bán kính cho phép (m)', description: 'Bán kính (tính bằng mét) cho phép chấm công xung quanh vị trí đã đặt. Là một số nguyên dương.', required: 'Có', example: '50' },
  ]);

  // Auto-fit columns for instruction sheet
  instructionSheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, val.length);
    });
    column.width = Math.max(column.width, maxLength + 2);
  });

  // Generate and download file
  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf]), 'Mau_Nhap_May_Cham_Cong.xlsx');
};

const processImport = () => {
  if (!file.value) {
    showMessage('Vui lòng chọn một file Excel.', 'warning');
    return;
  }

  const reader = new FileReader()
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

      const machinesToCreate = jsonData.map(row => ({
        attendanceMachineName: row['Tên máy chấm công'],
        longitude: String(row['Kinh độ (Longitude)'] || ''),
        latitude: String(row['Vĩ độ (Latitude)'] || ''),
        allowedRadius: String(row['Bán kính cho phép (m)'] || '0'),
      })).filter(machine => machine.attendanceMachineName);

      if (machinesToCreate.length === 0) {
        showMessage('Không tìm thấy dữ liệu hợp lệ trong file.', 'error');
        return;
      }

      await createMultipleAttendanceMachines(machinesToCreate);

      file.value = null;
      showImportModal.value = false;
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error);
      showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error')
    }
  }
  reader.readAsArrayBuffer(file.value)
}

const handleUpdateAttendanceMachineClick = async (item) => {
  selectedItem.value = { ...item }
  showUpdateFormAttendanceMachine.value = true
}

const handleUpdateMachine = async (formData) => {
  if (!selectedItem.value) return
  // Form đã tự thêm ID vào formData, không cần thêm lại
  await updateAttendanceMachine(selectedItem.value.id || selectedItem.value.ID, formData)
  showUpdateFormAttendanceMachine.value = false
  selectedItem.value = null
}

const handleDeleteClick = async (item) => {
  if (confirm(`Bạn có chắc chắn muốn xóa máy chấm công "${item.attendanceMachineName}" không?`)) {
    await deleteAttendanceMachine(item.id)
  }
}

// Tour Guide Steps
const shiftTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý ca làm việc. Tại đây bạn có thể xem, tạo, và quản lý các ca làm việc của nhân viên.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa "Ca làm việc" và "Máy chấm công". Hiện tại bạn đang ở tab "Ca làm việc".'
  },
  {
    target: '[data-tour="toolbar-shift"]',
    message: 'Đây là thanh công cụ với các chức năng chính cho ca làm việc. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form-shift"]',
    message: 'Đây là form tạo ca làm việc mới. Bạn có thể nhập tên ca, mã ca, và các chi tiết ca làm việc như giờ vào, giờ ra cho từng ngày trong tuần. Sau khi điền đầy đủ thông tin, bấm "Lưu" để tạo ca làm việc.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar-shift"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar-shift"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc ca làm việc theo mã ca hoặc tên ca.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar-shift"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter-shift"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo mã ca, tên ca. Sau đó bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar-shift"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách ca làm việc ra file Excel để lưu trữ hoặc xử lý thêm. Khi bấm vào đây, file Excel sẽ được tải xuống tự động.'
  },
  {
    target: '[data-tour="toolbar-shift"]',
    message: 'Nút "Hướng dẫn" (nút này) sẽ mở lại tour hướng dẫn để bạn xem lại các tính năng của trang này bất cứ lúc nào.'
  },
  {
    target: '[data-tour="table-shift"]',
    message: 'Đây là bảng danh sách ca làm việc. Bạn có thể xem thông tin chi tiết về các ca làm việc như STT, mã ca, tên ca, giờ vào, giờ ra. Bạn có thể bấm vào các nút thao tác để sửa hoặc xóa ca làm việc.'
  },
  {
    target: '[data-tour="actions-shift"]',
    message: 'Cột "Thao tác" chứa các nút để bạn thực hiện các hành động như: Sửa ca làm việc hoặc Xóa ca làm việc.'
  },
  {
    target: '[data-tour="pagination-shift"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều ca làm việc hơn. Bạn có thể thấy số lượng ca làm việc hiện tại và tổng số ca làm việc. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Ca làm việc"!'
  }
]

const machineTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý máy chấm công. Tại đây bạn có thể xem, tạo, và quản lý các máy chấm công của hệ thống.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa "Ca làm việc" và "Máy chấm công". Hiện tại bạn đang ở tab "Máy chấm công".'
  },
  {
    target: '[data-tour="toolbar-machine"]',
    message: 'Đây là thanh công cụ với các chức năng chính cho máy chấm công. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form-machine"]',
    message: 'Đây là form tạo máy chấm công mới. Bạn có thể nhập tên máy chấm công, tọa độ (kinh độ, vĩ độ), và bán kính cho phép (tính bằng mét). Sau khi điền đầy đủ thông tin, bấm "Lưu" để tạo máy chấm công.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar-machine"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar-machine"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc máy chấm công theo mã máy, tên máy hoặc tọa độ.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar-machine"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter-machine"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo mã máy, tên máy, tọa độ. Sau đó bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar-machine"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách máy chấm công ra file Excel để lưu trữ hoặc xử lý thêm. Khi bấm vào đây, file Excel sẽ được tải xuống tự động.'
  },
  {
    target: '[data-tour="import-modal-machine"]',
    message: 'Đây là modal nhập Excel. Bạn có thể tải file mẫu, điền thông tin máy chấm công vào file Excel, sau đó bấm "Xử lý" để import các máy chấm công vào hệ thống.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar-machine"] button:nth-child(4)'
    }
  },
  {
    target: '[data-tour="toolbar-machine"]',
    message: 'Nút "Hướng dẫn" (nút này) sẽ mở lại tour hướng dẫn để bạn xem lại các tính năng của trang này bất cứ lúc nào.'
  },
  {
    target: '[data-tour="table-machine"]',
    message: 'Đây là bảng danh sách máy chấm công. Bạn có thể xem thông tin chi tiết về các máy chấm công như STT, mã máy, tên máy, tọa độ X, tọa độ Y, và bán kính cho phép. Bạn có thể bấm vào các nút thao tác để sửa hoặc xóa máy chấm công.'
  },
  {
    target: '[data-tour="actions-machine"]',
    message: 'Cột "Thao tác" chứa các nút để bạn thực hiện các hành động như: Sửa máy chấm công hoặc Xóa máy chấm công.'
  },
  {
    target: '[data-tour="pagination-machine"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều máy chấm công hơn. Bạn có thể thấy số lượng máy chấm công hiện tại và tổng số máy chấm công. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Máy chấm công"!'
  }
]

const tourSteps = computed(() => {
  return activeTab.value === 'shift' ? shiftTourSteps : machineTourSteps
})

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  // Mở filter section nếu chưa mở để có thể highlight
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
  <div class="container-fluid py-4" data-tour="title">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="shift-tabs-bar" data-tour="tabs">
        <button v-for="tab in tabs" :key="tab.key" class="tab-bar-item" :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>
      <div class="d-flex gap-2" v-if="activeTab === 'shift'" data-tour="toolbar-shift">

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
        <ActionButton 
          type="secondary" 
          icon="fas fa-question-circle me-2" 
          @click="startTour"
          title="Hướng dẫn sử dụng"
        >
          Hướng dẫn
        </ActionButton>
      </div>
      <div class="d-flex gap-2" v-else-if="activeTab === 'machine'" data-tour="toolbar-machine">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateFormAttendanceMachine = true">
          Thêm
        </ActionButton>
        <!-- Icon bộ lọc -->
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcelAttendanceMachine">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
        <ActionButton 
          type="secondary" 
          icon="fas fa-question-circle me-2" 
          @click="startTour"
          title="Hướng dẫn sử dụng"
        >
          Hướng dẫn
        </ActionButton>
      </div>
    </div>
    
    <!-- Filter Section for Shifts -->
    <transition name="slide-fade" v-if="activeTab === 'shift'">
      <div class="filter-section mb-4" v-show="showFilter" data-tour="filter-shift">
        <div class="row g-3">
          <div class="col-md-10">
            <input
              type="text"
              class="form-control"
              v-model="shiftSearchQuery"
              placeholder="Tìm kiếm theo mã ca, tên ca..."
            >
          </div>
          <div class="col-md-2">
            <button class="btn btn-secondary w-100" @click="resetShiftFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Filter Section for Machines -->
    <transition name="slide-fade" v-if="activeTab === 'machine'">
      <div class="filter-section mb-4" v-show="showFilter" data-tour="filter-machine">
        <div class="row g-3">
          <div class="col-md-10">
            <input
              type="text"
              class="form-control"
              v-model="machineSearchQuery"
              placeholder="Tìm kiếm theo mã máy, tên máy, tọa độ..."
            >
          </div>
          <div class="col-md-2">
            <button class="btn btn-secondary w-100" @click="resetMachineFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <div v-if="activeTab === 'shift'">
      <DataTable :columns="shiftColumns" :data="paginatedShiftData" data-tour="table-shift">
        <template #code="{ item }">
          <span class="emp-count">
            CA-{{ item.code < 10 ? '0' + item.code : item.code }} </span>
        </template>
        <template #actions="{ item }">
          <div class="d-flex justify-content-start gap-2" data-tour="actions-shift">
            <ActionButton type="success" icon="fas fa-edit" tooltip="Cập nhật" @click.stop="openUpdateForm(item.code)" />
            <ActionButton type="danger" icon="fas fa-trash" tooltip="Xóa" @click.stop="handleDeleteWorkShift(item)" />
          </div>
        </template>
      </DataTable>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted">
          Hiển thị {{ paginatedShiftData.length }} trên {{ filteredShiftData.length }} ca làm việc
        </div>
        <Pagination :totalItems="filteredShiftData.length" :itemsPerPage="shiftItemsPerPage" :currentPage="shiftCurrentPage"
          @update:currentPage="shiftCurrentPage = $event" data-tour="pagination-shift" />
      </div>
    </div>
    <div v-else-if="activeTab === 'machine'">
      <DataTable :columns="machineColumns" :data="paginatedMachineData" data-tour="table-machine">
        <template #id="{ item }">
          <span class="emp-count">
            MCC-{{ item.id < 10 ? '0' + item.id : item.id }} </span>
        </template>
        <template #actions="{ item }">
          <div class="d-flex gap-2" data-tour="actions-machine">
            <ActionButton type="success" icon="fas fa-edit" tooltip="Cập nhật" @click.stop="handleUpdateAttendanceMachineClick(item)" />
            <ActionButton type="danger" icon="fas fa-trash" tooltip="Xóa" @click.stop="handleDeleteClick(item)" />
          </div>
        </template>
      </DataTable>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted">
          Hiển thị {{ paginatedMachineData.length }} trên {{ filteredMachineData.length }} máy chấm công
        </div>
        <Pagination :totalItems="filteredMachineData.length" :itemsPerPage="machineItemsPerPage" :currentPage="machineCurrentPage"
          @update:currentPage="machineCurrentPage = $event" data-tour="pagination-machine" />
      </div>
    </div>
    <ModalDialog v-model:show="showCreateForm" title="Tạo ca làm" size="xl" data-tour="create-form-shift">
  <WorkShiftForm mode="create" @close="showCreateForm = false" @submit="handleCreateWorkShift" />
    </ModalDialog>
    <ModalDialog v-model:show="showCreateFormAttendanceMachine" title="Thêm máy chấm công" size="lg" data-tour="create-form-machine">
      <AttendanceMachineForm mode="create" @submit="handleCreateMachine" @close="showCreateFormAttendanceMachine = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showUpdateForm" title="Cập nhật ca làm" size="xl">
      <WorkShiftForm mode="update" :workshift="selectedItem" @close="showUpdateForm = false" @submit="handleUpdateWorkShift" />
    </ModalDialog>
    <ModalDialog v-model:show="showUpdateFormAttendanceMachine" title="Cập nhật máy chấm công" size="lg">
      <AttendanceMachineForm  :key="selectedItem?.id" mode="update" :attendancemachine="selectedItem" @submit="handleUpdateMachine" @close="showUpdateFormAttendanceMachine = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showImportModal" title="Nhập máy chấm công từ Excel" size="lg" data-tour="import-modal-machine">
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
            <i class="fas fa-upload me-2"></i>
            Xử lý
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
  </div>
</template>

<style scoped>
.shift-tabs-bar {
  display: flex;
  gap: 8px;
}

.tab-bar-item {
  padding: 8px 24px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  background: #f5f7fa;
  cursor: pointer;
  border: none;
  transition: background 0.18s, color 0.18s;
}

.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
}

.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  vertical-align: middle;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e9ecef;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #fff;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.switch input:checked+.slider {
  background-color: #28a745;
}

.switch input:checked+.slider:before {
  transform: translateX(20px);
}

.machine-status.active {
  color: #28a745;
  font-weight: 600;
}

.machine-status.inactive {
  color: #ff6b6b;
  font-weight: 600;
}

.table-action-btn {
  background: none;
  border: none;
  color: #0d6efd;
  font-size: 1.15rem;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.table-action-btn.delete {
  color: #ff6b6b;
}

.table-action-btn:hover {
  background: #e9ecef;
}

.emp-count {
  font-weight: 600;
  color: #0d6efd;
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
</style>