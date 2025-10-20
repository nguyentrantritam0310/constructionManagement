<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import TimeFilter from '../../components/common/TimeFilter.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import { useSalary } from '../../composables/useSalary.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'
import { useAuth } from '../../composables/useAuth.js'

const activeTab = ref('salary')
const tabs = [
  { key: 'salary', label: 'Quản lý bảng lương' },
  { key: 'personalSalary', label: 'Bảng lương cá nhân' },
  { key: 'insurance', label: 'Bảo hiểm theo tháng' },
  { key: 'tax', label: 'Thuế TNCN' },
  { key: 'taxFinalization', label: 'Quyết toán thuế TNCN' }
]

// Sử dụng composable
const {
  salaryTableData,
  insuranceTableData,
  taxTableData,
  loading,
  error,
  selectedYear,
  selectedMonth,
  fetchSalaryData,
  recalculateAllSalaries,
  exportToExcel
} = useSalary()

const { showMessage } = useGlobalMessage()
const { currentUser } = useAuth()

// Sync tab from query param
const route = useRoute()
const router = useRouter()
const tabKeys = tabs.map(t => t.key)

onMounted(() => {
  const qTab = route.query.tab
  if (typeof qTab === 'string' && tabKeys.includes(qTab)) {
    activeTab.value = qTab
  }
})

watch(() => route.query.tab, (newTab) => {
  if (typeof newTab === 'string' && tabKeys.includes(newTab)) {
    activeTab.value = newTab
  }
})

// Keep URL in sync when tab changes inside this view (if you have UI changing tabs)
const setActiveTab = (key) => {
  if (tabKeys.includes(key)) {
    activeTab.value = key
    router.replace({ path: route.path, query: { ...route.query, tab: key } }).catch(() => {})
  }
}

// Computed property for personal salary data
const personalSalaryData = computed(() => {
  if (!currentUser.value || !salaryTableData.value) return []
  
  // Filter salary data for current user only
  const userSalaryData = salaryTableData.value.filter(item => {
    return item.empId === currentUser.value.id || 
           item.empId === String(currentUser.value.id) ||
           String(item.empId) === currentUser.value.id
  })
  
  console.log('Personal salary data:', {
    currentUser: currentUser.value,
    userSalaryData: userSalaryData,
    totalSalaryData: salaryTableData.value.length
  })
  
  return userSalaryData
})

// Định dạng tiền
function formatMoney(value) {
  return value?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) ?? ''
}

// Load dữ liệu khi component mount
onMounted(async () => {
  await fetchSalaryData()
})

// Xử lý thay đổi thời gian
const handleTimeChange = async (year, month) => {
  await fetchSalaryData(year, month)
}

// Xử lý tính lại lương
const handleRecalculateSalaries = async () => {
  try {
    await recalculateAllSalaries(selectedYear.value, selectedMonth.value)
    showMessage('Tính lại lương thành công!', 'success')
  } catch (err) {
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

// Xử lý xuất Excel
const handleExportToExcel = async (type) => {
  try {
    await exportToExcel(type)
    showMessage('Xuất Excel thành công!', 'success')
  } catch (err) {
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

// Year navigation methods for tax finalization tab
const goToPreviousYear = () => {
  selectedYear.value--
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

const goToNextYear = () => {
  selectedYear.value++
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

const goToCurrentYear = () => {
  const now = new Date()
  selectedYear.value = now.getFullYear()
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

// Overtime detail modal
const showOvertimeModal = ref(false)
const selectedOvertimeEmployee = ref(null)

const openOvertimeModal = (employee) => {
  selectedOvertimeEmployee.value = employee
  showOvertimeModal.value = true
}

const closeOvertimeModal = () => {
  showOvertimeModal.value = false
  selectedOvertimeEmployee.value = null
}

// Cột bảng lương
const salaryColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  { key: 'title', label: 'Chức vụ' },
  { key: 'contractType', label: 'Loại hợp đồng' },
  { key: 'contractSalary', label: 'Lương hợp đồng' },
  { key: 'insuranceSalary', label: 'Lương bảo hiểm' },
  { key: 'totalContractSalary', label: 'Tổng lương theo hợp đồng' },
  { key: 'standardDays', label: 'Tổng ngày công chuẩn' },
  { key: 'totalDays', label: 'Tổng ngày công' },
  { key: 'salaryByDays', label: 'Lương theo ngày công' },
  { key: 'paidLeaveDays', label: 'Tổng nghỉ có lương' },
  { key: 'leaveSalary', label: 'Tổng lương phép' },
  { key: 'actualSalary', label: 'Tổng lương thực tế' },
  { key: 'otHours', label: 'Số giờ tăng ca' },
  { key: 'otDays', label: 'Số ngày tăng ca' },
  { key: 'otHoursWithCoeff', label: 'Số giờ tăng ca có hệ số' },
  { key: 'otDaysWithCoeff', label: 'Số ngày tăng ca có hệ số' },
  { key: 'otSalary', label: 'Lương tăng ca' },
  { key: 'mealAllowance', label: 'Phụ cấp ăn ca' },
  { key: 'fuelAllowance', label: 'Phụ cấp xăng xe' },
  { key: 'responsibilityAllowance', label: 'Phụ cấp trách nhiệm' },
  { key: 'totalSupport', label: 'Tổng các khoản hỗ trợ' },
  { key: 'insuranceEmployee', label: 'Bảo hiểm NV đóng' },
  { key: 'unionFee', label: 'Đoàn phí' },
  { key: 'totalIncome', label: 'Tổng thu nhập' },
  { key: 'taxableIncome', label: 'Tổng thu nhập chịu thuế' },
  { key: 'personalDeduction', label: 'Giảm trừ bản thân' },
  { key: 'dependents', label: 'Số người phụ thuộc' },
  { key: 'dependentDeduction', label: 'Giảm trừ người phụ thuộc' },
  { key: 'bonus', label: 'Khen thưởng' },
  { key: 'otherIncome', label: 'Thu nhập khác' },
  { key: 'pitIncome', label: 'Tổng thu nhập tính thuế PIT' },
  { key: 'pitTax', label: 'Thuế TNCN' },
  { key: 'totalDeduction', label: 'Tổng các khoản trừ' },
  { key: 'netSalary', label: 'Thực lãnh' }
]

// Pagination for salary
const salaryCurrentPage = ref(1)
const salaryItemsPerPage = ref(8)
const paginatedSalaryData = computed(() => {
  const start = (salaryCurrentPage.value - 1) * salaryItemsPerPage.value
  return salaryTableData.value.slice(start, start + salaryItemsPerPage.value)
})

// Pagination for insurance
const insuranceCurrentPage = ref(1)
const insuranceItemsPerPage = ref(8)
const paginatedInsuranceData = computed(() => {
  const start = (insuranceCurrentPage.value - 1) * insuranceItemsPerPage.value
  return insuranceTableData.value.slice(start, start + insuranceItemsPerPage.value)
})

// Pagination for tax
const taxCurrentPage = ref(1)
const taxItemsPerPage = ref(8)
const paginatedTaxData = computed(() => {
  const start = (taxCurrentPage.value - 1) * taxItemsPerPage.value
  return taxTableData.value.slice(start, start + taxItemsPerPage.value)
})

const insuranceColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  { key: 'title', label: 'Chức danh' },
  { key: 'insuranceSalary', label: 'Lương đóng BH' },
  // Nhóm Người lao động
  { key: 'bhxhEmp', label: 'BHXH NV đóng (8%)', group: 'Người lao động' },
  { key: 'bhytEmp', label: 'BHYT NV đóng (1.5%)', group: 'Người lao động' },
  { key: 'bhtnEmp', label: 'BHTN NV đóng(1%)', group: 'Người lao động' },
  { key: 'totalEmp', label: 'Tổng NV đóng (10.5%)', group: 'Người lao động' },
  // Nhóm Doanh nghiệp
  { key: 'bhxhCom', label: 'BHXH DN đóng (17%)', group: 'Doanh nghiệp' },
  { key: 'bhytCom', label: 'BHYT DN đóng (3%)', group: 'Doanh nghiệp' },
  { key: 'bhtnCom', label: 'BHTN DN đóng (1%)', group: 'Doanh nghiệp' },
  { key: 'totalCom', label: 'Tổng DN đóng (21.5%)', group: 'Doanh nghiệp' },
  // Tổng tiền trích đóng, đoàn phí
  { key: 'totalInsurance', label: 'Tổng tiền trích đóng 32%' },
  { key: 'unionFee', label: 'Đoàn phí' }
]

const taxColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Nhân viên' },
  { key: 'dependents', label: 'Số người phụ thuộc' },
  { key: 'totalDeduction', label: 'Tổng số tiền giảm trừ' },
  { key: 'insuranceEmployee', label: 'BH NV đóng' },
  { key: 'taxableIncome', label: 'Tổng thu nhập chịu thuế' },
  { key: 'pitTax', label: 'Thuế TNCN' }
]

const taxFinalizationGroups = [
  { label: 'Quyết toán thuế', colspan: 7 },
  ...Array.from({ length: 12 }, (_, i) => ({
    label: `Tháng ${i + 1}`,
    colspan: 6
  }))
]

const taxFinalizationColumns = [
  { key: 'empId', label: 'Mã nhân viên', group: 'Quyết toán thuế' },
  { key: 'empName', label: 'Tên nhân viên', group: 'Quyết toán thuế' },
  { key: 'taxCode', label: 'Mã số thuế', group: 'Quyết toán thuế' },
  { key: 'idCard', label: 'Số CMND', group: 'Quyết toán thuế' },
  { key: 'year_totalDeduction', label: 'Tổng số tiền giảm trừ', group: 'Quyết toán thuế' },
  { key: 'year_insuranceEmployee', label: 'BH NV đóng', group: 'Quyết toán thuế' },
  { key: 'year_totalIncome', label: 'Tổng thu nhập', group: 'Quyết toán thuế' },
  // Các tháng
  ...Array.from({ length: 12 }, (_, m) => [
    { key: `m${m + 1}_totalDeduction`, label: 'Tổng số tiền giảm trừ', group: `Tháng ${m + 1}` },
    { key: `m${m + 1}_insuranceEmployee`, label: 'BH NV đóng', group: `Tháng ${m + 1}` },
    { key: `m${m + 1}_income`, label: 'Thu nhập', group: `Tháng ${m + 1}` },
    { key: `m${m + 1}_taxableIncome`, label: 'Thu nhập tính thuế', group: `Tháng ${m + 1}` },
    { key: `m${m + 1}_pitTax`, label: 'Thuế TNCN', group: `Tháng ${m + 1}` },
    { key: `m${m + 1}_dependents`, label: 'Số NPT', group: `Tháng ${m + 1}` }
  ]).flat()
]

const taxFinalizationData = Array.from({ length: 15 }, (_, i) => {
  const year_totalDeduction = 22000000 + (i % 3) * 4400000
  const year_insuranceEmployee = 4200000 + i * 100000
  const year_totalIncome = 44375000 + i * 1000000
  const year_taxableIncome = 37500000 + i * 900000
  const year_pitTax = 6125000 + i * 200000
  const year_dependents = i % 3
  const months = {}
  for (let m = 1; m <= 12; m++) {
    months[`m${m}_totalDeduction`] = m < 3 ? year_totalDeduction : 0
    months[`m${m}_insuranceEmployee`] = m < 3 ? year_insuranceEmployee : 0
    months[`m${m}_income`] = m < 3 ? year_totalIncome : 0
    months[`m${m}_taxableIncome`] = m < 3 ? year_taxableIncome : 0
    months[`m${m}_pitTax`] = m < 3 ? year_pitTax : 0
    months[`m${m}_dependents`] = m < 3 ? year_dependents : 0
  }
  return {
    empId: `NV${String(1001 + i)}`,
    empName: `Nhân viên ${i + 1}`,
    taxCode: `TAX${1001 + i}`,
    idCard: `0${i + 1}1234567`,
    year_totalDeduction,
    year_insuranceEmployee,
    year_totalIncome,
    year_taxableIncome,
    year_pitTax,
    year_dependents,
    ...months
  }
})

const taxFinalizationCurrentPage = ref(1)
const taxFinalizationItemsPerPage = ref(8)
const paginatedTaxFinalizationData = computed(() => {
  const start = (taxFinalizationCurrentPage.value - 1) * taxFinalizationItemsPerPage.value
  return taxFinalizationData.slice(start, start + taxFinalizationItemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Time Filter - Different filters based on active tab -->
    <div class="row mb-3">
      <div class="col-md-6">
        <!-- Month filter for salary, personalSalary, insurance, and tax tabs -->
        <TimeFilter 
          v-if="activeTab === 'salary' || activeTab === 'personalSalary' || activeTab === 'insurance' || activeTab === 'tax'"
          :year="selectedYear" 
          :month="selectedMonth" 
          @update:year="selectedYear = $event"
          @update:month="selectedMonth = $event"
          @change="handleTimeChange"
        />
        <!-- Year filter for tax finalization tab -->
        <div v-else-if="activeTab === 'taxFinalization'" class="year-filter">
          <div class="d-flex align-items-center gap-3 py-3 border-bottom">
            <div class="d-flex align-items-center gap-2">
              <button 
                class="btn btn-outline-secondary btn-sm" 
                @click="goToPreviousYear"
                title="Năm trước"
                :disabled="loading"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              <div class="text-center px-3">
                <h6 class="mb-0 fw-semibold text-dark">Năm {{ selectedYear }}</h6>
              </div>
              <button 
                class="btn btn-outline-secondary btn-sm" 
                @click="goToNextYear"
                title="Năm sau"
                :disabled="loading"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
            <button 
              class="btn btn-outline-primary btn-sm" 
              @click="goToCurrentYear"
              title="Năm hiện tại"
              :disabled="loading"
            >
              <i class="fas fa-calendar-day"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="col-md-6 text-end">
        <div class="d-flex gap-2 justify-content-end">
          <ActionButton 
            v-if="activeTab === 'salary'"
            type="warning" 
            icon="fas fa-calculator me-2" 
            @click="handleRecalculateSalaries"
            :disabled="loading"
          >
            Tính lại lương
          </ActionButton>
          <ActionButton 
            type="success" 
            icon="fas fa-file-export me-2" 
            @click="handleExportToExcel(activeTab)"
            :disabled="loading"
          >
            Xuất Excel
          </ActionButton>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-2">Đang tải dữ liệu lương...</p>
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
          @click="fetchSalaryData"
          :disabled="loading"
        >
          <i class="fas fa-redo me-1"></i>
          Thử lại
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div v-else class="salary-tabs-bar mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-bar-item"
        :class="{ active: activeTab === tab.key }"
        @click="setActiveTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Salary Tab -->
    <div v-if="activeTab === 'salary'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="salary-title mb-0">Quản lý bảng lương</h4>
          <p class="text-muted mb-0">Tháng {{ selectedMonth }}/{{ selectedYear }}</p>
        </div>
        <div class="text-muted">
          <small>Tổng số nhân viên: {{ salaryTableData.length }}</small>
        </div>
      </div>
      <div class="table-responsive salary-table">
        <DataTable :columns="salaryColumns" :data="paginatedSalaryData">
          <template #contractSalary="{ item }">
            <span class="money">{{ formatMoney(item.contractSalary) }}</span>
          </template>
          <template #insuranceSalary="{ item }">
            <span class="money">{{ formatMoney(item.insuranceSalary) }}</span>
          </template>
          <template #totalContractSalary="{ item }">
            <span class="money">{{ formatMoney(item.totalContractSalary) }}</span>
          </template>
          <template #salaryByDays="{ item }">
            <span class="money">{{ formatMoney(item.salaryByDays) }}</span>
          </template>
          <template #leaveSalary="{ item }">
            <span class="money">{{ formatMoney(item.leaveSalary) }}</span>
          </template>
          <template #actualSalary="{ item }">
            <span class="money">{{ formatMoney(item.actualSalary) }}</span>
          </template>
          <template #nightShiftSalary="{ item }">
            <span class="money">{{ formatMoney(item.nightShiftSalary) }}</span>
          </template>
          <template #otSalary="{ item }">
            <span class="money">{{ formatMoney(item.otSalary) }}</span>
          </template>
          <template #mealAllowance="{ item }">
            <span class="money">{{ formatMoney(item.mealAllowance) }}</span>
          </template>
          <template #fuelAllowance="{ item }">
            <span class="money">{{ formatMoney(item.fuelAllowance) }}</span>
          </template>
          <template #responsibilityAllowance="{ item }">
            <span class="money">{{ formatMoney(item.responsibilityAllowance) }}</span>
          </template>
          <template #totalSupport="{ item }">
            <span class="money">{{ formatMoney(item.totalSupport) }}</span>
          </template>
          <template #insuranceEmployee="{ item }">
            <span class="money">{{ formatMoney(item.insuranceEmployee) }}</span>
          </template>
          <template #unionFee="{ item }">
            <span class="money">{{ formatMoney(item.unionFee) }}</span>
          </template>
          <template #totalIncome="{ item }">
            <span class="money">{{ formatMoney(item.totalIncome) }}</span>
          </template>
          <template #taxableIncome="{ item }">
            <span class="money">{{ formatMoney(item.taxableIncome) }}</span>
          </template>
          <template #personalDeduction="{ item }">
            <span class="money">{{ formatMoney(item.personalDeduction) }}</span>
          </template>
          <template #dependentDeduction="{ item }">
            <span class="money">{{ formatMoney(item.dependentDeduction) }}</span>
          </template>
          <template #bonus="{ item }">
            <span class="money">{{ formatMoney(item.bonus) }}</span>
          </template>
          <template #otherIncome="{ item }">
            <span class="money">{{ formatMoney(item.otherIncome) }}</span>
          </template>
          <template #pitIncome="{ item }">
            <span class="money">{{ formatMoney(item.pitIncome) }}</span>
          </template>
          <template #pitTax="{ item }">
            <span class="money">{{ formatMoney(item.pitTax) }}</span>
          </template>
          <template #totalDeduction="{ item }">
            <span class="money">{{ formatMoney(item.totalDeduction) }}</span>
          </template>
          <template #netSalary="{ item }">
            <span class="money money-net">{{ formatMoney(item.netSalary) }}</span>
          </template>
          <template #otHours="{ item }">
            <span class="overtime-hours">{{ item.otHours }} giờ</span>
          </template>
          <template #otDays="{ item }">
            <span 
              class="overtime-days-link" 
              @click="openOvertimeModal(item)"
              :title="`Xem chi tiết tăng ca của ${item.empName}`"
            >
              {{ item.otDays }} ngày
            </span>
          </template>
          <template #otHoursWithCoeff="{ item }">
            <span class="overtime-hours-coeff">{{ item.otHoursWithCoeff }} giờ</span>
          </template>
          <template #otDaysWithCoeff="{ item }">
            <span class="overtime-days-coeff">{{ item.otDaysWithCoeff }} ngày</span>
          </template>
        </DataTable>
        <Pagination
          :totalItems="salaryTableData.length"
          :itemsPerPage="salaryItemsPerPage"
          :currentPage="salaryCurrentPage"
          @update:currentPage="salaryCurrentPage = $event"
        />
      </div>
    </div>
    
    <!-- Personal Salary Tab -->
    <div v-else-if="activeTab === 'personalSalary'">
      <!-- Header Section -->
      <div class="personal-salary-header mb-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body py-4">
            <div class="row align-items-center">
              <div class="col-lg-8">
                <div class="d-flex align-items-center">
                  <div class="personal-icon-wrapper me-3">
                    <i class="fas fa-user-circle"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h4 class="mb-1 text-primary fw-bold">
                      <i class="fas fa-money-bill-wave me-2"></i>
                      Bảng lương cá nhân
                    </h4>
                    <p class="mb-0 text-muted">
                      <i class="fas fa-calendar-alt me-1"></i>
                      Tháng {{ selectedMonth }}/{{ selectedYear }}
                    </p>
                    <div v-if="currentUser" class="employee-info-compact mt-2">
                      <div class="info-item">
                        <span class="info-label">Mã NV:</span>
                        <span class="info-value">{{ currentUser.id }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Tên:</span>
                        <span class="info-value">{{ currentUser.firstName }} {{ currentUser.lastName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-lg-4">
                <div class="text-end">
                  <div class="net-salary-display">
                    <div class="net-salary-label">Thực lãnh</div>
                    <div class="net-salary-amount">
                      {{ personalSalaryData.length > 0 ? formatMoney(personalSalaryData[0].netSalary) : '0 ₫' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Show message if no personal salary data -->
      <div v-if="personalSalaryData.length === 0" class="text-center py-5">
        <div class="no-salary-message">
          <i class="fas fa-user-times fa-4x text-muted mb-4"></i>
          <h5 class="text-muted mb-3">Không có dữ liệu lương</h5>
          <p class="text-muted">Không tìm thấy dữ liệu lương cho tháng {{ selectedMonth }}/{{ selectedYear }}</p>
        </div>
      </div>

      <!-- Personal Salary Cards -->
      <div v-else class="personal-salary-content">
        <div class="row g-4">
          <!-- Basic Salary Information -->
          <div class="col-lg-6">
            <div class="salary-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-file-invoice-dollar me-2"></i>
                  Thông tin lương cơ bản
                </h6>
              </div>
              <div class="card-body">
                <div class="salary-item">
                  <span class="salary-label">Lương hợp đồng:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].contractSalary) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Lương bảo hiểm:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].insuranceSalary) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Tổng lương theo hợp đồng:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].totalContractSalary) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Tổng ngày công chuẩn:</span>
                  <span class="salary-value">{{ personalSalaryData[0].standardDays }} ngày</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Tổng ngày công:</span>
                  <span class="salary-value">{{ personalSalaryData[0].totalDays }} ngày</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Lương theo ngày công:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].salaryByDays) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Overtime Information -->
          <div class="col-lg-6">
            <div class="salary-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-business-time me-2"></i>
                  Thông tin tăng ca
                </h6>
              </div>
              <div class="card-body">
                <div class="salary-item">
                  <span class="salary-label">Số giờ tăng ca:</span>
                  <span class="salary-value">{{ personalSalaryData[0].otHours }} giờ</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Số ngày tăng ca:</span>
                  <span class="salary-value overtime-link" @click="openOvertimeModal(personalSalaryData[0])">
                    {{ personalSalaryData[0].otDays }} ngày
                  </span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Số giờ có hệ số:</span>
                  <span class="salary-value">{{ personalSalaryData[0].otHoursWithCoeff }} giờ</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Số ngày có hệ số:</span>
                  <span class="salary-value">{{ personalSalaryData[0].otDaysWithCoeff }} ngày</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Lương tăng ca:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].otSalary) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Tổng lương thực tế:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].actualSalary) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Leave Information -->
          <div class="col-lg-6">
            <div class="salary-card leave-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-calendar-check me-2"></i>
                  Thông tin nghỉ phép
                </h6>
              </div>
              <div class="card-body">
                <div class="salary-item">
                  <span class="salary-label">Tổng nghỉ có lương:</span>
                  <span class="salary-value">{{ personalSalaryData[0].paidLeaveDays }} ngày</span>
                </div>
                <div class="salary-item total-item">
                  <span class="salary-label">Tổng lương phép:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].leaveSalary) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Allowances -->
          <div class="col-lg-6">
            <div class="salary-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-plus-circle me-2"></i>
                  Các khoản phụ cấp
                </h6>
              </div>
              <div class="card-body">
                <div class="salary-item">
                  <span class="salary-label">Phụ cấp ăn ca:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].mealAllowance) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Phụ cấp xăng xe:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].fuelAllowance) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Phụ cấp trách nhiệm:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].responsibilityAllowance) }}</span>
                </div>
                <div class="salary-item total-item">
                  <span class="salary-label">Tổng các khoản hỗ trợ:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].totalSupport) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Deductions -->
          <div class="col-lg-6">
            <div class="salary-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-minus-circle me-2"></i>
                  Các khoản trừ
                </h6>
              </div>
              <div class="card-body">
                <div class="salary-item">
                  <span class="salary-label">Bảo hiểm NV đóng:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].insuranceEmployee) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Đoàn phí:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].unionFee) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Giảm trừ bản thân:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].personalDeduction) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Số người phụ thuộc:</span>
                  <span class="salary-value">{{ personalSalaryData[0].dependents }} người</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Giảm trừ người phụ thuộc:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].dependentDeduction) }}</span>
                </div>
                <div class="salary-item total-item">
                  <span class="salary-label">Tổng các khoản trừ:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].totalDeduction) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tax Information -->
          <div class="col-lg-6">
            <div class="salary-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-calculator me-2"></i>
                  Thông tin thuế
                </h6>
              </div>
              <div class="card-body">
                <div class="salary-item">
                  <span class="salary-label">Tổng thu nhập:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].totalIncome) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Tổng thu nhập chịu thuế:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].taxableIncome) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Khen thưởng:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].bonus) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Thu nhập khác:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].otherIncome) }}</span>
                </div>
                <div class="salary-item">
                  <span class="salary-label">Tổng thu nhập tính thuế PIT:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].pitIncome) }}</span>
                </div>
                <div class="salary-item total-item">
                  <span class="salary-label">Thuế TNCN:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].pitTax) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Final Summary -->
          <div class="col-lg-6">
            <div class="salary-card final-summary-card">
              <div class="card-header">
                <h6 class="mb-0">
                  <i class="fas fa-trophy me-2"></i>
                  Tổng kết
                </h6>
              </div>
              <div class="card-body">
                <div class="final-summary">
                  <div class="summary-row">
                    <span class="summary-label">Tổng thu nhập:</span>
                    <span class="summary-value income">{{ formatMoney(personalSalaryData[0].totalIncome) }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Tổng các khoản trừ:</span>
                    <span class="summary-value deduction">{{ formatMoney(personalSalaryData[0].totalDeduction) }}</span>
                  </div>
                  <div class="summary-divider"></div>
                  <div class="summary-row final-row">
                    <span class="summary-label">Thực lãnh:</span>
                    <span class="summary-value net-salary">{{ formatMoney(personalSalaryData[0].netSalary) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Insurance Tab -->
    <div v-else-if="activeTab === 'insurance'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="salary-title mb-0">Bảo hiểm theo tháng</h4>
          <p class="text-muted mb-0">Tháng {{ selectedMonth }}/{{ selectedYear }}</p>
        </div>
        <div class="text-muted">
          <small>Tổng số nhân viên: {{ insuranceTableData.length }}</small>
        </div>
      </div>
      <div class="table-responsive salary-table">
        <table class="table">
          <thead>
            <tr>
              <th rowspan="2">Mã nhân viên</th>
              <th rowspan="2">Tên nhân viên</th>
              <th rowspan="2">Chức danh</th>
              <th rowspan="2">Lương đóng BH</th>
              <th colspan="4" class="group-header">Người lao động</th>
              <th colspan="4" class="group-header">Doanh nghiệp</th>
              <th rowspan="2">Tổng tiền trích đóng 32%</th>
              <th rowspan="2">Đoàn phí</th>
            </tr>
            <tr>
              <th>BHXH (8%)</th>
              <th>BHYT (1.5%)</th>
              <th>BHTN (1%)</th>
              <th>Tổng NV đóng (10.5%)</th>
              <th>BHXH (17%)</th>
              <th>BHYT (3%)</th>
              <th>BHTN (1%)</th>
              <th>Tổng DN đóng (21.5%)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedInsuranceData" :key="item.empId">
              <td>{{ item.empId }}</td>
              <td>{{ item.empName }}</td>
              <td>{{ item.title }}</td>
              <td><span class="money">{{ formatMoney(item.insuranceSalary) }}</span></td>
              <td data-group="nl"><span class="money">{{ formatMoney(item.bhxhEmp) }}</span></td>
              <td data-group="nl"><span class="money">{{ formatMoney(item.bhytEmp) }}</span></td>
              <td data-group="nl"><span class="money">{{ formatMoney(item.bhtnEmp) }}</span></td>
              <td data-group="nl"><span class="money">{{ formatMoney(item.totalEmp) }}</span></td>
              <td data-group="dn"><span class="money">{{ formatMoney(item.bhxhCom) }}</span></td>
              <td data-group="dn"><span class="money">{{ formatMoney(item.bhytCom) }}</span></td>
              <td data-group="dn"><span class="money">{{ formatMoney(item.bhtnCom) }}</span></td>
              <td data-group="dn"><span class="money">{{ formatMoney(item.totalCom) }}</span></td>
              <td><span class="money">{{ formatMoney(item.totalInsurance) }}</span></td>
              <td><span class="money">{{ formatMoney(item.unionFee) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        :totalItems="insuranceTableData.length"
        :itemsPerPage="insuranceItemsPerPage"
        :currentPage="insuranceCurrentPage"
        @update:currentPage="insuranceCurrentPage = $event"
      />
    </div>
    <!-- Tax Tab -->
    <div v-else-if="activeTab === 'tax'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="salary-title mb-0">Thuế TNCN</h4>
          <p class="text-muted mb-0">Tháng {{ selectedMonth }}/{{ selectedYear }}</p>
        </div>
        <div class="text-muted">
          <small>Tổng số nhân viên: {{ taxTableData.length }}</small>
        </div>
      </div>
      <div class="table-responsive salary-table">
        <DataTable :columns="taxColumns" :data="paginatedTaxData">
          <template #totalDeduction="{ item }">
            <span class="money">{{ formatMoney(item.totalDeduction) }}</span>
          </template>
          <template #insuranceEmployee="{ item }">
            <span class="money">{{ formatMoney(item.insuranceEmployee) }}</span>
          </template>
          <template #taxableIncome="{ item }">
            <span class="money">{{ formatMoney(item.taxableIncome) }}</span>
          </template>
          <template #pitTax="{ item }">
            <span class="money money-net">{{ formatMoney(item.pitTax) }}</span>
          </template>
        </DataTable>
      </div>
      <Pagination
        :totalItems="taxTableData.length"
        :itemsPerPage="taxItemsPerPage"
        :currentPage="taxCurrentPage"
        @update:currentPage="taxCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'taxFinalization'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="salary-title mb-0">Quyết toán thuế TNCN</h4>
          <p class="text-muted mb-0">Năm {{ selectedYear }}</p>
        </div>
        <button class="btn btn-primary" style="min-width:120px">
          <i class="fas fa-plus me-2"></i>Thêm
        </button>
      </div>
      <div class="table-responsive salary-table">
        <table class="table">
          <thead>
            <tr>
              <th rowspan="2">Mã nhân viên</th>
              <th rowspan="2">Tên nhân viên</th>
              <th rowspan="2">Mã số thuế</th>
              <th rowspan="2">Số CMND</th>
              <th colspan="6" class="group-header">Quyết toán thuế</th>
              <th v-for="m in 12" :colspan="6" class="group-header">Tháng {{ m }}</th>
            </tr>
            <tr>
                <th>Tổng số NPT</th>
              <th>Tổng số tiền giảm trừ</th>
              <th>Tổng BH NV đóng</th>
              <th>Tổng thu nhập</th>
              <th>Thu nhập tính thuế</th>
              <th>Thuế TNCN</th>
              <template v-for="m in 12">
                  <th>Số NPT</th>
                <th>Tổng số tiền giảm trừ</th>
                <th>BH NV đóng</th>
                <th>Thu nhập</th>
                <th>Thu nhập tính thuế</th>
                <th>Thuế TNCN</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedTaxFinalizationData" :key="item.empId">
              <td>{{ item.empId }}</td>
              <td>{{ item.empName }}</td>
              <td>{{ item.taxCode }}</td>
              <td>{{ item.idCard }}</td>
              <td data-group="qt">{{ item.year_dependents }}</td>
              <td data-group="qt"><span class="money">{{ formatMoney(item.year_totalDeduction) }}</span></td>
              <td data-group="qt"><span class="money">{{ formatMoney(item.year_insuranceEmployee) }}</span></td>
              <td data-group="qt"><span class="money">{{ formatMoney(item.year_totalIncome) }}</span></td>
              <td data-group="qt"><span class="money">{{ formatMoney(item.year_taxableIncome) }}</span></td>
              <td data-group="qt"><span class="money money-net">{{ formatMoney(item.year_pitTax) }}</span></td>

              <template v-for="m in 12">
                  <td data-group="thang">{{ item[`m${m}_dependents`] }}</td>
                <td data-group="thang"><span class="money">{{ formatMoney(item[`m${m}_totalDeduction`]) }}</span></td>
                <td data-group="thang"><span class="money">{{ formatMoney(item[`m${m}_insuranceEmployee`]) }}</span></td>
                <td data-group="thang"><span class="money">{{ formatMoney(item[`m${m}_income`]) }}</span></td>
                <td data-group="thang"><span class="money">{{ formatMoney(item[`m${m}_taxableIncome`]) }}</span></td>
                <td data-group="thang"><span class="money money-net">{{ formatMoney(item[`m${m}_pitTax`]) }}</span></td>
              </template>
            </tr>
          </tbody>
        </table>
    </div>
    <Pagination
      :totalItems="taxFinalizationData.length"
      :itemsPerPage="taxFinalizationItemsPerPage"
      :currentPage="taxFinalizationCurrentPage"
      @update:currentPage="taxFinalizationCurrentPage = $event"
    />
    </div>
  </div>

  <!-- Overtime Detail Modal -->
  <ModalDialog :show="showOvertimeModal" title="Chi tiết tăng ca" size="lg" @update:show="closeOvertimeModal">
    <div v-if="selectedOvertimeEmployee" class="p-4">
      <!-- Employee Info -->
      <div class="modal-emp-header mb-4">
        <div class="modal-emp-info">
          <div class="emp-name fw-bold h5">{{ selectedOvertimeEmployee.empName }}</div>
          <div class="emp-id text-muted">Mã NV: {{ selectedOvertimeEmployee.empId }}</div>
          <div class="emp-pos text-muted">Chức vụ: {{ selectedOvertimeEmployee.title }}</div>
        </div>
        <div class="modal-emp-date">
          <span class="fw-bold">Tháng: </span>
          <span>{{ selectedMonth }}/{{ selectedYear }}</span>
        </div>
      </div>

      <!-- Overtime Summary -->
      <div class="overtime-summary-card">
        <h6 class="fw-bold mb-3">Tổng hợp tăng ca tháng</h6>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Số giờ tăng ca:</span>
              <span class="summary-value">{{ selectedOvertimeEmployee.otHours }} giờ</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Số ngày tăng ca:</span>
              <span class="summary-value">{{ selectedOvertimeEmployee.otDays }} ngày</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Số giờ có hệ số:</span>
              <span class="summary-value">{{ selectedOvertimeEmployee.otHoursWithCoeff }} giờ</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Số ngày có hệ số:</span>
              <span class="summary-value">{{ selectedOvertimeEmployee.otDaysWithCoeff }} ngày</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Lương tăng ca:</span>
              <span class="summary-value">{{ formatMoney(selectedOvertimeEmployee.otSalary) }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Lương hợp đồng:</span>
              <span class="summary-value">{{ formatMoney(selectedOvertimeEmployee.contractSalary) }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="summary-item">
              <span class="summary-label">Tổng ngày công chuẩn:</span>
              <span class="summary-value">{{ selectedOvertimeEmployee.standardDays }} ngày</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Calculation Formula -->
      <div class="calculation-formula mt-4">
        <h6 class="fw-bold mb-3">Công thức tính lương tăng ca</h6>
        <div class="alert alert-info">
          <div class="formula-text">
            <strong>Lương tăng ca = Công tăng ca × Lương hợp đồng × Hệ số / Tổng ngày công chuẩn</strong>
          </div>
          <div class="formula-breakdown mt-2">
            <small class="text-muted">
              = {{ selectedOvertimeEmployee.otDays }} × {{ formatMoney(selectedOvertimeEmployee.contractSalary) }} × Hệ số / {{ selectedOvertimeEmployee.standardDays }}
            </small>
          </div>
        </div>
      </div>

      <!-- Note -->
      <div class="mt-3">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          Hệ số tăng ca được tính từ các đơn tăng ca đã được duyệt trong tháng {{ selectedMonth }}/{{ selectedYear }}
        </small>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.salary-tabs-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}
.tab-bar-item {
  padding: 8px 24px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  background: #f5f7fa;
  cursor: pointer;
  border: none;
  transition: background 0.18s, color 0.18s;
}
.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
}
.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}
.salary-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0d6efd;
  letter-spacing: 0.5px;
}
.salary-table {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(13,110,253,0.10);
  padding: 0;
  margin-bottom: 0;
  overflow-x: auto;
}
.table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 1rem;
  background: #fff;
}
.table th,
.table td {
  border: 1px solid #dee2e6;
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
  background: #fff;
  min-width: 120px;
  white-space: nowrap;
  transition: background 0.15s ease;
}
.table th {
  background-color: #f8f9fa;
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
  letter-spacing: 0.1px;
}
.table th.group-header {
  background: #e9ecef;
  color: #495057 !important;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.1px;
}
.table th.group-header:last-child {
  border-right: none;
}
.table tr:hover td {
  background: #f8f9fa;
}
.table tbody tr {
  border-radius: 4px;
}
.money {
  font-weight: 600;
  color: #2c3e50;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 2px 8px;
  display: inline-block;
  font-size: 0.95rem;
  border: 1px solid #e9ecef;
}
.money-net {
  color: #e74c3c;
  background: #fff5f5;
  font-weight: 700;
  border: 1px solid #fecaca;
}
.table tbody tr td[data-group="nl"] {
  background: #f0f8ff;
}
.table tbody tr td[data-group="dn"] {
  background: #fff0f5;
}
.table tbody tr td[data-group="qt"] {
  background: #f5f5f5;
}
.table tbody tr td[data-group="thang"] {
  background: #f8f9fa;
}
.table thead tr th,
.table tbody tr td {
  border-right: 1px solid #dee2e6;
}
.table thead tr th:last-child,
.table tbody tr td:last-child {
  border-right: none;
}
.table thead tr th,
.table tbody tr td {
  border-bottom: 1px solid #dee2e6;
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.table thead tr th[rowspan="2"], 
.table thead tr th[rowspan="2"]:not(.group-header) {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}
.table thead tr th[rowspan="2"]:first-child {
  border-radius: 4px 0 0 4px;
}
.table thead tr th[rowspan="2"]:last-child {
  border-radius: 0 4px 4px 0;
}

::-webkit-scrollbar {
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: #e9ecef;
  border-radius: 8px;
}
.salary-table {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(13,110,253,0.10);
  padding: 0;
  margin-bottom: 0;
  overflow-x: auto;
}

/* Year filter styling */
.year-filter {
  background: #fafbfc;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.year-filter .btn {
  transition: all 0.2s ease;
}

.year-filter .btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.year-filter .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Overtime modal styling */
.overtime-days-link {
  color: #0d6efd;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
}

.overtime-days-link:hover {
  color: #0b5ed7;
  text-decoration: none;
}

.overtime-hours,
.overtime-hours-coeff,
.overtime-days-coeff {
  font-weight: 600;
  color: #495057;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 2px 8px;
  display: inline-block;
  font-size: 0.95rem;
  border: 1px solid #e9ecef;
}

.overtime-hours-coeff {
  color: #198754;
  background: #d1e7dd;
  border-color: #badbcc;
}

.overtime-days-coeff {
  color: #0f5132;
  background: #d1e7dd;
  border-color: #badbcc;
}

.modal-emp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.modal-emp-info .emp-name {
  color: #0d6efd;
  margin-bottom: 0.25rem;
}

.modal-emp-info .emp-id,
.modal-emp-info .emp-pos {
  font-size: 0.9rem;
}

.modal-emp-date {
  text-align: right;
}

.overtime-summary-card {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.summary-label {
  font-weight: 600;
  color: #495057;
}

.summary-value {
  font-weight: 700;
  color: #0d6efd;
}

.calculation-formula .alert {
  border-left: 4px solid #0d6efd;
}

.formula-text {
  font-size: 1.1rem;
}

.formula-breakdown {
  font-family: 'Courier New', monospace;
}

/* Personal salary tab styling */
.employee-info-compact {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  color: #6c757d;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 700;
  color: #0d6efd;
  font-size: 0.9rem;
}

.no-salary-message {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.no-salary-message i {
  opacity: 0.5;
}

/* Personal Salary Card Layout */
.personal-salary-header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(52, 152, 219, 0.3);
  position: relative;
}

.personal-salary-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Leave Card - unified light style */
.leave-card {
  background: #fff;
  color: inherit;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.leave-card .card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid #dee2e6;
  border-radius: 16px 16px 0 0 !important;
  padding: 1.25rem 1.5rem;
}

.leave-card .card-header h6 {
  color: #2c3e50;
  font-weight: 700;
}

.leave-card .card-header h6 i {
  color: #3498db;
}

.leave-card .card-body {
  background: transparent;
}

.leave-card .salary-item.total-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 2px solid #dee2e6;
  border-radius: 12px;
}

.personal-salary-header .card {
  background: transparent;
  border: none;
  color: white;
}

.personal-salary-header .card-body {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.personal-icon-wrapper {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.personal-icon-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.personal-salary-header .info-label {
  color: rgba(255, 255, 255, 0.8);
}

.personal-salary-header .info-value {
  color: white;
}

.net-salary-display {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.net-salary-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.net-salary-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.net-salary-amount {
  font-size: 2.2rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #fff, #e8f4fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.salary-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  position: relative;
  overflow: hidden;
}

.salary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.salary-card:hover::before {
  transform: scaleX(1);
}

.salary-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  border-color: rgba(52, 152, 219, 0.2);
}

.salary-card .card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid #dee2e6;
  border-radius: 16px 16px 0 0 !important;
  padding: 1.25rem 1.5rem;
  position: relative;
}

.salary-card .card-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #2980b9);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.salary-card:hover .card-header::after {
  opacity: 1;
}

.salary-card .card-header h6 {
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0;
  display: flex;
  align-items: center;
}

.salary-card .card-header h6 i {
  margin-right: 0.75rem;
  color: #3498db;
  font-size: 1.2rem;
}

.salary-card .card-body {
  padding: 1.5rem;
  position: relative;
}

.salary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
}

.salary-item:hover {
  background: rgba(52, 152, 219, 0.02);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  margin: 0 -0.5rem;
  border-radius: 8px;
}

.salary-item:last-child {
  border-bottom: none;
}

.salary-item.total-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 2px solid #dee2e6;
  margin-top: 1rem;
  padding: 1.25rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  position: relative;
}

.salary-item.total-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #2980b9);
}

.salary-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.salary-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.salary-item:hover .salary-label {
  color: #3498db;
}

.salary-item:hover .salary-value {
  color: #2980b9;
}

.salary-value.overtime-link {
  color: #3498db;
  cursor: pointer;
  text-decoration: underline;
}

.salary-value.overtime-link:hover {
  color: #2980b9;
  text-decoration: none;
}

.final-summary-card {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.final-summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  animation: shimmer 5s infinite;
}

.final-summary-card .card-header {
  background: rgba(255, 255, 255, 0.15);
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 2;
}

.final-summary-card .card-header h6 {
  color: white;
  font-weight: 700;
}

.final-summary-card .card-header h6 i {
  color: rgba(255, 255, 255, 0.9);
}

.final-summary-card .card-body {
  background: rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 2;
}

.final-summary {
  padding: 0.5rem 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.summary-value {
  font-weight: 600;
  font-size: 1rem;
}

.summary-value.income {
  color: #90ee90;
}

.summary-value.deduction {
  color: #ffb6c1;
}

.summary-value.net-salary {
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
}

.summary-divider {
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0.75rem 0;
  border-radius: 1px;
}

.final-row {
  background: rgba(255, 255, 255, 0.1);
  margin: 0 -1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 0 0 12px 12px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .personal-salary-header .row {
    text-align: center;
  }
  
  .net-salary-display {
    margin-top: 1rem;
  }
  
  .salary-card {
    margin-bottom: 1rem;
  }
  
  .salary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .salary-value {
    font-weight: 700;
  }
}

/* Card Loading Animation */
.personal-salary-content .row > div {
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

.personal-salary-content .row > div:nth-child(1) { animation-delay: 0.1s; }
.personal-salary-content .row > div:nth-child(2) { animation-delay: 0.2s; }
.personal-salary-content .row > div:nth-child(3) { animation-delay: 0.3s; }
.personal-salary-content .row > div:nth-child(4) { animation-delay: 0.4s; }
.personal-salary-content .row > div:nth-child(5) { animation-delay: 0.5s; }
.personal-salary-content .row > div:nth-child(6) { animation-delay: 0.6s; }

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>