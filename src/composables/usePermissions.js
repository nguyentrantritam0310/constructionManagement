import { computed } from 'vue'
import { useAuth } from './useAuth'

export function usePermissions() {
  const { currentUser, isDirector, isHRManager, isHREmployee } = useAuth()

  // Định nghĩa permissions cho từng trang/chức năng
  const pagePermissions = {
    // Trang nghỉ phép
    'leave': {
      'worker': ['view_own', 'create', 'submit_own'], // Công nhân: xem/sửa đơn của mình, gửi duyệt
      'manager': ['view_own', 'view_team', 'create', 'submit_own', 'approve_team'], // Chỉ huy công trình: xem đơn của mình và team, duyệt đơn của công nhân
      'technician': ['view_own', 'create', 'submit_own'], // Nhân viên kỹ thuật: xem/sửa đơn của mình, gửi duyệt
      'hr_employee': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_hr'], // Nhân viên HCNS: xem tất cả, tạo/sửa/xóa, gửi duyệt, duyệt đơn của kỹ thuật
      'hr_manager': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_manager'], // Trưởng phòng HCNS: xem tất cả, tạo/sửa/xóa, gửi duyệt, duyệt đơn của nhân viên HCNS
      'director': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_director', 'approve_team', 'approve_hr', 'approve_manager'] // Giám đốc: toàn quyền
    },
    
    // Trang tăng ca
    'overtime': {
      'worker': ['view_own', 'create', 'submit_own'],
      'manager': ['view_own', 'view_team', 'create', 'submit_own', 'approve_team'],
      'technician': ['view_own', 'create', 'submit_own'],
      'hr_employee': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_hr'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_manager'],
      'director': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_director', 'approve_team', 'approve_hr', 'approve_manager'] // Giám đốc: toàn quyền
    },
    
    // Trang hợp đồng (chỉ HCNS tạo)
    'personnel-contract': {
      'worker': ['view_own'],
      'manager': ['view_own', 'view_team'],
      'technician': ['view_own'],
      'hr_employee': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_hr'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_manager'],
      'director': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_director', 'approve_team', 'approve_hr', 'approve_manager'] // Giám đốc: toàn quyền
    },
    
    // Trang khoản cộng trừ (chỉ HCNS tạo)
    'payroll-adjustment': {
      'worker': ['view_own'],
      'manager': ['view_own', 'view_team'],
      'technician': ['view_own'],
      'hr_employee': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_hr'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_manager'],
      'director': ['view', 'create', 'edit', 'delete', 'submit_all', 'approve_director', 'approve_team', 'approve_hr', 'approve_manager'] // Giám đốc: toàn quyền
    },
    
    // Trang nhân sự
    'human-resources': {
      'hr_employee': ['view', 'create', 'edit'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'approve'],
      'director': ['view', 'create', 'edit', 'delete', 'approve'] // Giám đốc: toàn quyền
    },
    
    // Trang chấm công
    'attendance-summary': {
      'hr_employee': ['view'],
      'hr_manager': ['view', 'create', 'edit', 'approve'],
      'director': ['view', 'create', 'edit', 'approve'] // Giám đốc: toàn quyền
    },
    
    // Trang phép năm
    'annual-leave': {
      'hr_employee': ['view', 'create', 'edit'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'approve'],
      'director': ['view', 'create', 'edit', 'delete', 'approve'] // Giám đốc: toàn quyền
    },
    
    // Trang thiết lập ca
    'shift-setup': {
      'hr_employee': ['view', 'create', 'edit'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'approve'],
      'director': ['view', 'create', 'edit', 'delete', 'approve'] // Giám đốc: toàn quyền
    },
    
    // Trang phân ca nhân viên
    'shift-assignment': {
      'hr_employee': ['view', 'create', 'edit'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'approve'],
      'director': ['view', 'create', 'edit', 'delete', 'approve'] // Giám đốc: toàn quyền
    },
    
    // Trang bảng lương
    'salary-table': {
      'hr_employee': ['view', 'create', 'edit'],
      'hr_manager': ['view', 'create', 'edit', 'delete', 'approve'],
      'director': ['view', 'create', 'edit', 'delete', 'approve'] // Giám đốc: toàn quyền
    },
    
    // Trang quản lý công trình
    'construction-management': {
      'worker': ['view_own', 'create'],
      'technician': ['view_own', 'create'],
      'manager': ['view', 'create', 'edit', 'delete'],
      'hr_employee': ['view'], // Nhân viên HCNS: chỉ xem
      'hr_manager': ['view'], // Trưởng phòng HCNS: chỉ xem
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang kế hoạch thi công
    'construction-plan-management': {
      'worker': ['view_own', 'create'],
      'technician': ['view_own', 'create'],
      'manager': ['view', 'create', 'edit', 'delete'],
      'hr_employee': ['view'], // Nhân viên HCNS: chỉ xem
      'hr_manager': ['view'], // Trưởng phòng HCNS: chỉ xem
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang báo cáo kỹ thuật
    'technical-reports': {
      'worker': ['view_own', 'create'],
      'technician': ['view_own', 'create'],
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang lập kế hoạch vật tư
    'material-planning': {
      'worker': ['view_own', 'create'],
      'technician': ['view_own', 'create'],
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang quản lý vật tư
    'material-management': {
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang nhập kho
    'warehouse-entry': {
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang xuất kho
    'stock-out': {
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang quản lý công trình (của manager)
    'task-status': {
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang báo cáo sự cố thi công
    'incident-report': {
      'manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang phê duyệt đề xuất
    'proposal-approval': {
      'director': ['view', 'approve', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang dự báo thời tiết
    'weather-forecast': {
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    },
    
    // Trang quản lý phân quyền
    'permission-management': {
      'hr_manager': ['view', 'create', 'edit', 'delete'],
      'director': ['view', 'create', 'edit', 'delete'] // Giám đốc: toàn quyền
    }
  }

  // Helper functions
  const hasPermission = (page, action) => {
    const userRole = currentUser.value?.role
    if (!userRole || !pagePermissions[page]) return false
    
    const rolePermissions = pagePermissions[page][userRole] || []
    return rolePermissions.includes(action)
  }

  // Basic permission checks - đảm bảo có quyền xem trước khi có quyền khác
  const canView = (page) => hasPermission(page, 'view') || hasPermission(page, 'view_own')
  const canViewAll = (page) => hasPermission(page, 'view')
  const canViewOwn = (page) => hasPermission(page, 'view_own')
  
  // Các quyền khác phải có quyền xem trước
  const canCreate = (page) => canView(page) && hasPermission(page, 'create')
  const canEdit = (page) => canView(page) && hasPermission(page, 'edit')
  const canEditOwn = (page) => canView(page) && hasPermission(page, 'edit_own')
  const canDelete = (page) => canView(page) && hasPermission(page, 'delete')
  const canApprove = (page) => canView(page) && hasPermission(page, 'approve')
  
  // Quyền gửi duyệt
  const canSubmitOwn = (page) => canView(page) && hasPermission(page, 'submit_own')
  const canSubmitAll = (page) => canView(page) && hasPermission(page, 'submit_all')
  
  // Quyền duyệt theo cấp
  const canApproveTeam = (page) => canView(page) && hasPermission(page, 'approve_team')
  const canApproveHR = (page) => canView(page) && hasPermission(page, 'approve_hr')
  const canApproveManager = (page) => canView(page) && hasPermission(page, 'approve_manager')
  const canApproveDirector = (page) => canView(page) && hasPermission(page, 'approve_director')

  // Advanced permission checks with context - đảm bảo có quyền xem trước
  const canEditItem = (page, item) => {
    if (!item || !canView(page)) return false
    
    // Check approval status for specific pages - only allow edit if status is "Tạo mới"
    // Đơn đã duyệt không được phép sửa (kể cả giám đốc)
    const statusRestrictedPages = ['leave', 'overtime', 'personnel-contract', 'payroll-adjustment']
    if (statusRestrictedPages.includes(page)) {
      // Only allow edit if approveStatus is "Tạo mới"
      if (item.approveStatus !== 'Tạo mới' && item.approveStatus !== 0 && item.approveStatus !== '0') {
        return false
      }
    }
    
    // Giám đốc có thể sửa các items ở trạng thái "Tạo mới"
    if (currentUser.value?.role === 'director' && hasPermission(page, 'edit')) {
      return true
    }
    
    // Check if user can edit all
    if (hasPermission(page, 'edit')) return true
    
    // Check if user can edit own items
    if (hasPermission(page, 'edit_own')) {
      return item.employeeID === currentUser.value?.id
    }
    
    return false
  }

  const canDeleteItem = (page, item) => {
    if (!item || !canView(page)) return false
    
    // Check approval status for specific pages - only allow delete if status is "Tạo mới"
    // Đơn đã duyệt không được phép xóa (kể cả giám đốc)
    const statusRestrictedPages = ['leave', 'overtime', 'personnel-contract', 'payroll-adjustment']
    if (statusRestrictedPages.includes(page)) {
      // Only allow delete if approveStatus is "Tạo mới"
      if (item.approveStatus !== 'Tạo mới' && item.approveStatus !== 0 && item.approveStatus !== '0') {
        return false
      }
    }
    
    // Giám đốc có thể xóa các items ở trạng thái "Tạo mới"
    if (currentUser.value?.role === 'director' && hasPermission(page, 'delete')) {
      return true
    }
    
    // Check if user can delete all
    if (hasPermission(page, 'delete')) return true
    
    // Check if user can delete own items (if implemented)
    if (hasPermission(page, 'delete_own')) {
      return item.employeeID === currentUser.value?.id
    }
    
    return false
  }

  // Check if user can submit item for approval
  const canSubmitItem = (page, item) => {
    console.log('=== CAN SUBMIT ITEM DEBUG ===')
    console.log('Page:', page)
    console.log('Item:', item)
    console.log('Current user:', currentUser.value)
    console.log('Can view page:', canView(page))
    console.log('Item approveStatus:', item?.approveStatus)
    console.log('Has submit_own permission:', hasPermission(page, 'submit_own'))
    console.log('Has submit_all permission:', hasPermission(page, 'submit_all'))
    console.log('Item employeeID:', item?.employeeID)
    console.log('Current user ID:', currentUser.value?.id)
    
    if (!item || !canView(page)) {
      console.log('Failed: No item or cannot view page')
      return false
    }
    
    // Chỉ cho phép submit nếu status là "Tạo mới"
    // Không phân biệt role - tất cả mọi người đều phải tuân theo quy tắc này
    const isCreatedStatus = item.approveStatus === 'Tạo mới' || 
                           item.approveStatus === 0 || 
                           item.approveStatus === '0'
    
    if (!isCreatedStatus) {
      console.log('Failed: Status is not "Tạo mới" - cannot submit')
      return false
    }
    
    // Giám đốc có thể gửi duyệt các đơn mới tạo (chưa được duyệt)
    if (currentUser.value?.role === 'director' && hasPermission(page, 'submit_all')) {
      console.log('Director can submit new items')
      return true
    }
    
    // Check if user can submit own items
    if (hasPermission(page, 'submit_own')) {
      const canSubmitOwn = item.employeeID === currentUser.value?.id
      console.log('Can submit own:', canSubmitOwn)
      return canSubmitOwn
    }
    
    // Check if user can submit all items
    if (hasPermission(page, 'submit_all')) {
      console.log('Can submit all: true')
      return true
    }
    
    console.log('Failed: No submit permissions')
    return false
  }

  // Check if user can approve item
  const canApproveItem = (page, item) => {
    if (!item || !canView(page)) return false
    
    // Chỉ cho phép duyệt khi status là "Chờ duyệt" (Pending)
    // Không phân biệt role - tất cả đều phải tuân theo quy tắc này
    const isPendingStatus = item.approveStatus === 'Chờ duyệt' || 
                           item.approveStatus === 'Pending' || 
                           item.approveStatus === 1 || 
                           item.approveStatus === '1'
    
    if (!isPendingStatus) {
      return false
    }
    
    // Giám đốc có thể duyệt các đơn ở trạng thái "Chờ duyệt"
    // (Giám đốc là cấp duyệt cuối cùng, kể cả khi tự gửi duyệt)
    if (currentUser.value?.role === 'director' && hasPermission(page, 'approve_director')) {
      return true
    }
    
    // Người cùng cấp với người submit không được duyệt/từ chối/trả lại
    // Phải đi theo quy trình duyệt (cấp trên mới được duyệt)
    // TRỪ TRƯỜNG HỢP: Giám đốc tự gửi duyệt thì giám đốc vẫn có thể duyệt
    const currentUserRole = currentUser.value?.role
    const submitterRole = item.submitterRole
    
    if (currentUserRole && submitterRole) {
      // Normalize role names for comparison
      const normalizedCurrentRole = currentUserRole.toLowerCase()
      const normalizedSubmitterRole = submitterRole.toLowerCase()
      
      // Nếu cùng role, không cho phép approve (trừ giám đốc)
      if (normalizedCurrentRole === normalizedSubmitterRole && normalizedCurrentRole !== 'director') {
        return false
      }
    }
    
    // Check if user has any approval permission for this page
    // Backend will validate the detailed workflow logic
    return hasPermission(page, 'approve_team') || 
           hasPermission(page, 'approve_hr') || 
           hasPermission(page, 'approve_manager') || 
           hasPermission(page, 'approve_director')
  }

  // Check if user can see all data or only own data
  const getDataScope = (page) => {
    if (hasPermission(page, 'view')) return 'all'
    if (hasPermission(page, 'view_own')) return 'own'
    return 'none'
  }

  // Filter data based on permissions
  const filterDataByPermission = (page, data) => {
    const userRole = currentUser.value?.role
    const userId = currentUser.value?.id
    
    console.log('=== FILTER DATA BY PERMISSION DEBUG ===')
    console.log('Page:', page)
    console.log('User role:', userRole)
    console.log('User ID:', userId)
    console.log('Data count:', data?.length || 0)
    
    if (!data || data.length === 0) return []
    
    // Giám đốc, trưởng phòng HCNS, nhân viên HCNS: xem tất cả
    if (['director', 'hr_manager', 'hr_employee'].includes(userRole)) {
      console.log('User can view all data')
      return data
    }
    
    // Chỉ huy công trình: xem của mình và công nhân
    if (userRole === 'manager') {
      const filtered = data.filter(item => {
        const isOwn = item.employeeID === userId
        const isWorker = item.role === 'worker' || item.submitterRole === 'worker'
        return isOwn || isWorker
      })
      console.log('Manager filtered data count:', filtered.length)
      return filtered
    }
    
    // Nhân viên kỹ thuật, công nhân: chỉ xem của mình
    if (['technician', 'worker'].includes(userRole)) {
      const filtered = data.filter(item => item.employeeID === userId)
      console.log('Own data count:', filtered.length)
      return filtered
    }
    
    console.log('No permission to view data')
    return []
  }

  return {
    // Basic permissions
    hasPermission,
    canView,
    canViewAll,
    canViewOwn,
    canCreate,
    canEdit,
    canEditOwn,
    canDelete,
    canApprove,
    
    // Submit permissions
    canSubmitOwn,
    canSubmitAll,
    
    // Approval permissions
    canApproveTeam,
    canApproveHR,
    canApproveManager,
    canApproveDirector,
    
    // Advanced permissions
    canEditItem,
    canDeleteItem,
    canSubmitItem,
    canApproveItem,
    getDataScope,
    filterDataByPermission,
    
    // Configuration
    pagePermissions
  }
}
