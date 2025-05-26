<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from './Breadcrumb.vue'
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { currentUser, logout } = useAuth()

// Debug logs
console.log('Current User:', currentUser.value)
console.log('User Role:', currentUser.value?.role)

const isSidebarOpen = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Watch for changes in currentUser and redirect to appropriate default page
const menuItems = computed(() => {
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
        { icon: 'fas fa-truck-loading', text: 'Xuất kho', route: '/stock-out' },
      ]
    default:
      return []
  }
})
</script>

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
        <ul class="nav flex-column">
          <li v-for="item in menuItems" :key="item.route" class="nav-item">
            <router-link :to="item.route" class="nav-link" active-class="active">
              <i :class="item.icon"></i>
              <span class="ms-2">{{ item.text }}</span>
            </router-link>
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

<style scoped>
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
</style>