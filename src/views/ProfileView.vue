<template>
  <div class="profile-page">
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="profile-header mb-4">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h2 class="mb-1">
              <i class="fas fa-user me-2"></i>
              {{ isOwnProfile ? 'Thông tin cá nhân' : 'Thông tin nhân viên' }}
            </h2>
            <p class="text-muted mb-0">
              {{ isOwnProfile ? 'Xem và quản lý thông tin cá nhân của bạn' : `Thông tin chi tiết của ${getEmployeeFullName(employeeData) || 'nhân viên'}` }}
            </p>
          </div>
          <div class="profile-actions">
            <button class="btn btn-outline-light" @click="goBack" v-if="!isOwnProfile">
              <i class="fas fa-arrow-left me-2"></i>
              Quay lại
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="row">
        <!-- Profile Card -->
        <div class="col-lg-4 col-md-5 mb-4">
          <div class="profile-card">
            <div class="profile-avatar">
              <div class="avatar-circle">
                <i class="fas fa-user"></i>
              </div>
              <div class="status-indicator" :class="getEmployeeStatus(employeeData) ? 'active' : 'inactive'"></div>
            </div>
            <div class="profile-info">
              <h4 class="profile-name">{{ getEmployeeFullName(employeeData) || 'N/A' }}</h4>
              <p class="profile-role">{{ getRoleDisplayName(employeeData?.roleName) || 'N/A' }}</p>
              <div class="profile-status">
                <span class="status-badge" :class="getEmployeeStatus(employeeData) ? 'active' : 'inactive'">
                  <i class="fas fa-circle me-1"></i>
                  {{ getEmployeeStatusText(employeeData) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats mt-4">
            <div class="stat-item">
              <div class="stat-icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">Ngày vào làm</div>
                <div class="stat-value">{{ formatDate(employeeData?.joinDate) || 'N/A' }}</div>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">
                <i class="fas fa-building"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">Phòng ban</div>
                <div class="stat-value">{{ employeeData?.roleName || 'N/A' }}</div>
              </div>
            </div>

            <div class="stat-item" v-if="contractInfo">
              <div class="stat-icon">
                <i class="fas fa-file-contract"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">Hợp đồng</div>
                <div class="stat-value">{{ contractInfo.contractNumber || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Details -->
        <div class="col-lg-8 col-md-7">
          <!-- Basic Information -->
          <div class="profile-details-card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-info-circle me-2"></i>
                Thông tin cơ bản
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-id-card me-2"></i>
                      Mã nhân viên
                    </label>
                    <div class="detail-value">{{ employeeData?.id || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-envelope me-2"></i>
                      Email
                    </label>
                    <div class="detail-value">{{ employeeData?.email || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-phone me-2"></i>
                      Số điện thoại
                    </label>
                    <div class="detail-value">{{ employeeData?.phone || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-briefcase me-2"></i>
                      Chức vụ
                    </label>
                    <div class="detail-value">{{ getRoleDisplayName(employeeData?.roleName) || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-birthday-cake me-2"></i>
                      Ngày sinh
                    </label>
                    <div class="detail-value">{{ formatDate(employeeData?.birthday) || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-venus-mars me-2"></i>
                      Giới tính
                    </label>
                    <div class="detail-value">{{ getGenderDisplayName(employeeData?.gender) || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contract Information -->
          <div class="profile-details-card mt-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-file-contract me-2"></i>
                Thông tin hợp đồng
              </h5>
            </div>
            <div class="card-body">
              <div class="row" v-if="contractInfo">
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-hashtag me-2"></i>
                      Số hợp đồng
                    </label>
                    <div class="detail-value">{{ contractInfo.contractNumber || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-file-alt me-2"></i>
                      Loại hợp đồng
                    </label>
                    <div class="detail-value">{{ contractInfo.contractTypeName || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-calendar-check me-2"></i>
                      Ngày bắt đầu
                    </label>
                    <div class="detail-value">{{ formatDate(contractInfo.startDate) || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-calendar-times me-2"></i>
                      Ngày hết hạn
                    </label>
                    <div class="detail-value">{{ formatDate(contractInfo.endDate) || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-money-bill-wave me-2"></i>
                      Lương hợp đồng
                    </label>
                    <div class="detail-value money-value">{{ formatMoney(contractInfo.contractSalary) || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-shield-alt me-2"></i>
                      Lương bảo hiểm
                    </label>
                    <div class="detail-value money-value">{{ formatMoney(contractInfo.insuranceSalary) || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-check-circle me-2"></i>
                      Trạng thái duyệt
                    </label>
                    <div class="detail-value">
                      <span class="approval-status" :class="getApprovalStatusClass(contractInfo.approveStatus)">
                        {{ contractInfo.approveStatus || 'N/A' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="detail-group">
                    <label class="detail-label">
                      <i class="fas fa-clock me-2"></i>
                      Hiệu lực
                    </label>
                    <div class="detail-value">
                      <span class="validity-status" :class="getValidityStatusClass(contractInfo)">
                        <i :class="getValidityStatusIcon(contractInfo)" class="me-1"></i>
                        {{ getValidityStatusText(contractInfo) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <i class="fas fa-file-contract text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3 mb-0">Chưa có thông tin hợp đồng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useEmployee } from '../composables/useEmployee'
import { useContract } from '../composables/useContract'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()
const { employees, fetchAllEmployees, loading } = useEmployee()
const { contracts, fetchAllContracts } = useContract()

// Get employee ID from route params or use current user
const employeeId = computed(() => {
  return route.params.employeeId || currentUser.value?.id
})

// Get employee data
const employeeData = computed(() => {
  if (!employeeId.value) return null
  return employees.value.find(emp => emp.id == employeeId.value) || currentUser.value
})

// Get contract information for the employee
const contractInfo = computed(() => {
  if (!employeeId.value) return null
  return contracts.value.find(contract => contract.employeeID == employeeId.value)
})

// Check if viewing own profile
const isOwnProfile = computed(() => {
  return employeeId.value == currentUser.value?.id
})

onMounted(async () => {
  await Promise.all([
    fetchAllEmployees(),
    fetchAllContracts()
  ])
})

// Helper functions
const getRoleDisplayName = (role) => {
  const roleMap = {
    'worker': 'Công nhân',
    'technician': 'Nhân viên kỹ thuật',
    'supervisor': 'Chỉ huy công trình',
    'hr_employee': 'Nhân viên Hành chính Nhân sự',
    'hr_manager': 'Trưởng phòng Hành chính Nhân sự',
    'director': 'Giám đốc'
  }
  return roleMap[role] || role
}

const getGenderDisplayName = (gender) => {
  const genderMap = {
    'male': 'Nam',
    'female': 'Nữ',
    'other': 'Khác'
  }
  return genderMap[gender] || gender
}

const formatDate = (dateString) => {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  } catch (error) {
    return dateString
  }
}

const getWorkTimeDisplay = () => {
  if (!employeeData.value?.joinDate) return 'N/A'
  
  try {
    const joinDate = new Date(employeeData.value.joinDate)
    const now = new Date()
    const diffTime = Math.abs(now - joinDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    
    if (years > 0) {
      return `${years} năm ${months > 0 ? months + ' tháng' : ''}`
    } else {
      return `${months} tháng`
    }
  } catch (error) {
    return 'N/A'
  }
}

// Helper functions for employee data
const getEmployeeFullName = (employee) => {
  if (!employee) return null
  if (employee.fullName) return employee.fullName
  if (employee.firstName && employee.lastName) {
    return `${employee.firstName} ${employee.lastName}`
  }
  return null
}

const getEmployeeStatus = (employee) => {
  if (!employee) return false
  return employee.status === 'Active' || employee.isActive === true
}

const getEmployeeStatusText = (employee) => {
  if (!employee) return 'N/A'
  const status = employee.status || (employee.isActive ? 'Active' : 'Inactive')
  
  switch (status) {
    case 'Active':
      return 'Hoạt động'
    case 'Resigned':
      return 'Nghỉ việc'
    case 'MaternityLeave':
      return 'Nghỉ thai sản'
    default:
      return 'Không hoạt động'
  }
}

const handleEdit = () => {
  // TODO: Implement edit functionality
  console.log('Edit profile clicked')
}

const goBack = () => {
  router.go(-1)
}

// Contract-related helper functions
const formatMoney = (amount) => {
  if (!amount) return null
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const getApprovalStatusClass = (status) => {
  switch (status) {
    case 'Tạo mới':
      return 'status-created'
    case 'Chờ duyệt':
      return 'status-pending'
    case 'Đã duyệt':
      return 'status-approved'
    case 'Từ chối':
      return 'status-rejected'
    default:
      return 'status-default'
  }
}

const getValidityStatusClass = (contract) => {
  if (!contract?.endDate) return 'validity-unknown'
  const endDate = new Date(contract.endDate)
  const today = new Date()
  return endDate > today ? 'validity-active' : 'validity-expired'
}

const getValidityStatusIcon = (contract) => {
  if (!contract?.endDate) return 'fas fa-question-circle'
  const endDate = new Date(contract.endDate)
  const today = new Date()
  return endDate > today ? 'fas fa-check-circle' : 'fas fa-times-circle'
}

const getValidityStatusText = (contract) => {
  if (!contract?.endDate) return 'Không xác định'
  const endDate = new Date(contract.endDate)
  const today = new Date()
  return endDate > today ? 'Còn hiệu lực' : 'Hết hiệu lực'
}
</script>

<style scoped>
.profile-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);
}

.profile-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #dee2e6;
}

.profile-header h2 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.profile-header .text-muted {
  color: #6c757d !important;
}

.profile-actions .btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-color: #6c757d;
  color: #6c757d;
}

.profile-actions .btn:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.profile-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.1);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

.profile-avatar {
  position: relative;
  margin-bottom: 1.5rem;
}

.avatar-circle {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(52, 152, 219, 0.3);
  position: relative;
}

.avatar-circle i {
  font-size: 3rem;
  color: white;
}

.status-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.status-indicator.active {
  background: #28a745;
}

.status-indicator.inactive {
  background: #dc3545;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.profile-role {
  color: #3498db;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
  box-shadow: 0 4px 15px rgba(21, 87, 36, 0.2);
}

.status-badge.inactive {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  box-shadow: 0 4px 15px rgba(114, 28, 36, 0.2);
}

.quick-stats {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 1.25rem 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item:hover {
  background: rgba(52, 152, 219, 0.05);
  border-radius: 12px;
  padding-left: 1rem;
  padding-right: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.25rem;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.stat-icon i {
  color: white;
  font-size: 1.4rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
}

.profile-details-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.1);
  overflow: hidden;
}

.profile-details-card .card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.75rem;
  border-bottom: 1px solid rgba(52, 152, 219, 0.1);
  position: relative;
}

.profile-details-card .card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

.profile-details-card .card-header h5 {
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.25rem;
}

.profile-details-card .card-body {
  padding: 2rem;
}

.detail-group {
  margin-bottom: 1.5rem;
}

.detail-label {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: #495057;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.detail-label i {
  color: #3498db;
  width: 20px;
  font-size: 1rem;
}

.detail-value {
  color: #2c3e50;
  font-size: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid rgba(52, 152, 219, 0.1);
  min-height: 52px;
  display: flex;
  align-items: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.detail-value:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.money-value {
  color: #28a745 !important;
  font-weight: 700 !important;
  font-size: 1.1rem !important;
}

.approval-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-created {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  color: #0c5460;
}

.status-pending {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
}

.status-approved {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
}

.status-rejected {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
}

.status-default {
  background: linear-gradient(135deg, #e2e3e5, #d6d8db);
  color: #383d41;
}

.validity-status {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.validity-active {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
}

.validity-expired {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
}

.validity-unknown {
  background: linear-gradient(135deg, #e2e3e5, #d6d8db);
  color: #383d41;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-header {
    padding: 1.5rem;
  }
  
  .profile-header .d-flex {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }
  
  .profile-card {
    padding: 1.5rem;
  }
  
  .avatar-circle {
    width: 100px;
    height: 100px;
  }
  
  .avatar-circle i {
    font-size: 2.5rem;
  }
  
  .profile-details-card .card-body {
    padding: 1.5rem;
  }
  
  .detail-value {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 576px) {
  .profile-header {
    padding: 1rem;
  }
  
  .profile-card {
    padding: 1rem;
  }
  
  .profile-details-card .card-body {
    padding: 1rem;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 0.75rem;
  }
}
</style>
