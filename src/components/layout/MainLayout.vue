<template>
  <div class="layout">
    <!-- Header -->
    <header class="navbar navbar-expand-lg navbar-dark fixed-top header">
      <div class="container-fluid">
        <div class="d-flex align-items-center">
          <button class="btn btn-link text-white me-3" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
          </button>
          <h1 class="navbar-brand mb-0 h1">Hệ Thống Quản Lý Xây Dựng</h1>
        </div>
        <div class="user-info">
          <i class="fas fa-user-circle me-2"></i>
          <span>{{ currentUser?.fullName }}</span>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <nav class="nav-menu">
        <!-- Nút chuyển đổi menu chuyên nghiệp -->
        <div class="menu-toggle-row mb-2 px-2 mt-3">
          <button class="toggle-switch-btn" @click="isPersonnelMenu = !isPersonnelMenu" aria-label="Chuyển phân hệ">
            <span class="switch-track">
              <span class="switch-thumb" :class="{ right: isPersonnelMenu }"></span>
            </span>
          </button>
          <span class="toggle-menu-text">
            {{ isPersonnelMenu ? 'Phân hệ nhân sự' : 'Phân hệ công trình' }}
          </span>
        </div>
        <ul class="nav flex-column">
          <li v-for="(item, idx) in menuItems" :key="item.text" class="nav-item">
            <template v-if="item.children">
              <div class="nav-link nav-group" :class="{ expanded: openParentIndexes.includes(idx) }"
                @click="toggleParentMenu(idx)" style="cursor:pointer;">
                <i :class="item.icon"></i>
                <span class="ms-2 fw-bold">{{ item.text }}</span>
                <i class="fas fa-chevron-down ms-auto"
                  :style="{ transition: 'transform 0.3s', transform: openParentIndexes.includes(idx) ? 'rotate(180deg)' : 'rotate(0deg)' }"></i>
              </div>
              <ul v-if="openParentIndexes.includes(idx)" class="nav flex-column nav-submenu"
                style="animation: fadeIn 0.3s;">
                <li v-for="sub in item.children" :key="sub.route" class="nav-item">
                  <router-link :to="sub.route" class="nav-link" active-class="active">
                    <i :class="sub.icon"></i>
                    <span class="ms-2">{{ sub.text }}</span>
                  </router-link>
                </li>
              </ul>
            </template>
            <template v-else>
              <router-link :to="item.route" class="nav-link" active-class="active">
                <i :class="item.icon"></i>
                <span class="ms-2">{{ item.text }}</span>
              </router-link>
            </template>
          </li>
        </ul>
        <div class="sidebar-footer">
          <button @click="logout" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            Đăng xuất
          </button>
        </div>
      </nav>
    </aside>

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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from './Breadcrumb.vue'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { currentUser, logout } = useAuth()

const isSidebarOpen = ref(true)
const isPersonnelMenu = ref(false)
const openParentIndexes = ref([]) // lưu các index đang mở

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleParentMenu = (idx) => {
  const i = openParentIndexes.value.indexOf(idx)
  if (i > -1) {
    openParentIndexes.value.splice(i, 1) // đóng nếu đang mở
  } else {
    openParentIndexes.value.push(idx) // mở nếu đang đóng
  }
}

const constructionMenus = {
  technician: [
    { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
    { icon: 'fas fa-project-diagram', text: 'Quản lý Công trình', route: '/construction-management' },
    { icon: 'fas fa-tasks', text: 'Quản lý kế hoạch thi công', route: '/construction-plan-management' },
    { icon: 'fas fa-boxes', text: 'Lập kế hoạch vật tư', route: '/material-planning' },
    { icon: 'fas fa-file-alt', text: 'Báo cáo kỹ thuật', route: '/technical-reports' }
  ],
  director: [
    { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
    { icon: 'fas fa-check-circle', text: 'Phê duyệt đề xuất', route: '/proposal-approval' },
    { icon: 'fas fa-clipboard-list', text: 'Xem dự báo thời tiết', route: '/weather-forecast' }
  ],
  manager: [
    { icon: 'fas fa-tachometer-alt', text: 'Bảng điều khiển', route: '/' },
    { icon: 'fas fa-tasks', text: 'Quản lý công trình', route: '/task-status' },
    { icon: 'fas fa-exclamation-triangle', text: 'Báo cáo sự cố thi công', route: '/incident-report' },
    { icon: 'fas fa-boxes', text: 'Quản lý vật tư', route: '/material-management' },
    { icon: 'fas fa-warehouse', text: 'Nhập kho', route: '/warehouse-entry' },
    { icon: 'fas fa-truck-loading', text: 'Xuất kho', route: '/stock-out' },
  ]
}

const personnelMenus = {
  technician: [
    {
      icon: 'fas fa-users',
      text: 'Nhân sự',
      children: [
        { icon: 'fas fa-id-card', text: 'Hồ sơ nhân sự', route: '/human-resources' },
        { icon: 'fas fa-file-contract', text: 'Hợp đồng lao động', route: '/personnel-contract' }
      ]
    },
    {
      icon: 'fas fa-calendar-check',
      text: 'Chấm công',
      children: [
        { icon: 'fas fa-table', text: 'Bảng tổng hợp công', route: '/attendance-summary' },
        { icon: 'fas fa-cog', text: 'Thiết lập ca', route: '/shift-setup' },
        { icon: 'fas fa-user-clock', text: 'Phân ca nhân viên', route: '/shift-assignment' },
        { icon: 'fas fa-calendar-plus', text: 'Quản lý phép năm', route: '/annual-leave' },
        { icon: 'fas fa-calendar-times', text: 'Quản lý ngày nghỉ', route: '/holiday-management' }
      ]
    },
    {
      icon: 'fas fa-money-check-alt',
      text: 'Tiền lương',
      children: [
        { icon: 'fas fa-plus-minus', text: 'Khoản cộng trừ', route: '/salary-adjustment' },
        { icon: 'fas fa-file-invoice-dollar', text: 'Bảng lương', route: '/salary-table' }
      ]
    }
  ],
  director: [/* ...tương tự nếu cần ... */],
  manager: [/* ...tương tự nếu cần ... */]
}

const menuItems = computed(() => {
  const role = currentUser.value?.role
  if (!role) return []
  return isPersonnelMenu.value ? personnelMenus[role] || [] : constructionMenus[role] || []
})

const openAllPersonnelSubmenus = () => {
  nextTick(() => {
    if (isPersonnelMenu.value && menuItems.value.length) {
      openParentIndexes.value = menuItems.value
        .map((item, idx) => item.children ? idx : null)
        .filter(idx => idx !== null)
    }
  })
}

watch(isPersonnelMenu, (val) => {
  if (val) {
    openAllPersonnelSubmenus()
  }
})

onMounted(() => {
  if (isPersonnelMenu.value) {
    openAllPersonnelSubmenus()
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
  width: 100%;
  padding: 0.75rem;
  background: rgba(220, 53, 69, 0.1);
  color: white;
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
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
  background: rgba(52, 152, 219, 0.08);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.25rem;
  color: #fff;
}

.nav-group.expanded {
  background: rgba(52, 152, 219, 0.18);
}

.nav-submenu {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.nav-submenu .nav-link {
  padding: 0.5rem 1rem;
  font-size: 0.98rem;
  color: #ecf0f1;
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
</style>