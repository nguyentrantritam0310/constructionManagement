import { ref } from 'vue'
import { employeeService } from '../services/employeeService'

export function useEmployee() {
  const employees = ref([])
  const roles = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all employees
  const fetchAllEmployees = async () => {
    try {
      loading.value = true
      error.value = null
      const employeesData = await employeeService.getAllEmployees()
      console.log('Raw employees data:', employeesData)
      employees.value = employeesData
      console.log('Employees set to:', employees.value)
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
      console.log('Raw roles data:', rolesData)
      roles.value = rolesData
      console.log('Roles set to:', roles.value)
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
    console.log('Formatting employee data for submit:', employeeData)
    const formattedData = {
      employeeCode: employeeData.employeeCode,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      birthday: new Date(employeeData.birthday).toISOString(),
      joinDate: new Date(employeeData.joinDate).toISOString(),
      phone: employeeData.phone,
      email: employeeData.email,
      gender: employeeData.gender,
      roleID: parseInt(employeeData.roleID),
      password: employeeData.password || '123456789', // Default password if not provided
      status: parseInt(employeeData.status) || 0
    }
    
    // Include ID for update operations
    if (employeeData.id) {
      formattedData.id = employeeData.id
    }
    
    console.log('Formatted data:', formattedData)
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