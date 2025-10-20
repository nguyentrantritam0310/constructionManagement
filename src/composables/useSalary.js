import { ref, computed } from 'vue'
import { salaryService } from '../services/salaryService.js'
import { useEmployee } from './useEmployee.js'
import { useContract } from './useContract.js'
import { useAttendance } from './useAttendance.js'
import { useShiftAssignment } from './useShiftAssignment.js'
import { useFamilyRelation } from './useFamilyRelation.js'
import { useLeaveRequest } from './useLeaveRequest.js'
import { useOvertimeRequest } from './useOvertimeRequest.js'
import { usePayrollAdjustment } from './usePayrollAdjustment.js'

export function useSalary() {
  // State
  const salaryData = ref([])
  const insuranceData = ref([])
  const taxData = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedYear = ref(new Date().getFullYear())
  const selectedMonth = ref(new Date().getMonth() + 1)

  // Composables
  const { employees, fetchAllEmployees } = useEmployee()
  const { contracts, fetchAllContracts } = useContract()
  const { attendanceList, fetchAttendance } = useAttendance()
  const { shiftAssignments, fetchAllShiftAssignments } = useShiftAssignment()
  const { familyRelations, fetchAllFamilyRelations } = useFamilyRelation()
  const { leaveRequests, fetchLeaveRequests } = useLeaveRequest()
  const { overtimeRequests, fetchOvertimeRequests } = useOvertimeRequest()
  const { payrollAdjustments, fetchPayrollAdjustments } = usePayrollAdjustment()

  // Computed properties
  const salaryTableData = computed(() => {
    if (!employees.value || employees.value.length === 0) return []
    
    return employees.value.map((employee, index) => {
      // Tìm hợp đồng của nhân viên
      const contract = contracts.value.find(c => c.employeeID === employee.id)
      
      // Tìm dữ liệu chấm công của nhân viên trong tháng
      const attendanceData = attendanceList.value.filter(att => 
        att.employeeID === employee.id && 
        new Date(att.workDate).getMonth() + 1 === selectedMonth.value &&
        new Date(att.workDate).getFullYear() === selectedYear.value
      )

      // Tính toán các chỉ số từ dữ liệu thực tế
      const contractSalary = contract?.contractSalary || 0
      const insuranceSalary = contract?.insuranceSalary || 0
      
      // Tính tổng ngày công chuẩn từ số ngày được phân ca trong tháng
      const assignedDays = shiftAssignments.value.filter(assignment => {
        const assignmentDate = new Date(assignment.workDate)
        return assignment.employeeID === employee.id && 
               assignmentDate.getMonth() + 1 === selectedMonth.value &&
               assignmentDate.getFullYear() === selectedYear.value
      }).length
      
      const standardDays = assignedDays || 0 // Ngày công chuẩn = số ngày được phân ca
      
      // Tính tổng ngày công = tổng ngày đi làm từ tab dữ liệu chấm công chi tiết
      // Đếm số ngày duy nhất có dữ liệu chấm công hợp lệ (có checkIn và checkOut)
      const validAttendanceDays = attendanceData.filter(att => {
        // Kiểm tra có dữ liệu chấm công hợp lệ
        const hasValidCheckIn = att.checkInTime && att.checkInTime.trim() !== ''
        const hasValidCheckOut = att.checkOutTime && att.checkOutTime.trim() !== ''
        
        // Chỉ tính những ngày có cả check-in và check-out
        return hasValidCheckIn && hasValidCheckOut
      })
      
      // Lấy danh sách các ngày duy nhất (tránh đếm trùng lặp)
      const uniqueWorkDays = new Set()
      validAttendanceDays.forEach(att => {
        const workDate = new Date(att.workDate || att.attendanceDate).toISOString().split('T')[0]
        uniqueWorkDays.add(workDate)
      })
      
      const totalDays = uniqueWorkDays.size
      
      // Tính tổng nghỉ có lương = tổng số ngày nghỉ phép từ leave requests
      const approvedLeaveRequests = leaveRequests.value.filter(leave => {
        const leaveStartDate = new Date(leave.startDateTime)
        const leaveEndDate = new Date(leave.endDateTime)
        
        return leave.employeeID === employee.id &&
               leaveStartDate.getMonth() + 1 === selectedMonth.value &&
               leaveStartDate.getFullYear() === selectedYear.value &&
               (leave.approveStatus === 'Đã duyệt' || leave.approveStatus === 'Approved') &&
               leave.leaveTypeName && leave.leaveTypeName.toLowerCase().includes('phép')
      })
      
      // Tính tổng số ngày nghỉ phép (không phải số phiếu)
      let totalPaidLeaveDays = 0
      approvedLeaveRequests.forEach(leave => {
        const startDate = new Date(leave.startDateTime)
        const endDate = new Date(leave.endDateTime)
        
        // Tính số ngày nghỉ trong phiếu này
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        totalPaidLeaveDays += daysDiff
      })
      
      const paidLeaveDays = totalPaidLeaveDays
      
      // Tính công tăng ca và lương tăng ca
      // Lọc các đơn tăng ca đã duyệt trong tháng
      const approvedOvertimeForMonth = (overtimeRequests?.value || []).filter(ot => {
        if (!ot || !ot.startDateTime) return false
        const start = new Date(ot.startDateTime)
        const isSameMonth = (start.getFullYear() === selectedYear.value) && (start.getMonth() + 1 === selectedMonth.value)
        const isApproved = ot.approveStatus === 'Đã duyệt' || ot.approveStatus === 'Approved' || ot.approveStatus === 2
        const employeeMatch = ot.employeeID === employee.id || String(ot.employeeID) === String(employee.id)
        return isSameMonth && isApproved && employeeMatch
      })

      // Tính tổng số giờ tăng ca và các chỉ số chi tiết
      let totalOvertimeHours = 0 // tổng giờ tăng ca
      let totalOvertimeDayUnits = 0 // tổng ngày quy đổi (8h = 1 ngày)
      let totalOvertimeHoursWithCoeff = 0 // tổng giờ có hệ số
      let totalOvertimeDaysWithCoeff = 0 // tổng ngày có hệ số
      
      approvedOvertimeForMonth.forEach(ot => {
        const start = new Date(ot.startDateTime)
        const end = new Date(ot.endDateTime)
        const hours = Math.max(0, (end - start) / (1000 * 60 * 60))
        const dayUnits = hours / 8
        const coeff = Number(ot.coefficient) || 1
        
        totalOvertimeHours += hours
        totalOvertimeDayUnits += dayUnits
        totalOvertimeHoursWithCoeff += hours * coeff
        totalOvertimeDaysWithCoeff += dayUnits * coeff
      })

      const otDays = Math.round(totalOvertimeDayUnits * 100) / 100
      const otHours = Math.round(totalOvertimeHours * 100) / 100
      const otHoursWithCoeff = Math.round(totalOvertimeHoursWithCoeff * 100) / 100
      const otDaysWithCoeff = Math.round(totalOvertimeDaysWithCoeff * 100) / 100
      const otSalary = standardDays > 0 ? (contractSalary * totalOvertimeDaysWithCoeff / standardDays) : 0

      // Tính lương theo ngày công = lương hợp đồng * tổng ngày công / tổng ngày công chuẩn
      const salaryByDays = standardDays > 0 ? contractSalary * (totalDays / standardDays) : 0
      
      // Tính tổng lương phép = lương hợp đồng * tổng nghỉ có lương / tổng ngày công chuẩn
      const leaveSalary = standardDays > 0 ? contractSalary * (paidLeaveDays / standardDays) : 0
      
      // Tính tổng lương thực tế = lương theo ngày công + tổng lương phép
      const actualSalary = salaryByDays + leaveSalary
      
      // Tính các khoản phụ cấp từ hợp đồng
      const mealAllowance = contract?.allowances?.find(a => 
        a.allowanceName?.toLowerCase().includes('ăn') || 
        a.allowanceName?.toLowerCase().includes('meal') ||
        a.allowanceName?.toLowerCase().includes('trưa') ||
        a.allowanceName?.toLowerCase().includes('ca')
      )?.value || 0
      
      const fuelAllowance = contract?.allowances?.find(a => 
        a.allowanceName?.toLowerCase().includes('xăng') || 
        a.allowanceName?.toLowerCase().includes('xe') ||
        a.allowanceName?.toLowerCase().includes('fuel') ||
        a.allowanceName?.toLowerCase().includes('điện thoại')
      )?.value || 0
      
      const responsibilityAllowance = contract?.allowances?.find(a => 
        a.allowanceName?.toLowerCase().includes('trách nhiệm') ||
        a.allowanceName?.toLowerCase().includes('responsibility')
      )?.value || 0
      
      // Debug: Log allowance information for first employee
      if (index === 0) {
        console.log('=== ALLOWANCE DEBUG ===')
        console.log('Employee:', employee.firstName, employee.lastName)
        console.log('Contract allowances:', contract?.allowances)
        console.log('Meal allowance:', mealAllowance)
        console.log('Fuel allowance:', fuelAllowance)
        console.log('Responsibility allowance:', responsibilityAllowance)
        console.log('=== END ALLOWANCE DEBUG ===')
      }
      
      // Tính bảo hiểm nhân viên đóng
      const insuranceEmployee = insuranceSalary * 0.105 // 10.5%
      const unionFee = insuranceSalary * 0.01 // 1% đoàn phí
      
      // Tính số người phụ thuộc từ quan hệ gia đình
      // Chỉ tính những người có quan hệ trong khoảng thời gian của tháng được chọn
      const monthStartDate = new Date(selectedYear.value, selectedMonth.value - 1, 1) // Ngày đầu tháng
      const monthEndDate = new Date(selectedYear.value, selectedMonth.value, 0) // Ngày cuối tháng
      
      const dependents = familyRelations.value.filter(relation => {
        // Kiểm tra quan hệ gia đình của nhân viên này
        const isEmployeeRelation = relation.employeeID === employee.id
        
        // Kiểm tra thời gian hiệu lực (từ ngày bắt đầu đến ngày kết thúc)
        const startDate = new Date(relation.startDate)
        const endDate = new Date(relation.endDate)
        
        // Kiểm tra xem quan hệ có hiệu lực trong tháng được chọn không
        // Quan hệ phải có ít nhất 1 ngày trong tháng được chọn
        const isActiveInMonth = (startDate <= monthEndDate) && (endDate >= monthStartDate)
        
        // Chỉ tính các mối quan hệ phụ thuộc (con, vợ/chồng, cha/mẹ)
        const isDependentRelation = ['Con', 'Vợ', 'Chồng', 'Cha', 'Mẹ'].includes(relation.relationShipName)
        
        return isEmployeeRelation && isActiveInMonth && isDependentRelation
      }).length
      
      // Tính các khoản trừ từ khoản cộng trừ
      // Chỉ tính các khoản cộng trừ có tính chất TRỪ: Kỷ luật, Truy thu, Tạm ứng
      // và tất cả các hạng mục thuộc các khoản này
      const getAdjustmentDeductions = (employeeId, year, month) => {
        // Lấy các khoản cộng trừ đã duyệt trong tháng
        const approvedAdjustments = (payrollAdjustments?.value || []).filter(adj => {
          if (!adj || !adj.decisionDate) return false
          const adjDate = new Date(adj.decisionDate)
          const adjMonth = adjDate.getMonth() + 1
          const adjYear = adjDate.getFullYear()
          
          return adjYear === year && 
                 adjMonth === month &&
                 (adj.approveStatus === 'Đã duyệt' || adj.approveStatus === 'Approved') &&
                 // CHỈ LẤY CÁC KHOẢN CÓ TÍNH CHẤT TRỪ:
                 // - Kỷ luật: các hình thức kỷ luật, phạt
                 // - Truy thu: thu hồi các khoản đã chi
                 // - Tạm ứng: tạm ứng lương, chi phí
                 ['Kỷ luật', 'Truy thu', 'Tạm ứng'].includes(adj.adjustmentTypeName)
        })
        
        // Tính tổng giá trị các khoản trừ cho nhân viên này
        let totalAdjustmentDeductions = 0
        approvedAdjustments.forEach(adj => {
          const employees = adj.Employees || adj.employees || []
          employees.forEach(emp => {
            if (emp.employeeID === employeeId || emp.employeeCode === employee.id) {
              totalAdjustmentDeductions += Math.abs(emp.Value || emp.value || 0)
            }
          })
        })
        
        return totalAdjustmentDeductions
      }
      
      const adjustmentDeductions = getAdjustmentDeductions(employee.id, selectedYear.value, selectedMonth.value)
      
      // Tính thuế TNCN
      const personalDeduction = 11000000 // Giảm trừ bản thân
      const dependentDeduction = dependents * 4400000 // Giảm trừ người phụ thuộc
      
      const totalIncome = actualSalary + mealAllowance + fuelAllowance + responsibilityAllowance + otSalary
      
      // THAY ĐỔI LOGIC TÍNH THUẾ:
      // 1. Tổng thu nhập chịu thuế = Tổng thu nhập (không trừ gì)
      const taxableIncome = totalIncome
      
      // 2. Tổng thu nhập tính thuế = IF(tổng thu nhập - bảo hiểm NV đóng - giảm trừ bản thân - giảm trừ người phụ thuộc > 0, ..., 0)
      const pitIncome = Math.max(0, totalIncome - insuranceEmployee - personalDeduction - dependentDeduction)
      
      // 3. Tính thuế TNCN theo thuế luỹ tiến từ pitIncome
      let pitTax = 0
      if (pitIncome > 0) {
        if (pitIncome <= 5000000) {
          pitTax = pitIncome * 0.05
        } else if (pitIncome <= 10000000) {
          pitTax = 250000 + (pitIncome - 5000000) * 0.1
        } else if (pitIncome <= 18000000) {
          pitTax = 750000 + (pitIncome - 10000000) * 0.15
        } else if (pitIncome <= 32000000) {
          pitTax = 1950000 + (pitIncome - 18000000) * 0.2
        } else if (pitIncome <= 52000000) {
          pitTax = 4750000 + (pitIncome - 32000000) * 0.25
        } else if (pitIncome <= 80000000) {
          pitTax = 9750000 + (pitIncome - 52000000) * 0.3
        } else {
          pitTax = 18150000 + (pitIncome - 80000000) * 0.35
        }
      }
      
      const totalDeduction = insuranceEmployee + unionFee + pitTax + adjustmentDeductions
      const netSalary = Math.max(0, totalIncome - totalDeduction) // Thực lãnh không được âm

      return {
        empId: employee.id,
        empName: `${employee.firstName} ${employee.lastName}`,
        title: employee.roleName || 'Nhân viên',
        contractType: contract?.contractTypeName || 'Không xác định',
        contractSalary,
        insuranceSalary,
        totalContractSalary: contractSalary + insuranceSalary,
        standardDays,
        totalDays,
        salaryByDays,
        paidLeaveDays,
        leaveSalary,
        actualSalary,
        otDays,
        otHours,
        otHoursWithCoeff,
        otDaysWithCoeff,
        otSalary,
        mealAllowance,
        fuelAllowance,
        responsibilityAllowance,
        totalSupport: mealAllowance + fuelAllowance + responsibilityAllowance,
        insuranceEmployee,
        unionFee,
        totalIncome,
        taxableIncome,
        personalDeduction,
        dependents,
        dependentDeduction,
        bonus: 0, // Có thể tính từ khen thưởng
        otherIncome: 0,
        pitIncome,
        pitTax,
        adjustmentDeductions,
        totalDeduction,
        netSalary,
        // Thông tin bổ sung
        email: employee.email,
        phone: employee.phone,
        birthday: employee.birthday,
        joinDate: employee.joinDate,
        status: employee.status
      }
    })
  })

  const insuranceTableData = computed(() => {
    return salaryTableData.value.map(employee => {
      const salary = employee.insuranceSalary
      const bhxhEmp = salary * 0.08
      const bhytEmp = salary * 0.015
      const bhtnEmp = salary * 0.01
      const totalEmp = bhxhEmp + bhytEmp + bhtnEmp
      const bhxhCom = salary * 0.17
      const bhytCom = salary * 0.03
      const bhtnCom = salary * 0.01
      const totalCom = bhxhCom + bhytCom + bhtnCom
      const totalInsurance = salary * 0.32
      const unionFee = salary * 0.01

      return {
        empId: employee.empId,
        empName: employee.empName,
        title: employee.title,
        insuranceBookNo: '', // Có thể lấy từ hồ sơ nhân viên
        insuranceCode: '', // Có thể lấy từ hồ sơ nhân viên
        insuranceSalary: salary,
        bhxhEmp,
        bhytEmp,
        bhtnEmp,
        totalEmp,
        bhxhCom,
        bhytCom,
        bhtnCom,
        totalCom,
        totalInsurance,
        unionFee
      }
    })
  })

  const taxTableData = computed(() => {
    return salaryTableData.value.map(employee => ({
      empId: employee.empId,
      empName: employee.empName,
      taxCode: '', // Có thể lấy từ hồ sơ nhân viên
      dependents: employee.dependents,
      totalDeduction: employee.personalDeduction + employee.dependentDeduction,
      insuranceEmployee: employee.insuranceEmployee,
      taxableIncome: employee.taxableIncome,
      pitTax: employee.pitTax
    }))
  })

  const taxFinalizationData = computed(() => {
    // Tính tổng hợp dữ liệu quyết toán thuế từ dữ liệu lương thật
    const employees = salaryTableData.value
    
    // Tính tổng các chỉ số cho toàn bộ nhân viên
    const totalEmployees = employees.length
    const totalTaxableIncome = employees.reduce((sum, emp) => sum + emp.taxableIncome, 0)
    const totalPitTax = employees.reduce((sum, emp) => sum + emp.pitTax, 0)
    const totalPersonalDeduction = employees.reduce((sum, emp) => sum + emp.personalDeduction, 0)
    const totalDependentDeduction = employees.reduce((sum, emp) => sum + emp.dependentDeduction, 0)
    const totalInsuranceEmployee = employees.reduce((sum, emp) => sum + emp.insuranceEmployee, 0)
    const totalAdjustmentDeductions = employees.reduce((sum, emp) => sum + emp.adjustmentDeductions, 0)
    
    // Tính tổng thu nhập chịu thuế (tổng thu nhập)
    const totalIncome = employees.reduce((sum, emp) => sum + emp.totalIncome, 0)
    
    // Tính tổng thu nhập tính thuế PIT
    const totalPitIncome = employees.reduce((sum, emp) => sum + emp.pitIncome, 0)
    
    // Tính tổng các khoản giảm trừ
    const totalDeductions = totalPersonalDeduction + totalDependentDeduction + totalInsuranceEmployee
    
    return {
      // Thông tin tổng hợp
      totalEmployees,
      totalIncome,
      totalTaxableIncome,
      totalPitIncome,
      
      // Các khoản giảm trừ
      totalPersonalDeduction,
      totalDependentDeduction,
      totalInsuranceEmployee,
      totalAdjustmentDeductions,
      totalDeductions,
      
      // Thuế
      totalPitTax,
      
      // Chi tiết từng nhân viên
      employeeDetails: employees.map(emp => ({
        empId: emp.empId,
        empName: emp.empName,
        totalIncome: emp.totalIncome,
        taxableIncome: emp.taxableIncome,
        pitIncome: emp.pitIncome,
        personalDeduction: emp.personalDeduction,
        dependentDeduction: emp.dependentDeduction,
        insuranceEmployee: emp.insuranceEmployee,
        adjustmentDeductions: emp.adjustmentDeductions,
        pitTax: emp.pitTax,
        netSalary: emp.netSalary
      }))
    }
  })

  // Functions
  const fetchSalaryData = async (year = selectedYear.value, month = selectedMonth.value) => {
    loading.value = true
    error.value = null
    
    try {
        // Load all required data first
        await Promise.all([
          fetchAllEmployees(),
          fetchAllContracts(),
          fetchAttendance(),
          fetchAllShiftAssignments(),
          fetchAllFamilyRelations(),
          fetchLeaveRequests(),
          fetchOvertimeRequests(),
          fetchPayrollAdjustments()
        ])
      
      // Update selected period
      selectedYear.value = year
      selectedMonth.value = month
      
        console.log('Salary data loaded successfully:', {
          employees: employees.value.length,
          contracts: contracts.value.length,
          attendance: attendanceList.value.length,
          shiftAssignments: shiftAssignments.value.length,
          familyRelations: familyRelations.value.length,
          leaveRequests: leaveRequests.value.length,
          overtimeRequests: overtimeRequests.value.length,
          payrollAdjustments: payrollAdjustments.value.length,
          year,
          month
        })
      
    } catch (err) {
      error.value = err.message || 'Lỗi khi tải dữ liệu lương'
      console.error('Error fetching salary data:', err)
    } finally {
      loading.value = false
    }
  }

  const recalculateSalary = async (employeeId, year, month) => {
    try {
      await salaryService.recalculateSalary(employeeId, year, month)
      await fetchSalaryData(year, month)
    } catch (err) {
      error.value = err.message || 'Lỗi khi tính lại lương'
      throw err
    }
  }

  const recalculateAllSalaries = async (year, month) => {
    try {
      await salaryService.recalculateAllSalaries(year, month)
      await fetchSalaryData(year, month)
    } catch (err) {
      error.value = err.message || 'Lỗi khi tính lại lương cho tất cả nhân viên'
      throw err
    }
  }

  const exportToExcel = async (type = 'salary') => {
    try {
      const blob = await salaryService.exportSalaryToExcel(selectedYear.value, selectedMonth.value, type)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BangLuong_${selectedYear.value}_${selectedMonth.value}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      error.value = err.message || 'Lỗi khi xuất Excel'
      throw err
    }
  }

  return {
    // State
    salaryData,
    insuranceData,
    taxData,
    taxFinalizationData,
    loading,
    error,
    selectedYear,
    selectedMonth,
    
    // Computed
    salaryTableData,
    insuranceTableData,
    taxTableData,
    
    // Functions
    fetchSalaryData,
    recalculateSalary,
    recalculateAllSalaries,
    exportToExcel
  }
}
