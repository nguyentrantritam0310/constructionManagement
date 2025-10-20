<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import { usePermissions } from '../../composables/usePermissions'
import { useAuth } from '../../composables/useAuth'

// Composables
const { currentUser, isDirector, isHRManager } = useAuth()
const { pagePermissions, canView } = usePermissions()

// State
const showPermissionModal = ref(false)
const selectedPage = ref(null)
const selectedRole = ref(null)
const editingPermissions = ref([])
const isSaving = ref(false)

// All available pages from permission system
const allPages = computed(() => {
  return Object.keys(pagePermissions.value || {})
})

// All available roles
const allRoles = computed(() => {
  const roles = new Set()
  Object.values(pagePermissions.value || {}).forEach(pageRoles => {
    Object.keys(pageRoles).forEach(role => roles.add(role))
  })
  return Array.from(roles)
})

// All available permission types
const permissionTypes = [
  { key: 'view', label: 'Xem', icon: 'fas fa-eye', color: '#3498db' },
  { key: 'view_own', label: 'Xem của mình', icon: 'fas fa-user-eye', color: '#2980b9' },
  { key: 'create', label: 'Thêm', icon: 'fas fa-plus', color: '#27ae60' },
  { key: 'edit', label: 'Sửa tất cả', icon: 'fas fa-edit', color: '#f39c12' },
  { key: 'edit_own', label: 'Sửa của mình', icon: 'fas fa-user-edit', color: '#e67e22' },
  { key: 'delete', label: 'Xóa', icon: 'fas fa-trash', color: '#e74c3c' },
  { key: 'approve', label: 'Duyệt', icon: 'fas fa-check', color: '#2ecc71' }
]

// Permission matrix data
const permissionMatrix = computed(() => {
  const matrix = []
  
  allPages.value.forEach(page => {
    const pageData = {
      id: page, // Add id for DataTable
      page: page,
      pageLabel: getPageLabel(page),
      permissions: {}
    }
    
    allRoles.value.forEach(role => {
      const rolePermissions = pagePermissions.value[page]?.[role] || []
      pageData.permissions[role] = rolePermissions
    })
    
    matrix.push(pageData)
  })
  
  return matrix
})

// Table columns configuration for DataTable
const tableColumns = computed(() => {
  const columns = [
    {
      key: 'page',
      label: 'Trang',
      sortable: true
    }
  ]
  
  // Add role columns
  allRoles.value.forEach(role => {
    columns.push({
      key: role,
      label: getRoleLabel(role),
      sortable: false
    })
  })
  
  return columns
})

// Handle row click
const handleRowClick = (item) => {
  console.log('Clicked page:', item.page)
}

// Helper function to get page label
const getPageLabel = (page) => {
  const labels = {
    'leave': 'Nghỉ phép',
    'overtime': 'Tăng ca',
    'human-resources': 'Nhân sự',
    'personnel-contract': 'Hợp đồng lao động',
    'attendance-summary': 'Bảng tổng hợp công',
    'annual-leave': 'Quản lý phép năm',
    'salary-adjustment': 'Khoản cộng trừ',
    'salary-table': 'Bảng lương'
  }
  return labels[page] || page
}

// Helper function to get role label
const getRoleLabel = (role) => {
  const labels = {
    'hr_employee': 'Nhân viên HR',
    'hr_manager': 'Trưởng phòng HR',
    'director': 'Giám đốc',
    'technician': 'Kỹ thuật viên',
    'manager': 'Quản lý'
  }
  return labels[role] || role
}

// Check if user has permission for specific page/role/permission
const hasPermissionFor = (page, role, permission) => {
  const rolePermissions = pagePermissions.value[page]?.[role] || []
  return rolePermissions.includes(permission)
}

// Toggle permission
const togglePermission = (page, role, permission) => {
  if (!pagePermissions.value[page]) {
    pagePermissions.value[page] = {}
  }
  if (!pagePermissions.value[page][role]) {
    pagePermissions.value[page][role] = []
  }
  
  const permissions = pagePermissions.value[page][role]
  const index = permissions.indexOf(permission)
  
  if (index > -1) {
    permissions.splice(index, 1)
  } else {
    permissions.push(permission)
  }
  
  console.log(`Toggled ${permission} for ${role} on ${page}:`, permissions)
}

// Save permissions (in real app, this would call API)
const savePermissions = async () => {
  isSaving.value = true
  try {
    console.log('Saving permissions:', pagePermissions.value)
    // Here you would typically call an API to save the permissions
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    alert('Phân quyền đã được lưu! (Demo - chưa lưu thực tế)')
  } catch (error) {
    console.error('Error saving permissions:', error)
    alert('Có lỗi xảy ra khi lưu phân quyền!')
  } finally {
    isSaving.value = false
  }
}

// Reset permissions to default
const resetPermissions = () => {
  if (confirm('Bạn có chắc chắn muốn reset về phân quyền mặc định?')) {
    // Reset to original permissions
    location.reload()
  }
}

// Check if user can access this page
const canAccess = computed(() => {
  return canView('permission-management')
})

onMounted(() => {
  if (!canAccess.value) {
    console.warn('User does not have permission to access permission management')
  }
})
</script>

<template>
  <div v-if="!canAccess" class="container-fluid py-4">
    <div class="alert alert-danger text-center">
      <i class="fas fa-exclamation-triangle me-2"></i>
      Bạn không có quyền truy cập trang này. Chỉ Giám đốc và Trưởng phòng HR mới có thể quản lý phân quyền.
    </div>
  </div>

  <div v-else class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="permission-title mb-0">
          <i class="fas fa-shield-alt me-2"></i>
          Quản lý phân quyền hệ thống
        </h4>
        <p class="text-muted mb-0">Cấu hình quyền truy cập cho từng vai trò trên các trang</p>
      </div>
      <div class="d-flex gap-2">
        <ActionButton 
          type="success" 
          :icon="isSaving ? 'fas fa-spinner fa-spin me-2' : 'fas fa-save me-2'" 
          :disabled="isSaving"
          @click="savePermissions"
        >
          {{ isSaving ? 'Đang lưu...' : 'Lưu phân quyền' }}
        </ActionButton>
        <ActionButton 
          type="warning" 
          icon="fas fa-undo me-2" 
          @click="resetPermissions"
        >
          Reset mặc định
        </ActionButton>
      </div>
    </div>

    <!-- Permission Matrix using DataTable -->
    <div class="permission-matrix-container" :class="{ loading: isSaving }">
      <DataTable 
        :columns="tableColumns" 
        :data="permissionMatrix"
        @row-click="handleRowClick"
      >
        <!-- Page column slot -->
        <template #page="{ item }">
          <div class="page-info">
            <div class="page-name">
              <i class="fas fa-file-alt me-2" style="color: #3498db;"></i>
              <strong>{{ item.pageLabel }}</strong>
            </div>
            <div class="page-key text-muted">
              <small>{{ item.page }}</small>
            </div>
          </div>
        </template>

        <!-- Role permission columns slots -->
        <template v-for="role in allRoles" :key="role" #[role]="{ item }">
          <div class="permission-grid">
            <div 
              v-for="permission in permissionTypes" 
              :key="permission.key"
              class="permission-item"
              :class="{ 
                'active': hasPermissionFor(item.page, role, permission.key),
                'disabled': !hasPermissionFor(item.page, role, 'view') && permission.key !== 'view' && permission.key !== 'view_own'
              }"
              @click.stop="togglePermission(item.page, role, permission.key)"
              :title="permission.label"
            >
              <i :class="permission.icon" :style="{ color: permission.color }"></i>
              <span class="permission-label">{{ permission.label }}</span>
            </div>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Legend -->
    <div class="permission-legend mt-4">
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0">
            <i class="fas fa-info-circle me-2"></i>
            Chú thích phân quyền
          </h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div v-for="permission in permissionTypes" :key="permission.key" class="col-md-3 mb-2">
              <div class="legend-item">
                <i :class="permission.icon" :style="{ color: permission.color }"></i>
                <span>{{ permission.label }}</span>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <small class="text-muted">
              <i class="fas fa-lightbulb me-1"></i>
              <strong>Lưu ý:</strong> Các quyền khác sẽ tự động bị vô hiệu hóa nếu không có quyền "Xem"
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permission-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.permission-matrix-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(52, 152, 219, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* Page info styling */
.page-info {
  padding: 0.5rem 0;
}

.page-name {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.page-key {
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  display: inline-block;
}

/* Permission grid styling */
.permission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;
  padding: 0.5rem;
}

.permission-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 0.4rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e9ecef;
  background: #f8f9fa;
  position: relative;
  min-height: 60px;
}

.permission-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.permission-item.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-color: #2c3e50;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transform: translateY(-1px);
  color: white;
}

.permission-item.active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #2c3e50, #34495e);
  border-radius: 10px;
  z-index: -1;
}

.permission-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8f9fa;
  border-color: #dee2e6;
}

.permission-item.disabled:hover {
  background: #f8f9fa;
  transform: none;
  box-shadow: none;
}

.permission-item i {
  font-size: 1.3rem;
  margin-bottom: 0.3rem;
  transition: transform 0.2s ease;
}

.permission-item:hover i {
  transform: scale(1.1);
}

.permission-item.active i {
  transform: scale(1.15);
}

.permission-label {
  font-size: 0.7rem;
  text-align: center;
  font-weight: 600;
  line-height: 1.2;
  color: #495057;
}

.permission-item.active .permission-label {
  color: white;
  font-weight: 700;
}

/* Legend styling */
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background-color: #f8f9fa;
}

.legend-item i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
}

/* Enhanced table styling */
:deep(.table) {
  margin-bottom: 0;
}

:deep(.table th) {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  font-weight: 600;
  text-align: center;
  vertical-align: middle;
  padding: 1rem 0.5rem;
  border: none;
  position: sticky;
  top: 0;
  z-index: 10;
}

:deep(.table td) {
  vertical-align: middle;
  border-color: #e9ecef;
  padding: 0.75rem;
}

:deep(.table tbody tr:hover) {
  background-color: rgba(52, 152, 219, 0.05);
}

:deep(.table tbody tr:hover td) {
  background-color: transparent;
}

/* Role column styling */
:deep(.table th:not(:first-child)) {
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  font-size: 0.9rem;
  min-width: 180px;
}

:deep(.table td:not(:first-child)) {
  text-align: center;
  min-width: 180px;
}

/* Page column styling */
:deep(.table th:first-child) {
  min-width: 200px;
  text-align: left;
}

:deep(.table td:first-child) {
  background-color: #f8f9fa;
  font-weight: 600;
  border-right: 2px solid #dee2e6;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .permission-grid {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
  
  .permission-item {
    min-height: 50px;
    padding: 0.4rem 0.3rem;
  }
  
  .permission-label {
    font-size: 0.65rem;
  }
}

@media (max-width: 1200px) {
  .permission-item i {
    font-size: 1.1rem;
  }
  
  .permission-label {
    font-size: 0.6rem;
  }
}

@media (max-width: 768px) {
  .permission-matrix-container {
    overflow-x: auto;
    border-radius: 8px;
  }
  
  :deep(.table th:not(:first-child)),
  :deep(.table td:not(:first-child)) {
    min-width: 150px;
  }
  
  :deep(.table th:first-child),
  :deep(.table td:first-child) {
    min-width: 160px;
  }
  
  .permission-item {
    min-height: 45px;
    padding: 0.3rem 0.2rem;
  }
  
  .permission-item i {
    font-size: 1rem;
    margin-bottom: 0.2rem;
  }
  
  .permission-label {
    font-size: 0.55rem;
  }
}

/* Animation for permission changes */
@keyframes permissionToggle {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.permission-item.active {
  animation: permissionToggle 0.3s ease-in-out;
}

/* Loading state */
.permission-matrix-container.loading {
  opacity: 0.7;
  pointer-events: none;
}

.permission-matrix-container.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
