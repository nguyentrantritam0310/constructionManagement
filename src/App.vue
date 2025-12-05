<script setup>
import { ref, watch, onMounted } from 'vue'
import MainLayout from './components/layout/MainLayout.vue'
import LoginView from './views/LoginView.vue'
import GlobalMessageModal from './components/common/GlobalMessageModal.vue'
import ChangePasswordModal from './components/common/ChangePasswordModal.vue'
import { useAuth } from './composables/useAuth'

const { isAuthenticated, currentUser, checkAuth } = useAuth()
const showChangePasswordModal = ref(false)

// Kiểm tra khi component được mount
onMounted(async () => {
  // Gọi checkAuth để lấy thông tin user mới nhất từ API (đảm bảo role chính xác)
  // Thay vì dựa vào token có thể có role cũ
  if (isAuthenticated.value) {
    await checkAuth()
  }
  checkPasswordChangeRequirement()
})

// Theo dõi khi người dùng đăng nhập và cần đổi mật khẩu
watch(isAuthenticated, (newValue) => {
  if (newValue && currentUser.value) {
    checkPasswordChangeRequirement()
  }
})

const checkPasswordChangeRequirement = () => {
  // Chỉ hiển thị modal nếu đã đăng nhập và có flag yêu cầu đổi mật khẩu
  if (isAuthenticated.value && currentUser.value) {
    const requiresPasswordChange = localStorage.getItem('requiresPasswordChange') === 'true'
    if (requiresPasswordChange) {
      showChangePasswordModal.value = true
    }
  }
}

const handlePasswordChangeSuccess = (message) => {
  console.log('Password changed successfully:', message)
  localStorage.removeItem('requiresPasswordChange')
  showChangePasswordModal.value = false
}

// Ngăn đóng modal bằng cách click outside hoặc nút X
const handleModalUpdate = (show) => {
  // Chỉ cho phép đóng modal khi không yêu cầu đổi mật khẩu
  const requiresPasswordChange = localStorage.getItem('requiresPasswordChange') === 'true'
  if (!requiresPasswordChange) {
    showChangePasswordModal.value = show
  }
}
</script>

<template>
  <div id="app">
    <GlobalMessageModal />
    <MainLayout v-if="isAuthenticated">
      <router-view></router-view>
    </MainLayout>
    <LoginView v-else />
    
    <!-- Modal đổi mật khẩu -->
    <ChangePasswordModal 
      :show="showChangePasswordModal"
      @update:show="handleModalUpdate"
      @success="handlePasswordChangeSuccess"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}
</style>
