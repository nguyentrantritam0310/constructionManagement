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
    return employeesData.value.slice(start, end)
})

const handlePageChange = (page) => {
    currentPage.value = page
}

// Handle cell click for navigation
const handleCellClick = (item, column) => {
    if (column.key === 'id' && column.link) {
        // Navigate to employee profile
        router.push({ name: 'employee-profile', params: { employeeId: item.id } })
    }
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

</script>

<template>
    <div class="container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="mb-0">Quản lý nhân sự</h2>
            <div class="d-flex gap-2">
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
        <DataTable v-else :columns="columns" :data="paginatedEmployees" @cell-click="handleCellClick">
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
                    ></ActionButton>
                </div>
            </template>
        </DataTable>
        <!-- Pagination -->
        <div v-if="!loading && !error && employeesData.length > 0" class="d-flex justify-content-end mt-3">
            <Pagination :total-items="employeesData.length" :items-per-page="itemsPerPage" :current-page="currentPage"
                @update:currentPage="handlePageChange" />
        </div>
        <ModalDialog :title="employeeFormMode === 'create' ? 'Thêm hồ sơ nhân viên' : 'Cập nhật hồ sơ nhân viên'" :show="showEmployeeModal" size="lg" @update:show="closeEmployeeModal">
            <EmployeeForm :mode="employeeFormMode" :employee="selectedEmployeeForm" :roles="roles" @submit="handleEmployeeSubmit"
                @close="closeEmployeeModal" />
        </ModalDialog>
        <ModalDialog :show="showFamilyModal" title="Quan hệ gia đình" size="lg"
            @update:show="closeFamilyModal">
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
                ]" :data="selectedRelations">
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
            <FamilyRelationForm 
                :mode="familyFormMode" 
                :familyRelation="selectedFamilyRelation" 
                :employeeId="selectedEmployee?.id || ''"
                :employeeName="selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''"
                @submit="handleFamilyRelationSubmit"
                @close="closeFamilyFormModal" 
            />
        </ModalDialog>
        
        <GlobalMessageModal />
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
</style>