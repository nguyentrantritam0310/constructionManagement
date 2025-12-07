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
    createMultipleEmployees,
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

const handleDeleteEmployee = (id) => {
    employeeToDelete.value = id
    showDeleteConfirmModal.value = true
}

const confirmDeleteEmployee = async () => {
    if (!employeeToDelete.value) {
        return
    }
    
    const id = employeeToDelete.value
    showDeleteConfirmModal.value = false
    employeeToDelete.value = null
    
    try {
        await deleteEmployee(id)
        showMessage('Xóa nhân viên thành công!', 'success')
        await fetchAllEmployees() // Refresh the list
    } catch (err) {
        showMessage(`Lỗi: ${err.message || 'Có lỗi xảy ra khi xóa nhân viên'}`, 'error')
    }
}

const cancelDeleteEmployee = () => {
    showDeleteConfirmModal.value = false
    employeeToDelete.value = null
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
const showDeleteConfirmModal = ref(false)
const employeeToDelete = ref(null)

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

const showDeleteFamilyConfirmModal = ref(false)
const familyRelationToDelete = ref(null)

const handleDeleteFamilyRelation = (relationId) => {
    familyRelationToDelete.value = relationId
    showDeleteFamilyConfirmModal.value = true
}

const confirmDeleteFamilyRelation = async () => {
    if (!familyRelationToDelete.value) {
        return
    }
    
    const relationId = familyRelationToDelete.value
    showDeleteFamilyConfirmModal.value = false
    familyRelationToDelete.value = null
    
    try {
        await deleteFamilyRelation(relationId, selectedEmployee.value.id)
        showMessage('Xóa quan hệ gia đình thành công!', 'success')
        await fetchFamilyRelationsByEmployeeId(selectedEmployee.value.id)
        selectedRelations.value = familyRelations.value
    } catch (err) {
        showMessage(`Lỗi: ${err.message}`, 'error')
    }
}

const cancelDeleteFamilyRelation = () => {
    showDeleteFamilyConfirmModal.value = false
    familyRelationToDelete.value = null
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

    // Process data to remove HTML from employeeName
    const exportData = employeesData.value.map(row => {
        // Extract plain text from employeeName (remove HTML tags)
        // Or use firstName + lastName directly
        const plainEmployeeName = row.firstName && row.lastName 
            ? `${row.firstName} ${row.lastName}`.trim()
            : (row.employeeName || '').replace(/<[^>]*>/g, '').trim()
        
        return {
            ...row,
            employeeName: plainEmployeeName
        }
    })

    exportData.forEach(row => {
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


// Import Excel functions
const selectedFile = ref(null)

const downloadExcelTemplate = async () => {
  // Ensure roles are loaded before creating template
  if (!roles.value || roles.value.length === 0) {
    await fetchAllRoles()
  }

  const workbook = new ExcelJS.Workbook()

  // --- Sheet 1: Dữ liệu nhập ---
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập')
  const headers = [
    { header: 'Mã nhân viên', key: 'employeeCode', width: 20 },
    { header: 'Họ và tên đệm', key: 'lastName', width: 25 },
    { header: 'Tên', key: 'firstName', width: 20 },
    { header: 'Ngày sinh', key: 'birthday', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Số điện thoại', key: 'phone', width: 15 },
    { header: 'Ngày vào làm', key: 'joinDate', width: 15 },
    { header: 'Giới tính', key: 'gender', width: 12 },
    { header: 'Chức danh', key: 'roleID', width: 15 },
    { header: 'Trạng thái', key: 'status', width: 15 },
  ]
  dataSheet.columns = headers

  // Style header
  dataSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })

  // Add example row
  dataSheet.addRow({
    employeeCode: 'NV001',
    lastName: 'Nguyễn Văn',
    firstName: 'An',
    birthday: '1990-01-15',
    email: 'nguyenvanan@example.com',
    phone: '0912345678',
    joinDate: '2024-01-01',
    gender: 'Nam',
    roleID: 1,
    status: 0
  })

  // --- Sheet 2: Hướng dẫn ---
  const instructionSheet = workbook.addWorksheet('Hướng dẫn')
  instructionSheet.columns = [
    { header: 'Tên cột', key: 'column', width: 20 },
    { header: 'Mô tả', key: 'description', width: 50 },
    { header: 'Bắt buộc', key: 'required', width: 15 },
    { header: 'Ví dụ', key: 'example', width: 30 },
  ]

  // Style header for instruction sheet
  instructionSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }
  })

  // Add instruction data
  instructionSheet.addRows([
    { column: 'Mã nhân viên', description: 'Mã định danh duy nhất cho nhân viên. Chỉ chứa chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-20 ký tự.', required: 'Có', example: 'NV001' },
    { column: 'Họ và tên đệm', description: 'Họ và tên đệm của nhân viên. Chỉ chứa chữ cái, dấu tiếng Việt và khoảng trắng, độ dài 1-50 ký tự.', required: 'Có', example: 'Nguyễn Văn' },
    { column: 'Tên', description: 'Tên của nhân viên. Chỉ chứa chữ cái và dấu tiếng Việt, độ dài 1-30 ký tự.', required: 'Có', example: 'An' },
    { column: 'Ngày sinh', description: 'Ngày sinh của nhân viên. Định dạng YYYY-MM-DD.', required: 'Có', example: '1990-01-15' },
    { column: 'Email', description: 'Địa chỉ email của nhân viên. Phải đúng định dạng email.', required: 'Có', example: 'nguyenvanan@example.com' },
    { column: 'Số điện thoại', description: 'Số điện thoại Việt Nam. 10 số, bắt đầu bằng 0.', required: 'Có', example: '0912345678' },
    { column: 'Ngày vào làm', description: 'Ngày nhân viên bắt đầu làm việc. Định dạng YYYY-MM-DD.', required: 'Có', example: '2024-01-01' },
    { column: 'Giới tính', description: 'Giới tính của nhân viên. Chỉ nhận giá trị: Nam, Nữ, Khác.', required: 'Có', example: 'Nam' },
    { column: 'Chức danh', description: 'ID của chức danh trong hệ thống. Là một số nguyên dương. Xem sheet "Danh sách chức danh" để tra cứu ID phù hợp.', required: 'Có', example: '1' },
    { column: 'Trạng thái', description: 'Trạng thái làm việc của nhân viên. 0 = Đang làm việc, 1 = Nghỉ việc, 2 = Nghỉ thai sản. Mặc định là 0.', required: 'Không', example: '0' },
  ])

  // Auto-fit columns for instruction sheet
  instructionSheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, val.length)
    })
    column.width = Math.max(column.width, maxLength + 2)
  })

  // --- Sheet 3: Danh sách chức danh ---
  const rolesSheet = workbook.addWorksheet('Danh sách chức danh')
  rolesSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tên chức danh', key: 'roleName', width: 30 },
  ]

  // Style header for roles sheet
  rolesSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })

  // Add roles data
  if (roles.value && roles.value.length > 0) {
    roles.value.forEach(role => {
      rolesSheet.addRow({
        id: role.id || role.ID,
        roleName: role.roleName || role.RoleName
      })
    })
  } else {
    // If roles not loaded, add a note
    rolesSheet.addRow({
      id: 'N/A',
      roleName: 'Vui lòng tải lại file sau khi hệ thống đã tải danh sách chức danh'
    })
  }

  // Style data rows for roles sheet
  rolesSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber !== 1) {
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      })
    }
  })

  // Generate and download file
  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Mau_Nhap_Nhan_Vien.xlsx')
}

const handleFileSelect = (event) => {
  const target = event.target
  if (target && target.files) {
    selectedFile.value = target.files[0]
  }
}

const handleImportExcel = async () => {
  if (!selectedFile.value) {
    showMessage('Vui lòng chọn file Excel', 'error')
    return
  }
  
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Find the data sheet (prefer "Dữ liệu nhập", fallback to first sheet)
        let sheetName = workbook.SheetNames.find(name => name.includes('Dữ liệu nhập') || name.includes('Dữ liệu'))
        if (!sheetName) {
          sheetName = workbook.SheetNames[0]
        }
        
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        if (jsonData.length === 0) {
          showMessage('File Excel không có dữ liệu.', 'error')
          return
        }

        // Map Excel columns to employee data
        const employeesToCreate = []
        const errors = []
        
        jsonData.forEach((row, index) => {
          try {
            // Map column names (handle both Vietnamese and English)
            const employeeData = {
              employeeCode: row['Mã nhân viên'] || row['employeeCode'] || '',
              lastName: row['Họ và tên đệm'] || row['lastName'] || '',
              firstName: row['Tên'] || row['firstName'] || '',
              birthday: row['Ngày sinh'] || row['birthday'] || '',
              email: row['Email'] || row['email'] || '',
              phone: row['Số điện thoại'] || row['phone'] || '',
              joinDate: row['Ngày vào làm'] || row['joinDate'] || '',
              gender: row['Giới tính'] || row['gender'] || '',
              roleID: row['Chức danh'] || row['roleID'] || '',
              status: row['Trạng thái'] !== undefined ? row['Trạng thái'] : (row['status'] !== undefined ? row['status'] : 0)
            }

            // Validate required fields before formatting
            if (!employeeData.employeeCode || !employeeData.employeeCode.trim()) {
              errors.push(`Dòng ${index + 2}: Thiếu mã nhân viên`)
              return
            }
            if (!employeeData.lastName || !employeeData.lastName.trim()) {
              errors.push(`Dòng ${index + 2}: Thiếu họ và tên đệm`)
              return
            }
            if (!employeeData.firstName || !employeeData.firstName.trim()) {
              errors.push(`Dòng ${index + 2}: Thiếu tên`)
              return
            }
            if (!employeeData.email || !employeeData.email.trim()) {
              errors.push(`Dòng ${index + 2}: Thiếu email`)
              return
            }
            if (!employeeData.phone || !employeeData.phone.trim()) {
              errors.push(`Dòng ${index + 2}: Thiếu số điện thoại`)
              return
            }
            if (!employeeData.roleID) {
              errors.push(`Dòng ${index + 2}: Thiếu chức danh`)
              return
            }
            if (!employeeData.birthday) {
              errors.push(`Dòng ${index + 2}: Thiếu ngày sinh`)
              return
            }
            if (!employeeData.joinDate) {
              errors.push(`Dòng ${index + 2}: Thiếu ngày vào làm`)
              return
            }
            if (!employeeData.gender || !employeeData.gender.trim()) {
              errors.push(`Dòng ${index + 2}: Thiếu giới tính`)
              return
            }

            // Format the employee data using formatEmployeeForSubmit
            // This will also validate dates and roleID
            const formattedEmployee = formatEmployeeForSubmit(employeeData)
            employeesToCreate.push(formattedEmployee)
          } catch (error) {
            errors.push(`Dòng ${index + 2}: ${error.message}`)
          }
        })
        
        // If there are validation errors, show them
        if (errors.length > 0) {
          const errorMessage = `Có ${errors.length} lỗi validation:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... và ${errors.length - 10} lỗi khác` : ''}`
          showMessage(errorMessage, 'error')
          return
        }

        if (employeesToCreate.length === 0) {
          showMessage('Không tìm thấy dữ liệu hợp lệ trong file.', 'error')
          return
        }

        // Create multiple employees
        try {
          await createMultipleEmployees(employeesToCreate)
          showMessage(`Đã thêm thành công ${employeesToCreate.length} nhân viên.`, 'success')
        } catch (error) {
          // Error message already shown by createMultipleEmployees
          console.error('Error creating employees:', error)
          // Don't throw here, let the user see the error message
        }
        selectedFile.value = null
        showImportModal.value = false
        await fetchAllEmployees()
      } catch (error) {
        console.error('Lỗi khi xử lý file Excel:', error)
        const errorMessage = error.message || 'Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.'
        showMessage(errorMessage, 'error')
      }
    }
    reader.readAsArrayBuffer(selectedFile.value)
  } catch (error) {
    console.error('Lỗi khi đọc file:', error)
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

                <hr class="my-4">

                <h5>Tải lên file đã điền</h5>
                <div class="input-group">
                    <input type="file" @change="handleFileSelect" accept=".xlsx, .xls" class="form-control">
                    <button class="btn btn-primary" @click="handleImportExcel" :disabled="!selectedFile">
                        <i class="fas fa-upload me-2"></i>
                        Xử lý
                    </button>
                </div>
            </div>
        </ModalDialog>
        
        <GlobalMessageModal />
        
        <!-- Delete Employee Confirmation Modal -->
        <ModalDialog 
            :show="showDeleteConfirmModal" 
            title="Xác nhận xóa" 
            size="sm"
            @update:show="cancelDeleteEmployee"
        >
            <div class="text-center py-3">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                <p class="mb-0">Bạn có chắc chắn muốn xóa nhân viên này?</p>
            </div>
            <div class="d-flex justify-content-center gap-2 mt-3">
                <button class="btn btn-secondary" @click="cancelDeleteEmployee">
                    Hủy
                </button>
                <button class="btn btn-danger" @click="confirmDeleteEmployee">
                    <i class="fas fa-trash me-2"></i>
                    Xóa
                </button>
            </div>
        </ModalDialog>
        
        <!-- Delete Family Relation Confirmation Modal -->
        <ModalDialog 
            :show="showDeleteFamilyConfirmModal" 
            title="Xác nhận xóa" 
            size="sm"
            @update:show="cancelDeleteFamilyRelation"
        >
            <div class="text-center py-3">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                <p class="mb-0">Bạn có chắc chắn muốn xóa quan hệ gia đình này?</p>
            </div>
            <div class="d-flex justify-content-center gap-2 mt-3">
                <button class="btn btn-secondary" @click="cancelDeleteFamilyRelation">
                    Hủy
                </button>
                <button class="btn btn-danger" @click="confirmDeleteFamilyRelation">
                    <i class="fas fa-trash me-2"></i>
                    Xóa
                </button>
            </div>
        </ModalDialog>
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