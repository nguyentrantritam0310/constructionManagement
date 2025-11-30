<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '@/components/common/Breadcrumb.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import DataTable from '../../components/common/DataTable.vue'
import UpdateButton from '../../components/common/UpdateButton.vue'
import ChangeStatusButton from '../../components/common/ChangeStatusButton.vue'
import ChangeStatusDialog from '../../components/common/ChangeStatusDialog.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ChangeStatusForm from '../../components/common/ChangeStatusForm.vue'
import MultiSelect from 'vue-multiselect'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import Pagination from '@/components/common/Pagination.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useConstructionPlan } from '../../composables/useConstructionPlan'
import { useTask } from '../../composables/useTask'
import { useEmployee } from '../../composables/useEmployee'
import { useAttendance } from '../../composables/useAttendance'
import { attendanceService } from '../../services/attendanceService'
import { useWorkShift } from '../../composables/useWorkShift'
import { shiftAssignmentService } from '../../services/shiftAssignmentService'
import FormField from '@/components/common/FormField.vue'
import TourGuide from '../../components/common/TourGuide.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import api from '../../api.js'
const { showMessage } = useGlobalMessage()
const route = useRoute()
const router = useRouter()
const constructionId = route.params.id
const construction = ref(null)
const activeTab = ref('info')
const showStatusDialog = ref(false)
const selectedItem = ref(null)
const selectedPlan = ref(null)
const showTaskAssignment = ref(false)
const selectedTask = ref(null)
const showAssignmentModal = ref(false)
const showTaskModal = ref(false)
const selectedTasks = ref([])
const { employees, loading: employeesLoading, error: employeesError, fetchAllEmployees } = useEmployee()
const selectedWorkers = ref([])
const assignmentStartDate = ref('')
const assignmentEndDate = ref('')
const assignmentNotes = ref('')
const { workshifts, fetchWorkShifts, loading: workShiftsLoading } = useWorkShift()
const selectedWorkShiftIds = ref([])
const assignmentStep = ref('select-workers') // 'select-workers', 'select-date-range', 'select-work-shifts'
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5
const currentPlanPage = ref(1)
const plansPerPage = 5
const showPlanModal = ref(false)
const showTourGuide = ref(false)

const { selectedConstruction, fetchConstructionDetail } = useConstructionManagement()
const { plans, loading: plansLoading, error: plansError, fetchPlans } = useConstructionPlan()
const { tasks, loading: tasksLoading, error: tasksError, fetchTasks, changeTaskStatus } = useTask()
const {
  attendanceList,
  currentDateAttendance,
  loading: attendanceLoading,
  error: attendanceError,
  selectedDate,
  availableDates,
  fetchAttendance,
  createAttendanceForWorkers,
  updateEmployeeAttendanceStatus,
  getAssignedWorkersForTask,
  setAttendanceTabActive,
  deleteAttendanceByEmployeeAndTask,
  hasUnsavedChanges,
  saveAttendanceChanges,
  handleTabLeave,
  resetUnsavedChanges
} = useAttendance()

const breadcrumbItems = computed(() => [
  { text: 'Trang chủ', to: '/' },
  { text: 'Quản lý dự án', to: '/task-status' },
  { text: construction.value?.constructionName || 'Chi tiết công trình' }
])

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([
      fetchConstructionDetail(constructionId),
      fetchPlans(),
      fetchAllEmployees(),
      fetchAttendance(),
      fetchWorkShifts()
    ])
    construction.value = selectedConstruction.value
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = 'Không thể tải thông tin'
  } finally {
    loading.value = false
  }
})

const constructionItemColumns = [
  { key: 'id', label: 'Mã hạng mục' },
  { key: 'constructionItemName', label: 'Tên hạng mục' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày kết thúc' },
  { key: 'totalVolume', label: 'Tổng khối lượng' },
  { key: 'unitName', label: 'Đơn vị' },
  { key: 'constructionItemStatusName', label: 'Trạng thái' }
]

const planColumns = [
  { key: 'id', label: 'Mã kế hoạch' },
  { key: 'constructionItemName', label: 'Hạng mục' },
  { key: 'employeeName', label: 'Người phụ trách' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày kết thúc' },
  { key: 'statusName', label: 'Trạng thái' }
]

const taskColumns = [
  { key: 'id', label: 'Mã nhiệm vụ' },
  { key: 'workload', label: 'Khối lượng hoạch định' },
  { key: 'actualWorkload', label: 'Khối lượng thực tế' },
  { key: 'currentVolume', label: 'Khối lượng còn lại' },
  { key: 'statusName', label: 'Trạng thái' }
]

const handleUpdateItem = (item, event) => {
  event.stopPropagation()
  console.log('Update construction item:', item)
  // Xử lý cập nhật hạng mục
}

const handleStatusChange = (item, event) => {
  event.stopPropagation()
  selectedItem.value = item
  showStatusDialog.value = true
}

const handleStatusSubmit = (newStatus) => {
  if (selectedItem.value) {
    // Cập nhật trạng thái của hạng mục
    const itemIndex = construction.value.constructionItems.findIndex(
      item => item.id === selectedItem.value.id
    )
    if (itemIndex !== -1) {
      construction.value.constructionItems[itemIndex].status = newStatus
    }
  }
  showStatusDialog.value = false
  selectedItem.value = null
}

const handlePlanClick = async (plan) => {
  selectedPlan.value = plan
  try {
    await fetchTasks(plan.id)
    selectedTasks.value = tasks.value
    showPlanModal.value = true
  } catch (error) {
    console.error('Error fetching tasks:', error)
    showMessage('Không thể tải danh sách nhiệm vụ', 'error')
  }
}

const handleUpdatePlan = async (plan, event) => {
  event.stopPropagation()
  try {
    // Implement plan update logic here
    console.log('Updating plan:', plan)
    showMessage('Chức năng đang được phát triển', 'info')
  } catch (error) {
    console.error('Error updating plan:', error)
    showMessage('Không thể cập nhật kế hoạch', 'error')
  }
}

const handlePlanStatusChange = async (plan, event) => {
  event.stopPropagation()
  try {
    selectedPlan.value = plan
    showStatusDialog.value = true
  } catch (error) {
    console.error('Error changing plan status:', error)
    showMessage('Không thể thay đổi trạng thái kế hoạch', 'error')
  }
}

const handlePlanStatusSubmit = async (data) => {
  try {
    const { newStatus, item } = data
    await updatePlanStatus(item.id, newStatus)
    await fetchPlans()
    showMessage('Cập nhật trạng thái thành công', 'success')
  } catch (error) {
    console.error('Error updating plan status:', error)
    showMessage('Không thể cập nhật trạng thái', 'error')
  } finally {
    showStatusDialog.value = false
    selectedPlan.value = null
  }
}

const assignedWorkers = ref([])

// Load assigned workers for selected task
const loadAssignedWorkers = async (taskId) => {
  if (!taskId) {
    assignedWorkers.value = []
    return
  }
  try {
    assignedWorkers.value = await getAssignedWorkersForTask(taskId)
  } catch (error) {
    console.error('Error loading assigned workers:', error)
    assignedWorkers.value = []
  }
}

// Watch for selectedTask changes to reload assigned workers
watch(() => selectedTask.value?.id, async (newTaskId) => {
  await loadAssignedWorkers(newTaskId)
}, { immediate: true })

const handleAssignWorkers = async (task) => {
  selectedTask.value = task
  selectedWorkers.value = []
  selectedWorkShiftIds.value = []
  assignmentStep.value = 'select-workers'
  assignmentStartDate.value = ''
  assignmentEndDate.value = ''
  showAssignmentModal.value = true
}

const assignWorkers = async (event) => {
  event.preventDefault()
  
  if (assignmentStep.value === 'select-workers') {
    // Chuyển sang bước chọn khoảng thời gian
    if (selectedWorkers.value.length === 0) {
      showMessage('Vui lòng chọn ít nhất một công nhân', 'warning')
      return
    }
    
    assignmentStep.value = 'select-date-range'
    // Set default date range: từ hôm nay đến 7 ngày sau
    const today = new Date()
    assignmentStartDate.value = today.toISOString().split('T')[0]
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)
    assignmentEndDate.value = endDate.toISOString().split('T')[0]
  } else if (assignmentStep.value === 'select-date-range') {
    // Chuyển sang bước chọn ca làm việc
    if (!assignmentStartDate.value || !assignmentEndDate.value) {
      showMessage('Vui lòng chọn khoảng thời gian', 'warning')
      return
    }

    if (new Date(assignmentStartDate.value) > new Date(assignmentEndDate.value)) {
      showMessage('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc', 'warning')
      return
    }

    assignmentStep.value = 'select-work-shifts'
  } else {
    // Hoàn thành phân công
    await confirmAssignWorkShifts()
  }
}

const toggleWorkShiftSelection = (workShiftId) => {
  const index = selectedWorkShiftIds.value.indexOf(workShiftId)
  if (index > -1) {
    selectedWorkShiftIds.value.splice(index, 1)
  } else {
    selectedWorkShiftIds.value.push(workShiftId)
  }
}

const confirmAssignWorkShifts = async () => {
  if (selectedWorkShiftIds.value.length === 0) {
    showMessage('Vui lòng chọn ít nhất một ca làm việc', 'warning')
    return
  }

  try {
    loading.value = true
    
    const selectedWorkerIds = selectedWorkers.value.map(w => w.id)
    
    // Gán nhiệm vụ cho tất cả ShiftAssignment tương ứng
    const result = await shiftAssignmentService.assignTaskToWorkShifts(
      selectedTask.value.id,
      selectedWorkerIds,
      selectedWorkShiftIds.value,
      assignmentStartDate.value,
      assignmentEndDate.value
    )
    
    showMessage(result.message || `Đã phân công nhiệm vụ cho ${result.count || 0} ca làm việc`, 'success')
    
    // Refresh lại danh sách task và attendance để cập nhật UI
    await Promise.all([
      fetchTasks(selectedTask.value.constructionPlanID),
      fetchAttendance()
    ])

    // Refresh danh sách công nhân đã phân công để hiển thị ở cột bên trái
    await loadAssignedWorkers(selectedTask.value.id)

    // Reset selected workers sau khi phân công thành công
    // Các công nhân đã chọn sẽ tự động xuất hiện ở cột "Công nhân đã phân công" 
    selectedWorkers.value = []
    selectedWorkShiftIds.value = []
    
    // Giữ modal mở để user thấy công nhân đã chuyển sang cột đã phân công
    // Chỉ reset về bước đầu để có thể phân công tiếp
    assignmentStartDate.value = ''
    assignmentEndDate.value = ''
    assignmentStep.value = 'select-workers'

  } catch (error) {
    console.error('Lỗi khi phân công:', error)
    showMessage(error.response?.data?.message || error.message || 'Không thể phân công', 'error')
  } finally {
    loading.value = false
  }
}

const goBackToPreviousStep = () => {
  if (assignmentStep.value === 'select-work-shifts') {
    assignmentStep.value = 'select-date-range'
    selectedWorkShiftIds.value = []
  } else if (assignmentStep.value === 'select-date-range') {
    assignmentStep.value = 'select-workers'
    assignmentStartDate.value = ''
    assignmentEndDate.value = ''
  }
}

const formatDate = (date) => {
  if (!date || date === '0001-01-01T00:00:00') {
    return '(chưa cập nhật)'
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) return '(chưa cập nhật)'
  return d.toLocaleDateString('vi-VN')
}

const getNumItems = computed(() => {
  return construction.value?.constructionItems?.length || 0
})

const formattedStartDate = computed(() => formatDate(construction.value?.startDate))
const formattedEndDate = computed(() => formatDate(construction.value?.endDate))

const remainingDays = computed(() => {

  const today = new Date()
  const end = new Date(construction.value.expectedCompletionDate)

  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Đã hoàn thành'
  return `${diff} ngày`
})

const handleDownloadDesign = async () => {
  try {
    console.log('Downloading design file:', construction.value.designFile)
    // Implement file download logic here
    showMessage('Tải xuống tài liệu thiết kế thành công', success)
  } catch (err) {
    console.error('Error downloading design file:', err)
    showMessage('Không thể tải xuống tài liệu thiết kế', error)
  }
}

// Thêm biến cho chấm công
const attendanceDate = ref(new Date().toISOString().split('T')[0])
const attendanceWorkers = ref([
  { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', status: 'có mặt' },
  { id: 2, name: 'Trần Văn B', email: 'tranvanb@example.com', status: 'có mặt' },
  { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', status: 'có mặt' },
  { id: 4, name: 'Phạm Văn D', email: 'phamvand@example.com', status: 'có mặt' },
  { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', status: 'có mặt' }
])

const attendanceColumns = [
  { key: 'employeeID', label: 'Mã công nhân' },
  { key: 'employeeName', label: 'Họ và tên' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Trạng thái' }
]

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return construction.value?.constructionItems.slice(start, end) || []
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const paginatedPlans = computed(() => {
  if (!plans.value) return []
  const start = (currentPlanPage.value - 1) * plansPerPage
  const end = start + plansPerPage
  return plans.value.slice(start, end)
})

const handlePlanPageChange = (page) => {
  currentPlanPage.value = page
}

// Thêm dữ liệu giả cho tasks
const mockTasks = [
  { id: 1, name: 'Đào móng', unit: 'm³', plannedVolume: 100, currentVolume: 60, progress: 60 },
  { id: 2, name: 'Đổ bê tông móng', unit: 'm³', plannedVolume: 80, currentVolume: 40, progress: 50 },
  { id: 3, name: 'Xây tường', unit: 'm²', plannedVolume: 500, currentVolume: 200, progress: 40 },
  { id: 4, name: 'Lắp đặt điện', unit: 'm', plannedVolume: 1000, currentVolume: 300, progress: 30 },
  { id: 5, name: 'Lắp đặt nước', unit: 'm', plannedVolume: 800, currentVolume: 400, progress: 50 }
]

const workerSearchQuery = ref('')

const filteredWorkers = computed(() => {
  if (!workerSearchQuery.value) return employees.value

  const query = workerSearchQuery.value.toLowerCase()
  return employees.value.filter(worker =>
    worker.employeeName.toLowerCase().includes(query) ||
    worker.email.toLowerCase().includes(query)
  )
})

const toggleWorkerSelection = (worker) => {
  const index = selectedWorkers.value.findIndex(w => w.id === worker.id)
  if (index === -1) {
    selectedWorkers.value.push(worker)
  } else {
    selectedWorkers.value.splice(index, 1)
  }
}

// Thêm các biến reactive cho chấm công
const selectedTaskForAttendance = ref(null)
const attendanceDateRange = ref([])
const attendanceStatuses = ref([])
const showAttendanceModal = ref(false)

// Hàm tạo danh sách ngày từ ngày bắt đầu đến ngày kết thúc
const generateDateRange = (startDate, endDate) => {
  const dates = []
  const currentDate = new Date(startDate)
  const lastDate = new Date(endDate)

  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// Hàm xử lý khi chọn task để chấm công
const handleTaskAttendance = (task) => {
  selectedTaskForAttendance.value = task
  // Tạo danh sách ngày từ ngày bắt đầu đến ngày kết thúc của task
  attendanceDateRange.value = generateDateRange(task.startDate, task.endDate)
  // Khởi tạo trạng thái mặc định là "có mặt" cho tất cả ngày
  attendanceStatuses.value = attendanceDateRange.value.map(date => ({
    date: date,
    status: 'có mặt',
    workers: task.assignedWorkers?.map(worker => ({
      id: worker.id,
      name: worker.name,
      status: 'có mặt'
    })) || []
  }))
  showAttendanceModal.value = true
}

// Add pagination for workers
const currentWorkerPage = ref(1)
const workersPerPage = 5

const paginatedWorkers = computed(() => {
  const start = (currentWorkerPage.value - 1) * workersPerPage
  const end = start + workersPerPage
  return attendanceWorkers.value.slice(start, end)
})

const handleWorkerPageChange = (page) => {
  currentWorkerPage.value = page
}

// Add these new functions for status icons
const getStatusIcon = (status) => {
  const icons = {
    'có mặt': 'fas fa-check-circle',
    'vắng mặt': 'fas fa-times-circle',
    'đi trễ': 'fas fa-clock',
    'nghỉ phép': 'fas fa-calendar-minus'
  }
  return icons[status] || 'fas fa-question-circle'
}

const getStatusIconClass = (status) => {
  const classes = {
    'có mặt': 'status-present',
    'vắng mặt': 'status-absent',
    'đi trễ': 'status-late',
    'nghỉ phép': 'status-leave'
  }
  return classes[status] || ''
}

// Add new refs for assigned workers
const showAssignedWorkers = ref(true)

// Update refs for delete confirmation
const showDeleteAlert = ref(false)
const workerToDelete = ref(null)

// Update function to remove worker from assignment
const confirmDeleteWorker = (worker) => {
  workerToDelete.value = worker
  if (confirm(`Bạn có chắc chắn muốn xóa phân công của công nhân ${worker.name}?`)) {
    removeWorker()
  }
}

const removeWorker = async () => {
  if (!workerToDelete.value) return

  try {
    // Gọi API xóa phân công
    await deleteAttendanceByEmployeeAndTask(workerToDelete.value.id, selectedTask.value.id)

    // Cập nhật UI
    const index = selectedWorkers.value.findIndex(w => w.id === workerToDelete.value.id)
    if (index !== -1) {
      selectedWorkers.value.splice(index, 1)
    }

    // Refresh lại danh sách task để cập nhật UI
    await fetchTasks(selectedTask.value.constructionPlanID)

    // Reset workerToDelete
    workerToDelete.value = null
    showMessage('Xóa phân công công nhân thành công', 'success')
  } catch (error) {
    console.error('Error removing worker:', error)
    showMessage('Không thể xóa phân công công nhân', 'error')
  }
}

// Add to setup script
const currentAttendancePage = ref(1)
const attendancePerPage = 5

// Add computed for paginated attendance
const paginatedAttendance = computed(() => {
  const start = (currentAttendancePage.value - 1) * attendancePerPage
  const end = start + attendancePerPage
  return currentDateAttendance.value.slice(start, end)
})

const handleAttendancePageChange = (page) => {
  currentAttendancePage.value = page
}

// Watch for tab changes
watch(activeTab, (newTab, oldTab) => {
  if (newTab === 'attendance') {
    setAttendanceTabActive(true)
  } else {
    setAttendanceTabActive(false)
  }
})

// Update the groupedAttendance computed to modify task name display
const groupedAttendance = computed(() => {
  if (!currentDateAttendance.value) return []

  // Group attendance records by employee
  const grouped = currentDateAttendance.value.reduce((acc, record) => {
    const key = record.employeeID
    if (!acc[key]) {
      acc[key] = {
        employeeID: record.employeeID,
        employeeName: record.employeeName,
        email: record.email,
        status: record.status,
        tasks: []
      }
    }
    acc[key].tasks.push({
      taskId: record.constructionTaskID,
      taskName: record.taskName || `${record.constructionTaskID}`,
      workload: record.workload || 0,
      unit: record.unitOfMeasurementName || '',
      status: record.taskStatus || 'Đang thực hiện'
    })
    return acc
  }, {})

  // Convert to array and sort by employee name
  return Object.values(grouped).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName)
  )
})

// Update pagination for grouped attendance
const paginatedGroupedAttendance = computed(() => {
  const start = (currentAttendancePage.value - 1) * attendancePerPage
  const end = start + attendancePerPage
  return groupedAttendance.value.slice(start, end)
})

// Add helper function for task status classes
const getTaskStatusClass = (status) => {
  const statusMap = {
    'Chưa bắt đầu': 'status-pending',
    'Đang thực hiện': 'status-in-progress',
    'Hoàn thành': 'status-completed',
    'Đã hủy': 'status-cancelled'
  }
  return statusMap[status] || 'status-pending'
}

// Add new refs for task details modal
const showTaskDetailsModal = ref(false)
const selectedEmployeeTasks = ref([])
const selectedEmployeeName = ref('')

// Add function to show task details
const showTaskDetails = (tasks, employeeName) => {
  selectedEmployeeTasks.value = tasks
  selectedEmployeeName.value = employeeName
  showTaskDetailsModal.value = true
}

// Thêm beforeunload event listener
onMounted(() => {
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
})

// Thêm hàm xử lý lưu chấm công
const handleSaveAttendance = async () => {
  try {
    loading.value = true

    // Create array of promises for each employee's status update
    const updatePromises = Array.from(temporaryStatusChanges.value.entries()).map(([employeeId, status]) => {
      const date = new Date(selectedDate.value)
      date.setHours(0, 0, 0, 0) // Set time to midnight to match API format

      return attendanceService.updateAttendanceStatusByEmployee(
        employeeId,
        date.toISOString(),
        status
      )
    })

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    // Clear temporary changes
    temporaryStatusChanges.value.clear()
    hasUnsavedChanges.value = false

    // Force refresh attendance data from API
    await fetchAttendance(true)

    showMessage('Lưu chấm công thành công', 'success')
  } catch (error) {
    console.error('Lỗi khi lưu chấm công:', error)
    showMessage('Không thể lưu chấm công', 'error')
  } finally {
    loading.value = false
  }
}

// Add new ref to store temporary status changes
const temporaryStatusChanges = ref(new Map())

// Function to handle attendance status selection
const handleAttendanceStatusChange = async (employeeId, newStatus) => {
  try {
    loading.value = true
    const date = new Date(selectedDate.value)
    date.setHours(0, 0, 0, 0)

    await attendanceService.updateAttendanceStatusByEmployee(
      employeeId,
      date.toISOString(),
      newStatus
    )

    // Refresh data after successful update
    await fetchAttendance(true)
    showMessage('Cập nhật trạng thái thành công', 'success')
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error)
    showMessage('Không thể cập nhật trạng thái', 'error')
  } finally {
    loading.value = false
  }
}

// Xử lý ảnh thiết kế
const imageUrl = ref(null)
const imageLoadError = ref(false)
const imageLoading = ref(false)
const showImageModal = ref(false)
const isZoomed = ref(false)
const zoomScale = ref(1)
const zoomPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL
  const cleanBaseUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl
  return `${cleanBaseUrl}/${path}`
}

const loadImage = async () => {
  if (!construction.value?.designBlueprint) {
    imageUrl.value = null
    imageLoadError.value = false
    return
  }
  imageLoading.value = true
  imageLoadError.value = false
  try {
    const url = getImageUrl(construction.value.designBlueprint)
    // Kiểm tra kết nối
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    imageUrl.value = url
    imageLoadError.value = false
  } catch (error) {
    imageUrl.value = null
    imageLoadError.value = true
  } finally {
    imageLoading.value = false
  }
}

watch(() => construction.value?.designBlueprint, () => {
  loadImage()
}, { immediate: true })

const retryLoadImage = () => {
  loadImage()
}

const handleImageError = (e) => {
  imageLoadError.value = true
  imageLoading.value = false
}

const handleImageLoad = () => {
  imageLoadError.value = false
  imageLoading.value = false
}

const handleZoom = () => {
  if (!imageUrl.value || imageLoadError.value) return
  isZoomed.value = !isZoomed.value
  zoomScale.value = 1
  zoomPosition.value = { x: 0, y: 0 }
}

const handleWheel = (e) => {
  if (!isZoomed.value) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(1, Math.min(3, zoomScale.value + delta))
  zoomScale.value = newScale
}

const handleMouseDown = (e) => {
  if (!isZoomed.value) return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - zoomPosition.value.x,
    y: e.clientY - zoomPosition.value.y
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  zoomPosition.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isZoomed.value) {
      handleZoom()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

const downloadDesign = async () => {
  try {
    if (!construction.value?.designBlueprint) {
      showMessage('Không có file thiết kế', 'warning')
      return
    }
    const url = getImageUrl(construction.value.designBlueprint)
    if (!url) {
      showMessage('Không thể tải file thiết kế', 'error')
      return
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error('Không thể tải file')
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `design_${construction.value.constructionName}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(link.href)
    showMessage('Tải file thiết kế thành công', 'success')
  } catch (error) {
    showMessage('Không thể tải file thiết kế', 'error')
  }
}

// Tour Guide Steps
const itemsTourSteps = [
  {
    target: '[data-tour="tabs"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Hạng mục thi công". Tại đây bạn có thể xem danh sách tất cả các hạng mục thi công của công trình này.',
    noHighlight: true
  },
  {
    target: '[data-tour="items-table"]',
    message: 'Đây là bảng danh sách hạng mục thi công. Bạn có thể xem thông tin chi tiết của từng hạng mục như mã hạng mục, tên hạng mục, ngày bắt đầu, ngày kết thúc, tổng khối lượng, đơn vị và trạng thái.',
    noHighlight: true
  },
  {
    target: '[data-tour="items-pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều hạng mục hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Hạng mục thi công"!',
    noHighlight: true
  }
]

const plansTourSteps = [
  {
    target: '[data-tour="tabs"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Kế hoạch thi công". Tại đây bạn có thể xem danh sách các kế hoạch thi công và quản lý nhiệm vụ cho từng kế hoạch.',
    noHighlight: true
  },
  {
    target: '[data-tour="plans-table"]',
    message: 'Đây là bảng danh sách kế hoạch thi công. Bạn có thể xem thông tin chi tiết của từng kế hoạch như mã kế hoạch, hạng mục, người phụ trách, ngày bắt đầu, ngày kết thúc và trạng thái. Click vào một hàng để xem danh sách nhiệm vụ của kế hoạch đó.',
    noHighlight: true
  },
  {
    target: '[data-tour="plan-modal"]',
    message: 'Đây là modal danh sách nhiệm vụ của kế hoạch. Tại đây bạn có thể xem tất cả các nhiệm vụ thi công thuộc kế hoạch này, bao gồm mã nhiệm vụ, khối lượng hoạch định, khối lượng thực tế, khối lượng còn lại và trạng thái. Cột "Thao tác" chứa nút để phân công công nhân cho nhiệm vụ.',
    noHighlight: true,
    action: {
      type: 'function',
      func: async () => {
        // Tìm kế hoạch có nhiệm vụ
        await new Promise(resolve => setTimeout(resolve, 100))
        let planWithTasks = null
        
        // Tìm kế hoạch đầu tiên có nhiệm vụ
        for (const plan of paginatedPlans.value) {
          try {
            await fetchTasks(plan.id)
            if (tasks.value && tasks.value.length > 0) {
              planWithTasks = plan
              break
            }
          } catch (error) {
            console.error('Error fetching tasks for plan:', plan.id, error)
            continue
          }
        }
        
        // Nếu tìm thấy kế hoạch có nhiệm vụ, mở modal
        if (planWithTasks) {
          selectedPlan.value = planWithTasks
          selectedTasks.value = tasks.value
          showPlanModal.value = true
          // Đợi modal render xong
          await new Promise(resolve => setTimeout(resolve, 300))
        } else {
          // Nếu không có kế hoạch nào có nhiệm vụ, chỉ hiển thị thông báo
          showMessage('Không có kế hoạch nào có nhiệm vụ để hiển thị', 'info')
        }
      }
    }
  },
  {
    target: '[data-tour="assign-button"]',
    message: 'Nút "Phân công công nhân" cho phép bạn phân công công nhân cho nhiệm vụ này. Khi bấm vào nút này, một modal sẽ mở ra với quy trình phân công 3 bước. Hãy để tôi giải thích chi tiết!',
    noHighlight: true,
    action: {
      type: 'function',
      func: async () => {
        // Tìm nút phân công trong modal và click
        await new Promise(resolve => setTimeout(resolve, 100))
        const assignBtn = document.querySelector('[data-tour="assign-button"]')
        if (assignBtn) {
          assignBtn.click()
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  },
  {
    target: '[data-tour="assignment-modal"]',
    message: 'Đây là modal phân công công nhân. Quy trình phân công gồm 3 bước: Bước 1 - Chọn công nhân, Bước 2 - Chọn khoảng thời gian, Bước 3 - Chọn ca làm việc. Hãy để tôi giải thích từng bước!',
    noHighlight: true
  },
  {
    target: '[data-tour="select-workers"]',
    message: 'Bước 1: Chọn công nhân. Bạn có thể tìm kiếm và chọn các công nhân từ danh sách bên trái. Các công nhân đã được phân công sẽ hiển thị ở cột bên phải. Sau khi chọn xong, bấm "Tiếp theo" để chuyển sang bước 2.',
    noHighlight: true
  },
  {
    target: '[data-tour="select-date-range"]',
    message: 'Bước 2: Chọn khoảng thời gian. Bạn cần chọn "Từ ngày" và "Đến ngày" để xác định khoảng thời gian mà các công nhân sẽ làm việc. Sau khi chọn xong, bấm "Tiếp theo" để chuyển sang bước 3.',
    noHighlight: true,
    action: {
      type: 'function',
      func: async () => {
        // Nếu đang ở bước 1, chuyển sang bước 2
        if (assignmentStep.value === 'select-workers' && selectedWorkers.value.length === 0) {
          // Chọn công nhân đầu tiên nếu chưa chọn
          if (employees.value.length > 0) {
            selectedWorkers.value = [employees.value[0]]
          }
        }
        if (assignmentStep.value === 'select-workers') {
          assignmentStep.value = 'select-date-range'
          // Set default date range
          const today = new Date()
          assignmentStartDate.value = today.toISOString().split('T')[0]
          const endDate = new Date(today)
          endDate.setDate(endDate.getDate() + 7)
          assignmentEndDate.value = endDate.toISOString().split('T')[0]
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="select-work-shifts"]',
    message: 'Bước 3: Chọn ca làm việc. Bạn cần chọn các ca làm việc mà các công nhân đã chọn sẽ làm việc trong khoảng thời gian đã chọn. Logic phân ca: Hệ thống sẽ tự động tìm tất cả ShiftAssignment của các công nhân đã chọn, có ca làm việc được chọn, trong khoảng thời gian đã chọn, và gán nhiệm vụ này cho các ShiftAssignment đó.',
    noHighlight: true,
    action: {
      type: 'function',
      func: async () => {
        // Nếu đang ở bước 2, chuyển sang bước 3
        if (assignmentStep.value === 'select-date-range') {
          assignmentStep.value = 'select-work-shifts'
          // Chọn ca làm việc đầu tiên nếu có
          if (workshifts.value.length > 0 && selectedWorkShiftIds.value.length === 0) {
            selectedWorkShiftIds.value = [workshifts.value[0].id]
          }
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="plans-pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều kế hoạch hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Kế hoạch thi công"!',
    noHighlight: true,
    action: {
      type: 'function',
      func: async () => {
        // Đóng các modal đang mở
        if (showAssignmentModal.value) {
          showAssignmentModal.value = false
        }
        if (showPlanModal.value) {
          showPlanModal.value = false
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
]

const tourSteps = computed(() => {
  if (activeTab.value === 'items') {
    return itemsTourSteps
  } else if (activeTab.value === 'plans') {
    return plansTourSteps
  }
  return []
})

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  // Đợi một chút để UI render xong
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
}
</script>

<template>
  <div class="container-fluid py-4">
    <template v-if="construction">
      <div class="project-detail">
        <!-- Header Section -->
        <div class="header-section mb-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h1 class="project-title mb-2">{{ construction.constructionName }}</h1>
              <div class="project-meta">
                <span class="meta-item">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ construction.location }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-calendar"></i>
                  {{ formatDate(construction.startDate) }} - {{ formatDate(construction.expectedCompletionDate) }}
                </span>
              </div>
            </div>
            <div class="d-flex flex-column align-items-end">
              <StatusBadge :status="construction.statusName" class="mb-2" />
              <button class="btn btn-outline-primary btn-sm">
                <i class="fas fa-file-download me-1"></i>
                Tải bản thiết kế
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="row g-4 mb-4">
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-building"></i>
              </div>
              <div class="stat-content">
                <h3>Loại công trình</h3>
                <p>{{ construction.constructionTypeName || '(chưa cập nhật)' }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-ruler-combined"></i>
              </div>
              <div class="stat-content">
                <h3>Tổng diện tích</h3>
                <p>{{ construction.totalArea || '(chưa cập nhật)' }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-tasks"></i>
              </div>
              <div class="stat-content">
                <h3>Số hạng mục</h3>
                <p>{{ getNumItems }} hạng mục</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="stat-content">
                <h3>Thời gian còn lại</h3>
                <p>{{ remainingDays }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Tabs -->
        <div class="content-tabs">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <ul class="nav nav-tabs nav-tabs-custom" data-tour="tabs">
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'info' }" @click.prevent="activeTab = 'info'"
                  href="#">
                  <i class="fas fa-info-circle me-2"></i>
                  Thông tin chung
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'items' }" @click.prevent="activeTab = 'items'"
                  href="#">
                  <i class="fas fa-list me-2"></i>
                  Hạng mục thi công
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'plans' }" @click.prevent="activeTab = 'plans'"
                  href="#">
                  <i class="fa-solid fa-clipboard me-2"></i>
                  Kế hoạch thi công
                </a>
              </li>
            </ul>
          </div>

          <!-- Tab Content -->
          <div class="tab-content p-4 bg-white rounded-bottom shadow-sm">
            <template v-if="activeTab === 'info'">
              <div class="fade-in">
                <div class="row g-4">
                  <div class="col-md-8">
                    <div class="info-section">
                      <h2 class="section-title">
                        <i class="fas fa-info-circle me-2"></i>
                        Chi tiết công trình
                      </h2>
                      <div class="info-grid">
                        <div class="info-item">
                          <label>Loại công trình</label>
                          <p>{{ construction.constructionTypeName || '(chưa cập nhật)' }}</p>
                        </div>
                        <div class="info-item">
                          <label>Tổng diện tích</label>
                          <p>{{ construction.totalArea || '(chưa cập nhật)' }}</p>
                        </div>
                        <div class="info-item">
                          <label>Ngày khởi công</label>
                          <p>{{ formatDate(construction.startDate) }}</p>
                        </div>
                        <div class="info-item">
                          <label>Ngày dự kiến hoàn thành</label>
                          <p>{{ formatDate(construction.expectedCompletionDate) }}</p>
                        </div>
                        <div class="info-item full-width">
                          <label>Địa điểm xây dựng</label>
                          <p>{{ construction.location || '(chưa cập nhật)' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="document-section">
                      <h2 class="section-title">
                        <i class="fas fa-file-alt me-2"></i>
                        Tài liệu
                      </h2>
                      <div class="document-card">
                        <div v-if="imageLoading" class="design-preview">
                          <div class="image-loading">
                            <div class="spinner-border text-primary" role="status">
                              <span class="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        </div>
                        <template v-else-if="imageUrl && !imageLoadError">
                          <div class="design-preview" :class="{ 'zoomed': isZoomed }" @click="handleZoom">
                            <div class="zoom-container">
                              <div class="image-wrapper">
                                <img :src="imageUrl" :alt="construction?.constructionName || 'Bản thiết kế'"
                                  class="design-image"
                                  :style="isZoomed ? { transform: `scale(${zoomScale})`, cursor: isDragging ? 'grabbing' : 'grab' } : {}"
                                  @wheel="handleWheel" @mousedown="handleMouseDown" @error="handleImageError"
                                  @load="handleImageLoad" loading="lazy" />
                              </div>
                            </div>
                            <div class="design-overlay" v-if="!isZoomed">
                              <div class="overlay-content">
                                <button class="btn btn-light btn-sm me-2" @click.stop="downloadDesign"
                                  :disabled="imageLoadError">
                                  <i class="fas fa-download me-1"></i>
                                  Tải xuống
                                </button>
                                <span class="text-light">
                                  <i class="fas fa-search-plus me-1"></i>
                                  Click để phóng to
                                </span>
                              </div>
                            </div>
                            <div v-if="isZoomed" class="zoom-controls">
                              <button class="btn btn-light btn-sm" @click.stop="handleZoom">
                                <i class="fas fa-times"></i>
                              </button>
                              <div class="zoom-info">
                                <i class="fas fa-search-plus me-1"></i>
                                {{ Math.round(zoomScale * 100) }}%
                              </div>
                            </div>
                            <div v-if="isZoomed" class="zoom-exit-message">
                              <div class="message-content">
                                <i class="fas fa-mouse-pointer me-2"></i>
                                Click bất kỳ đâu để thoát
                              </div>
                            </div>
                          </div>
                        </template>
                        <div v-else class="no-design">
                          <div class="document-icon">
                            <i class="fas fa-exclamation-circle text-warning"></i>
                          </div>
                          <div class="document-info">
                            <h4>{{ imageLoadError ? 'Không thể kết nối đến server' : 'Chưa có bản thiết kế' }}</h4>
                            <p class="text-muted">
                              {{ imageLoadError ? 'Vui lòng kiểm tra kết nối và thử lại' :
                                'Bản thiết kế chưa được tải lên' }}
                            </p>
                            <button v-if="imageLoadError" class="btn btn-outline-primary btn-sm mt-2"
                              @click="retryLoadImage">
                              <i class="fas fa-sync-alt me-1"></i>
                              Thử lại
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'items'">
              <div class="fade-in">
                <div class="table-toolbar mb-3">
                  <h2 class="section-title">
                    <i class="fas fa-list me-2"></i>
                    Danh sách hạng mục
                  </h2>
                </div>
                <DataTable :columns="constructionItemColumns" :data="paginatedItems"
                  class="custom-table" data-tour="items-table">
                  <template #id="{ item }">
                    <div class="fw-medium text-primary">HM-{{ item.id }}</div>
                  </template>

                  <template #startDate="{ item }">
                    <div class="date-info">
                      <i class="fas fa-calendar text-muted me-1"></i>
                      {{ formatDate(item.startDate) }}
                    </div>
                  </template>

                  <template #expectedCompletionDate="{ item }">
                    <div class="date-info">
                      <i class="fas fa-calendar-check text-muted me-1"></i>
                      {{ formatDate(item.expectedCompletionDate) }}
                    </div>
                  </template>

                  <template #constructionItemName="{ item }">
                    <div class="volume-info">
                      <span class="fw-medium">{{ item.constructionItemName }}</span>
                    </div>
                  </template>

                  <template #constructionItemStatusName="{ item }">
                    <StatusBadge :status="item.constructionItemStatusName" />
                  </template>
                </DataTable>

                <!-- Phân trang -->
                <div class="d-flex justify-content-between align-items-center mt-4">
                  <div class="text-muted">
                    Hiển thị {{ paginatedItems.length }} trên {{ construction?.constructionItems.length || 0 }} hạng mục
                  </div>
                  <Pagination :total-items="construction?.constructionItems.length || 0" :items-per-page="itemsPerPage"
                    :current-page="currentPage" @update:currentPage="handlePageChange" data-tour="items-pagination" />
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'plans'">
              <div class="fade-in">
                <div class="table-toolbar mb-3">
                  <h2 class="section-title">
                    <i class="fas fa-list me-2"></i>
                    Danh sách kế hoạch
                  </h2>
                </div>

                <div v-if="plansLoading" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>

                <div v-else-if="plansError" class="alert alert-danger">
                  {{ plansError }}
                </div>

                <div v-else>
                  <DataTable :columns="planColumns" :data="paginatedPlans" @row-click="handlePlanClick"
                    class="custom-table" data-tour="plans-table">
                    <template #id="{ item }">
                      <div class="fw-medium text-primary">KH-{{ item.id }}</div>
                    </template>

                    <template #employeeName="{ item }">
                      <div class="d-flex align-items-center">
                        <div class="employee-status-indicator" :class="{
                          'status-present': item.status === 'Có mặt',
                          'status-absent': item.status === 'Vắng mặt'
                        }">
                          <i class="fas" :class="{
                            'fa-check': item.status === 'Có mặt',
                            'fa-times': item.status === 'Vắng mặt'
                          }"></i>
                        </div>
                        <span class="fw-bold ms-2">{{ item.employeeName }}</span>
                      </div>
                    </template>

                    <template #startDate="{ item }">
                      <div class="date-info">
                        <i class="fas fa-calendar text-muted me-1"></i>
                        {{ formatDate(item.startDate) }}
                      </div>
                    </template>

                    <template #expectedCompletionDate="{ item }">
                      <div class="date-info">
                        <i class="fas fa-calendar-check text-muted me-1"></i>
                        {{ formatDate(item.expectedCompletionDate) }}
                      </div>
                    </template>

                    <template #statusName="{ item }">
                      <StatusBadge :status="item.statusName" />
                    </template>
                  </DataTable>

                  <div class="d-flex justify-content-between align-items-center mt-4">
                    <div class="text-muted">
                      Hiển thị {{ paginatedPlans.length }} trên {{ plans?.length || 0 }} kế hoạch
                    </div>
                    <Pagination :total-items="plans?.length || 0" :items-per-page="plansPerPage"
                      :current-page="currentPlanPage" @update:currentPage="handlePlanPageChange" data-tour="plans-pagination" />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </template>

    <!-- Other modals -->
    <template v-if="selectedItem">
      <ModalDialog :show="showStatusDialog" @update:show="showStatusDialog = $event" title="Đổi Trạng Thái Hạng Mục"
        size="md">
        <ChangeStatusForm :current-status="selectedItem.status" type="construction" @submit="handleStatusSubmit"
          @cancel="showStatusDialog = false" />
      </ModalDialog>
    </template>

    <!-- Update Assignment Modal -->
    <template v-if="selectedTask">
      <ModalDialog :show="showAssignmentModal" @update:show="showAssignmentModal = $event" 
        :title="assignmentStep === 'select-workers' ? 'Phân công công nhân' : assignmentStep === 'select-date-range' ? 'Chọn khoảng thời gian' : 'Chọn ca làm việc'"
        size="lg" data-tour="assignment-modal">
        <div v-if="selectedTask.statusName !== 'Chờ khởi công'" class="alert alert-warning mb-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Chỉ có thể phân công công nhân cho nhiệm vụ chờ khởi công
        </div>
        
        <!-- Step 1: Chọn công nhân -->
        <form v-if="assignmentStep === 'select-workers'" @submit.prevent="assignWorkers" data-tour="select-workers">
          <div class="row g-4">
            <!-- Right Column: Add New Workers -->
            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-header bg-white">
                  <h5 class="mb-0">
                    <i class="fas fa-user-plus me-2 text-primary"></i>
                    Thêm công nhân mới
                  </h5>
                </div>
                <div class="card-body">
                  <div class="worker-search mb-3">
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0">
                        <i class="fas fa-search text-muted"></i>
                      </span>
                      <input type="text" class="form-control border-start-0 ps-0"
                        placeholder="Tìm kiếm theo tên hoặc email..." v-model="workerSearchQuery"
                        :disabled="selectedTask.statusName !== 'Chờ khởi công'">
                    </div>
                  </div>

                  <div v-if="employeesLoading" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>

                  <div v-else-if="employeesError" class="alert alert-danger">
                    {{ employeesError }}
                  </div>

                  <div v-else class="worker-list">
                    <div v-for="worker in filteredWorkers.filter(w => !assignedWorkers.some(aw => aw.id === w.id))"
                      :key="worker.id" class="worker-card" :class="{
                        'selected': selectedWorkers.includes(worker),
                        'disabled': selectedTask.statusName !== 'Chờ khởi công'
                      }" @click="selectedTask.statusName === 'Chờ khởi công' && toggleWorkerSelection(worker)">
                      <div class="worker-info">
                        <div class="worker-name">{{ worker.employeeName }}</div>
                        <div class="worker-email">
                          <i class="fas fa-envelope me-1"></i>
                          {{ worker.email }}
                        </div>
                      </div>
                      <div class="worker-check">
                        <div class="check-circle" :class="{ 'checked': selectedWorkers.includes(worker) }">
                          <i class="fas fa-check" v-if="selectedWorkers.includes(worker)"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Left Column: Assigned Workers -->
            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-header bg-white">
                  <h5 class="mb-0">
                    <i class="fas fa-user-check me-2 text-primary"></i>
                    Công nhân đã phân công
                  </h5>
                </div>
                <div class="card-body p-0">
                  <div class="assigned-workers-list p-3">
                    <div v-if="assignedWorkers.length === 0" class="text-center text-muted py-3">
                      <i class="fas fa-users-slash mb-2" style="font-size: 2rem;"></i>
                      <p class="mb-0">Chưa có công nhân nào được phân công</p>
                    </div>
                    <div v-else>
                      <div v-for="worker in assignedWorkers" :key="worker.id" class="assigned-worker-card">
                        <div class="worker-info">
                          <div class="worker-name">{{ worker.name }}</div>
                          <div class="worker-email">
                            <i class="fas fa-envelope me-1"></i>
                            {{ worker.email }}
                          </div>
                          <div class="worker-assigned-date text-muted small">
                            <i class="fas fa-calendar-alt me-1"></i>
                            Phân công từ: {{ formatDate(worker.assignedDate) }}
                          </div>
                        </div>
                        <button type="button" class="btn btn-icon btn-danger"
                          @click="selectedTask.statusName === 'Chờ khởi công' && confirmDeleteWorker(worker)"
                          :disabled="selectedTask.statusName !== 'Chờ khởi công'" title="Xóa phân công">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer bg-white border-top-0 d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" @click="showAssignmentModal = false">
              Hủy
            </button>
            <button type="submit" class="btn btn-primary px-4"
              :disabled="selectedWorkers.length === 0 || selectedTask.statusName !== 'Chờ khởi công'">
              <i class="fas fa-arrow-right me-1"></i>
              Tiếp theo: Chọn khoảng thời gian
            </button>
          </div>
        </form>

        <!-- Step 2: Chọn khoảng thời gian -->
        <div v-else-if="assignmentStep === 'select-date-range'" data-tour="select-date-range">
          <div class="alert alert-info mb-3">
            <h6 class="mb-1">Nhiệm vụ #{{ selectedTask.id }}</h6>
            <p class="mb-0">Đã chọn <strong>{{ selectedWorkers.length }}</strong> công nhân. Chọn khoảng thời gian để chọn ca làm việc.</p>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label fw-bold">Từ ngày</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="assignmentStartDate"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Đến ngày</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="assignmentEndDate"
              />
            </div>
          </div>

          <div class="d-flex justify-content-between mt-4">
            <button class="btn btn-secondary" @click="goBackToPreviousStep">
              <i class="fas fa-arrow-left me-2"></i>
              Quay lại
            </button>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary" @click="showAssignmentModal = false">
                Hủy
              </button>
              <button 
                type="button"
                class="btn btn-primary" 
                @click="assignWorkers"
                :disabled="!assignmentStartDate || !assignmentEndDate"
              >
                <i class="fas fa-arrow-right me-2"></i>
                Tiếp theo: Chọn ca làm việc
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Chọn ca làm việc -->
        <div v-else-if="assignmentStep === 'select-work-shifts'" data-tour="select-work-shifts">
          <div class="alert alert-info mb-3">
            <h6 class="mb-1">Nhiệm vụ #{{ selectedTask.id }}</h6>
            <p class="mb-0">
              Đã chọn <strong>{{ selectedWorkers.length }}</strong> công nhân. 
              Khoảng thời gian: <strong>{{ formatDate(assignmentStartDate) }}</strong> - <strong>{{ formatDate(assignmentEndDate) }}</strong>
            </p>
          </div>

          <div v-if="workShiftsLoading" class="text-center py-4">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-2">Đang tải danh sách ca làm việc...</p>
          </div>

          <div v-else-if="workshifts.length === 0" class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Không có ca làm việc nào trong hệ thống.
          </div>

          <div v-else class="mb-3">
            <label class="form-label fw-bold">
              Chọn ca làm việc ({{ workshifts.length }} ca)
            </label>
            <p class="text-muted small mb-2">
              Tất cả ShiftAssignment của các công nhân đã chọn, có ca làm việc được chọn, trong khoảng thời gian sẽ được cập nhật.
            </p>
            <div class="shift-list border rounded p-2" style="max-height: 400px; overflow-y: auto;">
              <div 
                v-for="workshift in workshifts" 
                :key="workshift.id"
                class="shift-item p-3 mb-2 rounded d-flex justify-content-between align-items-center border"
                :class="{ 
                  'bg-primary text-white border-primary': selectedWorkShiftIds.includes(workshift.id)
                }"
                @click="toggleWorkShiftSelection(workshift.id)"
                style="cursor: pointer; transition: all 0.2s;"
              >
                <div class="flex-grow-1">
                  <div class="fw-bold">{{ workshift.shiftName }}</div>
                  <div v-if="workshift.shiftDetails && workshift.shiftDetails.length > 0" 
                       class="small mt-1"
                       :class="selectedWorkShiftIds.includes(workshift.id) ? 'text-white-50' : 'text-muted'">
                    <template v-for="(detail, index) in workshift.shiftDetails" :key="index">
                      <i class="fas fa-clock me-1"></i>
                      {{ detail.startTime }} - {{ detail.endTime }}
                      <span v-if="index < workshift.shiftDetails.length - 1">, </span>
                    </template>
                  </div>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    class="form-check-input"
                    :checked="selectedWorkShiftIds.includes(workshift.id)"
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedWorkShiftIds.length > 0" class="alert alert-success">
            Đã chọn <strong>{{ selectedWorkShiftIds.length }}</strong> ca làm việc.
            <br><small>Tất cả ShiftAssignment của {{ selectedWorkers.length }} công nhân đã chọn, có các ca này, trong khoảng từ {{ formatDate(assignmentStartDate) }} đến {{ formatDate(assignmentEndDate) }} sẽ được gán nhiệm vụ này.</small>
          </div>

          <div class="d-flex justify-content-between mt-4">
            <button class="btn btn-secondary" @click="goBackToPreviousStep">
              <i class="fas fa-arrow-left me-2"></i>
              Quay lại
            </button>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary" @click="showAssignmentModal = false">
                Hủy
              </button>
              <button 
                type="button"
                class="btn btn-primary" 
                @click="confirmAssignWorkShifts"
                :disabled="loading || selectedWorkShiftIds.length === 0"
              >
                <i class="fas fa-check me-2"></i>
                Phân công ({{ selectedWorkShiftIds.length }} ca)
              </button>
            </div>
          </div>
        </div>
      </ModalDialog>
    </template>

    <!-- Plan Details Modal -->
    <template v-if="selectedPlan">
      <ModalDialog :show="showPlanModal" @update:show="showPlanModal = $event"
        :title="'Danh sách nhiệm vụ - KH-' + selectedPlan.id" size="xl" data-tour="plan-modal">
        <div v-if="tasksLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="tasksError" class="alert alert-danger">
          {{ tasksError }}
        </div>

        <div v-else>
          <DataTable :columns="taskColumns" :data="selectedTasks" class="task-table" data-tour="tasks-table">
            <template #id="{ item }">
              <div class="fw-medium text-primary">NV-{{ item.id }}</div>
            </template>

            <template #workload="{ item }">
              <span>{{ item.workload }} {{ item.unitOfMeasurementName }}</span>
            </template>

            <template #actualWorkload="{ item }">
              <span>{{ item.actualWorkload || 0 }} {{ item.unitOfMeasurementName }}</span>
            </template>

            <template #currentVolume="{ item }">
              <span>{{ item.currentVolume || (item.workload - (item.actualWorkload || 0)) }} {{
                item.unitOfMeasurementName }}</span>
            </template>

            <template #statusName="{ item }">
              <StatusBadge :status="item.statusName" />
            </template>

            <template #actions="{ item }">
              <button class="btn btn-icon" @click.stop="handleAssignWorkers(item)" title="Phân công công nhân" data-tour="assign-button">
                <i class="fas fa-user-plus"></i>
              </button>
            </template>
          </DataTable>
        </div>
      </ModalDialog>
    </template>

    <!-- Add Task Details Modal -->
    <ModalDialog :show="showTaskDetailsModal" @update:show="showTaskDetailsModal = $event"
      :title="`Danh sách nhiệm vụ - ${selectedEmployeeName}`" size="md">
      <div class="task-details-list">
        <div v-for="task in selectedEmployeeTasks" :key="task.taskId" class="task-detail-item">
          <span class="task-name">{{ task.taskName }}</span>
        </div>
      </div>
    </ModalDialog>

    <!-- Modal xem ảnh phóng to -->
    <ModalDialog v-if="imageUrl && !imageLoadError" :show="showImageModal" @update:show="showImageModal = $event"
      title="Xem Chi Tiết Bản Thiết Kế" size="xl">
      <div class="image-zoom-container">
        <div class="image-wrapper">
          <div v-if="imageLoading" class="image-loading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <img v-show="!imageLoading" :src="imageUrl" :alt="construction?.constructionName || 'Bản thiết kế'"
            class="img-zoom" @error="handleImageError" @load="handleImageLoad" loading="lazy" />
        </div>
        <div class="image-info mt-3">
          <div class="text-muted small">
            <i class="fas fa-calendar me-1"></i>
            Ngày tạo: {{ formatDate(construction?.startDate) }}
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
  </div>
</template>

<style scoped>
.project-detail {
  animation: fadeIn 0.3s ease-out;
}

.header-section {
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.project-title {
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 600;
}

.project-meta {
  display: flex;
  gap: 1.5rem;
  color: #6c757d;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #f8f9fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #007bff;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-content p {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.nav-tabs-custom {
  border: none;
  margin-top: 2rem;
}

.nav-tabs-custom .nav-link {
  border: none;
  padding: 1rem 1.5rem;
  color: #6c757d;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-tabs-custom .nav-link:hover {
  color: #007bff;
  background: rgba(0, 123, 255, 0.05);
}

.nav-tabs-custom .nav-link.active {
  color: #007bff;
  background: white;
  border-top: 3px solid #007bff;
}

.section-title {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  display: block;
}

.info-item p {
  margin: 0;
  color: #2c3e50;
  font-weight: 500;
}

.document-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.document-icon {
  font-size: 2rem;
  color: #dc3545;
}

.document-info h4 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.document-info p {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.custom-table {
  margin-bottom: 2rem;
}

.custom-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.custom-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.custom-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.date-info {
  font-size: 0.875rem;
  color: #495057;
}

.volume-info {
  font-size: 0.875rem;
}

.action-btn {
  padding: 0.25rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.gap-2 {
  gap: 0.5rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.multiselect {
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
}

.info-group {
  margin-bottom: 1rem;
}

.info-group label {
  display: block;
  margin-bottom: 0.25rem;
  color: #495057;
}

.info-group p {
  margin: 0;
  color: #2c3e50;
}

.section-subtitle {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
}

.tasks-section {
  background: #fff;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.progress {
  background-color: #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
}

.progress-bar {
  background-color: #3498db;
  transition: width 0.6s ease;
}

.task-details .card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-details .card-header {
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-bottom: 1px solid #eee;
}

.table-responsive {
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  border-top: none;
}

.table td {
  vertical-align: middle;
}

.plan-details {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.tasks-section {
  background: #fff;
  border-radius: 0.5rem;
}

.table {
  margin-bottom: 0;
}

.table th {
  white-space: nowrap;
  background: #f8f9fa;
  padding: 1rem;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
}

.progress {
  width: 100px;
  display: inline-block;
  margin-right: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.worker-list {
  max-height: 300px;
  overflow-y: auto;
}

.worker-item {
  transition: all 0.2s ease;
}

.worker-item:hover {
  background-color: #f8f9fa;
}

.form-check-input:checked+.form-check-label .worker-item {
  background-color: #e3f2fd;
}

.btn-link {
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-link:hover {
  transform: scale(1.1);
}

.task-table {
  margin: 0;
}

.task-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #495057;
  white-space: nowrap;
}

.task-table :deep(td) {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  vertical-align: middle;
  white-space: nowrap;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

.progress {
  flex: 1;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  background-color: #3498db;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6c757d;
  min-width: 40px;
  text-align: right;
}

.btn-icon {
  padding: 0.25rem;
  color: #6c757d;
  transition: all 0.2s ease;
  border: none;
  background: none;
}

.btn-icon:hover {
  color: #007bff;
  transform: scale(1.1);
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
  font-size: 0.875rem;
}

.employee-info i {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

.task-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.task-name {
  font-size: 1.1rem;
  color: #2c3e50;
}

.task-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.worker-selection {
  max-height: 450px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.worker-selection::-webkit-scrollbar {
  width: 6px;
}

.worker-selection::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.worker-selection::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.worker-selection::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.worker-search {
  position: sticky;
  top: 0;
  background: white;
  padding: 0.5rem 0;
  z-index: 1;
}

.worker-search .input-group {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  overflow: hidden;
}

.worker-search .input-group-text {
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
}

.worker-search .form-control {
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.worker-search .form-control:focus {
  box-shadow: none;
  border-color: #dee2e6;
}

.worker-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.25rem;
}

.worker-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.worker-card:hover {
  border-color: #007bff;
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.worker-card.selected {
  border-color: #007bff;
  background: #e7f1ff;
}

.worker-avatar {
  width: 32px;
  height: 32px;
  background: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 0.875rem;
}

.worker-info {
  flex: 1;
  min-width: 0;
}

.worker-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.worker-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.worker-specialty,
.worker-experience {
  font-size: 0.8125rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.worker-email {
  font-size: 0.8125rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.worker-check {
  flex-shrink: 0;
}

.check-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #dee2e6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.check-circle.checked {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.check-circle i {
  font-size: 0.75rem;
}

.attendance-container {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.attendance-table-container {
  flex: 1;
  overflow: auto;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
}

.attendance-table {
  margin-bottom: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.attendance-table th {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 1;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid #dee2e6;
  white-space: nowrap;
}

.attendance-table td {
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  vertical-align: middle;
}

.worker-column {
  position: sticky;
  left: 0;
  background: #f8f9fa;
  z-index: 2;
  min-width: 200px;
}

.date-column {
  min-width: 120px;
}

.date-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.date {
  font-weight: 600;
  color: #2c3e50;
}

.day-name {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
}

.worker-name-cell {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.worker-name {
  font-weight: 500;
  color: #2c3e50;
}

.worker-specialty {
  font-size: 0.8125rem;
  color: #6c757d;
}

.status-cell {
  text-align: center;
}

.form-select-sm {
  padding-right: 2.5rem;
  background-image: none;
}

.form-select-sm option {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-select-sm option i {
  width: 1rem;
  text-align: center;
}

.attendance-controls {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
}

.date-picker-wrapper {
  min-width: 200px;
}

.date-picker-wrapper .input-group {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s ease;
}

.date-picker-wrapper .input-group:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.date-picker-wrapper .input-group:focus-within {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.date-picker-wrapper input[type="date"] {
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.date-picker-wrapper input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.date-picker-wrapper input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  background: #0d6efd;
  color: white;
  border: none;
  box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(13, 110, 253, 0.25);
}

.btn-primary:active:not(:disabled) {
  background: #0a58ca;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(13, 110, 253, 0.2);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #0d6efd;
}

.btn-primary i {
  color: white;
  opacity: 0.9;
}

.btn-primary:hover:not(:disabled) i {
  opacity: 1;
}

@media (max-width: 768px) {
  .worker-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .status-icon {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }

  .btn-primary {
    padding: 0.5rem 1rem;
  }
}

/* Assignment Modal Styles */
.assignment-container {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.assignment-container::-webkit-scrollbar {
  width: 6px;
}

.assignment-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.assignment-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.assignment-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.assigned-workers-list,
.worker-list {
  max-height: 400px;
  overflow-y: auto;
}

.assigned-workers-list::-webkit-scrollbar,
.worker-list::-webkit-scrollbar {
  width: 6px;
}

.assigned-workers-list::-webkit-scrollbar-track,
.worker-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.assigned-workers-list::-webkit-scrollbar-thumb,
.worker-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.assigned-workers-list::-webkit-scrollbar-thumb:hover,
.worker-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.assigned-worker-card,
.worker-card {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
}

.assigned-worker-card:hover,
.worker-card:hover {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.worker-card {
  cursor: pointer;
}

.worker-card.selected {
  background: #e7f1ff;
  border: 1px solid #007bff;
}

.worker-info {
  flex: 1;
  min-width: 0;
}

.worker-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.worker-email {
  font-size: 0.8125rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.worker-check {
  flex-shrink: 0;
}

.check-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #dee2e6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.check-circle.checked {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-icon {
  padding: 0.5rem;
  color: #dc3545;
  transition: all 0.2s ease;
  background: none;
  border: none;
}

.btn-icon:hover {
  color: #bb2d3b;
  transform: scale(1.1);
}

.card {
  border: 1px solid #dee2e6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  border-bottom: 1px solid #dee2e6;
  padding: 1rem;
}

@media (max-width: 768px) {
  .col-md-6 {
    margin-bottom: 1rem;
  }
}

.worker-assigned-date {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
  transition: all 0.2s ease;
}

.btn-danger:hover:not(:disabled) {
  background-color: #bb2d3b;
  border-color: #bb2d3b;
  transform: translateY(-1px);
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.text-warning {
  color: #ffc107 !important;
}

.task-list {
  padding: 0.25rem;
}

.task-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
}

.task-item {
  background: #f8f9fa;
  border-radius: 0.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
  min-width: 40px;
  max-width: 80px;
  text-align: center;
}

.task-item:hover {
  background: #fff;
  border-color: #dee2e6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.task-name {
  font-size: 0.8125rem;
  color: #2c3e50;
  line-height: 1.2;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-view-more {
  background: #e9ecef;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
}

.btn-view-more:hover {
  background: #dee2e6;
  color: #495057;
}

.task-details-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.task-detail-item {
  background: #f8f9fa;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  text-align: center;
}

.task-detail-item .task-name {
  white-space: normal;
  max-width: none;
}

.status-select-wrapper {
  min-width: 120px;
}

.status-select-wrapper select {
  width: 100%;
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid #ced4da;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.status-select-wrapper select:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.status-select-wrapper select option {
  padding: 0.5rem;
}

.status-select-wrapper select option[value="có mặt"] {
  color: #198754;
}

.status-select-wrapper select option[value="vắng mặt"] {
  color: #dc3545;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-item {
  background: #f8f9fa;
  border-radius: 0.375rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: #fff;
  border-color: #dee2e6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.task-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-name .fw-medium {
  font-size: 0.875rem;
  color: #2c3e50;
  line-height: 1.3;

}

.task-id {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.task-status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.task-status-badge.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.task-status-badge.status-in-progress {
  background-color: #cce5ff;
  color: #004085;
}

.task-status-badge.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.task-status-badge.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.task-workload {
  font-size: 0.8125rem;
  color: #6c757d;
  padding-top: 0.25rem;
  border-top: 1px solid #e9ecef;
}

.status-select {
  min-width: 120px;
}

.status-select :deep(.form-select) {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid #ced4da;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.status-select :deep(.form-select:focus) {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.status-select :deep(.form-select option[value="có mặt"]) {
  color: #198754;
}

.status-select :deep(.form-select option[value="vắng mặt"]) {
  color: #dc3545;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-select {
  width: 100%;
  min-width: 120px;
}

.status-select :deep(.form-select) {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid #ced4da;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.status-select :deep(.form-select:focus) {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.status-select :deep(.form-select option[value="có mặt"]) {
  color: #198754;
}

.status-select :deep(.form-select option[value="vắng mặt"]) {
  color: #dc3545;
}

.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.current-status {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.current-status i {
  font-size: 1rem;
}

.status-select {
  width: 100%;
  min-width: 120px;
}

.status-select :deep(.form-select) {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid #ced4da;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.status-select :deep(.form-select:focus) {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.status-select :deep(.form-select option[value="có mặt"]) {
  color: #198754;
}

.status-select :deep(.form-select option[value="vắng mặt"]) {
  color: #dc3545;
}

.worker-card.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #f8f9fa;
}

.worker-card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: #e9ecef;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon:disabled:hover {
  transform: none;
  color: #dc3545;
}

.employee-status-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: white;
}

.status-present {
  background-color: #198754;
  box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.2);
}

.status-absent {
  background-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.employee-status-indicator i {
  font-size: 0.75rem;
}

.design-preview {
  position: relative;
  overflow: hidden;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fff;
  cursor: pointer;
}

.zoom-container {
  position: relative;
  overflow: hidden;
}

.image-wrapper {
  position: relative;
  overflow: hidden;
}

.design-image {
  width: 100%;
  height: auto;
  transition: transform 0.3s ease;
}

.design-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-content {
  text-align: center;
}

.zoom-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.zoom-info {
  font-size: 0.875rem;
  color: #6c757d;
}

.zoom-exit-message {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-content {
  font-size: 0.875rem;
  color: #6c757d;
}

.image-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.img-zoom {
  width: 100%;
  height: auto;
}

.image-info {
  margin-top: 1rem;
  text-align: center;
  color: #6c757d;
}

.no-design {
  text-align: center;
  padding: 1rem;
  border: 1px dashed #dee2e6;
  border-radius: 0.5rem;
  background: #f8f9fa;
}

.no-design .document-icon {
  font-size: 2rem;
  color: #dc3545;
  margin-bottom: 0.5rem;
}

.no-design h4 {
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.no-design p {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.btn-outline-primary {
  border-color: #0d6efd;
  color: #0d6efd;
}

.btn-outline-primary:hover {
  background-color: #0b5ed7;
  border-color: #0b5ed7;
}

.image-zoom-container {
  max-width: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
