<script setup>
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
import DataTable from '../../components/common/DataTable.vue'
import LeaveForm from '../../components/common/leave/LeaveForm.vue'

const showEmployeeModal = ref(false)
const showDayModal = ref(false)
const showLeaveFormModal = ref(false)
const selectedEmployee = ref(null)
const selectedDateIdx = ref(null)
const selectedLeaveRequest = ref(null)
const dayModalLoading = ref(false)
const dayModalError = ref(null)

function openEmployeeModal(emp) {
  selectedEmployee.value = emp
  showEmployeeModal.value = true
}
function closeEmployeeModal() {
  showEmployeeModal.value = false
}
async function openDayModal(emp, dayIdx) {
  selectedEmployee.value = emp
  selectedDateIdx.value = dayIdx
  showDayModal.value = true
  
  // Reset previous data and loading state
  dayModalLoading.value = true
  dayModalError.value = null
  attendanceHistory.value = []
  workHistory.value = []
  
  // Load real data for the selected day
  await loadDayModalData(emp, dayIdx)
}
function closeDayModal() {
  showDayModal.value = false
}

// Function to open LeaveForm modal when clicking on voucher code
function openLeaveFormModal(voucherCode) {
  console.log('Opening leave form modal for voucher code:', voucherCode)
  console.log('Available leave requests:', leaveRequests.value)
  
  if (!voucherCode) {
    console.warn('No voucher code provided')
    return
  }
  
  // Find the leave request by voucher code
  const leaveRequest = leaveRequests.value.find(leave => leave.voucherCode === voucherCode)
  
  console.log('Found leave request:', leaveRequest)
  
  if (leaveRequest) {
    selectedLeaveRequest.value = leaveRequest
    showLeaveFormModal.value = true
    console.log('Leave form modal opened successfully')
  } else {
    console.warn('Leave request not found for voucher code:', voucherCode)
    console.log('Available voucher codes:', leaveRequests.value.map(lr => lr.voucherCode))
  }
}

function closeLeaveFormModal() {
  showLeaveFormModal.value = false
  selectedLeaveRequest.value = null
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
  { key: 'workHour', label: 'Giờ/ngày công' }
]

// Columns without actions for day modal
const attendanceColumnsNoActions = [
  { key: 'stt', label: 'STT' },
  { key: 'avatar', label: 'Ảnh' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'refCode', label: 'Mã phiếu tham chiếu' },
  { key: 'date', label: 'Ngày đi làm' },
  { key: 'scanTime', label: 'Giờ quét' },
  { key: 'type', label: 'Loại công' },
  { key: 'location', label: 'Vị trí' }
]

const workColumnsNoActions = [
  { key: 'stt', label: 'STT' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'standard', label: 'Công chuẩn' },
  { key: 'scanInOut', label: 'Quét vào/ra' },
  { key: 'lateEarly', label: 'Đi trễ/Về sớm' },
  { key: 'workHour', label: 'Giờ/ngày công' }
]

// Filtered data for day modal - show all loaded data since it's already filtered by date
const filteredAttendanceHistory = computed(() => {
  console.log('Filtered attendance history:', attendanceHistory.value);
  return attendanceHistory.value || [];
});

const filteredWorkHistory = computed(() => {
  console.log('Filtered work history:', workHistory.value);
  return workHistory.value || [];
});
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

// Real attendance history data from API
const attendanceHistory = ref([])

// Real work history data from API
const workHistory = ref([])

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
import { useOvertimeRequest } from '../../composables/useOvertimeRequest'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useLeaveType } from '../../composables/useLeaveType'
import { useShiftAssignment } from '../../composables/useShiftAssignment'
import { useAuth } from '../../composables/useAuth'
import { usePermissions } from '../../composables/usePermissions'

const { showMessage } = useGlobalMessage()

// Initialize composables
const { employees: allEmployees, fetchAllEmployees } = useEmployee()
const { attendanceList, fetchAttendance } = useAttendance()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { overtimeRequests, fetchOvertimeRequests, loading: overtimeLoading, error: overtimeError } = useOvertimeRequest()
const { leaveRequests, fetchLeaveRequests, loading: leaveLoading, error: leaveError } = useLeaveRequest()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()
const { shiftAssignments, fetchAllShiftAssignments } = useShiftAssignment()
const { currentUser, isDirector, isHRManager, isHREmployee } = useAuth()
const { canView } = usePermissions()

// Components
const components = {
  TimeFilter
}

const activeTab = ref('summary')
const showMoreTabs = ref(false) // Control visibility of the "More" dropdown

const allTabs = [
  { key: 'summary', label: 'Bảng tổng hợp công', icon: 'fas fa-table', restricted: true },
  { key: 'personal', label: 'Bảng công cá nhân', icon: 'fas fa-user-clock', restricted: false },
  { key: 'overtime', label: 'Bảng công tăng ca', icon: 'fas fa-business-time', restricted: true },
  { key: 'personalOvertime', label: 'Bảng công tăng ca cá nhân', icon: 'fas fa-user-plus', restricted: false },
  { key: 'detail', label: 'Bảng công chi tiết', icon: 'fas fa-list-alt', restricted: false, personalOnly: true },
  { key: 'attendance', label: 'Dữ liệu chấm công', icon: 'fas fa-fingerprint', restricted: false, personalOnly: true },
  { key: 'closeHistory', label: 'Lịch sử chốt công', icon: 'fas fa-history', restricted: true },
  { key: 'feedbackHistory', label: 'Lịch sử phản ánh', icon: 'fas fa-comment-dots', restricted: true }
]

// Computed property to filter tabs based on user permissions
const tabs = computed(() => {
  return allTabs.filter(tab => {
    // If tab is not restricted, show it to everyone
    if (!tab.restricted) return true
    
    // If tab is restricted, check permissions based on tab type
    if (tab.key === 'summary' || tab.key === 'overtime' || tab.key === 'closeHistory' || tab.key === 'feedbackHistory') {
      return canView('attendance-summary')
    }
    
    // For other restricted tabs, use existing logic as fallback
    const hasHRPermission = isDirector.value || isHRManager.value || isHREmployee.value
    return hasHRPermission
  })
})

// Watch for changes in tabs and adjust activeTab if needed
watch(tabs, (newTabs) => {
  const availableTabKeys = newTabs.map(tab => tab.key)
  
  // If current active tab is not available, switch to first available tab
  if (!availableTabKeys.includes(activeTab.value)) {
    if (availableTabKeys.length > 0) {
      activeTab.value = availableTabKeys[0]
    }
  }
}, { immediate: true })

// Time filter controls for all tabs
const currentMonth = ref(new Date())
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const selectedWeek = ref('')
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

// Pagination for main summary table
const currentPage = ref(1)
const pageSize = ref(5)

// Limit the number of visible tabs
const visibleTabsCount = computed(() => Math.min(6, tabs.value.length))
const visibleTabs = computed(() => tabs.value.slice(0, visibleTabsCount.value))
const hiddenTabs = computed(() => tabs.value.slice(visibleTabsCount.value))

const selectTab = async (tabKey) => {
  activeTab.value = tabKey
  showMoreTabs.value = false // Close the "More" dropdown when a tab is selected

  // Load specific data when switching to summary tab
  if (tabKey === 'summary') {
    await Promise.all([
      loadAttendanceDataForSummary(),
      fetchLeaveRequests()
    ])
  }
  
  // Load data for personal tab
  if (tabKey === 'personal') {
    console.log('Loading data for personal tab...')
    await Promise.all([
      loadAttendanceData(),
      fetchLeaveRequests()
    ])
    console.log('Personal tab data loaded. Attendance count:', attendanceList.value?.length || 0)
  }
  
  // Load data for personal overtime tab
  if (tabKey === 'personalOvertime') {
    console.log('Loading data for personal overtime tab...')
    await Promise.all([
      loadOvertimeData(),
      fetchOvertimeRequests()
    ])
    console.log('Personal overtime tab data loaded. Overtime count:', overtimeRequests.value?.length || 0)
  }
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

// Tạo danh sách ngày trong tháng được chọn (computed để reactive)
const dayHeaders = computed(() => {
  const year = selectedYear.value
  const month = selectedMonth.value
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
    return `${i + 1}/${month} (${weekday})`
  })
})

// Function to get work shift details by ID
function getWorkShiftDetails(workShiftId) {
  if (!workshifts.value || !workShiftId) return null;

  const workShift = workshifts.value.find(shift =>
    shift.workShiftID === workShiftId ||
    shift.id === workShiftId ||
    String(shift.workShiftID) === String(workShiftId)
  );

  return workShift;
}

// Function to check if leave time is sufficient compared to work shift
function isLeaveTimeSufficient(leaveRequest, workShiftId) {
  if (!leaveRequest || !workShiftId) return true; // Default to sufficient if no data

  const workShift = getWorkShiftDetails(workShiftId);
  if (!workShift || !workShift.shiftDetails || workShift.shiftDetails.length === 0) {
    return true; // Default to sufficient if no work shift data
  }

  // Get leave time
  const leaveStart = new Date(leaveRequest.startDateTime);
  const leaveEnd = new Date(leaveRequest.endDateTime);

  // Get work shift time (assuming shiftDetails has start and end times)
  // This might need adjustment based on actual workShift structure
  const shiftDetail = workShift.shiftDetails[0]; // Assuming first detail contains the main shift
  if (!shiftDetail || !shiftDetail.startTime || !shiftDetail.endTime) {
    return true; // Default to sufficient if no shift time data
  }

  // Parse shift times (assuming format like "08:00" or "08:30:00")
  const [shiftStartHour, shiftStartMin] = shiftDetail.startTime.split(':').map(Number);
  const [shiftEndHour, shiftEndMin] = shiftDetail.endTime.split(':').map(Number);

  const shiftStart = new Date(leaveStart);
  shiftStart.setHours(shiftStartHour, shiftStartMin, 0, 0);

  const shiftEnd = new Date(leaveEnd);
  shiftEnd.setHours(shiftEndHour, shiftEndMin, 0, 0);

  // Check if leave time covers the full work shift
  const leaveStartTime = leaveStart.getTime();
  const leaveEndTime = leaveEnd.getTime();
  const shiftStartTime = shiftStart.getTime();
  const shiftEndTime = shiftEnd.getTime();

  // Leave is sufficient if it starts before or at shift start and ends after or at shift end
  const isSufficient = leaveStartTime <= shiftStartTime && leaveEndTime >= shiftEndTime;

  console.log('Leave time check:', {
    leaveStart: leaveStart.toLocaleTimeString(),
    leaveEnd: leaveEnd.toLocaleTimeString(),
    shiftStart: shiftStart.toLocaleTimeString(),
    shiftEnd: shiftEnd.toLocaleTimeString(),
    isSufficient
  });

  return isSufficient;
}

// Function to check if employee has approved leave for a specific date and work shift
function hasApprovedLeaveForDate(employeeId, date, workShiftId) {
  console.log('=== CHECKING LEAVE REQUEST ===');
  console.log('Employee ID:', employeeId);
  console.log('Date:', date);
  console.log('Work Shift ID:', workShiftId);
  console.log('Leave requests available:', leaveRequests.value?.length || 0);

  if (!leaveRequests.value || leaveRequests.value.length === 0) {
    console.log('No leave requests found');
    return null;
  }

  // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  console.log('Looking for date:', dateStr);

  const leaveRequest = leaveRequests.value.find(request => {
    // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
    const startDateObj = new Date(request.startDateTime);
    const endDateObj = new Date(request.endDateTime);
    const startYear = startDateObj.getFullYear();
    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDateObj.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const endDate = `${endYear}-${endMonth}-${endDay}`;

    console.log('Checking leave request:', {
      requestEmployeeID: request.employeeID,
      targetEmployeeID: employeeId,
      approveStatus: request.approveStatus,
      startDate,
      endDate,
      targetDate: dateStr,
      requestWorkShiftID: request.workShiftID,
      targetWorkShiftID: workShiftId
    });

    const employeeMatch = request.employeeID === employeeId ||
      request.employeeID === String(employeeId) ||
      String(request.employeeID) === employeeId;

    const statusMatch = request.approveStatus === 'Đã duyệt' || request.approveStatus === 'Approved';

    const dateMatch = dateStr >= startDate && dateStr <= endDate;

    const shiftMatch = !workShiftId || !request.workShiftID ||
      request.workShiftID == workShiftId ||
      String(request.workShiftID) === String(workShiftId);

    const result = employeeMatch && statusMatch && dateMatch && shiftMatch;
    console.log('Leave request match result:', result);

    return result;
  });

  console.log('Found leave request:', leaveRequest);
  return leaveRequest;
}

// Function to check leave requests for a specific employee and date without work shift requirement
function checkLeaveRequestForEmployee(employeeId, date) {
  console.log('=== CHECKING LEAVE REQUEST FOR EMPLOYEE ===');
  console.log('Employee ID:', employeeId);
  console.log('Date:', date);
  console.log('Available leave requests:', leaveRequests.value?.length || 0);

  if (!leaveRequests.value || leaveRequests.value.length === 0) {
    console.log('No leave requests available');
    return null;
  }

  // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  console.log('Looking for date:', dateStr);

  // Debug: Show all leave requests for this employee
  const employeeRequests = leaveRequests.value.filter(request => {
    const employeeMatch = request.employeeID === employeeId ||
      request.employeeID === String(employeeId) ||
      String(request.employeeID) === employeeId;
    return employeeMatch;
  });

  console.log(`Found ${employeeRequests.length} leave requests for employee ${employeeId}:`);
  employeeRequests.forEach((request, index) => {
    // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
    const startDateObj = new Date(request.startDateTime);
    const endDateObj = new Date(request.endDateTime);
    const startYear = startDateObj.getFullYear();
    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDateObj.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const endDate = `${endYear}-${endMonth}-${endDay}`;

    console.log(`Request ${index + 1}:`, {
      approveStatus: request.approveStatus,
      startDate,
      endDate,
      targetDate: dateStr,
      dateMatch: dateStr >= startDate && dateStr <= endDate,
      leaveTypeName: request.leaveTypeName
    });
  });

  const result = leaveRequests.value.find(request => {
    // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
    const startDateObj = new Date(request.startDateTime);
    const endDateObj = new Date(request.endDateTime);
    const startYear = startDateObj.getFullYear();
    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDateObj.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const endDate = `${endYear}-${endMonth}-${endDay}`;

    const employeeMatch = request.employeeID === employeeId ||
      request.employeeID === String(employeeId) ||
      String(request.employeeID) === employeeId;

    const statusMatch = request.approveStatus === 'Đã duyệt' || request.approveStatus === 'Approved';
    const dateMatch = dateStr >= startDate && dateStr <= endDate;

    const finalMatch = employeeMatch && statusMatch && dateMatch;

    if (finalMatch) {
      console.log('MATCH FOUND:', request);
    }

    return finalMatch;
  });

  console.log('Final result:', result ? 'FOUND' : 'NOT FOUND');
  return result;
}

// Function to calculate work hours for a specific date within a leave period
function calculateWorkHoursForDate(leaveRequest, targetDate) {
  if (!leaveRequest) return null;

  const leaveStart = new Date(leaveRequest.startDateTime);
  const leaveEnd = new Date(leaveRequest.endDateTime);
  const target = new Date(targetDate);
  
  // Set target date to start of day for comparison
  target.setHours(0, 0, 0, 0);
  
  // Get work shift details (assuming 8:00-17:00 as default)
  const workShiftStart = 8; // 8:00 AM
  const workShiftEnd = 17;   // 5:00 PM
  
  // Check if target date is within leave period
  const leaveStartDate = new Date(leaveStart);
  leaveStartDate.setHours(0, 0, 0, 0);
  const leaveEndDate = new Date(leaveEnd);
  leaveEndDate.setHours(0, 0, 0, 0);
  
  if (target < leaveStartDate || target > leaveEndDate) {
    return null; // Not in leave period
  }
  
  // Calculate work hours for this specific date
  let workStartHour = workShiftStart;
  let workEndHour = workShiftEnd;
  
  // If this is the first day of leave
  if (target.getTime() === leaveStartDate.getTime()) {
    // Ngày đầu: từ giờ nghỉ đến cuối ca (10h-17h)
    workStartHour = leaveStart.getHours() + (leaveStart.getMinutes() / 60);
    workEndHour = workShiftEnd;
  }
  // If this is the last day of leave
  else if (target.getTime() === leaveEndDate.getTime()) {
    // Ngày cuối: từ đầu ca đến giờ nghỉ (8h-16h)
    workStartHour = workShiftStart;
    workEndHour = leaveEnd.getHours() + (leaveEnd.getMinutes() / 60);
  }
  // If this is a middle day (full work day)
  else {
    // Các ngày giữa: full ca làm việc (8h-17h)
    workStartHour = workShiftStart;
    workEndHour = workShiftEnd;
  }
  
  const workHours = Math.max(0, workEndHour - workStartHour);
  
  console.log(`Work hours calculation for ${targetDate.toDateString()}:`, {
    leaveStart: leaveStart.toLocaleString(),
    leaveEnd: leaveEnd.toLocaleString(),
    workStartHour,
    workEndHour,
    workHours,
    isFirstDay: target.getTime() === leaveStartDate.getTime(),
    isLastDay: target.getTime() === leaveEndDate.getTime()
  });
  
  return {
    workHours,
    workStartHour,
    workEndHour,
    isPartialDay: workHours > 0 && workHours < (workShiftEnd - workShiftStart)
  };
}

// Tạo dữ liệu chấm công thực tế cho từng nhân viên, từng ngày từ API
function generateAttendanceForEmployee(employeeId, employeeName) {
  // LOGIC ƯU TIÊN: Dữ liệu chấm công > Phiếu nghỉ phép
  // 1. Nếu có dữ liệu chấm công thực tế → hiển thị theo dữ liệu chấm công (bỏ qua phiếu nghỉ phép)
  // 2. Nếu KHÔNG có dữ liệu chấm công → mới kiểm tra phiếu nghỉ phép đã duyệt
  
  console.log('=== ATTENDANCE DEBUG ===');
  console.log('Employee ID:', employeeId);
  console.log('Employee Name:', employeeName);
  console.log('Attendance data count:', attendanceList.value?.length || 0);
  console.log('Selected year:', selectedYear.value);
  console.log('Selected month:', selectedMonth.value);
  
  // Debug: Show sample attendance data structure
  if (attendanceList.value && attendanceList.value.length > 0) {
    console.log('Sample attendance record:', attendanceList.value[0]);
    console.log('All employee IDs in attendance:', attendanceList.value.map(a => ({
      employeeCode: a.employeeCode,
      employeeID: a.employeeID,
      employeeName: a.employeeName
    })).slice(0, 5));
  }

  if (!attendanceList.value || attendanceList.value.length === 0) {
    console.log('No attendance data found - generating empty data with leave requests');
    console.log('Leave requests available:', leaveRequests.value?.length || 0);
    // Vẫn tạo dữ liệu để kiểm tra phiếu nghỉ phép
    return dayHeaders.value.map((_, dayIdx) => {
      const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1);
      const leaveRequest = checkLeaveRequestForEmployee(employeeId, currentDate);

      if (leaveRequest) {
        console.log(`Found leave request for employee ${employeeId} on day ${dayIdx + 1}:`, leaveRequest);
        // Tạo thời gian hiển thị từ startDateTime và endDateTime
        const startTime = new Date(leaveRequest.startDateTime);
        const endTime = new Date(leaveRequest.endDateTime);

        // Format thời gian: chỉ hiển thị giờ:phút
        const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

        // Kiểm tra xem thời gian nghỉ phép có đủ so với ca làm việc không
        const isSufficient = isLeaveTimeSufficient(leaveRequest, leaveRequest.workShiftID);

        const result = {
          status: isSufficient ? 'leave' : 'insufficient',
          time: timeDisplay,
          type: leaveRequest.leaveTypeName
        };
        
        console.log(`Generated leave data for day ${dayIdx + 1}:`, result);
        return result;
      }

      return { status: '', time: '', type: '' };
    });
  }

  // Lọc dữ liệu chấm công của nhân viên này trong tháng được chọn
  const employeeAttendance = attendanceList.value.filter(attendance => {
    console.log('Checking attendance:', {
      attendanceObject: attendance,
      employeeCode: attendance.employeeCode,
      employeeID: attendance.employeeID,
      employeeName: attendance.employeeName,
      targetEmployeeID: employeeId,
      workDate: attendance.workDate
    });

    // Thử nhiều trường có thể chứa employee ID hoặc tên
    const employeeMatch = attendance.employeeCode === employeeId ||
      attendance.employeeCode === String(employeeId) ||
      String(attendance.employeeCode) === employeeId ||
      attendance.employeeID === employeeId ||
      attendance.employeeID === String(employeeId) ||
      String(attendance.employeeID) === employeeId ||
      attendance.employeeName === employeeName ||
      attendance.employeeName === employeeId;

    return employeeMatch;
  });

  console.log('Filtered employee attendance:', employeeAttendance);

  return dayHeaders.value.map((dayHeader, dayIdx) => {
    // Tạo ngày hiện tại để so sánh
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1);
    // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Tìm dữ liệu chấm công trong ngày này
    const dayAttendance = employeeAttendance.find(attendance => {
      // Sử dụng format YYYY-MM-DD trực tiếp để tránh vấn đề timezone
      const attendanceDateObj = new Date(attendance.workDate);
      const attendanceYear = attendanceDateObj.getFullYear();
      const attendanceMonth = String(attendanceDateObj.getMonth() + 1).padStart(2, '0');
      const attendanceDay = String(attendanceDateObj.getDate()).padStart(2, '0');
      const attendanceDate = `${attendanceYear}-${attendanceMonth}-${attendanceDay}`;
      console.log('Comparing dates:', { attendanceDate, dateStr, match: attendanceDate === dateStr });
      return attendanceDate === dateStr;
    });

    // Kiểm tra đơn nghỉ phép (chỉ để tham khảo, không ưu tiên khi có dữ liệu công)
    let leaveRequest = null;
    if (dayAttendance && dayAttendance.workShiftID) {
      // Có dữ liệu chấm công - kiểm tra đơn nghỉ phép cho ca cụ thể
      leaveRequest = hasApprovedLeaveForDate(employeeId, currentDate, dayAttendance.workShiftID);
    }

    // Nếu chưa tìm thấy đơn nghỉ phép cho ca cụ thể, kiểm tra tổng quát
    if (!leaveRequest) {
      leaveRequest = checkLeaveRequestForEmployee(employeeId, currentDate);
    }

    if (dayAttendance) {
      console.log('Found attendance for day:', dayIdx, dayAttendance);

      // ƯU TIÊN: Dữ liệu công luôn được ưu tiên hơn nghỉ phép
      // Nếu có dữ liệu chấm công, bỏ qua đơn nghỉ phép và hiển thị theo dữ liệu công thực tế
      // Logic: Nếu nhân viên có chấm công thực tế thì coi như đi làm, không quan tâm đến đơn nghỉ phép
      let status = '';
      let time = '';

      if (dayAttendance.checkInTime && dayAttendance.checkOutTime) {
        // Có cả giờ vào và ra - ưu tiên dữ liệu công
        const checkIn = dayAttendance.checkInTime.toString().substring(0, 5);
        const checkOut = dayAttendance.checkOutTime.toString().substring(0, 5);
        time = `${checkIn} ${checkOut}`;

        // Tính giờ công thực tế (bỏ qua đơn nghỉ phép vì có dữ liệu chấm công)
        const checkInTime = new Date(`2000-01-01T${dayAttendance.checkInTime}`);
        const checkOutTime = new Date(`2000-01-01T${dayAttendance.checkOutTime}`);
        const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

        if (workHours >= 8) {
          status = 'work'; // Đi làm đủ giờ (màu xanh lá)
        } else {
          status = 'insufficient'; // Chưa đủ giờ công (màu vàng)
        }
      } else if (dayAttendance.checkInTime && !dayAttendance.checkOutTime) {
        // Chỉ có giờ vào, quên checkout - màu đỏ
        const checkIn = dayAttendance.checkInTime.toString().substring(0, 5);
        time = `${checkIn} -`;
        status = 'incomplete'; // Quên checkout (màu đỏ)
      } else if (!dayAttendance.checkInTime && dayAttendance.checkOutTime) {
        // Chỉ có giờ ra, quên checkin - màu đỏ
        const checkOut = dayAttendance.checkOutTime.toString().substring(0, 5);
        time = `- ${checkOut}`;
        status = 'incomplete'; // Quên checkin (màu đỏ)
      } else {
        // Không có giờ chấm công nhưng có dữ liệu attendance record
        // Trường hợp này hiếm, nhưng vẫn ưu tiên dữ liệu công
        status = 'leave'; // Coi như nghỉ vì không có giờ chấm công
        time = '';
      }

      console.log('Attendance data (prioritized):', {
        status,
        time,
        attendance: dayAttendance,
        leaveRequest: leaveRequest ? 'Ignored - attendance data takes priority' : 'None',
        priority: 'Attendance data over leave request'
      });
      return { status, time, type: dayAttendance.status, attendance: dayAttendance, leaveRequest };
    } else {
      // KHÔNG CÓ DỮ LIỆU CHẤM CÔNG - chỉ khi này mới kiểm tra đơn nghỉ phép
      // Ưu tiên: Dữ liệu chấm công > Phiếu nghỉ phép
      console.log('No attendance data for day:', dayIdx, 'Checking leave request:', leaveRequest);
      if (leaveRequest) {
        console.log('Found leave request for day without attendance:', dayIdx, leaveRequest);

        // Tính toán giờ công chính xác cho ngày này
        const workHoursInfo = calculateWorkHoursForDate(leaveRequest, currentDate);
        
        if (workHoursInfo && workHoursInfo.workHours > 0) {
          // Có giờ công (ngày đầu hoặc ngày cuối của kỳ nghỉ)
          const workStartTime = `${Math.floor(workHoursInfo.workStartHour).toString().padStart(2, '0')}:${Math.floor((workHoursInfo.workStartHour % 1) * 60).toString().padStart(2, '0')}`;
          const workEndTime = `${Math.floor(workHoursInfo.workEndHour).toString().padStart(2, '0')}:${Math.floor((workHoursInfo.workEndHour % 1) * 60).toString().padStart(2, '0')}`;
          
          const timeDisplay = `${workStartTime} ${workEndTime}`;
          
          // Nếu giờ công đủ (>= 8h) thì coi như đi làm, nếu không thì chưa đủ giờ
          const status = workHoursInfo.workHours >= 8 ? 'work' : 'insufficient';
          
          console.log('Partial work day calculation:', {
            workHours: workHoursInfo.workHours,
            workStartTime,
            workEndTime,
            status,
            isPartialDay: workHoursInfo.isPartialDay
          });
          
          return { 
            status, 
            time: timeDisplay, 
            type: leaveRequest.leaveTypeName, 
            leaveRequest,
            workHours: workHoursInfo.workHours
          };
        } else {
          // Không có giờ công (ngày giữa của kỳ nghỉ hoặc nghỉ cả ngày)
          const startTime = new Date(leaveRequest.startDateTime);
          const endTime = new Date(leaveRequest.endDateTime);

          // Format thời gian: chỉ hiển thị giờ:phút
          const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

          console.log('Full leave day:', {
            timeDisplay,
            workHours: workHoursInfo?.workHours || 0
          });

          return { 
            status: 'leave', 
            time: timeDisplay, 
            type: leaveRequest.leaveTypeName, 
            leaveRequest,
            workHours: workHoursInfo?.workHours || 0
          };
        }
      } else {
        console.log('No leave request found for day:', dayIdx);
        return { status: '', time: '', type: '' };
      }
    }
  });
}

const attendanceMatrix = computed(() => {
  console.log('=== ATTENDANCE MATRIX DEBUG ===');
  console.log('Selected year:', selectedYear.value);
  console.log('Selected month:', selectedMonth.value);
  console.log('All employees:', allEmployees.value?.length || 0);
  console.log('Leave requests available:', leaveRequests.value?.length || 0);
  console.log('Attendance list available:', attendanceList.value?.length || 0);

  // Check if we have leave requests for the selected month
  if (leaveRequests.value && leaveRequests.value.length > 0) {
    const selectedMonthRequests = leaveRequests.value.filter(request => {
      const requestDate = new Date(request.startDateTime);
      return requestDate.getFullYear() === selectedYear.value &&
        requestDate.getMonth() + 1 === selectedMonth.value;
    });

    console.log(`Leave requests for ${selectedMonth.value}/${selectedYear.value}:`, selectedMonthRequests.length);

    if (selectedMonthRequests.length > 0) {
      console.log('Sample leave request for selected month:', selectedMonthRequests[0]);
    }
  }

  // Fallback to hardcoded employees if API employees are not available
  const employeesToUse = allEmployees.value && allEmployees.value.length > 0 ? allEmployees.value : employees;

  if (!employeesToUse || employeesToUse.length === 0) {
    console.log('No employees found');
    return [];
  }

  // Log first few employees to see structure
  if (employeesToUse.length > 0) {
    console.log('First employee structure:', employeesToUse[0]);
    console.log('Employee ID types:', employeesToUse.slice(0, 3).map(emp => ({ id: emp.id, type: typeof emp.id })));
    console.log('All employee names:', employeesToUse.map(emp => ({ id: emp.id, name: emp.name, fullName: emp.fullName, employeeName: emp.employeeName })));
  }

  console.log('=== ATTENDANCE MATRIX FOR SELECTED MONTH ===');
  console.log('Selected month:', selectedMonth.value);
  console.log('Attendance matrix length:', employeesToUse.length);
  
  const result = employeesToUse.map(emp => generateAttendanceForEmployee(emp.id, emp.employeeName));
  
  console.log('First employee attendance matrix:', result[0]);
  console.log('Sample day data:', result[0]?.[0]);
  
  return result;
});

const getCell = (empIdx, dayIdx) => {
  if (!attendanceMatrix.value || !attendanceMatrix.value[empIdx]) return null;
  return attendanceMatrix.value[empIdx][dayIdx];
};

const getCellClass = (empIdx, dayIdx) => {
  const cell = getCell(empIdx, dayIdx);
  if (!cell) return '';
  return {
    'cell-work': cell.status === 'work',
    'cell-leave': cell.status === 'leave',
    'cell-insufficient': cell.status === 'insufficient',
    'cell-incomplete': cell.status === 'incomplete',
    'cell-late': cell.status === 'late',
    'cell-other': cell.status === 'other'
  };
};

const getCellTitle = (empIdx, dayIdx) => {
  const cell = getCell(empIdx, dayIdx);
  if (!cell) return '';
  if (cell.status === 'work') return 'Đi làm';
  if (cell.status === 'leave') return 'Nghỉ phép';
  if (cell.status === 'insufficient') return 'Chưa đủ giờ công';
  if (cell.status === 'incomplete') return 'Quên checkin/checkout';
  if (cell.status === 'late') return 'Đi trễ';
  return '';
};

const statusColor = {
  work: '#28a745',
  leave: '#007bff',
  insufficient: '#ffc107',
  incomplete: '#dc3545', // Màu đỏ cho quên checkin/checkout
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

// Cấu hình cột cho bảng công tổng ngoài màn hình chính (computed để reactive)
const mainSummaryColumns = computed(() => [
  { key: 'id', label: 'Mã nhân viên', class: 'text-center col-id' },
  { key: 'name', label: 'Tên nhân viên', class: 'text-start col-name' },
  { key: 'detail', label: 'Chi tiết', class: 'text-center col-detail' },
  ...dayHeaders.value.map((day, idx) => ({ key: `day_${idx}`, label: day, class: 'text-center col-day' }))
]);

const mainSummaryData = computed(() => {
  console.log('Computing main summary data...');
  console.log('Employees (allEmployees):', allEmployees.value);
  console.log('Attendance matrix:', attendanceMatrix.value);

  // Fallback to hardcoded employees if API employees are not available
  const employeesToUse = allEmployees.value && allEmployees.value.length > 0 ? allEmployees.value : employees;

  if (!employeesToUse || !attendanceMatrix.value) {
    console.log('Missing employees or attendance matrix');
    return [];
  }

  // Hiển thị nhân viên có dữ liệu chấm công hoặc phiếu nghỉ phép trong tháng
  const employeesWithAttendance = [];

  employeesToUse.forEach((emp, idx) => {
    const dayData = {};
    let hasAnyData = false;

    if (attendanceMatrix.value[idx]) {
      attendanceMatrix.value[idx].forEach((d, dIdx) => {
        dayData[`day_${dIdx}`] = d;
        // Hiển thị nếu có bất kỳ dữ liệu nào: chấm công, nghỉ phép, hoặc chưa đủ giờ
        if (d.status && d.status !== '' && d.status !== null) {
          hasAnyData = true;
          console.log(`Employee ${emp.id}, Day ${dIdx}: ${d.status}, time: ${d.time}`);
        }
      });
    }

    // Thêm vào danh sách nếu có bất kỳ dữ liệu nào trong tháng
    if (hasAnyData) {
      employeesWithAttendance.push({
        id: emp.id,
        name: emp.name,
        detail: '',
        _idx: idx,
        ...dayData,
        ...emp
      });
    }
  });

  console.log('Employees with attendance displayed:', employeesWithAttendance.length);
  console.log('Final main summary data:', employeesWithAttendance);

  // Debug: Log attendance matrix for selected month
  console.log('=== ATTENDANCE MATRIX FOR SELECTED MONTH ===');
  console.log('Selected month:', selectedMonth.value);
  console.log('Attendance matrix length:', attendanceMatrix.value?.length);
  if (attendanceMatrix.value && attendanceMatrix.value.length > 0) {
    console.log('First employee attendance matrix:', attendanceMatrix.value[0]);
    console.log('Sample day data:', attendanceMatrix.value[0]?.[0]);
  }

  return employeesWithAttendance;
});

// Paginated data for main summary table
const paginatedMainSummaryData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return mainSummaryData.value.slice(startIndex, endIndex);
});

// Total pages for pagination
const totalPages = computed(() => {
  return Math.ceil(mainSummaryData.value.length / pageSize.value);
});

// Function to get visible page numbers for pagination
const getVisiblePages = () => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2; // Number of pages to show on each side of current page

  if (total <= 7) {
    // Show all pages if total is small
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const range = [];
  const rangeWithDots = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (current + delta < total - 1) {
    rangeWithDots.push('...', total);
  } else {
    rangeWithDots.push(total);
  }

  return rangeWithDots;
};

// Dummy data cho bảng tăng ca
const overtimeHeaders = computed(() => dayHeaders.value);
const overtimeColumns = computed(() => [
  { key: 'stt', label: 'STT', class: 'text-center col-stt' },
  { key: 'id', label: 'Mã NV', class: 'text-center col-id' },
  { key: 'name', label: 'Nhân viên', class: 'text-start col-name' },
  { key: 'detail', label: 'Chi tiết', class: 'text-center col-detail' },
  ...overtimeHeaders.value.map((day, idx) => ({ key: `day_${idx}`, label: day, class: 'text-center col-day' }))
]);

// Helper function to compare dates without timezone issues
function isSameDate(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// Helper function to format date for comparison
function formatDateForComparison(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Tạo dữ liệu tăng ca thực tế cho từng nhân viên, từng ngày từ API
function generateOvertimeForEmployee(employeeId) {
  console.log('=== OVERTIME DEBUG ===');
  console.log('Employee ID:', employeeId);
  console.log('Employee ID type:', typeof employeeId);
  console.log('Overtime requests:', overtimeRequests.value);
  console.log('Selected year:', selectedYear.value);
  console.log('Selected month:', selectedMonth.value);

  if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
    console.log('No overtime requests found');
    return overtimeHeaders.value.map(() => ({ type: '', hours: 0 }));
  }

  // Lọc các yêu cầu tăng ca của nhân viên này trong tháng được chọn
  const employeeOvertimeRequests = overtimeRequests.value.filter(request => {
    console.log('Checking request:', {
      employeeID: request.employeeID,
      targetEmployeeID: employeeId,
      approveStatus: request.approveStatus,
      startDateTime: request.startDateTime,
      employeeIDType: typeof request.employeeID,
      targetEmployeeIDType: typeof employeeId
    });

    // So sánh cả string và number, và normalize IDs
    const requestEmployeeId = String(request.employeeID).trim();
    const targetEmployeeId = String(employeeId).trim();
    
    const employeeMatch = requestEmployeeId === targetEmployeeId ||
      requestEmployeeId === String(targetEmployeeId) ||
      String(requestEmployeeId) === targetEmployeeId;

    const isApproved = request.approveStatus === 'Đã duyệt' || 
                      request.approveStatus === 'Approved' || 
                      request.approveStatus === 2 ||
                      request.approveStatus === '2';

    return employeeMatch && isApproved;
  });

  console.log('Filtered employee overtime requests:', employeeOvertimeRequests);

  return overtimeHeaders.value.map((day, dayIdx) => {
    // Tạo ngày hiện tại để so sánh
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1);
    const dateStr = formatDateForComparison(currentDate);

    console.log(`Processing day ${dayIdx}: ${day} -> ${dateStr}`);

    // Tìm yêu cầu tăng ca trong ngày này
    const dayOvertimeRequest = employeeOvertimeRequests.find(request => {
      const requestDateStr = formatDateForComparison(request.startDateTime);
      
      console.log('Comparing dates:', { 
        requestDateStr, 
        dateStr, 
        match: requestDateStr === dateStr,
        originalRequestDate: request.startDateTime,
        originalCurrentDate: currentDate.toISOString(),
        dayHeader: day,
        isSameDateCheck: isSameDate(request.startDateTime, currentDate)
      });
      return requestDateStr === dateStr;
    });

    if (dayOvertimeRequest) {
      console.log('Found overtime request for day:', dayIdx, dayOvertimeRequest);

      // Tính số giờ tăng ca
      const startTime = new Date(dayOvertimeRequest.startDateTime);
      const endTime = new Date(dayOvertimeRequest.endDateTime);
      const hours = Math.max(0, (endTime - startTime) / (1000 * 60 * 60)); // Chuyển đổi sang giờ

      // Xác định loại tăng ca - sử dụng tên thay vì ID
      let type = '';
      if (dayOvertimeRequest.overtimeFormName && dayOvertimeRequest.overtimeFormName.toLowerCase().includes('tính lương')) {
        type = 'paid'; // Tăng ca tính lương
      } else if (dayOvertimeRequest.overtimeFormName && dayOvertimeRequest.overtimeFormName.toLowerCase().includes('nghỉ bù')) {
        type = 'compensatory'; // Tăng ca nghỉ bù
      } else if (dayOvertimeRequest.overtimeFormID === 1) {
        type = 'paid'; // Fallback cho ID
      } else if (dayOvertimeRequest.overtimeFormID === 2) {
        type = 'compensatory'; // Fallback cho ID
      }

      console.log('Overtime data:', { type, hours, request: dayOvertimeRequest });
      return { type, hours, request: dayOvertimeRequest };
    }

    return { type: '', hours: 0 };
  });
}

const overtimeMatrix = computed(() => {
  console.log('=== OVERTIME MATRIX DEBUG ===');
  console.log('All employees:', allEmployees.value);
  console.log('All employees length:', allEmployees.value?.length);

  // Fallback to hardcoded employees if API employees are not available
  const employeesToUse = allEmployees.value && allEmployees.value.length > 0 ? allEmployees.value : employees;

  if (!employeesToUse || employeesToUse.length === 0) {
    console.log('No employees found');
    return [];
  }

  // Log first employee structure
  if (employeesToUse[0]) {
    console.log('First employee structure:', employeesToUse[0]);
    console.log('First employee ID:', employeesToUse[0].id, 'Type:', typeof employeesToUse[0].id);
  }

  return employeesToUse.map(emp => generateOvertimeForEmployee(emp.id));
});

const overtimeData = computed(() => {
  console.log('Computing overtime data...');
  console.log('Employees (allEmployees):', allEmployees.value);
  console.log('Overtime matrix:', overtimeMatrix.value);

  // Fallback to hardcoded employees if API employees are not available
  const employeesToUse = allEmployees.value && allEmployees.value.length > 0 ? allEmployees.value : employees;

  if (!employeesToUse || !overtimeMatrix.value) {
    console.log('Missing employees or overtime matrix');
    return [];
  }

  // Chỉ lấy những nhân viên có tăng ca trong tháng
  const employeesWithOvertime = [];

  employeesToUse.forEach((emp, idx) => {
    const dayData = {};
    let hasOvertime = false;

    if (overtimeMatrix.value[idx]) {
      overtimeMatrix.value[idx].forEach((d, dIdx) => {
        dayData[`day_${dIdx}`] = d;
        if (d.hours > 0) {
          hasOvertime = true;
          console.log(`Employee ${emp.id}, Day ${dIdx}: ${d.hours} hours, type: ${d.type}`);
        }
      });
    }

    // Chỉ thêm vào danh sách nếu có tăng ca
    if (hasOvertime) {
      const employee = {
        stt: employeesWithOvertime.length + 1,
        id: emp.id,
        name: emp.name,
        avatar: emp.avatar,
        _idx: idx,
        ...dayData,
        ...emp
      };

      // Calculate totals for the employee
      employee.totalOvertimeHours = getTotalOvertimeHours(employee);
      employee.totalOvertimeDays = getTotalOvertimeDays(employee);
      employee.totalOvertimeHoursWithCoeff = getTotalOvertimeHoursWithCoefficient(employee);
      employee.totalOvertimeDaysWithCoeff = getTotalOvertimeDaysWithCoefficient(employee);

      employeesWithOvertime.push(employee);
    }
  });

  console.log('Employees with overtime:', employeesWithOvertime.length);
  console.log('Final overtime data:', employeesWithOvertime);
  return employeesWithOvertime;
});

function getOvertimeCellClass(type) {
  if (type === 'compensatory') return 'cell-overtime-compensatory';
  if (type === 'paid') return 'cell-overtime-paid';
  return '';
}

// Helper functions for overtime calculations
function getTotalOvertimeHours(employee) {
  if (!employee) return 0;

  let totalHours = 0;
  overtimeHeaders.value.forEach((_, idx) => {
    const dayData = employee[`day_${idx}`];
    if (dayData && dayData.hours > 0) {
      totalHours += dayData.hours;
    }
  });

  return totalHours;
}

function getTotalOvertimeDays(employee) {
  if (!employee) return 0;

  let totalDays = 0;
  overtimeHeaders.value.forEach((_, idx) => {
    const dayData = employee[`day_${idx}`];
    if (dayData && dayData.hours > 0) {
      totalDays += dayData.hours / 8; // Convert hours to days (8 hours = 1 day)
    }
  });

  return Math.round(totalDays * 100) / 100;
}

function getTotalOvertimeHoursWithCoefficient(employee) {
  if (!employee) return 0;

  let totalHours = 0;
  overtimeHeaders.value.forEach((_, idx) => {
    const dayData = employee[`day_${idx}`];
    if (dayData && dayData.hours > 0) {
      const coefficient = dayData.request?.coefficient || 1; // Default to 1 if no coefficient
      totalHours += dayData.hours * coefficient;
    }
  });

  return Math.round(totalHours * 100) / 100;
}

function getTotalOvertimeDaysWithCoefficient(employee) {
  if (!employee) return 0;

  let totalDays = 0;
  overtimeHeaders.value.forEach((_, idx) => {
    const dayData = employee[`day_${idx}`];
    if (dayData && dayData.hours > 0) {
      const coefficient = dayData.request?.coefficient || 1; // Default to 1 if no coefficient
      totalDays += (dayData.hours / 8) * coefficient;
    }
  });

  return Math.round(totalDays * 100) / 100;
}

// Helper functions for specific day overtime calculations
function getDayOvertimeHours(employee, dayIdx) {
  if (!employee || dayIdx === null) return 0;
  const dayData = employee[`day_${dayIdx}`];
  return dayData && dayData.hours > 0 ? dayData.hours : 0;
}

function getDayOvertimeDays(employee, dayIdx) {
  if (!employee || dayIdx === null) return 0;
  const dayData = employee[`day_${dayIdx}`];
  return dayData && dayData.hours > 0 ? Math.round((dayData.hours / 8) * 100) / 100 : 0;
}

function getDayOvertimeHoursWithCoefficient(employee, dayIdx) {
  if (!employee || dayIdx === null) return 0;
  const dayData = employee[`day_${dayIdx}`];
  if (dayData && dayData.hours > 0) {
    const coefficient = dayData.request?.coefficient || 1; // Default to 1 if no coefficient
    return Math.round((dayData.hours * coefficient) * 100) / 100;
  }
  return 0;
}

function getDayOvertimeDaysWithCoefficient(employee, dayIdx) {
  if (!employee || dayIdx === null) return 0;
  const dayData = employee[`day_${dayIdx}`];
  if (dayData && dayData.hours > 0) {
    const coefficient = dayData.request?.coefficient || 1; // Default to 1 if no coefficient
    return Math.round(((dayData.hours / 8) * coefficient) * 100) / 100;
  }
  return 0;
}

// Function to check if there are any overtime requests in the current month
function hasOvertimeInMonth() {
  if (!overtimeRequests.value || overtimeRequests.value.length === 0) return false;

  const currentYear = selectedYear.value;
  const currentMonth = selectedMonth.value;

  return overtimeRequests.value.some(request => {
    const requestDate = new Date(request.startDateTime);
    return requestDate.getFullYear() === currentYear &&
      requestDate.getMonth() + 1 === currentMonth &&
      (request.approveStatus === 'Đã duyệt' || request.approveStatus === 'Approved');
  });
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

    // Filter data based on user role
    const hasHRPermission = isDirector.value || isHRManager.value || isHREmployee.value
    console.log('=== ATTENDANCE TAB DEBUG ===')
    console.log('hasHRPermission:', hasHRPermission)
    console.log('currentUser:', currentUser.value)
    console.log('currentUser.id:', currentUser.value?.id)
    console.log('Raw data before filtering:', data.length, 'records')
    console.log('Sample data structure:', data[0])
    
    if (!hasHRPermission && currentUser.value) {
      // Only show current user's data for non-HR users
      console.log('Filtering for non-HR user...')
      console.log('Looking for employeeID matching:', currentUser.value.id)
      
      // Debug: show all possible employee ID fields in data
      console.log('Sample item keys:', Object.keys(data[0] || {}))
      console.log('Looking for employee ID in fields:', {
        employeeID: data[0]?.employeeID,
        employeeCode: data[0]?.employeeCode,
        employeeId: data[0]?.employeeId,
        id: data[0]?.id,
        userId: data[0]?.userId
      })
      
      // Try different field names for employee ID, handle null values
      const employeeIdField = data[0]?.employeeCode || data[0]?.employeeID || data[0]?.employeeId || data[0]?.id
      console.log('Using field:', employeeIdField ? 'employeeCode' : 'employeeID')
      
      // Debug: show first few items with their employee codes
      console.log('First 3 items employee codes:', data.slice(0, 3).map(item => ({
        employeeCode: item.employeeCode,
        employeeName: item.employeeName,
        type: typeof item.employeeCode
      })))
      
      data = data.filter(item => {
        // Handle null/undefined values and try different field names
        const itemEmployeeId = item.employeeCode || item.employeeID || item.employeeId || item.id
        const matches = itemEmployeeId === currentUser.value.id
        
        // More detailed logging for debugging
        console.log(`Item: ${item.employeeName}, employeeCode: ${item.employeeCode} (${typeof item.employeeCode}), currentUser.id: ${currentUser.value.id} (${typeof currentUser.value.id}), matches: ${matches}`)
        
        return matches
      })
      console.log('Filtered attendance data for current user:', currentUser.value.id, 'Records:', data.length)
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
    
    // Also set attendanceList for generateAttendanceForEmployee function
    attendanceList.value = data

    console.log('Attendance data loaded:', attendanceData.value)
    console.log('AttendanceList set for personal tab:', attendanceList.value?.length || 0)
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
watch([selectedYear, selectedMonth], async () => {
  currentPage.value = 1 // Reset to first page when changing month/year
  if (activeTab.value === 'attendance') {
    selectedWeek.value = '' // Clear week filter when changing month
    loadAttendanceData()
  }
  if (activeTab.value === 'detail') {
    selectedWeek.value = '' // Clear week filter when changing month
    loadDetailData()
  }
  if (activeTab.value === 'overtime') {
    loadOvertimeData()
  }
  if (activeTab.value === 'summary') {
    // Reload attendance data and leave requests for summary
    await Promise.all([
      loadAttendanceDataForSummary(),
      fetchLeaveRequests()
    ])
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

    // Filter data based on user role
    const hasHRPermission = isDirector.value || isHRManager.value || isHREmployee.value
    console.log('=== DETAIL TAB DEBUG ===')
    console.log('hasHRPermission:', hasHRPermission)
    console.log('currentUser:', currentUser.value)
    console.log('currentUser.id:', currentUser.value?.id)
    console.log('Raw data before filtering:', data.length, 'records')
    console.log('Sample data structure:', data[0])
    
    if (!hasHRPermission && currentUser.value) {
      // Only show current user's data for non-HR users
      console.log('Filtering for non-HR user...')
      console.log('Looking for employeeID matching:', currentUser.value.id)
      
      // Debug: show all possible employee ID fields in data
      console.log('Sample item keys:', Object.keys(data[0] || {}))
      console.log('Looking for employee ID in fields:', {
        employeeID: data[0]?.employeeID,
        employeeCode: data[0]?.employeeCode,
        employeeId: data[0]?.employeeId,
        id: data[0]?.id,
        userId: data[0]?.userId
      })
      
      // Try different field names for employee ID, handle null values
      const employeeIdField = data[0]?.employeeCode || data[0]?.employeeID || data[0]?.employeeId || data[0]?.id
      console.log('Using field:', employeeIdField ? 'employeeCode' : 'employeeID')
      
      // Debug: show first few items with their employee codes
      console.log('First 3 items employee codes:', data.slice(0, 3).map(item => ({
        employeeCode: item.employeeCode,
        employeeName: item.employeeName,
        type: typeof item.employeeCode
      })))
      
      data = data.filter(item => {
        // Handle null/undefined values and try different field names
        const itemEmployeeId = item.employeeCode || item.employeeID || item.employeeId || item.id
        const matches = itemEmployeeId === currentUser.value.id
        
        // More detailed logging for debugging
        console.log(`Item: ${item.employeeName}, employeeCode: ${item.employeeCode} (${typeof item.employeeCode}), currentUser.id: ${currentUser.value.id} (${typeof currentUser.value.id}), matches: ${matches}`)
        
        return matches
      })
      console.log('Filtered detail data for current user:', currentUser.value.id, 'Records:', data.length)
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

// Load overtime data from API
const loadOvertimeData = async () => {
  try {
    console.log('Loading overtime data...');
    await fetchOvertimeRequests()
    console.log('Overtime requests loaded:', overtimeRequests.value);
  } catch (error) {
    console.error('Error loading overtime data:', error)
  }
}

// Load attendance data for summary
const loadAttendanceDataForSummary = async () => {
  try {
    console.log('Loading attendance data for summary...');
    const data = await attendanceDataService.getAttendanceDataByMonth(selectedYear.value, selectedMonth.value);
    attendanceList.value = data;
    console.log('Attendance data loaded for summary:', attendanceList.value);
  } catch (error) {
    console.error('Error loading attendance data for summary:', error)
  }
}

// Load real data for day modal
const loadDayModalData = async (employee, dayIdx) => {
  try {
    console.log('Loading day modal data for employee:', employee.id, 'day:', dayIdx);
    
    // Get the actual date from dayHeaders
    const selectedDateHeader = dayHeaders.value[dayIdx];
    const selectedDayMonth = selectedDateHeader.split(' ')[0]; // Extract "DD/MM" part
    const [day, month] = selectedDayMonth.split('/');
    
    // Create full date string in YYYY-MM-DD format
    const fullDate = `${selectedYear.value}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log('Loading data for date:', fullDate);
    
    // Load attendance data for this employee and date
    console.log('=== API CALL DEBUG ===');
    console.log('Calling API with employee ID:', employee.id);
    console.log('Calling API with date:', fullDate);
    
    const attendanceData = await attendanceDataService.getAttendanceDataByEmployeeAndDate(employee.id, fullDate);
    
    console.log('API Response:', attendanceData);
    console.log('API Response length:', attendanceData?.length);
    console.log('=== END API CALL DEBUG ===');
    
    // Get work shift information for this employee
    let workShiftInfo = null;
    if (attendanceData && attendanceData.length > 0) {
      // Try to get work shift ID from attendance data
      const workShiftId = attendanceData[0].workShiftID;
      console.log('WorkShift ID from attendance:', workShiftId);
      
      if (workShiftId) {
        // Find work shift details from workshifts data
        workShiftInfo = workshifts.value.find(shift => shift.id === workShiftId);
        console.log('Found work shift info:', workShiftInfo);
      }
    }
    
    // Transform attendance data to match expected format - bao gồm cả attendance và nghỉ phép
    const transformedAttendanceData = [];
    let sttCounter = 1;
    
    // 1. Thêm dữ liệu chấm công thực tế
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((item, index) => {
        // Create entry for check-in if exists
        if (item.checkInTime) {
          transformedAttendanceData.push({
            stt: sttCounter++,
            avatar: item.imageCheckIn || 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
            shiftName: item.shiftName,
            refCode: item.refCode || `MP${index + 1}`,
            date: new Date(item.workDate).toLocaleDateString('vi-VN'),
            scanTime: item.checkInTime.toString().substring(0, 5),
            type: 'Vào',
            location: item.machineName || 'Máy quét: Importfile'
          });
        }
        
        // Create entry for check-out if exists
        if (item.checkOutTime) {
          transformedAttendanceData.push({
            stt: sttCounter++,
            avatar: item.imageCheckOut || 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
            shiftName: item.shiftName,
            refCode: item.refCode || `MP${index + 1}`,
            date: new Date(item.workDate).toLocaleDateString('vi-VN'),
            scanTime: item.checkOutTime.toString().substring(0, 5),
            type: 'Ra',
            location: item.machineName || 'Máy quét: Importfile'
          });
        }
      });
    }
    
    // 2. Thêm dữ liệu nghỉ phép cho ngày này
    const dayLeaveRequestsForAttendance = leaveRequests.value.filter(leave => {
      const leaveStartDate = new Date(leave.startDateTime);
      const leaveEndDate = new Date(leave.endDateTime);
      const targetDate = new Date(fullDate);
      
      // Normalize dates to start of day for comparison
      leaveStartDate.setHours(0, 0, 0, 0);
      leaveEndDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      return leave.employeeID === employee.id && 
             (targetDate.getTime() >= leaveStartDate.getTime() && targetDate.getTime() <= leaveEndDate.getTime());
    });
    
    dayLeaveRequestsForAttendance.forEach(leave => {
      // Get work shift info for this leave request
      const leaveWorkShiftId = leave.workShiftID;
      const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
      
      // Get the day of week for the selected date
      const selectedDate = new Date(fullDate);
      const selectedDayOfWeek = selectedDate.getDay();
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const selectedDayName = dayNames[selectedDayOfWeek];
      
      // Find shift details for the selected day
      let leaveDayShiftDetail = null;
      if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
        leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
      }
      
      // Determine check-in and check-out times
      let checkInTime = new Date(leave.startDateTime);
      let checkOutTime = new Date(leave.endDateTime);
      
      // For multi-day leaves, adjust times based on the selected date
      const leaveStartDate = new Date(leave.startDateTime).toDateString();
      const leaveEndDate = new Date(leave.endDateTime).toDateString();
      const currentLeaveDate = selectedDate.toDateString();
      
      if (leaveStartDate !== leaveEndDate) {
        // Multi-day leave
        if (currentLeaveDate === leaveStartDate) {
          // Start day - use leave start time and shift end time
          if (leaveDayShiftDetail && leaveDayShiftDetail.endTime !== '00:00:00') {
            const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
            checkOutTime = new Date(selectedDate);
            checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
          }
        } else if (currentLeaveDate === leaveEndDate) {
          // End day - use shift start time and leave end time
          if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00') {
            const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
            checkInTime = new Date(selectedDate);
            checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
          }
        } else {
          // Middle day - use full shift hours
          if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
            const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
            const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
            checkInTime = new Date(selectedDate);
            checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
            checkOutTime = new Date(selectedDate);
            checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
          }
        }
      } else {
        // Single day leave - use shift hours if available
        if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
          const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
          const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
          checkInTime = new Date(selectedDate);
          checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
          checkOutTime = new Date(selectedDate);
          checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
        }
      }
      
      // Check if checkin is more than half of shift hours (treat as checkout)
      let isCheckinAfterHalfShift = false;
      if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
        const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
        const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
        const shiftDuration = (shiftEndTime - shiftStartTime) / (1000 * 60 * 60); // hours
        const halfShiftTime = new Date(shiftStartTime.getTime() + (shiftDuration * 30 * 60 * 1000)); // half shift in minutes
        
        // Check if leave start time is after half of shift
        const leaveStartTime = new Date(leave.startDateTime);
        const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
        
        if (leaveStartTimeOnly > halfShiftTime) {
          isCheckinAfterHalfShift = true;
        }
      }
      
      if (isCheckinAfterHalfShift) {
        // Only create checkout entry
        transformedAttendanceData.push({
          stt: sttCounter++,
          avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
          shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
          refCode: leave.voucherCode || `MP${leave.id}`,
          date: selectedDate.toLocaleDateString('vi-VN'),
          scanTime: checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Ra',
          location: 'Nghỉ phép'
        });
      } else {
        // Create both check-in and check-out entries
        transformedAttendanceData.push({
          stt: sttCounter++,
          avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
          shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
          refCode: leave.voucherCode || `MP${leave.id}`,
          date: selectedDate.toLocaleDateString('vi-VN'),
          scanTime: checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Vào',
          location: 'Nghỉ phép'
        });
        
        transformedAttendanceData.push({
          stt: sttCounter++,
          avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
          shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
          refCode: leave.voucherCode || `MP${leave.id}`,
          date: selectedDate.toLocaleDateString('vi-VN'),
          scanTime: checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'Ra',
          location: 'Nghỉ phép'
        });
      }
    });
    
    // 3. Thêm thông tin nghỉ phép cho tất cả các ngày trong khoảng nghỉ (nếu chưa có dữ liệu gì)
    if (transformedAttendanceData.length === 0 && dayLeaveRequestsForAttendance.length > 0) {
      dayLeaveRequestsForAttendance.forEach(leave => {
        // Get work shift info for this leave request
        const leaveWorkShiftId = leave.workShiftID;
        const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
        
        // Get the day of week for the selected date
        const selectedDate = new Date(fullDate);
        const selectedDayOfWeek = selectedDate.getDay();
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const selectedDayName = dayNames[selectedDayOfWeek];
        
        // Find shift details for the selected day
        let leaveDayShiftDetail = null;
        if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
          leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
        }
        
        // Determine check-in and check-out times
        let checkInTime = new Date(leave.startDateTime);
        let checkOutTime = new Date(leave.endDateTime);
        
        // For multi-day leaves, adjust times based on the selected date
        const leaveStartDate = new Date(leave.startDateTime).toDateString();
        const leaveEndDate = new Date(leave.endDateTime).toDateString();
        const currentLeaveDate = selectedDate.toDateString();
        
        if (leaveStartDate !== leaveEndDate) {
          // Multi-day leave
          if (currentLeaveDate === leaveStartDate) {
            // Start day - use leave start time and shift end time
            if (leaveDayShiftDetail && leaveDayShiftDetail.endTime !== '00:00:00') {
              const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
              checkOutTime = new Date(selectedDate);
              checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
            }
          } else if (currentLeaveDate === leaveEndDate) {
            // End day - use shift start time and leave end time
            if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00') {
              const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
              checkInTime = new Date(selectedDate);
              checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
            }
          } else {
            // Middle day - use full shift hours
            if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
              const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
              const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
              checkInTime = new Date(selectedDate);
              checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
              checkOutTime = new Date(selectedDate);
              checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
            }
          }
        } else {
          // Single day leave - use shift hours if available
          if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
            const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
            const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
            checkInTime = new Date(selectedDate);
            checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
            checkOutTime = new Date(selectedDate);
            checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
          }
        }
        
        // Check if checkin is more than half of shift hours (treat as checkout)
        let isCheckinAfterHalfShift = false;
        if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
          const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
          const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
          const shiftDuration = (shiftEndTime - shiftStartTime) / (1000 * 60 * 60); // hours
          const halfShiftTime = new Date(shiftStartTime.getTime() + (shiftDuration * 30 * 60 * 1000)); // half shift in minutes
          
          // Check if leave start time is after half of shift
          const leaveStartTime = new Date(leave.startDateTime);
          const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
          
          if (leaveStartTimeOnly > halfShiftTime) {
            isCheckinAfterHalfShift = true;
          }
        }
        
        if (isCheckinAfterHalfShift) {
          // Only create checkout entry
          transformedAttendanceData.push({
            stt: sttCounter++,
            avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
            shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
            refCode: leave.voucherCode || `MP${leave.id}`,
            date: selectedDate.toLocaleDateString('vi-VN'),
            scanTime: checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            type: 'Ra',
            location: 'Nghỉ phép'
          });
        } else {
          // Create both check-in and check-out entries
          transformedAttendanceData.push({
            stt: sttCounter++,
            avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
            shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
            refCode: leave.voucherCode || `MP${leave.id}`,
            date: selectedDate.toLocaleDateString('vi-VN'),
            scanTime: checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            type: 'Vào',
            location: 'Nghỉ phép'
          });
          
          transformedAttendanceData.push({
            stt: sttCounter++,
            avatar: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
            shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
            refCode: leave.voucherCode || `MP${leave.id}`,
            date: selectedDate.toLocaleDateString('vi-VN'),
            scanTime: checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            type: 'Ra',
            location: 'Nghỉ phép'
          });
        }
      });
    }
    
    attendanceHistory.value = transformedAttendanceData;
    
    // Generate work history data - bao gồm cả attendance và nghỉ phép
    const transformedWorkData = [];
    let workSttCounter = 1;
    
    // 1. Thêm dữ liệu từ attendance (có chấm công)
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((item, index) => {
        if (item.checkInTime && item.checkOutTime) {
          // Calculate work hours
          const checkInTime = new Date(`2000-01-01T${item.checkInTime}`);
          const checkOutTime = new Date(`2000-01-01T${item.checkOutTime}`);
          
          // Get shift details to calculate proper work hours and lunch break
          const shiftDetails = workShiftInfo?.shiftDetails || [];
          let totalWorkHours = 0;
          let shiftStart = null;
          let shiftEnd = null;
          
          // Get the day of week for the selected date
          const selectedDate = new Date(fullDate);
          const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          const currentDayName = dayNames[dayOfWeek];
          
          console.log('Selected date:', fullDate, 'Day of week:', dayOfWeek, 'Day name:', currentDayName);
          
          // Find shift details for the specific day
          const dayShiftDetail = shiftDetails.find(detail => detail.dayOfWeek === currentDayName);
          console.log('Found day shift detail:', dayShiftDetail);
          
          if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
            const startTime = new Date(`2000-01-01T${dayShiftDetail.startTime}`);
            const endTime = new Date(`2000-01-01T${dayShiftDetail.endTime}`);
            
            // Calculate work hours excluding lunch break for this specific day
            let workHours = (endTime - startTime) / (1000 * 60 * 60);
            
            // Subtract lunch break time if exists
            if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
                dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
              const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`);
              const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`);
              const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
              workHours -= breakHours;
              console.log('Lunch break hours for this day:', breakHours);
            }
            
            totalWorkHours = workHours;
            shiftStart = startTime;
            shiftEnd = endTime;
            
            console.log('Work hours for', currentDayName, ':', workHours);
          }
          
          // Debug shift details
          console.log('WorkShift Info:', workShiftInfo);
          console.log('Shift Details:', shiftDetails);
          console.log('Calculated shiftStart:', shiftStart?.toTimeString().substring(0, 5));
          console.log('Calculated shiftEnd:', shiftEnd?.toTimeString().substring(0, 5));
          console.log('TotalWorkHours (after subtracting lunch breaks):', totalWorkHours);
          
          // If no shift details, fallback to standard calculation
          if (totalWorkHours === 0) {
            totalWorkHours = 8; // Default 8 hours
            shiftStart = new Date('2000-01-01T08:30:00');
            shiftEnd = new Date('2000-01-01T17:30:00');
          }
          
          // Calculate actual work hours (total time minus lunch break)
          const totalTimeHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          const lunchBreakHours = totalTimeHours - totalWorkHours;
          const actualWorkHours = Math.max(0, totalTimeHours - Math.max(0, lunchBreakHours));
          const workDays = Math.round((actualWorkHours / 8) * 100) / 100;
          
          // Calculate late/early minutes using actual shift times
          const lateMinutes = Math.max(0, (checkInTime - shiftStart) / (1000 * 60));
          
          // For early calculation, we need to consider the actual shift end time
          // Calculate the expected end time based on actual work pattern
          let actualShiftEnd;
          
          // If we have actual check-in time, calculate expected end time based on work hours + lunch break
          if (checkInTime && totalWorkHours > 0) {
            // Expected end time = check-in time + work hours + lunch break
            const expectedEndTime = new Date(checkInTime.getTime() + (totalWorkHours * 60 * 60 * 1000) + (lunchBreakHours * 60 * 60 * 1000));
            actualShiftEnd = expectedEndTime;
          } else {
            // Fallback to shift end time
            actualShiftEnd = shiftEnd;
          }
          
          const earlyMinutes = Math.max(0, (actualShiftEnd - checkOutTime) / (1000 * 60));
          
          // Debug log for troubleshooting
          console.log('=== WORK HOUR CALCULATION DEBUG ===');
          console.log('CheckIn:', item.checkInTime, 'CheckOut:', item.checkOutTime);
          console.log('ShiftStart:', shiftStart?.toTimeString().substring(0, 5), 'ShiftEnd:', shiftEnd?.toTimeString().substring(0, 5));
          console.log('ActualShiftEnd:', actualShiftEnd?.toTimeString().substring(0, 5));
          console.log('TotalWorkHours (from shift):', totalWorkHours);
          console.log('TotalTimeHours (checkin-checkout):', totalTimeHours);
          console.log('LunchBreakHours:', lunchBreakHours);
          console.log('ActualWorkHours:', actualWorkHours);
          console.log('Expected end calculation: CheckIn + WorkHours + LunchBreak =', 
            checkInTime?.toTimeString().substring(0, 5), '+', totalWorkHours, '+', lunchBreakHours, '=', actualShiftEnd?.toTimeString().substring(0, 5));
          console.log('LateMinutes:', lateMinutes, 'EarlyMinutes:', earlyMinutes);
          console.log('=== END DEBUG ===');
          
          transformedWorkData.push({
            stt: workSttCounter++,
            shiftName: item.shiftName,
            standard: `${totalWorkHours.toFixed(2)}/${(totalWorkHours / 8).toFixed(2)}`,
            scanInOut: `Vào: ${item.checkInTime.toString().substring(0, 5)}, Ra: ${item.checkOutTime.toString().substring(0, 5)}`,
            lateEarly: `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`,
            workHour: `${actualWorkHours.toFixed(2)}/${workDays.toFixed(2)}`
          });
        }
      });
    }
    
    // 2. Thêm dữ liệu nghỉ phép cho ngày này với thông tin ca làm việc (chỉ khi không có chấm công thực tế)
    const dayLeaveRequestsForWork = leaveRequests.value.filter(leave => {
      const leaveStartDate = new Date(leave.startDateTime);
      const leaveEndDate = new Date(leave.endDateTime);
      const targetDate = new Date(fullDate);
      
      // Normalize dates to start of day for comparison
      leaveStartDate.setHours(0, 0, 0, 0);
      leaveEndDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      return leave.employeeID === employee.id && 
             (targetDate.getTime() >= leaveStartDate.getTime() && targetDate.getTime() <= leaveEndDate.getTime());
    });
    
    // Chỉ hiển thị nghỉ phép nếu không có chấm công thực tế
    if (transformedWorkData.length === 0) {
      dayLeaveRequestsForWork.forEach(leave => {
      // Get work shift info for this leave request
      const leaveWorkShiftId = leave.workShiftID;
      const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
      
      // Calculate work hours for this specific day of leave
      let leaveWorkHours = 0;
      let leaveShiftStart = null;
      let leaveShiftEnd = null;
      let leaveScanInOut = 'Vào: --:--, Ra: --:--';
      let leaveLateEarly = 'Nghỉ phép';
      
      if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
        // Get the day of week for the selected date (not leave start date)
        const selectedDate = new Date(fullDate);
        const selectedDayOfWeek = selectedDate.getDay();
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const selectedDayName = dayNames[selectedDayOfWeek];
        
        // Find shift details for the selected day
        const leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
        
        if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
          const startTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
          const endTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
          
          // Calculate work hours excluding lunch break
          let workHours = (endTime - startTime) / (1000 * 60 * 60);
          
          // Subtract lunch break time if exists
          if (leaveDayShiftDetail.breakStart && leaveDayShiftDetail.breakEnd && 
              leaveDayShiftDetail.breakStart !== '00:00:00' && leaveDayShiftDetail.breakEnd !== '00:00:00') {
            const breakStart = new Date(`2000-01-01T${leaveDayShiftDetail.breakStart}`);
            const breakEnd = new Date(`2000-01-01T${leaveDayShiftDetail.breakEnd}`);
            const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
            workHours -= breakHours;
          }
          
          leaveWorkHours = workHours;
          leaveShiftStart = startTime;
          leaveShiftEnd = endTime;
          
          // Set scan in/out times and calculate late/early based on leave type
          const leaveStartDate = new Date(leave.startDateTime).toDateString();
          const leaveEndDate = new Date(leave.endDateTime).toDateString();
          const currentLeaveDate = selectedDate.toDateString();
          
          if (leaveStartDate === leaveEndDate) {
            // Single day leave - calculate based on actual leave times vs shift times
            const leaveStartTime = new Date(leave.startDateTime);
            const leaveEndTime = new Date(leave.endDateTime);
            const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
            const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`);
            
            // Calculate late minutes (leave start time vs shift start time)
            const lateMinutes = Math.max(0, (leaveStartTimeOnly - startTime) / (1000 * 60));
            // Calculate early minutes (shift end time vs leave end time)
            const earlyMinutes = Math.max(0, (endTime - leaveEndTimeOnly) / (1000 * 60));
            
            leaveScanInOut = `Vào: ${leaveStartTime.toTimeString().substring(0, 5)}, Ra: ${leaveEndTime.toTimeString().substring(0, 5)}`;
            leaveLateEarly = `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`;
          } else {
            // Multi-day leave - check if this is start, middle, or end day
            if (currentLeaveDate === leaveStartDate) {
              // Start day - use leave start time to shift end time
              const leaveStartTime = new Date(leave.startDateTime);
              const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
              
              // Calculate late minutes for leave start time vs shift start time
              const lateMinutes = Math.max(0, (leaveStartTimeOnly - startTime) / (1000 * 60));
              // No early for start day since we use full shift end time
              const earlyMinutes = 0;
              
              leaveScanInOut = `Vào: ${leaveStartTime.toTimeString().substring(0, 5)}, Ra: ${leaveDayShiftDetail.endTime.substring(0, 5)}`;
              leaveLateEarly = `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`;
            } else if (currentLeaveDate === leaveEndDate) {
              // End day - use shift start time to leave end time
              const leaveEndTime = new Date(leave.endDateTime);
              const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`);
              
              // No late for end day since we use full shift start time
              const lateMinutes = 0;
              // Calculate early minutes for leave end time vs shift end time
              const earlyMinutes = Math.max(0, (endTime - leaveEndTimeOnly) / (1000 * 60));
              
              leaveScanInOut = `Vào: ${leaveDayShiftDetail.startTime.substring(0, 5)}, Ra: ${leaveEndTime.toTimeString().substring(0, 5)}`;
              leaveLateEarly = `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`;
            } else {
              // Middle day - use full shift hours
              leaveScanInOut = `Vào: ${leaveDayShiftDetail.startTime.substring(0, 5)}, Ra: ${leaveDayShiftDetail.endTime.substring(0, 5)}`;
              leaveLateEarly = 'Nghỉ phép';
            }
          }
        }
      }
      
      // Calculate work days
      const leaveWorkDays = Math.round((leaveWorkHours / 8) * 100) / 100;
      
        transformedWorkData.push({
          stt: workSttCounter++,
          shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo?.shiftName || 'N/A'})`,
          standard: `${leaveWorkHours.toFixed(2)}/${leaveWorkDays.toFixed(2)}`,
          scanInOut: leaveScanInOut,
          lateEarly: leaveLateEarly,
          workHour: `${leaveWorkHours.toFixed(2)}/${leaveWorkDays.toFixed(2)}`
        });
      });
    } else {
      // Nếu có chấm công thực tế, vẫn cần hiển thị nghỉ phép cho các ngày giữa (full ca làm việc)
      dayLeaveRequestsForWork.forEach(leave => {
        const leaveStartDate = new Date(leave.startDateTime);
        const leaveEndDate = new Date(leave.endDateTime);
        const targetDate = new Date(fullDate);
        
        // Normalize dates to start of day for comparison
        leaveStartDate.setHours(0, 0, 0, 0);
        leaveEndDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        // Chỉ hiển thị nếu đây là ngày giữa của nghỉ phép nhiều ngày
        const isStartDay = targetDate.getTime() === leaveStartDate.getTime();
        const isEndDay = targetDate.getTime() === leaveEndDate.getTime();
        const isMiddleDay = !isStartDay && !isEndDay && 
                           targetDate.getTime() > leaveStartDate.getTime() && 
                           targetDate.getTime() < leaveEndDate.getTime();
        
        if (isMiddleDay) {
          // Ngày giữa - hiển thị full ca làm việc
          const leaveWorkShiftId = leave.workShiftID;
          const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
          
          if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
            const selectedDate = new Date(fullDate);
            const selectedDayOfWeek = selectedDate.getDay();
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const selectedDayName = dayNames[selectedDayOfWeek];
            
            const leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
            
            if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
              const startTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
              const endTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
              
              // Calculate work hours excluding lunch break
              let workHours = (endTime - startTime) / (1000 * 60 * 60);
              if (leaveDayShiftDetail.breakStart && leaveDayShiftDetail.breakEnd && 
                  leaveDayShiftDetail.breakStart !== '00:00:00' && leaveDayShiftDetail.breakEnd !== '00:00:00') {
                const breakStart = new Date(`2000-01-01T${leaveDayShiftDetail.breakStart}`);
                const breakEnd = new Date(`2000-01-01T${leaveDayShiftDetail.breakEnd}`);
                const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
                workHours -= breakHours;
              }
              
              const workDays = Math.round((workHours / 8) * 100) / 100;
              
              transformedWorkData.push({
                stt: workSttCounter++,
                shiftName: `${leave.leaveTypeName || 'Nghỉ phép'} (${leaveWorkShiftInfo.shiftName || 'N/A'})`,
                standard: `${workHours.toFixed(2)}/${workDays.toFixed(2)}`,
                scanInOut: `Vào: ${leaveDayShiftDetail.startTime.substring(0, 5)}, Ra: ${leaveDayShiftDetail.endTime.substring(0, 5)}`,
                lateEarly: 'Nghỉ phép',
                workHour: `${workHours.toFixed(2)}/${workDays.toFixed(2)}`
              });
            }
          }
        }
      });
    }
    
    // 3. Thêm ca làm việc đã phân nhưng chưa có attendance (không chấm công)
    const dayShiftAssignments = shiftAssignments.value.filter(sa => {
      const assignmentDate = new Date(sa.workDate).toDateString();
      const targetDate = new Date(fullDate).toDateString();
      return sa.employeeID === employee.id && assignmentDate === targetDate;
    });
    
    dayShiftAssignments.forEach(assignment => {
      // Kiểm tra xem đã có attendance cho ca này chưa
      const hasAttendance = attendanceData && attendanceData.some(att => 
        att.workShiftID === assignment.workShiftID
      );
      
      if (!hasAttendance) {
        const workShift = workShifts.value.find(ws => ws.id === assignment.workShiftID);
        transformedWorkData.push({
          stt: workSttCounter++,
          shiftName: workShift ? workShift.shiftName : 'Ca chưa xác định',
          standard: '8.00/1.00',
          scanInOut: 'Vào: --:--, Ra: --:--',
          lateEarly: 'Chưa chấm công',
          workHour: '0.00/0.00'
        });
      }
    });
    
    // 4. Thêm thông tin nghỉ phép cho tất cả các ngày trong khoảng nghỉ (nếu chưa có dữ liệu gì)
    if (transformedWorkData.length === 0 && dayLeaveRequestsForWork.length > 0) {
      dayLeaveRequestsForWork.forEach(leave => {
        // Tạo thông tin nghỉ phép cho ngày này
        const startTime = new Date(leave.startDateTime);
        const endTime = new Date(leave.endDateTime);
        const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        
        transformedWorkData.push({
          stt: workSttCounter++,
          shiftName: 'Nghỉ phép',
          standard: '0.00/0.00',
          scanInOut: 'Vào: --:--, Ra: --:--',
          lateEarly: 'Nghỉ phép',
          workHour: '0.00/0.00'
        });
      });
    }
    
    workHistory.value = transformedWorkData;
    
    console.log('Day modal data loaded:', {
      attendanceHistory: attendanceHistory.value,
      workHistory: workHistory.value,
      dayLeaveRequestsForAttendance: dayLeaveRequestsForAttendance,
      dayLeaveRequestsForWork: dayLeaveRequestsForWork,
      dayShiftAssignments: dayShiftAssignments
    });
    
  } catch (error) {
    console.error('Error loading day modal data:', error);
    console.error('Error details:', error.response?.data);
    console.error('Error status:', error.response?.status);
    dayModalError.value = error.message || 'Không thể tải dữ liệu chi tiết ngày công';
    // Set empty data on error
    attendanceHistory.value = [];
    workHistory.value = [];
  } finally {
    dayModalLoading.value = false;
  }
}

// Load attendance data on component mount
onMounted(async () => {
  console.log('=== MOUNTING COMPONENT ===');

  // Load employees first
  console.log('Fetching all employees...');
  await fetchAllEmployees()
  console.log('Employees loaded:', allEmployees.value);

  // Debug: Check for manager1-id employee
  const manager1Employee = allEmployees.value.find(emp => emp.id === 'manager1-id');
  console.log('Manager1 employee found:', manager1Employee);

  // Load work shifts
  console.log('Fetching work shifts...');
  await fetchWorkShifts()
  console.log('Work shifts loaded:', workshifts.value);

  // Load shift assignments
  console.log('Fetching shift assignments...');
  await fetchAllShiftAssignments()
  console.log('Shift assignments loaded:', shiftAssignments.value);

  // Load leave types
  console.log('Fetching leave types...');
  await fetchLeaveTypes()
  console.log('Leave types loaded:', leaveTypes.value);

  // Load leave requests
  console.log('Fetching leave requests...');
  try {
    await fetchLeaveRequests()
    console.log('Leave requests loaded successfully');
    console.log('Leave requests count:', leaveRequests.value?.length || 0);
    
    // Debug: Show sample leave requests
    if (leaveRequests.value && leaveRequests.value.length > 0) {
      console.log('Sample leave requests:', leaveRequests.value.slice(0, 3));
      console.log('Leave request approve statuses:', leaveRequests.value.map(lr => lr.approveStatus));
    }
    
    // Debug: Check for shift assignments for manager1-id
    const manager1Shifts = shiftAssignments.value.filter(sa => sa.employeeID === 'manager1-id');
    console.log('Manager1 shift assignments:', manager1Shifts);
    
    // Debug: Check for attendance data for manager1-id
    const manager1Attendance = attendanceData.value.filter(att => att.employeeID === 'manager1-id');
    console.log('Manager1 attendance data:', manager1Attendance);

    // Check if we might need pagination or if data is complete
    if (leaveRequests.value && leaveRequests.value.length > 0) {
      console.log('Sample leave request:', leaveRequests.value[0]);

      // Check date range of loaded data
      const dates = leaveRequests.value.map(req => new Date(req.startDateTime));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      console.log('Date range of leave requests:', {
        earliest: minDate.toISOString().split('T')[0],
        latest: maxDate.toISOString().split('T')[0]
      });
    }
  } catch (error) {
    console.error('Error fetching leave requests:', error);
  }

  // Debug: Log first few leave requests to see structure
  if (leaveRequests.value && leaveRequests.value.length > 0) {
    console.log('First leave request structure:', leaveRequests.value[0]);
    console.log('Leave request fields:', Object.keys(leaveRequests.value[0]));
  }

  // Debug: Log all leave requests to see what's available
  if (leaveRequests.value && leaveRequests.value.length > 0) {
    console.log('=== ALL LEAVE REQUESTS ===');
    console.log('Total leave requests:', leaveRequests.value.length);

    // Group by month for easier analysis
    const leaveByMonth = {};
    leaveRequests.value.forEach((request, index) => {
      const startDate = new Date(request.startDateTime);
      const month = startDate.getMonth() + 1; // 1-12
      const year = startDate.getFullYear();
      const monthKey = `${month}/${year}`;

      if (!leaveByMonth[monthKey]) {
        leaveByMonth[monthKey] = [];
      }
      leaveByMonth[monthKey].push(request);

      console.log(`Leave request ${index + 1}:`, {
        employeeID: request.employeeID,
        approveStatus: request.approveStatus,
        startDateTime: request.startDateTime,
        endDateTime: request.endDateTime,
        workShiftID: request.workShiftID,
        leaveTypeName: request.leaveTypeName,
        month: month,
        year: year
      });
    });

    // Log summary by month
    console.log('=== LEAVE REQUESTS BY MONTH ===');
    Object.keys(leaveByMonth).forEach(monthKey => {
      const approvedCount = leaveByMonth[monthKey].filter(req =>
        req.approveStatus === 'Đã duyệt' || req.approveStatus === 'Approved'
      ).length;
      console.log(`${monthKey}: ${leaveByMonth[monthKey].length} total, ${approvedCount} approved`);
    });

    // Special focus on October
    const octoberRequests = leaveRequests.value.filter(request => {
      const startDate = new Date(request.startDateTime);
      return startDate.getMonth() === 9; // October is month 9 (0-indexed)
    });

    console.log('=== OCTOBER 2024 LEAVE REQUESTS ===');
    console.log('Total October requests:', octoberRequests.length);
    octoberRequests.forEach((request, index) => {
      console.log(`October request ${index + 1}:`, {
        employeeID: request.employeeID,
        approveStatus: request.approveStatus,
        startDateTime: request.startDateTime,
        endDateTime: request.endDateTime,
        workShiftID: request.workShiftID,
        leaveTypeName: request.leaveTypeName
      });
    });
  }

  // Then load other data
  loadAttendanceData()
  loadDetailData()
  loadOvertimeData()
  // loadAttendanceDataForSummary() - removed to avoid duplicate loading
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

// Personal attendance tab logic
const personalAttendanceColumns = computed(() => {
  const baseColumns = [
    { key: 'date', label: 'Ngày', width: '120px' },
    { key: 'dayOfWeek', label: 'Thứ', width: '80px' }
  ]
  
  // Add 7 columns for days of week
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  dayNames.forEach((dayName, index) => {
    baseColumns.push({
      key: `day_${index}`,
      label: dayName,
      width: '100px'
    })
  })
  
  return baseColumns
})

const personalAttendanceData = computed(() => {
  if (!currentUser.value) return []
  
  const year = selectedYear.value
  const month = selectedMonth.value - 1 // JavaScript months are 0-indexed
  
  // Get all days in the selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Generate attendance data for current user using the same logic as summary tab
  console.log('=== PERSONAL TAB DEBUG ===')
  console.log('Current user:', currentUser.value)
  console.log('User ID:', currentUser.value.id)
  console.log('User name:', currentUser.value.firstName + ' ' + currentUser.value.lastName)
  
  const userAttendanceData = generateAttendanceForEmployee(currentUser.value.id, currentUser.value.firstName + ' ' + currentUser.value.lastName)
  
  console.log('Generated user attendance data:', userAttendanceData)
  console.log('First few days:', userAttendanceData?.slice(0, 5))
  
  // Create calendar structure - weeks as rows, days as columns
  const weeks = []
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month, daysInMonth)
  
  // Find the first Sunday of the calendar (might be in previous month)
  const firstSunday = new Date(firstDayOfMonth)
  firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())
  
  // Generate weeks
  let currentDate = new Date(firstSunday)
  while (currentDate <= lastDayOfMonth || currentDate.getDay() !== 0) {
    const week = []
    
    // Generate 7 days for this week
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellDate = new Date(currentDate)
      const day = cellDate.getDate()
      const cellMonth = cellDate.getMonth()
      const cellYear = cellDate.getFullYear()
      
      // Only show days that belong to the selected month
      const isCurrentMonth = cellMonth === month && cellYear === year
      
      const dayData = {
        day: isCurrentMonth ? day : '',
        date: isCurrentMonth ? `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}` : '',
        fullDate: isCurrentMonth ? cellDate : null,
        isCurrentMonth: isCurrentMonth,
        dayOfWeek: dayOfWeek,
        attendance: null
      }
      
      // Add attendance data if it's a day in current month
      if (isCurrentMonth) {
        const dayIndex = day - 1 // Convert to 0-based index
        console.log(`Day ${day} (index ${dayIndex}):`, userAttendanceData?.[dayIndex])
        
        if (userAttendanceData && userAttendanceData[dayIndex]) {
          const attendanceInfo = userAttendanceData[dayIndex]
          console.log(`Day ${day} attendance info:`, attendanceInfo)
          
          dayData.attendance = {
            status: attendanceInfo.status,
            time: attendanceInfo.time,
            type: attendanceInfo.type,
            class: attendanceInfo.status
          }
        } else {
          console.log(`Day ${day}: No attendance data found`)
          dayData.attendance = {
            status: '',
            time: '',
            type: '',
            class: 'empty'
          }
        }
      }
      
      week.push(dayData)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    weeks.push(week)
    
    // Break if we've passed the last day of the month and it's Sunday
    if (currentDate > lastDayOfMonth && currentDate.getDay() === 0) {
      break
    }
  }
  
  return weeks
})

// Personal Overtime Data
const personalOvertimeData = computed(() => {
  if (!currentUser.value) return []
  
  const year = selectedYear.value
  const month = selectedMonth.value - 1 // JavaScript months are 0-indexed
  
  // Get all days in the selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Filter overtime requests for current user only
  const userOvertimeRequests = overtimeRequests.value.filter(request => {
    const matches = request.employeeID === currentUser.value.id
    console.log(`Overtime request ${request.id}: employeeID=${request.employeeID}, currentUser.id=${currentUser.value.id}, matches=${matches}`)
    return matches
  })
  
  console.log('=== PERSONAL OVERTIME DEBUG ===')
  console.log('Current user:', currentUser.value)
  console.log('User overtime requests:', userOvertimeRequests.length)
  console.log('Sample overtime request:', userOvertimeRequests[0])
  console.log('Overtime requests structure:', userOvertimeRequests.map(r => ({
    id: r.id,
    employeeID: r.employeeID,
    overtimeTypeName: r.overtimeTypeName,
    approveStatus: r.approveStatus,
    startDateTime: r.startDateTime
  })))
  
  // Group overtime by date
  const overtimeByDate = {}
  userOvertimeRequests.forEach(request => {
    const requestDate = new Date(request.startDateTime)
    const dateKey = `${requestDate.getFullYear()}-${String(requestDate.getMonth() + 1).padStart(2, '0')}-${String(requestDate.getDate()).padStart(2, '0')}`
    
    if (!overtimeByDate[dateKey]) {
      overtimeByDate[dateKey] = []
    }
    overtimeByDate[dateKey].push(request)
  })
  
  // Create calendar structure - weeks as rows, days as columns
  const weeks = []
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month, daysInMonth)
  
  // Find the first Sunday of the calendar (might be in previous month)
  const firstSunday = new Date(firstDayOfMonth)
  firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())
  
  // Generate weeks
  let currentDate = new Date(firstSunday)
  while (currentDate <= lastDayOfMonth || currentDate.getDay() !== 0) {
    const week = []
    
    // Generate 7 days for this week
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellDate = new Date(currentDate)
      const day = cellDate.getDate()
      const cellMonth = cellDate.getMonth()
      const cellYear = cellDate.getFullYear()
      
      // Only show days that belong to the selected month
      const isCurrentMonth = cellMonth === month && cellYear === year
      
      const dayData = {
        day: isCurrentMonth ? day : '',
        date: isCurrentMonth ? `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}` : '',
        fullDate: isCurrentMonth ? cellDate : null,
        isCurrentMonth: isCurrentMonth,
        dayOfWeek: dayOfWeek,
        overtime: null
      }
      
      // Add overtime data if it's a day in current month
      if (isCurrentMonth) {
        const dateKey = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        
        if (overtimeByDate[dateKey]) {
          const dayOvertime = overtimeByDate[dateKey]
          const approvedOvertime = dayOvertime.filter(ot => 
            ot.approveStatus === 'Đã duyệt' || ot.approveStatus === 'Approved' || ot.approveStatus === 2
          )
          
          if (approvedOvertime.length > 0) {
            const totalHours = approvedOvertime.reduce((total, ot) => {
              const startTime = new Date(ot.startDateTime)
              const endTime = new Date(ot.endDateTime)
              const hours = (endTime - startTime) / (1000 * 60 * 60)
              return total + hours
            }, 0)
            
            // Phân loại theo hình thức tăng ca (overtimeTypeName)
            const overtimeType = approvedOvertime[0].overtimeTypeName || ''
            let statusClass = 'overtime'
            
            console.log(`Overtime type for day ${day}: "${overtimeType}"`)
            
            // Phân loại theo hình thức tăng ca
            if (overtimeType.toLowerCase().includes('nghỉ bù') || overtimeType.toLowerCase().includes('compensatory') || overtimeType.toLowerCase().includes('bù')) {
              statusClass = 'compensatory'  // Tăng ca nghỉ bù - màu xanh lá
              console.log(`Classified as compensatory (nghỉ bù): ${statusClass}`)
            } else if (overtimeType.toLowerCase().includes('tính lương') || overtimeType.toLowerCase().includes('paid') || overtimeType.toLowerCase().includes('lương')) {
              statusClass = 'paid'  // Tăng ca tính lương - màu tím
              console.log(`Classified as paid (tính lương): ${statusClass}`)
            } else if (overtimeType.toLowerCase().includes('thường') || overtimeType.toLowerCase().includes('normal') || overtimeType.toLowerCase().includes('regular')) {
              statusClass = 'overtime'  // Tăng ca thường - màu tím
              console.log(`Classified as regular overtime: ${statusClass}`)
            } else {
              console.log(`Unknown overtime type, using default: ${statusClass}`)
            }
            
            dayData.overtime = {
              status: statusClass,
              time: `${totalHours.toFixed(1)}h`,
              type: approvedOvertime[0].overtimeTypeName,
              class: statusClass,
              requests: approvedOvertime
            }
          } else {
            dayData.overtime = {
              status: '',
              time: '',
              type: '',
              class: 'empty'
            }
          }
        } else {
          dayData.overtime = {
            status: '',
            time: '',
            type: '',
            class: 'empty'
          }
        }
      }
      
      week.push(dayData)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    weeks.push(week)
    
    // Break if we've passed the last day of the month and it's Sunday
    if (currentDate > lastDayOfMonth && currentDate.getDay() === 0) {
      break
    }
  }
  
  return weeks
})

const getPersonalCellClass = (statusClass) => {
  // Use the same class mapping as summary tab + overtime types
  const classMap = {
    'work': 'personal-cell work',
    'leave': 'personal-cell leave',
    'insufficient': 'personal-cell insufficient',
    'incomplete': 'personal-cell incomplete',
    'late': 'personal-cell late',
    'other': 'personal-cell other',
    'overtime': 'personal-cell overtime',
    'compensatory': 'personal-cell compensatory',
    'paid': 'personal-cell paid',
    'empty': 'personal-cell empty'
  }
  return classMap[statusClass] || 'personal-cell empty'
}

const getPersonalCellTitle = (dayData) => {
  if (!dayData.attendance || dayData.attendance.class === 'empty') return ''
  
  // Use the same status mapping as summary tab
  const statusMap = {
    'work': 'Đi làm',
    'leave': 'Nghỉ phép',
    'insufficient': 'Chưa đủ giờ công',
    'incomplete': 'Quên checkin/checkout',
    'late': 'Đi trễ',
    'other': 'Khác'
  }
  
  return `${dayData.attendance.time} - ${statusMap[dayData.attendance.class] || ''}`
}

const getPersonalOvertimeCellTitle = (dayData) => {
  if (!dayData.overtime || dayData.overtime.class === 'empty') return ''
  
  const statusMap = {
    'overtime': 'Tăng ca thường',
    'compensatory': 'Tăng ca nghỉ bù',
    'paid': 'Tăng ca tính lương'
  }
  
  return `${dayData.overtime.time} - ${statusMap[dayData.overtime.class] || 'Tăng ca'}`
}

// Helper function to get employee full name (similar to ProfileView.vue)
const getEmployeeFullName = (employee) => {
  if (!employee) return null
  if (employee.fullName) return employee.fullName
  if (employee.firstName && employee.lastName) {
    return `${employee.firstName} ${employee.lastName}`
  }
  return null
}
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Thay thế TabBar hiện tại bằng đoạn sau -->
    <div class="attendance-tabs-bar">
      <div v-for="tab in visibleTabs" :key="tab.key" class="tab-bar-item" :class="{ active: activeTab === tab.key }"
        @click="selectTab(tab.key)">
        <i :class="tab.icon + ' tab-bar-icon'"></i>
        {{ tab.label }}
      </div>
      <div v-if="hiddenTabs.length" class="tab-bar-item more-tab" @click="showMoreTabs = !showMoreTabs">
        <i class="fas fa-ellipsis-h tab-bar-icon"></i> Thêm
        <div v-if="showMoreTabs" class="more-tabs-dropdown">
          <div v-for="tab in hiddenTabs" :key="tab.key" class="dropdown-tab-item"
            :class="{ active: activeTab === tab.key }" @click="selectTab(tab.key)">
            <i :class="tab.icon + ' dropdown-tab-icon'"></i>
            {{ tab.label }}
          </div>
        </div>
      </div>
    </div>
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="activeTab === 'summary'">
          <!-- Compact Header Section -->
          <div class="summary-header-compact mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body py-3">
                <div class="row align-items-center">
                  <div class="col-lg-8">
                    <div class="d-flex align-items-center">
                      <div class="summary-icon-wrapper me-3">
                        <i class="fas fa-table"></i>
                      </div>
                      <div class="flex-grow-1">
                        <h5 class="mb-1 text-primary fw-bold">
                          <i class="fas fa-chart-bar me-2"></i>
                          Bảng tổng hợp công
                        </h5>
                        <p class="mb-0 text-muted small">
                          <i class="fas fa-info-circle me-1"></i>
                          Tổng quan chấm công của tất cả nhân viên
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-4">
                    <div class="filter-section">
                      <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" :show-date-range="false"
                        :show-refresh-button="false" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="legend-section mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body py-3">
                <h6 class="card-title mb-3">
                  <i class="fas fa-palette me-2"></i>
                  Chú thích màu sắc
                </h6>
                <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center">
                  <div class="legend-item">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Đi làm</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#007bff"></span>
                    <span class="legend-text">Nghỉ phép</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#ffc107"></span>
                    <span class="legend-text">Chưa đủ giờ công</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#dc3545"></span>
                    <span class="legend-text">Quên checkin/checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="attendance-summary-table">
            <DataTable :columns="mainSummaryColumns" :data="paginatedMainSummaryData">
              <template #detail="{ item }">
                <button class="btn btn-sm btn-outline-primary" @click.stop="openEmployeeModal(item)"><i
                    class="fa-solid fa-eye"></i></button>
              </template>
              <template #id="{ item }">
                <span class="emp-id fw-bold text-primary">{{ item.id }}</span>
              </template>
              <template #name="{ item }">
                <span class="fw-bold">{{ item.name }}</span>
              </template>
              <template v-for="(day, idx) in dayHeaders" v-slot:[`day_${idx}`]="{ item }">
                <div class="schedule-cell-modern" :class="getCellClass(item._idx, idx)"
                  :title="getCellTitle(item._idx, idx)" @click.stop="openDayModal(item, idx)" style="cursor:pointer;">
                  <span class="cell-time">{{ item[`day_${idx}`]?.time }}</span>
                </div>
              </template>
            </DataTable>

            <!-- Pagination for main summary table -->
            <div class="d-flex justify-content-between align-items-center mt-3" v-if="totalPages > 1">
              <div class="pagination-info">
                Hiển thị {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize,
                mainSummaryData.length) }}
                trong tổng số {{ mainSummaryData.length }} nhân viên
              </div>
              <nav aria-label="Main summary pagination">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">
                      <i class="fas fa-angle-double-left"></i>
                    </button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                      <i class="fas fa-angle-left"></i>
                    </button>
                  </li>

                  <!-- Page numbers -->
                  <li v-for="page in getVisiblePages()" :key="page" class="page-item"
                    :class="{ active: page === currentPage }">
                    <button class="page-link" @click="currentPage = page">{{ page }}</button>
                  </li>

                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                      <i class="fas fa-angle-right"></i>
                    </button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
                      <i class="fas fa-angle-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

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
                  <span class="fw-bold">Ngày đi làm: </span>
                  <span>{{ selectedDateIdx !== null ? dayHeaders[selectedDateIdx] : '' }}</span>
                </div>
              </div>

              <!-- Loading State -->
              <div v-if="dayModalLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
                <p class="mt-2">Đang tải dữ liệu chi tiết...</p>
              </div>

              <!-- Error State -->
              <div v-else-if="dayModalError" class="alert alert-danger">
                <div class="d-flex align-items-center justify-content-between">
                  <div>
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    {{ dayModalError }}
                  </div>
                  <button class="btn btn-outline-danger btn-sm" @click="openDayModal(selectedEmployee, selectedDateIdx)" :disabled="dayModalLoading">
                    <i class="fas fa-redo me-1"></i>
                    Thử lại
                  </button>
                </div>
              </div>

              <!-- Data Content -->
              <div v-else>
                <div class="modal-section">
                  <div class="section-title"><i class="fas fa-fingerprint"></i> Dữ liệu chấm công</div>
                  <div v-if="filteredAttendanceHistory.length > 0">
                    <DataTable :columns="attendanceColumnsNoActions" :data="filteredAttendanceHistory">
                      <template #avatar="{ item }">
                        <img v-if="item.avatar" :src="item.avatar" alt="avatar" class="table-avatar" />
                      </template>
                      <template #refCode="{ item }">
                        <!-- Debug info -->

                        
                        <span 
                          v-if="item.refCode && (item.location === 'Nghỉ phép' || item.shiftName?.includes('Nghỉ phép') || item.shiftName?.includes('Phép năm') || item.shiftName?.includes('Nghỉ bù'))" 
                          class="voucher-code-link text-primary cursor-pointer"
                          @click="openLeaveFormModal(item.refCode)"
                          :title="'Click để xem chi tiết phiếu nghỉ phép'"
                        >
                          <i class="fas fa-file-alt me-1"></i>
                          {{ item.refCode }}
                        </span>
                        <span v-else-if="item.refCode" class="text-muted">
                          {{ item.refCode }}
                        </span>
                        <span v-else class="text-muted">--</span>
                      </template>
                    </DataTable>
                  </div>
                  <div v-else class="text-center py-3 text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    Không có dữ liệu chấm công cho ngày này
                  </div>
                </div>
                <div class="modal-section">
                  <div class="section-title"><i class="fas fa-calendar-alt"></i> Lịch làm việc</div>
                  <div v-if="filteredWorkHistory.length > 0">
                    <DataTable :columns="workColumnsNoActions" :data="filteredWorkHistory">
                      <template #scanInOut="{ item }">
                        <div>
                          <span class="scan-label">Vào:</span>
                          <span class="scan-value">{{ item.scanInOut && item.scanInOut.includes(',') ? item.scanInOut.split(',')[0]?.replace('Vào:', '').trim() || '--:--' : '--:--' }}</span><br>
                          <span class="scan-label">Ra:</span>
                          <span class="scan-value">{{ item.scanInOut && item.scanInOut.includes(',') ? item.scanInOut.split(',')[1]?.replace('Ra:', '').trim() || '--:--' : '--:--' }}</span>
                        </div>
                      </template>
                    </DataTable>
                  </div>
                  <div v-else class="text-center py-3 text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    Không có dữ liệu lịch làm việc cho ngày này
                  </div>
                </div>
              </div>
              <!-- ModalDialog cho chi tiết tổng hợp nhân viên -->
            </ModalDialog>

            <!-- ModalDialog cho chi tiết từng ngày -->
            
            <!-- ModalDialog cho LeaveForm -->
            <ModalDialog :show="showLeaveFormModal" title="Chi tiết phiếu nghỉ phép" size="lg" scrollable
              @update:show="showLeaveFormModal = $event">
              <LeaveForm 
                v-if="selectedLeaveRequest"
                mode="update"
                :leave="selectedLeaveRequest"
                :employees="employees"
                :leaveTypes="leaveTypes"
                :workShifts="workshifts"
                :currentUser="currentUser"
                @close="closeLeaveFormModal"
                @submit="closeLeaveFormModal"
                @submit-for-approval="closeLeaveFormModal"
              />
            </ModalDialog>
          </div>
        </div>
        
        <!-- Personal Attendance Tab -->
        <div v-else-if="activeTab === 'personal'">
          <!-- Compact Header Section -->
          <div class="personal-header-compact mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body py-3">
                <div class="row align-items-center">
                  <div class="col-lg-8">
                    <div class="d-flex align-items-center">
                      <div class="personal-icon-wrapper me-3">
                        <i class="fas fa-user-clock"></i>
                      </div>
                      <div class="flex-grow-1">
                        <h5 class="mb-1 text-primary fw-bold">
                          <i class="fas fa-calendar-check me-2"></i>
                          Bảng công cá nhân
                        </h5>
                        <div v-if="currentUser" class="employee-info-compact">
                          <div class="info-item">
                            <span class="info-label">Mã NV:</span>
                            <span class="info-value">{{ currentUser.id }}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">Tên:</span>
                            <span class="info-value">{{ getEmployeeFullName(currentUser) || currentUser.fullName || (currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : 'N/A') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-4">
                    <div class="filter-section">
                      <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" :show-date-range="false"
                        :show-refresh-button="false" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="legend-section mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-title mb-3">
                  <i class="fas fa-palette me-2"></i>
                  Chú thích màu sắc
                </h6>
                <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center">
                  <div class="legend-item">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Đi làm</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#007bff"></span>
                    <span class="legend-text">Nghỉ phép</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#ffc107"></span>
                    <span class="legend-text">Chưa đủ giờ công</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#dc3545"></span>
                    <span class="legend-text">Quên checkin/checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Personal Attendance Calendar -->
          <div class="personal-attendance-calendar">
            <div class="calendar-header">
              <div class="calendar-day-header">CN</div>
              <div class="calendar-day-header">T2</div>
              <div class="calendar-day-header">T3</div>
              <div class="calendar-day-header">T4</div>
              <div class="calendar-day-header">T5</div>
              <div class="calendar-day-header">T6</div>
              <div class="calendar-day-header">T7</div>
            </div>
            
            <div v-for="(week, weekIndex) in personalAttendanceData" :key="weekIndex" class="calendar-week">
              <div v-for="(day, dayIndex) in week" :key="dayIndex" class="calendar-day">
                <div v-if="day.isCurrentMonth" 
                     :class="getPersonalCellClass(day.attendance?.class || 'empty')"
                     :title="getPersonalCellTitle(day)">
                  <div class="day-number">{{ day.day }}</div>
                  <div class="day-time">{{ day.attendance?.time || '' }}</div>
                </div>
                <div v-else class="calendar-day-empty"></div>
              </div>
            </div>
          </div>

          <!-- Summary Statistics -->
          <div v-if="personalAttendanceData.length > 0" class="row mt-4">
            <div class="col-md-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-gradient-primary text-white">
                  <h6 class="mb-0">
                    <i class="fas fa-chart-bar me-2"></i>
                    Thống kê tháng {{ selectedMonth }}/{{ selectedYear }}
                  </h6>
                </div>
                <div class="card-body">
                  <div class="row text-center">
                    <div class="col-md-2">
                      <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                          <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-number">{{ personalAttendanceData.flat().filter(d => d.isCurrentMonth && d.attendance?.class === 'work').length }}</div>
                        <div class="stat-label">Ngày đi làm</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-times"></i>
                        </div>
                        <div class="stat-number">{{ personalAttendanceData.flat().filter(d => d.isCurrentMonth && d.attendance?.class === 'leave').length }}</div>
                        <div class="stat-label">Nghỉ phép</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                          <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-number">{{ personalAttendanceData.flat().filter(d => d.isCurrentMonth && d.attendance?.class === 'insufficient').length }}</div>
                        <div class="stat-label">Chưa đủ giờ</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                          <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-number">{{ personalAttendanceData.flat().filter(d => d.isCurrentMonth && d.attendance?.class === 'incomplete').length }}</div>
                        <div class="stat-label">Quên checkin/checkout</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-secondary">
                        <div class="stat-icon">
                          <i class="fas fa-hourglass-half"></i>
                        </div>
                        <div class="stat-number">{{ personalAttendanceData.flat().filter(d => d.isCurrentMonth && d.attendance?.class === 'late').length }}</div>
                        <div class="stat-label">Đi trễ</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-primary">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-number">{{ personalAttendanceData.flat().filter(d => d.isCurrentMonth).length }}</div>
                        <div class="stat-label">Tổng ngày</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Personal Overtime Tab -->
        <div v-else-if="activeTab === 'personalOvertime'">
          <!-- Compact Header Section -->
          <div class="personal-header-compact mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body py-3">
                <div class="row align-items-center">
                  <div class="col-lg-8">
                    <div class="d-flex align-items-center">
                      <div class="personal-icon-wrapper me-3">
                        <i class="fas fa-user-plus"></i>
                      </div>
                      <div class="flex-grow-1">
                        <h5 class="mb-1 text-primary fw-bold">
                          <i class="fas fa-business-time me-2"></i>
                          Bảng công tăng ca cá nhân
                        </h5>
                        <div v-if="currentUser" class="employee-info-compact">
                          <div class="info-item">
                            <span class="info-label">Mã NV:</span>
                            <span class="info-value">{{ currentUser.id }}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">Tên:</span>
                            <span class="info-value">{{ getEmployeeFullName(currentUser) || currentUser.fullName || (currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : 'N/A') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-4">
                    <div class="filter-section">
                      <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" :show-date-range="false"
                        :show-refresh-button="false" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="legend-section mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-title mb-3">
                  <i class="fas fa-palette me-2"></i>
                  Chú thích hình thức tăng ca
                </h6>
                <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center">
                  <div class="legend-item">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Tăng ca nghỉ bù</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#9c27b0"></span>
                    <span class="legend-text">Tăng ca tính lương</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background:#6c757d"></span>
                    <span class="legend-text">Tăng ca thường</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Personal Overtime Calendar -->
          <div class="personal-attendance-calendar">
            <div class="calendar-header">
              <div class="calendar-day-header">CN</div>
              <div class="calendar-day-header">T2</div>
              <div class="calendar-day-header">T3</div>
              <div class="calendar-day-header">T4</div>
              <div class="calendar-day-header">T5</div>
              <div class="calendar-day-header">T6</div>
              <div class="calendar-day-header">T7</div>
            </div>
            <div v-for="(week, weekIndex) in personalOvertimeData" :key="weekIndex" class="calendar-week">
              <div v-for="(day, dayIndex) in week" :key="dayIndex" class="calendar-day">
                <div v-if="day.isCurrentMonth"
                     :class="getPersonalCellClass(day.overtime?.class || 'empty')"
                     :title="getPersonalOvertimeCellTitle(day)"
                     @click="console.log('Day clicked:', day.day, 'Class:', day.overtime?.class, 'Applied class:', getPersonalCellClass(day.overtime?.class || 'empty'))">
                  <div class="day-number">{{ day.day }}</div>
                  <div class="day-time">{{ day.overtime?.time || '' }}</div>
                </div>
                <div v-else class="calendar-day-empty"></div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div v-if="personalOvertimeData.length > 0" class="row mt-4">
            <div class="col-md-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-gradient-purple text-white">
                  <h6 class="mb-0">
                    <i class="fas fa-chart-bar me-2"></i>
                    Thống kê tăng ca tháng {{ selectedMonth }}/{{ selectedYear }}
                  </h6>
                </div>
                <div class="card-body">
                  <div class="row text-center">
                    <div class="col-md-2">
                      <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                          <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeData.flat().filter(d => d.isCurrentMonth && d.overtime?.class === 'compensatory').length }}</div>
                        <div class="stat-label">Tăng ca nghỉ bù</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-purple">
                        <div class="stat-icon">
                          <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeData.flat().filter(d => d.isCurrentMonth && d.overtime?.class === 'paid').length }}</div>
                        <div class="stat-label">Tăng ca tính lương</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-secondary">
                        <div class="stat-icon">
                          <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeData.flat().filter(d => d.isCurrentMonth && d.overtime?.class === 'overtime').length }}</div>
                        <div class="stat-label">Tăng ca thường</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeData.flat().filter(d => d.isCurrentMonth && (d.overtime?.class === 'overtime' || d.overtime?.class === 'compensatory' || d.overtime?.class === 'paid')).length }}</div>
                        <div class="stat-label">Tổng ngày tăng ca</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-primary">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeData.flat().filter(d => d.isCurrentMonth).length }}</div>
                        <div class="stat-label">Tổng ngày</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                          <i class="fas fa-hourglass-end"></i>
                        </div>
                        <div class="stat-number">{{ (personalOvertimeData.flat().filter(d => d.isCurrentMonth && (d.overtime?.class === 'overtime' || d.overtime?.class === 'compensatory' || d.overtime?.class === 'paid')).reduce((total, d) => {
                          const hours = parseFloat(d.overtime?.time?.replace('h', '') || '0')
                          return total + hours
                        }, 0)).toFixed(1) }}h</div>
                        <div class="stat-label">Tổng giờ tăng ca</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="activeTab === 'overtime'">
          <!-- Compact Header Section -->
          <div class="overtime-header-compact mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body py-3">
                <div class="row align-items-center">
                  <div class="col-lg-8">
                    <div class="d-flex align-items-center">
                      <div class="overtime-icon-wrapper me-3">
                        <i class="fas fa-business-time"></i>
                      </div>
                      <div class="flex-grow-1">
                        <h5 class="mb-1 text-primary fw-bold">
                          <i class="fas fa-clock me-2"></i>
                          Bảng công tăng ca
                        </h5>
                        <p class="mb-0 text-muted small">
                          <i class="fas fa-info-circle me-1"></i>
                          Tổng quan tăng ca của tất cả nhân viên
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-4">
                    <div class="filter-section">
                      <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" :show-date-range="false"
                        :show-refresh-button="true" :loading="overtimeLoading" @refresh="loadOvertimeData" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="overtimeLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải dữ liệu tăng ca...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="overtimeError" class="alert alert-danger">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ overtimeError }}
              </div>
              <button class="btn btn-outline-danger btn-sm" @click="loadOvertimeData" :disabled="overtimeLoading">
                <i class="fas fa-redo me-1"></i>
                Thử lại
              </button>
            </div>
          </div>

          <!-- Data Table -->
          <div v-else>
            <!-- Show table if there are employees with overtime -->
            <div v-if="overtimeData.length > 0">
              <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center legend-row mb-2">
                <span class="legend-item" style="background:#2196f3"></span> Tăng ca nghỉ bù
                <span class="legend-item" style="background:#28a745"></span> Tăng ca tính lương
              </div>
              <div class="attendance-summary-table">
                <DataTable :columns="overtimeColumns" :data="overtimeData">
                  <template #detail="{ item }">
                    <button class="btn btn-sm btn-outline-primary" @click.stop="openOvertimeModal(item)"><i
                        class="fa-solid fa-eye"></i></button>
                  </template>
                  <template #id="{ item }">
                    <span class="emp-id fw-bold text-primary">{{ item.id }}</span>
                  </template>
                  <template #name="{ item }">
                    <span class="fw-bold">{{ item.name }}</span>
                  </template>
                  <template v-for="(day, idx) in overtimeHeaders" v-slot:[`day_${idx}`]="{ item }">
                    <div class="schedule-cell-modern" :class="getOvertimeCellClass(item[`day_${idx}`]?.type)"
                      @click.stop="openOvertimeModal(item, idx)" style="cursor:pointer;">
                      <span v-if="item[`day_${idx}`]?.hours > 0">{{ item[`day_${idx}`]?.hours }}</span>
                    </div>
                  </template>
                </DataTable>
              </div>
            </div>

            <!-- Show message if no overtime in this month -->
            <div v-else class="text-center py-5">
              <div class="no-overtime-message">
                <i class="fas fa-calendar-times fa-4x text-muted mb-4"></i>
                <h5 class="text-muted mb-3">Không có tăng ca trong tháng {{ selectedMonth }}/{{ selectedYear }}</h5>
                <p class="text-muted">Không có nhân viên nào có tăng ca được duyệt trong tháng này.</p>
              </div>
            </div>
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
                <span class="fw-bold">Ngày: </span>
                <span>{{ overtimeHeaders[selectedOvertimeDayIdx] }}</span>
              </div>
            </div>
            <div class="modal-summary-table mt-3">
              <!-- Specific day details -->
              <div
                v-if="selectedOvertimeDayIdx !== null && selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.hours > 0"
                class="overtime-summary-card">
                <h6 class="fw-bold mb-3">Chi tiết tăng ca ngày</h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Số giờ tăng ca:</span>
                      <span class="summary-value">{{ getDayOvertimeHours(selectedOvertimeEmployee,
                        selectedOvertimeDayIdx) }}
                        giờ</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Số ngày tăng ca:</span>
                      <span class="summary-value">{{ getDayOvertimeDays(selectedOvertimeEmployee,
                        selectedOvertimeDayIdx) }}
                        ngày</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Giờ có hệ số:</span>
                      <span class="summary-value">{{ getDayOvertimeHoursWithCoefficient(selectedOvertimeEmployee,
                        selectedOvertimeDayIdx) }} giờ</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Ngày có hệ số:</span>
                      <span class="summary-value">{{ getDayOvertimeDaysWithCoefficient(selectedOvertimeEmployee,
                        selectedOvertimeDayIdx) }} ngày</span>
                    </div>
                  </div>
                  <div class="col-12" v-if="selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.request">
                    <div class="summary-item">
                      <span class="summary-label">Hệ số:</span>
                      <span class="summary-value">{{
                        selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.request?.coefficient }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No overtime for this day -->
              <div v-else-if="selectedOvertimeDayIdx !== null" class="text-center p-4 text-muted">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>Không có tăng ca trong ngày này</p>
              </div>

              <!-- Monthly summary -->
              <div v-else class="overtime-summary-card">
                <h6 class="fw-bold mb-3">Tổng hợp tăng ca tháng</h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Tổng giờ tăng ca:</span>
                      <span class="summary-value">{{ selectedOvertimeEmployee?.totalOvertimeHours ?? 0 }} giờ</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Số ngày tăng ca:</span>
                      <span class="summary-value">{{ selectedOvertimeEmployee?.totalOvertimeDays ?? 0 }} ngày</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Tổng giờ có hệ số:</span>
                      <span class="summary-value">{{ selectedOvertimeEmployee?.totalOvertimeHoursWithCoeff ?? 0 }}
                        giờ</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="summary-item">
                      <span class="summary-label">Số ngày có hệ số:</span>
                      <span class="summary-value">{{ selectedOvertimeEmployee?.totalOvertimeDaysWithCoeff ?? 0 }}
                        ngày</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModalDialog>
        </div>
        <div v-else-if="activeTab === 'detail'">
          <!-- Time Filter for Detail Tab -->
          <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" v-model:week="selectedWeek"
            v-model:start-date="selectedStartDate" v-model:end-date="selectedEndDate" :show-week-filter="true"
            :show-date-range="true" :show-refresh-button="true" :loading="detailLoading" @refresh="loadDetailData"
            @week-changed="handleWeekChanged" @date-range-changed="handleDateRangeChanged" />

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
              <button class="btn btn-outline-danger btn-sm" @click="loadDetailData" :disabled="detailLoading">
                <i class="fas fa-redo me-1"></i>
                Thử lại
              </button>
            </div>
          </div>

          <!-- Data Table -->
          <div v-else class="attendance-summary-table">
            <DataTable :columns="detailColumns" :data="paginatedDetailData">
              <template #type="{ item }">
                <span :class="{
                  'cell-work': item.type === 'Đi làm',
                  'cell-leave': item.type === 'Nghỉ phép',
                  'cell-remote': item.type === 'Làm việc từ xa'
                }">
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
            <Pagination :totalItems="processedDetailData.length" :itemsPerPage="detailItemsPerPage"
              :currentPage="detailCurrentPage" @update:currentPage="detailCurrentPage = $event" />
          </div>
        </div>
        <div v-else-if="activeTab === 'attendance'">
          <!-- Time Filter for Attendance Tab -->
          <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" v-model:start-date="selectedStartDate"
            v-model:end-date="selectedEndDate" :show-date-range="true" :show-refresh-button="true"
            :loading="attendanceLoading" @refresh="loadAttendanceData" @date-range-changed="handleDateRangeChanged" />

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
              <button class="btn btn-outline-danger btn-sm" @click="loadAttendanceData" :disabled="attendanceLoading">
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
                <span :class="{
                  'cell-in': item.type === 'Vào',
                  'cell-out': item.type === 'Ra'
                }">
                  {{ item.type }}
                </span>
              </template>
            </DataTable>
            <Pagination :totalItems="attendanceData.length" :itemsPerPage="attendanceItemsPerPage"
              :currentPage="attendanceCurrentPage" @update:currentPage="attendanceCurrentPage = $event" />
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
              :itemsPerPage="closeHistoryItemsPerPage" :currentPage="closeHistoryCurrentPage"
              @update:currentPage="closeHistoryCurrentPage = $event" />
          </div>
        </div>
        <div v-else-if="activeTab === 'feedbackHistory'">
          <div class="attendance-summary-table">
            <DataTable :columns="feedbackColumns" :data="paginatedFeedbackData">
              <template #actions="{ item }">
                <button class="table-action-btn" title="Xem chi tiết"
                  @click.stop="alert('Xem chi tiết: ' + item.title)">
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
            <Pagination :totalItems="feedbackData.length" :itemsPerPage="feedbackItemsPerPage"
              :currentPage="feedbackCurrentPage" @update:currentPage="feedbackCurrentPage = $event" />
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
.col-stt {
  min-width: 40px;
  max-width: 50px;
}

.col-detail {
  min-width: 60px;
  max-width: 70px;
}

.col-id {
  min-width: 90px;
  max-width: 110px;
}

.col-name {
  min-width: 160px;
  max-width: 220px;
}

.col-day {
  min-width: 70px;
  max-width: 90px;
}

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
  background: #e3f2fd;
  color: #007bff;
  border: 1px solid #90caf9;
}

.schedule-cell-modern.cell-insufficient {
  background: #fff8e1;
  color: #f57c00;
  border: 1px solid #ffcc02;
}

.schedule-cell-modern.cell-incomplete {
  background: #ffebee;
  color: #dc3545;
  border: 1px solid #f5c6cb;
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
  background: #e3f2fd;
  color: #007bff;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.attendance-summary-table .cell-insufficient {
  background: #fff8e1;
  color: #f57c00;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.attendance-summary-table .cell-incomplete {
  background: #ffebee;
  color: #dc3545;
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

/* Legacy legend items (for backward compatibility) */
.legend-row .legend-item {
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

.stat-card-summary.primary {
  border-color: #0d6efd;
}

.stat-card-summary.success {
  border-color: #198754;
}

.stat-card-summary.info {
  border-color: #0dcaf0;
}

.stat-card-summary.secondary {
  border-color: #6c757d;
}

.stat-card-summary.warning {
  border-color: #ffc107;
}

.stat-card-summary.success-alt {
  border-color: #20c997;
}

.stat-card-summary.danger {
  border-color: #dc3545;
}

.stat-card-summary.danger-alt {
  border-color: #fd7e14;
}

.stat-card-summary.dark {
  border-color: #212529;
}

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

.stat-card-summary.primary .stat-icon-summary {
  background-color: #0d6efd;
}

.stat-card-summary.success .stat-icon-summary {
  background-color: #198754;
}

.stat-card-summary.info .stat-icon-summary {
  background-color: #0dcaf0;
}

.stat-card-summary.secondary .stat-icon-summary {
  background-color: #6c757d;
}

.stat-card-summary.warning .stat-icon-summary {
  background-color: #ffc107;
  color: #000;
}

.stat-card-summary.success-alt .stat-icon-summary {
  background-color: #20c997;
}

.stat-card-summary.danger .stat-icon-summary {
  background-color: #dc3545;
}

.stat-card-summary.danger-alt .stat-icon-summary {
  background-color: #fd7e14;
}

.stat-card-summary.dark .stat-icon-summary {
  background-color: #212529;
}

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

/* Overtime summary styles */
.overtime-summary-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.summary-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.summary-value {
  font-size: 1.125rem;
  color: #212529;
  font-weight: 600;
}

/* No overtime message styles */
.no-overtime-message {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 3rem 2rem;
  border: 1px solid #e9ecef;
}

.no-overtime-message i {
  opacity: 0.5;
}

/* Personal Attendance Calendar Styles */
.personal-attendance-calendar {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(13, 110, 253, 0.07);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.calendar-day-header {
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #dee2e6;
}

.calendar-day-header:last-child {
  border-right: none;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #e9ecef;
}

.calendar-week:last-child {
  border-bottom: none;
}

.calendar-day {
  min-height: 80px;
  border-right: 1px solid #e9ecef;
  position: relative;
}

.calendar-day:last-child {
  border-right: none;
}

.calendar-day-empty {
  min-height: 80px;
  background: #f8f9fa;
}

.personal-cell {
  width: 100%;
  height: 100%;
  min-height: 80px;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  padding: 8px 4px;
}

.personal-cell:hover {
  transform: scale(1.02);
  box-shadow: inset 0 0 0 2px rgba(13, 110, 253, 0.3);
  z-index: 1;
}

.personal-cell.work {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
  border-color: #c3e6cb;
}

.personal-cell.leave {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  color: #0c5460;
  border-color: #bee5eb;
}

.personal-cell.insufficient {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
  border-color: #ffeaa7;
}

.personal-cell.incomplete {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  border-color: #f5c6cb;
}

.personal-cell.late {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
  border-color: #ffeaa7;
}

.personal-cell.other {
  background: linear-gradient(135deg, #e2e3e5, #d6d8db);
  color: #495057;
  border-color: #d6d8db;
}

.personal-cell.overtime {
  background: linear-gradient(135deg, #e7e3ff, #d1c4e9);
  color: #512da8;
  border-color: #d1c4e9;
}

.personal-cell.compensatory {
  background: linear-gradient(135deg, #d4edda, #c3e6cb) !important;
  color: #155724 !important;
  border-color: #c3e6cb !important;
}

.personal-cell.paid {
  background: linear-gradient(135deg, #e7e3ff, #d1c4e9) !important;
  color: #512da8 !important;
  border-color: #d1c4e9 !important;
}

.personal-cell.empty {
  background: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}

.day-number {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: inherit;
}

.day-time {
  font-size: 0.7rem;
  line-height: 1.2;
  word-break: break-word;
  opacity: 0.9;
}

.stat-item {
  padding: 1rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

/* Enhanced Personal Tab Styles */
.personal-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
}

.personal-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.user-info-inline {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.user-info-inline .text-muted {
  font-weight: 500;
}

.user-info-card .card {
  transition: all 0.3s ease;
}

.user-info-card .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #6c757d, #495057);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.month-info {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #90caf9;
}

.legend-section .card {
  background: linear-gradient(135deg, #fff, #f8f9fa);
}

.legend-item {
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  padding: 0.5rem 1rem !important;
  background: white !important;
  border-radius: 20px !important;
  border: 1px solid #e9ecef !important;
  transition: all 0.3s ease !important;
}

.legend-item:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
}

.legend-color {
  width: 16px !important;
  height: 16px !important;
  border-radius: 50% !important;
  border: 2px solid white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

.legend-text {
  font-weight: 500 !important;
  color: #495057 !important;
}

/* Enhanced Stat Cards */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.stat-card-success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #c3e6cb;
}

.stat-card-success::before {
  background: linear-gradient(90deg, transparent, #28a745, transparent);
}

.stat-card-info {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-color: #bee5eb;
}

.stat-card-info::before {
  background: linear-gradient(90deg, transparent, #17a2b8, transparent);
}

.stat-card-warning {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border-color: #ffeaa7;
}

.stat-card-warning::before {
  background: linear-gradient(90deg, transparent, #ffc107, transparent);
}

.stat-card-danger {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-color: #f5c6cb;
}

.stat-card-danger::before {
  background: linear-gradient(90deg, transparent, #dc3545, transparent);
}

.stat-card-secondary {
  background: linear-gradient(135deg, #e2e3e5, #d6d8db);
  border-color: #d6d8db;
}

.stat-card-secondary::before {
  background: linear-gradient(90deg, transparent, #6c757d, transparent);
}

.stat-card-primary {
  background: linear-gradient(135deg, #cce5ff, #b3d9ff);
  border-color: #b3d9ff;
}

.stat-card-primary::before {
  background: linear-gradient(90deg, transparent, #007bff, transparent);
}

.stat-card-purple {
  background: linear-gradient(135deg, #e7e3ff, #d1c4e9);
  border-color: #d1c4e9;
}

.stat-card-purple::before {
  background: linear-gradient(90deg, transparent, #9c27b0, transparent);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.8;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
  color: #495057;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Enhanced Calendar Styles */
.personal-attendance-calendar {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
}

.calendar-day-header {
  font-weight: 700;
  text-align: center;
  padding: 1rem 0.5rem;
  color: #495057;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 1px solid #dee2e6;
}

.calendar-day-header:last-child {
  border-right: none;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #e9ecef;
}

.calendar-week:last-child {
  border-bottom: none;
}

.calendar-day {
  min-height: 100px;
  border-right: 1px solid #e9ecef;
  position: relative;
  transition: all 0.3s ease;
}

.calendar-day:hover {
  background: rgba(0, 123, 255, 0.05);
}

.calendar-day:last-child {
  border-right: none;
}

.calendar-day-empty {
  min-height: 100px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.personal-cell {
  width: 100%;
  height: 100%;
  min-height: 100px;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  position: relative;
}

.personal-cell:hover {
  transform: scale(1.02);
  box-shadow: inset 0 0 0 3px rgba(0, 123, 255, 0.3);
  z-index: 2;
}

.day-number {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: inherit;
}

.day-time {
  font-size: 0.7rem;
  line-height: 1.2;
  word-break: break-word;
  opacity: 0.9;
  max-width: 100%;
}

/* Gradient Headers - Softer versions */
.bg-gradient-primary {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
  color: #1976d2 !important;
}

.bg-gradient-purple {
  background: linear-gradient(135deg, #f3e5f5, #e1bee7) !important;
  color: #7b1fa2 !important;
}

.text-purple {
  color: #9c27b0 !important;
}

/* Compact Personal Header Styles */
.personal-header-compact {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.personal-header-compact .card {
  border: 1px solid rgba(52, 152, 219, 0.1);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.personal-header-compact .card-body {
  background: transparent;
}

.personal-icon-wrapper {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  transition: all 0.3s ease;
}

.personal-icon-wrapper i {
  color: white;
  font-size: 1.25rem;
}

.personal-icon-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
}

.employee-info-compact {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
  min-width: 40px;
}

.info-value {
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 600;
  background: rgba(52, 152, 219, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(52, 152, 219, 0.2);
}

.filter-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.filter-section .time-filter {
  background: rgba(52, 152, 219, 0.05);
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

/* Summary Header Compact Styles */
.summary-header-compact {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.summary-header-compact .card {
  border: 1px solid rgba(52, 152, 219, 0.1);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.summary-header-compact .card-body {
  background: transparent;
}

.summary-icon-wrapper {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  transition: all 0.3s ease;
}

.summary-icon-wrapper i {
  color: white;
  font-size: 1.25rem;
}

.summary-icon-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
}

/* Overtime Header Compact Styles */
.overtime-header-compact {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.overtime-header-compact .card {
  border: 1px solid rgba(52, 152, 219, 0.1);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.overtime-header-compact .card-body {
  background: transparent;
}

.overtime-icon-wrapper {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  transition: all 0.3s ease;
}

.overtime-icon-wrapper i {
  color: white;
  font-size: 1.25rem;
}

.overtime-icon-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
}

/* Enhanced Legend Styles */
.legend-section .card {
  border: 1px solid rgba(52, 152, 219, 0.1);
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(52, 152, 219, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(52, 152, 219, 0.1);
  transition: all 0.3s ease;
}

.legend-item:hover {
  background: rgba(52, 152, 219, 0.1);
  transform: translateY(-1px);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

/* Voucher code link styling */
.voucher-code-link {
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-bottom: 1px dotted transparent;
}

.voucher-code-link:hover {
  color: #0056b3 !important;
  border-bottom-color: #0056b3;
  text-decoration: none;
  transform: translateY(-1px);
}

.voucher-code-link:active {
  transform: translateY(0);
}

/* Responsive adjustments for all compact headers */
@media (max-width: 768px) {
  .personal-cell {
    height: 40px;
    font-size: 0.75rem;
  }
  
  .cell-time {
    font-size: 0.7rem;
  }
  
  /* Personal Header */
  .personal-header-compact .card-body {
    padding: 1rem !important;
  }
  
  .employee-info-compact {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .info-item {
    width: 100%;
    justify-content: space-between;
  }
  
  .personal-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .personal-icon-wrapper i {
    font-size: 1rem;
  }
  
  /* Summary Header */
  .summary-header-compact .card-body {
    padding: 1rem !important;
  }
  
  .summary-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .summary-icon-wrapper i {
    font-size: 1rem;
  }
  
  /* Overtime Header */
  .overtime-header-compact .card-body {
    padding: 1rem !important;
  }
  
  .overtime-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .overtime-icon-wrapper i {
    font-size: 1rem;
  }
  
  /* Common responsive adjustments */
  .filter-section {
    justify-content: center;
    margin-top: 1rem;
  }
  
  .legend-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  
  .legend-color {
    width: 14px;
    height: 14px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
}
</style>
