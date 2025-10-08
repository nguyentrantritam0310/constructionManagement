<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import EmployeeForm from '../../components/common/employee/EmployeeForm.vue'
import FamilyRelationForm from '../../components/common/family/FamilyRelationForm.vue'
// ...existing code...
const showEmployeeModal = ref(false)
const selectedEmployeeForm = ref(null)
const employeeFormMode = ref('create')
// roles will be loaded from API

const openAddEmployeeForm = () => {
    selectedEmployeeForm.value = null
    employeeFormMode.value = 'create'
    showEmployeeModal.value = true
}

const openUpdateForm = (id) => {
    const emp = employees.value.find(e => e.id === id)
    console.log('Found employee for update:', emp)
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
            showMessage('Tạo nhân viên thành công!', 'success')
        } else {
            await updateEmployee(formattedData)
            showMessage('Cập nhật nhân viên thành công!', 'success')
        }
        
        closeEmployeeModal()
    } catch (err) {
        console.error('Error submitting employee:', err)
        showMessage(`Lỗi: ${err.message}`, 'error')
    }
}

const handleDeleteEmployee = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
        try {
            await deleteEmployee(id)
            showMessage('Xóa nhân viên thành công!', 'success')
        } catch (err) {
            console.error('Error deleting employee:', err)
            showMessage(`Lỗi: ${err.message}`, 'error')
        }
    }
}
import { useEmployee } from '../../composables/useEmployee'
import { useFamilyRelation } from '../../composables/useFamilyRelation'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import ActionButton from '@/components/common/ActionButton.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import GlobalMessageModal from '@/components/common/GlobalMessageModal.vue'

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

onMounted(async () => {
    await Promise.all([
        fetchAllEmployees(),
        fetchAllRoles()
    ])
    console.log('Roles loaded:', roles.value)
    console.log('Employees loaded:', employees.value)
})
const activeTab = ref('employeeList')

const employeesData = computed(() => {
    return employees.value
        .map((employee) => ({
            ...employee,
            birthday: new Date(employee.birthday)
                .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            joinDate: new Date(employee.joinDate)
                .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        }))
})

const columns = [
    { key: 'employeeCode', label: 'Mã nhân viên' },
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
        
        // Refresh the family relations list
        if (selectedEmployee.value) {
            await fetchFamilyRelationsByEmployeeId(selectedEmployee.value.id)
            selectedRelations.value = familyRelations.value
        }
    } catch (err) {
        console.error('Error submitting family relation:', err)
        showMessage(`Lỗi: ${err.message}`, 'error')
    }
}

const handleDeleteFamilyRelation = async (relationId) => {
    if (confirm('Bạn có chắc chắn muốn xóa quan hệ gia đình này?')) {
        try {
            await deleteFamilyRelation(relationId, selectedEmployee.value.id)
            showMessage('Xóa quan hệ gia đình thành công!', 'success')
            // Refresh the family relations list
            await fetchFamilyRelationsByEmployeeId(selectedEmployee.value.id)
            selectedRelations.value = familyRelations.value
        } catch (err) {
            console.error('Error deleting family relation:', err)
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

</script>

<template>
    <div class="container-fluid py-4">
        <h2 class="mb-4">Quản lý nhân sự</h2>
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="openAddEmployeeForm">
            Thêm
        </ActionButton>
        
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
        <DataTable v-else :columns="columns" :data="paginatedEmployees">
            <template #actions="{ item }">
                <div class="d-flex justify-content-start gap-2">
                    <ActionButton @click.stop="openUpdateForm(item.id)" type="success" icon="fas fa-pen-to-square"></ActionButton>
                    <ActionButton @click.stop="handleDeleteEmployee(item.id)" type="danger" icon="fas fa-trash"></ActionButton>
                    <ActionButton @click.stop="openFamilyModal(item)" icon="fas fa-people-group"></ActionButton>
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
                            <ActionButton @click.stop="handleEditFamilyRelation(item)" type="warning" icon="fas fa-pen-to-square" size="sm"></ActionButton>
                            <ActionButton @click.stop="handleDeleteFamilyRelation(item.id)" type="danger" icon="fas fa-trash" size="sm"></ActionButton>
                        </div>
                    </template>
                </DataTable>
                <div class="mt-3 text-end">
                    <ActionButton @click="handleAddFamilyRelation" type="success" icon="fas fa-plus">
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