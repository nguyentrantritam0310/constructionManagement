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

  // Helper function to check if approveStatus indicates approved
  // Supports both string ('Đã duyệt', 'Approved') and number (2) formats
  const isApproved = (approveStatus) => {
    if (!approveStatus) return false
    // Check for string values
    if (typeof approveStatus === 'string') {
      return approveStatus === 'Đã duyệt' || approveStatus === 'Approved'
    }
    // Check for number values (ApproveStatusEnum.Approved = 2)
    if (typeof approveStatus === 'number') {
      return approveStatus === 2
    }
    return false
  }

  // Helper function to check if contract is indeterminate term (no end date)
  const isIndeterminateTermContract = (endDate) => {
    if (!endDate || endDate === null || endDate === undefined || endDate === '') {
      return true
    }
    
    // Kiểm tra nếu endDate chứa "0001-01-01"
    if (typeof endDate === 'string' && (
      endDate.includes('0001-01-01') || 
      endDate.startsWith('0001-')
    )) {
      return true
    }
    
    try {
      const date = new Date(endDate)
      // Kiểm tra nếu năm <= 1 hoặc < 1900 (hợp đồng không xác định thời hạn)
      if (isNaN(date.getTime()) || date.getFullYear() <= 1 || date.getFullYear() < 1900) {
        return true
      }
    } catch (error) {
      return true
    }
    
    return false
  }

  // Helper function to get all contracts active in a month for an employee
  const getContractsInMonth = (employeeId, year, month) => {
    const monthStartDate = new Date(year, month - 1, 1)
    monthStartDate.setHours(0, 0, 0, 0)
    const monthEndDate = new Date(year, month, 0)
    monthEndDate.setHours(23, 59, 59, 999)

    return contracts.value
      .filter(contract => {
        if (contract.employeeID !== employeeId) return false
        if (!isApproved(contract.approveStatus)) return false

        const contractStartDate = new Date(contract.startDate)
        contractStartDate.setHours(0, 0, 0, 0)

        // Contract must start before or on the last day of the month
        if (contractStartDate > monthEndDate) return false

        // Contract must end after or on the first day of the month (or be indeterminate)
        // Kiểm tra xem có phải hợp đồng không xác định thời hạn không
        if (!isIndeterminateTermContract(contract.endDate)) {
          const contractEndDate = new Date(contract.endDate)
          contractEndDate.setHours(23, 59, 59, 999)
          if (contractEndDate < monthStartDate) return false
        }
        // If indeterminate term contract (no endDate or "0001-01-01"), it's always active

        return true
      })
      .sort((a, b) => {
        // Sort by startDate
        const dateA = new Date(a.startDate)
        const dateB = new Date(b.startDate)
        return dateA - dateB
      })
  }

  // Helper function to get contract period within a month
  const getContractPeriodInMonth = (contract, year, month) => {
    const monthStartDate = new Date(year, month - 1, 1)
    monthStartDate.setHours(0, 0, 0, 0)
    const monthEndDate = new Date(year, month, 0)
    monthEndDate.setHours(23, 59, 59, 999)

    const contractStartDate = new Date(contract.startDate)
    contractStartDate.setHours(0, 0, 0, 0)

    let contractEndDate
    // Kiểm tra xem có phải hợp đồng không xác định thời hạn không
    if (!isIndeterminateTermContract(contract.endDate)) {
      contractEndDate = new Date(contract.endDate)
      contractEndDate.setHours(23, 59, 59, 999)
    } else {
      // Indeterminate term - use month end
      contractEndDate = monthEndDate
    }

    // Calculate period within month
    const periodStart = contractStartDate > monthStartDate ? contractStartDate : monthStartDate
    const periodEnd = contractEndDate < monthEndDate ? contractEndDate : monthEndDate

    return {
      start: periodStart,
      end: periodEnd,
      startDate: periodStart,
      endDate: periodEnd
    }
  }

  // Helper function to format contract period string
  const formatContractPeriod = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startStr = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`
    const endStr = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`
    return `${startStr} - ${endStr}`
  }

  // Helper function to calculate salary for a specific period
  const calculateSalaryForPeriod = (employee, contract, periodStart, periodEnd, year, month) => {
    // Calculate days in period
    const periodStartDate = new Date(periodStart)
    periodStartDate.setHours(0, 0, 0, 0)
    const periodEndDate = new Date(periodEnd)
    periodEndDate.setHours(23, 59, 59, 999)

    const contractSalary = contract?.contractSalary || 0
    const insuranceSalary = contract?.insuranceSalary || 0

    // Filter attendance data for this period
    const attendanceData = attendanceList.value.filter(att => {
      if (!att) return false
      // So sánh employeeID bằng string để đảm bảo khớp
      const attEmployeeId = String(att.employeeID || '')
      const empId = String(employee.id || '')
      if (attEmployeeId !== empId) return false
      
      const workDate = new Date(att.workDate)
      workDate.setHours(0, 0, 0, 0)
      return workDate >= periodStartDate && workDate <= periodEndDate
    })

    // Filter shift assignments for this period
    const assignedDays = shiftAssignments.value.filter(assignment => {
      if (!assignment) return false
      // So sánh employeeID bằng string để đảm bảo khớp
      const assignmentEmployeeId = String(assignment.employeeID || '')
      const empId = String(employee.id || '')
      if (assignmentEmployeeId !== empId) return false
      
      const assignmentDate = new Date(assignment.workDate)
      assignmentDate.setHours(0, 0, 0, 0)
      return assignmentDate >= periodStartDate && assignmentDate <= periodEndDate
    }).length

    const standardDays = assignedDays || 0

    // Calculate valid attendance days in period
    const validAttendanceDays = attendanceData.filter(att => {
      const hasValidCheckIn = att.checkInTime && att.checkInTime.trim() !== ''
      const hasValidCheckOut = att.checkOutTime && att.checkOutTime.trim() !== ''
      return hasValidCheckIn && hasValidCheckOut
    })

    const uniqueWorkDays = new Set()
    validAttendanceDays.forEach(att => {
      const workDate = new Date(att.workDate || att.attendanceDate).toISOString().split('T')[0]
      uniqueWorkDays.add(workDate)
    })

    const totalDays = uniqueWorkDays.size

    // Calculate paid leave days in period
    const approvedLeaveRequests = leaveRequests.value.filter(leave => {
      if (!leave || !leave.startDateTime) return false
      
      // So sánh employeeID bằng string để đảm bảo khớp
      const leaveEmployeeId = String(leave.employeeID || '')
      const empId = String(employee.id || '')
      if (leaveEmployeeId !== empId) return false
      
      // Kiểm tra trạng thái duyệt
      if (!isApproved(leave.approveStatus)) return false
      
      // Kiểm tra loại nghỉ phép
      if (!leave.leaveTypeName || !leave.leaveTypeName.toLowerCase().includes('phép')) return false
      
      const leaveStartDate = new Date(leave.startDateTime)
      const leaveEndDate = new Date(leave.endDateTime)
      
      // Kiểm tra xem đơn nghỉ phép có nằm trong khoảng thời gian của hợp đồng không
      return leaveStartDate <= periodEndDate && leaveEndDate >= periodStartDate
    })

    let totalPaidLeaveDays = 0
    approvedLeaveRequests.forEach(leave => {
      const startDate = new Date(leave.startDateTime)
      const endDate = new Date(leave.endDateTime)
      
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      
      // Only count days within the period
      const periodStartDay = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth(), periodStartDate.getDate())
      const periodEndDay = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth(), periodEndDate.getDate())
      
      const actualStart = startDay > periodStartDay ? startDay : periodStartDay
      const actualEnd = endDay < periodEndDay ? endDay : periodEndDay
      
      if (actualStart <= actualEnd) {
        const daysDiff = Math.ceil((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1
        totalPaidLeaveDays += daysDiff
      }
    })

    const paidLeaveDays = totalPaidLeaveDays

    // Calculate overtime in period
    // Lọc đơn tăng ca đã duyệt trong tháng (giống logic trong modal)
    const approvedOvertimeForMonth = (overtimeRequests?.value || []).filter(ot => {
      if (!ot || !ot.startDateTime) return false
      const start = new Date(ot.startDateTime)
      const end = new Date(ot.endDateTime)
      return ot.employeeID === employee.id &&
             start <= periodEndDate &&
             end >= periodStartDate &&
             isApproved(ot.approveStatus)
    })

    let totalOvertimeHours = 0
    let totalOvertimeDayUnits = 0
    let totalOvertimeHoursWithCoeff = 0
    let totalOvertimeDaysWithCoeff = 0

    approvedOvertimeForMonth.forEach(ot => {
      const start = new Date(ot.startDateTime)
      const end = new Date(ot.endDateTime)
      
      // Tính toàn bộ thời gian tăng ca (giống modal) - không chỉ tính phần trong period
      const totalHoursDiff = (end - start) / (1000 * 60 * 60)
      const hours = Math.max(0, totalHoursDiff)
      const dayUnits = hours / 8 // 1 ngày = 8 giờ
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

    // Calculate salary
    const salaryByDays = standardDays > 0 ? contractSalary * (totalDays / standardDays) : 0
    const leaveSalary = standardDays > 0 ? contractSalary * (paidLeaveDays / standardDays) : 0
    const actualSalary = salaryByDays + leaveSalary

    // Get allowances from contract
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

    // Calculate insurance
    const insuranceEmployee = insuranceSalary * 0.105
    const unionFee = insuranceSalary * 0.01

    // Calculate dependents (same logic as before, but for the period)
    const monthStartDate = new Date(year, month - 1, 1)
    monthStartDate.setHours(0, 0, 0, 0)
    const monthEndDate = new Date(year, month, 0)
    monthEndDate.setHours(23, 59, 59, 999)

    const dependents = familyRelations.value.filter(relation => {
      const isEmployeeRelation = relation.employeeID === employee.id || 
                                 String(relation.employeeID) === String(employee.id)
      if (!isEmployeeRelation) return false

      const isDependentRelation = ['Con', 'Vợ', 'Chồng', 'Cha', 'Mẹ'].includes(relation.relationShipName)
      if (!isDependentRelation) return false

      const startDate = new Date(relation.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(relation.endDate)
      endDate.setHours(23, 59, 59, 999)

      const isActiveInMonth = (startDate <= monthEndDate) && (endDate >= monthStartDate)
      return isActiveInMonth
    }).length

    // Calculate adjustments (same logic, but filtered by period)
    const getAdjustmentDeductions = (employeeId, year, month) => {
      const approvedAdjustments = (payrollAdjustments?.value || []).filter(adj => {
        if (!adj) return false
        const adjMonth = adj.Month || adj.month
        const adjYear = adj.Year || adj.year
        if (!adjMonth || !adjYear) return false
        return parseInt(adjYear) === year && 
               parseInt(adjMonth) === month &&
               isApproved(adj.approveStatus) &&
               ['Kỷ luật', 'Truy thu'].includes(adj.adjustmentTypeName)
      })

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

    const adjustmentDeductions = getAdjustmentDeductions(employee.id, year, month)

    const getBonus = (employeeId, year, month) => {
      const approvedBonuses = (payrollAdjustments?.value || []).filter(adj => {
        if (!adj) return false
        const adjMonth = adj.Month || adj.month
        const adjYear = adj.Year || adj.year
        if (!adjMonth || !adjYear) return false
        return parseInt(adjYear) === year && 
               parseInt(adjMonth) === month &&
               isApproved(adj.approveStatus) &&
               adj.adjustmentTypeName === 'Khen thưởng'
      })

      let totalBonus = 0
      approvedBonuses.forEach(adj => {
        const employees = adj.Employees || adj.employees || []
        employees.forEach(emp => {
          if (emp.employeeID === employeeId || emp.employeeCode === employee.id) {
            totalBonus += Math.abs(emp.Value || emp.value || 0)
          }
        })
      })
      return totalBonus
    }

    const bonus = getBonus(employee.id, year, month)

    const getOtherIncome = (employeeId, year, month) => {
      const approvedOtherIncomes = (payrollAdjustments?.value || []).filter(adj => {
        if (!adj) return false
        const adjMonth = adj.Month || adj.month
        const adjYear = adj.Year || adj.year
        if (!adjMonth || !adjYear) return false
        return parseInt(adjYear) === year && 
               parseInt(adjMonth) === month &&
               isApproved(adj.approveStatus) &&
               adj.adjustmentTypeName === 'Truy lãnh'
      })

      let totalOtherIncome = 0
      approvedOtherIncomes.forEach(adj => {
        const employees = adj.Employees || adj.employees || []
        employees.forEach(emp => {
          if (emp.employeeID === employeeId || emp.employeeCode === employee.id) {
            totalOtherIncome += Math.abs(emp.Value || emp.value || 0)
          }
        })
      })
      return totalOtherIncome
    }

    const otherIncome = getOtherIncome(employee.id, year, month)

    // Calculate tax
    const personalDeduction = 11000000
    const dependentDeduction = dependents * 4400000

    const totalIncome = actualSalary + mealAllowance + fuelAllowance + responsibilityAllowance + otSalary + bonus + otherIncome
    const taxableIncome = totalIncome
    const pitIncome = Math.max(0, totalIncome - insuranceEmployee - personalDeduction - dependentDeduction)

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
    const netSalary = Math.max(0, totalIncome - totalDeduction)

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      contractStartDate: contract.startDate,
      contractEndDate: contract.endDate,
      contractPeriod: formatContractPeriod(periodStart, periodEnd),
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
      bonus,
      otherIncome,
      pitIncome,
      pitTax,
      adjustmentDeductions,
      totalDeduction,
      netSalary
    }
  }

  // Computed properties
  const salaryTableData = computed(() => {
    if (!employees.value || employees.value.length === 0) return []
    
    const result = []
    
    employees.value.forEach((employee) => {
      // Get all contracts active in the selected month
      const activeContracts = getContractsInMonth(employee.id, selectedYear.value, selectedMonth.value)
      
      // If no active contracts, skip this employee (no salary row)
      if (activeContracts.length === 0) {
        return
      }

      // For each contract, create a salary row
      activeContracts.forEach((contract) => {
        // Get contract period within the month
        const period = getContractPeriodInMonth(contract, selectedYear.value, selectedMonth.value)
        
        // Calculate salary for this period
        const salaryData = calculateSalaryForPeriod(
          employee,
          contract,
          period.start,
          period.end,
          selectedYear.value,
          selectedMonth.value
        )

        // Add employee info and contract info to the result
        result.push({
          empId: employee.id,
          empName: `${employee.firstName} ${employee.lastName}`,
          title: employee.roleName || 'Nhân viên',
          contractType: contract?.contractTypeName || 'Không xác định',
          ...salaryData,
          // Additional employee info
          email: employee.email,
          phone: employee.phone,
          birthday: employee.birthday,
          joinDate: employee.joinDate,
          status: employee.status
        })
      })
    })
    
    return result
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
      // Don't set error.value for network errors (will be handled by fallback)
      const isNetworkError = err?.code === 'ERR_NETWORK' || 
                            err?.message?.includes('Network Error') ||
                            err?.message?.includes('ERR_CONNECTION_REFUSED')
      
      if (!isNetworkError) {
        error.value = err.message || 'Lỗi khi xuất Excel'
      }
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
