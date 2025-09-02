<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'

const activeTab = ref('salary')
const tabs = [
  { key: 'salary', label: 'Quản lý bảng lương' },
  { key: 'insurance', label: 'Bảo hiểm theo tháng' },
  { key: 'tax', label: 'Thuế TNCN' },
  { key: 'taxFinalization', label: 'Quyết toán thuế TNCN' }
]

// Định dạng tiền
function formatMoney(value) {
  return value?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) ?? ''
}

// Cột bảng lương
const salaryColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  { key: 'title', label: 'Chức vụ' },
  { key: 'contractType', label: 'Loại hợp đồng' },
  { key: 'contractSalary', label: 'Lương hợp đồng' },
  { key: 'insuranceSalary', label: 'Lương bảo hiểm' },
  { key: 'supplementSalary', label: 'Khoản bổ sung lương' },
  { key: 'totalContractSalary', label: 'Tổng lương theo hợp đồng' },
  { key: 'standardDays', label: 'Tổng ngày công chuẩn' },
  { key: 'workDays', label: 'Ngày đi làm' },
  { key: 'businessDays', label: 'Ngày công tác' },
  { key: 'totalDays', label: 'Tổng ngày công' },
  { key: 'salaryByDays', label: 'Lương theo ngày công' },
  { key: 'unpaidLeaveDays', label: 'Tổng nghỉ không lương' },
  { key: 'paidLeaveDays', label: 'Tổng nghỉ có lương' },
  { key: 'leaveSalary', label: 'Tổng lương phép' },
  { key: 'actualSalary', label: 'Tổng lương thực tế' },
  { key: 'nightShiftDays', label: 'Công làm ca đêm' },
  { key: 'nightShiftSalary', label: 'Lương làm ca đêm' },
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

// Dữ liệu mẫu bảng lương
const salaryData = Array.from({ length: 15 }, (_, i) => ({
  empId: `NV${String(1001 + i)}`,
  empName: `Nhân viên ${i + 1}`,
  title: ['Kỹ sư', 'Trưởng phòng', 'Nhân viên', 'Giám sát'][i % 4],
  contractType: ['Không xác định', 'Chính thức', 'Thử việc'][i % 3],
  contractSalary: 12000000 + i * 500000,
  insuranceSalary: 11000000 + i * 400000,
  supplementSalary: 500000 + i * 10000,
  totalContractSalary: 12500000 + i * 510000,
  standardDays: 26,
  workDays: 24 - (i % 3),
  businessDays: i % 2,
  totalDays: 24 - (i % 3) + (i % 2),
  salaryByDays: 12000000 + i * 500000,
  unpaidLeaveDays: i % 2,
  paidLeaveDays: i % 3,
  leaveSalary: 800000 + i * 50000,
  actualSalary: 13000000 + i * 600000,
  nightShiftDays: i % 2,
  nightShiftSalary: 300000 + i * 20000,
  otDays: i % 3,
  otSalary: 400000 + i * 30000,
  mealAllowance: 200000 + i * 10000,
  fuelAllowance: 150000 + i * 5000,
  responsibilityAllowance: 250000 + i * 8000,
  totalSupport: 600000 + i * 20000,
  insuranceEmployee: 800000 + i * 20000,
  unionFee: 50000 + i * 1000,
  totalIncome: 14500000 + i * 700000,
  taxableIncome: 14000000 + i * 650000,
  personalDeduction: 11000000,
  dependents: i % 3,
  dependentDeduction: (i % 3) * 4400000,
  bonus: 1000000 + i * 50000,
  otherIncome: 500000 + i * 20000,
  pitIncome: 13000000 + i * 600000,
  pitTax: 1200000 + i * 50000,
  totalDeduction: 2000000 + i * 100000,
  netSalary: 12500000 + i * 510000
}))

const salaryCurrentPage = ref(1)
const salaryItemsPerPage = ref(8)
const paginatedSalaryData = computed(() => {
  const start = (salaryCurrentPage.value - 1) * salaryItemsPerPage.value
  return salaryData.slice(start, start + salaryItemsPerPage.value)
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

const insuranceData = Array.from({ length: 15 }, (_, i) => {
  const salary = 11000000 + i * 400000
  const bhxhEmp = salary * 0.08
  const bhytEmp = salary * 0.015
  const bhtnEmp = salary * 0.01
  const totalEmp = bhxhEmp + bhytEmp + bhtnEmp
  const bhxhCom = salary * 0.17
  const bhytCom = salary * 0.03
  const bhtnCom = salary * 0.01
  const totalCom = bhxhCom + bhytCom + bhtnCom
  const totalInsurance = salary * 0.32
  const unionFeeEmp = salary * 0.01
  const unionFeeCom = salary * 0.02
  const grandTotal = totalEmp + totalCom + unionFeeEmp + unionFeeCom
  return {
    empId: `NV${String(1001 + i)}`,
    empName: `Nhân viên ${i + 1}`,
    title: ['Kỹ sư', 'Trưởng phòng', 'Nhân viên', 'Giám sát'][i % 4],
    insuranceSalary: salary,
    employee: formatMoney(totalEmp),
    company: formatMoney(totalCom),
    totalInsurance: formatMoney(totalInsurance),
    unionFee: formatMoney(unionFeeEmp + unionFeeCom),
    bhxhEmp: formatMoney(bhxhEmp),
    bhytEmp: formatMoney(bhytEmp),
    bhtnEmp: formatMoney(bhtnEmp),
    totalEmp: formatMoney(totalEmp),
    bhxhCom: formatMoney(bhxhCom),
    bhytCom: formatMoney(bhytCom),
    bhtnCom: formatMoney(bhtnCom),
    totalCom: formatMoney(totalCom),
    unionFeeEmp: formatMoney(unionFeeEmp),
    unionFeeCom: formatMoney(unionFeeCom),
    grandTotal: formatMoney(grandTotal)
  }
})

const insuranceCurrentPage = ref(1)
const insuranceItemsPerPage = ref(8)
const paginatedInsuranceData = computed(() => {
  const start = (insuranceCurrentPage.value - 1) * insuranceItemsPerPage.value
  return insuranceData.slice(start, start + insuranceItemsPerPage.value)
})

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

const taxData = Array.from({ length: 15 }, (_, i) => ({
  empId: `NV${String(1001 + i)}`,
  empName: `Nhân viên ${i + 1}`,
  taxCode: `TAX${1001 + i}`,
  dependents: i % 3,
  totalDeduction: 11000000 + (i % 3) * 4400000,
  insuranceEmployee: 800000 + i * 20000,
  taxableIncome: 14000000 + i * 650000,
  pitTax: 1200000 + i * 50000
}))

const taxCurrentPage = ref(1)
const taxItemsPerPage = ref(8)
const paginatedTaxData = computed(() => {
  const start = (taxCurrentPage.value - 1) * taxItemsPerPage.value
  return taxData.slice(start, start + taxItemsPerPage.value)
})

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
    <div class="salary-tabs-bar mb-3">
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
    <div v-if="activeTab === 'salary'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="salary-title mb-0">Quản lý bảng lương</h4>
        <button class="btn btn-primary" style="min-width:120px">
          <i class="fas fa-plus me-2"></i>Thêm
        </button>
      </div>
      <div class="table-responsive salary-table">
        <DataTable :columns="salaryColumns" :data="paginatedSalaryData">
          <template #contractSalary="{ item }">
            <span class="money">{{ formatMoney(item.contractSalary) }}</span>
          </template>
          <template #insuranceSalary="{ item }">
            <span class="money">{{ formatMoney(item.insuranceSalary) }}</span>
          </template>
          <template #supplementSalary="{ item }">
            <span class="money">{{ formatMoney(item.supplementSalary) }}</span>
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
          :totalItems="salaryData.length"
          :itemsPerPage="salaryItemsPerPage"
          :currentPage="salaryCurrentPage"
          @update:currentPage="salaryCurrentPage = $event"
        />
      </div>
    </div>
    <div v-else-if="activeTab === 'insurance'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="salary-title mb-0">Bảo hiểm theo tháng</h4>
        <button class="btn btn-primary" style="min-width:120px">
          <i class="fas fa-plus me-2"></i>Thêm
        </button>
      </div>
      <div class="table-responsive salary-table">
        <table class="table">
          <thead>
            <tr>
              <th rowspan="2">Mã nhân viên</th>
              <th  rowspan="2">Tên nhân viên</th>
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
              <td>{{ item.insuranceBookNo }}</td>
              <td>{{ item.insuranceCode }}</td>
              <td><span class="money">{{ formatMoney(item.insuranceSalary) }}</span></td>
              <td data-group="nl"><span class="money">{{ item.bhxhEmp }}</span></td>
              <td data-group="nl"><span class="money">{{ item.bhytEmp }}</span></td>
              <td data-group="nl"><span class="money">{{ item.bhtnEmp }}</span></td>
              <td data-group="nl"><span class="money">{{ item.totalEmp }}</span></td>
              <td data-group="dn"><span class="money">{{ item.bhxhCom }}</span></td>
              <td data-group="dn"><span class="money">{{ item.bhytCom }}</span></td>
              <td data-group="dn"><span class="money">{{ item.bhtnCom }}</span></td>
              <td data-group="dn"><span class="money">{{ item.totalCom }}</span></td>
              <td><span class="money">{{ item.totalInsurance }}</span></td>
              <td><span class="money">{{ item.unionFee }}</span></td>
            </tr>
          </tbody>
        </table>
    </div>
    <Pagination
      :totalItems="insuranceData.length"
      :itemsPerPage="insuranceItemsPerPage"
      :currentPage="insuranceCurrentPage"
      @update:currentPage="insuranceCurrentPage = $event"
    />
    </div>
    <div v-else-if="activeTab === 'tax'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="salary-title mb-0">Thuế TNCN</h4>
        <button class="btn btn-primary" style="min-width:120px">
          <i class="fas fa-plus me-2"></i>Thêm
        </button>
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
      :totalItems="taxData.length"
      :itemsPerPage="taxItemsPerPage"
      :currentPage="taxCurrentPage"
      @update:currentPage="taxCurrentPage = $event"
    />
    </div>
    <div v-else-if="activeTab === 'taxFinalization'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="salary-title mb-0">Quyết toán thuế TNCN</h4>
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
  border: 1.5px solid #d1d5db;
  padding: 0.85rem 0.5rem;
  vertical-align: middle;
  background: #fff;
  min-width: 145px;
  white-space: nowrap;
  transition: background 0.18s;
}
.table th {
  background-color: #f5f7fa;
  font-size: 1.05rem;
  font-weight: 700;
  color: #222;
  letter-spacing: 0.2px;
}
.table th.group-header {
  background: linear-gradient(90deg, #e9ecef 80%, #f5f7fa 100%);
  color: #222 !important;
  font-size: 1.12rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(13,110,253,0.07);
}
.table th.group-header:last-child {
  border-right: none;
}
.table tr:hover td {
  background: #eafbe7;
}
.table tbody tr {
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(13,110,253,0.04);
}
.money {
  font-weight: 600;
  color: #009688;
  background: #e0f7fa;
  border-radius: 6px;
  padding: 2px 12px;
  display: inline-block;
  font-size: 1.02rem;
  box-shadow: 0 1px 4px rgba(0,150,136,0.07);
}
.money-net {
  color: #0d6efd;
  background: #eafbe7;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(13,110,253,0.07);
}
.table tbody tr td[data-group="nl"], 
.table tbody tr td[data-group="dn"] {
  background: #f6fcff;
}
.table tbody tr td[data-group="dn"] {
  background: #f9f6ff;
}
.table tbody tr td[data-group="qt"] {
  background: #f7f7f7;
}
.table tbody tr td[data-group="thang"] {
  background: #f8f9fa;
}
.table thead tr th,
.table tbody tr td {
  border-right: 1.5px solid #d1d5db;
}
.table thead tr th:last-child,
.table tbody tr td:last-child {
  border-right: none;
}
.table thead tr th,
.table tbody tr td {
  border-bottom: 1.5px solid #d1d5db;
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.table thead tr th[rowspan="2"], 
.table thead tr th[rowspan="2"]:not(.group-header) {
  background: #f5f7fa;
  font-weight: 700;
  color: #222;
}
.table thead tr th[rowspan="2"]:first-child {
  border-radius: 8px 0 0 8px;
}
.table thead tr th[rowspan="2"]:last-child {
  border-radius: 0 8px 8px 0;
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

/* Đậm border cho tất cả các ô */
.table th,
.table td {

  padding: 0.85rem 0.5rem;
  vertical-align: middle;
  background: #fff;
  min-width: 145px;
  white-space: nowrap;
  transition: background 0.18s;
}

/* Header nhóm */

.table {
    background-color: #f5f7fa;
}

.money {
  font-weight: 600;
  color: #009688;
  background: #e0f7fa;
  border-radius: 6px;
  padding: 2px 12px;
  display: inline-block;
  font-size: 1.02rem;
  box-shadow: 0 1px 4px rgba(0,150,136,0.07);
}
.money-net {
  color: #0d6efd;
  background: #eafbe7;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(13,110,253,0.07);
}
.table tbody tr td[data-group="nl"], 
.table tbody tr td[data-group="dn"] {
  background: #f6fcff;
}
.table tbody tr td[data-group="dn"] {
  background: #f9f6ff;
}
.table tbody tr td[data-group="qt"] {
  background: #f7f7f7;
}
.table tbody tr td[data-group="thang"] {
  background: #f8f9fa;
}

/* Scrollbar đẹp */
::-webkit-scrollbar {
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: #496f95;
  border-radius: 8px;
}
</style>