import { ref, computed } from 'vue'
import { salaryService } from '../services/salaryService.js'
import { useEmployee } from './useEmployee.js'
import { useContract } from './useContract.js'
import { useAttendance } from './useAttendance.js'
import { useShiftAssignment } from './useShiftAssignment.js'
import { useFamilyRelation } from './useFamilyRelation.js'
import { useLeaveRequest } from './useLeaveRequest.js'

export function useSalary() {
  // State
  const salaryData = ref([])
  const insuranceData = ref([])
  const taxData = ref([])
  const taxFinalizationData = ref([])
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
      
      // Tính tổng ngày công = tổng ngày đi làm từ tab dữ liệu chấm công
      const totalDays = attendanceData.filter(att => att.checkInTime && att.checkOutTime).length
      
      // Tính tổng nghỉ có lương = tổng nghỉ phép từ leave requests
      const paidLeaveDays = leaveRequests.value.filter(leave => {
        const leaveStartDate = new Date(leave.startDateTime)
        const leaveEndDate = new Date(leave.endDateTime)
        
        return leave.employeeID === employee.id &&
               leaveStartDate.getMonth() + 1 === selectedMonth.value &&
               leaveStartDate.getFullYear() === selectedYear.value &&
               (leave.approveStatus === 'Đã duyệt' || leave.approveStatus === 'Approved') &&
               leave.leaveTypeName && leave.leaveTypeName.toLowerCase().includes('phép')
      }).length
      
      // Tính lương theo ngày công = lương hợp đồng * tổng ngày công / tổng ngày công chuẩn
      const salaryByDays = standardDays > 0 ? contractSalary * (totalDays / standardDays) : 0
      
      // Tính tổng lương phép = lương hợp đồng * tổng nghỉ có lương / tổng ngày công chuẩn
      const leaveSalary = standardDays > 0 ? contractSalary * (paidLeaveDays / standardDays) : 0
      
      // Tính tổng lương thực tế = lương theo ngày công + tổng lương phép
      const actualSalary = salaryByDays + leaveSalary
      
      // Tính các khoản phụ cấp (có thể lấy từ hợp đồng hoặc cấu hình)
      const mealAllowance = 200000 // Phụ cấp ăn ca cố định
      const fuelAllowance = 150000 // Phụ cấp xăng xe cố định
      const responsibilityAllowance = contract?.allowances?.find(a => a.allowanceName?.includes('trách nhiệm'))?.value || 0
      
      // Tính bảo hiểm nhân viên đóng
      const insuranceEmployee = insuranceSalary * 0.105 // 10.5%
      const unionFee = insuranceSalary * 0.01 // 1% đoàn phí
      
      // Tính số người phụ thuộc từ quan hệ gia đình
      const currentDate = new Date()
      const dependents = familyRelations.value.filter(relation => {
        // Kiểm tra quan hệ gia đình của nhân viên này
        const isEmployeeRelation = relation.employeeID === employee.id
        
        // Kiểm tra thời gian hiệu lực (từ ngày bắt đầu đến ngày kết thúc)
        const startDate = new Date(relation.startDate)
        const endDate = new Date(relation.endDate)
        const isActive = currentDate >= startDate && currentDate <= endDate
        
        // Chỉ tính các mối quan hệ phụ thuộc (con, vợ/chồng, cha/mẹ)
        const isDependentRelation = ['Con', 'Vợ', 'Chồng', 'Cha', 'Mẹ'].includes(relation.relationShipName)
        
        return isEmployeeRelation && isActive && isDependentRelation
      }).length
      
      // Tính thuế TNCN
      const personalDeduction = 11000000 // Giảm trừ bản thân
      const dependentDeduction = dependents * 4400000 // Giảm trừ người phụ thuộc
      
      const totalIncome = actualSalary + mealAllowance + fuelAllowance + responsibilityAllowance
      const taxableIncome = Math.max(0, totalIncome - personalDeduction - dependentDeduction - insuranceEmployee)
      
      // Tính thuế TNCN theo bậc thuế
      let pitTax = 0
      if (taxableIncome > 0) {
        if (taxableIncome <= 5000000) {
          pitTax = taxableIncome * 0.05
        } else if (taxableIncome <= 10000000) {
          pitTax = 250000 + (taxableIncome - 5000000) * 0.1
        } else if (taxableIncome <= 18000000) {
          pitTax = 750000 + (taxableIncome - 10000000) * 0.15
        } else if (taxableIncome <= 32000000) {
          pitTax = 1950000 + (taxableIncome - 18000000) * 0.2
        } else if (taxableIncome <= 52000000) {
          pitTax = 4750000 + (taxableIncome - 32000000) * 0.25
        } else if (taxableIncome <= 80000000) {
          pitTax = 9750000 + (taxableIncome - 52000000) * 0.3
        } else {
          pitTax = 18150000 + (taxableIncome - 80000000) * 0.35
        }
      }
      
      const totalDeduction = insuranceEmployee + unionFee + pitTax
      const netSalary = totalIncome - totalDeduction

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
        unpaidLeaveDays: Math.max(0, standardDays - totalDays - paidLeaveDays),
        paidLeaveDays,
        leaveSalary,
        actualSalary,
        otDays: 0, // Có thể tính từ dữ liệu tăng ca
        otSalary: 0,
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
        pitIncome: taxableIncome,
        pitTax,
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
          fetchLeaveRequests()
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
