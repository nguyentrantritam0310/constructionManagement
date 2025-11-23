<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import EmployeeForm from '../../components/common/employee/EmployeeForm.vue'
import FamilyRelationForm from '../../components/common/family/FamilyRelationForm.vue'
import { useEmployee } from '../../composables/useEmployee'
import { useFamilyRelation } from '../../composables/useFamilyRelation'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { usePermissions } from '../../composables/usePermissions'
import ActionButton from '@/components/common/ActionButton.vue'
import GlobalMessageModal from '@/components/common/GlobalMessageModal.vue'
import TourGuide from '@/components/common/TourGuide.vue'
import AIChatbotButton from '@/components/common/AIChatbotButton.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const {
    employees,
    roles,
    loading,
    error,
    fetchAllEmployees,
    fetchAllRoles,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    formatEmployeeForSubmit
} = useEmployee()

const {
    familyRelations,
    loading: familyLoading,
    error: familyError,
    fetchFamilyRelationsByEmployeeId,
    createFamilyRelation,
    updateFamilyRelation,
    deleteFamilyRelation,
    formatFamilyRelationForSubmit
} = useFamilyRelation()

const { showMessage } = useGlobalMessage()

const router = useRouter()
const { canCreate, canEditItem, canDeleteItem, filterDataByPermission } = usePermissions()

const showEmployeeModal = ref(false)
const selectedEmployeeForm = ref(null)
const employeeFormMode = ref('create')

const openAddEmployeeForm = () => {
    selectedEmployeeForm.value = null
    employeeFormMode.value = 'create'
    showEmployeeModal.value = true
}

const openUpdateForm = (id) => {
    const emp = employees.value.find(e => e.id === id)
    selectedEmployeeForm.value = emp
    employeeFormMode.value = 'update'
    showEmployeeModal.value = true
}

const closeEmployeeModal = () => {
    showEmployeeModal.value = false
    selectedEmployeeForm.value = null
}

const handleEmployeeSubmit = async (data) => {
    try {
        const formattedData = formatEmployeeForSubmit(data)
        
        if (employeeFormMode.value === 'create') {
            await createEmployee(formattedData)
            showMessage('Thêm nhân viên thành công!', 'success')
        } else {
            await updateEmployee(formattedData)
            showMessage('Cập nhật nhân viên thành công!', 'success')
        }
        
        closeEmployeeModal()
        await fetchAllEmployees() // Refresh the list
    } catch (err) {
        showMessage(`Lỗi: ${err.message || 'Có lỗi xảy ra khi lưu nhân viên'}`, 'error')
    }
}

const handleDeleteEmployee = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
        return
    }
    
    try {
        await deleteEmployee(id)
        showMessage('Xóa nhân viên thành công!', 'success')
        await fetchAllEmployees() // Refresh the list
    } catch (err) {
        showMessage(`Lỗi: ${err.message || 'Có lỗi xảy ra khi xóa nhân viên'}`, 'error')
    }
}

onMounted(async () => {
    await Promise.all([
        fetchAllEmployees(),
        fetchAllRoles()
    ])
})

const employeesData = computed(() => {
    const filteredEmployees = filterDataByPermission('human-resources', employees.value)
    return filteredEmployees
        .map((employee) => ({
            ...employee,
            birthday: new Date(employee.birthday)
                .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            joinDate: new Date(employee.joinDate)
                .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            employeeName: getEmployeeNameWithStatus(employee),
        }))
})

const columns = [
    { key: 'id', label: 'Mã nhân viên', link: true },
    { key: 'employeeName', label: 'Tên nhân viên' },
    { key: 'birthday', label: 'Ngày sinh' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'joinDate', label: 'Ngày vào làm' },
    { key: 'roleName', label: 'Chức danh' }
]

const currentPage = ref(1)
const itemsPerPage = 8

const showFamilyModal = ref(false)
const selectedEmployee = ref(null)
const selectedRelations = ref([])

// Family relation form states
const showFamilyFormModal = ref(false)
const selectedFamilyRelation = ref(null)
const familyFormMode = ref('create')
const showFilter = ref(false)
const showImportModal = ref(false)
const showTourGuide = ref(false)

// Filter variables
const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const filteredEmployeesData = computed(() => {
  let result = [...employeesData.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(employee =>
      employee.id?.toString().includes(query) ||
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query) ||
      employee.phone?.toLowerCase().includes(query) ||
      employee.roleName?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    const status = statusFilter.value
    result = result.filter(employee => {
      const empStatus = employee.status || 'Active'
      if (status === 'Active') return empStatus === 'Active' || empStatus === 0
      if (status === 'Resigned') return empStatus === 'Resigned' || empStatus === 1
      if (status === 'MaternityLeave') return empStatus === 'MaternityLeave' || empStatus === 2
      return true
    })
  }

  // Apply role filter
  if (roleFilter.value) {
    result = result.filter(employee => employee.roleID?.toString() === roleFilter.value)
  }

  // Apply date range filter (join date)
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(employee => {
      const joinDate = new Date(employee.joinDate)
      return joinDate >= start && joinDate <= end
    })
  }

  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  dateRange.value = { start: null, end: null }
  currentPage.value = 1
}

const openFamilyModal = async (employee) => {
    selectedEmployee.value = employee
    showFamilyModal.value = true
    await fetchFamilyRelationsByEmployeeId(employee.id)
    selectedRelations.value = familyRelations.value
}
const closeFamilyModal = () => {
    showFamilyModal.value = false
    selectedEmployee.value = null
    selectedRelations.value = []
}

// Family relation CRUD operations
const handleAddFamilyRelation = () => {
    selectedFamilyRelation.value = null
    familyFormMode.value = 'create'
    showFamilyFormModal.value = true
}

const handleEditFamilyRelation = (relation) => {
    selectedFamilyRelation.value = relation
    familyFormMode.value = 'update'
    showFamilyFormModal.value = true
}

const closeFamilyFormModal = () => {
    showFamilyFormModal.value = false
    selectedFamilyRelation.value = null
}

const handleFamilyRelationSubmit = async (data) => {
    try {
        const formattedData = formatFamilyRelationForSubmit(data)
        
        if (familyFormMode.value === 'create') {
            await createFamilyRelation(formattedData)
            showMessage('Thêm quan hệ gia đình thành công!', 'success')
        } else {
            await updateFamilyRelation(formattedData)
            showMessage('Cập nhật quan hệ gia đình thành công!', 'success')
        }
        
        closeFamilyFormModal()
        
        if (selectedEmployee.value) {
            await fetchFamilyRelationsByEmployeeId(selectedEmployee.value.id)
            selectedRelations.value = familyRelations.value
        }
    } catch (err) {
        showMessage(`Lỗi: ${err.message}`, 'error')
    }
}

const handleDeleteFamilyRelation = async (relationId) => {
    if (confirm('Bạn có chắc chắn muốn xóa quan hệ gia đình này?')) {
        try {
            await deleteFamilyRelation(relationId, selectedEmployee.value.id)
            showMessage('Xóa quan hệ gia đình thành công!', 'success')
            await fetchFamilyRelationsByEmployeeId(selectedEmployee.value.id)
            selectedRelations.value = familyRelations.value
        } catch (err) {
            showMessage(`Lỗi: ${err.message}`, 'error')
        }
    }
}

const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredEmployeesData.value.slice(start, end)
})

const handlePageChange = (page) => {
    currentPage.value = page
}

// Handle cell click for navigation
const handleCellClick = (item, column) => {
    if (column.key === 'id' && column.link) {
        // Navigate to employee profile
        viewEmployeeProfile(item.id)
    }
}

// Handle row click for navigation
const handleRowClick = (item) => {
    viewEmployeeProfile(item.id)
}

// Navigate to employee profile
const viewEmployeeProfile = (employeeId) => {
    router.push({ name: 'employee-profile', params: { employeeId } })
}

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
    const worksheet = workbook.addWorksheet('Employees')

    worksheet.columns = columns.map(c => ({ header: c.label, key: c.key, width: 15 }))

    employeesData.value.forEach(row => {
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
    saveAs(new Blob([buf]), 'Employees.xlsx')
}

const getStatusConfig = (status) => {
    const statusMap = {
        'Active': { color: '#28a745', text: 'Đang làm việc' },
        'Resigned': { color: '#000000', text: 'Nghỉ việc' },
        'MaternityLeave': { color: '#e91e63', text: 'Nghỉ thai sản' },
        0: { color: '#28a745', text: 'Đang làm việc' },
        1: { color: '#000000', text: 'Nghỉ việc' },
        2: { color: '#e91e63', text: 'Nghỉ thai sản' }
    }
    return statusMap[status] || { color: '#28a745', text: 'Đang làm việc' }
}

const getEmployeeNameWithStatus = (employee) => {
    const fullName = `${employee.firstName} ${employee.lastName}`
    const status = employee.status || 'Active'
    const { color: statusColor, text: statusText } = getStatusConfig(status)
    
    return `<span class="employee-name-with-status" title="${statusText}">
        <span class="status-dot" style="background-color: ${statusColor};"></span>
        ${fullName}
    </span>`
}

// Tour Guide Steps
const tourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý nhân sự. Tại đây bạn có thể xem, tạo, và quản lý thông tin nhân viên cùng với quan hệ gia đình của họ.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ với các chức năng chính. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form"]',
    message: 'Đây là form thêm/sửa hồ sơ nhân viên. Bạn có thể điền thông tin cá nhân, thông tin liên hệ, ngày sinh, ngày vào làm, chức danh và các thông tin khác. Sau khi điền đầy đủ, bấm "Lưu" để lưu thông tin.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc nhân viên theo nhiều tiêu chí như mã nhân viên, tên, email, số điện thoại, trạng thái, chức danh và khoảng thời gian vào làm.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo mã, tên, email, số điện thoại. Chọn trạng thái và chức danh từ dropdown. Chọn khoảng thời gian vào làm từ ngày đến ngày. Bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách nhân viên ra file Excel để lưu trữ hoặc xử lý thêm.'
  },
  {
    target: '[data-tour="import-modal"]',
    message: 'Đây là modal nhập Excel. Bạn có thể tải file mẫu, điền thông tin nhân viên vào file Excel, sau đó chọn file và bấm "Nhập dữ liệu" để import vào hệ thống.',
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
    message: 'Đây là bảng danh sách nhân viên. Bạn có thể xem thông tin cơ bản của từng nhân viên. Click vào mã nhân viên hoặc click vào hàng để xem chi tiết hồ sơ nhân viên.'
  },
  {
    target: '[data-tour="family-modal"]',
    message: 'Đây là modal quản lý quan hệ gia đình. Bạn có thể xem danh sách các quan hệ gia đình của nhân viên, thêm mới, sửa hoặc xóa quan hệ. Hãy để tôi hướng dẫn từng phần!',
    action: {
      type: 'function',
      func: async () => {
        // Tìm nút quan hệ gia đình đầu tiên và click
        await new Promise(resolve => setTimeout(resolve, 100))
        const familyBtn = document.querySelector('[data-tour="family-button"]')
        if (familyBtn) {
          familyBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="family-table"]',
    message: 'Đây là bảng danh sách quan hệ gia đình của nhân viên. Bạn có thể xem tên người quan hệ, mối quan hệ, từ ngày và đến ngày. Có các nút sửa và xóa ở cột thao tác.'
  },
  {
    target: '[data-tour="family-form-modal"]',
    message: 'Đây là form thêm/sửa quan hệ gia đình. Bạn có thể chọn nhân viên, nhập tên người quan hệ, mối quan hệ, từ ngày và đến ngày. Sau khi điền đầy đủ, bấm "Lưu" để lưu thông tin.',
    action: {
      type: 'function',
      func: async () => {
        // Tìm nút "Thêm quan hệ gia đình" trong modal và click
        await new Promise(resolve => setTimeout(resolve, 100))
        const addBtn = document.querySelector('[data-tour="add-family-button"]')
        if (addBtn) {
          addBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều nhân viên hơn. Bạn có thể thấy số lượng nhân viên hiện tại và tổng số nhân viên. Đó là tất cả những gì tôi muốn giới thiệu với bạn!',
    action: {
      type: 'function',
      func: async () => {
        // Đóng các modal đang mở
        if (showFamilyFormModal.value) {
          showFamilyFormModal.value = false
        }
        if (showFamilyModal.value) {
          showFamilyModal.value = false
        }
        if (showEmployeeModal.value) {
          showEmployeeModal.value = false
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

// Import Excel functions
const fileInput = ref(null)

const downloadExcelTemplate = () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Employees')
  
  worksheet.columns = columns.map(c => ({ header: c.label, key: c.key, width: 15 }))
  
  applyHeaderStyle(worksheet.getRow(1))
  
  const buf = workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Employee_Template.xlsx')
}

const handleFileSelect = (event) => {
  fileInput.value = event.target.files[0]
}

const handleImportExcel = async () => {
  if (!fileInput.value) {
    showMessage('Vui lòng chọn file Excel', 'error')
    return
  }
  
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Process import data here
        // This is a placeholder - you'll need to implement the actual import logic
        showMessage('Nhập dữ liệu thành công!', 'success')
        showImportModal.value = false
        await fetchAllEmployees()
      } catch (error) {
        console.error('Lỗi khi xử lý file Excel:', error)
        showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error')
      }
    }
    reader.readAsArrayBuffer(fileInput.value)
  } catch (error) {
    showMessage('Có lỗi xảy ra khi đọc file', 'error')
  }
}

</script>

<template>
    <div class="container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="mb-0" data-tour="title">Quản lý nhân sự</h2>
            <div class="d-flex gap-2" data-tour="toolbar">
                <ActionButton 
                    v-if="canCreate('human-resources')"
                    type="primary" 
                    icon="fas fa-plus me-2" 
                    @click="openAddEmployeeForm"
                >
                    Thêm
                </ActionButton>
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
                    <div class="col-md-3">
                        <input
                            type="text"
                            class="form-control"
                            v-model="searchQuery"
                            placeholder="Tìm kiếm theo mã, tên, email, số điện thoại..."
                        >
                    </div>
                    <div class="col-md-2">
                        <select class="form-control" v-model="statusFilter">
                            <option value="">Tất cả trạng thái</option>
                            <option value="Active">Đang làm việc</option>
                            <option value="Resigned">Nghỉ việc</option>
                            <option value="MaternityLeave">Nghỉ thai sản</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-control" v-model="roleFilter">
                            <option value="">Tất cả chức danh</option>
                            <option v-for="role in roles" :key="role.id" :value="role.id.toString()">
                                {{ role.roleName }}
                            </option>
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
                    <div class="col-md-1">
                        <button class="btn btn-secondary w-100" @click="resetFilters">
                            <i class="fas fa-undo me-2"></i>Đặt lại
                        </button>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải danh sách nhân viên...</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    {{ error }}
                </div>
                <button 
                    class="btn btn-outline-danger btn-sm" 
                    @click="fetchAllEmployees"
                    :disabled="loading"
                >
                    <i class="fas fa-redo me-1"></i>
                    Thử lại
                </button>
            </div>
        </div>
        
        <!-- Data Table -->
        <DataTable v-else :columns="columns" :data="paginatedEmployees" @cell-click="handleCellClick" @row-click="handleRowClick" data-tour="table">
            <template #actions="{ item }">
                <div class="d-flex justify-content-start gap-2">
                    <ActionButton 
                        v-if="canEditItem('human-resources', item)"
                        @click.stop="openUpdateForm(item.id)" 
                        type="success" 
                        icon="fas fa-pen-to-square"
                        title="Sửa"
                    ></ActionButton>
                    <ActionButton 
                        v-if="canDeleteItem('human-resources', item)"
                        @click.stop="handleDeleteEmployee(item.id)" 
                        type="danger" 
                        icon="fas fa-trash"
                        title="Xóa"
                    ></ActionButton>
                    <ActionButton 
                        @click.stop="openFamilyModal(item)" 
                        icon="fas fa-people-group"
                        title="Quan hệ gia đình"
                        data-tour="family-button"
                    ></ActionButton>
                </div>
            </template>
        </DataTable>
        <!-- Pagination -->
        <div v-if="!loading && !error && filteredEmployeesData.length > 0" class="d-flex justify-content-between align-items-center mt-3">
            <div class="text-muted">
                Hiển thị {{ paginatedEmployees.length }} trên {{ filteredEmployeesData.length }} nhân viên
            </div>
            <Pagination :total-items="filteredEmployeesData.length" :items-per-page="itemsPerPage" :current-page="currentPage"
                @update:currentPage="handlePageChange" data-tour="pagination" />
        </div>
        <ModalDialog :title="employeeFormMode === 'create' ? 'Thêm hồ sơ nhân viên' : 'Cập nhật hồ sơ nhân viên'" :show="showEmployeeModal" size="lg" @update:show="closeEmployeeModal">
            <div data-tour="create-form">
                <EmployeeForm :mode="employeeFormMode" :employee="selectedEmployeeForm" :roles="roles" @submit="handleEmployeeSubmit"
                    @close="closeEmployeeModal" />
            </div>
        </ModalDialog>
        <ModalDialog :show="showFamilyModal" title="Quan hệ gia đình" size="lg"
            @update:show="closeFamilyModal" data-tour="family-modal">
            <div v-if="familyLoading" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </div>
            <div v-else-if="familyError" class="alert alert-danger">
                {{ familyError }}
            </div>
            <div v-else>
                <DataTable :columns="[
                    { key: 'relativeName', label: 'Tên người quan hệ' },
                    { key: 'relationShipName', label: 'Mối quan hệ' },
                    { key: 'startDate', label: 'Từ ngày' },
                    { key: 'endDate', label: 'Đến ngày' }
                ]" :data="selectedRelations" data-tour="family-table">
                    <template #actions="{ item }">
                        <div class="d-flex justify-content-start gap-2">
                            <ActionButton 
                                v-if="canEditItem('human-resources', selectedEmployee)"
                                @click.stop="handleEditFamilyRelation(item)" 
                                type="warning" 
                                icon="fas fa-pen-to-square" 
                                size="sm"
                                title="Sửa"
                            ></ActionButton>
                            <ActionButton 
                                v-if="canDeleteItem('human-resources', selectedEmployee)"
                                @click.stop="handleDeleteFamilyRelation(item.id)" 
                                type="danger" 
                                icon="fas fa-trash" 
                                size="sm"
                                title="Xóa"
                            ></ActionButton>
                        </div>
                    </template>
                </DataTable>
                <div class="mt-3 text-end">
                    <ActionButton 
                        v-if="canCreate('human-resources')"
                        @click="handleAddFamilyRelation" 
                        type="success" 
                        icon="fas fa-plus"
                        data-tour="add-family-button"
                    >
                        Thêm quan hệ gia đình
                    </ActionButton>
                </div>
            </div>
        </ModalDialog>
        
        <!-- Family Relation Form Modal -->
        <ModalDialog 
            :title="familyFormMode === 'create' ? 'Thêm quan hệ gia đình' : 'Cập nhật quan hệ gia đình'" 
            :show="showFamilyFormModal" 
            size="lg" 
            @update:show="closeFamilyFormModal"
        >
            <div data-tour="family-form-modal">
                <FamilyRelationForm 
                    :mode="familyFormMode" 
                    :familyRelation="selectedFamilyRelation" 
                    :employeeId="selectedEmployee?.id || ''"
                    :employeeName="selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''"
                    @submit="handleFamilyRelationSubmit"
                    @close="closeFamilyFormModal" 
                />
            </div>
        </ModalDialog>
        
        <!-- Import Excel Modal -->
        <ModalDialog v-model:show="showImportModal" title="Nhập nhân viên từ Excel" size="lg" data-tour="import-modal">
            <div class="p-4">
                <p>Vui lòng tải file mẫu và điền thông tin theo đúng định dạng được cung cấp trong sheet "Hướng dẫn".</p>
                <ActionButton type="secondary" icon="fas fa-download me-2" @click="downloadExcelTemplate">
                    Tải file mẫu
                </ActionButton>
                <div class="mt-3">
                    <input type="file" ref="fileInput" @change="handleFileSelect" accept=".xlsx,.xls" class="form-control" />
                </div>
                <div class="mt-3 text-end">
                    <ActionButton type="primary" icon="fas fa-upload me-2" @click="handleImportExcel" :disabled="!fileInput">
                        Nhập dữ liệu
                    </ActionButton>
                </div>
            </div>
        </ModalDialog>
        
        <GlobalMessageModal />
        
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
.employee-name-with-status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
}

/* Override DataTable styles for employee name column */
:deep(.employee-name-with-status) {
    display: flex;
    align-items: center;
    gap: 8px;
}

:deep(.status-dot) {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
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
</style>