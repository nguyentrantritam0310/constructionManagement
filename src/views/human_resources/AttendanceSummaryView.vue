<script setup>
// ============================================================================
// KHAI BÁO IMPORT
// ============================================================================
// Vue core - Thư viện Vue cốt lõi
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Components - Các component Vue
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
import DataTable from '../../components/common/DataTable.vue'
import LeaveForm from '../../components/common/leave/LeaveForm.vue'
import TourGuide from '../../components/common/TourGuide.vue'
import AIChatbotButton from '../../components/common/AIChatbotButton.vue'
import TabBar from '../../components/common/TabBar.vue'
import TimeFilter from '../../components/common/TimeFilter.vue'

// Composables - Các composable Vue (hooks tái sử dụng)
import { useAuth } from '../../composables/useAuth.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useEmployee } from '../../composables/useEmployee'
import { useAttendance } from '../../composables/useAttendance'
import { useWorkShift } from '../../composables/useWorkShift'
import { useOvertimeRequest } from '../../composables/useOvertimeRequest'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useLeaveType } from '../../composables/useLeaveType'
import { useShiftAssignment } from '../../composables/useShiftAssignment'
import { usePermissions } from '../../composables/usePermissions'

// Services - Các service xử lý API và business logic
import api from '../../api'
import { attendanceDataService } from '../../services/attendanceDataService'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// ============================================================================
// KHỞI TẠO COMPOSABLES
// ============================================================================
const { employees: allEmployees, fetchAllEmployees } = useEmployee()
const { attendanceList, fetchAttendance } = useAttendance()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { overtimeRequests, fetchOvertimeRequests, loading: overtimeLoading, error: overtimeError } = useOvertimeRequest()
const { leaveRequests, fetchLeaveRequests, loading: leaveLoading, error: leaveError } = useLeaveRequest()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()
const { shiftAssignments, fetchAllShiftAssignments, createShiftAssignment } = useShiftAssignment()
const { showMessage } = useGlobalMessage()
const { currentUser, isDirector, isHRManager, isHREmployee } = useAuth()
const { canView } = usePermissions()

const route = useRoute()
const router = useRouter()

// Đăng ký components
const components = {
  TimeFilter
}

// ============================================================================
// BIẾN REACTIVE - TRẠNG THÁI MODAL
// ============================================================================
const showEmployeeModal = ref(false)
const showDayModal = ref(false)
const showLeaveFormModal = ref(false)
const showImageModal = ref(false)
const showLocationMapModal = ref(false)
const showTourGuide = ref(false)
const showAIChatbot = ref(false)

// ============================================================================
// BIẾN REACTIVE - DỮ LIỆU ĐÃ CHỌN
// ============================================================================
const selectedEmployee = ref(null)
const selectedDateIdx = ref(null)
const selectedLeaveRequest = ref(null)
const selectedImage = ref(null)
const mapLocation = ref({ lat: null, lng: null, name: null })

// ============================================================================
// BIẾN REACTIVE - TRẠNG THÁI LOADING VÀ LỖI
// ============================================================================
const dayModalLoading = ref(false)
const dayModalError = ref(null)
const aiChatbotMessage = ref('')

// ============================================================================
// BIẾN REACTIVE - TRẠNG THÁI TAB VÀ BỘ LỌC
// ============================================================================
const activeTab = ref('summary')
const showMoreTabs = ref(false)
const currentMonth = ref(new Date())
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const selectedWeek = ref('')
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

// ============================================================================
// BIẾN REACTIVE - TRẠNG THÁI PHÂN TRANG
// ============================================================================
const currentPage = ref(1)
const pageSize = ref(5)
const overtimeCurrentPage = ref(1)
const overtimePageSize = ref(5)

// ============================================================================
// BIẾN REACTIVE - MẢNG DỮ LIỆU
// ============================================================================
const attendanceHistory = ref([])
const workHistory = ref([])
const updatingShifts = ref({}) // Theo dõi các bản ghi chấm công đang được cập nhật

// ============================================================================
// HÀM TIỆN ÍCH - PHÂN TÍCH GIỜ CÔNG BẰNG 0
// ============================================================================

/**
 * Phân tích nguyên nhân tại sao giờ công/ngày công bằng 0 và đưa ra gợi ý
 * @param {Object} item - Dữ liệu chấm công cần phân tích
 * @returns {Object} { reasons: Array, suggestions: Array } - Danh sách nguyên nhân và gợi ý
 */
function analyzeZeroWorkTime(item) {
  const reasons = []
  const suggestions = []
  
  // Kiểm tra xem có thời gian chấm công vào/ra không
  if (!item.checkInTime || !item.checkOutTime) {
    reasons.push('Thiếu dữ liệu chấm công vào hoặc ra')
    suggestions.push('Kiểm tra lại dữ liệu chấm công của nhân viên')
  } else {
    const checkInTime = new Date(`2000-01-01T${item.checkInTime}:00`)
    const checkOutTime = new Date(`2000-01-01T${item.checkOutTime}:00`)
    
    // Kiểm tra xem giờ ra có trước giờ vào không (khoảng thời gian không hợp lệ)
    if (checkOutTime <= checkInTime) {
      reasons.push('Giờ ra nhỏ hơn hoặc bằng giờ vào (dữ liệu không hợp lệ)')
      suggestions.push('Kiểm tra lại thời gian chấm công vào và ra')
    }
    
    // Kiểm tra xem có ca làm việc được phân chưa
    if (!item.workShiftID) {
      reasons.push('Nhân viên chưa được phân ca làm việc')
      suggestions.push('Phân ca làm việc cho nhân viên trong ngày này')
    } else {
      const workShift = workshifts.value.find(shift => shift.id === item.workShiftID)
      if (!workShift || !workShift.shiftDetails || workShift.shiftDetails.length === 0) {
        reasons.push('Ca làm việc không có cấu hình chi tiết')
        suggestions.push('Kiểm tra lại cấu hình ca làm việc')
      } else {
        const workDate = new Date(item.workDate)
        const dayOfWeek = workDate.getDay()
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
        const currentDayName = dayNames[dayOfWeek]
        const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
        
        if (!dayShiftDetail || dayShiftDetail.startTime === '00:00:00' || dayShiftDetail.endTime === '00:00:00') {
          reasons.push(`Ca làm việc không có cấu hình cho ${currentDayName}`)
          suggestions.push(`Cấu hình ca làm việc cho ${currentDayName}`)
        } else {
          const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
          const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
          
          // Kiểm tra xem giờ vào có sau giờ kết thúc ca không
          if (checkInTime >= shiftEnd) {
            suggestions.push('Kiểm tra lại thời gian chấm công')
          }
          
          // Kiểm tra xem giờ ra có trước giờ bắt đầu ca không
          if (checkOutTime <= shiftStart) {
            reasons.push('Giờ ra trước giờ bắt đầu ca làm việc')
            suggestions.push('Kiểm tra lại thời gian chấm công')
          }
          
          // Kiểm tra xem thời gian làm việc hiệu quả có bằng 0 không
          const effectiveCheckInTime = checkInTime < shiftStart ? shiftStart : checkInTime
          const effectiveCheckOutTime = checkOutTime < shiftEnd ? checkOutTime : shiftEnd
          const totalTimeHours = (effectiveCheckOutTime - effectiveCheckInTime) / (1000 * 60 * 60)
          
          if (totalTimeHours <= 0) {
            reasons.push('Giờ vào và ra không nằm trong ca làm việc')
            suggestions.push('Đảm bảo thời gian chấm công nằm trong khoảng ca làm việc')
          }
        }
      }
    }
  }
  
  return { reasons, suggestions }
}

/**
 * Hiển thị cảnh báo khi số giờ công bằng 0 thông qua AI Chatbot
 * @param {Object} item - Dữ liệu chấm công có số giờ công bằng 0
 */
function showZeroHoursWarning(item) {
  const analysis = analyzeZeroWorkTime(item)
  const reasonsText = analysis.reasons.length > 0 
    ? analysis.reasons.map((r, i) => `\n${i + 1}. ${r}`).join('')
    : '\nKhông xác định được nguyên nhân cụ thể'
  
  // Thêm gợi ý về việc đổi ca trong tab tổng hợp
  const allSuggestions = [...analysis.suggestions]
  if (item.workShiftID) {
    allSuggestions.push('Nếu người chấm công chọn nhầm ca, có thể vào tab "Bảng tổng hợp công" để chọn lại ca cho ngày này')
  }
  
  const suggestionsText = allSuggestions.length > 0
    ? allSuggestions.map((s, i) => `\n${i + 1}. ${s}`).join('')
    : '\nVui lòng kiểm tra lại dữ liệu chấm công'
  
  aiChatbotMessage.value = `CẢNH BÁO: Số giờ công bằng 0

\nNGUYÊN NHÂN CÓ THỂ:${reasonsText}

ĐỀ XUẤT:${suggestionsText}`
  showAIChatbot.value = true
  
  // Tự động mở chat bubble sau một khoảng thời gian ngắn
  setTimeout(() => {
    const chatbotButton = document.querySelector('.ai-chatbot-button')
    if (chatbotButton) {
      chatbotButton.click()
    }
  }, 100)
}

/**
 * Hiển thị cảnh báo khi số ngày công bằng 0 thông qua AI Chatbot
 * @param {Object} item - Dữ liệu chấm công có số ngày công bằng 0
 */
function showZeroDaysWarning(item) {
  const analysis = analyzeZeroWorkTime(item)
  const reasonsText = analysis.reasons.length > 0 
    ? analysis.reasons.map((r, i) => `\n${i + 1}. ${r}`).join('')
    : '\nKhông xác định được nguyên nhân cụ thể'
  
  // Thêm gợi ý về việc đổi ca trong tab tổng hợp
  const allSuggestions = [...analysis.suggestions]
  if (item.workShiftID) {
    allSuggestions.push('Nếu người chấm công chọn nhầm ca, có thể vào tab "Bảng tổng hợp công" để chọn lại ca cho ngày này')
  }
  
  const suggestionsText = allSuggestions.length > 0
    ? allSuggestions.map((s, i) => `\n${i + 1}. ${s}`).join('')
    : '\nVui lòng kiểm tra lại dữ liệu chấm công'
  
  aiChatbotMessage.value = `CẢNH BÁO: Số ngày công bằng 0

\nNGUYÊN NHÂN CÓ THỂ:${reasonsText}

\nĐỀ XUẤT:${suggestionsText}`
  showAIChatbot.value = true
  
  // Tự động mở chat bubble sau một khoảng thời gian ngắn
  setTimeout(() => {
    const chatbotButton = document.querySelector('.ai-chatbot-button')
    if (chatbotButton) {
      chatbotButton.click()
    }
  }, 100)
}


// ============================================================================
// HÀM CHUNG ĐỂ TÍNH NGÀY CÔNG
// ============================================================================

/**
 * Tính ngày công đi làm từ dữ liệu chấm công
 * @param {Object} attendanceItem - Dữ liệu chấm công (checkInTime, checkOutTime, workDate, workShiftID)
 * @param {Object} workShift - Thông tin ca làm việc (optional, sẽ tìm nếu không có)
 * @returns {Number} Số ngày công (chia cho ngày công chuẩn của ca = giờ ra ca - giờ vào ca - giờ nghỉ trưa)
 */
function calculateWorkDaysFromAttendanceData(attendanceItem, workShift = null) {
  if (!attendanceItem.checkInTime || !attendanceItem.checkOutTime) {
    return { actualWorkHours: 0, workDays: 0, standardWorkHours: 8 }
  }

  const checkInTime = new Date(`2000-01-01T${attendanceItem.checkInTime}`)
  const checkOutTime = new Date(`2000-01-01T${attendanceItem.checkOutTime}`)
  
  // Lấy thông tin chi tiết ca làm việc
  if (!workShift) {
    workShift = workshifts.value.find(shift => shift.id === attendanceItem.workShiftID)
  }
  
  if (!workShift || !workShift.shiftDetails) {
    // Dự phòng: tính từ thời gian thực tế, giả định 8 giờ chuẩn
    const actualWorkHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
    const workDays = Math.round((actualWorkHours / 8) * 100) / 100
    return { actualWorkHours, workDays, standardWorkHours: 8 }
  }

  const workDate = new Date(attendanceItem.workDate)
  const dayOfWeek = workDate.getDay()
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const currentDayName = dayNames[dayOfWeek]
  
  const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
  if (!dayShiftDetail || dayShiftDetail.startTime === '00:00:00' || dayShiftDetail.endTime === '00:00:00') {
    // Dự phòng: tính từ thời gian thực tế, giả định 8 giờ chuẩn
    const actualWorkHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
    const workDays = Math.round((actualWorkHours / 8) * 100) / 100
    return { actualWorkHours, workDays, standardWorkHours: 8 }
  }

  const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
  const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
  
  // Tính giờ công chuẩn cho ca này (giờ ra ca - giờ vào ca - giờ nghỉ trưa)
  let standardWorkHours = (shiftEnd - shiftStart) / (1000 * 60 * 60)
  if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
      dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
    const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
    const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
    const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60)
    standardWorkHours -= breakHours
  }
  
  // Tính thời gian chấm công vào/ra hiệu quả
  // Thời gian vào hiệu quả: nếu checkInTime < shiftStart thì lấy shiftStart, ngược lại lấy checkInTime
  const effectiveCheckInTime = checkInTime < shiftStart ? shiftStart : checkInTime
  
  // Thời gian ra hiệu quả: nếu checkOutTime < shiftEnd thì lấy checkOutTime, ngược lại lấy shiftEnd
  const effectiveCheckOutTime = checkOutTime < shiftEnd ? checkOutTime : shiftEnd
  
  // Tính tổng số giờ
  let totalTimeHours = (effectiveCheckOutTime - effectiveCheckInTime) / (1000 * 60 * 60)
  
  // Nếu kết quả âm thì = 0
  if (totalTimeHours < 0) {
    totalTimeHours = 0
  }
  
  // Trừ giờ nghỉ trưa nếu nó nằm trong thời gian làm việc
  let actualWorkHours = totalTimeHours
  if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
      dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
    const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
    const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
    if (effectiveCheckInTime <= breakEnd && effectiveCheckOutTime >= breakStart) {
      const actualBreakStart = effectiveCheckInTime > breakStart ? effectiveCheckInTime : breakStart
      const actualBreakEnd = effectiveCheckOutTime < breakEnd ? effectiveCheckOutTime : breakEnd
      const actualBreakHours = (actualBreakEnd - actualBreakStart) / (1000 * 60 * 60)
      actualWorkHours = totalTimeHours - Math.max(0, actualBreakHours)
    }
  }
  
  // Đảm bảo actualWorkHours không âm
  if (actualWorkHours < 0) {
    actualWorkHours = 0
  }
  
  // Tính ngày công: luôn chia cho 8 giờ chuẩn (1 ngày công = 8 giờ)
  // Không chia cho standardWorkHours của ca vì ngày công phải dựa trên chuẩn 8 giờ/ngày
  const divisor = 8 // 1 ngày công = 8 giờ chuẩn
  const workDays = Math.round((actualWorkHours / divisor) * 100) / 100
  return { actualWorkHours, workDays, standardWorkHours }
}

/**
 * Tính ngày công nghỉ phép từ leave request
 * @param {Object} leaveRequest - Thông tin nghỉ phép (startDateTime, endDateTime, workShiftID)
 * @param {Date} targetDate - Ngày cần tính
 * @param {Object} workShift - Thông tin ca làm việc (optional, sẽ tìm nếu không có)
 * @returns {Object} { actualWorkHours, workDays, standardWorkHours } - Số giờ công thực tế, số ngày công (chia cho ngày công chuẩn của ca = giờ ra ca - giờ vào ca - giờ nghỉ trưa), và giờ công chuẩn
 */
function calculateWorkDaysFromLeaveRequest(leaveRequest, targetDate, workShift = null) {
  if (!leaveRequest) return { actualWorkHours: 0, workDays: 0, standardWorkHours: 8 }

  const leaveStart = new Date(leaveRequest.startDateTime)
  const leaveEnd = new Date(leaveRequest.endDateTime)
  const target = new Date(targetDate)
  
  // Đặt ngày đích về đầu ngày để so sánh
  target.setHours(0, 0, 0, 0)
  
  // Kiểm tra xem ngày đích có nằm trong khoảng nghỉ phép không
  const leaveStartDate = new Date(leaveStart)
  leaveStartDate.setHours(0, 0, 0, 0)
  const leaveEndDate = new Date(leaveEnd)
  leaveEndDate.setHours(0, 0, 0, 0)
  
  if (target < leaveStartDate || target > leaveEndDate) {
    return { actualWorkHours: 0, workDays: 0, standardWorkHours: 8 } // Không nằm trong khoảng nghỉ phép
  }
  
  // Lấy thông tin chi tiết ca làm việc
  if (!workShift && leaveRequest.workShiftID) {
    workShift = workshifts.value.find(shift => shift.id === leaveRequest.workShiftID)
  }
  
  // Giờ công mặc định nếu không có thông tin ca
  let workHours = 0
  let standardWorkHours = 8 // Mặc định 8 giờ nếu không có thông tin ca
  
  if (workShift && workShift.shiftDetails) {
    const dayOfWeek = target.getDay()
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const currentDayName = dayNames[dayOfWeek]
    
    const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
    
    // Debug log để kiểm tra shift detail
    console.log('Shift detail lookup:', {
      currentDayName,
      dayShiftDetail: dayShiftDetail ? {
        startTime: dayShiftDetail.startTime,
        endTime: dayShiftDetail.endTime,
        breakStart: dayShiftDetail.breakStart,
        breakEnd: dayShiftDetail.breakEnd
      } : null,
      allShiftDetails: workShift.shiftDetails.map(d => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }))
    });
    
    if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
      const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
      const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
      
      // Tính giờ công chuẩn (giờ ra ca - giờ vào ca - giờ nghỉ trưa)
      standardWorkHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)
      if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
          dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
        const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
        const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
        const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60)
        standardWorkHours -= breakHours
      }
      
      // Xác định giờ công dựa trên khoảng nghỉ phép
      if (target.getTime() === leaveStartDate.getTime() && target.getTime() === leaveEndDate.getTime()) {
        // Nghỉ phép một ngày
        const leaveStartTime = new Date(`2000-01-01T${leaveStart.toTimeString().substring(0, 8)}`)
        const leaveEndTime = new Date(`2000-01-01T${leaveEnd.toTimeString().substring(0, 8)}`)
        const leaveStartTimeOnly = leaveStartTime.getTime()
        const leaveEndTimeOnly = leaveEndTime.getTime()
        const shiftStartTime = shiftStart.getTime()
        const shiftEndTime = shiftEnd.getTime()
        
        // Nếu nghỉ phép từ đầu ca đến cuối ca (hoặc bao gồm cả đầu ca và cuối ca), tính full ca
        if (leaveStartTimeOnly <= shiftStartTime && leaveEndTimeOnly >= shiftEndTime) {
          workHours = standardWorkHours
        } else {
          // Nếu nghỉ phép không full ca, tính theo thời gian thực tế
          const effectiveStart = leaveStartTimeOnly < shiftStartTime ? shiftStart : leaveStartTime
          const effectiveEnd = leaveEndTimeOnly > shiftEndTime ? shiftEnd : leaveEndTime
          const leaveHours = (effectiveEnd - effectiveStart) / (1000 * 60 * 60)
          
          // Trừ giờ nghỉ nếu nó nằm trong thời gian nghỉ phép
          if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
              dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
            const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
            const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
            if (effectiveStart <= breakEnd && effectiveEnd >= breakStart) {
              const actualBreakStart = effectiveStart > breakStart ? effectiveStart : breakStart
              const actualBreakEnd = effectiveEnd < breakEnd ? effectiveEnd : breakEnd
              const actualBreakHours = (actualBreakEnd - actualBreakStart) / (1000 * 60 * 60)
              workHours = leaveHours - Math.max(0, actualBreakHours)
            } else {
              workHours = leaveHours
            }
          } else {
            workHours = leaveHours
          }
        }
      } else if (target.getTime() === leaveStartDate.getTime()) {
        // Ngày đầu tiên - từ giờ bắt đầu nghỉ phép đến giờ kết thúc ca
        // Lấy giờ từ leaveStart (có thể có timezone, nên dùng getHours/getMinutes/getSeconds)
        const leaveStartHours = leaveStart.getHours()
        const leaveStartMinutes = leaveStart.getMinutes()
        const leaveStartSeconds = leaveStart.getSeconds()
        const leaveStartTime = new Date(2000, 0, 1, leaveStartHours, leaveStartMinutes, leaveStartSeconds)
        const leaveStartTimeOnly = leaveStartTime.getTime()
        const shiftStartTime = shiftStart.getTime()
        
        // Debug log
        console.log('First day calculation:', {
          leaveStart: leaveStart.toISOString(),
          leaveStartHours,
          leaveStartMinutes,
          leaveStartTime: leaveStartTime.toTimeString().substring(0, 8),
          leaveStartTimeOnly,
          shiftStartTime,
          shiftStart: shiftStart.toTimeString().substring(0, 8),
          shiftEnd: shiftEnd.toTimeString().substring(0, 8),
          standardWorkHours
        });
        
        // Nếu nghỉ phép bắt đầu từ đầu ca (leaveStartTime <= shiftStart), tính full ca
        if (leaveStartTimeOnly <= shiftStartTime) {
          workHours = standardWorkHours
          console.log('First day: Full shift (leaveStartTime <= shiftStart)', workHours);
        } else {
          // Nếu nghỉ phép bắt đầu sau đầu ca, tính từ leaveStartTime đến shiftEnd
          const effectiveEnd = shiftEnd
          const dayHours = (effectiveEnd.getTime() - leaveStartTime.getTime()) / (1000 * 60 * 60)
          
          console.log('First day: Partial shift calculation:', {
            leaveStartTime: leaveStartTime.toTimeString().substring(0, 8),
            effectiveEnd: effectiveEnd.toTimeString().substring(0, 8),
            dayHours
          });
          
          // Trừ giờ nghỉ nếu có
          if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
              dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
            const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
            const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
            if (leaveStartTime.getTime() <= breakEnd.getTime() && effectiveEnd.getTime() >= breakStart.getTime()) {
              const actualBreakStart = leaveStartTime.getTime() > breakStart.getTime() ? leaveStartTime : breakStart
              const actualBreakEnd = effectiveEnd.getTime() < breakEnd.getTime() ? effectiveEnd : breakEnd
              const actualBreakHours = (actualBreakEnd.getTime() - actualBreakStart.getTime()) / (1000 * 60 * 60)
              workHours = dayHours - Math.max(0, actualBreakHours)
              console.log('First day: After break subtraction:', { actualBreakHours, workHours });
            } else {
              workHours = dayHours
            }
          } else {
            workHours = dayHours
          }
          
          console.log('First day: Final workHours:', workHours);
        }
      } else if (target.getTime() === leaveEndDate.getTime()) {
        // Ngày cuối cùng - từ giờ bắt đầu ca đến giờ kết thúc nghỉ phép
        const leaveEndTime = new Date(`2000-01-01T${leaveEnd.toTimeString().substring(0, 8)}`)
        const leaveEndTimeOnly = leaveEndTime.getTime()
        const shiftEndTime = shiftEnd.getTime()
        
        // Nếu nghỉ phép kết thúc ở cuối ca (leaveEndTime >= shiftEnd), tính full ca
        if (leaveEndTimeOnly >= shiftEndTime) {
          workHours = standardWorkHours
        } else {
          // Nếu nghỉ phép kết thúc trước cuối ca, tính từ shiftStart đến leaveEndTime
          const effectiveStart = shiftStart
          const dayHours = (leaveEndTime.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60)
          
          // Trừ giờ nghỉ nếu có
          if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
              dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
            const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
            const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
            if (effectiveStart.getTime() <= breakEnd.getTime() && leaveEndTime.getTime() >= breakStart.getTime()) {
              const actualBreakStart = effectiveStart.getTime() > breakStart.getTime() ? effectiveStart : breakStart
              const actualBreakEnd = leaveEndTime.getTime() < breakEnd.getTime() ? leaveEndTime : breakEnd
              const actualBreakHours = (actualBreakEnd.getTime() - actualBreakStart.getTime()) / (1000 * 60 * 60)
              workHours = dayHours - Math.max(0, actualBreakHours)
            } else {
              workHours = dayHours
            }
          } else {
            workHours = dayHours
          }
        }
      } else {
        // Ngày giữa - full ca làm việc
        workHours = standardWorkHours
      }
    } else {
      // Không có thông tin chi tiết ca - nhưng vẫn cần tính toán dựa trên thời gian nghỉ phép
      // Nếu là ngày đầu tiên, tính từ leaveStart đến 17:00 (mặc định)
      // Nếu là ngày cuối, tính từ 08:00 (mặc định) đến leaveEnd
      // Nếu là ngày giữa, tính full ca (8 giờ)
      if (target.getTime() === leaveStartDate.getTime()) {
        // Ngày đầu tiên - từ leaveStart đến 17:00 (mặc định)
        const leaveStartHours = leaveStart.getHours()
        const leaveStartMinutes = leaveStart.getMinutes()
        const leaveStartSeconds = leaveStart.getSeconds()
        const leaveStartTime = new Date(2000, 0, 1, leaveStartHours, leaveStartMinutes, leaveStartSeconds)
        const defaultEndTime = new Date(2000, 0, 1, 17, 0, 0) // 17:00 mặc định
        workHours = (defaultEndTime.getTime() - leaveStartTime.getTime()) / (1000 * 60 * 60)
        console.log('First day (no shift detail):', { leaveStartTime: leaveStartTime.toTimeString().substring(0, 8), workHours });
      } else if (target.getTime() === leaveEndDate.getTime()) {
        // Ngày cuối cùng - từ 08:00 (mặc định) đến leaveEnd
        const leaveEndHours = leaveEnd.getHours()
        const leaveEndMinutes = leaveEnd.getMinutes()
        const leaveEndSeconds = leaveEnd.getSeconds()
        const leaveEndTime = new Date(2000, 0, 1, leaveEndHours, leaveEndMinutes, leaveEndSeconds)
        const defaultStartTime = new Date(2000, 0, 1, 8, 0, 0) // 08:00 mặc định
        workHours = (leaveEndTime.getTime() - defaultStartTime.getTime()) / (1000 * 60 * 60)
        console.log('Last day (no shift detail):', { leaveEndTime: leaveEndTime.toTimeString().substring(0, 8), workHours });
      } else {
        // Ngày giữa - full ca (8 giờ mặc định)
      workHours = standardWorkHours
      }
    }
  } else {
    // Không có thông tin ca, dùng mặc định
    workHours = standardWorkHours
  }
  
  // Đảm bảo workHours không âm
  if (workHours < 0) {
    workHours = 0
  }
  
  // Tính ngày công: luôn chia cho 8 giờ chuẩn (1 ngày công = 8 giờ)
  // Không chia cho standardWorkHours của ca vì ngày công phải dựa trên chuẩn 8 giờ/ngày
  const divisor = 8 // 1 ngày công = 8 giờ chuẩn
  const workDays = Math.round((workHours / divisor) * 100) / 100
  
  console.log('calculateWorkDaysFromLeaveRequest final result:', {
    targetDate: target.toLocaleDateString('vi-VN'),
    actualWorkHours: workHours,
    standardWorkHours,
    workDays
  });
  
  return { actualWorkHours: workHours, workDays, standardWorkHours }
}

/**
 * Tính ngày công từ dữ liệu chấm công (hàm legacy, giữ lại để tương thích ngược)
 * @param {Object} attendanceItem - Dữ liệu chấm công
 * @returns {Number} Số ngày công
 */
function calculateWorkDaysFromAttendance(attendanceItem) {
  const result = calculateWorkDaysFromAttendanceData(attendanceItem)
  return typeof result === 'object' ? result.workDays : result
}

/**
 * Tính toán tổng hợp công của nhân viên từ dữ liệu chấm công và nghỉ phép
 * Bao gồm: tổng đi làm, nghỉ có lương, vắng không phép, số phút đi trễ, số phút về sớm
 * @param {String|Number} employeeId - ID của nhân viên
 * @param {String} employeeName - Tên nhân viên
 * @returns {Object} Summary object với các thống kê công
 */
function calculateEmployeeSummary(employeeId, employeeName) {
  const summary = {
    totalWorkDays: 0,
    totalPresent: 0,
    totalPaidLeave: 0,
    totalAbsentWithoutLeave: 0,
    totalLateMinutes: 0,
    totalEarlyMinutes: 0,
    totalForgotCheckIn: 0,
    totalForgotCheckOut: 0
  }

  // Tính từ attendanceList (dữ liệu chấm công thực tế)
  // Tổng hợp workDays từ từng ngày chấm công (cộng workDays của từng ngày lại)
  if (attendanceList.value && attendanceList.value.length > 0) {
    const employeeAttendance = attendanceList.value.filter(att => {
      const attEmployeeId = att.employeeCode || att.employeeID || att.employeeId
      return attEmployeeId === employeeId
    })

    // Tính tổng đi làm (ngày công) từ dữ liệu chấm công
    employeeAttendance.forEach(att => {
      if (att.checkInTime && att.checkOutTime) {
        const result = calculateWorkDaysFromAttendanceData(att)
        summary.totalPresent += result.workDays
        
        // Tính số phút đi trễ và về sớm
        if (att.workShiftID) {
          const workShift = workshifts.value.find(shift => shift.id === att.workShiftID)
          let shiftStart = null
          let shiftEnd = null
          
          if (workShift && workShift.shiftDetails) {
            const workDate = new Date(att.workDate)
            const dayOfWeek = workDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const currentDayName = dayNames[dayOfWeek]
            const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
            
            if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
              const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
              const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
              const checkInTime = new Date(`2000-01-01T${att.checkInTime}`)
              const checkOutTime = new Date(`2000-01-01T${att.checkOutTime}`)
              
              if (checkInTime > shiftStart) {
                summary.totalLateMinutes += Math.round((checkInTime - shiftStart) / (1000 * 60))
              }
              if (checkOutTime < shiftEnd) {
                summary.totalEarlyMinutes += Math.round((shiftEnd - checkOutTime) / (1000 * 60))
              }
            }
          }
        }
      } else if (att.checkOutTime && !att.checkInTime) {
        summary.totalForgotCheckIn += 1
      } else if (att.checkInTime && !att.checkOutTime) {
        summary.totalForgotCheckOut += 1
      }
    })
  }

  // Tính ngày nghỉ có lương từ các đơn nghỉ phép
  // Tổng hợp workDays từ từng ngày nghỉ phép (cộng workDays của từng ngày lại)
  // Chỉ tính các ngày không có chấm công thực tế
  // Nếu có nhiều đơn trùng lặp trong cùng một ngày, chỉ tính đơn có thời gian nghỉ dài hơn
  if (leaveRequests.value && leaveRequests.value.length > 0) {
    const monthStart = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    const monthEnd = new Date(selectedYear.value, selectedMonth.value, 0, 23, 59, 59)
    
    // Lấy danh sách các ngày đã có chấm công thực tế
    const attendanceDates = new Set()
    if (attendanceList.value && attendanceList.value.length > 0) {
      const employeeAttendance = attendanceList.value.filter(att => {
        const attEmployeeId = att.employeeCode || att.employeeID || att.employeeId
        return attEmployeeId === employeeId
      })
      
      employeeAttendance.forEach(att => {
        if (att.checkInTime && att.checkOutTime) {
          const workDate = new Date(att.workDate)
          workDate.setHours(0, 0, 0, 0)
          attendanceDates.add(workDate.getTime())
        }
      })
    }
    
    // Lọc các đơn nghỉ phép có lương đã duyệt của nhân viên này
    const paidLeaveRequests = leaveRequests.value.filter(leave => {
      if (leave.employeeID !== employeeId) return false
      
      const leaveStart = new Date(leave.startDateTime)
      const leaveEnd = new Date(leave.endDateTime)
      if (leaveStart > monthEnd || leaveEnd < monthStart) return false
      
      const leaveTypeName = (leave.leaveTypeName || '').toLowerCase()
      // Chỉ tính "Phép năm" và "Phép có lương", loại trừ "Nghỉ bù"
      const isPaidLeave = (leaveTypeName.includes('phép năm') || 
                          leaveTypeName.includes('phép có lương')) &&
                          !leaveTypeName.includes('nghỉ bù') &&
                          !leaveTypeName.includes('bù')
      
      return isPaidLeave && (leave.approveStatus === 'Đã duyệt' || leave.approveStatus === 'Approved')
    })
    
    // Nhóm các đơn theo ngày và tìm khoảng nghỉ phép dài nhất cho mỗi ngày
    // Map<dayString, {leave, duration, workDays}>
    const dayLeaveMap = new Map()
    
    paidLeaveRequests.forEach(leave => {
      const leaveStart = new Date(leave.startDateTime)
      const leaveEnd = new Date(leave.endDateTime)
      
      // Tính ngày công cho mỗi ngày trong khoảng nghỉ phép trong tháng
        const startDate = new Date(leaveStart > monthStart ? leaveStart : monthStart)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(leaveEnd < monthEnd ? leaveEnd : monthEnd)
        endDate.setHours(0, 0, 0, 0)
        
        // Lặp qua từng ngày trong khoảng nghỉ phép
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          // Chỉ tính nghỉ phép cho các ngày không có chấm công thực tế
          const dateKey = new Date(d)
          dateKey.setHours(0, 0, 0, 0)
          
          // Đảm bảo ngày nằm trong phạm vi tháng
          if (dateKey >= monthStart && dateKey <= monthEnd) {
            if (!attendanceDates.has(dateKey.getTime())) {
            const dayString = `${dateKey.getFullYear()}-${String(dateKey.getMonth() + 1).padStart(2, '0')}-${String(dateKey.getDate()).padStart(2, '0')}`
            
            // Tính phần của đơn nghỉ phép này rơi vào ngày này
            const dayStart = new Date(dateKey.getFullYear(), dateKey.getMonth(), dateKey.getDate())
            const dayEnd = new Date(dateKey.getFullYear(), dateKey.getMonth(), dateKey.getDate(), 23, 59, 59, 999)
            
            const requestStartOnDay = leaveStart > dayStart ? leaveStart : dayStart
            const requestEndOnDay = leaveEnd < dayEnd ? leaveEnd : dayEnd
            const dayDuration = requestEndOnDay - requestStartOnDay
            
            // Tính workDays cho ngày này
            const result = calculateWorkDaysFromLeaveRequest(leave, dateKey)
            
            // Lưu khoảng nghỉ phép dài nhất cho ngày này
            if (!dayLeaveMap.has(dayString) || dayLeaveMap.get(dayString).duration < dayDuration) {
              dayLeaveMap.set(dayString, { 
                leave, 
                duration: dayDuration, 
                workDays: result.workDays 
              })
            }
          }
        }
      }
    })
    
    // Tổng hợp workDays từ khoảng nghỉ phép dài nhất cho mỗi ngày
    // Đồng thời tính số phút đi trễ/về sớm từ các đơn nghỉ phép
    dayLeaveMap.forEach((dayData, dayString) => {
      summary.totalPaidLeave += dayData.workDays
      
      // Tính số phút đi trễ/về sớm từ đơn nghỉ phép
      const leave = dayData.leave
      const dateKey = new Date(dayString + 'T00:00:00')
      
      // Lấy thông tin chi tiết ca làm việc cho ngày này
      let shiftStart = null
      let shiftEnd = null
      
      if (leave.workShiftID) {
        const workShift = workshifts.value.find(shift => shift.id === leave.workShiftID)
        if (workShift && workShift.shiftDetails) {
          const dayOfWeek = dateKey.getDay()
          const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
          const currentDayName = dayNames[dayOfWeek]
          const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
          
          if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
            shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
            shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
          } else {
            // Dự phòng: thử lấy từ các ngày khác
            const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
            for (const dayName of weekdays) {
              const fallbackDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === dayName)
              if (fallbackDetail && fallbackDetail.startTime !== '00:00:00' && fallbackDetail.endTime !== '00:00:00') {
                shiftStart = new Date(`2000-01-01T${fallbackDetail.startTime}`)
                shiftEnd = new Date(`2000-01-01T${fallbackDetail.endTime}`)
                break
              }
            }
          }
        }
      }
      
      // Nếu vẫn không có thời gian ca, dùng mặc định 8:00-17:00
      if (!shiftStart) {
        shiftStart = new Date('2000-01-01T08:00:00')
      }
      if (!shiftEnd) {
        shiftEnd = new Date('2000-01-01T17:00:00')
      }
      
      // Xác định xem đây là ngày đầu, ngày cuối, hay ngày giữa
      const leaveStart = new Date(leave.startDateTime)
      const leaveEnd = new Date(leave.endDateTime)
      const leaveStartDate = new Date(leaveStart)
      leaveStartDate.setHours(0, 0, 0, 0)
      const leaveEndDate = new Date(leaveEnd)
      leaveEndDate.setHours(0, 0, 0, 0)
      const currentLeaveDate = new Date(dateKey)
      currentLeaveDate.setHours(0, 0, 0, 0)
      
      if (leaveStartDate.getTime() === leaveEndDate.getTime()) {
        // Nghỉ phép một ngày - tính đi trễ/về sớm dựa trên thời gian nghỉ phép thực tế
        const leaveStartTime = new Date(leave.startDateTime)
        const leaveEndTime = new Date(leave.endDateTime)
        const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`)
        const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`)
        
        if (leaveStartTimeOnly > shiftStart) {
          summary.totalLateMinutes += Math.round((leaveStartTimeOnly - shiftStart) / (1000 * 60))
        }
        if (leaveEndTimeOnly < shiftEnd) {
          summary.totalEarlyMinutes += Math.round((shiftEnd - leaveEndTimeOnly) / (1000 * 60))
        }
      } else {
        // Nghỉ phép nhiều ngày
        if (currentLeaveDate.getTime() === leaveStartDate.getTime()) {
          // Ngày đầu - tính đi trễ dựa trên thời gian bắt đầu nghỉ phép
          const leaveStartTime = new Date(leave.startDateTime)
          const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`)
          
          if (leaveStartTimeOnly > shiftStart) {
            summary.totalLateMinutes += Math.round((leaveStartTimeOnly - shiftStart) / (1000 * 60))
          }
        } else if (currentLeaveDate.getTime() === leaveEndDate.getTime()) {
          // Ngày cuối - tính về sớm dựa trên thời gian kết thúc nghỉ phép
          const leaveEndTime = new Date(leave.endDateTime)
          const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`)
          
          if (leaveEndTimeOnly < shiftEnd) {
            summary.totalEarlyMinutes += Math.round((shiftEnd - leaveEndTimeOnly) / (1000 * 60))
          }
        }
        // Các ngày giữa - không có đi trễ/về sớm (full ca)
      }
    })
  }

  // Tính vắng không phép từ ma trận chấm công
  // Đếm các ngày có status 'absent-without-leave' (đã được xác định trong generateAttendanceForEmployee)
  const empIdx = allEmployees.value.findIndex(e => e.id === employeeId)
  if (empIdx !== -1 && attendanceMatrix.value && attendanceMatrix.value[empIdx]) {
    const employeeAttendance = attendanceMatrix.value[empIdx]

    employeeAttendance.forEach((dayData, dayIdx) => {
      if (!dayData) return

      // Đếm các ngày có status 'absent-without-leave'
      // Logic xác định vắng không phép đã được xử lý trong hàm generateAttendanceForEmployee
      if (dayData.status === 'absent-without-leave') {
          summary.totalAbsentWithoutLeave += 1
      }
    })
  }

  // Tổng ngày công = tổng đi làm + tổng nghỉ có lương
  summary.totalWorkDays = summary.totalPresent + summary.totalPaidLeave

  return summary
}

/**
 * Mở modal hiển thị thông tin tổng hợp công của nhân viên
 * @param {Object} emp - Đối tượng nhân viên
 */
function openEmployeeModal(emp) {
  // Tìm employee đầy đủ từ allEmployees để có thông tin đầy đủ
  const fullEmployee = allEmployees.value.find(e => e.id === emp.id) || emp
  
  // Tính toán summary từ dữ liệu attendance
  const summary = calculateEmployeeSummary(emp.id, emp.name || emp.employeeName)
  
  selectedEmployee.value = {
    ...fullEmployee,
    name: fullEmployee.employeeName || fullEmployee.name || `${fullEmployee.firstName || ''} ${fullEmployee.lastName || ''}`.trim() || emp.id,
    position: fullEmployee.roleName || fullEmployee.position || fullEmployee.title || 'N/A',
    summary: summary
  }
  showEmployeeModal.value = true
}
/**
 * Đóng modal thông tin tổng hợp công của nhân viên
 */
function closeEmployeeModal() {
  showEmployeeModal.value = false
}

/**
 * Mở modal chi tiết chấm công từng ngày cho nhân viên
 * @param {Object} emp - Đối tượng nhân viên
 * @param {Number} dayIdx - Chỉ số ngày trong tháng (0-based)
 */
async function openDayModal(emp, dayIdx) {
  // Tìm employee đầy đủ từ allEmployees để có thông tin name và position
  const fullEmployee = allEmployees.value.find(e => e.id === emp.id) || emp
  selectedEmployee.value = {
    ...fullEmployee,
    name: fullEmployee.employeeName || fullEmployee.name || `${fullEmployee.firstName || ''} ${fullEmployee.lastName || ''}`.trim(),
    position: fullEmployee.roleName || fullEmployee.position || fullEmployee.title || ''
  }
  selectedDateIdx.value = dayIdx
  showDayModal.value = true
  
  // Đặt lại dữ liệu trước đó và trạng thái loading
  dayModalLoading.value = true
  dayModalError.value = null
  attendanceHistory.value = []
  workHistory.value = []
  updatingShifts.value = {} // Đặt lại trạng thái cập nhật
  
  // Tải dữ liệu thực tế cho ngày đã chọn
  await loadDayModalData(selectedEmployee.value, dayIdx)
}

/**
 * Mở modal chi tiết chấm công từng ngày từ tab bảng công cá nhân
 * @param {Object} day - Đối tượng ngày từ calendar
 */
async function openPersonalDayModal(day) {
  if (!day || !day.isCurrentMonth || !day.day) return
  
  if (!currentUser.value) {
    console.error('Current user not found')
    return
  }
  
  // Tính chỉ số ngày (day.day là 1-based, dayIdx là 0-based)
  const dayIdx = day.day - 1
  
  // Sử dụng người dùng hiện tại làm nhân viên
  await openDayModal(currentUser.value, dayIdx)
}

/**
 * Đóng modal chi tiết chấm công từng ngày
 */
function closeDayModal() {
  showDayModal.value = false
}

/**
 * Xử lý sự kiện click vào ảnh chấm công để phóng to
 * @param {String} imageUrl - URL của ảnh
 * @param {String} imageType - Loại ảnh ('checkin' hoặc 'checkout')
 */
function handleImageClick(imageUrl, imageType = 'checkin') {
  if (!imageUrl) return
  
  selectedImage.value = {
    url: imageUrl,
    type: imageType
  }
  showImageModal.value = true
}

/**
 * Mở modal hiển thị bản đồ vị trí chấm công
 * @param {Number} lat - Vĩ độ
 * @param {Number} lng - Kinh độ
 * @param {String} locationName - Tên địa điểm
 */
function openLocationMap(lat, lng, locationName) {
  mapLocation.value = {
    lat: lat,
    lng: lng,
    name: locationName || 'Vị trí chấm công'
  }
  showLocationMapModal.value = true
}

/**
 * Mở modal form nghỉ phép với mã phiếu cụ thể
 * @param {String} voucherCode - Mã phiếu nghỉ phép
 */
const openLeaveFormModal = (voucherCode) => {
  if (!voucherCode) return
  
  const leaveRequest = leaveRequests.value.find(leave => leave.voucherCode === voucherCode)
  
  if (leaveRequest) {
    selectedLeaveRequest.value = leaveRequest
    showLeaveFormModal.value = true
  }
}

/**
 * Đóng modal form nghỉ phép
 */
function closeLeaveFormModal() {
  showLeaveFormModal.value = false
  selectedLeaveRequest.value = null
}

// ============================================================================
// CẤU HÌNH CỘT BẢNG DỮ LIỆU
// ============================================================================
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

// Cột không có hành động cho modal ngày
const attendanceColumnsNoActions = [
  { key: 'stt', label: 'STT' },
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

// ============================================================================
// COMPUTED PROPERTIES - DỮ LIỆU ĐÃ LỌC
// ============================================================================
const filteredAttendanceHistory = computed(() => attendanceHistory.value || [])
const filteredWorkHistory = computed(() => workHistory.value || [])

/**
 * Lấy danh sách ca đã được phân cho nhân viên trong ngày cụ thể
 * @returns {Array} Danh sách ca làm việc đã được phân
 */
const assignedShiftsForEmployeeAndDate = computed(() => {
  if (!selectedEmployee.value || selectedDateIdx.value === null) {
    return []
  }
  
  // Lấy ngày cụ thể từ dayHeaders
  const selectedDateHeader = dayHeaders.value[selectedDateIdx.value]
  if (!selectedDateHeader) {
    return []
  }
  
  // Phân tích ngày từ dayHeader (định dạng: "DD/MM (T2)" hoặc tương tự)
  const selectedDayMonth = selectedDateHeader.split(' ')[0] // Trích xuất phần "DD/MM"
  const [day, month] = selectedDayMonth.split('/')
  const fullDate = `${selectedYear.value}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const targetDate = new Date(fullDate)
  
  // Lấy các workShiftID đã được phân cho nhân viên này trong ngày cụ thể
  const assignedShiftIds = new Set()
  if (shiftAssignments.value?.length) {
    shiftAssignments.value.forEach(assignment => {
      if (assignment.employeeID === selectedEmployee.value.id) {
        const assignmentDate = new Date(assignment.workDate)
        // So sánh ngày (bỏ qua giờ phút)
        if (assignmentDate.toDateString() === targetDate.toDateString()) {
          assignedShiftIds.add(assignment.workShiftID)
        }
      }
    })
  }
  
  // Lọc danh sách ca từ workshifts dựa trên các ID đã phân trong ngày đó
  const assignedShifts = workshifts.value.filter(shift => assignedShiftIds.has(shift.id))
  
  return assignedShifts
})

/**
 * Lấy danh sách ca có sẵn cho một item chấm công cụ thể (bao gồm ca hiện tại)
 * @param {Object} item - Item chấm công cần lấy danh sách ca
 * @returns {Array} Danh sách ca làm việc có sẵn
 */
const getAvailableShiftsForItem = (item) => {
  const assignedShifts = assignedShiftsForEmployeeAndDate.value
  
  // Nếu item có workShiftID hiện tại, đảm bảo ca đó có trong danh sách
  if (item.workShiftID) {
    const currentShift = workshifts.value.find(shift => shift.id === item.workShiftID)
    if (currentShift && !assignedShifts.find(s => s.id === currentShift.id)) {
      // Thêm ca hiện tại vào đầu danh sách nếu chưa có trong danh sách
      return [currentShift, ...assignedShifts]
    }
  }
  
  return assignedShifts
}

// ============================================================================
// CẤU HÌNH TAB
// ============================================================================

const allTabs = [
  { key: 'summary', label: 'Bảng tổng hợp công', icon: 'fas fa-table', restricted: true },
  { key: 'personal', label: 'Bảng công cá nhân', icon: 'fas fa-user-clock', restricted: false },
  { key: 'overtime', label: 'Bảng công tăng ca', icon: 'fas fa-business-time', restricted: true },
  { key: 'personalOvertime', label: 'Bảng công tăng ca cá nhân', icon: 'fas fa-user-plus', restricted: false },
  { key: 'detail', label: 'Bảng công chi tiết', icon: 'fas fa-list-alt', restricted: false, personalOnly: true },
  { key: 'attendance', label: 'Dữ liệu chấm công', icon: 'fas fa-fingerprint', restricted: false, personalOnly: true },
]

/**
 * Lọc danh sách tab dựa trên quyền của người dùng
 * @returns {Array} Danh sách tab được phép truy cập
 */
const tabs = computed(() => {
  return allTabs.filter(tab => {
    // If tab is not restricted, show it to everyone
    if (!tab.restricted) return true
    
    // If tab is restricted, check permissions based on tab type
    if (tab.key === 'summary' || tab.key === 'overtime') {
      return canView('attendance-summary')
    }
    
    // Đối với các tab bị hạn chế khác, sử dụng logic hiện có làm dự phòng
    const hasHRPermission = isDirector.value || isHRManager.value || isHREmployee.value
    return hasHRPermission
  })
})

// Theo dõi thay đổi trong tabs và điều chỉnh activeTab nếu cần
watch(tabs, (newTabs) => {
  const availableTabKeys = newTabs.map(tab => tab.key)
  
  // Nếu tab đang hoạt động hiện tại không khả dụng, chuyển sang tab khả dụng đầu tiên
  if (!availableTabKeys.includes(activeTab.value)) {
    if (availableTabKeys.length > 0) {
      activeTab.value = availableTabKeys[0]
    }
  }
}, { immediate: true })

// Bộ lọc thời gian và phân trang đã được khai báo ở phần BIẾN REACTIVE phía trên

// Giới hạn số lượng tab hiển thị
const visibleTabsCount = computed(() => Math.min(6, tabs.value.length))
const visibleTabs = computed(() => tabs.value.slice(0, visibleTabsCount.value))
const hiddenTabs = computed(() => tabs.value.slice(visibleTabsCount.value))

/**
 * Chuyển đổi tab và tải dữ liệu tương ứng
 * @param {String} tabKey - Key của tab cần chuyển đến
 */
const selectTab = async (tabKey) => {
  activeTab.value = tabKey
  showMoreTabs.value = false // Đóng dropdown "Thêm" khi một tab được chọn

  // Phản ánh thay đổi tab trong URL để điều hướng bên ngoài hoạt động
  try {
    await router.replace({ path: route.path, query: { ...route.query, tab: tabKey } })
  } catch (e) {}

  // Tải dữ liệu cụ thể khi chuyển sang tab tổng hợp
  if (tabKey === 'summary') {
    await Promise.all([
      loadAttendanceDataForSummary(),
      fetchLeaveRequests()
    ])
  }
  
  if (tabKey === 'personal') {
    await Promise.all([
      loadAttendanceData(),
      fetchLeaveRequests()
    ])
  }
  
  if (tabKey === 'personalOvertime') {
    await Promise.all([
      loadOvertimeData(),
      fetchOvertimeRequests()
    ])
  }
}

/**
 * Tạo danh sách header các ngày trong tháng được chọn (format: "DD/MM (T2)")
 * @returns {Array} Mảng các chuỗi header ngày
 */
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

/**
 * Lấy thông tin chi tiết ca làm việc theo ID
 * @param {String|Number} workShiftId - ID của ca làm việc
 * @returns {Object|null} Thông tin ca làm việc hoặc null nếu không tìm thấy
 */
function getWorkShiftDetails(workShiftId) {
  if (!workshifts.value || !workShiftId) return null;

  const workShift = workshifts.value.find(shift =>
    shift.workShiftID === workShiftId ||
    shift.id === workShiftId ||
    String(shift.workShiftID) === String(workShiftId)
  );

  return workShift;
}

/**
 * Kiểm tra xem thời gian nghỉ phép có đủ so với ca làm việc không
 * @param {Object} leaveRequest - Đơn nghỉ phép
 * @param {String|Number} workShiftId - ID của ca làm việc
 * @returns {Boolean} true nếu thời gian nghỉ phép đủ, false nếu không
 */
function isLeaveTimeSufficient(leaveRequest, workShiftId) {
  if (!leaveRequest || !workShiftId) return true; // Mặc định là đủ nếu không có dữ liệu

  const workShift = getWorkShiftDetails(workShiftId);
  if (!workShift || !workShift.shiftDetails || workShift.shiftDetails.length === 0) {
    return true; // Mặc định là đủ nếu không có dữ liệu ca làm việc
  }

  // Lấy thời gian nghỉ phép
  const leaveStart = new Date(leaveRequest.startDateTime);
  const leaveEnd = new Date(leaveRequest.endDateTime);

  // Lấy thời gian ca làm việc (giả định shiftDetails có start và end times)
  // Có thể cần điều chỉnh dựa trên cấu trúc workShift thực tế
  const shiftDetail = workShift.shiftDetails[0]; // Giả định detail đầu tiên chứa ca chính
  if (!shiftDetail || !shiftDetail.startTime || !shiftDetail.endTime) {
    return true; // Mặc định là đủ nếu không có dữ liệu thời gian ca
  }

  // Phân tích thời gian ca (giả định định dạng như "08:00" hoặc "08:30:00")
  const [shiftStartHour, shiftStartMin] = shiftDetail.startTime.split(':').map(Number);
  const [shiftEndHour, shiftEndMin] = shiftDetail.endTime.split(':').map(Number);

  const shiftStart = new Date(leaveStart);
  shiftStart.setHours(shiftStartHour, shiftStartMin, 0, 0);

  const shiftEnd = new Date(leaveEnd);
  shiftEnd.setHours(shiftEndHour, shiftEndMin, 0, 0);

  // Kiểm tra xem thời gian nghỉ phép có bao phủ toàn bộ ca làm việc không
  const leaveStartTime = leaveStart.getTime();
  const leaveEndTime = leaveEnd.getTime();
  const shiftStartTime = shiftStart.getTime();
  const shiftEndTime = shiftEnd.getTime();

  return leaveStartTime <= shiftStartTime && leaveEndTime >= shiftEndTime
}

/**
 * Format ngày thành chuỗi định dạng YYYY-MM-DD
 * @param {Date} date - Đối tượng Date cần format
 * @returns {String} Chuỗi ngày định dạng YYYY-MM-DD
 */
const formatDateToString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format datetime thành chuỗi ngày YYYY-MM-DD
 * @param {String|Date} dateTime - Datetime string hoặc Date object
 * @returns {String} Chuỗi ngày định dạng YYYY-MM-DD
 */
const formatRequestDate = (dateTime) => {
  const date = new Date(dateTime)
  return formatDateToString(date)
}

/**
 * So khớp ID nhân viên (hỗ trợ so sánh string và number)
 * @param {String|Number} requestId - ID cần so sánh
 * @param {String|Number} targetId - ID đích
 * @returns {Boolean} true nếu khớp, false nếu không
 */
const matchEmployeeId = (requestId, targetId) => {
  return requestId === targetId || 
         requestId === String(targetId) || 
         String(requestId) === targetId
}

/**
 * Kiểm tra xem trạng thái có phải là "Đã duyệt" không
 * @param {String|Number} status - Trạng thái cần kiểm tra
 * @returns {Boolean} true nếu đã duyệt, false nếu không
 */
const isApprovedStatus = (status) => {
  return status === 'Đã duyệt' || status === 'Approved'
}

const hasApprovedLeaveForDate = (employeeId, date, workShiftId) => {
  if (!leaveRequests.value?.length) return null

  const dateStr = formatDateToString(date)

  return leaveRequests.value.find(request => {
    const startDate = formatRequestDate(request.startDateTime)
    const endDate = formatRequestDate(request.endDateTime)

    return matchEmployeeId(request.employeeID, employeeId) &&
           isApprovedStatus(request.approveStatus) &&
           dateStr >= startDate && dateStr <= endDate &&
           (!workShiftId || !request.workShiftID || String(request.workShiftID) === String(workShiftId))
  }) || null
}

const checkLeaveRequestForEmployee = (employeeId, date) => {
  if (!leaveRequests.value?.length) return null

  const dateStr = formatDateToString(date)

  return leaveRequests.value.find(request => {
    const startDate = formatRequestDate(request.startDateTime)
    const endDate = formatRequestDate(request.endDateTime)

    return matchEmployeeId(request.employeeID, employeeId) &&
           isApprovedStatus(request.approveStatus) &&
           dateStr >= startDate && dateStr <= endDate
  }) || null
}

/**
 * Tính giờ công cho một ngày cụ thể trong khoảng nghỉ phép
 * @param {Object} leaveRequest - Đơn nghỉ phép
 * @param {Date} targetDate - Ngày cần tính
 * @returns {Number|null} Số giờ công hoặc null nếu không nằm trong khoảng nghỉ phép
 */
function calculateWorkHoursForDate(leaveRequest, targetDate) {
  if (!leaveRequest) return null;

  const leaveStart = new Date(leaveRequest.startDateTime);
  const leaveEnd = new Date(leaveRequest.endDateTime);
  const target = new Date(targetDate);
  
  // Đặt ngày đích về đầu ngày để so sánh
  target.setHours(0, 0, 0, 0);
  
  // Lấy thông tin chi tiết ca làm việc (giả định 8:00-17:00 làm mặc định)
  const workShiftStart = 8; // 8:00 AM
  const workShiftEnd = 17;   // 5:00 PM
  
  // Kiểm tra xem ngày đích có nằm trong khoảng nghỉ phép không
  const leaveStartDate = new Date(leaveStart);
  leaveStartDate.setHours(0, 0, 0, 0);
  const leaveEndDate = new Date(leaveEnd);
  leaveEndDate.setHours(0, 0, 0, 0);
  
  if (target < leaveStartDate || target > leaveEndDate) {
    return null; // Không nằm trong khoảng nghỉ phép
  }
  
  // Tính giờ công cho ngày cụ thể này
  let workStartHour = workShiftStart;
  let workEndHour = workShiftEnd;
  
  // Nếu đây là ngày đầu tiên của nghỉ phép
  if (target.getTime() === leaveStartDate.getTime()) {
    // Ngày đầu: từ giờ nghỉ đến cuối ca (10h-17h)
    workStartHour = leaveStart.getHours() + (leaveStart.getMinutes() / 60);
    workEndHour = workShiftEnd;
  }
  // Nếu đây là ngày cuối cùng của nghỉ phép
  else if (target.getTime() === leaveEndDate.getTime()) {
    // Ngày cuối: từ đầu ca đến giờ nghỉ (8h-16h)
    workStartHour = workShiftStart;
    workEndHour = leaveEnd.getHours() + (leaveEnd.getMinutes() / 60);
  }
  // Nếu đây là ngày giữa (full ngày làm việc)
  else {
    // Các ngày giữa: full ca làm việc (8h-17h)
    workStartHour = workShiftStart;
    workEndHour = workShiftEnd;
  }
  
  const workHours = Math.max(0, workEndHour - workStartHour)
  
  return {
    workHours,
    workStartHour,
    workEndHour,
    isPartialDay: workHours > 0 && workHours < (workShiftEnd - workShiftStart)
  };
}

const matchEmployee = (attendance, employeeId, employeeName) => {
  return matchEmployeeId(attendance.employeeCode, employeeId) ||
         matchEmployeeId(attendance.employeeID, employeeId) ||
         attendance.employeeName === employeeName ||
         attendance.employeeName === employeeId
}

const generateAttendanceForEmployee = (employeeId, employeeName) => {
  if (!attendanceList.value?.length) {
    return dayHeaders.value.map((_, dayIdx) => {
      const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1)
      const leaveRequest = checkLeaveRequestForEmployee(employeeId, currentDate)

      if (leaveRequest) {
        const startTime = new Date(leaveRequest.startDateTime)
        const endTime = new Date(leaveRequest.endDateTime)
        const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
        const isSufficient = isLeaveTimeSufficient(leaveRequest, leaveRequest.workShiftID)

        return {
          status: isSufficient ? 'leave' : 'insufficient',
          time: timeDisplay,
          type: leaveRequest.leaveTypeName
        }
      }

      return { status: '', time: '', type: '' }
    })
  }

  const employeeAttendance = attendanceList.value.filter(attendance => 
    matchEmployee(attendance, employeeId, employeeName)
  )

  return dayHeaders.value.map((dayHeader, dayIdx) => {
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1)
    const dateStr = formatDateToString(currentDate)

    const dayAttendance = employeeAttendance.find(attendance => {
      const attendanceDate = formatDateToString(new Date(attendance.workDate))
      return attendanceDate === dateStr
    })

    let leaveRequest = checkLeaveRequestForEmployee(employeeId, currentDate)
    
    if (!leaveRequest && dayAttendance?.workShiftID) {
      leaveRequest = hasApprovedLeaveForDate(employeeId, currentDate, dayAttendance.workShiftID)
    }

    if (leaveRequest) {
      const workHoursInfo = calculateWorkHoursForDate(leaveRequest, currentDate)
      
      if (workHoursInfo?.workHours > 0) {
        const formatTime = (hour) => {
          const h = Math.floor(hour).toString().padStart(2, '0')
          const m = Math.floor((hour % 1) * 60).toString().padStart(2, '0')
          return `${h}:${m}`
        }
        
        const timeDisplay = `${formatTime(workHoursInfo.workStartHour)} ${formatTime(workHoursInfo.workEndHour)}`
        
        return { 
          status: 'leave', 
          time: timeDisplay, 
          type: leaveRequest.leaveTypeName, 
          leaveRequest,
          workHours: workHoursInfo.workHours
        }
      } else {
        const startTime = new Date(leaveRequest.startDateTime)
        const endTime = new Date(leaveRequest.endDateTime)
        const timeDisplay = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`

        return { 
          status: 'leave', 
          time: timeDisplay, 
          type: leaveRequest.leaveTypeName, 
          leaveRequest,
          workHours: workHoursInfo?.workHours || 0
        }
      }
    }

    if (!leaveRequest && dayAttendance) {
      const getTimeString = (time) => time?.toString().substring(0, 5) || ''
      
      if (dayAttendance.checkInTime && dayAttendance.checkOutTime) {
        const checkIn = getTimeString(dayAttendance.checkInTime)
        const checkOut = getTimeString(dayAttendance.checkOutTime)
        const checkInTime = new Date(`2000-01-01T${dayAttendance.checkInTime}`)
        const checkOutTime = new Date(`2000-01-01T${dayAttendance.checkOutTime}`)
        
        // Tính workHours dựa trên ca đã chọn (nếu có)
        let workHours = 0
        let standardWorkHours = 8 // Mặc định 8 giờ
        
        if (dayAttendance.workShiftID) {
          // Tìm thông tin ca làm việc
          const workShift = workshifts.value.find(shift => shift.id === dayAttendance.workShiftID)
          
          if (workShift && workShift.shiftDetails) {
            // Lấy thông tin ca cho ngày trong tuần
            const dayOfWeek = currentDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const currentDayName = dayNames[dayOfWeek]
            
            const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
            
            if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
              const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
              const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
              
              // Tính giờ công chuẩn (trừ giờ nghỉ trưa)
              let shiftWorkHours = (shiftEnd - shiftStart) / (1000 * 60 * 60)
              
              if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
                  dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
                const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
                const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
                const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60)
                shiftWorkHours -= breakHours
              }
              
              standardWorkHours = shiftWorkHours
              
              // Tính giờ công thực tế: dùng giờ vào/ra của ca nếu giờ thực tế ngoài khung ca
              // Trường hợp 1: Cả vào và ra đều sau giờ ra ca -> dùng giờ ra ca để tính
              // Trường hợp 2: Cả vào và ra đều trước giờ vào ca -> dùng giờ vào ca để tính
              // Trường hợp 3: Vào trước giờ vào ca -> dùng giờ vào ca
              // Tính effective check-in và check-out theo logic mới
              // Effective check-in: nếu checkInTime < shiftStart thì lấy shiftStart, ngược lại lấy checkInTime
              const effectiveCheckInTime = checkInTime < shiftStart ? shiftStart : checkInTime
              
              // Effective check-out: nếu checkOutTime < shiftEnd thì lấy checkOutTime, ngược lại lấy shiftEnd
              const effectiveCheckOutTime = checkOutTime < shiftEnd ? checkOutTime : shiftEnd
              
              // Tính tổng thời gian
              let totalTimeHours = (effectiveCheckOutTime - effectiveCheckInTime) / (1000 * 60 * 60)
              
              // Nếu kết quả âm thì = 0
              if (totalTimeHours < 0) {
                totalTimeHours = 0
              }
              
              // Trừ giờ nghỉ trưa nếu có
              let actualWorkHours = totalTimeHours
              if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
                  dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
                const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
                const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
                
                // Kiểm tra xem giờ nghỉ trưa có nằm trong khoảng làm việc không
                if (effectiveCheckInTime <= breakEnd && effectiveCheckOutTime >= breakStart) {
                  const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60)
                  // Tính phần giờ nghỉ trưa thực sự nằm trong khoảng làm việc
                  const actualBreakStart = effectiveCheckInTime > breakStart ? effectiveCheckInTime : breakStart
                  const actualBreakEnd = effectiveCheckOutTime < breakEnd ? effectiveCheckOutTime : breakEnd
                  const actualBreakHours = (actualBreakEnd - actualBreakStart) / (1000 * 60 * 60)
                  actualWorkHours = totalTimeHours - Math.max(0, actualBreakHours)
                }
              }
              
              // Đảm bảo actualWorkHours không âm
              if (actualWorkHours < 0) {
                actualWorkHours = 0
              }
              
              workHours = actualWorkHours
            } else {
              // Không có shift details, tính theo giờ thực tế
              workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
            }
          } else {
            // Không tìm thấy ca, tính theo giờ thực tế
            workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
          }
        } else {
          // Không có workShiftID, tính theo giờ thực tế
          workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
        }

        // So sánh với giờ công chuẩn để quyết định status
        // Cho phép sai số nhỏ (0.1 giờ = 6 phút) để tránh lỗi làm tròn
        const isSufficient = workHours >= (standardWorkHours - 0.1)

        // Tính số phút đi trễ và về sớm
        let lateMinutes = 0
        let earlyMinutes = 0
        if (dayAttendance.workShiftID) {
          const workShift = workshifts.value.find(shift => shift.id === dayAttendance.workShiftID)
          if (workShift && workShift.shiftDetails) {
            const dayOfWeek = currentDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const currentDayName = dayNames[dayOfWeek]
            const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
            
            if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
              const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
              const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
              
              // Tính số phút đi trễ (chấm công vào sau giờ bắt đầu ca)
              if (checkInTime > shiftStart) {
                lateMinutes = Math.round((checkInTime - shiftStart) / (1000 * 60))
              }
              
              // Tính số phút về sớm (chấm công ra trước giờ kết thúc ca)
              if (checkOutTime < shiftEnd) {
                earlyMinutes = Math.round((shiftEnd - checkOutTime) / (1000 * 60))
              }
            }
          }
        }

        // Xác định trạng thái: nếu đi trễ hoặc về sớm, hiển thị là 'insufficient' (vàng nhạt), ngược lại kiểm tra xem có đủ không
        let finalStatus = isSufficient ? 'work' : 'insufficient'
        if (lateMinutes > 0 || earlyMinutes > 0) {
          finalStatus = 'insufficient' // Đi trễ hoặc về sớm thì hiển thị vàng nhạt (bất kể đủ giờ công hay không)
        }

        return {
          status: finalStatus,
          time: `${checkIn} ${checkOut}`,
          type: dayAttendance.status,
          attendance: dayAttendance,
          leaveRequest: null,
          workDays: workHours / 8,
          late: lateMinutes,
          early: earlyMinutes
        }
      } else if (dayAttendance.checkInTime) {
        return {
          status: 'incomplete',
          time: `${getTimeString(dayAttendance.checkInTime)} -`,
          type: dayAttendance.status,
          attendance: dayAttendance,
          leaveRequest: null
        }
      } else if (dayAttendance.checkOutTime) {
        return {
          status: 'incomplete',
          time: `- ${getTimeString(dayAttendance.checkOutTime)}`,
          type: dayAttendance.status,
          attendance: dayAttendance,
          leaveRequest: null
        }
      } else {
        return {
          status: 'leave',
          time: '',
          type: dayAttendance.status,
          attendance: dayAttendance,
          leaveRequest: null
        }
      }
    }
    
    // Kiểm tra xem ngày này có phân ca làm việc không
    const hasShiftAssignment = shiftAssignments.value?.some(sa => {
      const saDate = new Date(sa.workDate)
      saDate.setHours(0, 0, 0, 0)
      const targetDate = new Date(currentDate)
      targetDate.setHours(0, 0, 0, 0)
      return sa.employeeID === employeeId && 
             saDate.getTime() === targetDate.getTime()
    })
    
    // Chỉ tính vắng không phép cho các ngày đã qua (từ đầu tháng đến ngày hiện tại)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentDateNormalized = new Date(currentDate)
    currentDateNormalized.setHours(0, 0, 0, 0)
    const isPastOrToday = currentDateNormalized.getTime() <= today.getTime()
    
    // Nếu có phân ca nhưng không có dữ liệu chấm công và không có đơn nghỉ phép và là ngày đã qua -> vắng không phép
    if (hasShiftAssignment && !dayAttendance && !leaveRequest && isPastOrToday) {
      return { status: 'absent-without-leave', time: '', type: 'Vắng không phép', attendance: null, leaveRequest: null }
    }
    
    return { status: 'absent', time: '', type: 'Vắng mặt', attendance: null, leaveRequest: null }
  });
}

const attendanceMatrix = computed(() => {
  if (!allEmployees.value?.length) return []

  return allEmployees.value.map(emp => generateAttendanceForEmployee(emp.id, emp.employeeName))
})

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
    'cell-absent-without-leave': cell.status === 'absent-without-leave',
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
  if (cell.status === 'absent-without-leave') return 'Vắng không phép';
  return '';
};

const statusColor = {
  work: '#28a745',
  leave: '#007bff',
  insufficient: '#ffc107',
  incomplete: '#dc3545', // Màu đỏ cho quên checkin/checkout
  late: '#ffc107',
  'absent-without-leave': '#6c757d', // Màu xám cho vắng không phép
  other: '#adb5bd'
}


// Cấu hình cột cho bảng công tổng ngoài màn hình chính (computed để reactive)
const mainSummaryColumns = computed(() => [
  { key: 'id', label: 'Mã nhân viên', class: 'text-center col-id' },
  { key: 'name', label: 'Tên nhân viên', class: 'text-start col-name' },
  ...dayHeaders.value.map((day, idx) => ({ key: `day_${idx}`, label: day, class: 'text-center col-day' })),
  { key: 'totalStandardDays', label: 'Tổng công chuẩn', class: 'text-center col-summary' },
  { key: 'totalWorkDays', label: 'Tổng ngày công', class: 'text-center col-summary' },
  { key: 'totalPresent', label: 'Tổng đi làm', class: 'text-center col-summary' },
  { key: 'totalPaidLeave', label: 'Nghỉ có lương', class: 'text-center col-summary' },
  { key: 'totalAbsentWithoutLeave', label: 'Vắng không phép', class: 'text-center col-summary' },
  { key: 'totalLateMinutes', label: 'Số phút đi trễ', class: 'text-center col-summary' },
  { key: 'totalEarlyMinutes', label: 'Số phút về sớm', class: 'text-center col-summary' },
  { key: 'totalForgotCheckInOut', label: 'Quên check In/Out', class: 'text-center col-summary' }
]);

const mainSummaryData = computed(() => {
  if (!allEmployees.value?.length || !attendanceMatrix.value) return []

  const employeesWithAttendance = []

  allEmployees.value.forEach((emp, idx) => {
    const dayData = {}
    let hasAnyData = false

    if (attendanceMatrix.value[idx]) {
      attendanceMatrix.value[idx].forEach((d, dIdx) => {
        dayData[`day_${dIdx}`] = d
        if (d.status && d.status !== '' && d.status !== null && d.status !== 'absent') {
          hasAnyData = true
        }
      })
    }

    if (hasAnyData) {
      // Lấy tên nhân viên từ các field có thể có
      const employeeName = emp.employeeName || emp.name || 
                          (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : '') ||
                          emp.id || 'N/A';
      
      // Tính toán summary cho nhân viên này
      const summary = calculateEmployeeSummary(emp.id, employeeName)
      
      // Tính tổng công chuẩn (số ngày trong tháng có phân ca)
      const monthStart = new Date(selectedYear.value, selectedMonth.value - 1, 1)
      const monthEnd = new Date(selectedYear.value, selectedMonth.value, 0)
      let totalStandardDays = 0
      if (shiftAssignments.value) {
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
          const hasShift = shiftAssignments.value.some(sa => {
            const saDate = new Date(sa.workDate)
            saDate.setHours(0, 0, 0, 0)
            const checkDate = new Date(d)
            checkDate.setHours(0, 0, 0, 0)
            return sa.employeeID === emp.id && saDate.getTime() === checkDate.getTime()
          })
          if (hasShift) totalStandardDays++
        }
      }
      
      employeesWithAttendance.push({
        id: emp.id,
        name: employeeName,
        detail: '',
        _idx: idx,
        ...dayData,
        ...emp,
        totalStandardDays: totalStandardDays,
        totalWorkDays: summary.totalWorkDays,
        totalPresent: summary.totalPresent,
        totalPaidLeave: summary.totalPaidLeave,
        totalAbsentWithoutLeave: summary.totalAbsentWithoutLeave,
        totalLateMinutes: summary.totalLateMinutes,
        totalEarlyMinutes: summary.totalEarlyMinutes,
        totalForgotCheckInOut: summary.totalForgotCheckIn + summary.totalForgotCheckOut
      });
    }
  });

  return employeesWithAttendance
});

/**
 * Dữ liệu đã phân trang cho bảng tổng hợp chính
 * @returns {Array} Mảng dữ liệu đã được phân trang
 */
const paginatedMainSummaryData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return mainSummaryData.value.slice(startIndex, endIndex);
});

/**
 * Tổng số trang cho phân trang
 * @returns {Number} Tổng số trang
 */
const totalPages = computed(() => {
  return Math.ceil(mainSummaryData.value.length / pageSize.value);
});

/**
 * Dữ liệu đã phân trang cho bảng tăng ca
 * @returns {Array} Mảng dữ liệu đã được phân trang
 */
const paginatedOvertimeData = computed(() => {
  const startIndex = (overtimeCurrentPage.value - 1) * overtimePageSize.value;
  const endIndex = startIndex + overtimePageSize.value;
  return overtimeData.value.slice(startIndex, endIndex);
});

/**
 * Tổng số trang cho phân trang tăng ca
 * @returns {Number} Tổng số trang
 */
const overtimeTotalPages = computed(() => {
  return Math.ceil(overtimeData.value.length / overtimePageSize.value);
});

/**
 * Lấy danh sách số trang hiển thị cho phân trang
 * @returns {Array} Mảng các số trang và dấu '...' để hiển thị
 */
const getVisiblePages = () => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2; // Số trang hiển thị ở mỗi bên của trang hiện tại

  if (total <= 7) {
    // Hiển thị tất cả các trang nếu tổng số trang nhỏ
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

/**
 * Lấy danh sách số trang hiển thị cho phân trang tăng ca
 * @returns {Array} Mảng các số trang và dấu '...' để hiển thị
 */
const getOvertimeVisiblePages = () => {
  const total = overtimeTotalPages.value;
  const current = overtimeCurrentPage.value;
  const delta = 2; // Số trang hiển thị ở mỗi bên của trang hiện tại

  if (total <= 7) {
    // Hiển thị tất cả các trang nếu tổng số trang nhỏ
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

// Dữ liệu mẫu cho bảng tăng ca
const overtimeHeaders = computed(() => dayHeaders.value);
const overtimeColumns = computed(() => [
  { key: 'stt', label: 'STT', class: 'text-center col-stt' },
  { key: 'id', label: 'Mã NV', class: 'text-center col-id' },
  { key: 'name', label: 'Nhân viên', class: 'text-start col-name' },
  ...overtimeHeaders.value.map((day, idx) => ({ key: `day_${idx}`, label: day, class: 'text-center col-day' }))
]);

const formatDateForComparison = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const isOvertimeApproved = (status) => {
  return status === 'Đã duyệt' || 
         status === 'Approved' || 
         status === 2 ||
         status === '2'
}

const getOvertimeType = (request) => {
  if (request.overtimeFormName?.toLowerCase().includes('tính lương') || request.overtimeFormID === 1) {
    return 'paid'
  }
  if (request.overtimeFormName?.toLowerCase().includes('nghỉ bù') || request.overtimeFormID === 2) {
    return 'compensatory'
  }
  return ''
}

const generateOvertimeForEmployee = (employeeId) => {
  if (!overtimeRequests.value?.length) {
    return overtimeHeaders.value.map(() => ({ type: '', hours: 0 }))
  }

  const employeeOvertimeRequests = overtimeRequests.value.filter(request => {
    const requestEmployeeId = String(request.employeeID).trim()
    const targetEmployeeId = String(employeeId).trim()
    
    return (requestEmployeeId === targetEmployeeId ||
            requestEmployeeId === String(targetEmployeeId) ||
            String(requestEmployeeId) === targetEmployeeId) &&
           isOvertimeApproved(request.approveStatus)
  })

  return overtimeHeaders.value.map((day, dayIdx) => {
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, dayIdx + 1)
    const dateStr = formatDateForComparison(currentDate)

    const dayOvertimeRequest = employeeOvertimeRequests.find(request => {
      const requestDateStr = formatDateForComparison(request.startDateTime)
      return requestDateStr === dateStr
    })

    if (dayOvertimeRequest) {
      const startTime = new Date(dayOvertimeRequest.startDateTime)
      const endTime = new Date(dayOvertimeRequest.endDateTime)
      const hours = Math.max(0, (endTime - startTime) / (1000 * 60 * 60))
      const type = getOvertimeType(dayOvertimeRequest)

      return { type, hours, request: dayOvertimeRequest }
    }

    return { type: '', hours: 0 }
  })
}

const overtimeMatrix = computed(() => {
  if (!allEmployees.value?.length) return []
  return allEmployees.value.map(emp => generateOvertimeForEmployee(emp.id))
})

const overtimeData = computed(() => {
  if (!allEmployees.value?.length || !overtimeMatrix.value) return []

  const employeesWithOvertime = []

  allEmployees.value.forEach((emp, idx) => {
    const dayData = {}
    let hasOvertime = false

    if (overtimeMatrix.value[idx]) {
      overtimeMatrix.value[idx].forEach((d, dIdx) => {
        dayData[`day_${dIdx}`] = d
        if (d.hours > 0) {
          hasOvertime = true
        }
      })
    }

    // Chỉ thêm vào danh sách nếu có tăng ca
    if (hasOvertime) {
      // Lấy tên nhân viên từ các field có thể có (giống như mainSummaryData)
      const employeeName = emp.employeeName || emp.name || 
                           (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : null) ||
                           emp.id || 'N/A'
      
      const employee = {
        stt: employeesWithOvertime.length + 1,
        id: emp.id,
        name: employeeName,
        avatar: emp.avatar,
        _idx: idx,
        ...dayData,
        ...emp
      };

      // Tính tổng cho nhân viên
      employee.totalOvertimeHours = getTotalOvertimeHours(employee);
      employee.totalOvertimeDays = getTotalOvertimeDays(employee);
      employee.totalOvertimeHoursWithCoeff = getTotalOvertimeHoursWithCoefficient(employee);
      employee.totalOvertimeDaysWithCoeff = getTotalOvertimeDaysWithCoefficient(employee);

      employeesWithOvertime.push(employee);
    }
  });

  return employeesWithOvertime
});

function getOvertimeCellClass(type) {
  if (type === 'compensatory') return 'cell-overtime-compensatory';
  if (type === 'paid') return 'cell-overtime-paid';
  return '';
}

/**
 * Các hàm tiện ích để tính toán tăng ca
 */
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
      totalDays += dayData.hours / 8; // Chuyển đổi giờ sang ngày (8 giờ = 1 ngày)
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
      const coefficient = dayData.request?.coefficient || 1; // Mặc định là 1 nếu không có hệ số
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
      const coefficient = dayData.request?.coefficient || 1; // Mặc định là 1 nếu không có hệ số
      totalDays += (dayData.hours / 8) * coefficient;
    }
  });

  return Math.round(totalDays * 100) / 100;
}

/**
 * Các hàm tiện ích để tính toán tăng ca cho ngày cụ thể
 */
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
      const coefficient = dayData.request?.coefficient || 1; // Mặc định là 1 nếu không có hệ số
    return Math.round((dayData.hours * coefficient) * 100) / 100;
  }
  return 0;
}

function getDayOvertimeDaysWithCoefficient(employee, dayIdx) {
  if (!employee || dayIdx === null) return 0;
  const dayData = employee[`day_${dayIdx}`];
  if (dayData && dayData.hours > 0) {
      const coefficient = dayData.request?.coefficient || 1; // Mặc định là 1 nếu không có hệ số
    return Math.round(((dayData.hours / 8) * coefficient) * 100) / 100;
  }
  return 0;
}

/**
 * Kiểm tra xem có đơn tăng ca nào trong tháng hiện tại không
 */

// Modal chi tiết tăng ca
const showOvertimeModal = ref(false);
const selectedOvertimeEmployee = ref(null);
const selectedOvertimeDayIdx = ref(null);

function openOvertimeModal(emp, dayIdx = null) {
  // Tìm employee đầy đủ từ allEmployees để có thông tin name và position
  const fullEmployee = allEmployees.value.find(e => e.id === emp.id) || emp
  selectedOvertimeEmployee.value = {
    ...fullEmployee,
    ...emp, // Giữ lại các thông tin từ emp (như day_${idx}, totals, etc.)
    name: fullEmployee.employeeName || fullEmployee.name || `${fullEmployee.firstName || ''} ${fullEmployee.lastName || ''}`.trim() || emp.name || 'N/A',
    position: fullEmployee.roleName || fullEmployee.position || fullEmployee.title || 'Chưa có'
  }
  selectedOvertimeDayIdx.value = dayIdx;
  showOvertimeModal.value = true;
}

/**
 * Mở modal tăng ca từ tab tăng ca cá nhân
 * @param {Object} day - Đối tượng ngày từ calendar
 */
function openPersonalOvertimeModal(day) {
  if (!day || !day.isCurrentMonth || !day.day) return
  
  if (!currentUser.value) {
    console.error('Current user not found')
    return
  }
  
  // Tính chỉ số ngày (day.day là 1-based, dayIdx là 0-based)
  const dayIdx = day.day - 1
  
  // Convert personal overtime data to format expected by modal
  // The modal expects an employee object with day_${idx} structure
  // Find full employee info from allEmployees to get complete name and position
  const fullEmployee = allEmployees.value.find(e => e.id === currentUser.value.id) || currentUser.value
  const employeeData = {
    id: currentUser.value.id,
    name: fullEmployee.employeeName || fullEmployee.name || `${fullEmployee.firstName || ''} ${fullEmployee.lastName || ''}`.trim() || currentUser.value.firstName + ' ' + currentUser.value.lastName,
    position: fullEmployee.roleName || fullEmployee.position || fullEmployee.title || currentUser.value.roleName || currentUser.value.position || currentUser.value.title || 'Chưa có',
    avatar: fullEmployee.avatar || currentUser.value.avatar || null,
    totalOvertimeHours: 0,
    totalOvertimeDays: 0,
    totalOvertimeHoursWithCoeff: 0,
    totalOvertimeDaysWithCoeff: 0
  }
  
  // Lấy dữ liệu tăng ca cho ngày đã chọn
  if (day.overtime && day.overtime.requests && day.overtime.requests.length > 0) {
    const overtimeRequests = day.overtime.requests
    let totalHours = 0
    
    overtimeRequests.forEach(ot => {
      const startTime = new Date(ot.startDateTime)
      const endTime = new Date(ot.endDateTime)
      const hours = (endTime - startTime) / (1000 * 60 * 60)
      totalHours += hours
    })
    
    // Get the first request for coefficient and other details
    const firstRequest = overtimeRequests[0]
    
    employeeData[`day_${dayIdx}`] = {
      hours: totalHours,
      request: {
        coefficient: firstRequest.coefficient || 1,
        overtimeTypeName: firstRequest.overtimeTypeName || '',
        approveStatus: firstRequest.approveStatus || ''
      },
      type: day.overtime.class || 'overtime'
    }
  } else {
    // No overtime for this day
    employeeData[`day_${dayIdx}`] = {
      hours: 0
    }
  }
  
  // Tính tổng hàng tháng từ dữ liệu tăng ca cá nhân
  const allDays = personalOvertimeData.value.flat().filter(d => d.isCurrentMonth && d.overtime && d.overtime.requests)
  allDays.forEach(dayData => {
    if (dayData.overtime && dayData.overtime.requests) {
      dayData.overtime.requests.forEach(ot => {
        const startTime = new Date(ot.startDateTime)
        const endTime = new Date(ot.endDateTime)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        const coefficient = ot.coefficient || 1
        
        employeeData.totalOvertimeHours += hours
        employeeData.totalOvertimeHoursWithCoeff += hours * coefficient
      })
    }
  })
  
  employeeData.totalOvertimeDays = Math.round((employeeData.totalOvertimeHours / 8) * 100) / 100
  employeeData.totalOvertimeDaysWithCoeff = Math.round((employeeData.totalOvertimeHoursWithCoeff / 8) * 100) / 100
  
  // Open modal with converted data
  openOvertimeModal(employeeData, dayIdx)
}

function closeOvertimeModal() {
  showOvertimeModal.value = false;
}

/**
 * Các hàm tiện ích để lấy tên hiển thị và chức vụ của người dùng hiện tại
 */
function getCurrentUserDisplayName() {
  if (!currentUser.value) return 'N/A'
  const fullEmployee = allEmployees.value.find(e => e.id === currentUser.value.id) || currentUser.value
  return fullEmployee.employeeName || fullEmployee.name || `${fullEmployee.firstName || ''} ${fullEmployee.lastName || ''}`.trim() || currentUser.value.firstName + ' ' + currentUser.value.lastName || 'N/A'
}

function getCurrentUserPosition() {
  if (!currentUser.value) return 'Chưa có'
  const fullEmployee = allEmployees.value.find(e => e.id === currentUser.value.id) || currentUser.value
  return fullEmployee.roleName || fullEmployee.position || fullEmployee.title || currentUser.value.roleName || currentUser.value.position || currentUser.value.title || 'Chưa có'
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

/**
 * Tính toán giờ công, ngày công, số phút đi trễ và về sớm
 */
// Sử dụng hàm chung calculateWorkDaysFromAttendanceData
const calculateWorkDetails = (item) => {
  const checkInTimeStr = item.checkInTime
  const checkOutTimeStr = item.checkOutTime
  
  if (!checkInTimeStr || !checkOutTimeStr) {
    return { hours: 0, days: 0, late: 0, early: 0 }
  }

  const checkInTime = new Date(`2000-01-01T${checkInTimeStr}:00`)
  const checkOutTime = new Date(`2000-01-01T${checkOutTimeStr}:00`)
  
  // Tính workDays sử dụng hàm chung
  const result = calculateWorkDaysFromAttendanceData({
    checkInTime: checkInTimeStr,
    checkOutTime: checkOutTimeStr,
    workDate: item.workDate,
    workShiftID: item.workShiftID
  })
  const workDays = typeof result === 'object' ? result.workDays : result
  
  // Tính lại actualWorkHours để hiển thị chính xác
  let workHours = 0
  if (item.workShiftID) {
    const workShift = workshifts.value.find(shift => shift.id === item.workShiftID)
    
    if (workShift && workShift.shiftDetails) {
      const workDate = new Date(item.workDate)
      const dayOfWeek = workDate.getDay()
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      const currentDayName = dayNames[dayOfWeek]
      
      const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
      
      if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
        const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
        const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
        
        // Calculate standard work hours
        let standardWorkHours = (shiftEnd - shiftStart) / (1000 * 60 * 60)
        if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
            dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
          const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
          const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
          const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60)
          standardWorkHours -= breakHours
        }
        
        // Tính thời gian chấm công vào/ra hiệu quả (cùng logic với calculateWorkDaysFromAttendanceData)
        const effectiveCheckInTime = checkInTime < shiftStart ? shiftStart : checkInTime
        const effectiveCheckOutTime = checkOutTime < shiftEnd ? checkOutTime : shiftEnd
        
        let totalTimeHours = (effectiveCheckOutTime - effectiveCheckInTime) / (1000 * 60 * 60)
        if (totalTimeHours < 0) {
          totalTimeHours = 0
        }
        
        // Subtract lunch break if applicable
        let actualWorkHours = totalTimeHours
        if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
            dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
          const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
          const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
          if (effectiveCheckInTime <= breakEnd && effectiveCheckOutTime >= breakStart) {
            const actualBreakStart = effectiveCheckInTime > breakStart ? effectiveCheckInTime : breakStart
            const actualBreakEnd = effectiveCheckOutTime < breakEnd ? effectiveCheckOutTime : breakEnd
            const actualBreakHours = (actualBreakEnd - actualBreakStart) / (1000 * 60 * 60)
            actualWorkHours = totalTimeHours - Math.max(0, actualBreakHours)
          }
        }
        
        if (actualWorkHours < 0) {
          actualWorkHours = 0
        }
        
        workHours = actualWorkHours
      } else {
        // Dự phòng: tính từ thời gian thực tế
        workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
        if (workHours < 0) workHours = 0
      }
    } else {
      // Fallback: calculate from actual time
      workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
      if (workHours < 0) workHours = 0
    }
  } else {
    // Fallback: calculate from actual time
    workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
    if (workHours < 0) workHours = 0
  }
  
  // Tính late và early minutes
  let lateMinutes = 0
  let earlyMinutes = 0
  
  if (item.workShiftID) {
    const workShift = workshifts.value.find(shift => shift.id === item.workShiftID)
    
    if (workShift && workShift.shiftDetails) {
      const workDate = new Date(item.workDate)
      const dayOfWeek = workDate.getDay()
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      const currentDayName = dayNames[dayOfWeek]
      
      const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
      
      if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
        const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
        const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
        
        // Tính số phút đi trễ (chấm công vào sau giờ bắt đầu ca)
        if (checkInTime > shiftStart) {
          lateMinutes = Math.round((checkInTime - shiftStart) / (1000 * 60))
        }
        
        // Tính số phút về sớm (chấm công ra trước giờ kết thúc ca)
        if (checkOutTime < shiftEnd) {
          earlyMinutes = Math.round((shiftEnd - checkOutTime) / (1000 * 60))
        }
      }
    }
  }

  return {
    hours: Math.round(workHours * 100) / 100,
    days: workDays,
    late: lateMinutes,
    early: earlyMinutes
  }
}

// Process detail data to include calculated values
const processedDetailData = computed(() => {
  return detailData.value.map(item => {
    const calculated = calculateWorkDetails(item)
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
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'name', label: 'Tên nhân viên' },
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'date', label: 'Ngày làm' },
  { key: 'scanTime', label: 'Giờ quét' },
  { key: 'location', label: 'Máy chấm công' },
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

    // Kiểm tra xem có chọn bộ lọc tuần không
    if (selectedWeek.value) {
      data = await attendanceDataService.getAttendanceDataByWeek(selectedWeek.value)
    }
    // Kiểm tra xem có chọn khoảng ngày không
    else if (selectedStartDate.value && selectedEndDate.value) {
      data = await attendanceDataService.getAttendanceDataByDateRange(selectedStartDate.value, selectedEndDate.value)
    } else {
      // Mặc định là tháng hiện tại
      data = await attendanceDataService.getAttendanceDataByMonth(selectedYear.value, selectedMonth.value)
    }

    const hasHRPermission = isDirector.value || isHRManager.value || isHREmployee.value
    
    if (!hasHRPermission && currentUser.value) {
      data = data.filter(item => {
        const itemEmployeeId = item.employeeCode || item.employeeID || item.employeeId || item.id
        return itemEmployeeId === currentUser.value.id
      })
    }

    // Chuyển đổi dữ liệu để khớp với định dạng mong đợi
    const transformedData = []
    let sttCounter = 1 // Đếm STT từ 1 cho mỗi dòng trong transformedData

    data.forEach(item => {
      // Parse location để lấy latitude/longitude nếu có
      const parseLocation = (locationStr) => {
        if (!locationStr) return { lat: null, lng: null, name: null };
        
        // Kiểm tra xem có phải là coordinates không (format: "lat,lng" hoặc "lat, lng")
        const coordMatch = locationStr.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
          return {
            lat: parseFloat(coordMatch[1]),
            lng: parseFloat(coordMatch[2]),
            name: locationStr
          };
        }
        
        // Nếu không phải coordinates, trả về như tên địa điểm
        return { lat: null, lng: null, name: locationStr };
      };

      // Tạo dòng cho giờ vào nếu có
      if (item.checkInTime) {
        const locationInfo = parseLocation(item.location || item.checkInLocation);
        transformedData.push({
          stt: sttCounter++,
          id: item.employeeCode,
          name: item.employeeName,
          shift: item.shiftName,
          date: new Date(item.workDate).toLocaleDateString('vi-VN'),
          scanTime: item.checkInTime.toString().substring(0, 5),
          machine: item.machineName || '-',
          location: item.location || item.checkInLocation || '-',
          locationLat: locationInfo.lat,
          locationLng: locationInfo.lng,
          type: 'Vào'
        })
      }

      // Tạo dòng cho giờ ra nếu có
      if (item.checkOutTime) {
        const locationInfo = parseLocation(item.location || item.checkOutLocation);
        transformedData.push({
          stt: sttCounter++,
          id: item.employeeCode,
          name: item.employeeName,
          shift: item.shiftName,
          date: new Date(item.workDate).toLocaleDateString('vi-VN'),
          scanTime: item.checkOutTime.toString().substring(0, 5),
          machine: item.machineName || '-',
          location: item.location || item.checkOutLocation || '-',
          locationLat: locationInfo.lat,
          locationLng: locationInfo.lng,
          type: 'Ra'
        })
      }
    })

    attendanceData.value = transformedData
    
    attendanceList.value = data
  } catch (error) {
    attendanceError.value = error.message || 'Lỗi khi tải dữ liệu chấm công'
  } finally {
    attendanceLoading.value = false
  }
}

/**
 * Hàm tiện ích để lấy loại chấm công dựa trên trạng thái
 * @param {String} status - Trạng thái chấm công
 * @returns {String} Loại chấm công (tiếng Việt)
 */
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

// Phân trang cho các tab chi tiết
const detailCurrentPage = ref(1)
const detailItemsPerPage = ref(10)
const paginatedDetailData = computed(() => {
  const start = (detailCurrentPage.value - 1) * detailItemsPerPage.value
  return processedDetailData.value.slice(start, start + detailItemsPerPage.value)
})

const attendanceCurrentPage = ref(1)
const attendanceItemsPerPage = ref(6)
const paginatedAttendanceData = computed(() => {
  const start = (attendanceCurrentPage.value - 1) * attendanceItemsPerPage.value
  return attendanceData.value.slice(start, start + attendanceItemsPerPage.value)
})

/**
 * Các hàm xử lý bộ lọc thời gian
 */
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

/**
 * Các phương thức điều hướng tháng
 */
const goToPreviousMonth = () => {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

const goToNextMonth = () => {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

const goToCurrentMonth = () => {
  const now = new Date()
  selectedMonth.value = now.getMonth() + 1
  selectedYear.value = now.getFullYear()
}

const exportDetailToExcel = async () => {
  if (!processedDetailData.value || processedDetailData.value.length === 0) {
    showMessage('Không có dữ liệu để xuất Excel!', 'warning')
    return
  }
  
  try {
    showMessage('Đang xuất Excel...', 'info')
    
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Bảng công chi tiết')
    
    const title = `BẢNG CÔNG CHI TIẾT THÁNG ${selectedMonth.value}/${selectedYear.value}`
    const headers = detailColumns.map(col => col.label)
    
    // Add title
    const titleRow = worksheet.addRow([title])
    worksheet.mergeCells(1, 1, 1, headers.length)
    const titleCell = worksheet.getCell(1, 1)
    
    // Style title cell
    titleCell.font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FF212529' },
      name: 'Arial'
    }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    }
    titleCell.border = {
      top: { style: 'thin', color: { argb: 'FFADB5BD' } },
      left: { style: 'thin', color: { argb: 'FFADB5BD' } },
      bottom: { style: 'thin', color: { argb: 'FFADB5BD' } },
      right: { style: 'thin', color: { argb: 'FFADB5BD' } }
    }
    titleRow.height = 30
    
    // Add empty row for spacing
    worksheet.addRow([])
    
    // Add headers
    const headerRow = worksheet.addRow(headers)
    headerRow.height = 25
    
    // Style header cells
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFADB5BD' } },
        left: { style: 'thin', color: { argb: 'FFADB5BD' } },
        bottom: { style: 'thin', color: { argb: 'FFADB5BD' } },
        right: { style: 'thin', color: { argb: 'FFADB5BD' } }
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F3F5' }
      }
      cell.font = { 
        bold: true, 
        size: 10,
        color: { argb: 'FF212529' },
        name: 'Arial'
      }
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle', 
        wrapText: true 
      }
    })
    
    // Add data rows
    processedDetailData.value.forEach((item) => {
      const row = detailColumns.map(col => {
        const value = item[col.key]
        // Format values for display
        if (col.key === 'late' || col.key === 'early') {
          return value > 0 ? value : 'Đúng giờ'
        }
        if (col.key === 'hours') {
          return typeof value === 'number' ? value : (value || 0)
        }
        if (col.key === 'days') {
          return typeof value === 'number' ? value : (value || 0)
        }
        if (col.key === 'checkInTime' || col.key === 'checkOutTime') {
          return value ? (typeof value === 'string' ? value.substring(0, 5) : value) : '-'
        }
        return value ?? ''
      })
      
      const dataRow = worksheet.addRow(row)
      dataRow.height = 18
      
      // Style cells
      dataRow.eachCell((cell, colNumber) => {
        const col = detailColumns[colNumber - 1]
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' }
        }
        cell.font = {
          size: 9,
          name: 'Arial',
          color: { argb: 'FF212529' },
          bold: false
        }
        
        // Alignment and number format
        if (colNumber === 1) { // STT column
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else if (col && (col.key === 'hours' || col.key === 'days' || col.key === 'late' || col.key === 'early')) {
          // Number columns
          if (typeof cell.value === 'number') {
            cell.numFmt = col.key === 'hours' || col.key === 'days' ? '0.00' : '0'
          }
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
        }
      })
    })
    
    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      const col = detailColumns[index]
      if (col) {
        let maxWidth = col.label.length + 2
        processedDetailData.value.forEach(item => {
          const value = item[col.key]
          if (value !== null && value !== undefined) {
            let valueLength
            if (col.key === 'late' || col.key === 'early') {
              valueLength = value > 0 ? String(value).length + 6 : 9 // "Đúng giờ" length
            } else {
              valueLength = String(value).length
            }
            if (valueLength > maxWidth) {
              maxWidth = valueLength
            }
          }
        })
        column.width = Math.min(Math.max(maxWidth, 12), 30)
      } else {
        column.width = 12
      }
    })
    
    // Freeze header row
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 2,
        activeCell: 'A3',
        showGridLines: true
      }
    ]
    
    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fileName = `BangCongChiTiet_${selectedYear.value}_${selectedMonth.value}.xlsx`
    
    saveAs(blob, fileName)
    showMessage('Xuất Excel thành công!', 'success')
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    showMessage(`Lỗi khi xuất Excel: ${error.message || 'Vui lòng thử lại sau'}`, 'error')
  }
}

const printDetailReport = () => {
  if (!processedDetailData.value || processedDetailData.value.length === 0) {
    showMessage('Không có dữ liệu để in!', 'warning')
    return
  }
  
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showMessage('Không thể mở cửa sổ in. Vui lòng cho phép popup!', 'error')
      return
    }
    
    const currentDate = new Date().toLocaleDateString('vi-VN')
    const headers = detailColumns.map(col => col.label).join('</th><th>')
    
    const formatValue = (item, col) => {
      const value = item[col.key]
      if (value === null || value === undefined) return ''
      
      if (col.key === 'late' || col.key === 'early') {
        return value > 0 ? `${value} phút` : 'Đúng giờ'
      }
      if (col.key === 'hours') {
        return typeof value === 'number' ? `${value}h` : (value || '0h')
      }
      if (col.key === 'days') {
        return typeof value === 'number' ? value : (value || 0)
      }
      if (col.key === 'checkInTime' || col.key === 'checkOutTime') {
        return value ? (typeof value === 'string' ? value.substring(0, 5) : value) : '-'
      }
      return value
    }
    
    const rows = processedDetailData.value.map(item => {
      const cells = detailColumns.map(col => {
        const value = formatValue(item, col)
        return `<td>${value}</td>`
      }).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo bảng công chi tiết tháng ${selectedMonth.value}/${selectedYear.value}</title>
        <style>
          @page { size: A4 landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #666; }
          .table-container { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
          th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; }
          th { background-color: #f1f3f5; font-weight: bold; position: sticky; top: 0; }
          td { white-space: nowrap; }
          .number { text-align: right; }
          .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #666; }
          @media print { 
            body { margin: 0; }
            .table-container { overflow: visible; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BẢNG CÔNG CHI TIẾT THÁNG ${selectedMonth.value}/${selectedYear.value}</div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>${headers}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div>Ngày in: ${currentDate}</div>
          <div>Tổng số bản ghi: ${processedDetailData.value.length}</div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  } catch (error) {
    console.error('Error printing report:', error)
    showMessage(`Lỗi khi in báo cáo: ${error.message || 'Vui lòng thử lại sau'}`, 'error')
  }
}

const exportAttendanceToExcel = async () => {
  if (!attendanceData.value || attendanceData.value.length === 0) {
    showMessage('Không có dữ liệu để xuất Excel!', 'warning')
    return
  }
  
  try {
    showMessage('Đang xuất Excel...', 'info')
    
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Dữ liệu chấm công')
    
    const title = `DỮ LIỆU CHẤM CÔNG THÁNG ${selectedMonth.value}/${selectedYear.value}`
    const headers = attendanceDataColumns.map(col => col.label)
    
    // Add title
    const titleRow = worksheet.addRow([title])
    worksheet.mergeCells(1, 1, 1, headers.length)
    const titleCell = worksheet.getCell(1, 1)
    
    // Style title cell
    titleCell.font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FF212529' },
      name: 'Arial'
    }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    }
    titleCell.border = {
      top: { style: 'thin', color: { argb: 'FFADB5BD' } },
      left: { style: 'thin', color: { argb: 'FFADB5BD' } },
      bottom: { style: 'thin', color: { argb: 'FFADB5BD' } },
      right: { style: 'thin', color: { argb: 'FFADB5BD' } }
    }
    titleRow.height = 30
    
    // Add empty row for spacing
    worksheet.addRow([])
    
    // Add headers
    const headerRow = worksheet.addRow(headers)
    headerRow.height = 25
    
    // Style header cells
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFADB5BD' } },
        left: { style: 'thin', color: { argb: 'FFADB5BD' } },
        bottom: { style: 'thin', color: { argb: 'FFADB5BD' } },
        right: { style: 'thin', color: { argb: 'FFADB5BD' } }
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F3F5' }
      }
      cell.font = { 
        bold: true, 
        size: 10,
        color: { argb: 'FF212529' },
        name: 'Arial'
      }
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle', 
        wrapText: true 
      }
    })
    
    // Add data rows
    attendanceData.value.forEach((item) => {
      const row = attendanceDataColumns.map(col => {
        const value = item[col.key]
        return value ?? ''
      })
      
      const dataRow = worksheet.addRow(row)
      dataRow.height = 18
      
      // Style cells
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' }
        }
        cell.font = {
          size: 9,
          name: 'Arial',
          color: { argb: 'FF212529' },
          bold: false
        }
        
        // Alignment
        if (colNumber === 1) { // STT column
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
        }
      })
    })
    
    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      const col = attendanceDataColumns[index]
      if (col) {
        let maxWidth = col.label.length + 2
        attendanceData.value.forEach(item => {
          const value = item[col.key]
          if (value !== null && value !== undefined) {
            const valueLength = String(value).length
            if (valueLength > maxWidth) {
              maxWidth = valueLength
            }
          }
        })
        column.width = Math.min(Math.max(maxWidth, 12), 30)
      } else {
        column.width = 12
      }
    })
    
    // Freeze header row
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 2,
        activeCell: 'A3',
        showGridLines: true
      }
    ]
    
    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fileName = `DuLieuChamCong_${selectedYear.value}_${selectedMonth.value}.xlsx`
    
    saveAs(blob, fileName)
    showMessage('Xuất Excel thành công!', 'success')
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    showMessage(`Lỗi khi xuất Excel: ${error.message || 'Vui lòng thử lại sau'}`, 'error')
  }
}

const printAttendanceReport = () => {
  if (!attendanceData.value || attendanceData.value.length === 0) {
    showMessage('Không có dữ liệu để in!', 'warning')
    return
  }
  
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showMessage('Không thể mở cửa sổ in. Vui lòng cho phép popup!', 'error')
      return
    }
    
    const currentDate = new Date().toLocaleDateString('vi-VN')
    const headers = attendanceDataColumns.map(col => col.label).join('</th><th>')
    
    const rows = attendanceData.value.map(item => {
      const cells = attendanceDataColumns.map(col => {
        const value = item[col.key] ?? ''
        return `<td>${value}</td>`
      }).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo dữ liệu chấm công tháng ${selectedMonth.value}/${selectedYear.value}</title>
        <style>
          @page { size: A4 landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #666; }
          .table-container { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
          th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; }
          th { background-color: #f1f3f5; font-weight: bold; position: sticky; top: 0; }
          td { white-space: nowrap; }
          .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #666; }
          @media print { 
            body { margin: 0; }
            .table-container { overflow: visible; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">DỮ LIỆU CHẤM CÔNG THÁNG ${selectedMonth.value}/${selectedYear.value}</div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>${headers}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div>Ngày in: ${currentDate}</div>
          <div>Tổng số bản ghi: ${attendanceData.value.length}</div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  } catch (error) {
    console.error('Error printing report:', error)
    showMessage(`Lỗi khi in báo cáo: ${error.message || 'Vui lòng thử lại sau'}`, 'error')
  }
}

/**
 * Theo dõi thay đổi trong bộ lọc năm/tháng
 */
watch([selectedYear, selectedMonth], async () => {
  currentPage.value = 1 // Reset to first page when changing month/year
  overtimeCurrentPage.value = 1 // Reset overtime pagination when changing month/year
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

    // Kiểm tra xem có chọn bộ lọc tuần không
    if (selectedWeek.value) {
      data = await attendanceDataService.getAttendanceDataByWeek(selectedWeek.value)
    }
    // Kiểm tra xem có chọn khoảng ngày không
    else if (selectedStartDate.value && selectedEndDate.value) {
      data = await attendanceDataService.getAttendanceDataByDateRange(selectedStartDate.value, selectedEndDate.value)
    } else {
      // Mặc định là tháng hiện tại
      data = await attendanceDataService.getAttendanceDataByMonth(selectedYear.value, selectedMonth.value)
    }

    // Filter data based on user role
    const hasHRPermission = isDirector.value || isHRManager.value || isHREmployee.value
    
    if (!hasHRPermission && currentUser.value) {
      data = data.filter(item => {
        const itemEmployeeId = item.employeeCode || item.employeeID || item.employeeId || item.id
        return itemEmployeeId === currentUser.value.id
      })
    }

    // Chuyển đổi dữ liệu để khớp với định dạng mong đợi for detail view
    const transformedData = []
    let sttCounter = 1

    data.forEach((item) => {
      // Only include records that have both check-in and check-out times
      if (item.checkInTime && item.checkOutTime) {
        transformedData.push({
          stt: sttCounter++,
          id: item.employeeCode,
          name: item.employeeName,
          shift: item.shiftName,
          workShiftID: item.workShiftID, // Lưu workShiftID để tính toán
          date: new Date(item.workDate).toLocaleDateString('vi-VN'),
          workDate: item.workDate, // Lưu workDate để tính toán
          checkInTime: item.checkInTime.toString().substring(0, 5),
          checkOutTime: item.checkOutTime.toString().substring(0, 5)
        })
      }
    })

    detailData.value = transformedData
  } catch (error) {
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
    
    // Lấy ngày thực tế từ dayHeaders
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
    
    // Lấy thông tin ca làm việc cho nhân viên này
    let workShiftInfo = null;
    if (attendanceData && attendanceData.length > 0) {
      // Thử lấy ID ca làm việc từ dữ liệu chấm công
      const workShiftId = attendanceData[0].workShiftID;
      console.log('WorkShift ID from attendance:', workShiftId);
      
      if (workShiftId) {
        // Find work shift details from workshifts data
        workShiftInfo = workshifts.value.find(shift => shift.id === workShiftId);
        console.log('Found work shift info:', workShiftInfo);
      }
    }
    
    // Chuyển đổi dữ liệu chấm công để khớp với định dạng mong đợi - bao gồm cả chấm công và nghỉ phép
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
            workShiftID: item.workShiftID, // Lưu workShiftID để có thể update
            refCode: null, // Không có mã phiếu tham chiếu cho chấm công, chỉ có cho nghỉ phép
            attendanceId: item.id || null, // Sử dụng ID trực tiếp từ backend
            date: new Date(item.workDate).toLocaleDateString('vi-VN'),
            scanTime: item.checkInTime.toString().substring(0, 5),
            type: 'Vào',
            location: item.machineName || '-',
            employeeId: employee.id, // Lưu employeeId để tạo ShiftAssignment mới nếu cần
            workDate: item.workDate // Lưu workDate để tạo ShiftAssignment mới nếu cần
          });
        }
        
        // Create entry for check-out if exists
        if (item.checkOutTime) {
          transformedAttendanceData.push({
            stt: sttCounter++,
            avatar: item.imageCheckOut || 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/up_anh_lay_link_thumb_d0e098dfc5.jpg',
            shiftName: item.shiftName,
            workShiftID: item.workShiftID, // Lưu workShiftID để có thể update
            refCode: null, // Không có mã phiếu tham chiếu cho chấm công, chỉ có cho nghỉ phép
            attendanceId: item.id || null, // Sử dụng ID trực tiếp từ backend
            date: new Date(item.workDate).toLocaleDateString('vi-VN'),
            scanTime: item.checkOutTime.toString().substring(0, 5),
            type: 'Ra',
            location: item.machineName || '-',
            employeeId: employee.id, // Lưu employeeId để tạo ShiftAssignment mới nếu cần
            workDate: item.workDate // Lưu workDate để tạo ShiftAssignment mới nếu cần
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
    
    // Loại bỏ trùng lặp: chỉ giữ đơn có thời gian nghỉ dài hơn trong ngày
    const uniqueDayLeaveRequests = []
    const processedLeaves = new Map() // Map<workShiftID, leave>
    
    dayLeaveRequestsForAttendance.forEach(leave => {
      const leaveWorkShiftId = leave.workShiftID
      const selectedDate = new Date(fullDate)
      const leaveStartDate = new Date(leave.startDateTime)
      const leaveEndDate = new Date(leave.endDateTime)
      
      // Tính thời gian nghỉ trong ngày này
      let dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      let dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const leaveStartInDay = leaveStartDate > dayStart ? leaveStartDate : dayStart
      const leaveEndInDay = leaveEndDate < dayEnd ? leaveEndDate : dayEnd
      const leaveDurationInDay = leaveEndInDay - leaveStartInDay
      
      // Nếu chưa có đơn nào cho ca này, hoặc đơn này có thời gian dài hơn
      if (!processedLeaves.has(leaveWorkShiftId) || 
          processedLeaves.get(leaveWorkShiftId).duration < leaveDurationInDay) {
        processedLeaves.set(leaveWorkShiftId, { leave, duration: leaveDurationInDay })
      }
    })
    
    // Chuyển đổi Map thành array - chỉ lấy đơn có thời gian dài nhất cho mỗi ca
    const finalDayLeaveRequests = Array.from(processedLeaves.values()).map(item => item.leave)
    
    // Debug: log để kiểm tra
    console.log('=== LEAVE REQUESTS DE-DUPLICATION DEBUG ===')
    console.log('Total leave requests for attendance:', dayLeaveRequestsForAttendance.length)
    console.log('After de-duplication:', finalDayLeaveRequests.length)
    console.log('Processed leaves map:', Array.from(processedLeaves.entries()).map(([shiftId, data]) => ({
      workShiftID: shiftId,
      leaveId: data.leave.id,
      duration: data.duration / (1000 * 60 * 60), // Convert to hours
      startDateTime: data.leave.startDateTime,
      endDateTime: data.leave.endDateTime
    })))
    
    finalDayLeaveRequests.forEach(leave => {
      // Lấy thông tin ca làm việc cho đơn nghỉ phép này
      const leaveWorkShiftId = leave.workShiftID;
      const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
      
      // Lấy thứ trong tuần cho ngày đã chọn
      const selectedDate = new Date(fullDate);
      const selectedDayOfWeek = selectedDate.getDay();
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const selectedDayName = dayNames[selectedDayOfWeek];
      
      // Find shift details for the selected day
      let leaveDayShiftDetail = null;
      if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
        leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
      }
      
      // Xác định thời gian chấm công vào và ra
      let checkInTime = new Date(leave.startDateTime);
      let checkOutTime = new Date(leave.endDateTime);
      
      // For multi-day leaves, adjust times based on the selected date
      const leaveStartDate = new Date(leave.startDateTime).toDateString();
      const leaveEndDate = new Date(leave.endDateTime).toDateString();
      const currentLeaveDate = selectedDate.toDateString();
      
      if (leaveStartDate !== leaveEndDate) {
        // Multi-day leave
        if (currentLeaveDate === leaveStartDate) {
          // Start day - use leave start time (giữ nguyên giờ từ leave.startDateTime) and shift end time
          // checkInTime đã được set từ leave.startDateTime ở trên, không cần thay đổi
          if (leaveDayShiftDetail && leaveDayShiftDetail.endTime !== '00:00:00') {
            const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
            checkOutTime = new Date(selectedDate);
            checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
          } else {
            // Fallback: nếu không có shift detail, dùng giờ kết thúc ca mặc định 17:00
            checkOutTime = new Date(selectedDate);
            checkOutTime.setHours(17, 0, 0);
          }
        } else if (currentLeaveDate === leaveEndDate) {
          // End day - use shift start time and leave end time (giữ nguyên giờ từ leave.endDateTime)
          if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00') {
            const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
            checkInTime = new Date(selectedDate);
            checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
          } else {
            // Fallback: nếu không có shift detail, dùng giờ bắt đầu ca mặc định 08:00
            checkInTime = new Date(selectedDate);
            checkInTime.setHours(8, 0, 0);
          }
          // checkOutTime đã được set từ leave.endDateTime ở trên, không cần thay đổi
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
      
      // Kiểm tra xem giờ vào có lớn hơn nửa giờ ca không (xem như checkout)
      // Chỉ áp dụng cho ngày đầu tiên
      let isCheckinAfterHalfShift = false;
      if (currentLeaveDate === leaveStartDate && leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
        const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
        const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
        const shiftDuration = (shiftEndTime - shiftStartTime) / (1000 * 60 * 60); // hours
        const halfShiftTime = new Date(shiftStartTime.getTime() + (shiftDuration * 30 * 60 * 1000)); // half shift in minutes
        
        // Kiểm tra xem thời gian bắt đầu nghỉ phép có sau nửa ca không
        const leaveStartTime = new Date(leave.startDateTime);
        const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
        
        if (leaveStartTimeOnly > halfShiftTime) {
          isCheckinAfterHalfShift = true;
        }
      }
      
      // Đảm bảo mỗi ngày đều có đủ 2 dòng (checkin và checkout)
      // Trừ trường hợp ngày đầu tiên và checkin sau nửa ca (chỉ có checkout)
      if (isCheckinAfterHalfShift && currentLeaveDate === leaveStartDate) {
        // Chỉ ngày đầu tiên và checkin sau nửa ca: chỉ tạo checkout entry
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
        // Tất cả các trường hợp khác: luôn có cả checkin và checkout
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
    if (transformedAttendanceData.length === 0 && finalDayLeaveRequests.length > 0) {
      finalDayLeaveRequests.forEach(leave => {
        // Lấy thông tin ca làm việc cho đơn nghỉ phép này
        const leaveWorkShiftId = leave.workShiftID;
        const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
        
        // Lấy thứ trong tuần cho ngày đã chọn
        const selectedDate = new Date(fullDate);
        const selectedDayOfWeek = selectedDate.getDay();
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const selectedDayName = dayNames[selectedDayOfWeek];
        
        // Find shift details for the selected day
        let leaveDayShiftDetail = null;
        if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
          leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
        }
        
        // Xác định thời gian chấm công vào và ra
        let checkInTime = new Date(leave.startDateTime);
        let checkOutTime = new Date(leave.endDateTime);
        
        // For multi-day leaves, adjust times based on the selected date
        const leaveStartDate = new Date(leave.startDateTime).toDateString();
        const leaveEndDate = new Date(leave.endDateTime).toDateString();
        const currentLeaveDate = selectedDate.toDateString();
        
        if (leaveStartDate !== leaveEndDate) {
          // Multi-day leave
          if (currentLeaveDate === leaveStartDate) {
            // Start day - use leave start time (giữ nguyên giờ từ leave.startDateTime) and shift end time
            // checkInTime đã được set từ leave.startDateTime ở trên, không cần thay đổi
            if (leaveDayShiftDetail && leaveDayShiftDetail.endTime !== '00:00:00') {
              const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
              checkOutTime = new Date(selectedDate);
              checkOutTime.setHours(shiftEndTime.getHours(), shiftEndTime.getMinutes(), shiftEndTime.getSeconds());
            } else {
              // Fallback: nếu không có shift detail, dùng giờ kết thúc ca mặc định 17:00
              checkOutTime = new Date(selectedDate);
              checkOutTime.setHours(17, 0, 0);
            }
          } else if (currentLeaveDate === leaveEndDate) {
            // End day - use shift start time and leave end time (giữ nguyên giờ từ leave.endDateTime)
            if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00') {
              const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
              checkInTime = new Date(selectedDate);
              checkInTime.setHours(shiftStartTime.getHours(), shiftStartTime.getMinutes(), shiftStartTime.getSeconds());
            } else {
              // Fallback: nếu không có shift detail, dùng giờ bắt đầu ca mặc định 08:00
              checkInTime = new Date(selectedDate);
              checkInTime.setHours(8, 0, 0);
            }
            // checkOutTime đã được set từ leave.endDateTime ở trên, không cần thay đổi
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
        
        // Kiểm tra xem giờ vào có lớn hơn nửa giờ ca không (xem như checkout)
        // Chỉ áp dụng cho ngày đầu tiên
        let isCheckinAfterHalfShift = false;
        if (currentLeaveDate === leaveStartDate && leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
          const shiftStartTime = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
          const shiftEndTime = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
          const shiftDuration = (shiftEndTime - shiftStartTime) / (1000 * 60 * 60); // hours
          const halfShiftTime = new Date(shiftStartTime.getTime() + (shiftDuration * 30 * 60 * 1000)); // half shift in minutes
          
          // Kiểm tra xem thời gian bắt đầu nghỉ phép có sau nửa ca không
          const leaveStartTime = new Date(leave.startDateTime);
          const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
          
          if (leaveStartTimeOnly > halfShiftTime) {
            isCheckinAfterHalfShift = true;
          }
        }
        
        // Đảm bảo mỗi ngày đều có đủ 2 dòng (checkin và checkout)
        // Trừ trường hợp ngày đầu tiên và checkin sau nửa ca (chỉ có checkout)
        if (isCheckinAfterHalfShift && currentLeaveDate === leaveStartDate) {
          // Chỉ ngày đầu tiên và checkin sau nửa ca: chỉ tạo checkout entry
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
          // Tất cả các trường hợp khác: luôn có cả checkin và checkout
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
          // Tính giờ công
          const checkInTime = new Date(`2000-01-01T${item.checkInTime}`);
          const checkOutTime = new Date(`2000-01-01T${item.checkOutTime}`);
          
          // Lấy thông tin chi tiết ca làm việc to calculate proper work hours and lunch break
          // Sử dụng workShiftID từ item (có thể đã được update) để tìm shift info
          const itemWorkShiftID = item.workShiftID;
          let shiftDetails = [];
          let totalWorkHours = 0;
          let shiftStart = null;
          let shiftEnd = null;
          
          // Tìm work shift info từ workShiftID của item (có thể đã được update)
          if (itemWorkShiftID) {
            const itemWorkShift = workshifts.value.find(shift => shift.id === itemWorkShiftID);
            if (itemWorkShift) {
              shiftDetails = itemWorkShift.shiftDetails || [];
            }
          }
          
          // Fallback to workShiftInfo nếu không tìm thấy
          if (shiftDetails.length === 0 && workShiftInfo) {
            shiftDetails = workShiftInfo.shiftDetails || [];
          }
          
          // Lấy thứ trong tuần cho ngày đã chọn
          const selectedDate = new Date(fullDate);
          const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          const currentDayName = dayNames[dayOfWeek];
          
          console.log('Selected date:', fullDate, 'Day of week:', dayOfWeek, 'Day name:', currentDayName);
          console.log('Item workShiftID:', itemWorkShiftID);
          
          // Find shift details for the specific day
          const dayShiftDetail = shiftDetails.find(detail => detail.dayOfWeek === currentDayName);
          console.log('Found day shift detail:', dayShiftDetail);
          
          if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
            const startTime = new Date(`2000-01-01T${dayShiftDetail.startTime}`);
            const endTime = new Date(`2000-01-01T${dayShiftDetail.endTime}`);
            
            // Tính giờ công chuẩn không bao gồm giờ nghỉ trưa cho ngày cụ thể này
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
          
          // Tính thời gian chấm công vào/ra hiệu quả (logic mới)
          // Effective check-in: nếu checkInTime < shiftStart thì lấy shiftStart, ngược lại lấy checkInTime
          const effectiveCheckInTime = checkInTime < shiftStart ? shiftStart : checkInTime
          
          // Effective check-out: nếu checkOutTime < shiftEnd thì lấy checkOutTime, ngược lại lấy shiftEnd
          const effectiveCheckOutTime = checkOutTime < shiftEnd ? checkOutTime : shiftEnd
          
          // Tính tổng số giờ
          let totalTimeHours = (effectiveCheckOutTime - effectiveCheckInTime) / (1000 * 60 * 60)
          
          // Nếu kết quả âm thì = 0
          if (totalTimeHours < 0) {
            totalTimeHours = 0
          }
          
          // Trừ giờ nghỉ trưa nếu nó nằm trong thời gian làm việc
          let actualWorkHours = totalTimeHours
          if (dayShiftDetail && dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
              dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
            const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
            const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
            if (effectiveCheckInTime <= breakEnd && effectiveCheckOutTime >= breakStart) {
              const actualBreakStart = effectiveCheckInTime > breakStart ? effectiveCheckInTime : breakStart
              const actualBreakEnd = effectiveCheckOutTime < breakEnd ? effectiveCheckOutTime : breakEnd
              const actualBreakHours = (actualBreakEnd - actualBreakStart) / (1000 * 60 * 60)
              actualWorkHours = totalTimeHours - Math.max(0, actualBreakHours)
            }
          }
          
          // Đảm bảo actualWorkHours không âm
          if (actualWorkHours < 0) {
            actualWorkHours = 0
          }
          
          // Tính ngày công: luôn chia cho 8 giờ chuẩn (1 ngày công = 8 giờ)
          // Không chia cho totalWorkHours của ca vì ngày công phải dựa trên chuẩn 8 giờ/ngày
          const divisor = 8 // 1 ngày công = 8 giờ chuẩn
          const workDays = Math.round((actualWorkHours / divisor) * 100) / 100
          
          // Tính số phút đi trễ/về sớm sử dụng thời gian ca thực tế
          const lateMinutes = Math.max(0, (checkInTime - shiftStart) / (1000 * 60));
          
          // For early calculation, use shift end time as expected end time
          const actualShiftEnd = shiftEnd;
          
          const earlyMinutes = Math.max(0, (actualShiftEnd - checkOutTime) / (1000 * 60));
          
          // Debug log for troubleshooting
          console.log('=== WORK HOUR CALCULATION DEBUG ===');
          console.log('CheckIn:', item.checkInTime, 'CheckOut:', item.checkOutTime);
          console.log('ShiftStart:', shiftStart?.toTimeString().substring(0, 5), 'ShiftEnd:', shiftEnd?.toTimeString().substring(0, 5));
          console.log('EffectiveCheckIn:', effectiveCheckInTime?.toTimeString().substring(0, 5), 'EffectiveCheckOut:', effectiveCheckOutTime?.toTimeString().substring(0, 5));
          console.log('TotalWorkHours (from shift):', totalWorkHours);
          console.log('TotalTimeHours (effective):', totalTimeHours);
          console.log('ActualWorkHours:', actualWorkHours);
          console.log('WorkDays:', workDays);
          console.log('LateMinutes:', lateMinutes, 'EarlyMinutes:', earlyMinutes);
          console.log('=== END DEBUG ===');
          
          // Tính ngày công chuẩn: chia cho 8 giờ chuẩn (1 ngày công = 8 giờ)
          // Nhưng với các ca có công chuẩn < 8 giờ, ngày công chuẩn sẽ < 1
          const standardWorkDays = (totalWorkHours / 8).toFixed(2)
          
          transformedWorkData.push({
            stt: workSttCounter++,
            shiftName: item.shiftName,
            workShiftID: itemWorkShiftID, // Lưu workShiftID để kiểm tra sau
            standard: `${totalWorkHours.toFixed(2)}/${standardWorkDays}`,
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
    
    // Loại bỏ trùng lặp: chỉ giữ đơn có thời gian nghỉ dài hơn trong ngày
    const uniqueDayLeaveRequestsForWork = []
    const processedLeavesForWork = new Map() // Map<workShiftID, leave>
    
      dayLeaveRequestsForWork.forEach(leave => {
      const leaveWorkShiftId = leave.workShiftID
      const selectedDate = new Date(fullDate)
      const leaveStartDate = new Date(leave.startDateTime)
      const leaveEndDate = new Date(leave.endDateTime)
      
      // Tính thời gian nghỉ trong ngày này
      let dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      let dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const leaveStartInDay = leaveStartDate > dayStart ? leaveStartDate : dayStart
      const leaveEndInDay = leaveEndDate < dayEnd ? leaveEndDate : dayEnd
      const leaveDurationInDay = leaveEndInDay - leaveStartInDay
      
      // Nếu chưa có đơn nào cho ca này, hoặc đơn này có thời gian dài hơn
      if (!processedLeavesForWork.has(leaveWorkShiftId) || 
          processedLeavesForWork.get(leaveWorkShiftId).duration < leaveDurationInDay) {
        processedLeavesForWork.set(leaveWorkShiftId, { leave, duration: leaveDurationInDay })
      }
    })
    
    // Chuyển đổi Map thành array
    const finalDayLeaveRequestsForWork = Array.from(processedLeavesForWork.values()).map(item => item.leave)
    
    // Xử lý nghỉ phép: merge vào ca làm việc đã có hoặc tạo mới nếu chưa có
    finalDayLeaveRequestsForWork.forEach(leave => {
      // Lấy thông tin ca làm việc cho đơn nghỉ phép này
      const leaveWorkShiftId = leave.workShiftID;
      const leaveWorkShiftInfo = workshifts.value.find(shift => shift.id === leaveWorkShiftId);
      
      // Tính ngày công sử dụng hàm chung
      const selectedDate = new Date(fullDate);
      const leaveResult = calculateWorkDaysFromLeaveRequest(leave, selectedDate, leaveWorkShiftInfo);
      const leaveWorkDays = typeof leaveResult === 'object' ? leaveResult.workDays : leaveResult;
      const leaveWorkHours = typeof leaveResult === 'object' ? leaveResult.actualWorkHours : (leaveWorkDays * 8); // Giờ công thực tế (actual work hours)
      const leaveStandardWorkHours = typeof leaveResult === 'object' ? leaveResult.standardWorkHours : 8; // Giờ công chuẩn của ca (standard work hours)
      
      // Debug log để kiểm tra giá trị
      console.log('Leave calculation result:', {
        date: selectedDate.toLocaleDateString('vi-VN'),
        leaveStart: leave.startDateTime,
        leaveEnd: leave.endDateTime,
        actualWorkHours: leaveWorkHours,
        standardWorkHours: leaveStandardWorkHours,
        workDays: leaveWorkDays,
        result: leaveResult
      });
      
      // Lấy thông tin chi tiết ca làm việc for display purposes
      let leaveShiftStart = null;
      let leaveShiftEnd = null;
      let leaveScanInOut = 'Vào: --:--, Ra: --:--';
      let leaveLateEarly = 'Nghỉ phép';
      
      // Đặt thời gian quét vào/ra và tính đi trễ/về sớm dựa trên loại nghỉ phép
      const leaveStartDate = new Date(leave.startDateTime);
      leaveStartDate.setHours(0, 0, 0, 0);
      const leaveEndDate = new Date(leave.endDateTime);
      leaveEndDate.setHours(0, 0, 0, 0);
      const currentLeaveDate = new Date(selectedDate);
      currentLeaveDate.setHours(0, 0, 0, 0);
      
      // Luôn cố gắng lấy thông tin chi tiết ca để so sánh, nhưng không bắt buộc để hiển thị thời gian
      let leaveDayShiftDetail = null;
      if (leaveWorkShiftInfo && leaveWorkShiftInfo.shiftDetails) {
        // Lấy thứ trong tuần cho ngày đã chọn
        const selectedDayOfWeek = selectedDate.getDay();
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const selectedDayName = dayNames[selectedDayOfWeek];
        
        // Find shift details for the selected day
        leaveDayShiftDetail = leaveWorkShiftInfo.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName);
        
        if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
          leaveShiftStart = new Date(`2000-01-01T${leaveDayShiftDetail.startTime}`);
          leaveShiftEnd = new Date(`2000-01-01T${leaveDayShiftDetail.endTime}`);
        }
      }
      
      // Xác định thời gian quét vào/ra dựa trên khoảng nghỉ phép
      if (leaveStartDate.getTime() === leaveEndDate.getTime()) {
        // Single day leave - use actual leave times
        const leaveStartTime = new Date(leave.startDateTime);
        const leaveEndTime = new Date(leave.endDateTime);
        
        leaveScanInOut = `Vào: ${leaveStartTime.toTimeString().substring(0, 5)}, Ra: ${leaveEndTime.toTimeString().substring(0, 5)}`;
        
        // Tính đi trễ/về sớm nếu có thông tin chi tiết ca
        if (leaveShiftStart && leaveShiftEnd) {
          const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
          const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`);
          const lateMinutes = Math.max(0, (leaveStartTimeOnly - leaveShiftStart) / (1000 * 60));
          const earlyMinutes = Math.max(0, (leaveShiftEnd - leaveEndTimeOnly) / (1000 * 60));
          leaveLateEarly = `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`;
        } else {
          // If no shift details, default to 0 late/early
          leaveLateEarly = 'Đi trễ: 0 phút, Về sớm: 0 phút';
        }
      } else {
        // Multi-day leave - check if this is start, middle, or end day
        if (currentLeaveDate.getTime() === leaveStartDate.getTime()) {
          // Start day - use leave start time and shift end time (KHÔNG dùng leave.endDateTime vì đó là giờ kết thúc đơn nghỉ, không phải giờ kết thúc ca)
          const leaveStartTime = new Date(leave.startDateTime);
          
          // Luôn ưu tiên dùng shift end time từ leaveDayShiftDetail hoặc leaveShiftEnd
          // Ngày đầu tiên: giờ ra phải là giờ kết thúc ca (shift.endTime), không phải leave.endDateTime
          let shiftEndTimeStr = null;
          
          if (leaveDayShiftDetail && leaveDayShiftDetail.endTime && leaveDayShiftDetail.endTime !== '00:00:00') {
            // Use shift end time from shift detail (đây là giờ kết thúc ca, ví dụ 17:00)
            shiftEndTimeStr = leaveDayShiftDetail.endTime.substring(0, 5);
          } else if (leaveShiftEnd) {
            // Fallback: dùng leaveShiftEnd đã được tính từ shift detail
            const shiftEndHours = String(leaveShiftEnd.getHours()).padStart(2, '0');
            const shiftEndMinutes = String(leaveShiftEnd.getMinutes()).padStart(2, '0');
            shiftEndTimeStr = `${shiftEndHours}:${shiftEndMinutes}`;
          } else {
            // Fallback cuối cùng: dùng giờ kết thúc ca mặc định 17:00 (KHÔNG dùng leave.endDateTime)
            shiftEndTimeStr = '17:00';
          }
          
          // Debug: log để kiểm tra giá trị
          console.log('Start day - leaveScanInOut calculation:', {
            leaveStartTime: leaveStartTime.toTimeString().substring(0, 5),
            leaveDayShiftDetailEndTime: leaveDayShiftDetail?.endTime,
            leaveShiftEnd: leaveShiftEnd ? `${String(leaveShiftEnd.getHours()).padStart(2, '0')}:${String(leaveShiftEnd.getMinutes()).padStart(2, '0')}` : null,
            shiftEndTimeStr,
            leaveEndDateTime: new Date(leave.endDateTime).toTimeString().substring(0, 5)
          });
          
          leaveScanInOut = `Vào: ${leaveStartTime.toTimeString().substring(0, 5)}, Ra: ${shiftEndTimeStr}`;
          
          // Tính đi trễ nếu có thông tin chi tiết ca
          if (leaveShiftStart) {
            const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
            const lateMinutes = Math.max(0, (leaveStartTimeOnly - leaveShiftStart) / (1000 * 60));
            leaveLateEarly = `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: 0 phút`;
          } else {
            // If no shift details, default to 0 late/early
            leaveLateEarly = 'Đi trễ: 0 phút, Về sớm: 0 phút';
          }
        } else if (currentLeaveDate.getTime() === leaveEndDate.getTime()) {
          // End day - use leave end time
          const leaveEndTime = new Date(leave.endDateTime);
          
          if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00') {
            // Use shift start time if available
            leaveScanInOut = `Vào: ${leaveDayShiftDetail.startTime.substring(0, 5)}, Ra: ${leaveEndTime.toTimeString().substring(0, 5)}`;
          } else {
            // Fallback to leave start time if no shift detail
            const leaveStartTime = new Date(leave.startDateTime);
            leaveScanInOut = `Vào: ${leaveStartTime.toTimeString().substring(0, 5)}, Ra: ${leaveEndTime.toTimeString().substring(0, 5)}`;
          }
          
          // Tính về sớm nếu có thông tin chi tiết ca
          if (leaveShiftEnd) {
            const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`);
            const earlyMinutes = Math.max(0, (leaveShiftEnd - leaveEndTimeOnly) / (1000 * 60));
            leaveLateEarly = `Đi trễ: 0 phút, Về sớm: ${Math.round(earlyMinutes)} phút`;
          } else {
            // If no shift details, default to 0 late/early
            leaveLateEarly = 'Đi trễ: 0 phút, Về sớm: 0 phút';
          }
        } else {
          // Middle day - use shift times if available, otherwise use leave times
          if (leaveDayShiftDetail && leaveDayShiftDetail.startTime !== '00:00:00' && leaveDayShiftDetail.endTime !== '00:00:00') {
            leaveScanInOut = `Vào: ${leaveDayShiftDetail.startTime.substring(0, 5)}, Ra: ${leaveDayShiftDetail.endTime.substring(0, 5)}`;
            // Middle day: full shift, so no late/early
            leaveLateEarly = 'Đi trễ: 0 phút, Về sớm: 0 phút';
          } else {
            // Fallback to leave start/end times
            const leaveStartTime = new Date(leave.startDateTime);
            const leaveEndTime = new Date(leave.endDateTime);
            leaveScanInOut = `Vào: ${leaveStartTime.toTimeString().substring(0, 5)}, Ra: ${leaveEndTime.toTimeString().substring(0, 5)}`;
            // If no shift details, still try to calculate if we have shift times
            if (leaveShiftStart && leaveShiftEnd) {
              const leaveStartTimeOnly = new Date(`2000-01-01T${leaveStartTime.toTimeString().substring(0, 8)}`);
              const leaveEndTimeOnly = new Date(`2000-01-01T${leaveEndTime.toTimeString().substring(0, 8)}`);
              const lateMinutes = Math.max(0, (leaveStartTimeOnly - leaveShiftStart) / (1000 * 60));
              const earlyMinutes = Math.max(0, (leaveShiftEnd - leaveEndTimeOnly) / (1000 * 60));
              leaveLateEarly = `Đi trễ: ${Math.round(lateMinutes)} phút, Về sớm: ${Math.round(earlyMinutes)} phút`;
            } else {
              leaveLateEarly = 'Đi trễ: 0 phút, Về sớm: 0 phút';
            }
          }
        }
      }
      
      // Tìm dòng ca làm việc tương ứng trong transformedWorkData
      // Tìm theo workShiftID để merge thông tin nghỉ phép vào dòng đã có
      const existingWorkRow = transformedWorkData.find(work => 
        work.workShiftID === leaveWorkShiftId
      )
      
      // Tính công chuẩn (standard): giờ công chuẩn của ca / ngày công chuẩn
      const standardWorkDays = leaveStandardWorkHours > 0 ? (leaveStandardWorkHours / 8) : 1; // Ngày công chuẩn = giờ công chuẩn / 8
      const standardDisplay = `${leaveStandardWorkHours.toFixed(2)}/${standardWorkDays.toFixed(2)}`
      
      // Tính giờ/ngày công thực tế (workHour): giờ công thực tế / ngày công thực tế
      const workHourDisplay = `${leaveWorkHours.toFixed(2)}/${leaveWorkDays.toFixed(2)}`
      
      if (existingWorkRow) {
        // Cập nhật thông tin nghỉ phép vào dòng đã có (KHÔNG tạo dòng mới)
        existingWorkRow.scanInOut = leaveScanInOut
        existingWorkRow.lateEarly = leaveLateEarly
        existingWorkRow.workHour = workHourDisplay // Giờ/ngày công thực tế
        // Cập nhật standard: giờ công chuẩn của ca, không phải giờ công thực tế
        existingWorkRow.standard = standardDisplay
        // Đảm bảo shiftName không có "Phép năm" prefix
        if (existingWorkRow.shiftName && !existingWorkRow.shiftName.includes('Phép năm')) {
          // Giữ nguyên tên ca
        } else {
          existingWorkRow.shiftName = leaveWorkShiftInfo?.shiftName || 'N/A'
        }
      } else {
        // Chỉ tạo dòng mới nếu chưa có ca làm việc nào với workShiftID này
        // Và chỉ tạo nếu không có dòng nào khác với cùng workShiftID đã được tạo trong vòng lặp này
        const alreadyAdded = transformedWorkData.some(work => work.workShiftID === leaveWorkShiftId)
        if (!alreadyAdded) {
              transformedWorkData.push({
                stt: workSttCounter++,
            shiftName: leaveWorkShiftInfo?.shiftName || 'N/A', // Dùng tên ca, KHÔNG thêm "Phép năm"
            workShiftID: leaveWorkShiftId,
            standard: standardDisplay, // Công chuẩn: giờ công chuẩn của ca
            scanInOut: leaveScanInOut,
            lateEarly: leaveLateEarly,
            workHour: workHourDisplay // Giờ/ngày công thực tế
          });
          }
        }
      });
    
    // Nếu có chấm công thực tế, vẫn cần hiển thị nghỉ phép cho các ngày giữa (full ca làm việc)
    // LƯU Ý: Logic này đã được xử lý ở trên trong vòng lặp finalDayLeaveRequestsForWork.forEach,
    // nên không cần xử lý lại ở đây để tránh tạo dòng trùng lặp
    // Đoạn code này đã được loại bỏ để tránh tạo dòng "Phép năm (Ca Hành Chính)" trùng lặp
    
    // 3. Thêm ca làm việc đã phân nhưng chưa có attendance (không chấm công)
    const dayShiftAssignments = shiftAssignments.value.filter(sa => {
      const assignmentDate = new Date(sa.workDate).toDateString();
      const targetDate = new Date(fullDate).toDateString();
      return sa.employeeID === employee.id && assignmentDate === targetDate;
    });
    
    dayShiftAssignments.forEach(assignment => {
      // Kiểm tra xem đã có attendance cho ca này chưa
      // Kiểm tra cả trong attendanceData (từ API) và transformedWorkData (đã được thêm vào workHistory)
      const hasAttendanceInAPI = attendanceData && attendanceData.some(att => 
        att.workShiftID === assignment.workShiftID
      );
      
      // Kiểm tra xem đã có trong transformedWorkData chưa (từ attendance có chấm công)
      // So sánh bằng workShiftID để chính xác hơn
      const hasAttendanceInWorkData = transformedWorkData.some(work => 
        work.workShiftID === assignment.workShiftID
      );
      
      // Chỉ hiển thị trong "Lịch làm việc" nếu chưa có attendance cho ca này
      if (!hasAttendanceInAPI && !hasAttendanceInWorkData) {
        // Sửa: dùng workshifts từ composable thay vì workShifts
        const workShift = workshifts.value.find(ws => ws.id === assignment.workShiftID);
        
        if (workShift) {
          // Lấy thông tin ca làm việc để tính công chuẩn
          const selectedDate = new Date(fullDate);
          const dayOfWeek = selectedDate.getDay();
          const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          const currentDayName = dayNames[dayOfWeek];
          
          // Tìm shift details cho ngày này
          const dayShiftDetail = workShift.shiftDetails?.find(detail => detail.dayOfWeek === currentDayName);
          
          let standardHours = 8.00;
          let standardDays = 1.00;
          // Luôn hiển thị --:-- khi chưa có dữ liệu chấm công
          let scanInOut = 'Vào: --:--, Ra: --:--';
          
          if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
            const startTime = new Date(`2000-01-01T${dayShiftDetail.startTime}`);
            const endTime = new Date(`2000-01-01T${dayShiftDetail.endTime}`);
            
            // Tính giờ công chuẩn (trừ giờ nghỉ trưa)
            let workHours = (endTime - startTime) / (1000 * 60 * 60);
            
            if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
                dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
              const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`);
              const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`);
              const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
              workHours -= breakHours;
            }
            
            standardHours = workHours;
            standardDays = Math.round((workHours / 8) * 100) / 100;
            // Không hiển thị giờ vào/ra từ shift detail khi chưa có dữ liệu chấm công
            // scanInOut vẫn là 'Vào: --:--, Ra: --:--'
          }
          
          // Kiểm tra xem đã có dòng với workShiftID này chưa (có thể đã được thêm từ nghỉ phép)
          const existingRow = transformedWorkData.find(work => work.workShiftID === assignment.workShiftID)
          if (!existingRow) {
          transformedWorkData.push({
            stt: workSttCounter++,
            shiftName: workShift.shiftName,
              workShiftID: assignment.workShiftID, // Thêm workShiftID để có thể merge sau này
            standard: `${standardHours.toFixed(2)}/${standardDays.toFixed(2)}`,
            scanInOut: scanInOut,
            lateEarly: 'Chưa chấm công',
            workHour: '0.00/0.00'
          });
          }
        }
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
    // Đặt dữ liệu rỗng khi lỗi
    attendanceHistory.value = [];
    workHistory.value = [];
  } finally {
    dayModalLoading.value = false;
  }
}

// Hàm xử lý đổi ca làm việc cho attendance
const handleShiftChange = async (item, newShiftId) => {
  if (!item.attendanceId || !newShiftId || item.workShiftID === parseInt(newShiftId)) {
    return;
  }

  try {
    // Đặt trạng thái loading
    updatingShifts.value[item.attendanceId] = true;

    // Gọi API để update attendance shift
    await updateAttendanceShift(item.attendanceId, parseInt(newShiftId), item.employeeId, item.workDate);

    // Tìm ca mới để cập nhật tên ca
    const newShift = workshifts.value.find(shift => shift.id === parseInt(newShiftId));
    
    // Cập nhật lại attendanceHistory
    const attendanceIndex = attendanceHistory.value.findIndex(att => att.attendanceId === item.attendanceId);
    if (attendanceIndex !== -1) {
      attendanceHistory.value[attendanceIndex].workShiftID = parseInt(newShiftId);
      attendanceHistory.value[attendanceIndex].shiftName = newShift ? newShift.shiftName : item.shiftName;
    }

    // Cập nhật tất cả các record có cùng attendanceId (check-in và check-out)
    attendanceHistory.value.forEach(att => {
      if (att.attendanceId === item.attendanceId) {
        att.workShiftID = parseInt(newShiftId);
        att.shiftName = newShift ? newShift.shiftName : att.shiftName;
      }
    });

    // Reload lại dữ liệu modal để cập nhật workHistory
    await loadDayModalData(selectedEmployee.value, selectedDateIdx.value);
    
    // Reload lại dữ liệu attendance để cập nhật màu sắc trong bảng tổng hợp
    await loadAttendanceDataForSummary();

    showMessage('Đổi ca thành công!', 'success');
  } catch (error) {
    console.error('Error updating attendance shift:', error);
    showMessage('Có lỗi xảy ra khi đổi ca: ' + (error.response?.data?.message || error.message), 'error');
  } finally {
    updatingShifts.value[item.attendanceId] = false;
  }
}

// Hàm gọi API để update attendance shift
const updateAttendanceShift = async (attendanceId, newWorkShiftID, employeeId, workDate) => {
  try {
    // Tìm hoặc tạo ShiftAssignment mới cho ca mới
    const workDateObj = new Date(workDate);
    const workDateStr = `${workDateObj.getFullYear()}-${String(workDateObj.getMonth() + 1).padStart(2, '0')}-${String(workDateObj.getDate()).padStart(2, '0')}`;
    
    // Kiểm tra xem đã có ShiftAssignment cho ca mới chưa
    let shiftAssignment = shiftAssignments.value.find(sa => 
      sa.employeeID === employeeId && 
      sa.workShiftID === newWorkShiftID &&
      new Date(sa.workDate).toDateString() === workDateObj.toDateString()
    );

    let shiftAssignmentId = null;

    if (!shiftAssignment) {
      // Tạo ShiftAssignment mới
      const newAssignment = await createShiftAssignment({
        employeeID: employeeId,
        workShiftID: newWorkShiftID,
        workDate: workDateStr
      });
      shiftAssignmentId = newAssignment.id;
      // Refresh shift assignments
      await fetchAllShiftAssignments();
    } else {
      shiftAssignmentId = shiftAssignment.id;
    }

    // Update attendance với ShiftAssignmentID mới
    const response = await api.put(`/Attendance/${attendanceId}/shift`, {
      shiftAssignmentID: shiftAssignmentId
    });

    return response.data;
  } catch (error) {
    console.error('Error in updateAttendanceShift:', error);
    throw error;
  }
}

// Xử lý chốt công
const handleCloseTimeSheet = async () => {
  if (!currentUser.value) {
    showMessage('Vui lòng đăng nhập để thực hiện chốt công', 'error')
    return
  }

  const confirmed = confirm(`Bạn có chắc chắn muốn chốt bảng công tháng ${selectedMonth.value}/${selectedYear.value}?\n\nSau khi chốt, dữ liệu sẽ không thể thay đổi.`)
  
  if (confirmed) {
    const success = await closeTimeSheet(selectedYear.value, selectedMonth.value)
    if (success) {
      // Refresh data after closing
      await fetchAttendanceData()
    }
  }
}

// Xử lý chốt tăng ca
const handleCloseOvertimeSheet = async () => {
  if (!currentUser.value) {
    showMessage('Vui lòng đăng nhập để thực hiện chốt tăng ca', 'error')
    return
  }

  const confirmed = confirm(`Bạn có chắc chắn muốn chốt bảng tăng ca tháng ${selectedMonth.value}/${selectedYear.value}?\n\nSau khi chốt, dữ liệu sẽ không thể thay đổi.`)
  
  if (confirmed) {
    const success = await closeOvertimeSheet(selectedYear.value, selectedMonth.value)
    if (success) {
      // Refresh data after closing
      await fetchAttendanceData()
    }
  }
}

// Xử lý chốt tất cả bảng
const handleCloseAllSheets = async () => {
  if (!currentUser.value) {
    showMessage('Vui lòng đăng nhập để thực hiện chốt bảng', 'error')
    return
  }

  const confirmed = confirm(`Bạn có chắc chắn muốn chốt tất cả bảng (công, lương, tăng ca) tháng ${selectedMonth.value}/${selectedYear.value}?\n\nSau khi chốt, dữ liệu sẽ không thể thay đổi.`)
  
  if (confirmed) {
    const success = await closeAllSheets(selectedYear.value, selectedMonth.value)
    if (success) {
      // Refresh data after closing
      await fetchAttendanceData()
    }
  }
}

// Load attendance data on component mount
/**
 * Theo dõi modal bản đồ vị trí để khởi tạo bản đồ
 */
let locationMap = null
watch(showLocationMapModal, async (isOpen) => {
  if (isOpen && mapLocation.value.lat && mapLocation.value.lng) {
    await nextTick()
    // Load Leaflet dynamically
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initLocationMap
      document.head.appendChild(script)
    } else if (window.L) {
      initLocationMap()
    }
  } else if (!isOpen && locationMap) {
    // Clean up map when modal closes
    if (locationMap) {
      locationMap.remove()
      locationMap = null
    }
  }
})

function initLocationMap() {
  if (!window.L) return
  
  const mapContainer = document.getElementById('location-map')
  if (!mapContainer) return
  
  // Remove existing map if any
  if (locationMap) {
    locationMap.remove()
  }
  
  // Initialize map
  locationMap = window.L.map('location-map', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([mapLocation.value.lat, mapLocation.value.lng], 18)
  
  // Add tile layer
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(locationMap)
  
  // Add marker
  window.L.marker([mapLocation.value.lat, mapLocation.value.lng])
    .addTo(locationMap)
    .bindPopup(mapLocation.value.name)
    .openPopup()
}

onMounted(async () => {
  console.log('=== MOUNTING COMPONENT ===');
  // Sync tab from URL query
  const qTab = route.query.tab
  if (typeof qTab === 'string') {
    const allowed = allTabs.map(t => t.key)
    if (allowed.includes(qTab)) activeTab.value = qTab
  }


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

    // Kiểm tra xem có thể cần phân trang hoặc dữ liệu đã hoàn chỉnh
    if (leaveRequests.value && leaveRequests.value.length > 0) {
      console.log('Sample leave request:', leaveRequests.value[0]);

      // Kiểm tra khoảng ngày của dữ liệu đã tải
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

// Keep activeTab in sync when tab query changes while staying on the same route
watch(() => route.query.tab, (newTab) => {
  const allowed = allTabs.map(t => t.key)
  if (typeof newTab === 'string' && allowed.includes(newTab)) {
    activeTab.value = newTab
  }
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
  
  // Lấy tất cả các ngày trong tháng đã chọn
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

/**
 * Tính toán thống kê chấm công cá nhân cho user hiện tại
 * @returns {Object} Object chứa các thống kê: totalWorkDays, totalLeave, totalInsufficient, totalIncomplete, totalLate, totalDays
 */
const personalStatistics = computed(() => {
  if (!currentUser.value) {
    return {
      totalWorkDays: 0,
      totalLeave: 0,
      totalInsufficient: 0,
      totalIncomplete: 0,
      totalAbsentWithoutLeave: 0,
      totalDays: 0
    }
  }

  const employeeId = currentUser.value.id
  const monthStart = new Date(selectedYear.value, selectedMonth.value - 1, 1)
  const monthEnd = new Date(selectedYear.value, selectedMonth.value, 0, 23, 59, 59)
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()

  const stats = {
    totalWorkDays: 0,
    totalLeave: 0,
    totalInsufficient: 0,
    totalIncomplete: 0,
    totalAbsentWithoutLeave: 0,
    totalDays: daysInMonth
  }

  // Tính từ dữ liệu chấm công thực tế
  if (attendanceList.value && attendanceList.value.length > 0) {
    const employeeAttendance = attendanceList.value.filter(att => {
      const attEmployeeId = att.employeeCode || att.employeeID || att.employeeId
      return attEmployeeId === employeeId
    })

    // Nhóm các bản ghi chấm công theo ngày để xử lý trường hợp có nhiều bản ghi trong cùng một ngày
    const attendanceByDate = new Map()
    
    employeeAttendance.forEach(att => {
      const workDate = new Date(att.workDate)
      workDate.setHours(0, 0, 0, 0)
      
      if (workDate >= monthStart && workDate <= monthEnd) {
        const dateKey = workDate.getTime()
        
        // Nếu chưa có bản ghi cho ngày này, tạo mới
        if (!attendanceByDate.has(dateKey)) {
          attendanceByDate.set(dateKey, {
            checkInTime: null,
            checkOutTime: null,
            workShiftID: null,
            workDate: workDate,
            records: []
          })
        }
        
        const dayData = attendanceByDate.get(dateKey)
        dayData.records.push(att)
        
        // Lấy check-in và check-out từ các bản ghi (có thể từ các bản ghi khác nhau)
        if (att.checkInTime && !dayData.checkInTime) {
          dayData.checkInTime = att.checkInTime
        }
        if (att.checkOutTime && !dayData.checkOutTime) {
          dayData.checkOutTime = att.checkOutTime
        }
        if (att.workShiftID && !dayData.workShiftID) {
          dayData.workShiftID = att.workShiftID
        }
      }
    })
    
    // Xử lý từng ngày
    attendanceByDate.forEach((dayData, dateKey) => {
      if (dayData.checkInTime && dayData.checkOutTime) {
        // Có cả check-in và check-out
        const attRecord = {
          checkInTime: dayData.checkInTime,
          checkOutTime: dayData.checkOutTime,
          workShiftID: dayData.workShiftID,
          workDate: dayData.workDate
        }
        
        const result = calculateWorkDaysFromAttendanceData(attRecord)
        if (result.actualWorkHours > 0) {
          // Kiểm tra xem có đủ giờ công không
          let isSufficient = false
          
          if (dayData.workShiftID) {
            const workShift = workshifts.value.find(shift => shift.id === dayData.workShiftID)
            if (workShift && workShift.shiftDetails) {
              const dayOfWeek = dayData.workDate.getDay()
              const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
              const currentDayName = dayNames[dayOfWeek]
              const dayShiftDetail = workShift.shiftDetails.find(detail => detail.dayOfWeek === currentDayName)
              
              if (dayShiftDetail && dayShiftDetail.startTime !== '00:00:00' && dayShiftDetail.endTime !== '00:00:00') {
                const shiftStart = new Date(`2000-01-01T${dayShiftDetail.startTime}`)
                const shiftEnd = new Date(`2000-01-01T${dayShiftDetail.endTime}`)
                const checkInTime = new Date(`2000-01-01T${dayData.checkInTime}`)
                
                // Tính giờ công chuẩn
                let standardWorkHours = (shiftEnd - shiftStart) / (1000 * 60 * 60)
                if (dayShiftDetail.breakStart && dayShiftDetail.breakEnd && 
                    dayShiftDetail.breakStart !== '00:00:00' && dayShiftDetail.breakEnd !== '00:00:00') {
                  const breakStart = new Date(`2000-01-01T${dayShiftDetail.breakStart}`)
                  const breakEnd = new Date(`2000-01-01T${dayShiftDetail.breakEnd}`)
                  const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60)
                  standardWorkHours -= breakHours
                }
                
                // Kiểm tra đủ giờ công (cho phép sai số 0.1 giờ)
                isSufficient = result.actualWorkHours >= (standardWorkHours - 0.1)
              } else {
                // Không có shift detail, tính theo giờ thực tế
                isSufficient = result.actualWorkHours >= 7.9 // Gần 8 giờ
              }
            } else {
              // Không có shift details, tính theo giờ thực tế
              isSufficient = result.actualWorkHours >= 7.9
            }
          } else {
            // Không có workShiftID, tính theo giờ thực tế
            isSufficient = result.actualWorkHours >= 7.9
          }
          
          // Phân loại ngày
          if (isSufficient) {
            stats.totalWorkDays += 1
          } else {
            stats.totalInsufficient += 1
          }
        }
      } else if (dayData.checkInTime && !dayData.checkOutTime) {
        // Chỉ có check-in, không có check-out
        stats.totalIncomplete += 1
      } else if (!dayData.checkInTime && dayData.checkOutTime) {
        // Chỉ có check-out, không có check-in
        stats.totalIncomplete += 1
      }
    })
  }

  // Tính từ đơn nghỉ phép đã duyệt
  if (leaveRequests.value && leaveRequests.value.length > 0) {
    const monthStartDate = new Date(monthStart)
    monthStartDate.setHours(0, 0, 0, 0)
    const monthEndDate = new Date(monthEnd)
    monthEndDate.setHours(0, 0, 0, 0)

    // Lấy danh sách các ngày đã có chấm công thực tế
    const attendanceDates = new Set()
    if (attendanceList.value && attendanceList.value.length > 0) {
      const employeeAttendance = attendanceList.value.filter(att => {
        const attEmployeeId = att.employeeCode || att.employeeID || att.employeeId
        return attEmployeeId === employeeId
      })
      
      employeeAttendance.forEach(att => {
        if (att.checkInTime && att.checkOutTime) {
          const workDate = new Date(att.workDate)
          workDate.setHours(0, 0, 0, 0)
          attendanceDates.add(workDate.getTime())
        }
      })
    }

    // Nhóm các đơn nghỉ phép theo ngày và chỉ lấy đơn dài nhất cho mỗi ngày
    const dayLeaveMap = new Map()
    
    leaveRequests.value.forEach(leave => {
      if (leave.employeeID !== employeeId) return
      
      const leaveStart = new Date(leave.startDateTime)
      const leaveEnd = new Date(leave.endDateTime)
      if (leaveStart > monthEndDate || leaveEnd < monthStartDate) return
      
      const leaveTypeName = (leave.leaveTypeName || '').toLowerCase()
      const isPaidLeave = (leaveTypeName.includes('phép năm') || 
                          leaveTypeName.includes('phép có lương')) &&
                          !leaveTypeName.includes('nghỉ bù') &&
                          !leaveTypeName.includes('bù')
      
      if (isPaidLeave && (leave.approveStatus === 'Đã duyệt' || leave.approveStatus === 'Approved')) {
        const startDate = new Date(leaveStart > monthStartDate ? leaveStart : monthStartDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(leaveEnd < monthEndDate ? leaveEnd : monthEndDate)
        endDate.setHours(0, 0, 0, 0)
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = new Date(d)
          dateKey.setHours(0, 0, 0, 0)
          
          if (dateKey >= monthStartDate && dateKey <= monthEndDate) {
            if (!attendanceDates.has(dateKey.getTime())) {
              const dayString = `${dateKey.getFullYear()}-${String(dateKey.getMonth() + 1).padStart(2, '0')}-${String(dateKey.getDate()).padStart(2, '0')}`
              
              const dayStart = new Date(dateKey.getFullYear(), dateKey.getMonth(), dateKey.getDate())
              const dayEnd = new Date(dateKey.getFullYear(), dateKey.getMonth(), dateKey.getDate(), 23, 59, 59, 999)
              
              const requestStartOnDay = leaveStart > dayStart ? leaveStart : dayStart
              const requestEndOnDay = leaveEnd < dayEnd ? leaveEnd : dayEnd
              const dayDuration = requestEndOnDay - requestStartOnDay
              
              if (!dayLeaveMap.has(dayString) || dayLeaveMap.get(dayString).duration < dayDuration) {
                dayLeaveMap.set(dayString, { leave, duration: dayDuration })
              }
            }
          }
        }
      }
    })
    
    // Đếm số ngày nghỉ phép
    stats.totalLeave = dayLeaveMap.size
  }

  // Tính số ngày vắng không phép
  // Logic: Vắng không phép = những ngày có phân ca nhưng không có chấm công và không có đơn nghỉ phép đã duyệt, và là ngày đã qua
  // Tham khảo logic từ tab "Bảng tổng hợp công" (generateAttendanceForEmployee)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Lấy danh sách các ngày đã có chấm công
  const attendanceDates = new Set()
  if (attendanceList.value && attendanceList.value.length > 0) {
    const employeeAttendance = attendanceList.value.filter(att => {
      const attEmployeeId = att.employeeCode || att.employeeID || att.employeeId
      return attEmployeeId === employeeId
    })
    
    employeeAttendance.forEach(att => {
      const workDate = new Date(att.workDate)
      workDate.setHours(0, 0, 0, 0)
      if (workDate >= monthStart && workDate <= monthEnd) {
        attendanceDates.add(workDate.getTime())
      }
    })
  }
  
  // Lấy danh sách các ngày có đơn nghỉ phép đã duyệt (tất cả loại nghỉ phép, không chỉ phép có lương)
  const leaveDates = new Set()
  if (leaveRequests.value && leaveRequests.value.length > 0) {
    const monthStartDate = new Date(monthStart)
    monthStartDate.setHours(0, 0, 0, 0)
    const monthEndDate = new Date(monthEnd)
    monthEndDate.setHours(0, 0, 0, 0)
    
    leaveRequests.value.forEach(leave => {
      if (leave.employeeID !== employeeId) return
      
      const leaveStart = new Date(leave.startDateTime)
      const leaveEnd = new Date(leave.endDateTime)
      if (leaveStart > monthEndDate || leaveEnd < monthStartDate) return
      
      // Chỉ tính các đơn đã duyệt
      if (leave.approveStatus === 'Đã duyệt' || leave.approveStatus === 'Approved') {
        const startDate = new Date(leaveStart > monthStartDate ? leaveStart : monthStartDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(leaveEnd < monthEndDate ? leaveEnd : monthEndDate)
        endDate.setHours(0, 0, 0, 0)
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = new Date(d)
          dateKey.setHours(0, 0, 0, 0)
          
          if (dateKey >= monthStartDate && dateKey <= monthEndDate) {
            leaveDates.add(dateKey.getTime())
          }
        }
      }
    })
  }
  
  // Lặp qua từng ngày trong tháng để kiểm tra vắng không phép
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, day)
    currentDate.setHours(0, 0, 0, 0)
    
    // Chỉ tính vắng không phép cho các ngày đã qua (từ đầu tháng đến ngày hiện tại)
    const isPastOrToday = currentDate.getTime() <= today.getTime()
    if (!isPastOrToday) continue
    
    // Kiểm tra xem ngày này có phân ca làm việc không
    const hasShiftAssignment = shiftAssignments.value?.some(sa => {
      const saDate = new Date(sa.workDate)
      saDate.setHours(0, 0, 0, 0)
      return sa.employeeID === employeeId && saDate.getTime() === currentDate.getTime()
    })
    
    if (!hasShiftAssignment) continue // Không có phân ca thì không tính vắng không phép
    
    // Kiểm tra xem ngày này có chấm công không
    const hasAttendance = attendanceDates.has(currentDate.getTime())
    
    // Kiểm tra xem ngày này có đơn nghỉ phép đã duyệt không
    const hasLeave = leaveDates.has(currentDate.getTime())
    
    // Nếu có phân ca nhưng không có chấm công và không có đơn nghỉ phép -> vắng không phép
    if (!hasAttendance && !hasLeave) {
      stats.totalAbsentWithoutLeave += 1
    }
  }

  return stats
})

// Personal Overtime Data
const personalOvertimeData = computed(() => {
  if (!currentUser.value) return []
  
  const year = selectedYear.value
  const month = selectedMonth.value - 1 // JavaScript months are 0-indexed
  
  // Lấy tất cả các ngày trong tháng đã chọn
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
            
            // Phân loại theo hình thức tăng ca - sử dụng cùng logic với tab "Bảng công tăng ca"
            // Sử dụng overtimeFormName và overtimeFormID thay vì overtimeTypeName
            const firstRequest = approvedOvertime[0]
            let statusClass = 'paid' // Mặc định là tính lương nếu không xác định được
            
            // Sử dụng logic giống getOvertimeType trong tab overtime
            if (firstRequest.overtimeFormName?.toLowerCase().includes('tính lương') || firstRequest.overtimeFormID === 1) {
              statusClass = 'paid'  // Tăng ca tính lương - màu tím
            } else if (firstRequest.overtimeFormName?.toLowerCase().includes('nghỉ bù') || firstRequest.overtimeFormID === 2) {
              statusClass = 'compensatory'  // Tăng ca nghỉ bù - màu xanh lá
            } else {
              // Nếu không xác định được, mặc định là tính lương
              statusClass = 'paid'
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

/**
 * Tính toán thống kê tăng ca cá nhân
 */
const personalOvertimeStatistics = computed(() => {
  if (!currentUser.value || !personalOvertimeData.value || personalOvertimeData.value.length === 0) {
    return {
      totalCompensatoryDays: 0,
      totalPaidDays: 0,
      totalOvertimeDays: 0,
      totalOvertimeHours: 0,
      totalOvertimeHoursWithCoeff: 0,
      totalOvertimeDaysWithCoeff: 0
    }
  }

  const allDays = personalOvertimeData.value.flat().filter(d => d.isCurrentMonth && d.overtime && d.overtime.requests)
  
  let totalCompensatoryDays = 0
  let totalPaidDays = 0
  let totalOvertimeHours = 0
  let totalOvertimeHoursWithCoeff = 0

  allDays.forEach(dayData => {
    if (dayData.overtime && dayData.overtime.requests) {
      // Đếm số ngày theo loại
      if (dayData.overtime.class === 'compensatory') {
        totalCompensatoryDays += 1
      } else if (dayData.overtime.class === 'paid') {
        totalPaidDays += 1
      }
      
      // Tính tổng giờ tăng ca
      dayData.overtime.requests.forEach(ot => {
        const startTime = new Date(ot.startDateTime)
        const endTime = new Date(ot.endDateTime)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        const coefficient = ot.coefficient || 1
        
        totalOvertimeHours += hours
        totalOvertimeHoursWithCoeff += hours * coefficient
      })
    }
  })

  // Tổng ngày tăng ca = tổng giờ tăng ca / 8 (không tính hệ số)
  const totalOvertimeDays = Math.round((totalOvertimeHours / 8) * 100) / 100

  // Tổng ngày tăng ca có hệ số = tổng giờ tăng ca có hệ số / 8
  const totalOvertimeDaysWithCoeff = Math.round((totalOvertimeHoursWithCoeff / 8) * 100) / 100

  return {
    totalCompensatoryDays,
    totalPaidDays,
    totalOvertimeDays,
    totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
    totalOvertimeHoursWithCoeff: Math.round(totalOvertimeHoursWithCoeff * 10) / 10,
    totalOvertimeDaysWithCoeff
  }
})

const getPersonalCellClass = (statusClass) => {
  // Use the same class mapping as summary tab + overtime types
  const classMap = {
    'work': 'personal-cell work',
    'leave': 'personal-cell leave',
    'insufficient': 'personal-cell insufficient',
    'incomplete': 'personal-cell incomplete',
    'late': 'personal-cell late',
    'absent-without-leave': 'personal-cell absent-without-leave',
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
    'compensatory': 'Tăng ca nghỉ bù',
    'paid': 'Tăng ca tính lương'
  }
  
  return `${dayData.overtime.time} - ${statusMap[dayData.overtime.class] || 'Tăng ca'}`
}

/**
 * Hàm tiện ích để lấy tên đầy đủ của nhân viên (tương tự như ProfileView.vue)
 * @param {Object} employee - Đối tượng nhân viên
 * @returns {String} Tên đầy đủ của nhân viên
 */
const getEmployeeFullName = (employee) => {
  if (!employee) return null
  if (employee.fullName) return employee.fullName
  if (employee.firstName && employee.lastName) {
    return `${employee.firstName} ${employee.lastName}`
  }
  return null
}

// Tour Guide Functions
const startTour = () => {
  console.log('Starting tour, activeTab:', activeTab.value)
  console.log('Tour steps:', tourSteps.value)
  showTourGuide.value = true
}

const handleTourComplete = () => {
  showTourGuide.value = false
}

// Tour Steps - Dynamic based on active tab
const tourSteps = computed(() => {
  if (activeTab.value === 'summary') {
    return [
      {
        target: '[data-tour="title"]',
        message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Bảng tổng hợp công" - nơi bạn có thể xem tổng hợp công của tất cả nhân viên trong tháng.'
      },
      {
        target: '[data-tour="tabs"]',
        message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Bảng tổng hợp công".'
      },
      {
        target: '[data-tour="month-filter"]',
        message: 'Đây là bộ lọc tháng. Bạn có thể chuyển đổi giữa các tháng để xem dữ liệu công của các tháng khác nhau.'
      },
      {
        target: '[data-tour="legend"]',
        message: 'Đây là chú thích màu sắc. Mỗi màu đại diện cho một trạng thái công: xanh lá (đi làm), xanh dương (nghỉ phép), vàng (chưa đủ giờ công), đỏ (quên checkin/checkout).'
      },
      {
        target: '[data-tour="summary-table"]',
        message: 'Đây là bảng tổng hợp công. Bạn có thể xem thông tin công của từng nhân viên theo từng ngày trong tháng.'
      },
      {
        target: '[data-tour="employee-modal"]',
        message: 'Đây là modal chi tiết tổng hợp công nhân viên. Bạn có thể xem thống kê tổng hợp về ngày công, đi làm, công tác, nghỉ có lương, tăng ca nghỉ bù và tăng ca tính lương.',
        action: {
          type: 'click',
          selector: '[data-tour="detail-btn"]:first-of-type'
        }
      },
      {
        target: '[data-tour="day-modal"]',
        message: 'Đây là modal chi tiết chấm công từng ngày. Bạn có thể xem dữ liệu chấm công và lịch làm việc chi tiết của nhân viên cho một ngày cụ thể. Hãy để tôi hướng dẫn từng phần!',
        action: {
          type: 'function',
          func: async () => {
            // Đóng modal employee nếu đang mở
            if (showEmployeeModal.value) {
              showEmployeeModal.value = false
              await new Promise(resolve => setTimeout(resolve, 200))
            }
            // Tìm và click vào một ô ngày có dữ liệu
            const firstCell = document.querySelector('[data-tour="day-cell"]')
            if (firstCell) {
              firstCell.click()
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        }
      },
      {
        target: '[data-tour="attendance-history"]',
        message: 'Đây là bảng dữ liệu chấm công. Bạn có thể xem thông tin về các lần quét thẻ, giờ quét, loại công và vị trí chấm công. Bạn có thể click vào mã phiếu tham chiếu để xem chi tiết phiếu nghỉ phép.'
      },
      {
        target: '[data-tour="work-history"]',
        message: 'Đây là bảng lịch làm việc. Bạn có thể xem thông tin về ca làm việc, công chuẩn, giờ quét vào/ra, đi trễ/về sớm và giờ/ngày công.'
      },
      {
        target: '[data-tour="leave-form-modal"]',
        message: 'Đây là modal chi tiết phiếu nghỉ phép. Bạn có thể xem và chỉnh sửa thông tin về đơn nghỉ phép của nhân viên.',
        action: {
          type: 'function',
          func: async () => {
            // Đóng modal day nếu đang mở
            if (showDayModal.value) {
              showDayModal.value = false
              await new Promise(resolve => setTimeout(resolve, 200))
            }
            // Tìm và click vào một mã phiếu nghỉ phép
            const voucherLink = document.querySelector('[data-tour="voucher-code-link"]')
            if (voucherLink) {
              voucherLink.click()
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }
        }
      },
      {
        target: '[data-tour="pagination-summary"]',
        message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều nhân viên hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Bảng tổng hợp công"!',
        action: {
          type: 'function',
          func: async () => {
            // Đóng modal nếu đang mở
            if (showLeaveFormModal.value) {
              showLeaveFormModal.value = false
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }
        }
      }
    ]
  } else if (activeTab.value === 'personal') {
    return [
      {
        target: '[data-tour="title"]',
        message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Bảng công cá nhân" - nơi bạn có thể xem bảng công của chính mình trong tháng.'
      },
      {
        target: '[data-tour="tabs"]',
        message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Bảng công cá nhân".'
      },
      {
        target: '[data-tour="month-filter-personal"]',
        message: 'Đây là bộ lọc tháng. Bạn có thể chuyển đổi giữa các tháng để xem dữ liệu công của các tháng khác nhau.'
      },
      {
        target: '[data-tour="legend-personal"]',
        message: 'Đây là chú thích màu sắc. Mỗi màu đại diện cho một trạng thái công: xanh lá (đi làm), xanh dương (nghỉ phép), vàng (chưa đủ giờ công), đỏ (quên checkin/checkout).'
      },
      {
        target: '[data-tour="personal-calendar"]',
        message: 'Đây là lịch công cá nhân. Bạn có thể xem trạng thái công của mình theo từng ngày trong tháng. Click vào một ngày để xem chi tiết.'
      },
      {
        target: '[data-tour="personal-stats"]',
        message: 'Đây là thống kê tháng. Bạn có thể xem tổng hợp về số ngày đi làm, nghỉ phép, chưa đủ giờ, quên checkin/checkout, đi trễ và tổng ngày trong tháng.'
      }
    ]
  } else if (activeTab.value === 'overtime') {
    return [
      {
        target: '[data-tour="title"]',
        message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Bảng công tăng ca" - nơi bạn có thể xem tổng hợp tăng ca của tất cả nhân viên trong tháng.'
      },
      {
        target: '[data-tour="tabs"]',
        message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Bảng công tăng ca".'
      },
      {
        target: '[data-tour="month-filter-overtime"]',
        message: 'Đây là bộ lọc tháng. Bạn có thể chuyển đổi giữa các tháng để xem dữ liệu tăng ca của các tháng khác nhau.'
      },
      {
        target: '[data-tour="legend-overtime"]',
        message: 'Đây là chú thích màu sắc. Mỗi màu đại diện cho một loại tăng ca: xanh lá (tăng ca nghỉ bù), xanh dương (tăng ca tính lương).'
      },
      {
        target: '[data-tour="overtime-table"]',
        message: 'Đây là bảng tổng hợp tăng ca. Bạn có thể xem thông tin tăng ca của từng nhân viên theo từng ngày trong tháng.'
      },
      {
        target: '[data-tour="overtime-modal"]',
        message: 'Đây là modal chi tiết tăng ca. Bạn có thể xem thông tin chi tiết về số giờ tăng ca, số ngày tăng ca, giờ có hệ số và ngày có hệ số của nhân viên.',
        action: {
          type: 'click',
          selector: '[data-tour="overtime-detail-btn"]:first-of-type'
        }
      },
      {
        target: '[data-tour="pagination-overtime"]',
        message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều nhân viên hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Bảng công tăng ca"!',
        action: {
          type: 'function',
          func: async () => {
            // Đóng modal nếu đang mở
            if (showOvertimeModal.value) {
              showOvertimeModal.value = false
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }
        }
      }
    ]
  } else if (activeTab.value === 'personalOvertime') {
    return [
      {
        target: '[data-tour="title"]',
        message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Bảng công tăng ca cá nhân" - nơi bạn có thể xem bảng tăng ca của chính mình trong tháng.'
      },
      {
        target: '[data-tour="tabs"]',
        message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Bảng công tăng ca cá nhân".'
      },
      {
        target: '[data-tour="month-filter-personal-ot"]',
        message: 'Đây là bộ lọc tháng. Bạn có thể chuyển đổi giữa các tháng để xem dữ liệu tăng ca của các tháng khác nhau.'
      },
      {
        target: '[data-tour="legend-personal-ot"]',
        message: 'Đây là chú thích màu sắc. Mỗi màu đại diện cho một loại tăng ca: xanh lá (tăng ca nghỉ bù), tím (tăng ca tính lương), xám (tăng ca thường).'
      },
      {
        target: '[data-tour="personal-ot-calendar"]',
        message: 'Đây là lịch tăng ca cá nhân. Bạn có thể xem trạng thái tăng ca của mình theo từng ngày trong tháng.'
      },
      {
        target: '[data-tour="personal-ot-stats"]',
        message: 'Đây là thống kê tăng ca tháng. Bạn có thể xem tổng hợp về số ngày tăng ca nghỉ bù, tăng ca tính lương, tăng ca thường, tổng ngày tăng ca và tổng giờ tăng ca trong tháng.'
      }
    ]
  } else if (activeTab.value === 'detail') {
    return [
      {
        target: '[data-tour="title"]',
        message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Bảng công chi tiết" - nơi bạn có thể xem chi tiết công của từng ngày làm việc.'
      },
      {
        target: '[data-tour="tabs"]',
        message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Bảng công chi tiết".'
      },
      {
        target: '[data-tour="month-filter-detail"]',
        message: 'Đây là bộ lọc tháng. Bạn có thể chuyển đổi giữa các tháng để xem dữ liệu công chi tiết của các tháng khác nhau.'
      },
      {
        target: '[data-tour="export-buttons-detail"]',
        message: 'Đây là các nút xuất dữ liệu. Bạn có thể xuất Excel hoặc in báo cáo công chi tiết.'
      },
      {
        target: '[data-tour="detail-table"]',
        message: 'Đây là bảng công chi tiết. Bạn có thể xem thông tin về STT, mã nhân viên, tên nhân viên, ca làm việc, ngày làm, giờ vào, giờ ra, loại công, số giờ, số ngày, đi trễ và về sớm.'
      },
      {
        target: '[data-tour="pagination-detail"]',
        message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều bản ghi hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Bảng công chi tiết"!'
      }
    ]
  } else if (activeTab.value === 'attendance') {
    return [
      {
        target: '[data-tour="title"]',
        message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Dữ liệu chấm công" - nơi bạn có thể xem tất cả dữ liệu chấm công của nhân viên.'
      },
      {
        target: '[data-tour="tabs"]',
        message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Dữ liệu chấm công".'
      },
      {
        target: '[data-tour="month-filter-attendance"]',
        message: 'Đây là bộ lọc tháng. Bạn có thể chuyển đổi giữa các tháng để xem dữ liệu chấm công của các tháng khác nhau.'
      },
      {
        target: '[data-tour="export-buttons-attendance"]',
        message: 'Đây là các nút xuất dữ liệu. Bạn có thể xuất Excel hoặc in báo cáo dữ liệu chấm công.'
      },
      {
        target: '[data-tour="attendance-table"]',
        message: 'Đây là bảng dữ liệu chấm công. Bạn có thể xem thông tin về STT, ảnh chấm công, mã nhân viên, tên nhân viên, ca làm việc, ngày làm, giờ quét, máy chấm công, vị trí và loại công. Bạn có thể click vào ảnh để xem chi tiết.'
      },
      {
        target: '[data-tour="image-modal"]',
        message: 'Đây là modal xem chi tiết ảnh chấm công. Bạn có thể xem ảnh chấm công vào hoặc ra với kích thước lớn hơn.',
        action: {
          type: 'function',
          func: async () => {
            // Tìm và click vào một ảnh chấm công
            const firstImage = document.querySelector('[data-tour="attendance-image"]')
            if (firstImage) {
              firstImage.click()
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }
        }
      },
      {
        target: '[data-tour="pagination-attendance"]',
        message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều bản ghi hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Dữ liệu chấm công"!',
        action: {
          type: 'function',
          func: async () => {
            // Đóng modal nếu đang mở
            if (showImageModal.value) {
              showImageModal.value = false
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }
        }
      }
    ]
  }
  return []
})
</script>

<template>
  <div class="container-fluid py-4" data-tour="title">
    <!-- Thay thế TabBar hiện tại bằng đoạn sau -->
    <div class="attendance-tabs-bar" data-tour="tabs">
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
    <template v-if="activeTab === 'summary'">
          <!-- Header Section -->
          <div class="summary-header mb-4">
            <div class="row g-3 align-items-center">
              <!-- Cột trái: Bộ lọc tháng -->
              <div class="col-md-6">
                <div class="time-filter-compact" data-tour="month-filter">
                  <div class="d-flex align-items-center gap-3">
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToPreviousMonth"
                      title="Tháng trước"
                    >
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="text-center px-3">
                      <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                    </div>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToNextMonth"
                      title="Tháng sau"
                    >
                      <i class="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToCurrentMonth"
                      title="Tháng hiện tại"
                    >
                      <i class="fas fa-calendar-day"></i>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Cột phải: Chú thích màu sắc -->
              <div class="col-md-6">
                <div class="legend-compact d-flex flex-nowrap gap-2 align-items-center justify-content-end">
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Đi làm</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#007bff"></span>
                    <span class="legend-text">Nghỉ phép</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#ffc107"></span>
                    <span class="legend-text">Chưa đủ giờ công</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#dc3545"></span>
                    <span class="legend-text">Quên checkin/checkout</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#6c757d"></span>
                    <span class="legend-text">Vắng không phép</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="attendance-summary-table-enhanced" data-tour="summary-table">
            <DataTable :columns="mainSummaryColumns" :data="paginatedMainSummaryData">
              <template #id="{ item }">
                <div class="emp-id-enhanced">
                  <span class="emp-id-text fw-bold text-primary">{{ item.id }}</span>
                </div>
              </template>
              <template #name="{ item }">
                <div class="emp-name-row">
                  <span class="emp-name-text fw-bold">{{ item.name || 'N/A' }}</span>
                </div>
              </template>
              <template v-for="(day, idx) in dayHeaders" v-slot:[`day_${idx}`]="{ item }">
                <div class="schedule-cell-enhanced" :class="getCellClass(item._idx, idx)"
                  :title="getCellTitle(item._idx, idx)" @click.stop="openDayModal(item, idx)" data-tour="day-cell">
                  <span class="cell-time">{{ item[`day_${idx}`]?.time }}</span>
                </div>
              </template>
              <template #totalStandardDays="{ item }">
                <span class="summary-value">{{ item.totalStandardDays || 0 }}</span>
              </template>
              <template #totalWorkDays="{ item }">
                <span class="summary-value">{{ item.totalWorkDays || 0 }}</span>
              </template>
              <template #totalPresent="{ item }">
                <span class="summary-value">{{ item.totalPresent || 0 }}</span>
              </template>
              <template #totalPaidLeave="{ item }">
                <span class="summary-value">{{ item.totalPaidLeave || 0 }}</span>
              </template>
              <template #totalAbsentWithoutLeave="{ item }">
                <span class="summary-value text-warning">{{ item.totalAbsentWithoutLeave || 0 }}</span>
              </template>
              <template #totalLateMinutes="{ item }">
                <span class="summary-value text-danger">{{ item.totalLateMinutes || 0 }}</span>
              </template>
              <template #totalEarlyMinutes="{ item }">
                <span class="summary-value text-danger">{{ item.totalEarlyMinutes || 0 }}</span>
              </template>
              <template #totalForgotCheckInOut="{ item }">
                <span class="summary-value text-danger">{{ item.totalForgotCheckInOut || 0 }}</span>
              </template>
            </DataTable>
          </div>

          <!-- Pagination for main summary table -->
          <div class="d-flex justify-content-between align-items-center mt-4" v-if="totalPages > 1" data-tour="pagination-summary">
            <div class="text-muted">
              Hiển thị {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize,
              mainSummaryData.length) }} trong tổng số {{ mainSummaryData.length }} nhân viên
            </div>
            <Pagination :totalItems="mainSummaryData.length" :itemsPerPage="pageSize"
              :currentPage="currentPage" @update:currentPage="currentPage = $event" />
          </div>

          <ModalDialog :show="showEmployeeModal" title="Chi tiết tổng hợp công nhân viên" size="xl" scrollable
            @update:show="showEmployeeModal = $event" data-tour="employee-modal">
              <div class="modal-emp-header-enhanced">
                <div class="modal-emp-avatar-wrapper">
                  <div class="modal-emp-avatar-enhanced">
                    <img v-if="selectedEmployee?.avatar" :src="selectedEmployee.avatar" alt="avatar" />
                    <div v-else class="avatar-placeholder-enhanced">
                      <i class="fas fa-user"></i>
                    </div>
                  </div>
                </div>
                <div class="modal-emp-info-enhanced">
                  <div class="emp-name-enhanced">
                    <i class="fas fa-user-tie me-2 text-primary"></i>
                    {{ selectedEmployee?.name || 'N/A' }}
                  </div>
                  <div class="emp-details-row">
                    <div class="emp-detail-item">
                      <span class="detail-label">Mã NV:</span>
                      <span class="detail-value">{{ selectedEmployee?.id || 'N/A' }}</span>
                    </div>
                    <div class="emp-detail-item">
                      <span class="detail-label">Chức vụ:</span>
                      <span class="detail-value">{{ selectedEmployee?.position || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="selectedEmployee && selectedEmployee.summary" class="summary-dashboard-enhanced mt-4">
                <div class="row g-3">
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced primary-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-calendar-check"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalWorkDays }}</div>
                        <div class="stat-label">Tổng ngày công</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced success-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-user-check"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalPresent }}</div>
                        <div class="stat-label">Tổng đi làm</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced info-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-calendar-day"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalPaidLeave }}</div>
                        <div class="stat-label">Nghỉ có lương</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced warning-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-exclamation-triangle"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalAbsentWithoutLeave }}</div>
                        <div class="stat-label">Vắng không phép</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row g-3 mt-3">
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced late-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-clock"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalLateMinutes }}</div>
                        <div class="stat-label">Số phút đi trễ</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced early-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-hourglass-half"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalEarlyMinutes }}</div>
                        <div class="stat-label">Số phút về sớm</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced danger-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-sign-in-alt"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalForgotCheckIn }}</div>
                        <div class="stat-label">Số ngày quên check-in</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-3 col-md-6">
                    <div class="stat-card-enhanced danger-gradient">
                      <div class="stat-icon-wrapper">
                        <i class="fas fa-sign-out-alt"></i>
                      </div>
                      <div class="stat-content">
                        <div class="stat-value">{{ selectedEmployee.summary.totalForgotCheckOut }}</div>
                        <div class="stat-label">Số ngày quên check-out</div>
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

        </template>
        
        <template v-else-if="activeTab === 'personal'">
          <!-- Personal Attendance Tab -->
          <!-- Header Section -->
          <div class="personal-header mb-4">
            <div class="row g-3 align-items-center">
              <div class="col-md-6">
                <div class="time-filter-compact" data-tour="month-filter-personal">
                  <div class="d-flex align-items-center gap-3">
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToPreviousMonth"
                      title="Tháng trước"
                    >
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="text-center px-3">
                      <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                    </div>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToNextMonth"
                      title="Tháng sau"
                    >
                      <i class="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToCurrentMonth"
                      title="Tháng hiện tại"
                    >
                      <i class="fas fa-calendar-day"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="legend-compact d-flex flex-nowrap gap-2 align-items-center justify-content-end">
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Đi làm</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#007bff"></span>
                    <span class="legend-text">Nghỉ phép</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#ffc107"></span>
                    <span class="legend-text">Chưa đủ giờ công</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#dc3545"></span>
                    <span class="legend-text">Quên checkin/checkout</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#6c757d"></span>
                    <span class="legend-text">Vắng không phép</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Personal Attendance Calendar -->
          <div class="personal-attendance-calendar" data-tour="personal-calendar">
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
                     :title="getPersonalCellTitle(day)"
                     @click.stop="openPersonalDayModal(day)">
                  <div class="day-number">{{ day.day }}</div>
                  <div class="day-time">{{ day.attendance?.time || '' }}</div>
                </div>
                <div v-else class="calendar-day-empty"></div>
              </div>
            </div>
          </div>

          <!-- Summary Statistics -->
          <div v-if="personalAttendanceData.length > 0" class="row mt-4" data-tour="personal-stats">
            <div class="col-md-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center">
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
                        <div class="stat-number">{{ personalStatistics.totalWorkDays }}</div>
                        <div class="stat-label">Ngày đi làm</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-times"></i>
                        </div>
                        <div class="stat-number">{{ personalStatistics.totalLeave }}</div>
                        <div class="stat-label">Nghỉ phép</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                          <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-number">{{ personalStatistics.totalInsufficient }}</div>
                        <div class="stat-label">Chưa đủ giờ</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                          <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-number">{{ personalStatistics.totalIncomplete }}</div>
                        <div class="stat-label">Quên chấm công</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-secondary">
                        <div class="stat-icon">
                          <i class="fas fa-user-times"></i>
                        </div>
                        <div class="stat-number">{{ personalStatistics.totalAbsentWithoutLeave }}</div>
                        <div class="stat-label">Vắng không phép</div>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <div class="stat-card stat-card-primary">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-number">{{ personalStatistics.totalDays }}</div>
                        <div class="stat-label">Tổng ngày</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else-if="activeTab === 'personalOvertime'">
          <!-- Personal Overtime Tab -->
          <!-- Header Section -->
          <div class="personal-overtime-header mb-4">
            <div class="row g-3 align-items-center">
              <div class="col-md-6">
                <div class="time-filter-compact" data-tour="month-filter-personal-ot">
                  <div class="d-flex align-items-center gap-3">
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToPreviousMonth"
                      title="Tháng trước"
                    >
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="text-center px-3">
                      <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                    </div>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToNextMonth"
                      title="Tháng sau"
                    >
                      <i class="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToCurrentMonth"
                      title="Tháng hiện tại"
                    >
                      <i class="fas fa-calendar-day"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="legend-compact d-flex flex-nowrap gap-2 align-items-center justify-content-end">
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Tăng ca nghỉ bù</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#9c27b0"></span>
                    <span class="legend-text">Tăng ca tính lương</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Personal Overtime Calendar -->
          <div class="personal-attendance-calendar" data-tour="personal-ot-calendar">
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
                     @click.stop="openPersonalOvertimeModal(day)">
                  <div class="day-number">{{ day.day }}</div>
                  <div class="day-time">{{ day.overtime?.time || '' }}</div>
                </div>
                <div v-else class="calendar-day-empty"></div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div v-if="personalOvertimeData.length > 0" class="row mt-4" data-tour="personal-ot-stats">
            <div class="col-md-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-gradient-purple text-white d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">
                    <i class="fas fa-chart-bar me-2"></i>
                    Thống kê tăng ca tháng {{ selectedMonth }}/{{ selectedYear }}
                  </h6>
                </div>
                <div class="card-body">
                  <div class="row text-center g-3">
                    <div class="col-md-3">
                      <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                          <i class="fas fa-hourglass-end"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeStatistics.totalOvertimeHours.toFixed(1) }}h</div>
                        <div class="stat-label">Tổng giờ tăng ca</div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="stat-card stat-card-primary">
                        <div class="stat-icon">
                          <i class="fas fa-hourglass-half"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeStatistics.totalOvertimeHoursWithCoeff.toFixed(1) }}h</div>
                        <div class="stat-label">Tổng giờ tăng ca có hệ số</div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeStatistics.totalOvertimeDays.toFixed(2) }}</div>
                        <div class="stat-label">Tổng ngày tăng ca</div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="stat-card stat-card-secondary">
                        <div class="stat-icon">
                          <i class="fas fa-calendar-day"></i>
                        </div>
                        <div class="stat-number">{{ personalOvertimeStatistics.totalOvertimeDaysWithCoeff.toFixed(2) }}</div>
                        <div class="stat-label">Tổng ngày tăng ca có hệ số</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else-if="activeTab === 'overtime'">
          <!-- Header Section -->
          <div class="overtime-header mb-4">
            <div class="row g-3 align-items-center">
              <!-- Cột trái: Bộ lọc tháng -->
              <div class="col-md-6">
                <div class="time-filter-compact" data-tour="month-filter-overtime">
                  <div class="d-flex align-items-center gap-3">
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToPreviousMonth"
                      title="Tháng trước"
                    >
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="text-center px-3">
                      <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                    </div>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToNextMonth"
                      title="Tháng sau"
                    >
                      <i class="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToCurrentMonth"
                      title="Tháng hiện tại"
                    >
                      <i class="fas fa-calendar-day"></i>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Cột phải: Chú thích màu sắc -->
              <div class="col-md-6">
                <div class="legend-compact d-flex flex-nowrap gap-2 align-items-center justify-content-end">
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#2196f3"></span>
                    <span class="legend-text">Tăng ca nghỉ bù</span>
                  </div>
                  <div class="legend-item-compact">
                    <span class="legend-color" style="background:#28a745"></span>
                    <span class="legend-text">Tăng ca tính lương</span>
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
              <div class="attendance-summary-table-enhanced" data-tour="overtime-table">
                <DataTable :columns="overtimeColumns" :data="paginatedOvertimeData">
                  <template #id="{ item }">
                    <div class="emp-id-enhanced">
                      <span class="emp-id-text fw-bold text-primary">{{ item.id }}</span>
                    </div>
                  </template>
                  <template #name="{ item }">
                    <div class="emp-name-row">
                      <span class="emp-name-text fw-bold">{{ item.name || 'N/A' }}</span>
                    </div>
                  </template>
                  <template v-for="(day, idx) in overtimeHeaders" v-slot:[`day_${idx}`]="{ item }">
                    <div class="schedule-cell-enhanced" :class="getOvertimeCellClass(item[`day_${idx}`]?.type)"
                      @click.stop="openOvertimeModal(item, idx)" style="cursor:pointer;">
                      <span v-if="item[`day_${idx}`]?.hours > 0">{{ item[`day_${idx}`]?.hours }}</span>
                    </div>
                  </template>
                </DataTable>
              </div>

              <!-- Pagination for overtime table -->
              <div class="d-flex justify-content-between align-items-center mt-3" v-if="overtimeTotalPages > 1" data-tour="pagination-overtime">
                <div class="pagination-info">
                  Hiển thị {{ (overtimeCurrentPage - 1) * overtimePageSize + 1 }} - {{ Math.min(overtimeCurrentPage * overtimePageSize,
                  overtimeData.length) }}
                  trong tổng số {{ overtimeData.length }} nhân viên
                </div>
                <nav aria-label="Overtime pagination">
                  <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: overtimeCurrentPage === 1 }">
                      <button class="page-link" @click="overtimeCurrentPage = 1" :disabled="overtimeCurrentPage === 1">
                        <i class="fas fa-angle-double-left"></i>
                      </button>
                    </li>
                    <li class="page-item" :class="{ disabled: overtimeCurrentPage === 1 }">
                      <button class="page-link" @click="overtimeCurrentPage--" :disabled="overtimeCurrentPage === 1">
                        <i class="fas fa-angle-left"></i>
                      </button>
                    </li>

                    <!-- Page numbers -->
                    <li v-for="page in getOvertimeVisiblePages()" :key="page" class="page-item"
                      :class="{ active: page === overtimeCurrentPage }">
                      <button class="page-link" @click="overtimeCurrentPage = page">{{ page }}</button>
                    </li>

                    <li class="page-item" :class="{ disabled: overtimeCurrentPage === overtimeTotalPages }">
                      <button class="page-link" @click="overtimeCurrentPage++" :disabled="overtimeCurrentPage === overtimeTotalPages">
                        <i class="fas fa-angle-right"></i>
                      </button>
                    </li>
                    <li class="page-item" :class="{ disabled: overtimeCurrentPage === overtimeTotalPages }">
                      <button class="page-link" @click="overtimeCurrentPage = overtimeTotalPages" :disabled="overtimeCurrentPage === overtimeTotalPages">
                        <i class="fas fa-angle-double-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
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
        </template>
        
        <template v-else-if="activeTab === 'detail'">
          <!-- Header Section -->
          <div class="detail-header mb-4">
            <div class="row g-3 align-items-center">
              <div class="col-md-6">
                <div class="time-filter-compact" data-tour="month-filter-detail">
                  <div class="d-flex align-items-center gap-3">
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToPreviousMonth"
                      title="Tháng trước"
                    >
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="text-center px-3">
                      <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                    </div>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToNextMonth"
                      title="Tháng sau"
                    >
                      <i class="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToCurrentMonth"
                      title="Tháng hiện tại"
                    >
                      <i class="fas fa-calendar-day"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="header-actions d-flex gap-2 justify-content-end">
                  <div class="d-flex gap-2" data-tour="export-buttons-detail">
                    <button class="btn btn-outline-light btn-sm" @click="exportDetailToExcel">
                      <i class="fas fa-download me-1"></i>
                      Xuất Excel
                    </button>
                    <button class="btn btn-outline-light btn-sm" @click="printDetailReport">
                      <i class="fas fa-print me-1"></i>
                      In báo cáo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
          <div v-else class="attendance-summary-table" data-tour="detail-table">
            <DataTable :columns="detailColumns" :data="paginatedDetailData">
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
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-bold">{{ item.hours }}h</span>
                  <i 
                    v-if="item.hours === 0 || item.hours === '0' || parseFloat(item.hours) === 0"
                    class="fas fa-exclamation-triangle warning-icon-shake text-warning"
                    @click.stop="showZeroHoursWarning(item)"
                    title="Cảnh báo: Số giờ công bằng 0"
                    style="cursor: pointer; font-size: 1.2rem;"
                  ></i>
                </div>
              </template>
              <template #days="{ item }">
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-bold">{{ item.days }}</span>
                  <i 
                    v-if="item.days === 0 || item.days === '0' || parseFloat(item.days) === 0"
                    class="fas fa-exclamation-triangle warning-icon-shake text-warning"
                    @click.stop="showZeroDaysWarning(item)"
                    title="Cảnh báo: Số ngày công bằng 0"
                    style="cursor: pointer; font-size: 1.2rem;"
                  ></i>
                </div>
              </template>
            </DataTable>
          </div>
            <!-- Phân trang -->
            <div class="d-flex justify-content-between align-items-center mt-4" data-tour="pagination-detail">
              <div class="text-muted">
                Hiển thị {{ paginatedDetailData.length }} trên {{ processedDetailData.length }} bảng công chi tiết
              </div>
              <Pagination :totalItems="processedDetailData.length" :itemsPerPage="detailItemsPerPage"
                :currentPage="detailCurrentPage" @update:currentPage="detailCurrentPage = $event" />
            </div>
        </template>
        
        <template v-else-if="activeTab === 'attendance'">
          <!-- Header Section -->
          <div class="attendance-header mb-4">
            <div class="row g-3 align-items-center">
              <div class="col-md-6">
                <div class="time-filter-compact" data-tour="month-filter-attendance">
                  <div class="d-flex align-items-center gap-3">
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToPreviousMonth"
                      title="Tháng trước"
                    >
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="text-center px-3">
                      <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                    </div>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToNextMonth"
                      title="Tháng sau"
                    >
                      <i class="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      class="btn btn-outline-light btn-sm" 
                      @click="goToCurrentMonth"
                      title="Tháng hiện tại"
                    >
                      <i class="fas fa-calendar-day"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="header-actions d-flex gap-2 justify-content-end">
                  <div class="d-flex gap-2" data-tour="export-buttons-attendance">
                    <button class="btn btn-outline-light btn-sm" @click="exportAttendanceToExcel">
                      <i class="fas fa-download me-1"></i>
                      Xuất Excel
                    </button>
                    <button class="btn btn-outline-light btn-sm" @click="printAttendanceReport">
                      <i class="fas fa-print me-1"></i>
                      In báo cáo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
          <div v-else class="attendance-summary-table" data-tour="attendance-table">
            <!-- Closing Details -->
            <div v-if="isAnySheetClosed" class="closing-details mb-3">
              <div class="alert alert-info">
                <div class="d-flex align-items-center">
                  <i class="fas fa-info-circle me-2"></i>
                  <div>
                    <strong>Trạng thái chốt:</strong>
                    <span v-if="closingStatus.isTimeSheetClosed">
                      Bảng công đã chốt: {{ closingStatus.timeSheetClosedAt }}
                      <span v-if="closingStatus.timeSheetClosedBy"> bởi {{ closingStatus.timeSheetClosedBy }}</span>
                    </span>
                    <span v-else>Bảng công chưa chốt</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DataTable :columns="attendanceDataColumns" :data="paginatedAttendanceData">
              <template #machine="{ item }">
                <span>{{ item.machine || '-' }}</span>
              </template>
              <template #location="{ item }">
                <div class="d-flex align-items-center gap-2">
                  <span>{{ item.location || '-' }}</span>
                  <button 
                    v-if="item.locationLat && item.locationLng" 
                    class="btn btn-sm btn-link p-0 text-primary"
                    @click="openLocationMap(item.locationLat, item.locationLng, item.location)"
                    title="Xem vị trí trên bản đồ"
                  >
                    <i class="fas fa-map-marker-alt"></i>
                  </button>
                </div>
              </template>
              <template #scanTime="{ item }">
                <span :class="{
                  'scan-time scan-time-in': item.type === 'Vào',
                  'scan-time scan-time-out': item.type === 'Ra'
                }">
                  {{ item.scanTime || '-' }}
                </span>
              </template>
              <template #type="{ item }">
                <div class="d-flex align-items-center gap-2">
                  <span :class="{
                    'type-badge type-badge-in': item.type === 'Vào',
                    'type-badge type-badge-out': item.type === 'Ra'
                  }">
                    <i :class="item.type === 'Vào' ? 'fas fa-sign-in-alt' : 'fas fa-sign-out-alt'"></i>
                    <span class="ms-2">{{ item.type }}</span>
                  </span>
                </div>
              </template>
            </DataTable>
          </div>
            <!-- Phân trang -->
            <div class="d-flex justify-content-between align-items-center mt-4" data-tour="pagination-attendance">
              <div class="text-muted">
                Hiển thị {{ paginatedAttendanceData.length }} trên {{ attendanceData.length }} dữ liệu chấm công
              </div>
              <Pagination :totalItems="attendanceData.length" :itemsPerPage="attendanceItemsPerPage"
                :currentPage="attendanceCurrentPage" @update:currentPage="attendanceCurrentPage = $event" />
            </div>
        </template>

  </div>

  <!-- AI Chatbot Button -->
  <AIChatbotButton 
    :message="aiChatbotMessage || 'Xin chào! Tôi có thể giúp gì cho bạn?'"
    @guide-click="showAIChatbot = false"
  />

  <!-- Modal Bản Đồ Vị Trí -->
  <ModalDialog 
    :show="showLocationMapModal" 
    @update:show="showLocationMapModal = $event"
    title="Vị Trí Chấm Công" 
    size="xl"
  >
    <div v-if="mapLocation.lat && mapLocation.lng" class="location-map-container" style="height: 500px; position: relative;">
      <div id="location-map" style="width: 100%; height: 100%;"></div>
    </div>
    <div v-else class="text-center py-4">
      <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
      <p class="text-muted">Không có thông tin tọa độ để hiển thị bản đồ</p>
    </div>
  </ModalDialog>

  <!-- Modal Zoom Ảnh -->
  <ModalDialog v-if="selectedImage" :show="showImageModal" @update:show="showImageModal = $event"
    title="Xem Chi Tiết Ảnh Chấm Công" size="xl" data-tour="image-modal">
    <div class="image-zoom-container">
      <img :src="selectedImage.url" :alt="'Ảnh chấm công ' + selectedImage.type" class="img-zoom" />
      <div class="image-info mt-3">
        <div class="text-muted small">
          <i class="fas fa-camera me-1"></i>
          Ảnh {{ selectedImage.type === 'checkin' ? 'chấm công vào' : 'chấm công ra' }}
        </div>
      </div>
    </div>
  </ModalDialog>

  <!-- Modal Chi Tiết Chấm Công Từng Ngày -->
  <ModalDialog :show="showDayModal" title="Chi tiết chấm công từng ngày" size="xl" scrollable
    @update:show="showDayModal = $event" data-tour="day-modal">
      <div class="modal-emp-header-enhanced">
        <div class="modal-emp-avatar-wrapper">
          <div class="modal-emp-avatar-enhanced">
            <img v-if="selectedEmployee?.avatar" :src="selectedEmployee.avatar" alt="avatar" />
            <div v-else class="avatar-placeholder-enhanced">
              <i class="fas fa-user"></i>
            </div>
          </div>
        </div>
        <div class="modal-emp-info-enhanced">
          <div class="emp-name-enhanced">
            <i class="fas fa-user-tie me-2 text-primary"></i>
            {{ selectedEmployee?.name || 'N/A' }}
          </div>
          <div class="emp-details-row">
            <div class="emp-detail-item">
              <i class="fas fa-id-card me-1 text-muted"></i>
              <span class="detail-label">Mã NV:</span>
              <span class="detail-value">{{ selectedEmployee?.id || 'N/A' }}</span>
            </div>
            <div class="emp-detail-item">
              <i class="fas fa-briefcase me-1 text-muted"></i>
              <span class="detail-label">Chức vụ:</span>
              <span class="detail-value">{{ selectedEmployee?.position || 'Chưa có' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-emp-date-enhanced">
          <div class="date-badge">
            <i class="fas fa-calendar-day me-2"></i>
            <div>
              <div class="date-label">Ngày đi làm</div>
              <div class="date-value">{{ selectedDateIdx !== null ? dayHeaders[selectedDateIdx] : '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dayModalLoading" class="loading-state-enhanced">
        <div class="loading-spinner-wrapper">
          <div class="spinner-enhanced"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">Đang tải dữ liệu chi tiết...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="dayModalError" class="error-state-enhanced">
        <div class="error-icon-wrapper">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="error-content">
          <h5 class="error-title">Có lỗi xảy ra</h5>
          <p class="error-message">{{ dayModalError }}</p>
          <button class="btn-retry" @click="openDayModal(selectedEmployee, selectedDateIdx)" :disabled="dayModalLoading">
            <i class="fas fa-redo me-2"></i>
            Thử lại
          </button>
        </div>
      </div>

      <!-- Data Content -->
      <div v-else>
        <div class="modal-section-enhanced">
          <div class="section-title-enhanced">
            <div class="section-icon-wrapper">
              <i class="fas fa-fingerprint"></i>
            </div>
            <span>Dữ liệu chấm công</span>
          </div>
          <div v-if="filteredAttendanceHistory.length > 0" data-tour="attendance-history">
            <DataTable :columns="attendanceColumnsNoActions" :data="filteredAttendanceHistory">
              <template #shiftName="{ item }">
                <!-- Chỉ cho phép đổi ca nếu không phải nghỉ phép, có attendanceId, và không phải tab bảng công cá nhân -->
                <!-- Kiểm tra nếu selectedEmployee là currentUser thì không cho sửa ca làm -->
                <select 
                  v-if="item.attendanceId && !item.shiftName?.includes('Nghỉ phép') && !item.shiftName?.includes('Phép năm') && !item.shiftName?.includes('Nghỉ bù') && selectedEmployee?.id !== currentUser?.id"
                  class="form-select-enhanced form-select-sm"
                  :value="item.workShiftID || ''"
                  @change="handleShiftChange(item, $event.target.value)"
                  :disabled="updatingShifts[item.attendanceId]"
                  style="min-width: 150px;"
                >
                  <option value="">-- Chọn ca --</option>
                  <option 
                    v-for="shift in getAvailableShiftsForItem(item)" 
                    :key="shift.id" 
                    :value="shift.id"
                  >
                    {{ shift.shiftName }}
                  </option>
                </select>
                <span v-else>{{ item.shiftName }}</span>
                <span v-if="updatingShifts[item.attendanceId]" class="ms-2">
                  <i class="fas fa-spinner fa-spin text-primary"></i>
                </span>
              </template>
              <template #refCode="{ item }">
                <!-- Chỉ hiển thị mã phiếu tham chiếu cho nghỉ phép -->
                <span 
                  v-if="item.refCode && (item.location === 'Nghỉ phép' || item.shiftName?.includes('Nghỉ phép') || item.shiftName?.includes('Phép năm') || item.shiftName?.includes('Nghỉ bù'))" 
                  class="voucher-code-link-enhanced"
                  @click="openLeaveFormModal(item.refCode)"
                  :title="'Click để xem chi tiết phiếu nghỉ phép'"
                  data-tour="voucher-code-link"
                >
                  <i class="fas fa-file-alt me-2"></i>
                  {{ item.refCode }}
                </span>
                <!-- Dữ liệu chấm công không có mã phiếu tham chiếu, hiển thị dấu - -->
                <span v-else class="text-muted">-</span>
              </template>
            </DataTable>
          </div>
          <div v-else class="empty-state-enhanced">
            <div class="empty-icon-wrapper">
              <i class="fas fa-inbox"></i>
            </div>
            <p class="empty-text">Không có dữ liệu chấm công cho ngày này</p>
          </div>
        </div>
        <div class="modal-section-enhanced">
          <div class="section-title-enhanced">
            <div class="section-icon-wrapper">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <span>Lịch làm việc</span>
          </div>
          <div v-if="filteredWorkHistory.length > 0" data-tour="work-history">
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
          <div v-else class="empty-state-enhanced">
            <div class="empty-icon-wrapper">
              <i class="fas fa-calendar-times"></i>
            </div>
            <p class="empty-text">Không có dữ liệu lịch làm việc cho ngày này</p>
          </div>
        </div>
      </div>
  </ModalDialog>

  <!-- ModalDialog cho LeaveForm -->
  <ModalDialog :show="showLeaveFormModal" title="Chi tiết phiếu nghỉ phép" size="lg" scrollable
    :customZIndex="1070"
    @update:show="showLeaveFormModal = $event" data-tour="leave-form-modal">
      <LeaveForm 
        v-if="selectedLeaveRequest"
        mode="detail"
        :leave="selectedLeaveRequest"
        :employees="allEmployees"
        :leaveTypes="leaveTypes"
        :workShifts="workshifts"
        :currentUser="currentUser"
        @close="closeLeaveFormModal"
        @submit="closeLeaveFormModal"
        @submit-for-approval="closeLeaveFormModal"
      />
  </ModalDialog>

  <!-- Modal Chi Tiết Tăng Ca -->
  <ModalDialog :show="showOvertimeModal" title="Chi tiết tăng ca" size="lg" scrollable
    :customZIndex="1065"
    @update:show="showOvertimeModal = $event" data-tour="overtime-modal">
      <div class="modal-emp-header-enhanced">
        <div class="modal-emp-avatar-wrapper">
          <div class="modal-emp-avatar-enhanced">
            <img v-if="selectedOvertimeEmployee?.avatar" :src="selectedOvertimeEmployee.avatar" alt="avatar" />
            <div v-else class="avatar-placeholder-enhanced">
              <i class="fas fa-user"></i>
            </div>
          </div>
        </div>
        <div class="modal-emp-info-enhanced">
          <div class="emp-name-enhanced">
            <i class="fas fa-user-tie me-2 text-primary"></i>
            {{ selectedOvertimeEmployee?.name || 'N/A' }}
          </div>
          <div class="emp-details-row">
            <div class="emp-detail-item">
              <i class="fas fa-id-card me-1 text-muted"></i>
              <span class="detail-label">Mã NV:</span>
              <span class="detail-value">{{ selectedOvertimeEmployee?.id || 'N/A' }}</span>
            </div>
            <div class="emp-detail-item">
              <i class="fas fa-briefcase me-1 text-muted"></i>
              <span class="detail-label">Chức vụ:</span>
              <span class="detail-value">{{ selectedOvertimeEmployee?.position || 'Chưa có' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-emp-date-enhanced" v-if="selectedOvertimeDayIdx !== null">
          <div class="date-badge">
            <i class="fas fa-calendar-day me-2"></i>
            <div>
              <div class="date-label">Ngày tăng ca</div>
              <div class="date-value">{{ overtimeHeaders[selectedOvertimeDayIdx] }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Specific day details -->
      <div v-if="selectedOvertimeDayIdx !== null && selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.hours > 0">
        <div class="modal-section-enhanced">
          <div class="section-title-enhanced">
            <div class="section-icon-wrapper">
              <i class="fas fa-clock"></i>
            </div>
            <span>Chi tiết tăng ca ngày</span>
          </div>
          <div class="row g-2">
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-overtime">
                <div class="stat-icon-overtime">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content-overtime">
                  <div class="stat-value-overtime">{{ getDayOvertimeHours(selectedOvertimeEmployee, selectedOvertimeDayIdx) }}</div>
                  <div class="stat-label-overtime">Số giờ tăng ca</div>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-overtime">
                <div class="stat-icon-overtime">
                  <i class="fas fa-calendar-day"></i>
                </div>
                <div class="stat-content-overtime">
                  <div class="stat-value-overtime">{{ getDayOvertimeDays(selectedOvertimeEmployee, selectedOvertimeDayIdx) }}</div>
                  <div class="stat-label-overtime">Số ngày tăng ca</div>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-overtime">
                <div class="stat-icon-overtime">
                  <i class="fas fa-calculator"></i>
                </div>
                <div class="stat-content-overtime">
                  <div class="stat-value-overtime">{{ getDayOvertimeHoursWithCoefficient(selectedOvertimeEmployee, selectedOvertimeDayIdx) }}</div>
                  <div class="stat-label-overtime">Giờ có hệ số</div>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-overtime">
                <div class="stat-icon-overtime">
                  <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-content-overtime">
                  <div class="stat-value-overtime">{{ getDayOvertimeDaysWithCoefficient(selectedOvertimeEmployee, selectedOvertimeDayIdx) }}</div>
                  <div class="stat-label-overtime">Ngày có hệ số</div>
                </div>
              </div>
            </div>
            <div class="col-12" v-if="selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.request">
              <div class="stat-card-overtime stat-card-overtime-full">
                <div class="stat-icon-overtime">
                  <i class="fas fa-percent"></i>
                </div>
                <div class="stat-content-overtime">
                  <div class="stat-value-overtime">{{ selectedOvertimeEmployee[`day_${selectedOvertimeDayIdx}`]?.request?.coefficient || 'N/A' }}</div>
                  <div class="stat-label-overtime">Hệ số</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No overtime for this day -->
      <div v-else-if="selectedOvertimeDayIdx !== null" class="modal-section-enhanced">
        <div class="empty-state-enhanced">
          <div class="empty-icon-wrapper">
            <i class="fas fa-calendar-times"></i>
          </div>
          <p class="empty-text">Không có tăng ca trong ngày này</p>
        </div>
      </div>

      <!-- Monthly summary -->
      <div v-else>
        <div class="modal-section-enhanced">
          <div class="section-title-enhanced">
            <div class="section-icon-wrapper">
              <i class="fas fa-chart-bar"></i>
            </div>
            <span>Tổng hợp tăng ca tháng</span>
          </div>
          <div class="row g-3">
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-enhanced primary-gradient">
                <div class="stat-icon-wrapper">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ selectedOvertimeEmployee?.totalOvertimeHours ?? 0 }}</div>
                  <div class="stat-label">Tổng giờ tăng ca</div>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-enhanced success-gradient">
                <div class="stat-icon-wrapper">
                  <i class="fas fa-calendar-day"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ selectedOvertimeEmployee?.totalOvertimeDays ?? 0 }}</div>
                  <div class="stat-label">Số ngày tăng ca</div>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-enhanced info-gradient">
                <div class="stat-icon-wrapper">
                  <i class="fas fa-calculator"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ selectedOvertimeEmployee?.totalOvertimeHoursWithCoeff ?? 0 }}</div>
                  <div class="stat-label">Tổng giờ có hệ số</div>
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card-enhanced warning-gradient">
                <div class="stat-icon-wrapper">
                  <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ selectedOvertimeEmployee?.totalOvertimeDaysWithCoeff ?? 0 }}</div>
                  <div class="stat-label">Tổng ngày có hệ số</div>
                </div>
              </div>
            </div>
          </div>
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
</template>


<style scoped>
/* Keyframes animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Màu cho ô tăng ca */
.schedule-cell-enhanced.cell-overtime-compensatory {
  background: linear-gradient(135deg, #cce5ff, #b3d9ff);
  border-color: #2196f3;
  color: #0d47a1;
  font-weight: 600;
}

.schedule-cell-enhanced.cell-overtime-paid {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #28a745;
  color: #155724;
  font-weight: 600;
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

.schedule-cell-modern.cell-absent-without-leave {
  background: #e9ecef;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.schedule-cell-modern:hover {
  box-shadow: 0 0 0 2px #007bff33;
  cursor: pointer;
}

/* Enhanced Summary Table */
.attendance-summary-table-enhanced {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
}

.emp-id-enhanced {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.emp-id-text {
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.emp-name-row {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.emp-name-row:hover {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(52, 152, 219, 0.02) 100%);
  transform: translateX(4px);
}

.emp-name-row .small-icon {
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 0.75rem;
}

.emp-name-row:hover .small-icon {
  opacity: 1;
}

.emp-name-text {
  font-size: 0.95rem;
  color: #2c3e50;
  flex: 1;
}

.summary-value {
  font-weight: 600;
  font-size: 0.9rem;
}

.col-summary {
  min-width: 120px;
}

.schedule-cell-enhanced {
  min-height: 50px;
  padding: 10px 6px;
  text-align: center;
  border: 1px solid #e9ecef;
  background: #fff;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.schedule-cell-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.schedule-cell-enhanced:hover::before {
  opacity: 1;
}

.schedule-cell-enhanced:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.schedule-cell-enhanced.cell-work {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #28a745;
  color: #155724;
  font-weight: 600;
}

.schedule-cell-enhanced.cell-leave {
  background: linear-gradient(135deg, #cce5ff, #b3d9ff);
  border-color: #007bff;
  color: #004085;
  font-weight: 600;
}

.schedule-cell-enhanced.cell-insufficient {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border-color: #ffc107;
  color: #856404;
  font-weight: 600;
}

.schedule-cell-enhanced.cell-incomplete {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-color: #dc3545;
  color: #721c24;
  font-weight: 600;
}

.schedule-cell-enhanced.cell-absent-without-leave {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  border-color: #6c757d;
  color: #495057;
  font-weight: 600;
}

.schedule-cell-enhanced.cell-late {
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
  border-color: #f39c12;
  color: #d68910;
  font-weight: 600;
}

/* Modal cải thiện UI */
/* Enhanced Modal Employee Header */
.modal-emp-header-enhanced {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f5f6fa 0%, #ffffff 100%);
  border-radius: 16px;
  border: 1px solid #e9ecef;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.5s ease;
  position: relative;
  overflow: hidden;
}

.modal-emp-header-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.05), transparent);
  animation: shimmer 3s infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.modal-emp-avatar-wrapper {
  flex-shrink: 0;
}

.modal-emp-avatar-enhanced {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(44, 62, 80, 0.3);
  border: 4px solid #fff;
  position: relative;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}


.modal-emp-avatar-enhanced::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

.modal-emp-avatar-enhanced img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder-enhanced {
  font-size: 2.5rem;
  color: #fff;
}

.modal-emp-info-enhanced {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.emp-name-enhanced {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.emp-name-enhanced i {
  color: #3498db;
}

.emp-details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.emp-detail-item {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: #6c757d;
}

.detail-label {
  font-weight: 500;
  margin-right: 6px;
}

.detail-value {
  font-weight: 600;
  color: #495057;
}

.modal-emp-date-enhanced {
  flex-shrink: 0;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: #fff;
  padding: 14px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}


.date-badge i {
  font-size: 1.5rem;
}

.date-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 2px;
}

.date-value {
  font-size: 1.1rem;
  font-weight: 700;
}

/* Enhanced Modal Section */
.modal-section-enhanced {
  margin-bottom: 28px;
  padding: 24px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fadeInUp 0.5s ease;
  animation-fill-mode: both;
}

.modal-section-enhanced:nth-child(1) {
  animation-delay: 0.1s;
}

.modal-section-enhanced:nth-child(2) {
  animation-delay: 0.2s;
}


.section-title-enhanced {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e9ecef;
  position: relative;
  transition: all 0.3s ease;
}

.section-title-enhanced::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #2c3e50, #3498db);
  transition: width 0.3s ease;
}

.section-title-enhanced:hover::after {
  width: 100px;
}

.section-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.section-icon-wrapper::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.section-title-enhanced:hover .section-icon-wrapper::before {
  width: 200px;
  height: 200px;
}

.section-title-enhanced:hover .section-icon-wrapper {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(44, 62, 80, 0.4);
}

/* Enhanced Form Select */
.form-select-enhanced {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.form-select-enhanced:hover:not(:disabled) {
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.1);
}

.form-select-enhanced:focus {
  border-color: #3498db;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

.form-select-enhanced:disabled {
  background-color: #e9ecef;
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading State Enhanced */
.loading-state-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 300px;
}

.loading-spinner-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.spinner-enhanced {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(52, 152, 219, 0.1);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.spinner-ring {
  width: 80px;
  height: 80px;
  border: 3px solid rgba(44, 62, 80, 0.1);
  border-top-color: #2c3e50;
  border-radius: 50%;
  animation: spin 1.5s linear infinite reverse;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.loading-text {
  color: #6c757d;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Error State Enhanced */
.error-state-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
  border-radius: 16px;
  border: 2px solid #fecaca;
  margin: 20px 0;
  animation: slideInDown 0.4s ease;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-content {
  text-align: center;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 8px;
}

.error-message {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 20px;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.2);
}

.btn-retry:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(44, 62, 80, 0.3);
}

.btn-retry:active:not(:disabled) {
  transform: translateY(0);
}

.btn-retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Empty State Enhanced */
.empty-state-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f6fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 2rem;
  margin-bottom: 20px;
  border: 2px dashed #dee2e6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-text {
  color: #6c757d;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

/* Legacy styles for backward compatibility */
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

.clickable-image {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.clickable-image:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

/* Image zoom modal styles */
.image-zoom-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem;
}

.img-zoom {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-info {
  width: 100%;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
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
  padding: 0;
  /* Remove padding around the table */
  margin: 0;
  /* Remove margin around the table container */
  border-radius: 0;
  /* Remove rounded corners */
  box-shadow: none;
  /* Remove shadow */
  background: transparent;
  /* Transparent background */
  border: none;
  /* Remove border */
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

.attendance-summary-table .cell-absent-without-leave {
  background: #e9ecef;
  color: #6c757d;
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

/* Type badge styles for check-in/check-out */
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.type-badge i {
  font-size: 0.85rem;
}

.type-badge-in {
  background: #e3f2fd;
  color: #1565C0;
  border: 1px solid #90caf9;
}

.type-badge-in:hover {
  background: #bbdefb;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.15);
  transform: translateY(-1px);
}

.type-badge-out {
  background: #e8f5e9;
  color: #2E7D32;
  border: 1px solid #a5d6a7;
}

.type-badge-out:hover {
  background: #c8e6c9;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.15);
  transform: translateY(-1px);
}

/* Scan time styling to match type badge */
.scan-time {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.3px;
}

.scan-time-in {
  color: #1565C0;
}

.scan-time-out {
  color: #2E7D32;
}

/* Warning icon gentle pulse animation */
@keyframes gentle-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.warning-icon-shake {
  animation: gentle-pulse 2s ease-in-out infinite;
  display: inline-block;
  transition: all 0.3s ease;
}

.warning-icon-shake:hover {
  transform: scale(1.1);
  opacity: 1;
}

/* Enhanced row styling based on type badge */

.attendance-summary-table tbody tr:nth-child(1) {
  animation-delay: 0.1s;
}

.attendance-summary-table tbody tr:nth-child(2) {
  animation-delay: 0.15s;
}

.attendance-summary-table tbody tr:nth-child(3) {
  animation-delay: 0.2s;
}

.attendance-summary-table tbody tr:nth-child(4) {
  animation-delay: 0.25s;
}

.attendance-summary-table tbody tr:nth-child(5) {
  animation-delay: 0.3s;
}

.attendance-summary-table tbody tr:nth-child(n+6) {
  animation-delay: 0.35s;
}

.attendance-summary-table tbody tr:has(.type-badge-in) {
  background-color: #f5f9ff;
  border-left: 4px solid #2196F3;
}

.attendance-summary-table tbody tr:has(.type-badge-in):hover {
  background-color: #e3f2fd;
}

.attendance-summary-table tbody tr:has(.type-badge-out) {
  background-color: #f1f8f4;
  border-left: 4px solid #4CAF50;
}

.attendance-summary-table tbody tr:has(.type-badge-out):hover {
  background-color: #e8f5e9;
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
}

/* Enhanced Summary Dashboard */
.summary-dashboard-enhanced {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f6fa 0%, #ffffff 100%);
  border-radius: 16px;
}

.stat-card-enhanced {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.stat-card-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2c3e50, #3498db);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card-enhanced:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.stat-card-enhanced:hover::before {
  opacity: 1;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

/* Gradient backgrounds for different stat types */
.primary-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
}

.primary-gradient .stat-value {
  color: #2c3e50;
}

.success-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
}

.success-gradient .stat-value {
  color: #27ae60;
}

.info-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.info-gradient .stat-value {
  color: #3498db;
}

.warning-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.warning-gradient .stat-value {
  color: #f39c12;
}

.late-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.late-gradient .stat-value {
  color: #e74c3c;
}

.early-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
}

.early-gradient .stat-value {
  color: #9b59b6;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.danger-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.danger-gradient .stat-value {
  color: #e74c3c;
}

.secondary-gradient .stat-icon-wrapper {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.secondary-gradient .stat-value {
  color: #6c757d;
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

.personal-cell.absent-without-leave {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  color: #6c757d;
  border-color: #dee2e6;
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
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  line-height: 1.3;
  min-height: 2.6em;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-word;
  text-align: center;
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

/* Header Styles for all tabs */
.summary-header,
.personal-header,
.overtime-header,
.personal-overtime-header,
.detail-header,
.attendance-header,
.feedback-history-header,
.closing-history-header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
}

.closing-history-header {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3) !important;
}

.time-filter-compact .btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.time-filter-compact .btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  transform: translateY(-1px);
}

.header-actions .btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.header-actions .btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  transform: translateY(-1px);
}

/* Feedback History Content */
.feedback-history-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Legend Compact Styles */
.legend-compact {
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}

.legend-item-compact {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.legend-item-compact:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.legend-item-compact .legend-color {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.legend-item-compact .legend-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
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

/* Enhanced Voucher Code Link */
.voucher-code-link-enhanced {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(52, 152, 219, 0.05) 100%);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.2);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.voucher-code-link-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.2), transparent);
  transition: left 0.5s ease;
}

.voucher-code-link-enhanced:hover::before {
  left: 100%;
}

.voucher-code-link-enhanced:hover {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(52, 152, 219, 0.1) 100%);
  border-color: #3498db;
  color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  text-decoration: none;
}

.voucher-code-link-enhanced:active {
  transform: translateY(0);
}

.voucher-code-link-enhanced i {
  font-size: 0.875rem;
  transition: transform 0.3s ease;
}

.voucher-code-link-enhanced:hover i {
  transform: scale(1.1) rotate(5deg);
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

/* Closing Status Styles */
.closing-status-badge {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 160px;
}

.status-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.status-indicator.success {
  background: linear-gradient(135deg, rgba(40, 167, 69, 0.9), rgba(32, 201, 151, 0.9));
  border-color: rgba(40, 167, 69, 0.3);
}

.status-indicator.warning {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.9), rgba(253, 126, 20, 0.9));
  border-color: rgba(255, 193, 7, 0.3);
}

.status-indicator.info {
  background: linear-gradient(135deg, rgba(23, 162, 184, 0.9), rgba(111, 66, 193, 0.9));
  border-color: rgba(23, 162, 184, 0.3);
}

.status-icon {
  margin-right: 0.5rem;
  font-size: 1.2rem;
  animation: pulse 2s infinite;
}

.status-indicator.success .status-icon {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.status-indicator.warning .status-icon {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.status-indicator.info .status-icon {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.status-text {
  display: flex;
  flex-direction: column;
  color: white;
}

.status-label {
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin-bottom: 0.15rem;
}

.status-detail {
  font-size: 0.7rem;
  opacity: 0.9;
  font-weight: 500;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Summary Cards Styles */
.summary-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #28a745, #20c997);
}

.payroll-card::before {
  background: linear-gradient(90deg, #17a2b8, #6f42c1);
}

.overtime-card::before {
  background: linear-gradient(90deg, #ffc107, #fd7e14);
}

.card-icon {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon i {
  font-size: 2rem;
  z-index: 2;
  position: relative;
}

.timesheet-card .card-icon i {
  color: #28a745;
}

.payroll-card .card-icon i {
  color: #17a2b8;
}

.overtime-card .card-icon i {
  color: #ffc107;
}

.icon-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  opacity: 0.1;
}

.timesheet-card .icon-bg {
  background: #28a745;
}

.payroll-card .icon-bg {
  background: #17a2b8;
}

.overtime-card .icon-bg {
  background: #ffc107;
}

.card-content {
  text-align: left;
}

.card-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.card-status {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #6c757d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
  animation: statusPulse 2s infinite;
}

.status-dot.success {
  background: #28a745;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
}

.status-dot.info {
  background: #17a2b8;
  box-shadow: 0 0 10px rgba(23, 162, 184, 0.5);
}

.status-dot.warning {
  background: #ffc107;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

@keyframes statusPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Table Header Styles */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.table-title {
  display: flex;
  align-items: center;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  position: relative;
  overflow: hidden;
}

.title-icon i {
  font-size: 1.5rem;
  z-index: 2;
  position: relative;
}

.timesheet-icon {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.payroll-icon {
  background: linear-gradient(135deg, #17a2b8, #6f42c1);
  color: white;
}

.overtime-icon {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  color: white;
}

.title-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.title-content h5 {
  margin: 0;
  font-weight: 700;
  color: #2c3e50;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  animation: statusPulse 2s infinite;
}

.status-badge.success {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  box-shadow: 0 2px 10px rgba(40, 167, 69, 0.3);
}

.status-badge.info {
  background: linear-gradient(135deg, #17a2b8, #6f42c1);
  color: white;
  box-shadow: 0 2px 10px rgba(23, 162, 184, 0.3);
}

.status-badge.warning {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  color: white;
  box-shadow: 0 2px 10px rgba(255, 193, 7, 0.3);
}

.closing-details {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  border-left: 3px solid #17a2b8;
}

.closing-details .alert {
  margin-bottom: 0;
  background: rgba(23, 162, 184, 0.1);
  border: 1px solid rgba(23, 162, 184, 0.2);
  color: #0c5460;
}

/* Close Button Styles */
.btn-warning {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e0a800, #e55a00);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545, #e83e8c);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333, #d63384);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
  color: white;
}

/* Feedback Button Styles */
.btn-feedback-attendance {
  background: linear-gradient(135deg, #28a745, #20c997);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-feedback-attendance:hover {
  background: linear-gradient(135deg, #218838, #1ea085);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
  color: white;
}

.btn-feedback-attendance:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
}

.btn-feedback-overtime {
  background: linear-gradient(135deg, #6f42c1, #e83e8c);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(111, 66, 193, 0.3);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-feedback-overtime:hover {
  background: linear-gradient(135deg, #5a2d91, #d63384);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(111, 66, 193, 0.4);
  color: white;
}

.btn-feedback-overtime:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(111, 66, 193, 0.3);
}
/* Simple Status Badge Styles */
.closing-status-simple {
  display: flex;
  align-items: center;
}

.status-badge-simple {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.status-badge-simple.success {
  color: #155724;
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.25);
  font-weight: 700;
}

.status-badge-simple.warning {
  color: #155724;
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.25);
  font-weight: 700;
}

.status-badge-simple.info {
  color: #ffc107;
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.15);
  font-weight: 700;
}
/* Custom Primary Button for Close Action */
.btn-primary {
  background: linear-gradient(135deg, #2c3e50, #3498db);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #34495e, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background: linear-gradient(135deg, #7f8c8d, #95a5a6);
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* Overtime Stat Cards - Professional and Clean */
.stat-card-overtime {
  background: #ffffff;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
  height: 100%;
}

.stat-card-overtime:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #dee2e6;
  transform: translateY(-2px);
}

.stat-card-overtime-full {
  max-width: 300px;
  margin-top: 0.5rem;
}

.stat-icon-overtime {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #ffffff;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(44, 62, 80, 0.2);
}

.stat-content-overtime {
  flex: 1;
  min-width: 0;
}

.stat-value-overtime {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.stat-label-overtime {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
  line-height: 1.2;
}
</style>
