<!-- filepath: c:\Users\nguye\OneDrive\Desktop\ConstructionManagement\vue-app\src\views\human_resources\ShiftSetupView.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useWorkShift } from '../../composables/useWorkShift'
import { useAttendanceMachine } from '../../composables/useAttendanceMachine'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import DeleteButton from '@/components/common/DeleteButton.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import WorkShiftForm from '@/components/common/workshift/WorkShiftForm.vue'
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import AttendanceMachineForm from '@/components/common/workshift/AttendanceMachineForm.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const {
  workshifts,
  fetchWorkShifts,
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
const { showMessage } = useGlobalMessage()
onMounted(async () => {
  await fetchWorkShifts()
  await fetchAttendanceMachines()
})
const activeTab = ref('shift')

const tabs = [
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'machine', label: 'Máy chấm công' }
]

const handleCreateWorkShift = () => {
  showCreateForm.value = false
  fetchWorkShifts() // Refresh the list after creating
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
const shiftData = computed(() => {
  return workshifts.value.map((shift, index) => {
    // Lấy mảng giờ vào và giờ ra
    const startTimes = shift.shiftDetails.map(d => d.startTime)
    const endTimes = shift.shiftDetails.map(d => d.endTime)

    // Tìm giờ vào sớm nhất (min) và giờ ra trễ nhất (max)
    const earliestStart = startTimes.reduce((a, b) => a < b ? a : b)
    const latestEnd = endTimes.reduce((a, b) => a > b ? a : b)

    return {
      stt: index + 1,
      code: shift.id,
      name: shift.shiftName,
      in: earliestStart, // giờ vào sớm nhất
      out: latestEnd    // giờ ra trễ nhất
    }
  })
})

function toggleShiftActive(item) {
  item.active = !item.active
}
const paginatedShiftData = computed(() => {
  const start = (shiftCurrentPage.value - 1) * shiftItemsPerPage.value
  return shiftData.value.slice(start, start + shiftItemsPerPage.value)
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
const paginatedMachineData = computed(() => {
  const start = (machineCurrentPage.value - 1) * machineItemsPerPage.value
  return machineData.value.slice(start, start + machineItemsPerPage.value)
})

const exportToExcel = async (type) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('WorkShift');

  // Thêm header
  worksheet.columns = shiftColumns.map(c => ({ header: c.label, key: c.key, width: 15 }));

  // Thêm dữ liệu
  shiftData.value.forEach((row, index) => {
    worksheet.addRow(row);
  });

  // Style header
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Style dữ liệu
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell(cell => {
      if (rowNumber !== 1) { // skip header
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  // 👉 Auto-fit chiều ngang cho từng cột
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, val.length);
    });
    column.width = maxLength + 2; // padding để text không sát
  });

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf]), 'WorkShift.xlsx');
};

const exportToExcelAttendanceMachine = async (type) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('AttendanceMachine');

  // Thêm header
  worksheet.columns = machineColumns.map(c => ({ header: c.label, key: c.key, width: 15 }));

  // Thêm dữ liệu
  machineData.value.forEach((row, index) => {
    worksheet.addRow(row);
  });

  // Style header
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Style dữ liệu
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell(cell => {
      if (rowNumber !== 1) { // skip header
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  // 👉 Auto-fit chiều ngang cho từng cột
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, val.length);
    });
    column.width = maxLength + 2; // padding để text không sát
  });

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf]), 'AttendanceMachine.xlsx');
};

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
      showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error');
    }
  };
  reader.readAsArrayBuffer(file.value);
};
const handleUpdateAttendanceMachineClick = async (item) => {
  selectedItem.value = { ...item }
  showUpdateFormAttendanceMachine.value = true
}

const handleUpdateMachine = async (formData) => {
  if (!selectedItem.value) return
  const dataToUpdate = {
    ...formData,
    id: selectedItem.value.id
  }
  await updateAttendanceMachine(selectedItem.value.id, dataToUpdate)
  showUpdateFormAttendanceMachine.value = false
  selectedItem.value = null
}

const handleDeleteClick = async (item) => {
  if (confirm(`Bạn có chắc chắn muốn xóa máy chấm công "${item.attendanceMachineName}" không?`)) {
    await deleteAttendanceMachine(item.id)
  }
}

const handleUpdateSubmit = async (formData) => {
  try {
    const itemId = selectedItem.value.id
    console.log('🔄 Updating report:', itemId)
    console.log('📦 Form data contents:')
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File(${value.name})` : value}`)
    }

    await updateReport(reportId, formData)
    showUpdateForm.value = false
    selectedItem.value = null
    reportFormData.value = {}
    showMessage('Cập nhật báo cáo thành công', 'success')
    await fetchReportsByKiThuat()
  } catch (err) {
    console.error('Error updating report:', err)
    showMessage(err.message || 'Có lỗi xảy ra khi cập nhật báo cáo', 'error')
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="shift-tabs-bar">
        <button v-for="tab in tabs" :key="tab.key" class="tab-bar-item" :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>
      <div class="d-flex gap-2" v-if="activeTab === 'shift'">

        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateForm = true">
          Thêm
        </ActionButton>
        <!-- Icon bộ lọc -->
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel('shift')">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
      </div>
      <div class="d-flex gap-2" v-else-if="activeTab === 'machine'">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateFormAttendanceMachine = true">
          Thêm
        </ActionButton>
        <!-- Icon bộ lọc -->
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcelAttendanceMachine('machine')">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
      </div>
    </div>
    <div v-if="activeTab === 'shift'">
      <DataTable :columns="shiftColumns" :data="paginatedShiftData">
        <template #code="{ item }">
          <span class="emp-count">
            CA-{{ item.code < 10 ? '0' + item.code : item.code }} </span>
        </template>
        <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="openUpdateForm(item.id)" />
          <ChangeStatusButton @click.stop="openStatusDialog(item)" />
        </div>
      </template>
      </DataTable>
      <Pagination :totalItems="shiftData.length" :itemsPerPage="shiftItemsPerPage" :currentPage="shiftCurrentPage"
        @update:currentPage="shiftCurrentPage = $event" />
    </div>
    <div v-else-if="activeTab === 'machine'">
      <DataTable :columns="machineColumns" :data="paginatedMachineData">
        <template #id="{ item }">
          <span class="emp-count">
            MCC-{{ item.id < 10 ? '0' + item.id : item.id }} </span>
        </template>
        <template #actions="{ item }">
          <div class="d-flex gap-2">
            <UpdateButton @click.stop="handleUpdateAttendanceMachineClick(item)" />
            <DeleteButton @click.stop="handleDeleteClick(item)" />
          </div>
        </template>
      </DataTable>
      <Pagination :totalItems="machineData.length" :itemsPerPage="machineItemsPerPage" :currentPage="machineCurrentPage"
        @update:currentPage="machineCurrentPage = $event" />
    </div>
    <ModalDialog v-model:show="showCreateForm" title="Tạo ca làm" size="xl">
      <WorkShiftForm mode="create" @close="handleCreateWorkShift" />
    </ModalDialog>
    <ModalDialog v-model:show="showCreateFormAttendanceMachine" title="Thêm máy chấm công" size="lg">
      <AttendanceMachineForm mode="create" @submit="handleCreateMachine" @close="showCreateFormAttendanceMachine = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showUpdateForm" title="Cập nhật ca làm" size="xl">
      <WorkShiftForm mode="update" :workshift="selectedItem" @close="showUpdateForm = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showUpdateFormAttendanceMachine" title="Cập nhật máy chấm công" size="lg">
      <AttendanceMachineForm  :key="selectedItem?.id" mode="update" :attendancemachine="selectedItem" @submit="handleUpdateMachine" @close="showUpdateFormAttendanceMachine = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showImportModal" title="Nhập máy chấm công từ Excel" size="lg">
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
</style>