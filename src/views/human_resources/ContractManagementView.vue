<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ContractForm from '../../components/common/contract/ContractForm.vue'
import { useContract } from '../../composables/useContract'
import { useEmployee } from '../../composables/useEmployee'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import ActionButton from '@/components/common/ActionButton.vue'
import GlobalMessageModal from '@/components/common/GlobalMessageModal.vue'

const {
  contracts,
  contractTypes,
  contractForms,
  allowances,
  loading,
  error,
  fetchAllContracts,
  fetchContractTypes,
  fetchContractForms,
  fetchAllowances,
  createContract,
  updateContract,
  deleteContract,
  formatContractForSubmit
} = useContract()

const {
  employees,
  fetchAllEmployees
} = useEmployee()

const { showMessage } = useGlobalMessage()

onMounted(async () => {
  await Promise.all([
    fetchAllContracts(),
    fetchAllEmployees(),
    fetchContractTypes(),
    fetchContractForms(),
    fetchAllowances()
  ])
  console.log('Data loaded:', { contracts: contracts.value, employees: employees.value })
})

const showContractModal = ref(false)
const selectedContractForm = ref(null)
const contractFormMode = ref('create')

const openAddContractForm = () => {
  selectedContractForm.value = null
  contractFormMode.value = 'create'
  showContractModal.value = true
}

const openUpdateForm = (id) => {
  const contract = contracts.value.find(c => c.id === id)
  console.log('Found contract for update:', contract)
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

const handleDeleteContract = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
    try {
      await deleteContract(id)
      showMessage('Xóa hợp đồng thành công!', 'success')
    } catch (err) {
      console.error('Error deleting contract:', err)
      showMessage(`Lỗi: ${err.message}`, 'error')
    }
  }
}

const contractsData = computed(() => {
  return contracts.value.map((contract) => ({
    ...contract,
    startDate: new Date(contract.startDate).toLocaleDateString('vi-VN'),
    endDate: new Date(contract.endDate).toLocaleDateString('vi-VN'),
    contractSalary: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(contract.contractSalary)
  }))
})

const columns = [
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'employeeName', label: 'Nhân viên' },
  { key: 'contractTypeName', label: 'Loại hợp đồng' },
  { key: 'contractFormName', label: 'Hình thức' },
  { key: 'startDate', label: 'Từ ngày' },
  { key: 'endDate', label: 'Đến ngày' },
  { key: 'contractSalary', label: 'Lương hợp đồng' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'approveStatus', label: 'Duyệt' }
]

const currentPage = ref(1)
const itemsPerPage = 8

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return contractsData.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="container-fluid py-4">
    <h2 class="mb-4">Quản lý hợp đồng lao động</h2>
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="openAddContractForm">
          Thêm hợp đồng
        </ActionButton>
        
        <div class="d-flex gap-2">
          <ActionButton type="info" icon="fas fa-download me-2">
            Xuất Excel
          </ActionButton>
          <ActionButton type="secondary" icon="fas fa-print me-2">
            In danh sách
          </ActionButton>
        </div>
      </div>

      <DataTable :columns="columns" :data="paginatedContracts">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start gap-2">
            <ActionButton @click.stop="openUpdateForm(item.id)" type="success" icon="fas fa-pen-to-square"></ActionButton>
            <ActionButton @click.stop="handleDeleteContract(item.id)" type="danger" icon="fas fa-trash"></ActionButton>
            <ActionButton @click.stop="() => {}" type="info" icon="fas fa-eye"></ActionButton>
          </div>
        </template>
      </DataTable>

      <div class="d-flex justify-content-end mt-3">
        <Pagination 
          :total-items="contracts.length" 
          :items-per-page="itemsPerPage" 
          :current-page="currentPage"
          @update:currentPage="handlePageChange" 
        />
      </div>
    </div>

    <ModalDialog 
      :title="contractFormMode === 'create' ? 'Thêm hợp đồng lao động' : 'Cập nhật hợp đồng lao động'" 
      :show="showContractModal" 
      size="xl" 
      @update:show="closeContractModal"
    >
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

<style scoped>
.container-fluid {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table {
  background: white;
}

.btn {
  border-radius: 6px;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>

