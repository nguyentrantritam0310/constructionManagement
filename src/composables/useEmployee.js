import { ref } from 'vue'
import { employeeService } from '../services/employeeService'
import { useAuth } from './useAuth'

export function useEmployee() {
  const employees = ref([])
  const roles = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Get auth composable for refreshing user info
  const { refreshUserInfo } = useAuth()

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

  // Update employee
  const updateEmployee = async (employeeData) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await employeeService.updateEmployee(employeeData)
      await fetchAllEmployees() // Refresh the list
      
      // If updating current user's role, refresh user info
      if (employeeData.id && employeeData.roleID) {
        await refreshUserInfo()
      }
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
    
    const formattedData = {
      employeeCode: employeeData.employeeCode || employeeData.id, // Use ID as fallback
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      birthday: new Date(employeeData.birthday).toISOString(),
      joinDate: new Date(employeeData.joinDate).toISOString(),
      phone: employeeData.phone,
      email: employeeData.email,
      gender: employeeData.gender,
      roleID: parseInt(employeeData.roleID),
      password: employeeData.password || '123456789', // Default password if not provided
      status: statusValue
    }
    
    // Include ID for update operations
    if (employeeData.id) {
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
    updateEmployee,
    deleteEmployee,
    formatEmployeeData,
    formatEmployeeForSubmit
  }
}