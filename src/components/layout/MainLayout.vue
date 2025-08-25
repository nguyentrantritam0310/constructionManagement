<template>
  <div class="layout">
    <!-- Dimmed Background -->
    <div
      v-if="isSubsystemSelectorOpen"
      class="dimmed-background"
      @click="closeSubsystemSelector"
    ></div>

    <!-- Header -->
    <header class="navbar navbar-expand-lg navbar-dark fixed-top header">
      <div class="container-fluid d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <button class="btn btn-link text-white me-3" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
          </button>
          <h1 class="navbar-brand mb-0 h1">Hệ Thống Quản Lý Xây Dựng</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div class="user-info">
            <i class="fas fa-user-circle me-2"></i>
            <span>{{ currentUser?.fullName }}</span>
          </div>
          <button class="logout-btn" @click="logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
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
    <div
      v-if="isSubsystemSelectorOpen"
      class="subsystem-selector"
      :class="{ 'subsystem-selector-open': isSubsystemSelectorOpen, 'subsystem-selector-close': !isSubsystemSelectorOpen }"
    >
      <div class="subsystem-selector-header">
        <input
          type="text"
          class="search-input"
          placeholder="Tìm kiếm phân hệ hoặc module..."
          v-model="searchQuery"
        />
      </div>
      <div class="subsystem-grid">
        <div
          v-for="subsystem in filteredSubsystems"
          :key="subsystem.key"
          class="subsystem-row"
        >
          <h6 class="subsystem-header">{{ subsystem.name }}</h6>
          <div class="module-grid">
            <div
              v-for="module in subsystem.modules"
              :key="module.name"
              @click="selectModule(module)"
              class="module-card"
              :class="{ active: module.name === selectedModule?.name }"
            >
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
        <Breadcrumb />
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from './Breadcrumb.vue'
import { useAuth } from '../../composables/useAuth'

const { currentUser, logout } = useAuth()
const router = useRouter()

const isSidebarOpen = ref(true)
const isSubsystemSelectorOpen = ref(false)
const selectedModule = ref(null)
const searchQuery = ref('')

// Role-based menu items for "Phân hệ Công trình"
const constructionMenuItems = computed(() => {
  switch (currentUser.value?.role) {
    case 'technician':
      return [
        { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
        { icon: 'fas fa-project-diagram', text: 'Quản lý Công trình', route: '/construction-management' },
        { icon: 'fas fa-tasks', text: 'Quản lý kế hoạch thi công', route: '/construction-plan-management' },
        { icon: 'fas fa-boxes', text: 'Lập kế hoạch vật tư', route: '/material-planning' },
        { icon: 'fas fa-file-alt', text: 'Báo cáo kỹ thuật', route: '/technical-reports' }
      ]
    case 'director':
      return [
        { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
        { icon: 'fas fa-check-circle', text: 'Phê duyệt đề xuất', route: '/proposal-approval' },
        { icon: 'fas fa-clipboard-list', text: 'Xem dự báo thời tiết', route: '/weather-forecast' }
      ]
    case 'manager':
      return [
        { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
        { icon: 'fas fa-tasks', text: 'Quản lý công trình', route: '/task-status' },
        { icon: 'fas fa-exclamation-triangle', text: 'Báo cáo sự cố thi công', route: '/incident-report' },
        { icon: 'fas fa-boxes', text: 'Quản lý vật tư', route: '/material-management' },
        { icon: 'fas fa-warehouse', text: 'Nhập kho', route: '/warehouse-entry' },
        { icon: 'fas fa-truck-loading', text: 'Xuất kho', route: '/stock-out' }
      ]
    default:
      return []
  }
})

// Static menu items for "Phân hệ Nhân sự" (accessible to all roles)
const personnelMenuItems = [
  {
    name: 'Nhân sự',
    icon: 'fas fa-users',
    children: [
      { icon: 'fas fa-id-card', text: 'Hồ sơ nhân sự', route: '/human-resources' },
      { icon: 'fas fa-file-contract', text: 'Hợp đồng lao động', route: '/personnel-contract' }
    ]
  },
  {
    name: 'Chấm công',
    icon: 'fas fa-calendar-check',
    children: [
      { icon: 'fas fa-table', text: 'Bảng tổng hợp công', route: '/attendance-summary' },
      { icon: 'fas fa-cog', text: 'Thiết lập ca', route: '/shift-setup' },
      { icon: 'fas fa-user-clock', text: 'Phân ca nhân viên', route: '/shift-assignment' },
      { icon: 'fas fa-calendar-plus', text: 'Quản lý phép năm', route: '/annual-leave' },
      { icon: 'fas fa-calendar-times', text: 'Quản lý ngày nghỉ', route: '/holiday-management' }
    ]
  },
  {
    name: 'Tiền lương',
    icon: 'fas fa-money-check-alt',
    children: [
      { icon: 'fas fa-plus-minus', text: 'Khoản cộng trừ', route: '/salary-adjustment' },
      { icon: 'fas fa-file-invoice-dollar', text: 'Bảng lương', route: '/salary-table' }
    ]
  }
]

// Subsystems
const subsystems = computed(() => [
  {
    name: 'Phân hệ Nhân sự',
    icon: 'fas fa-users',
    key: 'personnel',
    modules: personnelMenuItems
  },
  {
    name: 'Phân hệ Công trình',
    icon: 'fas fa-building',
    key: 'construction',
    modules: [
      {
        name: 'Công trình',
        icon: 'fas fa-project-diagram',
        children: constructionMenuItems.value
      }
    ]
  }
])

const filteredSubsystems = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return subsystems.value
    .map((subsystem) => ({
      ...subsystem,
      modules: subsystem.modules.filter((module) =>
        module.name.toLowerCase().includes(query)
      )
    }))
    .filter(
      (subsystem) =>
        subsystem.name.toLowerCase().includes(query) || subsystem.modules.length > 0
    )
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
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

  // Navigate to the first child functionality of the selected module
  if (module.children && module.children.length > 0) {
    router.push(module.children[0].route)
  }
}

// Set default module to "Công trình" on component load
onMounted(() => {
  const defaultModule = subsystems.value.find((subsystem) => subsystem.key === 'construction')?.modules[0]
  if (defaultModule) {
    selectModule(defaultModule)
  }
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

.user-info {
  color: #ffffff;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(5px);
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
  background: linear-gradient(135deg, #2c3e50, #34495e); /* Adjusted to match the theme */
  color: #ffffff;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.subsystem-selector-btn i {
  font-size: 1.2rem;
}

.subsystem-selector-btn:hover {
  background: linear-gradient(135deg, #34495e, #3b4a5a); /* Slightly darker on hover */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.subsystem-selector-btn:active {
  transform: scale(0.98);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
}

.subsystem-selector {
  position: fixed;
  top: 64px; /* Align with the header */
  left: 0;
  width: 400px; /* Extended width */
  height: calc(100vh - 64px); /* Match the sidebar height */
  background: #34495e;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateX(-100%);
  transition: opacity 0.3s ease, transform 0.3s ease; /* Slower animations */
}

.subsystem-selector-open {
  opacity: 1;
  transform: translateX(0);
}

.subsystem-selector-close {
  opacity: 0;
  transform: translateX(-100%);
}

.subsystem-selector-header {
  padding: 1rem;
  background: #2c3e50;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-input {
  flex: 1;
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
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Three modules per row */
  gap: 1rem;
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
  height: 100px; /* Ensure consistent height */
}

.module-card:hover {
  background: rgba(255, 255, 255, 0.2);
}

.module-card.active {
  background: rgba(52, 152, 219, 0.2);
  border: 1px solid rgba(52, 152, 219, 0.5);
}

.module-card i {
  font-size: 1.5rem;
  color: #ffffff;
}

.module-card span {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #ffffff;
  text-align: center;
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