<template>
  <div class="layout">
    <!-- Dimmed Background -->
    <div v-if="isSubsystemSelectorOpen" class="dimmed-background" @click="closeSubsystemSelector"></div>

    <!-- Header -->
    <header class="navbar navbar-expand-lg navbar-dark fixed-top header">
      <div class="container-fluid d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center flex-grow-1">
          <button class="btn btn-link text-white me-3" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
          </button>
          <h1 class="navbar-brand mb-0 h1 me-4">CONSTRUCTPRO</h1>
          <div class="header-breadcrumb">
            <Breadcrumb />
          </div>
        </div>
        <div class="d-flex align-items-center gap-3">
          <!-- Action Buttons -->
          <div class="header-actions">
            <button 
              class="action-btn refresh-btn" 
              @click="refreshPage"
              title="Làm mới trang"
            >
              <i class="fas fa-sync-alt"></i>
            </button>
            <button 
              class="action-btn fullscreen-btn" 
              @click="toggleFullscreen"
              title="Toàn màn hình"
            >
              <i class="fas fa-expand"></i>
            </button>
          </div>
          
          <!-- User Dropdown -->
          <div class="user-dropdown" @click.stop>
            <div class="user-info" @click="toggleUserDropdown">
              <i class="fas fa-user-circle me-2"></i>
              <span>{{ currentUser?.fullName }}</span>
              <i class="fas fa-chevron-down ms-2 dropdown-arrow" :class="{ 'rotated': isUserDropdownOpen }"></i>
            </div>
            
            <!-- Dropdown Menu -->
            <div class="dropdown-menu" :class="{ 'show': isUserDropdownOpen }">
              <router-link to="/profile" class="dropdown-item" @click="closeUserDropdown">
                <i class="fas fa-user me-2"></i>
                <span>Thông tin cá nhân</span>
              </router-link>
              <router-link :to="{ path: '/attendance-summary', query: { tab: 'personal' } }" class="dropdown-item" active-class="" exact-active-class="router-link-active" @click="closeUserDropdown">
                <i class="fas fa-user-clock me-2"></i>
                <span>Bảng công cá nhân</span>
              </router-link>
              <router-link :to="{ path: '/attendance-summary', query: { tab: 'personalOvertime' } }" class="dropdown-item" active-class="" exact-active-class="router-link-active" @click="closeUserDropdown">
                <i class="fas fa-business-time me-2"></i>
                <span>Bảng công tăng ca cá nhân</span>
              </router-link>
              <router-link :to="{ path: '/salary-table', query: { tab: 'personalSalary' } }" class="dropdown-item" active-class="" exact-active-class="router-link-active" @click="closeUserDropdown">
                <i class="fas fa-file-invoice-dollar me-2"></i>
                <span>Bảng lương cá nhân</span>
              </router-link>
              <div class="dropdown-item" @click="handleChangePassword">
                <i class="fas fa-key me-2"></i>
                <span>Đổi mật khẩu</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" @click="logout">
                <i class="fas fa-sign-out-alt me-2"></i>
                <span>Đăng xuất</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <nav class="nav-menu">
        <!-- Subsystem Selector Button -->
        <div class="subsystem-selector-btn" @click="toggleSubsystemSelector">
          <i class="fas fa-th-large"></i>
          <span>Chọn phân hệ</span>
        </div>

        <!-- Module Functionalities -->
        <ul v-if="selectedModule" class="nav flex-column">
          <li v-for="child in selectedModule.children" :key="child.route" class="nav-item">
            <router-link :to="child.route" class="nav-link" active-class="active">
              <i :class="child.icon"></i>
              <span class="ms-2">{{ child.text }}</span>
            </router-link>
          </li>
        </ul>
        <div v-else class="empty-sidebar">
          <p>Vui lòng chọn một phân hệ và module để hiển thị chức năng.</p>
        </div>
      </nav>
    </aside>

    <!-- Subsystem Selector -->
    <div v-if="isSubsystemSelectorOpen" class="subsystem-selector"
      :class="{ 'subsystem-selector-open': isSubsystemSelectorOpen, 'subsystem-selector-close': !isSubsystemSelectorOpen }">
      <div class="subsystem-selector-header">
        <input type="text" class="search-input" placeholder="Tìm kiếm phân hệ hoặc module..." v-model="searchQuery" />
      </div>
      <div class="subsystem-grid">
        <div v-for="subsystem in filteredSubsystems" :key="subsystem.key" class="subsystem-row">
          <h6 class="subsystem-header">{{ subsystem.name }}</h6>
          <div class="module-grid">
            <div v-for="module in subsystem.modules" :key="module.name" @click="selectModule(module)"
              class="module-card" :class="{ active: module.name === selectedModule?.name }">
              <i :class="module.icon"></i>
              <span class="module-text">{{ module.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'main-content-expanded': !isSidebarOpen }">
      <div class="container-fluid">
        <slot></slot>
      </div>
    </main>

    <!-- Change Password Modal -->
    <ChangePasswordModal 
      :show="showChangePasswordModal"
      @update:show="showChangePasswordModal = $event"
      @password-changed="handlePasswordChangeSuccess"
      :is-required="false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Breadcrumb from './Breadcrumb.vue'
import ChangePasswordModal from '../common/ChangePasswordModal.vue'
import { useAuth } from '../../composables/useAuth'

const { currentUser, logout } = useAuth()
const router = useRouter()
const route = useRoute()

// Restore sidebar state immediately to prevent flickering
const savedSidebarState = sessionStorage.getItem('sidebarOpen')
let initialSidebarState = true
if (savedSidebarState !== null) {
  try {
    initialSidebarState = JSON.parse(savedSidebarState)
  } catch (e) {
    console.error('Error parsing sidebar state:', e)
    initialSidebarState = true
  }
}

const isSidebarOpen = ref(initialSidebarState)
const isSubsystemSelectorOpen = ref(false)
const selectedModule = ref(null)
const searchQuery = ref('')
const showChangePasswordModal = ref(false)
const isUserDropdownOpen = ref(false)

// Role-based menu items for "Phân hệ Công trình"
const constructionMenuItems = computed(() => {
  switch (currentUser.value?.role) {
    case 'technician':
      return [{
        name: 'Dự án',
        icon: 'fas fa-building',
        children: [
          { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
          { icon: 'fas fa-project-diagram', text: 'Quản lý Công trình', route: '/construction-management' },
          { icon: 'fas fa-tasks', text: 'Quản lý kế hoạch thi công', route: '/construction-plan-management' },
          { icon: 'fas fa-file-alt', text: 'Báo cáo kỹ thuật', route: '/technical-reports' }]
      },
      {
        name: 'Vật tư',
        icon: 'fas fa-cubes',
        children: [
          { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
          { icon: 'fas fa-boxes', text: 'Lập kế hoạch vật tư', route: '/material-planning' }
        ]
      }
      ]
    case 'worker':
      // Worker không có quyền truy cập phân hệ công trình
      return []
    case 'director':
      return [
        {
          name: 'Dự án',
          icon: 'fas fa-building',
          children: [
            { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
            { icon: 'fas fa-check-circle', text: 'Phê duyệt đề xuất', route: '/proposal-approval' },
            // Menu của nhân viên kỹ thuật/công nhân
            { icon: 'fas fa-tasks', text: 'Quản lý kế hoạch thi công', route: '/construction-plan-management' },
            // Menu của chỉ huy công trình
            { icon: 'fas fa-tasks', text: 'Quản lý công trình', route: '/task-status' }
          ]
        },
        {
          name: 'Vật tư',
          icon: 'fas fa-cubes',
          children: [
            { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
            // Menu của nhân viên kỹ thuật/công nhân
            { icon: 'fas fa-boxes', text: 'Lập kế hoạch vật tư', route: '/material-planning' },
            // Menu của chỉ huy công trình
            { icon: 'fas fa-boxes', text: 'Quản lý vật tư', route: '/material-management' },
            { icon: 'fas fa-warehouse', text: 'Nhập kho', route: '/warehouse-entry' },
            { icon: 'fas fa-truck-loading', text: 'Xuất kho', route: '/stock-out' }
          ]
        }
      ]
    case 'manager':
      return [
        {
          name: 'Dự án',
          icon: 'fas fa-building',
          children: [
            { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
            { icon: 'fas fa-tasks', text: 'Quản lý công trình', route: '/task-status' },
            { icon: 'fas fa-exclamation-triangle', text: 'Báo cáo sự cố thi công', route: '/incident-report' }
          ]
        },
        {
          name: 'Vật tư',
          icon: 'fas fa-cubes',
          children: [
            { icon: 'fas fa-boxes', text: 'Quản lý vật tư', route: '/material-management' },
            { icon: 'fas fa-warehouse', text: 'Nhập kho', route: '/warehouse-entry' },
            { icon: 'fas fa-truck-loading', text: 'Xuất kho', route: '/stock-out' }
          ]
        }
      ]
    case 'hr_employee':
    case 'hr_manager':
      return [
        {
          name: 'Dự án',
          icon: 'fas fa-building',
          children: [
            { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
            { icon: 'fas fa-project-diagram', text: 'Quản lý Công trình', route: '/task-status' },
            { icon: 'fas fa-tasks', text: 'Quản lý kế hoạch thi công', route: '/construction-plan-management' }
          ]
        }
      ]
    default:
      return []
  }
})

// Static menu items for "Phân hệ Nhân sự" (role-based access)
const personnelMenuItems = computed(() => {
  const userRole = currentUser.value?.role
  
  // Module Đơn từ - tất cả role đều có
  const donTuModule = {
    name: 'Đơn từ',
    icon: 'fas fa-file-alt',
    children: [
      { icon: 'fas fa-calendar-day', text: 'Nghỉ phép', route: '/leave' },
      { icon: 'fas fa-clock', text: 'Tăng ca', route: '/Overtime' }
    ]
  }
  
  // Module Tiền lương - chỉ HCNS, Trưởng phòng HCNS, Giám đốc
  const tienLuongModule = {
    name: 'Tiền lương',
    icon: 'fas fa-money-check-alt',
    children: [
      { icon: 'fas fa-plus-minus', text: 'Khoản cộng trừ', route: '/salary-adjustment' },
      { icon: 'fas fa-file-invoice-dollar', text: 'Bảng lương', route: '/salary-table' }
    ]
  }
  
  // Module Chấm công - phân quyền chi tiết
  const chamCongModule = {
    name: 'Chấm công',
    icon: 'fas fa-calendar-check',
    children: [
      { icon: 'fas fa-table', text: 'Bảng tổng hợp công', route: '/attendance-summary' }
    ]
  }
  
  // Thêm các chức năng quản lý cho HCNS, Trưởng phòng HCNS, Giám đốc
  if (['hr_employee', 'hr_manager', 'director'].includes(userRole)) {
    chamCongModule.children.push(
      { icon: 'fas fa-cog', text: 'Thiết lập ca', route: '/shift-setup' },
      { icon: 'fas fa-user-clock', text: 'Phân ca nhân viên', route: '/shift-assignment' },
      { icon: 'fas fa-calendar-plus', text: 'Quản lý phép năm', route: '/annual-leave' }
    )
  }
  
  // Module Nhân sự - chỉ HCNS, Trưởng phòng HCNS, Giám đốc
  const nhanSuModule = {
    name: 'Nhân sự',
    icon: 'fas fa-users',
    children: [
      { icon: 'fas fa-id-card', text: 'Hồ sơ nhân sự', route: '/human-resources' },
      { icon: 'fas fa-file-contract', text: 'Hợp đồng lao động', route: '/personnel-contract' }
    ]
  }
  
  // Xây dựng menu dựa trên role
  const menuItems = [donTuModule] // Module Đơn từ luôn có
  
  // Thêm module Tiền lương cho HCNS, Trưởng phòng HCNS, Giám đốc
  if (['hr_employee', 'hr_manager', 'director'].includes(userRole)) {
    menuItems.push(tienLuongModule)
  }
  
  // Thêm module Chấm công (luôn có)
  menuItems.push(chamCongModule)
  
  // Thêm module Nhân sự cho HCNS, Trưởng phòng HCNS, Giám đốc
  if (['hr_employee', 'hr_manager', 'director'].includes(userRole)) {
    menuItems.push(nhanSuModule)
  }
  
  return menuItems
})

// Subsystems
const subsystems = computed(() => {
  const subsystemsList = [
    {
      name: 'Phân hệ Nhân sự',
      icon: 'fas fa-users',
      key: 'personnel',
      modules: personnelMenuItems.value || []
    },
    {
      name: 'Phân hệ Công trình',
      icon: 'fas fa-building',
      key: 'construction',
      modules: constructionMenuItems.value || []
    }
  ]
  
  // Chỉ hiển thị các phân hệ có ít nhất một module
  return subsystemsList.filter(subsystem => subsystem.modules && subsystem.modules.length > 0)
})

const filteredSubsystems = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!subsystems.value) return []
  
  return subsystems.value
    .map((subsystem) => ({
      ...subsystem,
      modules: (subsystem.modules || []).filter((module) =>
        module.name.toLowerCase().includes(query)
      )
    }))
    .filter(
      (subsystem) =>
        subsystem.name.toLowerCase().includes(query) || subsystem.modules.length > 0
    )
})

// Save state to sessionStorage
const saveState = () => {
  sessionStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen.value))
  if (selectedModule.value) {
    sessionStorage.setItem('selectedModule', JSON.stringify({
      name: selectedModule.value.name,
      icon: selectedModule.value.icon,
      subsystemKey: getSubsystemKeyForModule(selectedModule.value)
    }))
  }
  sessionStorage.setItem('currentRoute', route.path + (route.query ? '?' + new URLSearchParams(route.query).toString() : ''))
}

// Restore state from sessionStorage
const restoreState = () => {
  // Restore sidebar state
  const savedSidebarState = sessionStorage.getItem('sidebarOpen')
  if (savedSidebarState !== null) {
    try {
      isSidebarOpen.value = JSON.parse(savedSidebarState)
    } catch (e) {
      console.error('Error restoring sidebar state:', e)
    }
  }

  // Restore selected module (only if subsystems are available)
  if (subsystems.value && subsystems.value.length > 0) {
    const savedModule = sessionStorage.getItem('selectedModule')
    if (savedModule) {
      try {
        const moduleData = JSON.parse(savedModule)
        // Find the module in current subsystems
        const subsystem = subsystems.value.find(s => s.key === moduleData.subsystemKey)
        if (subsystem) {
          const module = subsystem.modules.find(m => m.name === moduleData.name && m.icon === moduleData.icon)
          if (module) {
            selectedModule.value = module
            return true // Indicate successful restoration
          }
        }
      } catch (e) {
        console.error('Error restoring module state:', e)
      }
    }
  }
  return false // Indicate no restoration happened
}

// Helper function to get subsystem key for a module
const getSubsystemKeyForModule = (module) => {
  for (const subsystem of subsystems.value) {
    if (subsystem.modules.some(m => m.name === module.name && m.icon === module.icon)) {
      return subsystem.key
    }
  }
  return null
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  saveState()
}

const toggleSubsystemSelector = () => {
  isSubsystemSelectorOpen.value = !isSubsystemSelectorOpen.value
}

const closeSubsystemSelector = () => {
  isSubsystemSelectorOpen.value = false
}

const selectModule = (module) => {
  selectedModule.value = module
  isSidebarOpen.value = true
  isSubsystemSelectorOpen.value = false // Close the subsystem selector
  saveState()

  // Navigate to the first child functionality of the selected module
  if (module.children && module.children.length > 0) {
    router.push(module.children[0].route)
  }
}

// User dropdown functions
const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value
}

const closeUserDropdown = () => {
  isUserDropdownOpen.value = false
}

const handleChangePassword = () => {
  showChangePasswordModal.value = true
  closeUserDropdown()
}

const handlePasswordChangeSuccess = () => {
  showChangePasswordModal.value = false
}

// Action buttons functions
const refreshPage = () => {
  // Save current state before reload
  saveState()
  
  // Dispatch a global event for components to listen and reload their data
  window.dispatchEvent(new CustomEvent('page-refresh', { 
    detail: { timestamp: Date.now() } 
  }))
  
  // Reload the page - state is saved in sessionStorage so it will be restored automatically
  // This ensures the page content is fully reloaded while maintaining layout state
  window.location.reload()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen not supported or denied
    })
  } else {
    document.exitFullscreen().catch(() => {
      // Exit fullscreen failed
    })
  }
}

// Save state when route changes
let routeWatcher = null

// Set default module to "Đơn từ" (trong phân hệ Nhân sự) on component load
onMounted(async () => {
  // Wait for subsystems to be ready
  await nextTick()
  
  // Restore state first
  const restored = restoreState()
  
  // Only set default module if no module was restored
  if (!restored && !selectedModule.value && subsystems.value && subsystems.value.length > 0) {
    // Tìm module "Đơn từ" trong phân hệ Nhân sự
    const personnelSubsystem = subsystems.value.find((subsystem) => subsystem.key === 'personnel')
    const donTuModule = personnelSubsystem?.modules?.find((module) => module.name === 'Đơn từ')
    
    if (donTuModule) {
      selectedModule.value = donTuModule
      saveState()
      // Navigate to the first child functionality of the selected module
      if (donTuModule.children && donTuModule.children.length > 0) {
        router.push(donTuModule.children[0].route)
      }
    } else {
      // Fallback: chọn module đầu tiên của phân hệ đầu tiên
      const defaultModule = subsystems.value[0]?.modules?.[0]
      if (defaultModule) {
        selectedModule.value = defaultModule
        saveState()
      }
    }
  }
  
  // Save state when route changes
  routeWatcher = router.afterEach(() => {
    saveState()
  })
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    const userDropdown = document.querySelector('.user-dropdown')
    if (userDropdown && !userDropdown.contains(event.target)) {
      isUserDropdownOpen.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (routeWatcher) {
      routeWatcher()
    }
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  height: 64px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.header-breadcrumb {
  flex-grow: 1;
  margin-left: 2rem;
  max-width: calc(100vw - 400px);
  overflow: hidden;
}

.header-breadcrumb .breadcrumb-wrapper {
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
}

.header-breadcrumb .breadcrumb-wrapper::before {
  display: none !important;
}

.header-breadcrumb .breadcrumb {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.header-breadcrumb .breadcrumb::-webkit-scrollbar {
  display: none;
}

.header-breadcrumb .breadcrumb-item {
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-breadcrumb .breadcrumb-link {
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 0.25rem 0.5rem !important;
  border-radius: 4px !important;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  overflow: hidden;
  text-decoration: none !important;
}


.header-breadcrumb .breadcrumb-link:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

.header-breadcrumb .breadcrumb-current {
  color: rgba(255, 255, 255, 0.95) !important;
  padding: 0.25rem 0.5rem !important;
  background: rgba(255, 255, 255, 0.15) !important;
  border-radius: 4px !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  font-weight: 600;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: relative;
}


.header-breadcrumb .breadcrumb-icon {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 0.7rem;
  width: 12px;
  text-align: center;
  transition: all 0.2s ease;
}

.header-breadcrumb .breadcrumb-link:hover .breadcrumb-icon {
  color: rgba(255, 255, 255, 0.95);
}

.header-breadcrumb .breadcrumb-current .breadcrumb-icon {
  color: rgba(255, 255, 255, 0.95);
}

.header-breadcrumb .breadcrumb-text {
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.header-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0 0.5rem;
  transition: color 0.2s ease;
}

.header-breadcrumb .breadcrumb-item:hover + .breadcrumb-item::before {
  color: rgba(255, 255, 255, 0.95) !important;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .header-breadcrumb {
    margin-left: 1rem;
    max-width: calc(100vw - 350px);
  }
  
  .header-breadcrumb .breadcrumb-link,
  .header-breadcrumb .breadcrumb-current {
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
  }
  
  .header-breadcrumb .breadcrumb-icon {
    font-size: 0.65rem;
    width: 10px;
  }
  
  .header-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
    padding: 0 0.4rem;
    font-size: 0.8rem;
  }
  
  .action-btn {
    width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .header-breadcrumb {
    margin-left: 0.5rem;
    max-width: calc(100vw - 200px);
  }
  
  .navbar-brand {
    font-size: 1.25rem;
    margin-right: 0.5rem !important;
  }
  
  .header-breadcrumb .breadcrumb-link,
  .header-breadcrumb .breadcrumb-current {
    padding: 0.15rem 0.3rem;
    font-size: 0.7rem;
  }
  
  .header-breadcrumb .breadcrumb-icon {
    font-size: 0.6rem;
    width: 8px;
  }
  
  .header-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
    padding: 0 0.25rem;
    font-size: 0.7rem;
  }
  
  .header-breadcrumb .breadcrumb-text {
    font-size: 0.7rem;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
  
  .header-actions {
    gap: 0.25rem;
  }
}

@media (max-width: 576px) {
  .header-breadcrumb {
    max-width: calc(100vw - 150px);
  }
  
  .navbar-brand {
    font-size: 1rem;
  }
  
  .header-breadcrumb .breadcrumb-link,
  .header-breadcrumb .breadcrumb-current {
    padding: 0.1rem 0.25rem;
    font-size: 0.65rem;
  }
  
  .header-breadcrumb .breadcrumb-icon {
    display: none;
  }
  
  .header-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
    padding: 0 0.2rem;
    font-size: 0.65rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }
  
  .header-actions {
    gap: 0.2rem;
  }
}

.sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  width: 250px;
  height: calc(100vh - 64px);
  position: fixed;
  left: 0;
  top: 64px;
  transition: transform 0.3s ease;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  z-index: 999;
  overflow-y: auto;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-closed {
  transform: translateX(-250px);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(220, 53, 69, 0.1);
  color: #ffffff;
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: rgba(220, 53, 69, 0.2);
}

.nav-link {
  color: #ecf0f1;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #3498db, #2980b9);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-link:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #ffffff;
}

.nav-link:hover::before {
  opacity: 1;
}

.nav-link.active {
  background: rgba(52, 152, 219, 0.2);
  color: #ffffff;
}

.nav-link.active::before {
  opacity: 1;
}

.nav-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.3s ease;
}

.nav-group:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-group.expanded {
  background: rgba(52, 152, 219, 0.18);
}

.nav-submenu {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}

.nav-submenu .nav-link {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  color: #ecf0f1;
}

.nav-submenu .nav-link:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #ffffff;
}

.main-content {
  margin-left: 250px;
  margin-top: 64px;
  padding: 2rem;
  transition: margin 0.3s ease;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f6fa 0%, #ffffff 100%);
}

.main-content-expanded {
  margin-left: 0;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 0.9rem;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.refresh-btn:hover {
  background: rgba(52, 152, 219, 0.2);
  border-color: rgba(52, 152, 219, 0.3);
}

.fullscreen-btn:hover {
  background: rgba(46, 204, 113, 0.2);
  border-color: rgba(46, 204, 113, 0.3);
}

.user-info {
  color: #ffffff;
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 25px;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 500;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform 0.25s ease;
  margin-left: 0.5rem;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
  margin-top: 0;
  display: none;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.dropdown-menu.show {
  display: block;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1.25rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #2c3e50;
  transform: translateX(4px);
}

.dropdown-item.router-link-active {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
}

.dropdown-item i {
  width: 18px;
  text-align: center;
  margin-right: 0.75rem;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.dropdown-item:hover i {
  color: #3498db;
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 0.25rem 0;
}

.menu-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-start;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.toggle-switch-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
}

.switch-track {
  position: relative;
  width: 44px;
  height: 22px;
  background: #34495e;
  border-radius: 11px;
  transition: background 0.3s;
  display: flex;
  align-items: center;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 50%;
  transition: left 0.3s;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.15);
  z-index: 2;
}

.switch-thumb.right {
  left: 24px;
  background: linear-gradient(135deg, #27ae60 0%, #16a085 100%);
}

.toggle-menu-text {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  user-select: none;
  transition: color 0.3s;
  padding-left: 0.2rem;
}

.module-selector-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.3s ease;
}

.module-selector-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.module-selector {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100%;
  background: #34495e;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  transition: left 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.module-selector-open {
  left: 0;
}

.module-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #2c3e50;
  color: #ffffff;
}

.module-search {
  padding: 0.5rem 1rem;
  background: #2c3e50;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background: #34495e;
  color: #ffffff;
  outline: none;
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: #95a5a6;
}

.search-input:focus {
  background: #3b5998;
}

.module-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.3s ease;
}

.module-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.subsystem-selector-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: #ffffff;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.subsystem-selector-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.subsystem-selector-btn:hover::before {
  left: 100%;
}

.subsystem-selector-btn i {
  font-size: 1.1rem;
  transition: transform 0.25s ease;
}

.subsystem-selector-btn:hover {
  background: linear-gradient(135deg, #34495e, #3b4a5a);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.15);
}

.subsystem-selector-btn:hover i {
  transform: scale(1.05);
}

.subsystem-selector-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.subsystem-selector {
  position: fixed;
  top: 64px;
  left: 0;
  width: 400px;
  height: calc(100vh - 64px);
  background: linear-gradient(180deg, #34495e 0%, #2c3e50 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.25);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1000;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateX(-100%) scale(0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  will-change: transform, opacity;
}

.subsystem-selector-open {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.subsystem-selector-close {
  opacity: 0;
  transform: translateX(-100%) scale(0.95);
}

.subsystem-selector-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: slideInDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes slideInDown {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(52, 73, 94, 0.8);
  color: #ffffff;
  outline: none;
  font-size: 0.9rem;
  transition: all 0.25s ease;
  backdrop-filter: blur(10px);
}

.search-input::placeholder {
  color: rgba(149, 165, 166, 0.8);
  font-weight: 400;
}

.search-input:focus {
  background: rgba(52, 73, 94, 0.95);
  border-color: rgba(52, 152, 219, 0.5);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  transform: translateY(-1px);
}

.search-input:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(52, 73, 94, 0.9);
}

.subsystem-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.subsystem-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subsystem-header {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(52, 152, 219, 0.3);
  position: relative;
  animation: slideInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  opacity: 0;
  transform: translateX(-30px);
}

.subsystem-header:nth-of-type(1) { animation-delay: 0.2s; }
.subsystem-header:nth-of-type(2) { animation-delay: 0.4s; }
.subsystem-header:nth-of-type(3) { animation-delay: 0.6s; }

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.subsystem-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 1px;
  animation: expandWidth 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.3s;
  width: 0;
}

@keyframes expandWidth {
  to {
    width: 30px;
  }
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* Three modules per row */
  gap: 1rem;
}

/* Stagger animation for module cards */
.subsystem-selector-open .module-card {
  animation: slideInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.subsystem-selector-open .module-card:nth-child(1) { animation-delay: 0.1s; }
.subsystem-selector-open .module-card:nth-child(2) { animation-delay: 0.15s; }
.subsystem-selector-open .module-card:nth-child(3) { animation-delay: 0.2s; }
.subsystem-selector-open .module-card:nth-child(4) { animation-delay: 0.25s; }
.subsystem-selector-open .module-card:nth-child(5) { animation-delay: 0.3s; }
.subsystem-selector-open .module-card:nth-child(6) { animation-delay: 0.35s; }

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 110px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1));
  opacity: 0;
  transition: opacity 0.25s ease;
}

.module-card:hover::before {
  opacity: 1;
}

.module-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(52, 152, 219, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.module-card.active {
  background: rgba(52, 152, 219, 0.15);
  border: 1px solid rgba(52, 152, 219, 0.4);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.module-card.active::before {
  opacity: 1;
}

.module-card i {
  font-size: 1.6rem;
  color: #ffffff;
  transition: all 0.25s ease;
  z-index: 1;
  position: relative;
}

.module-card:hover i {
  transform: scale(1.1);
  color: #3498db;
}

.module-card.active i {
  color: #3498db;
  transform: scale(1.05);
}

.module-card span {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #ffffff;
  text-align: center;
  font-weight: 500;
  transition: all 0.25s ease;
  z-index: 1;
  position: relative;
  line-height: 1.2;
}

.module-card:hover span {
  color: #3498db;
  transform: translateY(-1px);
}

.module-card.active span {
  color: #3498db;
  font-weight: 600;
}

/* Dimmed Background */
.dimmed-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>