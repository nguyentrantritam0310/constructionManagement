<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import TimeFilter from '../../components/common/TimeFilter.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import { useSalary } from '../../composables/useSalary.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'

const activeTab = ref('salary')
const tabs = [
  { key: 'salary', label: 'Quản lý bảng lương' },
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
  { key: 'unpaidLeaveDays', label: 'Tổng nghỉ không lương' },
  { key: 'paidLeaveDays', label: 'Tổng nghỉ có lương' },
  { key: 'leaveSalary', label: 'Tổng lương phép' },
  { key: 'actualSalary', label: 'Tổng lương thực tế' },
  { key: 'otDays', label: 'Công tăng ca' },
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
  { key: 'insuranceBookNo', label: 'Số sổ BH' },
  { key: 'insuranceCode', label: 'Mã số BH' },
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
  { key: 'taxCode', label: 'Mã số thuế' },
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
    <!-- Time Filter - Always visible -->
    <div class="row mb-3">
      <div class="col-md-6">
        <TimeFilter 
          :year="selectedYear" 
          :month="selectedMonth" 
          @update:year="selectedYear = $event"
          @update:month="selectedMonth = $event"
          @change="handleTimeChange"
        />
      </div>
      <div class="col-md-6 text-end">
        <div class="d-flex gap-2 justify-content-end">
          <ActionButton 
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
            @click="handleExportToExcel('salary')"
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
        @click="activeTab = tab.key"
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
        </DataTable>
        <Pagination
          :totalItems="salaryTableData.length"
          :itemsPerPage="salaryItemsPerPage"
          :currentPage="salaryCurrentPage"
          @update:currentPage="salaryCurrentPage = $event"
        />
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
              <th rowspan="2">Số sổ BH</th>
              <th rowspan="2">Mã số BH</th>
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
              <td>{{ item.insuranceBookNo || '--' }}</td>
              <td>{{ item.insuranceCode || '--' }}</td>
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

</style>