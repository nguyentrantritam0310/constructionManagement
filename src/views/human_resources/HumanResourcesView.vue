<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'

const activeTab = ref('employeeList')

const employees = ref([
    { id: 'NV0001', name: 'Nguyễn Văn A', birthday: '01/01/1985', joinDate: '01/01/2015', position: 'Giám đốc', department: 'Ban Giám đốc' },
    { id: 'NV0002', name: 'Trần Nha Trang', birthday: '20/10/1990', joinDate: '02/01/2019', position: 'Phó Tổng Giám đốc phụ trách Kinh doanh', department: 'Tổ Trợ lý' },
    { id: 'NV0003', name: 'Lê Thị B', birthday: '15/03/1988', joinDate: '10/05/2016', position: 'Kế toán trưởng', department: 'Phòng Kế toán' },
    { id: 'NV0004', name: 'Phạm Văn C', birthday: '22/07/1992', joinDate: '12/09/2018', position: 'Trưởng phòng Nhân sự', department: 'Phòng Nhân sự' },
    { id: 'NV0005', name: 'Hoàng Thị D', birthday: '30/11/1991', joinDate: '05/02/2020', position: 'Chuyên viên Nhân sự', department: 'Phòng Nhân sự' }
])

const familyRelations = ref([
    // NV0001
    { id: 1, employeeId: 'NV0001', relation: 'Vợ', relativeName: 'Trần Thị M', fromDate: '2010-01-01', toDate: '2030-01-01' },
    { id: 2, employeeId: 'NV0001', relation: 'Con', relativeName: 'Nguyễn Văn B', fromDate: '2012-05-10', toDate: '2030-01-01' },
    { id: 3, employeeId: 'NV0001', relation: 'Con', relativeName: 'Nguyễn Thị C', fromDate: '2015-09-20', toDate: '2030-01-01' },
    // NV0002
    { id: 4, employeeId: 'NV0002', relation: 'Vợ', relativeName: 'Lê Thị D', fromDate: '2011-03-15', toDate: '2030-01-01' },
    { id: 5, employeeId: 'NV0002', relation: 'Con', relativeName: 'Trần Văn E', fromDate: '2013-07-22', toDate: '2030-01-01' },
    { id: 6, employeeId: 'NV0002', relation: 'Con', relativeName: 'Trần Thị F', fromDate: '2016-12-01', toDate: '2030-01-01' },
    // NV0003
    { id: 7, employeeId: 'NV0003', relation: 'Chồng', relativeName: 'Phạm Văn G', fromDate: '2014-04-10', toDate: '2030-01-01' },
    { id: 8, employeeId: 'NV0003', relation: 'Con', relativeName: 'Lê Văn H', fromDate: '2017-08-25', toDate: '2030-01-01' },
    { id: 9, employeeId: 'NV0003', relation: 'Con', relativeName: 'Lê Thị I', fromDate: '2019-11-30', toDate: '2030-01-01' },
    // NV0004
    { id: 10, employeeId: 'NV0004', relation: 'Vợ', relativeName: 'Hoàng Thị J', fromDate: '2012-02-14', toDate: '2030-01-01' },
    { id: 11, employeeId: 'NV0004', relation: 'Con', relativeName: 'Phạm Văn K', fromDate: '2015-06-18', toDate: '2030-01-01' },
    { id: 12, employeeId: 'NV0004', relation: 'Con', relativeName: 'Phạm Thị L', fromDate: '2018-10-05', toDate: '2030-01-01' },
    // NV0005
    { id: 13, employeeId: 'NV0005', relation: 'Chồng', relativeName: 'Ngô Văn M', fromDate: '2013-03-22', toDate: '2030-01-01' },
    { id: 14, employeeId: 'NV0005', relation: 'Con', relativeName: 'Hoàng Văn N', fromDate: '2016-07-12', toDate: '2030-01-01' },
    { id: 15, employeeId: 'NV0005', relation: 'Con', relativeName: 'Hoàng Thị O', fromDate: '2019-09-28', toDate: '2030-01-01' }
])

const columns = [
    { key: 'id', label: 'Mã nhân viên' },
    { key: 'name', label: 'Tên nhân viên' },
    { key: 'birthday', label: 'Ngày sinh' },
    { key: 'joinDate', label: 'Ngày vào làm' },
    { key: 'position', label: 'Chức danh' },
    { key: 'department', label: 'Phòng ban' }
]

const currentPage = ref(1)
const itemsPerPage = 20

const showFamilyModal = ref(false)
const selectedEmployee = ref(null)
const selectedRelations = ref([])

const openFamilyModal = (employee) => {
    selectedEmployee.value = employee
    selectedRelations.value = familyRelations.value.filter(rel => rel.employeeId === employee.id)
    showFamilyModal.value = true
}
const closeFamilyModal = () => {
    showFamilyModal.value = false
    selectedEmployee.value = null
    selectedRelations.value = []
}

const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return employees.value.slice(start, end)
})

const handlePageChange = (page) => {
    currentPage.value = page
}

const groupedFamilyRelations = computed(() => {
    const groups = {}
    familyRelations.value.forEach(rel => {
        if (!groups[rel.employeeId]) groups[rel.employeeId] = []
        groups[rel.employeeId].push(rel)
    })
    return groups
})

const getEmployeeName = (employeeId) => {
    const emp = employees.value.find(e => e.id === employeeId)
    return emp ? emp.name : ''
}

const expandedRows = ref([])
const employeesWithFamily = computed(() =>
    employees.value.filter(emp => familyRelations.value.some(rel => rel.employeeId === emp.id))
)
const toggleExpand = (id) => {
    const idx = expandedRows.value.indexOf(id)
    if (idx > -1) expandedRows.value.splice(idx, 1)
    else expandedRows.value.push(id)
}
</script>

<template>
    <div class="container-fluid py-4">
        <h2 class="mb-4">Quản lý nhân sự</h2>
    <DataTable :columns="columns" :data="paginatedEmployees">
            <template #actions="{ item }">
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-outline-primary" @click.stop="openFamilyModal(item)" title="Xem quan hệ gia đình">
                        <i class="fas fa-users"></i>
                    </button>
                </div>
            </template>
        </DataTable>
        <div class="d-flex justify-content-end mt-3">
            <Pagination :total-items="employees.length" :items-per-page="itemsPerPage" :current-page="currentPage"
                @update:currentPage="handlePageChange" />
        </div>
        <ModalDialog
            :show="showFamilyModal"
            title="Quan hệ gia đình - {{ selectedEmployee?.name || '' }}"
            size="lg"
            @update:show="closeFamilyModal"
        >
            <DataTable
                :columns="[
                    { key: 'relativeName', label: 'Tên người quan hệ' },
                    { key: 'relation', label: 'Mối quan hệ' },
                    { key: 'fromDate', label: 'Từ ngày' },
                    { key: 'toDate', label: 'Đến ngày' }
                ]"
                :data="selectedRelations"
            />
            <div class="mt-3 text-end">
                <button class="btn btn-success" @click="() => {}">
                    <i class="fas fa-plus me-1"></i> Thêm quan hệ gia đình
                </button>
            </div>
        </ModalDialog>
    </div>
</template>