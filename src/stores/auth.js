import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  
  const userRoles = {
    TECHNICAL_STAFF: 'TECHNICAL_STAFF',
    CONSTRUCTION_MANAGER: 'CONSTRUCTION_MANAGER',
    DIRECTOR: 'DIRECTOR'
  }

  const menuItems = computed(() => {
    switch (currentUser.value?.role) {
      case userRoles.TECHNICAL_STAFF:
        return [
          { title: 'Bảng Điều Khiển', icon: 'fas fa-tachometer-alt', path: '/dashboard' },
          { title: 'Quản Lý Dự Án', icon: 'fas fa-building', path: '/project-management' },
          { title: 'Quản Lý Kế Hoạch Thi Công', icon: 'fas fa-calendar-alt', path: '/project-plan-management' },
          { title: 'Lập Kế Hoạch Vật Tư', icon: 'fas fa-boxes', path: '/material-planning' },
          { title: 'Báo Cáo', icon: 'fas fa-file-alt', path: '/reports' }
        ]
      case userRoles.CONSTRUCTION_MANAGER:
        return [
          { title: 'Cập Nhật Trạng Thái Nhiệm Vụ', icon: 'fas fa-tasks', path: '/task-status' },
          { title: 'Báo Cáo Sự Cố Thi Công', icon: 'fas fa-exclamation-triangle', path: '/incident-reports' },
          { title: 'Quản Lý Vật Tư', icon: 'fas fa-boxes', path: '/materials' },
          { title: 'Nhập Kho', icon: 'fas fa-warehouse', path: '/stock-in' },
          { title: 'Xuất Kho', icon: 'fas fa-truck-loading', path: '/stock-out' },
          { title: 'Chấm Công', icon: 'fas fa-user-clock', path: '/attendance' },
          { title: 'Phân Công', icon: 'fas fa-users', path: '/assignments' }
        ]
      case userRoles.DIRECTOR:
        return [
          { title: 'Bảng Điều Khiển', icon: 'fas fa-tachometer-alt', path: '/dashboard' },
          { title: 'Phê Duyệt Đề Xuất', icon: 'fas fa-check-circle', path: '/approvals' },
          { title: 'Báo Cáo Tiến Độ Thi Công', icon: 'fas fa-chart-line', path: '/progress-reports' },
          { title: 'Báo Cáo Kỹ Thuật', icon: 'fas fa-file-contract', path: '/technical-reports' }
        ]
      default:
        return []
    }
  })

  const login = (role) => {
    currentUser.value = {
      role,
      name: getRoleName(role)
    }
  }

  const logout = () => {
    currentUser.value = null
  }

  const getRoleName = (role) => {
    switch (role) {
      case userRoles.TECHNICAL_STAFF:
        return 'Nhân viên kỹ thuật'
      case userRoles.CONSTRUCTION_MANAGER:
        return 'Chỉ huy công trình'
      case userRoles.DIRECTOR:
        return 'Giám đốc'
      default:
        return ''
    }
  }

  return {
    currentUser,
    userRoles,
    menuItems,
    login,
    logout
  }
}) 