<template>
  <div class="container-fluid py-4">
    <h2 class="mb-4">Quản lý hợp đồng lao động</h2>
    <TabBar :tabs="tabs" :activeTab="activeTab" @update:activeTab="activeTab = $event" />
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <DataTable :columns="columnsByTab" :data="paginatedContracts">
          <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="openUpdateForm(item.id)" />
          <ChangeStatusButton @click.stop="openStatusDialog(item)" />
        </div>
      </template>
        </DataTable>
      </div>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <Pagination :total-items="paginatedContracts.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>
    <button class="btn btn-success mb-3" @click="openAddContractForm">
      <i class="fas fa-plus me-1"></i> Thêm hợp đồng
    </button>
    <ModalDialog :show="showContractModal" title="Thêm/Cập nhật hợp đồng" size="xl" @update:show="closeContractModal">
      <ContractForm
        :mode="contractFormMode"
        :contract="selectedContractForm"
        :employees="employees"
        :contractTypes="contractTypes"
        :contractForms="contractForms"
        :allowances="allowances"
        @submit="handleContractSubmit"
        @close="closeContractModal"
      />
    </ModalDialog>
    
    <GlobalMessageModal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TabBar from '../../components/common/TabBar.vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import ContractForm from '../../components/common/contract/ContractForm.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import { useContract } from '../../composables/useContract.js'
import { useEmployee } from '../../composables/useEmployee.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'
import GlobalMessageModal from '@/components/common/GlobalMessageModal.vue'

const activeTab = ref('allContracts')

const tabs = [
  { key: 'allContracts', label: 'Hợp đồng lao động', icon: 'fas fa-file-contract' },
  { key: 'notCreated', label: 'Chưa lên hợp đồng', icon: 'fas fa-user-plus' },
  { key: 'expired', label: 'Hợp đồng hết hạn', icon: 'fas fa-calendar-times' }
]
const { 
  contracts,
  employeesWithoutContract, 
  contractTypes,
  contractForms,
  allowances,
  loading, 
  error, 
  fetchAllContracts, 
  fetchEmployeesWithoutContract,
  fetchContractTypes,
  fetchContractForms,
  fetchAllowances,
  createContract,
  updateContract,
  formatContractForSubmit
} = useContract()
const { employees, fetchAllEmployees } = useEmployee()
const { showMessage } = useGlobalMessage()
onMounted(async () => {
  await Promise.all([
    fetchAllContracts(),
    fetchEmployeesWithoutContract(),
    fetchAllEmployees(),
    fetchContractTypes(),
    fetchContractForms(),
    fetchAllowances()
  ])
})
const today = new Date()
const endDt = null
const contractsData = computed(() => {
  const today = new Date()
  return contracts.value.map((c, index) => {
    const end = new Date(c.endDate)
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return {
      ...c,
      stt: index + 1,
      daysToExpire: daysLeft // 👈 thêm trường này
    }
  })
})

const employeesData = computed(() => {
  return employees.value.map((machine, index) => ({
    ...machine,
    stt: index + 1,
  }))
})


// Sử dụng contractsData để có trường daysToExpire cho bảng
const expiredContracts = computed(() => {
  return contractsData.value.filter(c => c.daysToExpire <= 10)
})

const notCreatedContracts = computed(() => {
  return employeesWithoutContract.value.map((machine, index) => ({
    ...machine,
    stt: index + 1,
  }))
})

const contractColumns = [
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'contractFormName', label: 'Hình thức hợp đồng' },
  { key: 'contractTypeName', label: 'Loại hợp đồng' },
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
]

const notCreatedColumns = [
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'birthday', label: 'Ngày sinh' },
  { key: 'joinDate', label: 'Ngày vào làm' },
]

const expiredColumns = [
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'contractTypeName', label: 'Loại hợp đồng' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
  { key: 'daysToExpire', label: 'Số ngày đến hạn' },
]

const currentPage = ref(1)
const itemsPerPage = 20

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  if (activeTab.value === 'allContracts') return contractsData.value.slice(start, end)
  if (activeTab.value === 'notCreated') return notCreatedContracts.value.slice(start, end)
  if (activeTab.value === 'expired') return expiredContracts.value.slice(start, end)
  return []
})

const columnsByTab = computed(() => {
  if (activeTab.value === 'allContracts') return contractColumns
  if (activeTab.value === 'notCreated') return notCreatedColumns
  if (activeTab.value === 'expired') return expiredColumns
  return []
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const showContractModal = ref(false)
const selectedContractForm = ref(null)
const contractFormMode = ref('create')
// Remove hardcoded data - now using data from API

const openAddContractForm = () => {
  selectedContractForm.value = null
  contractFormMode.value = 'create'
  showContractModal.value = true
}
const openUpdateForm = (id) => {
  const contract = contracts.value.find(c => c.id === id)
  selectedContractForm.value = contract
  contractFormMode.value = 'update'
  showContractModal.value = true
}
const closeContractModal = () => {
  showContractModal.value = false
  selectedContractForm.value = null
}
const handleContractSubmit = async (data) => {
  try {
    const formattedData = formatContractForSubmit(data)
    
    if (contractFormMode.value === 'create') {
      await createContract(formattedData)
      showMessage('Tạo hợp đồng thành công!', 'success')
    } else {
      await updateContract(formattedData)
      showMessage('Cập nhật hợp đồng thành công!', 'success')
    }
    
    closeContractModal()
  } catch (err) {
    console.error('Error submitting contract:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}
</script>

<style scoped>
.contract-tabs .nav-link {
  min-width: 180px;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;
}

.contract-tabs .nav-link.active {
  background: #e9ecef;
  border-bottom: 2px solid #0d6efd;
  color: #0d6efd;
}

.contract-tabs .badge {
  font-size: 0.95em;
  vertical-align: middle;
}

.card {
  border-radius: 0.75rem;
  border: none;
}

.card-body {
  padding: 0;
}

@media (max-width: 768px) {
  .contract-tabs .nav-link {
    font-size: 0.95rem;
    min-width: 120px;
    padding: 0.5rem 0.5rem;
  }

  .card {
    border-radius: 0.5rem;
  }
}
</style>
