<script setup>
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
import DataTable from '../../components/common/DataTable.vue'

const showEmployeeModal = ref(false)
const showDayModal = ref(false)
const selectedEmployee = ref(null)
const selectedDateIdx = ref(null)
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
  { key: 'forgetInOut', label: 'Quên IN/OUT' },
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

const { showMessage } = useGlobalMessage()

// Initialize composables
const { employees: allEmployees, fetchAllEmployees } = useEmployee()
const { attendanceList, fetchAttendance } = useAttendance()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { overtimeRequests, fetchOvertimeRequests, loading: overtimeLoading, error: overtimeError } = useOvertimeRequest()
const { leaveRequests, fetchLeaveRequests, loading: leaveLoading, error: leaveError } = useLeaveRequest()

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

// Pagination for main summary table
const currentPage = ref(1)
const pageSize = ref(5)

// Limit the number of visible tabs
const visibleTabsCount = 6
const visibleTabs = computed(() => tabs.slice(0, visibleTabsCount))
const hiddenTabs = computed(() => tabs.slice(visibleTabsCount))

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

// Tạo dữ liệu chấm công thực tế cho từng nhân viên, từng ngày từ API
function generateAttendanceForEmployee(employeeId, employeeName) {
  console.log('=== ATTENDANCE DEBUG ===');
  console.log('Employee ID:', employeeId);
  console.log('Employee Name:', employeeName);
  console.log('Attendance data:', attendanceList.value);
  console.log('Selected year:', selectedYear.value);
  console.log('Selected month:', selectedMonth.value);

  if (!attendanceList.value || attendanceList.value.length === 0) {
    console.log('No attendance data found - generating empty data with leave requests');
    // Vẫn tạo dữ liệu để kiểm tra phiếu nghỉ phép
    return dayHeaders.value.map((_, dayIdx) => {
      const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1);
      const leaveRequest = checkLeaveRequestForEmployee(employeeId, currentDate);

      if (leaveRequest) {
        // Tạo thời gian hiển thị từ startDateTime và endDateTime
        const startTime = new Date(leaveRequest.startDateTime);
        const endTime = new Date(leaveRequest.endDateTime);

        // Format thời gian: chỉ hiển thị giờ:phút
        const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

        // Kiểm tra xem thời gian nghỉ phép có đủ so với ca làm việc không
        const isSufficient = isLeaveTimeSufficient(leaveRequest, leaveRequest.workShiftID);

        return {
          status: isSufficient ? 'leave' : 'insufficient',
          time: timeDisplay,
          type: leaveRequest.leaveTypeName
        };
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
      // Không có dữ liệu chấm công - kiểm tra đơn nghỉ phép
      console.log('No attendance data for day:', dayIdx, 'Checking leave request:', leaveRequest);
      if (leaveRequest) {
        console.log('Found leave request for day without attendance:', dayIdx, leaveRequest);

        // Tạo thời gian hiển thị từ startDateTime và endDateTime
        const startTime = new Date(leaveRequest.startDateTime);
        const endTime = new Date(leaveRequest.endDateTime);

        // Format thời gian: chỉ hiển thị giờ:phút
        const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

        // Kiểm tra xem thời gian nghỉ phép có đủ so với ca làm việc không
        const isSufficient = isLeaveTimeSufficient(leaveRequest, leaveRequest.workShiftID);

        return { status: isSufficient ? 'leave' : 'insufficient', time: timeDisplay, type: leaveRequest.leaveTypeName, leaveRequest };
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

  return employeesToUse.map(emp => generateAttendanceForEmployee(emp.id, emp.employeeName));
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

    // So sánh cả string và number
    const employeeMatch = request.employeeID === employeeId ||
      request.employeeID === String(employeeId) ||
      String(request.employeeID) === employeeId;

    return employeeMatch &&
      (request.approveStatus === 'Đã duyệt' || request.approveStatus === 'Approved'); // Hỗ trợ cả tiếng Việt và tiếng Anh
  });

  console.log('Filtered employee overtime requests:', employeeOvertimeRequests);

  return overtimeHeaders.value.map((day, dayIdx) => {
    // Tạo ngày hiện tại để so sánh
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Tìm yêu cầu tăng ca trong ngày này
    const dayOvertimeRequest = employeeOvertimeRequests.find(request => {
      const requestDate = new Date(request.startDateTime).toISOString().split('T')[0];
      console.log('Comparing dates:', { requestDate, dateStr, match: requestDate === dateStr });
      return requestDate === dateStr;
    });

    if (dayOvertimeRequest) {
      console.log('Found overtime request for day:', dayIdx, dayOvertimeRequest);

      // Tính số giờ tăng ca
      const startTime = new Date(dayOvertimeRequest.startDateTime);
      const endTime = new Date(dayOvertimeRequest.endDateTime);
      const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60)); // Chuyển đổi sang giờ

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
      totalDays++;
    }
  });

  return totalDays;
}

function getTotalOvertimeHoursWithCoefficient(employee) {
  if (!employee) return 0;

  let totalHours = 0;
  overtimeHeaders.value.forEach((_, idx) => {
    const dayData = employee[`day_${idx}`];
    if (dayData && dayData.hours > 0 && dayData.request?.coefficient) {
      totalHours += dayData.hours * dayData.request.coefficient;
    }
  });

  return Math.round(totalHours * 100) / 100;
}

function getTotalOvertimeDaysWithCoefficient(employee) {
  if (!employee) return 0;

  let totalDays = 0;
  overtimeHeaders.value.forEach((_, idx) => {
    const dayData = employee[`day_${idx}`];
    if (dayData && dayData.hours > 0 && dayData.request?.coefficient) {
      totalDays += (dayData.hours / 8) * dayData.request.coefficient;
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
  if (dayData && dayData.hours > 0 && dayData.request?.coefficient) {
    return Math.round((dayData.hours * dayData.request.coefficient) * 100) / 100;
  }
  return 0;
}

function getDayOvertimeDaysWithCoefficient(employee, dayIdx) {
  if (!employee || dayIdx === null) return 0;
  const dayData = employee[`day_${dayIdx}`];
  if (dayData && dayData.hours > 0 && dayData.request?.coefficient) {
    return Math.round(((dayData.hours / 8) * dayData.request.coefficient) * 100) / 100;
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
    const attendanceData = await attendanceDataService.getAttendanceDataByEmployeeAndDate(employee.id, fullDate);
    
    // Transform attendance data to match expected format
    const transformedAttendanceData = [];
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((item, index) => {
        // Create entry for check-in if exists
        if (item.checkInTime) {
          transformedAttendanceData.push({
            stt: transformedAttendanceData.length + 1,
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
            stt: transformedAttendanceData.length + 1,
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
    
    attendanceHistory.value = transformedAttendanceData;
    
    // Generate work history data from attendance data
    const transformedWorkData = [];
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((item, index) => {
        if (item.checkInTime && item.checkOutTime) {
          // Calculate work hours
          const checkInTime = new Date(`2000-01-01T${item.checkInTime}`);
          const checkOutTime = new Date(`2000-01-01T${item.checkOutTime}`);
          const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          const workDays = Math.round((workHours / 8) * 100) / 100;
          
          // Calculate late/early minutes (assuming standard 8:30-17:30 shift)
          const shiftStart = new Date('2000-01-01T08:30:00');
          const shiftEnd = new Date('2000-01-01T17:30:00');
          const lateMinutes = Math.max(0, (checkInTime - shiftStart) / (1000 * 60));
          const earlyMinutes = Math.max(0, (shiftEnd - checkOutTime) / (1000 * 60));
          
          transformedWorkData.push({
            stt: index + 1,
            shiftName: item.shiftName,
            standard: '8.00/1.00',
            scanInOut: `Vào: ${item.checkInTime.toString().substring(0, 5)}, Ra: ${item.checkOutTime.toString().substring(0, 5)}`,
            lateEarly: `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`,
            forgetInOut: '0 (Đã xác nhận)',
            workHour: `${workHours.toFixed(2)}/${workDays.toFixed(2)}`
          });
        }
      });
    }
    
    workHistory.value = transformedWorkData;
    
    console.log('Day modal data loaded:', {
      attendanceHistory: attendanceHistory.value,
      workHistory: workHistory.value
    });
    
  } catch (error) {
    console.error('Error loading day modal data:', error);
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

  // Load work shifts
  console.log('Fetching work shifts...');
  await fetchWorkShifts()
  console.log('Work shifts loaded:', workshifts.value);

  // Load leave requests
  console.log('Fetching leave requests...');
  try {
    await fetchLeaveRequests()
    console.log('Leave requests loaded successfully');
    console.log('Leave requests count:', leaveRequests.value?.length || 0);

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
          <!-- Time Filter for Summary Tab -->
          <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" :show-date-range="false"
            :show-refresh-button="false" />

          <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center legend-row">
            <span class="legend-item" style="background:#28a745"></span> Đi làm
            <span class="legend-item" style="background:#007bff"></span> Nghỉ phép
            <span class="legend-item" style="background:#ffc107"></span> Chưa đủ giờ công
            <span class="legend-item" style="background:#dc3545"></span> Quên checkin/checkout
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
                          <span class="scan-value">{{ item.scanInOut.split(',')[0].replace('Vào:', '').trim() }}</span><br>
                          <span class="scan-label">Ra:</span>
                          <span class="scan-value">{{ item.scanInOut.split(',')[1].replace('Ra:', '').trim() }}</span>
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
          </div>
        </div>
        <div v-else-if="activeTab === 'overtime'">
          <!-- Time Filter for Overtime Tab -->
          <TimeFilter v-model:year="selectedYear" v-model:month="selectedMonth" :show-date-range="false"
            :show-refresh-button="true" :loading="overtimeLoading" @refresh="loadOvertimeData" />

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
</style>
