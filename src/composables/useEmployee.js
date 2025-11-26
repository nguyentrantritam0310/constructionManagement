import { ref } from 'vue'
import { employeeService } from '../services/employeeService'
import { useAuth } from './useAuth'

export function useEmployee() {
  const employees = ref([])
  const roles = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get auth composable for refreshing user info
  const { refreshUserInfo, forceRefreshUserInfo } = useAuth()

  // Fetch all employees
  const fetchAllEmployees = async () => {
    try {
      loading.value = true
      error.value = null
      const employeesData = await employeeService.getAllEmployees()
      employees.value = employeesData
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách nhân viên'
      console.error('Error fetching employees:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch all roles
  const fetchAllRoles = async () => {
    try {
      loading.value = true
      error.value = null
      const rolesData = await employeeService.getAllRoles()
      roles.value = rolesData
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách chức danh'
      console.error('Error fetching roles:', err)
    } finally {
      loading.value = false
    }
  }

  // Get employee by ID
  const getEmployeeById = async (id) => {
    try {
      loading.value = true
      error.value = null
      return await employeeService.getEmployeeById(id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin nhân viên'
      console.error('Error fetching employee:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Create new employee
  const createEmployee = async (employeeData) => {
    try {
      loading.value = true
      error.value = null
      const result = await employeeService.createEmployee(employeeData)
      await fetchAllEmployees() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi tạo nhân viên mới'
      error.value = errorMessage
      console.error('Error creating employee:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Create multiple employees
  const createMultipleEmployees = async (employees) => {
    try {
      loading.value = true
      error.value = null

      // Create employees one by one to get detailed error messages
      const results = []
      const errors = []
      
      for (let i = 0; i < employees.length; i++) {
        try {
          const result = await employeeService.createEmployee(employees[i])
          results.push(result)
        } catch (err) {
          const employeeInfo = `${employees[i].Id || employees[i].employeeCode || 'N/A'} - ${employees[i].firstName} ${employees[i].lastName}`
          const errorDetails = err.response?.data?.errors || err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi không xác định'
          errors.push(`${employeeInfo}: ${JSON.stringify(errorDetails)}`)
          console.error(`Error creating employee ${employeeInfo}:`, err.response?.data || err)
        }
      }

      if (errors.length > 0) {
        const errorMessage = `Đã tạo ${results.length}/${employees.length} nhân viên. Có ${errors.length} lỗi:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : ''}`
        error.value = errorMessage
        throw new Error(errorMessage)
      }

      await fetchAllEmployees() // Fetch only once after all creations
      return true
    } catch (err) {
      console.error('Error in createMultipleEmployees:', err)
      const errorMessage = err.message || err.response?.data?.message || err.response?.data?.title || 'Không thể tạo hàng loạt nhân viên.'
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Update employee
  const updateEmployee = async (employeeData) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await employeeService.updateEmployee(employeeData)
      await fetchAllEmployees() // Refresh the list
      
      // Always force refresh user info when updating employee data
      console.log('Employee updated, force refreshing user info...')
      await forceRefreshUserInfo()
      
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi cập nhật nhân viên'
      error.value = errorMessage
      console.error('Error updating employee:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Delete employee
  const deleteEmployee = async (id) => {
    try {
      loading.value = true
      error.value = null
      await employeeService.deleteEmployee(id)
      await fetchAllEmployees() // Refresh the list
      return true
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi xóa nhân viên'
      error.value = errorMessage
      console.error('Error deleting employee:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Format employee data for display
  const formatEmployeeData = (employee) => {
    return {
      ...employee,
      birthday: new Date(employee.birthday).toLocaleDateString('vi-VN'),
      joinDate: new Date(employee.joinDate).toLocaleDateString('vi-VN'),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      id: employee.id
    }
  }

  // Format employee data for form submission
  const formatEmployeeForSubmit = (employeeData) => {
    // Convert status to appropriate format for backend
    let statusValue = 0 // Default to Active
    if (typeof employeeData.status === 'string') {
      switch (employeeData.status) {
        case 'Active':
          statusValue = 0
          break
        case 'Resigned':
          statusValue = 1
          break
        case 'MaternityLeave':
          statusValue = 2
          break
        default:
          statusValue = 0
      }
    } else {
      statusValue = parseInt(employeeData.status) || 0
    }
    
    // Validate and format dates
    if (!employeeData.birthday) {
      throw new Error('Ngày sinh là bắt buộc')
    }
    const birthdayDate = new Date(employeeData.birthday)
    if (isNaN(birthdayDate.getTime())) {
      throw new Error(`Ngày sinh không hợp lệ: ${employeeData.birthday}`)
    }
    
    if (!employeeData.joinDate) {
      throw new Error('Ngày vào làm là bắt buộc')
    }
    const joinDate = new Date(employeeData.joinDate)
    if (isNaN(joinDate.getTime())) {
      throw new Error(`Ngày vào làm không hợp lệ: ${employeeData.joinDate}`)
    }
    
    // Validate roleID
    const roleID = parseInt(employeeData.roleID)
    if (isNaN(roleID) || roleID <= 0) {
      throw new Error(`Chức danh không hợp lệ: ${employeeData.roleID}`)
    }
    
    // Validate employeeCode/Id
    const employeeCode = employeeData.employeeCode || employeeData.id
    if (!employeeCode || employeeCode.trim() === '') {
      throw new Error('Mã nhân viên là bắt buộc')
    }
    
    const formattedData = {
      Id: employeeCode.trim(), // Backend expects 'Id' with capital I
      firstName: employeeData.firstName?.trim() || '',
      lastName: employeeData.lastName?.trim() || '',
      birthday: birthdayDate.toISOString(),
      joinDate: joinDate.toISOString(),
      phone: employeeData.phone?.trim() || '',
      email: employeeData.email?.trim() || '',
      gender: employeeData.gender?.trim() || '',
      roleID: roleID,
      password: employeeData.password || '123456789', // Default password if not provided
      status: statusValue
    }
    
    // Include ID for update operations (but use Id for create)
    if (employeeData.id && employeeData.id !== employeeCode) {
      formattedData.id = employeeData.id
    }
    
    return formattedData
  }

  return {
    employees,
    roles,
    loading,
    error,
    fetchAllEmployees,
    fetchAllRoles,
    getEmployeeById,
    createEmployee,
    createMultipleEmployees,
    updateEmployee,
    deleteEmployee,
    formatEmployeeData,
    formatEmployeeForSubmit
  }
}