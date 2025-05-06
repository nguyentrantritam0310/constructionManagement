<template>
  <div class="home">
    <h1>Trang chủ</h1>
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>Bảng điều khiển</h2>
        <p>Chào mừng đến với hệ thống quản lý thi công xây dựng</p>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <i class="fas fa-project-diagram"></i>
          <div class="stat-info">
            <h3>Tổng số dự án</h3>
            <p class="stat-number">12</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-tasks"></i>
          <div class="stat-info">
            <h3>Công việc đang thực hiện</h3>
            <p class="stat-number">8</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-exclamation-triangle"></i>
          <div class="stat-info">
            <h3>Sự cố cần xử lý</h3>
            <p class="stat-number">3</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-truck"></i>
          <div class="stat-info">
            <h3>Vật tư sắp hết</h3>
            <p class="stat-number">5</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()

onMounted(() => {
  console.log('Current user:', currentUser.value)
})
</script>

<style scoped>
.home {
  padding: 2rem;
}

.dashboard {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-top: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #6c757d;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card i {
  font-size: 2rem;
  color: #3498db;
}

.stat-info h3 {
  color: #495057;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.stat-number {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
</style>
