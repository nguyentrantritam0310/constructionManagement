<script setup>
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
import DataTable from '../../components/common/DataTable.vue'

const showEmployeeModal = ref(false)
const showDayModal = ref(false)
const selectedEmployee = ref(null)
const selectedDateIdx = ref(null)

function openEmployeeModal(emp) {
  selectedEmployee.value = emp
  showEmployeeModal.value = true
}
function closeEmployeeModal() {
  showEmployeeModal.value = false
}
function openDayModal(emp, dayIdx) {
  selectedEmployee.value = emp
  selectedDateIdx.value = dayIdx
  showDayModal.value = true
}
function closeDayModal() {
  showDayModal.value = false
}
// Cấu hình cột cho DataTable
const attendanceColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'avatar', label: 'Ảnh' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'refCode', label: 'Mã phiếu tham chiếu' },
  { key: 'date', label: 'Ngày đi làm' },
  { key: 'scanTime', label: 'Giờ quét' },
  { key: 'type', label: 'Loại công' },
  { key: 'location', label: 'Vị trí' }
]
const workColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'standard', label: 'Công chuẩn' },
  { key: 'scanInOut', label: 'Quét vào/ra' },
  { key: 'lateEarly', label: 'Đi trễ/Về sớm' },
  { key: 'forgetInOut', label: 'Quên IN/OUT' },
  { key: 'workHour', label: 'Giờ/ngày công' }
]
const deleteColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'deletedBy', label: 'Nhân viên xóa' },
  { key: 'deleteDate', label: 'Ngày xóa' }
]
const deleteWorkColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'avatar', label: 'Ảnh' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'refCode', label: 'Mã phiếu tham chiếu' },
  { key: 'date', label: 'Ngày đi làm' },
  { key: 'scanTime', label: 'Giờ quét' },
  { key: 'type', label: 'Loại công' },
  { key: 'location', label: 'Vị trí' }
]

// Dummy data cho modal (dữ liệu mẫu)
const attendanceHistory = ref([
  {
    stt: 1,
    avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
    shiftName: 'Ca hành chính Hà Nội (08:30-17:30)',
    refCode: 'MP001',
    date: '09/07/2025',
    scanTime: '08:30',
    type: 'DILAM',
    location: 'Máy quét: Importfile'
  },
  {
    stt: 2,
    avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
    shiftName: 'Ca hành chính Hà Nội (08:30-17:30)',
    refCode: 'MP002',
    date: '09/07/2025',
    scanTime: '17:30',
    type: 'DILAM',
    location: 'Máy quét: Importfile'
  }
])

const workHistory = ref([
  {
    stt: 1,
    shiftName: 'Ca hành chính HN làm việc HB (08:00-17:00)',
    standard: '8.00/1.00',
    scanInOut: 'Vào: 08:00, Ra: 17:00',
    lateEarly: 'Đi trễ: 0 phút, Về sớm: 0 phút',
    forgetInOut: '0 (Chưa xác nhận)',
    workHour: '0.00/0.00',
  },
  {
    stt: 2,
    shiftName: 'Ca hành chính Hà Nội (08:30-17:30)',
    standard: '8.00/1.00',
    scanInOut: 'Vào: 08:30, Ra: 17:30',
    lateEarly: 'Đi trễ: 0 phút, Về sớm: 0 phút',
    forgetInOut: '0 (Đã xác nhận)',
    workHour: '8.00/1.00',
  }
])

const deleteHistory = ref([
  {
    stt: 1,
    shiftName: 'Ca hành chính Hà Nội (08:30-17:30)',
    deletedBy: 'Nguyễn Văn A',
    deleteDate: '10/07/2025'
  }
])

const deleteWorkHistory = ref([
  {
    stt: 1,
    avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
    shiftName: 'Ca hành chính Hà Nội (08:30-17:30)',
    refCode: 'MP003',
    date: '10/07/2025',
    scanTime: '08:30',
    type: 'DILAM',
    location: 'Máy quét: Importfile'
  }
])
import { ref, computed, onMounted, watch } from 'vue'
import TabBar from '../../components/common/TabBar.vue'
import TimeFilter from '../../components/common/TimeFilter.vue'
import { attendanceDataService } from '../../services/attendanceDataService'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useEmployee } from '../../composables/useEmployee'
import { useAttendance } from '../../composables/useAttendance'
import { useWorkShift } from '../../composables/useWorkShift'

const { showMessage } = useGlobalMessage()

// Initialize composables
const { employees: allEmployees, fetchAllEmployees } = useEmployee()
const { attendanceList, fetchAttendance } = useAttendance()
const { workshifts, fetchWorkShifts } = useWorkShift()

// Components
const components = {
  TimeFilter
}

const activeTab = ref('summary')
const showMoreTabs = ref(false) // Control visibility of the "More" dropdown

const tabs = [
  { key: 'summary', label: 'Bảng tổng hợp công', icon: 'fas fa-table' },
  { key: 'overtime', label: 'Bảng công tăng ca', icon: 'fas fa-business-time' },
  { key: 'detail', label: 'Bảng công chi tiết', icon: 'fas fa-list-alt' },
  { key: 'attendance', label: 'Dữ liệu chấm công', icon: 'fas fa-fingerprint' },
  { key: 'closeHistory', label: 'Lịch sử chốt công', icon: 'fas fa-history' },
  { key: 'feedbackHistory', label: 'Lịch sử phản ánh', icon: 'fas fa-comment-dots' }
]

// Time filter controls for all tabs
const currentMonth = ref(new Date())
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const selectedWeek = ref('')
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

// Limit the number of visible tabs
const visibleTabsCount = 6
const visibleTabs = computed(() => tabs.slice(0, visibleTabsCount))
const hiddenTabs = computed(() => tabs.slice(visibleTabsCount))

const selectTab = (tabKey) => {
  activeTab.value = tabKey
  showMoreTabs.value = false // Close the "More" dropdown when a tab is selected
}

// Danh sách nhân viên và dữ liệu công cho từng ngày trong tháng
const employees = [
  {
    id: 'NV0001',
    name: 'Vũ Thị Hợp',
    position: 'Tổng giám đốc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 1, totalPaidLeave: 1, totalPresent: 20, totalCompensatoryOt: 4, totalPaidOt: 8, businessTrip: 2, totalWorkDays: 21, lateCount: 2, earlyLeaveCount: 1, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0002',
    name: 'Trần Nha Trang',
    position: 'Phó Tổng Giám đốc phụ trách Kinh doanh',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 0, totalPresent: 22, totalCompensatoryOt: 2, totalPaidOt: 5, businessTrip: 0, totalWorkDays: 22, lateCount: 0, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0224',
    name: 'Nguyễn Thạc Hùng',
    position: 'Giám đốc Ban Đầu tư',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 2, totalPaidLeave: 0, totalPresent: 20, totalCompensatoryOt: 0, totalPaidOt: 10, businessTrip: 3, totalWorkDays: 20, lateCount: 5, earlyLeaveCount: 2, unexplainedAbsence: 1 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
    {
    id: 'NV0001',
    name: 'Vũ Thị Hợp',
    position: 'Tổng giám đốc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 1, totalPaidLeave: 1, totalPresent: 20, totalCompensatoryOt: 4, totalPaidOt: 8, businessTrip: 2, totalWorkDays: 21, lateCount: 2, earlyLeaveCount: 1, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0002',
    name: 'Trần Nha Trang',
    position: 'Phó Tổng Giám đốc phụ trách Kinh doanh',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 0, totalPresent: 22, totalCompensatoryOt: 2, totalPaidOt: 5, businessTrip: 0, totalWorkDays: 22, lateCount: 0, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0224',
    name: 'Nguyễn Thạc Hùng',
    position: 'Giám đốc Ban Đầu tư',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 2, totalPaidLeave: 0, totalPresent: 20, totalCompensatoryOt: 0, totalPaidOt: 10, businessTrip: 3, totalWorkDays: 20, lateCount: 5, earlyLeaveCount: 2, unexplainedAbsence: 1 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
   {
    id: 'NV0001',
    name: 'Vũ Thị Hợp',
    position: 'Tổng giám đốc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 1, totalPaidLeave: 1, totalPresent: 20, totalCompensatoryOt: 4, totalPaidOt: 8, businessTrip: 2, totalWorkDays: 21, lateCount: 2, earlyLeaveCount: 1, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0002',
    name: 'Trần Nha Trang',
    position: 'Phó Tổng Giám đốc phụ trách Kinh doanh',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 0, totalPresent: 22, totalCompensatoryOt: 2, totalPaidOt: 5, businessTrip: 0, totalWorkDays: 22, lateCount: 0, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0224',
    name: 'Nguyễn Thạc Hùng',
    position: 'Giám đốc Ban Đầu tư',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 2, totalPaidLeave: 0, totalPresent: 20, totalCompensatoryOt: 0, totalPaidOt: 10, businessTrip: 3, totalWorkDays: 20, lateCount: 5, earlyLeaveCount: 2, unexplainedAbsence: 1 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
    {
    id: 'NV0001',
    name: 'Vũ Thị Hợp',
    position: 'Tổng giám đốc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 1, totalPaidLeave: 1, totalPresent: 20, totalCompensatoryOt: 4, totalPaidOt: 8, businessTrip: 2, totalWorkDays: 21, lateCount: 2, earlyLeaveCount: 1, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0002',
    name: 'Trần Nha Trang',
    position: 'Phó Tổng Giám đốc phụ trách Kinh doanh',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 0, totalPresent: 22, totalCompensatoryOt: 2, totalPaidOt: 5, businessTrip: 0, totalWorkDays: 22, lateCount: 0, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0224',
    name: 'Nguyễn Thạc Hùng',
    position: 'Giám đốc Ban Đầu tư',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 2, totalPaidLeave: 0, totalPresent: 20, totalCompensatoryOt: 0, totalPaidOt: 10, businessTrip: 3, totalWorkDays: 20, lateCount: 5, earlyLeaveCount: 2, unexplainedAbsence: 1 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 2, totalPresent: 20, totalCompensatoryOt: 8, totalPaidOt: 0, businessTrip: 1, totalWorkDays: 22, lateCount: 1, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  },
  {
    id: 'NV0280',
    name: 'Nguyễn Thiện Đức',
    position: 'Chuyên viên Quản lý thiết kế Kết cấu & Hạ tầng',
    summary: { totalStandardWork: 22, totalUnpaidLeave: 0, totalPaidLeave: 0, totalPresent: 22, totalCompensatoryOt: 0, totalPaidOt: 0, businessTrip: 0, totalWorkDays: 22, lateCount: 0, earlyLeaveCount: 0, unexplainedAbsence: 0 }
  }
]

// Tạo danh sách ngày trong tháng hiện tại
const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1
const daysInMonth = new Date(year, month, 0).getDate()
const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
  const d = new Date(year, month - 1, i + 1)
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
  return `${i + 1}/${month} (${weekday})`
})

// Tạo dữ liệu công cho từng nhân viên, từng ngày trong tháng
function generateAttendanceForEmployee(empIdx) {
  // Quy tắc mẫu: cứ 7 ngày thì 1 ngày nghỉ, 1 ngày remote, còn lại đi làm
  return dayHeaders.map((day, idx) => {
    if (idx % 7 === 5) return { status: 'leave', time: '08:00 17:00' }
    if (idx % 7 === 6) return { status: 'remote', time: '08:30 17:00' }
    return { status: 'work', time: '08:30 17:30' }
  })
}

// Khởi tạo ma trận dữ liệu công sau khi dayHeaders đã có
const attendanceMatrix = employees.map((emp, idx) => generateAttendanceForEmployee(idx))

const getCell = (empIdx, dayIdx) => attendanceMatrix[empIdx][dayIdx];

const getCellClass = (empIdx, dayIdx) => {
  const cell = getCell(empIdx, dayIdx);
  if (!cell) return '';
  return {
    'cell-work': cell.status === 'work',
    'cell-leave': cell.status === 'leave',
    'cell-remote': cell.status === 'remote',
    'cell-late': cell.status === 'late',
    'cell-other': cell.status === 'other'
  };
};

const getCellTitle = (empIdx, dayIdx) => {
  const cell = getCell(empIdx, dayIdx);
  if (!cell) return '';
  if (cell.status === 'work') return 'Đi làm';
  if (cell.status === 'leave') return 'Nghỉ phép';
  if (cell.status === 'remote') return 'Làm việc từ xa';
  return '';
};

const statusColor = {
  work: '#28a745',
  leave: '#ff6b6b',
  remote: '#6c63ff',
  late: '#ffc107',
  other: '#adb5bd'
}

function onDeleteAttendance(item) {
  alert('Xóa chấm công: ' + item.shiftName)
}
function onDeleteWork(item) {
  alert('Xóa lịch làm việc: ' + item.shiftName)
}
function onRestoreDelete(item) {
  alert('Phục hồi ca: ' + item.shiftName)
}
function onRestoreDeleteWork(item) {
  alert('Phục hồi công: ' + item.shiftName)
}

// Cấu hình cột cho bảng công tổng ngoài màn hình chính
const mainSummaryColumns = [
  { key: 'id', label: 'Mã nhân viên', class: 'text-center col-id' },
  { key: 'name', label: 'Tên nhân viên', class: 'text-start col-name' },
  { key: 'detail', label: 'Chi tiết', class: 'text-center col-detail' },
  ...dayHeaders.map((day, idx) => ({ key: `day_${idx}`, label: day, class: 'text-center col-day' }))
];

const mainSummaryData = computed(() => {
  return employees.map((emp, idx) => {
    const dayData = {};
    attendanceMatrix[idx].forEach((d, dIdx) => {
      dayData[`day_${dIdx}`] = d;
    });
    return {
      id: emp.id,
      name: emp.name,
      detail: '',
      _idx: idx,
      ...dayData,
      ...emp
    };
  });
});

// Dummy data cho bảng tăng ca
const overtimeHeaders = dayHeaders;
const overtimeColumns = [
  { key: 'stt', label: 'STT', class: 'text-center col-stt' },
  { key: 'detail', label: 'Chi tiết', class: 'text-center col-detail' },
  { key: 'id', label: 'Mã NV', class: 'text-center col-id' },
  { key: 'name', label: 'Nhân viên', class: 'text-start col-name' },
  ...overtimeHeaders.map((day, idx) => ({ key: `day_${idx}`, label: day, class: 'text-center col-day' }))
];

// Tạo dữ liệu tăng ca mẫu cho từng nhân viên, từng ngày
function generateOvertimeForEmployee(empIdx) {
  // Quy tắc mẫu: ngày chẵn tăng ca nghỉ bù, ngày lẻ tăng ca tính lương, còn lại không tăng ca
  return overtimeHeaders.map((day, idx) => {
    if (idx % 3 === 0) return { type: 'compensatory', hours: 2 };
    if (idx % 3 === 1) return { type: 'paid', hours: 1.5 };
    return { type: '', hours: 0 };
  });
}

const overtimeMatrix = employees.map((emp, idx) => generateOvertimeForEmployee(idx));

const overtimeData = computed(() => {
  return employees.map((emp, idx) => {
    const dayData = {};
    overtimeMatrix[idx].forEach((d, dIdx) => {
      dayData[`day_${dIdx}`] = d;
    });
    return {
      stt: idx + 1,
      detail: '',
      id: emp.id,
      name: emp.name,
      avatar: emp.avatar,
      _idx: idx,
      ...dayData,
      ...emp
    };
  });
});

function getOvertimeCellClass(type) {
  if (type === 'compensatory') return 'cell-overtime-compensatory';
  if (type === 'paid') return 'cell-overtime-paid';
  return '';
}

// Modal chi tiết tăng ca
const showOvertimeModal = ref(false);
const selectedOvertimeEmployee = ref(null);
const selectedOvertimeDayIdx = ref(null);

function openOvertimeModal(emp, dayIdx = null) {
  selectedOvertimeEmployee.value = emp;
  selectedOvertimeDayIdx.value = dayIdx;
  showOvertimeModal.value = true;
}
function closeOvertimeModal() {
  showOvertimeModal.value = false;
}

// Cấu hình cột cho bảng công chi tiết
const detailColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'name', label: 'Tên nhân viên' },
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'date', label: 'Ngày làm' },
  { key: 'checkInTime', label: 'Giờ vào' },
  { key: 'checkOutTime', label: 'Giờ ra' },
  { key: 'type', label: 'Loại công' },
  { key: 'hours', label: 'Số giờ' },
  { key: 'days', label: 'Số ngày' },
  { key: 'late', label: 'Đi trễ (phút)' },
  { key: 'early', label: 'Về sớm (phút)' }
];

// Real detail data from API
const detailData = ref([])
const detailLoading = ref(false)
const detailError = ref(null)

// Work shift data from API
const workShifts = ref([])
const workShiftLoading = ref(false)

// Function to calculate work hours, days, late and early minutes
const calculateWorkDetails = (checkInTime, checkOutTime, shiftName) => {
  if (!checkInTime || !checkOutTime) {
    return { hours: 0, days: 0, late: 0, early: 0 }
  }

  // Find work shift data from API
  const workShift = workShifts.value.find(shift => 
    shift.shiftName.toLowerCase().includes(shiftName.toLowerCase()) ||
    shiftName.toLowerCase().includes(shift.shiftName.toLowerCase())
  )

  if (!workShift || !workShift.shiftDetails || workShift.shiftDetails.length === 0) {
    return { hours: 0, days: 0, late: 0, early: 0 }
  }

  const shiftStartTime = shiftMatch[1] // e.g., "08:30"
  const shiftEndTime = shiftMatch[2]   // e.g., "17:30"

  // Convert time strings to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const checkInMinutes = timeToMinutes(checkInTime)
  const checkOutMinutes = timeToMinutes(checkOutTime)
  const shiftStartMinutes = timeToMinutes(shiftStartTime)
  const shiftEndMinutes = timeToMinutes(shiftEndTime)

  // Calculate total time from check-in to check-out
  const totalMinutes = checkOutMinutes - checkInMinutes

  // Calculate break time (lunch break)
  // Default break time: 12:00-13:00 (60 minutes)
  // This can be customized based on shift type
  let breakStartTime = '12:00'
  let breakEndTime = '13:00'
  
  // Customize break time based on shift type
  if (shiftName.includes('hành chính') || shiftName.includes('08:30')) {
    // Office hours: 12:00-13:00
    breakStartTime = '12:00'
    breakEndTime = '13:00'
  } else if (shiftName.includes('ca đêm') || shiftName.includes('night')) {
    // Night shift: no lunch break or different break time
    breakStartTime = '00:00'
    breakEndTime = '00:00'
  } else if (shiftName.includes('ca sáng') || shiftName.includes('morning')) {
    // Morning shift: 11:30-12:30
    breakStartTime = '11:30'
    breakEndTime = '12:30'
  }
  
  // Check if break time overlaps with work time
  const breakStartMinutes = timeToMinutes(breakStartTime)
  const breakEndMinutes = timeToMinutes(breakEndTime)
  
  // Calculate actual break time that overlaps with work time
  const breakOverlapStart = Math.max(checkInMinutes, breakStartMinutes)
  const breakOverlapEnd = Math.min(checkOutMinutes, breakEndMinutes)
  const actualBreakMinutes = Math.max(0, breakOverlapEnd - breakOverlapStart)

  // Calculate actual work hours (total time minus break time)
  const workMinutes = totalMinutes - actualBreakMinutes
  const workHours = Math.round((workMinutes / 60) * 100) / 100

  // Calculate work days (assuming 8 hours = 1 day)
  const workDays = Math.round((workHours / 8) * 100) / 100

  // Calculate late minutes (if check-in is after shift start)
  const lateMinutes = Math.max(0, checkInMinutes - shiftStartMinutes)

  // Calculate early minutes (if check-out is before shift end)
  const earlyMinutes = Math.max(0, shiftEndMinutes - checkOutMinutes)

  return {
    hours: workHours,
    days: workDays,
    late: lateMinutes,
    early: earlyMinutes
  }
}

// Process detail data to include calculated values
const processedDetailData = computed(() => {
  return detailData.value.map(item => {
    const calculated = calculateWorkDetails(item.checkInTime, item.checkOutTime, item.shift)
    return {
      ...item,
      hours: calculated.hours,
      days: calculated.days,
      late: calculated.late,
      early: calculated.early
    }
  })
})
const attendanceDataColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'avatar', label: 'Ảnh chấm công' },
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'name', label: 'Tên nhân viên' },
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'date', label: 'Ngày làm' },
  { key: 'scanTime', label: 'Giờ quét' },
  { key: 'machine', label: 'Máy chấm công' },
  { key: 'location', label: 'Vị trí' },
  { key: 'type', label: 'Loại công' }
];

// Real attendance data from API
const attendanceData = ref([])
const attendanceLoading = ref(false)
const attendanceError = ref(null)

// Load attendance data from API
const loadAttendanceData = async () => {
  attendanceLoading.value = true
  attendanceError.value = null
  
  try {
    let data
    
    // Check if week filter is selected
    if (selectedWeek.value) {
      data = await attendanceDataService.getAttendanceDataByWeek(selectedWeek.value)
    }
    // Check if date range is selected
    else if (selectedStartDate.value && selectedEndDate.value) {
      data = await attendanceDataService.getAttendanceDataByDateRange(selectedStartDate.value, selectedEndDate.value)
    } else {
      // Default to current month
      data = await attendanceDataService.getAttendanceDataByMonth(selectedYear.value, selectedMonth.value)
    }
    
    // Transform data to match the expected format
    const transformedData = []
    
    data.forEach(item => {
      // Tạo dòng cho giờ vào nếu có
      if (item.checkInTime) {
        transformedData.push({
          stt: item.stt,
          avatar: item.imageCheckIn || 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
          id: item.employeeCode,
          name: item.employeeName,
          shift: item.shiftName,
          date: new Date(item.workDate).toLocaleDateString('vi-VN'),
          scanTime: item.checkInTime.toString().substring(0, 5),
          machine: item.machineName,
          location: item.location,
          type: 'Vào'
        })
      }
      
      // Tạo dòng cho giờ ra nếu có
      if (item.checkOutTime) {
        transformedData.push({
          stt: item.stt,
          avatar: item.imageCheckOut || 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
          id: item.employeeCode,
          name: item.employeeName,
          shift: item.shiftName,
          date: new Date(item.workDate).toLocaleDateString('vi-VN'),
          scanTime: item.checkOutTime.toString().substring(0, 5),
          machine: item.machineName,
          location: item.location,
          type: 'Ra'
        })
      }
    })
    
    attendanceData.value = transformedData
    
    console.log('Attendance data loaded:', attendanceData.value)
  } catch (error) {
    console.error('Error loading attendance data:', error)
    attendanceError.value = error.message || 'Lỗi khi tải dữ liệu chấm công'
  } finally {
    attendanceLoading.value = false
  }
}

// Helper function to get attendance type based on status
const getAttendanceType = (status) => {
  switch (status) {
    case 'Present':
      return 'Đi làm'
    case 'Absent':
      return 'Vắng mặt'
    case 'Late':
      return 'Đi trễ'
    case 'EarlyLeave':
      return 'Về sớm'
    case 'Remote':
      return 'Làm việc từ xa'
    default:
      return 'Chưa xác định'
  }
}
const closeHistoryColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'closeDate', label: 'Ngày chốt công' },
  { key: 'content', label: 'Nội dung chốt' },
  { key: 'createdBy', label: 'Người lập' },
  { key: 'createdDate', label: 'Ngày lập' },
  { key: 'active', label: 'Hiệu lực', class: 'text-center' }
];

const closeHistoryData = ref([
  {
    stt: 1,
    closeDate: '31/08/2025',
    content: 'Chốt công tháng 8/2025',
    createdBy: 'Nguyễn Thạc Hùng',
    createdDate: '01/09/2025',
    active: true
  },
  {
    stt: 2,
    closeDate: '31/07/2025',
    content: 'Chốt công tháng 7/2025',
    createdBy: 'Trần Nha Trang',
    createdDate: '01/08/2025',
    active: false
  }
]);

function toggleCloseActive(item) {
  item.active = !item.active;
  // Có thể thêm logic gọi API cập nhật trạng thái ở đây
}
const feedbackColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'title', label: 'Tiêu đề' },
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'name', label: 'Tên nhân viên' },
  { key: 'time', label: 'Thời gian' },
  { key: 'content', label: 'Nội dung' },
  { key: 'createdBy', label: 'Người lập' },
  { key: 'createdDate', label: 'Ngày lập' },
  { key: 'actions', label: 'Thao tác', class: 'text-center' }
];

const feedbackData = [
  {
    stt: 1,
    title: 'Phản ánh về giờ vào',
    id: 'NV0001',
    name: 'Vũ Thị Hợp',
    time: '08:45 01/09/2025',
    content: 'Giờ vào bị ghi nhận sai do máy lỗi.',
    createdBy: 'Vũ Thị Hợp',
    createdDate: '01/09/2025'
  },
  {
    stt: 2,
    title: 'Phản ánh về ca làm việc',
    id: 'NV0002',
    name: 'Trần Nha Trang',
    time: '17:30 01/09/2025',
    content: 'Ca làm việc chưa cập nhật đúng.',
    createdBy: 'Trần Nha Trang',
    createdDate: '01/09/2025'
  }
];

// Phân trang cho các tab chi tiết
const detailCurrentPage = ref(1)
const detailItemsPerPage = ref(10)
const paginatedDetailData = computed(() => {
  const start = (detailCurrentPage.value - 1) * detailItemsPerPage.value
  return processedDetailData.value.slice(start, start + detailItemsPerPage.value)
})

const attendanceCurrentPage = ref(1)
const attendanceItemsPerPage = ref(10)
const paginatedAttendanceData = computed(() => {
  const start = (attendanceCurrentPage.value - 1) * attendanceItemsPerPage.value
  return attendanceData.value.slice(start, start + attendanceItemsPerPage.value)
})

// Time filter functions
const handleDateRangeChanged = (dateRange) => {
  if (dateRange.startDate && dateRange.endDate) {
    selectedStartDate.value = dateRange.startDate
    selectedEndDate.value = dateRange.endDate
    selectedWeek.value = '' // Clear week filter when using date range
    loadAttendanceData()
    loadDetailData()
  } else if (!dateRange.startDate && !dateRange.endDate) {
    // Clear date range, use month filter
    selectedStartDate.value = ''
    selectedEndDate.value = ''
    loadAttendanceData()
    loadDetailData()
  }
}

const handleWeekChanged = (weekData) => {
  if (weekData.week) {
    selectedWeek.value = weekData.week
    selectedStartDate.value = '' // Clear date range when using week filter
    selectedEndDate.value = ''
    loadAttendanceData()
    loadDetailData()
  } else {
    selectedWeek.value = ''
    loadAttendanceData()
    loadDetailData()
  }
}

// Watch for changes in year/month filters
watch([selectedYear, selectedMonth], () => {
  if (activeTab.value === 'attendance') {
    selectedWeek.value = '' // Clear week filter when changing month
    loadAttendanceData()
  }
  if (activeTab.value === 'detail') {
    selectedWeek.value = '' // Clear week filter when changing month
    loadDetailData()
  }
})

// Load detail data from API
const loadDetailData = async () => {
  detailLoading.value = true
  detailError.value = null
  
  try {
    let data
    
    // Check if week filter is selected
    if (selectedWeek.value) {
      data = await attendanceDataService.getAttendanceDataByWeek(selectedWeek.value)
    }
    // Check if date range is selected
    else if (selectedStartDate.value && selectedEndDate.value) {
      data = await attendanceDataService.getAttendanceDataByDateRange(selectedStartDate.value, selectedEndDate.value)
    } else {
      // Default to current month
      data = await attendanceDataService.getAttendanceDataByMonth(selectedYear.value, selectedMonth.value)
    }
    
    // Transform data to match the expected format for detail view
    const transformedData = []
    
    data.forEach((item, index) => {
      // Only include records that have both check-in and check-out times
      if (item.checkInTime && item.checkOutTime) {
        transformedData.push({
          stt: index + 1,
          id: item.employeeCode,
          name: item.employeeName,
          shift: item.shiftName,
          date: new Date(item.workDate).toLocaleDateString('vi-VN'),
          checkInTime: item.checkInTime.toString().substring(0, 5),
          checkOutTime: item.checkOutTime.toString().substring(0, 5),
          type: getAttendanceType(item.status)
        })
      }
    })
    
    detailData.value = transformedData
    
    console.log('Detail data loaded:', detailData.value)
  } catch (error) {
    console.error('Error loading detail data:', error)
    detailError.value = error.message || 'Lỗi khi tải dữ liệu công chi tiết'
  } finally {
    detailLoading.value = false
  }
}

// Load attendance data on component mount
onMounted(() => {
  loadAttendanceData()
  loadDetailData()
})

const closeHistoryCurrentPage = ref(1)
const closeHistoryItemsPerPage = ref(10)
const paginatedCloseHistoryData = computed(() => {
  const start = (closeHistoryCurrentPage.value - 1) * closeHistoryItemsPerPage.value
  return closeHistoryData.value.slice(start, start + closeHistoryItemsPerPage.value)
})

const feedbackCurrentPage = ref(1)
const feedbackItemsPerPage = ref(10)
const paginatedFeedbackData = computed(() => {
  const start = (feedbackCurrentPage.value - 1) * feedbackItemsPerPage.value
  return feedbackData.slice(start, start + feedbackItemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Thay thế TabBar hiện tại bằng đoạn sau -->
<div class="attendance-tabs-bar">
  <div
    v-for="tab in visibleTabs"
    :key="tab.key"
    class="tab-bar-item"
    :class="{ active: activeTab === tab.key }"
    @click="selectTab(tab.key)"
  >
    <i :class="tab.icon + ' tab-bar-icon'"></i>
    {{ tab.label }}
  </div>
  <div v-if="hiddenTabs.length" class="tab-bar-item more-tab" @click="showMoreTabs = !showMoreTabs">
    <i class="fas fa-ellipsis-h tab-bar-icon"></i> Thêm
    <div v-if="showMoreTabs" class="more-tabs-dropdown">
      <div
        v-for="tab in hiddenTabs"
        :key="tab.key"
        class="dropdown-tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="selectTab(tab.key)"
      >
        <i :class="tab.icon + ' dropdown-tab-icon'"></i>
        {{ tab.label }}
      </div>
    </div>
  </div>
</div>
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="activeTab === 'summary'">
          <!-- Time Filter for Summary Tab -->
          <TimeFilter
            v-model:year="selectedYear"
            v-model:month="selectedMonth"
            :show-date-range="false"
            :show-refresh-button="false"
          />
          
          <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center legend-row">
            <span class="legend-item" style="background:#28a745"></span> Đi làm
            <span class="legend-item" style="background:#ff6b6b"></span> Nghỉ phép
            <span class="legend-item" style="background:#6c63ff"></span> Làm việc từ xa
          </div>
          <div class="attendance-summary-table">
            <DataTable :columns="mainSummaryColumns" :data="mainSummaryData">
              <template #detail="{ item }">
                <button class="btn btn-sm btn-outline-primary" @click.stop="openEmployeeModal(item)"><i class="fa-solid fa-eye"></i></button>
              </template>
              <template #id="{ item }">
                <span class="emp-id fw-bold text-primary">{{ item.id }}</span>
              </template>
              <template #name="{ item }">
                <span class="fw-bold">{{ item.name }}</span>
              </template>
              <template v-for="(day, idx) in dayHeaders" v-slot:[`day_${idx}`]="{ item }">
                <div
                  class="schedule-cell-modern"
                  :class="getCellClass(item._idx, idx)"
                  :title="getCellTitle(item._idx, idx)"
                  @click.stop="openDayModal(item, idx)"
                  style="cursor:pointer;"
                >
                  <span class="cell-time">{{ item[`day_${idx}`]?.time }}</span>
                </div>
              </template>
            </DataTable>

                <ModalDialog :show="showEmployeeModal" title="Chi tiết tổng hợp công nhân viên" size="xl" scrollable
                  @update:show="showEmployeeModal = $event">
                  <div class="modal-emp-header">
                    <div class="modal-emp-avatar">
                      <img v-if="selectedEmployee?.avatar" :src="selectedEmployee.avatar" alt="avatar" />
                      <div v-else class="avatar-placeholder"><i class="fas fa-user"></i></div>
                    </div>
                    <div class="modal-emp-info">
                      <div class="emp-name fw-bold">{{ selectedEmployee?.name }}</div>
                      <div class="emp-id text-muted">Mã NV: {{ selectedEmployee?.id }}</div>
                      <div class="emp-pos text-muted">Chức vụ: {{ selectedEmployee?.position }}</div>
                    </div>
                  </div>
                  <div v-if="selectedEmployee && selectedEmployee.summary" class="summary-dashboard mt-4">
                    <div class="row g-3">
                        <div class="col-lg-3 col-md-6">
                            <div class="stat-card-summary primary">
                                <div class="stat-icon-summary"><i class="fas fa-calendar-check"></i></div>
                                <div class="stat-info-summary">
                                    <div class="stat-value">{{ selectedEmployee.summary.totalWorkDays }}</div>
                                    <div class="stat-label">Tổng ngày công</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="stat-card-summary success">
                                <div class="stat-icon-summary"><i class="fas fa-user-check"></i></div>
                                <div class="stat-info-summary">
                                    <div class="stat-value">{{ selectedEmployee.summary.totalPresent }}</div>
                                    <div class="stat-label">Tổng đi làm</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="stat-card-summary info">
                                <div class="stat-icon-summary"><i class="fas fa-plane-departure"></i></div>
                                <div class="stat-info-summary">
                                    <div class="stat-value">{{ selectedEmployee.summary.businessTrip }}</div>
                                    <div class="stat-label">Công tác</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="stat-card-summary secondary">
                                <div class="stat-icon-summary"><i class="fas fa-calendar-day"></i></div>
                                <div class="stat-info-summary">
                                    <div class="stat-value">{{ selectedEmployee.summary.totalPaidLeave }}</div>
                                    <div class="stat-label">Nghỉ có lương</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="stat-card-summary warning">
                                <div class="stat-icon-summary"><i class="fas fa-clock"></i></div>
                                <div class="stat-info-summary">
                                    <div class="stat-value">{{ selectedEmployee.summary.totalCompensatoryOt }} giờ</div>
                                    <div class="stat-label">Tăng ca nghỉ bù</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="stat-card-summary success-alt">
                                <div class="stat-icon-summary"><i class="fas fa-money-bill-wave"></i></div>
                                <div class="stat-info-summary">
                                    <div class="stat-value">{{ selectedEmployee.summary.totalPaidOt }} giờ</div>
                                    <div class="stat-label">Tăng ca tính lương</div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                  <div v-else class="text-center p-5 text-muted">
                      <i class="fas fa-chart-bar fa-3x mb-3"></i>
                      <p>Không có dữ liệu tổng hợp cho nhân viên này.</p>
                  </div>
                </ModalDialog>

                <ModalDialog :show="showDayModal" title="Chi tiết chấm công từng ngày" size="xl" scrollable
                  @update:show="showDayModal = $event">
                  <div class="modal-emp-header">
                    <div class="modal-emp-avatar">
                      <img v-if="selectedEmployee?.avatar" :src="selectedEmployee.avatar" alt="avatar" />
                      <div v-else class="avatar-placeholder"><i class="fas fa-user"></i></div>
                    </div>
                    <div class="modal-emp-info">
                      <div class="emp-name fw-bold">{{ selectedEmployee?.name }}</div>
                      <div class="emp-id text-muted">Mã NV: {{ selectedEmployee?.id }}</div>
                      <div class="emp-pos text-muted">Chức vụ: {{ selectedEmployee?.position }}</div>
                    </div>
                    <div class="modal-emp-date">
                      <span class="fw-bold">Ngày đi làm:</span>
                      <span>{{ selectedDateIdx !== null ? dayHeaders[selectedDateIdx] : '' }}</span>
                    </div>
                  </div>
                  <div class="modal-section">
                    <div class="section-title"><i class="fas fa-fingerprint"></i> Lịch sử chấm công</div>
                    <DataTable :columns="attendanceColumns" :data="attendanceHistory">
                      <template #avatar="{ item }">
                        <img v-if="item.avatar" :src="item.avatar" alt="avatar" class="table-avatar" />
                      </template>
                      <template #actions="{ item }">
                        <button class="table-action-btn delete" title="Xóa" @click.stop="onDeleteAttendance(item)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </template>
                    </DataTable>
                  </div>
                  <div class="modal-section">
                    <div class="section-title"><i class="fas fa-calendar-alt"></i> Lịch làm việc</div>
                    <DataTable :columns="workColumns" :data="workHistory">
                      <template #scanInOut="{ item }">
                        <div>
                          <span class="scan-label">Vào:</span>
                          <span class="scan-value">{{ item.scanInOut.split(',')[0].replace('Vào:', '').trim() }}</span><br>
                          <span class="scan-label">Ra:</span>
                          <span class="scan-value">{{ item.scanInOut.split(',')[1].replace('Ra:', '').trim() }}</span>
                        </div>
                      </template>
                      <template #actions="{ item }">
                        <button class="table-action-btn delete" title="Xóa" @click.stop="onDeleteWork(item)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </template>
                    </DataTable>
                  </div>
                  <div class="modal-section">
                    <div class="section-title"><i class="fas fa-trash-alt"></i> Lịch sử xóa ca</div>
                    <DataTable :columns="deleteColumns" :data="deleteHistory">
                      <template #actions="{ item }">
                        <button class="table-action-btn restore" title="Phục hồi" @click.stop="onRestoreDelete(item)">
                          <i class="fas fa-undo"></i> Phục hồi
                        </button>
                      </template>
                    </DataTable>
                  </div>
                  <div class="modal-section">
                    <div class="section-title"><i class="fas fa-trash"></i> Lịch sử xóa công</div>
                    <DataTable :columns="deleteWorkColumns" :data="deleteWorkHistory">
                      <template #avatar="{ item }">
                        <img v-if="item.avatar" :src="item.avatar" alt="avatar" class="table-avatar" />
                      </template>
                      <template #actions="{ item }">
                        <button class="table-action-btn restore" title="Phục hồi" @click.stop="onRestoreDeleteWork(item)">
                          <i class="fas fa-undo"></i> Phục hồi
                        </button>
                      </template>
                    </DataTable>
                  </div>
                <!-- ModalDialog cho chi tiết tổng hợp nhân viên -->
                </ModalDialog>

                <!-- ModalDialog cho chi tiết từng ngày -->
          </div>
        </div>
                <div v-else-if="activeTab === 'overtime'">
          <!-- Time Filter for Overtime Tab -->
          <TimeFilter
            v-model:year="selectedYear"
            v-model:month="selectedMonth"
            :show-date-range="false"
            :show-refresh-button="false"
          />
          
          <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center legend-row mb-2">
            <span class="legend-item" style="background:#2196f3"></span> Tăng ca nghỉ bù
            <span class="legend-item" style="background:#28a745"></span> Tăng ca tính lương
          </div>
          <div class="attendance-summary-table">
            <DataTable :columns="overtimeColumns" :data="overtimeData">
              <template #detail="{ item }">
                <button class="btn btn-sm btn-outline-primary" @click.stop="openOvertimeModal(item)"><i class="fa-solid fa-eye"></i></button>
              </template>
              <template #id="{ item }">
                <span class="emp-id fw-bold text-primary">{{ item.id }}</span>
              </template>
              <template #name="{ item }">
                <span class="fw-bold">{{ item.name }}</span>
              </template>
              <template v-for="(day, idx) in overtimeHeaders" v-slot:[`day_${idx}`]="{ item }">
                <div
                  class="schedule-cell-modern"
                  :class="getOvertimeCellClass(item[`day_${idx}`]?.type)"
                  @click.stop="openOvertimeModal(item, idx)"
                  style="cursor:pointer;"
                >
                  <span v-if="item[`day_${idx}`]?.hours > 0">{{ item[`day_${idx}`]?.hours }}</span>
                </div>
              </template>
            </DataTable>
          </div>
                  <ModalDialog :show="showOvertimeModal" title="Chi tiết tăng ca" size="md" scrollable
          @update:show="showOvertimeModal = $event">
          <div class="modal-emp-header">
            <div class="modal-emp-avatar">
              <img v-if="selectedOvertimeEmployee?.avatar" :src="selectedOvertimeEmployee.avatar" alt="avatar" />
              <div v-else class="avatar-placeholder"><i class="fas fa-user"></i></div>
            </div>
            <div class="modal-emp-info">
              <div class="emp-name fw-bold">{{ selectedOvertimeEmployee?.name }}</div>
              <div class="emp-id text-muted">Mã NV: {{ selectedOvertimeEmployee?.id }}</div>
              <div class="emp-pos text-muted">Chức vụ: {{ selectedOvertimeEmployee?.position }}</div>
            </div>
            <div class="modal-emp-date" v-if="selectedOvertimeDayIdx !== null">
              <span class="fw-bold">Ngày:</span>
              <span>{{ overtimeHeaders[selectedOvertimeDayIdx] }}</span>
            </div>
          </div>
          <div class="modal-summary-table mt-3">
            <div v-if="selectedOvertimeDayIdx !== null">
              <div class="mb-2">
                <span class="fw-bold">Số giờ tăng ca:</span>
                <span>{{ selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.hours ?? 0 }}</span>
              </div>
              <div>
                <span class="fw-bold">Loại tăng ca:</span>
                <span v-if="selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.type === 'compensatory'">Tăng ca nghỉ bù</span>
                <span v-else-if="selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.type === 'paid'">Tăng ca tính lương</span>
                <span v-else>Không tăng ca</span>
              </div>
            </div>
            <div v-else>
              <span class="fw-bold">Tổng hợp tăng ca tháng</span>
              <!-- Có thể bổ sung bảng tổng hợp nếu cần -->
            </div>
          </div>
        </ModalDialog>
        </div>
        <div v-else-if="activeTab === 'detail'">
          <!-- Time Filter for Detail Tab -->
          <TimeFilter
            v-model:year="selectedYear"
            v-model:month="selectedMonth"
            v-model:week="selectedWeek"
            v-model:start-date="selectedStartDate"
            v-model:end-date="selectedEndDate"
            :show-week-filter="true"
            :show-date-range="true"
            :show-refresh-button="true"
            :loading="detailLoading"
            @refresh="loadDetailData"
            @week-changed="handleWeekChanged"
            @date-range-changed="handleDateRangeChanged"
          />
          
          <!-- Loading State -->
          <div v-if="detailLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải dữ liệu công chi tiết...</p>
          </div>
          
          <!-- Error State -->
          <div v-else-if="detailError" class="alert alert-danger">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ detailError }}
              </div>
              <button 
                class="btn btn-outline-danger btn-sm" 
                @click="loadDetailData"
                :disabled="detailLoading"
              >
                <i class="fas fa-redo me-1"></i>
                Thử lại
              </button>
            </div>
          </div>
          
          <!-- Data Table -->
          <div v-else class="attendance-summary-table">
            <DataTable :columns="detailColumns" :data="paginatedDetailData">
              <template #type="{ item }">
                <span
                  :class="{
                    'cell-work': item.type === 'Đi làm',
                    'cell-leave': item.type === 'Nghỉ phép',
                    'cell-remote': item.type === 'Làm việc từ xa'
                  }"
                >
                  {{ item.type }}
                </span>
              </template>
              <template #late="{ item }">
                <span v-if="item.late > 0" class="text-warning fw-bold">
                  {{ item.late }} phút
                </span>
                <span v-else class="text-success">Đúng giờ</span>
              </template>
              <template #early="{ item }">
                <span v-if="item.early > 0" class="text-danger fw-bold">
                  {{ item.early }} phút
                </span>
                <span v-else class="text-success">Đúng giờ</span>
              </template>
              <template #hours="{ item }">
                <span class="fw-bold">{{ item.hours }}h</span>
              </template>
              <template #days="{ item }">
                <span class="fw-bold">{{ item.days }}</span>
              </template>
            </DataTable>
            <Pagination
              :totalItems="processedDetailData.length"
              :itemsPerPage="detailItemsPerPage"
              :currentPage="detailCurrentPage"
              @update:currentPage="detailCurrentPage = $event"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'attendance'">
          <!-- Time Filter for Attendance Tab -->
          <TimeFilter
            v-model:year="selectedYear"
            v-model:month="selectedMonth"
            v-model:start-date="selectedStartDate"
            v-model:end-date="selectedEndDate"
            :show-date-range="true"
            :show-refresh-button="true"
            :loading="attendanceLoading"
            @refresh="loadAttendanceData"
            @date-range-changed="handleDateRangeChanged"
          />
          
          <!-- Loading State -->
          <div v-if="attendanceLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải dữ liệu chấm công...</p>
          </div>
          
          <!-- Error State -->
          <div v-else-if="attendanceError" class="alert alert-danger">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ attendanceError }}
              </div>
              <button 
                class="btn btn-outline-danger btn-sm" 
                @click="loadAttendanceData"
                :disabled="attendanceLoading"
              >
                <i class="fas fa-redo me-1"></i>
                Thử lại
              </button>
            </div>
          </div>
          
          <!-- Data Table -->
          <div v-else class="attendance-summary-table">
            <DataTable :columns="attendanceDataColumns" :data="paginatedAttendanceData">
              <template #avatar="{ item }">
                <img v-if="item.avatar" :src="item.avatar" alt="avatar" class="table-avatar" />
              </template>
              <template #type="{ item }">
                <span
                  :class="{
                    'cell-in': item.type === 'Vào',
                    'cell-out': item.type === 'Ra'
                  }"
                >
                  {{ item.type }}
                </span>
              </template>
            </DataTable>
            <Pagination
              :totalItems="attendanceData.length"
              :itemsPerPage="attendanceItemsPerPage"
              :currentPage="attendanceCurrentPage"
              @update:currentPage="attendanceCurrentPage = $event"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'closeHistory'">
          <div class="attendance-summary-table">
            <DataTable :columns="closeHistoryColumns" :data="paginatedCloseHistoryData">
              <template #active="{ item }">
                <label class="switch">
                  <input type="checkbox" v-model="item.active" @change="toggleCloseActive(item)" />
                  <span class="slider"></span>
                </label>
              </template>
            </DataTable>
            <Pagination
              :totalItems="Array.isArray(closeHistoryData) ? closeHistoryData.length : closeHistoryData.value.length"
              :itemsPerPage="closeHistoryItemsPerPage"
              :currentPage="closeHistoryCurrentPage"
              @update:currentPage="closeHistoryCurrentPage = $event"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'feedbackHistory'">
          <div class="attendance-summary-table">
            <DataTable :columns="feedbackColumns" :data="paginatedFeedbackData">
              <template #actions="{ item }">
                <button class="table-action-btn" title="Xem chi tiết" @click.stop="alert('Xem chi tiết: ' + item.title)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="table-action-btn delete" title="Xóa" @click.stop="alert('Xóa phản ánh: ' + item.title)">
                  <i class="fas fa-trash"></i>
                </button>
              </template>
              <template #content="{ item }">
                <span class="feedback-content">{{ item.content }}</span>
              </template>
            </DataTable>
            <Pagination
              :totalItems="feedbackData.length"
              :itemsPerPage="feedbackItemsPerPage"
              :currentPage="feedbackCurrentPage"
              @update:currentPage="feedbackCurrentPage = $event"
            />
          </div>
        </div>
        <div v-else>
          <div class="text-muted">Nội dung tab "{{tabs.find(t => t.key === activeTab)?.label}}" sẽ được mô tả sau.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* Màu cho ô tăng ca */
.cell-overtime-compensatory {
  background: #e3f2fd;
  color: #2196f3;
  border: 1px solid #90caf9;
}
.cell-overtime-paid {
  background: #eafbe7;
  color: #28a745;
  border: 1px solid #b6e6b0;
}
/* Căn chỉnh UI bảng công tổng */
.col-stt { min-width: 40px; max-width: 50px; }
.col-detail { min-width: 60px; max-width: 70px; }
.col-id { min-width: 90px; max-width: 110px; }
.col-name { min-width: 160px; max-width: 220px;}
.col-day { min-width: 70px; max-width: 90px; }
.emp-id {
  font-size: 1em;
  letter-spacing: 1px;
}
/* Màu cho các ô từng ngày theo trạng thái */
.schedule-cell-modern {
  border-radius: 4px;
  padding: 2px 6px;
  min-width: 70px;
  display: inline-block;
  text-align: center;
  font-size: 0.95em;
  font-weight: 500;
  transition: box-shadow 0.2s;
}
.schedule-cell-modern.cell-work {
  background: #eafbe7;
  color: #28a745;
  border: 1px solid #b6e6b0;
}
.schedule-cell-modern.cell-leave {
  background: #fff0f0;
  color: #ff6b6b;
  border: 1px solid #ffb3b3;
}
.schedule-cell-modern.cell-remote {
  background: #f0f0ff;
  color: #6c63ff;
  border: 1px solid #b3b3ff;
}
.schedule-cell-modern:hover {
  box-shadow: 0 0 0 2px #007bff33;
  cursor: pointer;
}
/* Modal cải thiện UI */
.modal-emp-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 0 18px 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 18px;
}

.modal-emp-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-emp-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  font-size: 2rem;
  color: #adb5bd;
}

.modal-emp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-emp-info .emp-name {
  font-size: 1.25rem;
  color: #0d6efd;
}

.modal-emp-info .emp-id,
.modal-emp-info .emp-pos {
  font-size: 1rem;
  color: #495057;
}

.modal-emp-date {
  font-size: 1.08rem;
  color: #0d6efd;
  background: #e9ecef;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.modal-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 1.08rem;
  font-weight: 600;
  color: #0d6efd;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

@media (max-width: 900px) {
  .modal-emp-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .modal-emp-date {
    margin-top: 8px;
    width: 100%;
    text-align: left;
  }
}

.attendance-tabs-bar {
  display: flex;
  gap: 8px;
  border-radius: 8px;
  background: #f5f7fa;
  padding: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  margin-bottom: 1rem;
  position: relative;
}

.tab-bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  background: transparent;
}

.tab-bar-item .tab-bar-icon {
  font-size: 1.15rem;
  color: #0d6efd;
}

.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.07);
}

.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

.more-tab {
  position: relative;
}

.more-tabs-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 8px;
  min-width: 200px;
}

.dropdown-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.dropdown-tab-item .dropdown-tab-icon {
  font-size: 1.1rem;
  color: #0d6efd;
}

.dropdown-tab-item.active {
  background: #e9ecef;
  color: #0d6efd;
}

.dropdown-tab-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

.card {
  border-radius: 0.75rem;
  border: none;
}

.card-body {
  padding: 1.5rem;
}

.attendance-summary-table {
  max-height: calc(100vh - 300px);
  /* Ensure the table fits within the viewport */
  overflow-y: auto;
  /* Enable vertical scrolling for the table content */
  padding: 16px;
  /* Add padding around the table */
  margin: 16px;
  /* Add margin around the table container */
  border-radius: 16px;
  /* Rounded corners for the table container */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  /* Subtle shadow for the table container */
  background: #fff;
  /* White background for the table container */
  border: 1px solid #e9ecef;
  /* Add a border to the table container */
}

.attendance-summary-table .modern-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  /* Ensure the table takes up the full width of the container */
}

.attendance-summary-table th {
  background: #f5f7fa;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  border-bottom: 2px solid #e9ecef;
  vertical-align: middle;
  position: sticky;
  top: 0;
  /* Keep table headers visible while scrolling */
  z-index: 2;
}

.attendance-summary-table td {
  vertical-align: middle;
  text-align: center;
  border-color: #e9ecef;
  background: #fff;
  padding: 0;
}

.attendance-summary-table .schedule-cell-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 44px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  margin: 4px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  border: 1.5px solid #e9ecef;
}

.attendance-summary-table .schedule-cell-modern:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: scale(1.04);
  border-color: #0d6efd;
}


.attendance-summary-table .cell-work {
  background: #eafbe7;
  color: #28a745;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.attendance-summary-table .cell-leave {
  background: #fff0f0;
  color: #ff6b6b;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.attendance-summary-table .cell-remote {
  background: #f0f0ff;
  color: #6c63ff;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.attendance-summary-table .cell-other,
.attendance-summary-table .cell-empty {
  background: #e0e0e0;
  color: #888;
  border: 1px solid #d1d1d1;
}
.attendance-summary-table .cell-late {
  background: #fff3cd;
  color: #856404;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.attendance-summary-table .cell-early {
  background: #f8d7da;
  color: #721c24;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.attendance-summary-table .cell-in {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.attendance-summary-table .cell-out {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.attendance-summary-table .cell-time {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.legend-row {
  font-size: 1rem;
  gap: 18px;
  margin-top: 8px;
}

.legend-item {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #e0e0e0;
}

.scan-label {
  
  font-weight: 500;
}

.scan-value {
  color: #222;
  font-weight: 600;
  letter-spacing: 1px;
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
.table-action-btn.restore {
  color: #28a745;
  font-weight: 500;
  font-size: 1rem;
}
.table-action-btn:hover {
  background: #e9ecef;
}

/* Toggle switch hiệu lực */
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
  top: 0; left: 0; right: 0; bottom: 0;
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.switch input:checked + .slider {
  background-color: #28a745;
}
.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.feedback-content {
  white-space: pre-line;
  word-break: break-word;
  font-size: 1rem;
  color: #222;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 6px 10px;
  display: inline-block;
  max-width: 320px;
}

.summary-dashboard {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
}

.stat-card-summary {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 5px solid;
}

.stat-card-summary:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.stat-card-summary.primary { border-color: #0d6efd; }
.stat-card-summary.success { border-color: #198754; }
.stat-card-summary.info { border-color: #0dcaf0; }
.stat-card-summary.secondary { border-color: #6c757d; }
.stat-card-summary.warning { border-color: #ffc107; }
.stat-card-summary.success-alt { border-color: #20c997; }
.stat-card-summary.danger { border-color: #dc3545; }
.stat-card-summary.danger-alt { border-color: #fd7e14; }
.stat-card-summary.dark { border-color: #212529; }

.stat-icon-summary {
  font-size: 1.75rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 1rem;
  color: #fff;
}

.stat-card-summary.primary .stat-icon-summary { background-color: #0d6efd; }
.stat-card-summary.success .stat-icon-summary { background-color: #198754; }
.stat-card-summary.info .stat-icon-summary { background-color: #0dcaf0; }
.stat-card-summary.secondary .stat-icon-summary { background-color: #6c757d; }
.stat-card-summary.warning .stat-icon-summary { background-color: #ffc107; color: #000; }
.stat-card-summary.success-alt .stat-icon-summary { background-color: #20c997; }
.stat-card-summary.danger .stat-icon-summary { background-color: #dc3545; }
.stat-card-summary.danger-alt .stat-icon-summary { background-color: #fd7e14; }
.stat-card-summary.dark .stat-icon-summary { background-color: #212529; }

.stat-info-summary .stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.stat-info-summary .stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}
</style>
