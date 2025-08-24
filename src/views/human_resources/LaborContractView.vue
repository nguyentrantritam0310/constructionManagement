<template>
  <div class="container-fluid py-4">
    <h2 class="mb-4">Quản lý hợp đồng lao động</h2>
    <ul class="nav nav-tabs mb-3 contract-tabs">
      <li class="nav-item">
        <button class="nav-link d-flex align-items-center" :class="{ active: activeTab === 'allContracts' }" @click="activeTab = 'allContracts'">
          <i class="fas fa-file-contract me-2"></i>
          Hợp đồng lao động
          <span class="badge bg-primary ms-2">{{ contracts.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link d-flex align-items-center" :class="{ active: activeTab === 'notCreated' }" @click="activeTab = 'notCreated'">
          <i class="fas fa-user-plus me-2"></i>
          Chưa lên hợp đồng
          <span class="badge bg-warning text-dark ms-2">{{ notCreatedContracts.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link d-flex align-items-center" :class="{ active: activeTab === 'expired' }" @click="activeTab = 'expired'">
          <i class="fas fa-calendar-times me-2"></i>
          Hợp đồng hết hạn
          <span class="badge bg-danger ms-2">{{ expiredContracts.length }}</span>
        </button>
      </li>
    </ul>
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <DataTable :columns="columnsByTab" :data="paginatedContracts">
          <template #actions="{ item }">
            <div class="d-flex justify-content-center gap-2">
              <button class="btn btn-sm btn-outline-primary" title="Xem chi tiết">
                <i class="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <Pagination :total-items="paginatedContracts.length" :items-per-page="itemsPerPage" :current-page="currentPage" @update:currentPage="handlePageChange" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'

const activeTab = ref('allContracts')

// Dữ liệu mẫu cho các tab
const contracts = ref([
  {
    id: 1,
    contractCode: 'HDLD2500001',
    appendixCode: '04/2019/HDLD-DH',
    contractType: 'Hợp đồng chính thức',
    contractForm: 'Hợp đồng 12 tháng',
    employeeCode: 'NV0002',
    employeeName: 'Trần Nha Trang',
    status: 'Còn hiệu lực',
    startDate: '2024-09-01',
    endDate: '2025-09-01',
    daysToExpire: 15
  },
  {
    id: 2,
    contractCode: 'HDLD2500002',
    appendixCode: '46/2024/HDLD-DH',
    contractType: 'Hợp đồng thử việc',
    contractForm: 'Hợp đồng 2 tháng',
    employeeCode: 'NV0224',
    employeeName: 'Nguyễn Thạc Hùng',
    status: 'Còn hiệu lực',
    startDate: '2025-07-01',
    endDate: '2025-09-01',
    daysToExpire: 10
  },
  {
    id: 3,
    contractCode: 'HDLD2500003',
    appendixCode: '13/2025/HDLDTV-DH',
    contractType: 'Hợp đồng chính thức',
    contractForm: 'Hợp đồng 12 tháng',
    employeeCode: 'NV0280',
    employeeName: 'Nguyễn Thiện Đức',
    status: 'Hết hiệu lực',
    startDate: '2024-08-01',
    endDate: '2025-08-01',
    daysToExpire: -5
  },
  {
    id: 4,
    contractCode: 'HDLD2500004',
    appendixCode: '14/2025/HDLD-DH',
    contractType: 'Hợp đồng không thời hạn',
    contractForm: 'Hợp đồng không thời hạn',
    employeeCode: 'NV0253',
    employeeName: 'Nguyễn Duy Phúc',
    status: 'Còn hiệu lực',
    startDate: '2023-01-01',
    endDate: '2026-01-01',
    daysToExpire: 120
  }
])

const employees = ref([
  { id: 'NV0002', name: 'Trần Nha Trang', joinDate: '02/01/2019' },
  { id: 'NV0224', name: 'Nguyễn Thạc Hùng', joinDate: '05/03/2022' },
  { id: 'NV0280', name: 'Nguyễn Thiện Đức', joinDate: '10/10/2020' },
  { id: 'NV0253', name: 'Nguyễn Duy Phúc', joinDate: '15/05/2021' },
  { id: 'NV0300', name: 'Lê Thị Mai', joinDate: '01/06/2023' }, // chưa lên hợp đồng
  { id: 'NV0311', name: 'Phạm Văn An', joinDate: '20/07/2024' } // chưa lên hợp đồng
])

const expiredContracts = computed(() => contracts.value.filter(c => c.status === 'Hết hiệu lực'))
const notCreatedContracts = computed(() => employees.value.filter(e => !contracts.value.some(c => c.employeeCode === e.id)))

const contractColumns = [
  { key: 'contractCode', label: 'Số hợp đồng' },
  { key: 'appendixCode', label: 'Số phụ lục' },
  { key: 'contractForm', label: 'Hình thức hợp đồng' },
  { key: 'contractType', label: 'Loại hợp đồng' },
  { key: 'employeeCode', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
]

const notCreatedColumns = [
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'name', label: 'Tên nhân viên' },
  { key: 'joinDate', label: 'Ngày vào làm' },
]

const expiredColumns = [
  { key: 'employeeCode', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'contractCode', label: 'Số hợp đồng' },
  { key: 'appendixCode', label: 'Số phụ lục' },
  { key: 'contractType', label: 'Loại hợp đồng' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
  { key: 'daysToExpire', label: 'Số ngày đến hạn' },
]

const currentPage = ref(1)
const itemsPerPage = 20

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  if (activeTab.value === 'allContracts') return contracts.value.slice(start, end)
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
