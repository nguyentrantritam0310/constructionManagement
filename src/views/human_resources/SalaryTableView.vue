<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import { useSalary } from '../../composables/useSalary.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'
import { useAuth } from '../../composables/useAuth.js'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

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
  taxFinalizationData,
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
const setActiveTab = async (key) => {
  if (tabKeys.includes(key)) {
    activeTab.value = key
    router.replace({ path: route.path, query: { ...route.query, tab: key } }).catch(() => {})
  }
}

const personalSalaryData = computed(() => {
  if (!currentUser.value || !salaryTableData.value) return []
  
  return salaryTableData.value.filter(item => {
    const userId = String(currentUser.value.id)
    const empId = String(item.empId)
    return empId === userId
  })
})

// Định dạng tiền
function formatMoney(value) {
  return value?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) ?? ''
}

// Load dữ liệu khi component mount
onMounted(async () => {
  await fetchSalaryData()
  await fetchClosingStatus(selectedYear.value, selectedMonth.value)
})

const handleTimeChange = async (year, month) => {
  await fetchSalaryData(year, month)
}

const handleRecalculateSalaries = async () => {
  try {
    await recalculateAllSalaries(selectedYear.value, selectedMonth.value)
    showMessage('Tính lại lương thành công!', 'success')
  } catch (err) {
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const handleExportToExcel = async (type) => {
  try {
    await exportToExcel(type)
    showMessage('Xuất Excel thành công!', 'success')
  } catch (err) {
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const adjustMonth = (delta) => {
  const newMonth = selectedMonth.value + delta
  if (newMonth < 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else if (newMonth > 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value = newMonth
  }
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

const goToPreviousMonth = () => adjustMonth(-1)
const goToNextMonth = () => adjustMonth(1)

const goToCurrentMonth = () => {
  const now = new Date()
  selectedMonth.value = now.getMonth() + 1
  selectedYear.value = now.getFullYear()
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

const adjustYear = (delta) => {
  selectedYear.value += delta
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

const goToPreviousYear = () => adjustYear(-1)
const goToNextYear = () => adjustYear(1)

const goToCurrentYear = () => {
  selectedYear.value = new Date().getFullYear()
  handleTimeChange(selectedYear.value, selectedMonth.value)
}

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
  { key: 'otDays', label: 'Số ngày tăng ca' },
  { key: 'otDaysWithCoeff', label: 'Số ngày tăng ca có hệ số' },
  { key: 'otSalary', label: 'Lương tăng ca' },
  { key: 'mealAllowance', label: 'Phụ cấp ăn ca' },
  { key: 'fuelAllowance', label: 'Phụ cấp xăng xe' },
  { key: 'responsibilityAllowance', label: 'Phụ cấp trách nhiệm' },
  { key: 'totalSupport', label: 'Tổng các khoản hỗ trợ' },
  { key: 'insuranceEmployee', label: 'Bảo hiểm NV đóng' },
  { key: 'unionFee', label: 'Đoàn phí' },
  { key: 'adjustmentDeductions', label: 'Các khoản trừ khác' },
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

const salaryCurrentPage = ref(1)
const salaryItemsPerPage = ref(8)
const paginatedSalaryData = computed(() => {
  const start = (salaryCurrentPage.value - 1) * salaryItemsPerPage.value
  return salaryTableData.value.slice(start, start + salaryItemsPerPage.value)
})

const insuranceCurrentPage = ref(1)
const insuranceItemsPerPage = ref(8)
const paginatedInsuranceData = computed(() => {
  const start = (insuranceCurrentPage.value - 1) * insuranceItemsPerPage.value
  return insuranceTableData.value.slice(start, start + insuranceItemsPerPage.value)
})

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

const taxFinalizationColumns = [
  { key: 'empId', label: 'Mã nhân viên', group: 'Quyết toán thuế' },
  { key: 'empName', label: 'Tên nhân viên', group: 'Quyết toán thuế' },
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

// Sử dụng dữ liệu thật từ useSalary thay vì dữ liệu giả
const taxFinalizationTableData = computed(() => {
  // Lấy dữ liệu quyết toán thuế từ useSalary
  const taxData = taxFinalizationData.value
  
  if (!taxData || !taxData.employeeDetails) {
    return []
  }
  
  // Tạo dữ liệu quyết toán thuế từ dữ liệu thật
  return taxData.employeeDetails.map(emp => {
    const months = {}
    for (let m = 1; m <= 12; m++) {
      if (m === selectedMonth.value) {
        // Tháng được chọn: sử dụng dữ liệu thật
        months[`m${m}_totalDeduction`] = emp.personalDeduction + emp.dependentDeduction
        months[`m${m}_insuranceEmployee`] = emp.insuranceEmployee
        months[`m${m}_income`] = emp.totalIncome
        months[`m${m}_taxableIncome`] = emp.taxableIncome
        months[`m${m}_pitTax`] = emp.pitTax
        months[`m${m}_dependents`] = Math.floor(emp.dependentDeduction / 4400000)
      } else {
        // Các tháng khác: = 0 (chưa có dữ liệu)
        months[`m${m}_totalDeduction`] = 0
        months[`m${m}_insuranceEmployee`] = 0
        months[`m${m}_income`] = 0
        months[`m${m}_taxableIncome`] = 0
        months[`m${m}_pitTax`] = 0
        months[`m${m}_dependents`] = 0
      }
    }
    
    return {
      empId: emp.empId,
      empName: emp.empName,
      // Dữ liệu tổng hợp năm (hiện tại chỉ có tháng được chọn)
      year_totalDeduction: emp.personalDeduction + emp.dependentDeduction,
      year_insuranceEmployee: emp.insuranceEmployee,
      year_totalIncome: emp.totalIncome,
      year_taxableIncome: emp.taxableIncome,
      year_pitTax: emp.pitTax,
      year_dependents: Math.floor(emp.dependentDeduction / 4400000),
      ...months
    }
  })
})

const taxFinalizationCurrentPage = ref(1)
const taxFinalizationItemsPerPage = ref(8)
const paginatedTaxFinalizationData = computed(() => {
  const start = (taxFinalizationCurrentPage.value - 1) * taxFinalizationItemsPerPage.value
  return taxFinalizationTableData.value.slice(start, start + taxFinalizationItemsPerPage.value)
})

const exportTaxFinalizationToExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Quyết toán thuế TNCN')

    // Add title
    worksheet.mergeCells('A1:Z1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `BẢNG QUYẾT TOÁN THUẾ THU NHẬP CÁ NHÂN NĂM ${selectedYear.value}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' }
    }
    titleCell.font = { color: { argb: 'FFFFFFFF' }, size: 16, bold: true }

    // Add headers
    const headers = [
      'Mã NV', 'Tên nhân viên',
      'Tổng số NPT', 'Tổng số tiền giảm trừ', 'Tổng BH NV đóng', 'Tổng thu nhập', 'Tổng thu nhập chịu thuế', 'Thuế TNCN'
    ]
    
    // Add month headers
    for (let m = 1; m <= 12; m++) {
      headers.push(`T${m}_NPT`, `T${m}_Giảm trừ`, `T${m}_BH NV`, `T${m}_Thu nhập`, `T${m}_Chịu thuế`, `T${m}_Thuế`)
    }

    // Set headers
    worksheet.addRow(headers)
    const headerRow = worksheet.getRow(2)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    }

    // Add data rows
    taxFinalizationTableData.value.forEach(emp => {
      const row = [
        emp.empId,
        emp.empName,
        emp.year_dependents,
        emp.year_totalDeduction,
        emp.year_insuranceEmployee,
        emp.year_totalIncome,
        emp.year_taxableIncome,
        emp.year_pitTax
      ]
      
      // Add monthly data
      for (let m = 1; m <= 12; m++) {
        row.push(
          emp[`m${m}_dependents`],
          emp[`m${m}_totalDeduction`],
          emp[`m${m}_insuranceEmployee`],
          emp[`m${m}_income`],
          emp[`m${m}_taxableIncome`],
          emp[`m${m}_pitTax`]
        )
      }
      
      worksheet.addRow(row)
    })

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15
    })

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Quyet_toan_thue_TNCN_${selectedYear.value}.xlsx`)
    
    showMessage('Xuất Excel thành công!', 'success')
  } catch (error) {
    console.error('Error exporting Excel:', error)
    showMessage('Có lỗi khi xuất Excel!', 'error')
  }
}

const printSalaryReport = () => {
  try {
    const printWindow = window.open('', '_blank')
    const currentDate = new Date().toLocaleDateString('vi-VN')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo bảng lương tháng ${selectedMonth.value}/${selectedYear.value}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BẢNG LƯƠNG THÁNG ${selectedMonth.value}/${selectedYear.value}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tên nhân viên</th>
              <th>Lương hợp đồng</th>
              <th>Tổng ngày công</th>
              <th>Tổng nghỉ có lương</th>
              <th>Lương thực tế</th>
              <th>Tổng thu nhập</th>
              <th>Tổng các khoản trừ</th>
              <th>Thực lãnh</th>
            </tr>
          </thead>
          <tbody>
            ${salaryTableData.value.map(emp => `
              <tr>
                <td>${emp.empId}</td>
                <td>${emp.empName}</td>
                <td>${formatMoney(emp.contractSalary)}</td>
                <td>${emp.totalDays}</td>
                <td>${emp.paidLeaveDays}</td>
                <td>${formatMoney(emp.actualSalary)}</td>
                <td>${formatMoney(emp.totalIncome)}</td>
                <td>${formatMoney(emp.totalDeduction)}</td>
                <td>${formatMoney(emp.netSalary)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div>Ngày in: ${currentDate}</div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    
    showMessage('Đã mở cửa sổ in!', 'success')
  } catch (error) {
    console.error('Error printing report:', error)
    showMessage('Có lỗi khi in báo cáo!', 'error')
  }
}

const printInsuranceReport = () => {
  try {
    const printWindow = window.open('', '_blank')
    const currentDate = new Date().toLocaleDateString('vi-VN')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo bảo hiểm tháng ${selectedMonth.value}/${selectedYear.value}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BẢO HIỂM THEO THÁNG ${selectedMonth.value}/${selectedYear.value}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tên nhân viên</th>
              <th>Lương cơ bản</th>
              <th>BHXH NV</th>
              <th>BHYT NV</th>
              <th>BHTN NV</th>
              <th>Tổng BH NV</th>
              <th>BHXH CT</th>
              <th>BHYT CT</th>
              <th>BHTN CT</th>
              <th>Tổng BH CT</th>
            </tr>
          </thead>
          <tbody>
            ${insuranceTableData.value.map(emp => `
              <tr>
                <td>${emp.empId}</td>
                <td>${emp.empName}</td>
                <td>${formatMoney(emp.basicSalary)}</td>
                <td>${formatMoney(emp.socialInsuranceEmployee)}</td>
                <td>${formatMoney(emp.healthInsuranceEmployee)}</td>
                <td>${formatMoney(emp.unemploymentInsuranceEmployee)}</td>
                <td>${formatMoney(emp.totalInsuranceEmployee)}</td>
                <td>${formatMoney(emp.socialInsuranceCompany)}</td>
                <td>${formatMoney(emp.healthInsuranceCompany)}</td>
                <td>${formatMoney(emp.unemploymentInsuranceCompany)}</td>
                <td>${formatMoney(emp.totalInsuranceCompany)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div>Ngày in: ${currentDate}</div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    
    showMessage('Đã mở cửa sổ in!', 'success')
  } catch (error) {
    console.error('Error printing report:', error)
    showMessage('Có lỗi khi in báo cáo!', 'error')
  }
}

const printTaxReport = () => {
  try {
    const printWindow = window.open('', '_blank')
    const currentDate = new Date().toLocaleDateString('vi-VN')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo thuế TNCN tháng ${selectedMonth.value}/${selectedYear.value}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">THUẾ TNCN THÁNG ${selectedMonth.value}/${selectedYear.value}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tên nhân viên</th>
              <th>Tổng thu nhập</th>
              <th>Tổng thu nhập chịu thuế</th>
              <th>Tổng thu nhập tính thuế</th>
              <th>Thuế TNCN</th>
              <th>Số người phụ thuộc</th>
              <th>Giảm trừ bản thân</th>
              <th>Giảm trừ người phụ thuộc</th>
            </tr>
          </thead>
          <tbody>
            ${taxTableData.value.map(emp => `
              <tr>
                <td>${emp.empId}</td>
                <td>${emp.empName}</td>
                <td>${formatMoney(emp.totalIncome)}</td>
                <td>${formatMoney(emp.taxableIncome)}</td>
                <td>${formatMoney(emp.pitIncome)}</td>
                <td>${formatMoney(emp.pitTax)}</td>
                <td>${emp.dependents}</td>
                <td>${formatMoney(emp.personalDeduction)}</td>
                <td>${formatMoney(emp.dependentDeduction)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div>Ngày in: ${currentDate}</div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    
    showMessage('Đã mở cửa sổ in!', 'success')
  } catch (error) {
    console.error('Error printing report:', error)
    showMessage('Có lỗi khi in báo cáo!', 'error')
  }
}

// Print report function for tax finalization
const printTaxFinalizationReport = () => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    const taxData = taxFinalizationData.value
    const currentDate = new Date().toLocaleDateString('vi-VN')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo quyết toán thuế TNCN ${selectedYear.value}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 14px; color: #666; }
          .summary { margin-bottom: 20px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .summary-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BẢNG QUYẾT TOÁN THUẾ THU NHẬP CÁ NHÂN</div>
          <div class="subtitle">Năm ${selectedYear.value}</div>
        </div>
        
        <div class="summary">
          <div class="summary-row">
            <span class="summary-label">Tổng số nhân viên:</span>
            <span>${taxData?.totalEmployees || 0}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Tổng thu nhập:</span>
            <span>${formatMoney(taxData?.totalIncome || 0)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Tổng thuế TNCN:</span>
            <span>${formatMoney(taxData?.totalPitTax || 0)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Tổng bảo hiểm nhân viên:</span>
            <span>${formatMoney(taxData?.totalInsuranceEmployee || 0)}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th rowspan="2">Mã NV</th>
              <th rowspan="2">Tên nhân viên</th>
              <th colspan="6">Quyết toán thuế</th>
              ${Array.from({length: 12}, (_, i) => `<th colspan="6">Tháng ${i+1}</th>`).join('')}
            </tr>
            <tr>
              <th>Tổng số NPT</th>
              <th>Tổng số tiền giảm trừ</th>
              <th>Tổng BH NV đóng</th>
              <th>Tổng thu nhập</th>
              <th>Tổng thu nhập chịu thuế</th>
              <th>Thuế TNCN</th>
              ${Array.from({length: 12}, () => 
                '<th>Tổng số NPT</th><th>Tổng số tiền giảm trừ</th><th>Tổng BH NV đóng</th><th>Tổng thu nhập</th><th>Tổng thu nhập chịu thuế</th><th>Thuế TNCN</th>'
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${taxFinalizationTableData.value.map(emp => `
              <tr>
                <td>${emp.empId}</td>
                <td>${emp.empName}</td>
                <td>${emp.year_dependents}</td>
                <td>${formatMoney(emp.year_totalDeduction)}</td>
                <td>${formatMoney(emp.year_insuranceEmployee)}</td>
                <td>${formatMoney(emp.year_totalIncome)}</td>
                <td>${formatMoney(emp.year_taxableIncome)}</td>
                <td>${formatMoney(emp.year_pitTax)}</td>
                ${Array.from({length: 12}, (_, i) => {
                  const m = i + 1
                  return `
                    <td>${emp[`m${m}_dependents`]}</td>
                    <td>${formatMoney(emp[`m${m}_totalDeduction`])}</td>
                    <td>${formatMoney(emp[`m${m}_insuranceEmployee`])}</td>
                    <td>${formatMoney(emp[`m${m}_income`])}</td>
                    <td>${formatMoney(emp[`m${m}_taxableIncome`])}</td>
                    <td>${formatMoney(emp[`m${m}_pitTax`])}</td>
                  `
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div>Ngày in: ${currentDate}</div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    
    showMessage('Đã mở cửa sổ in!', 'success')
  } catch (error) {
    console.error('Error printing report:', error)
    showMessage('Có lỗi khi in báo cáo!', 'error')
  }
}
</script>

<template>
  <div class="container-fluid py-4">
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
      <!-- Header Section -->
      <div class="salary-header mb-4">
        <div class="row g-3 align-items-center">
          <!-- Cột trái: Bộ lọc tháng + Action buttons -->
          <div class="col-md-8">
            <div class="d-flex align-items-center gap-4">
              <!-- Bộ lọc tháng -->
              <div class="time-filter-compact">
                <div class="d-flex align-items-center gap-2">
                  <button 
                    class="btn btn-outline-light btn-sm" 
                    @click="goToPreviousMonth"
                    title="Tháng trước"
                    :disabled="loading"
                  >
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <div class="text-center px-2">
                    <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                  </div>
                  <button 
                    class="btn btn-outline-light btn-sm" 
                    @click="goToNextMonth"
                    title="Tháng sau"
                    :disabled="loading"
                  >
                    <i class="fas fa-chevron-right"></i>
                  </button>
                  <button 
                    class="btn btn-outline-light btn-sm" 
                    @click="goToCurrentMonth"
                    title="Tháng hiện tại"
                    :disabled="loading"
                  >
                    <i class="fas fa-calendar-day"></i>
                  </button>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="d-flex gap-2">
                <button class="btn btn-outline-light btn-sm" @click="handleExportToExcel('salary')" :disabled="loading">
                  <i class="fas fa-download me-1"></i>
                  Xuất Excel
                </button>
                <button class="btn btn-outline-light btn-sm" @click="printSalaryReport">
                  <i class="fas fa-print me-1"></i>
                  In báo cáo
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
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
          <template #adjustmentDeductions="{ item }">
            <span class="money">{{ formatMoney(item.adjustmentDeductions) }}</span>
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
          <template #otDays="{ item }">
            <span 
              class="overtime-days-link" 
              @click="openOvertimeModal(item)"
              :title="`Xem chi tiết tăng ca của ${item.empName}`"
            >
              {{ item.otDays }} ngày
            </span>
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
          <div class="card-body py-3">
            <div class="row align-items-center">
              <div class="col-lg-8">
                <div class="d-flex align-items-center">
                  <div class="personal-icon-wrapper me-3">
                    <i class="fas fa-user-circle"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h5 class="mb-1 text-primary fw-bold">
                      <i class="fas fa-money-bill-wave me-2"></i>
                      Bảng lương cá nhân
                    </h5>
                    <p class="mb-0 text-muted small">
                      <i class="fas fa-calendar-alt me-1"></i>
                      Tháng {{ selectedMonth }}/{{ selectedYear }}
                    </p>
                    <div v-if="currentUser" class="employee-info-compact mt-1">
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
                  <span class="salary-label">Số ngày tăng ca:</span>
                  <span class="salary-value overtime-link" @click="openOvertimeModal(personalSalaryData[0])">
                    {{ personalSalaryData[0].otDays }} ngày
                  </span>
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
                  <span class="salary-label">Các khoản trừ khác:</span>
                  <span class="salary-value">{{ formatMoney(personalSalaryData[0].adjustmentDeductions) }}</span>
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
      <!-- Header Section -->
      <div class="insurance-header mb-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-6">
            <div class="time-filter-compact">
              <div class="d-flex align-items-center gap-3">
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToPreviousMonth"
                  title="Tháng trước"
                  :disabled="loading"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                <div class="text-center px-3">
                  <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                </div>
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToNextMonth"
                  title="Tháng sau"
                  :disabled="loading"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToCurrentMonth"
                  title="Tháng hiện tại"
                  :disabled="loading"
                >
                  <i class="fas fa-calendar-day"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="header-actions d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-light btn-sm" @click="handleExportToExcel('insurance')" :disabled="loading">
                <i class="fas fa-download me-1"></i>
                Xuất Excel
              </button>
              <button class="btn btn-outline-light btn-sm" @click="printInsuranceReport">
                <i class="fas fa-print me-1"></i>
                In báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="text-muted">
          <small>Tổng số nhân viên: {{ insuranceTableData.length }}</small>
        </div>
      </div>
      
      <!-- Insurance Table Container -->
      <div class="insurance-table-container">
        <div class="table-responsive">
          <table class="table insurance-table">
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
        
        <!-- Pagination -->
        <div class="insurance-pagination mt-3">
          <Pagination
            :totalItems="insuranceTableData.length"
            :itemsPerPage="insuranceItemsPerPage"
            :currentPage="insuranceCurrentPage"
            @update:currentPage="insuranceCurrentPage = $event"
          />
        </div>
      </div>
    </div>
    <!-- Tax Tab -->
    <div v-else-if="activeTab === 'tax'">
      <!-- Header Section -->
      <div class="tax-header mb-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-6">
            <div class="time-filter-compact">
              <div class="d-flex align-items-center gap-3">
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToPreviousMonth"
                  title="Tháng trước"
                  :disabled="loading"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                <div class="text-center px-3">
                  <h6 class="mb-0 fw-semibold text-white">Tháng {{ selectedMonth }}/{{ selectedYear }}</h6>
                </div>
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToNextMonth"
                  title="Tháng sau"
                  :disabled="loading"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToCurrentMonth"
                  title="Tháng hiện tại"
                  :disabled="loading"
                >
                  <i class="fas fa-calendar-day"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="header-actions d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-light btn-sm" @click="handleExportToExcel('tax')" :disabled="loading">
                <i class="fas fa-download me-1"></i>
                Xuất Excel
              </button>
              <button class="btn btn-outline-light btn-sm" @click="printTaxReport">
                <i class="fas fa-print me-1"></i>
                In báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
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
    <!-- Tax Finalization Tab -->
    <div v-else-if="activeTab === 'taxFinalization'">
      <!-- Header Section -->
      <div class="tax-finalization-header mb-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-6">
            <div class="year-filter-compact">
              <div class="d-flex align-items-center gap-3">
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToPreviousYear"
                  title="Năm trước"
                  :disabled="loading"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                <div class="text-center px-3">
                  <h6 class="mb-0 fw-semibold text-white">Năm {{ selectedYear }}</h6>
                </div>
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToNextYear"
                  title="Năm sau"
                  :disabled="loading"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button 
                  class="btn btn-outline-light btn-sm" 
                  @click="goToCurrentYear"
                  title="Năm hiện tại"
                  :disabled="loading"
                >
                  <i class="fas fa-calendar-day"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="header-actions d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-light btn-sm" @click="exportTaxFinalizationToExcel">
                <i class="fas fa-download me-1"></i>
                Xuất Excel
              </button>
              <button class="btn btn-outline-light btn-sm" @click="printTaxFinalizationReport">
                <i class="fas fa-print me-1"></i>
                In báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="row g-3 mb-4" v-if="taxFinalizationData && taxFinalizationData.totalEmployees > 0">
        <div class="col-md-3">
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Tổng nhân viên</div>
              <div class="summary-value">{{ taxFinalizationData.totalEmployees }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Tổng thu nhập</div>
              <div class="summary-value">{{ formatMoney(taxFinalizationData.totalIncome) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Tổng thuế TNCN</div>
              <div class="summary-value">{{ formatMoney(taxFinalizationData.totalPitTax) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Tổng BH NV</div>
              <div class="summary-value">{{ formatMoney(taxFinalizationData.totalInsuranceEmployee) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="tax-table-container">
        <div class="table-responsive">
          <table class="table tax-finalization-table">
          <thead>
            <tr>
              <th rowspan="2">Mã nhân viên</th>
              <th rowspan="2">Tên nhân viên</th>
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
        
        <!-- Pagination -->
        <div class="tax-pagination mt-3">
          <Pagination
            :totalItems="taxFinalizationTableData.length"
            :itemsPerPage="taxFinalizationItemsPerPage"
            :currentPage="taxFinalizationCurrentPage"
            @update:currentPage="taxFinalizationCurrentPage = $event"
          />
        </div>
      </div>
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
              <span class="summary-label">Số ngày tăng ca:</span>
              <span class="summary-value">{{ selectedOvertimeEmployee.otDays }} ngày</span>
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
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.4s ease-out;
}

/* Leave Card - unified light style */
.leave-card {
  background: #fff;
  color: inherit;
  border: 1px solid #dee2e6;
}

.personal-salary-header .card {
  background: transparent;
  border: none;
}

.personal-salary-header .card-body {
  background: linear-gradient(135deg, #fafbfd 0%, #ffffff 100%);
  transition: all 0.3s ease;
}

.personal-salary-header:hover .card-body {
  background: linear-gradient(135deg, #f5f7fb 0%, #fafafa 100%);
}

.personal-icon-wrapper {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #495057;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
  cursor: pointer;
}

.personal-icon-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #e0e8f0 0%, #d9dfe8 100%);
}

.personal-salary-header .info-label {
  color: #6c757d;
}

.personal-salary-header .info-value {
  color: #212529;
}

.net-salary-display {
  text-align: center;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f0f9f5 0%, #e8f5e9 100%);
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  transition: all 0.3s ease;
  cursor: default;
}

.net-salary-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
  border-color: #a3d9a5;
}

.net-salary-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.net-salary-amount {
  font-size: 1.75rem;
  font-weight: 700;
  color: #28a745;
}

.salary-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #dee2e6;
  height: 100%;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.salary-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-3px);
  border-color: #cbd5e0;
}

.salary-card .card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0 !important;
  padding: 1rem 1.25rem;
  transition: all 0.3s ease;
}

.salary-card:hover .card-header {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.salary-card .card-header h6 {
  color: #212529;
  font-weight: 600;
  font-size: 1rem;
  margin: 0;
  display: flex;
  align-items: center;
}

.salary-card .card-header h6 i {
  margin-right: 0.5rem;
  color: #6c757d;
  font-size: 1rem;
}

.salary-card .card-body {
  padding: 1.25rem;
}

.salary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
  transition: all 0.25s ease;
}

.salary-item:hover {
  background-color: #f8f9fa;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  margin: 0 -0.5rem;
  border-radius: 6px;
}

.salary-item:last-child {
  border-bottom: none;
}

.salary-item.total-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
  margin-top: 0.75rem;
  padding: 0.875rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
}

.salary-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.9rem;
}

.salary-value {
  font-weight: 600;
  color: #212529;
  font-size: 0.9rem;
}

.salary-value.overtime-link {
  color: #3498db;
  cursor: pointer;
  text-decoration: underline;
  transition: all 0.25s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.salary-value.overtime-link:hover {
  color: #2980b9;
  text-decoration: none;
  background-color: rgba(52, 152, 219, 0.1);
  transform: scale(1.05);
}

.final-summary-card {
  background: #fff;
  border: 2px solid #28a745;
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.final-summary-card:hover {
  box-shadow: 0 6px 16px rgba(40, 167, 69, 0.2);
  transform: translateY(-3px);
}

.final-summary-card .card-header {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-bottom: 1px solid #c3e6cb;
}

.final-summary-card .card-header h6 {
  color: #212529;
  font-weight: 600;
}

.final-summary-card .card-header h6 i {
  color: #6c757d;
}

.final-summary-card .card-body {
  background: transparent;
}

.final-summary {
  padding: 0.5rem 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
  transition: all 0.25s ease;
}

.summary-row:hover {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  margin: 0 -0.5rem;
  background-color: rgba(248, 249, 250, 0.5);
  border-radius: 6px;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.9rem;
}

.summary-value {
  font-weight: 600;
  font-size: 0.9rem;
}

.summary-value.income {
  color: #28a745;
}

.summary-value.deduction {
  color: #dc3545;
}

.summary-value.net-salary {
  color: #28a745;
  font-size: 1.1rem;
  font-weight: 700;
}

.summary-divider {
  height: 1px;
  background: #dee2e6;
  margin: 0.75rem 0;
}

.final-row {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  margin: 0 -1.25rem -1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 0 0 6px 6px;
  border-top: 1px solid #c3e6cb;
  transition: all 0.3s ease;
}

.final-row:hover {
  background: linear-gradient(135deg, #d4edda 0%, #b8e0c0 100%);
}

/* Responsive adjustments */
/* Feedback History Header */
.feedback-history-header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
}

/* Feedback History Content */
.feedback-history-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation for cards */
.personal-salary-content .row > div:nth-child(1) .salary-card {
  animation-delay: 0.1s;
}

.personal-salary-content .row > div:nth-child(2) .salary-card {
  animation-delay: 0.2s;
}

.personal-salary-content .row > div:nth-child(3) .salary-card {
  animation-delay: 0.3s;
}

.personal-salary-content .row > div:nth-child(4) .salary-card {
  animation-delay: 0.4s;
}

.personal-salary-content .row > div:nth-child(5) .salary-card {
  animation-delay: 0.5s;
}

.personal-salary-content .row > div:nth-child(6) .salary-card {
  animation-delay: 0.6s;
}

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
  
  .salary-card:hover {
    transform: translateY(-2px);
  }
}


/* Header Styles for all tabs */
.salary-header,
.insurance-header,
.tax-header,
.tax-finalization-header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
}

.year-filter-compact .btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.year-filter-compact .btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  transform: translateY(-1px);
}

.header-actions .btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.header-actions .btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  transform: translateY(-1px);
}

/* Summary Cards */
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
}

/* Insurance Table Container */
.insurance-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.insurance-table {
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.insurance-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: none;
  padding: 1rem 0.75rem;
  font-weight: 600;
  color: #495057;
  text-align: center;
  vertical-align: middle;
  border-bottom: 2px solid #dee2e6;
}

.insurance-table th.group-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  font-weight: 700;
  font-size: 0.9rem;
}

.insurance-table td {
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
  text-align: center;
}

.insurance-table tbody tr:hover {
  background: rgba(52, 152, 219, 0.05);
}

.insurance-table tbody tr:last-child td {
  border-bottom: none;
}

/* Insurance Pagination */
.insurance-pagination {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* Tax Table Container */
.tax-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tax-finalization-table {
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.tax-finalization-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: none;
  padding: 1rem 0.75rem;
  font-weight: 600;
  color: #495057;
  text-align: center;
  vertical-align: middle;
  border-bottom: 2px solid #dee2e6;
}

.tax-finalization-table th.group-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  font-weight: 700;
  font-size: 0.9rem;
}

.tax-finalization-table td {
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
  text-align: center;
}

.tax-finalization-table tbody tr:hover {
  background: rgba(52, 152, 219, 0.05);
}

.tax-finalization-table tbody tr:last-child td {
  border-bottom: none;
}

/* Pagination */
.tax-pagination {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* Responsive */
@media (max-width: 768px) {
  .tax-finalization-header .row {
    text-align: center;
  }
  
  .header-actions {
    justify-content: center !important;
    margin-top: 1rem;
  }
  
  .summary-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .summary-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

/* Feedback Button Styles */
.btn-feedback-salary {
  background: linear-gradient(135deg, #fd7e14, #ffc107);
  border: none;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(253, 126, 20, 0.3);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.btn-feedback-salary:hover {
  background: linear-gradient(135deg, #e55a00, #e0a800);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(253, 126, 20, 0.4);
  color: white;
}

.btn-feedback-salary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(253, 126, 20, 0.3);
}

.btn-feedback-salary i {
  font-size: 1.1rem;
}

.btn-feedback-salary span {
  font-weight: 600;
}

/* Closing Status Styles */
.closing-status-badge {
  display: flex;
  align-items: center;
}

.closing-status-badge .badge {
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.closing-status-badge .badge.bg-success {
  background: linear-gradient(135deg, #28a745, #20c997) !important;
  color: white;
}

.closing-status-badge .badge.bg-warning {
  background: linear-gradient(135deg, #ffc107, #fd7e14) !important;
  color: white;
}

.closing-status-badge .badge.bg-info {
  background: linear-gradient(135deg, #17a2b8, #6f42c1) !important;
  color: white;
}

.closing-details {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  border-left: 3px solid #17a2b8;
}

.closing-details small {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Close Button Styles */
.btn-warning {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e0a800, #e55a00);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545, #e83e8c);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333, #d63384);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
  color: white;
}

/* Status Badge Styles - Matching AttendanceSummaryView */
.closing-status-simple {
  display: flex;
  align-items: center;
}

.status-badge-simple {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.status-badge-simple.success {
  color: #155724;
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.25);
  font-weight: 700;
}

.status-badge-simple.warning {
  color: #155724;
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.25);
  font-weight: 700;
}

.status-badge-simple.info {
  color: #ffc107;
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.15);
  font-weight: 700;
}

</style>