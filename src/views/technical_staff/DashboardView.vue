<script setup>
import { ref, onMounted } from 'vue'
import { useProjectManagement } from '../../composables/useProjectManagement'

const { fetchProjects, dashboardStats, projectTypesStats, upcomingDeadlines } = useProjectManagement()

onMounted(async () => {
  await fetchProjects() // Gọi API để lấy danh sách dự án
})


// Hàm format ngày
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN').format(date)
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>
        <i class="fas fa-tachometer-alt"></i>
        Bảng Điều Khiển
      </h2>
      <p class="welcome-text">Chào buổi sáng, Admin!</p>
    </div>

    <!-- Thống kê tổng quan -->
    <div class="stats-grid">
      <!-- Tổng Số Dự Án -->
      <div class="stats-card primary">
        <div class="stats-icon">
          <i class="fas fa-project-diagram"></i>
        </div>
        <div class="stats-info">
          <h3>Tổng Số Dự Án</h3>
          <span class="number">{{ dashboardStats.totalProjects }}</span>
          <p>Dự án</p>
        </div>
      </div>

      <!-- Đang Chờ -->
      <div class="stats-card warning">
        <div class="stats-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stats-info">
          <h3>Đang Chờ</h3>
          <span class="number">{{ dashboardStats.pendingProjects }}</span>
          <p>Dự án chờ khởi công</p>
        </div>
      </div>

      <!-- Đang Thi Công -->
      <div class="stats-card info">
        <div class="stats-icon">
          <i class="fas fa-hammer"></i>
        </div>
        <div class="stats-info">
          <h3>Đang Thi Công</h3>
          <span class="number">{{ dashboardStats.inProgressProjects }}</span>
          <p>Dự án đang thực hiện</p>
        </div>
      </div>

      <!-- Đã Hoàn Thành -->
      <div class="stats-card success">
        <div class="stats-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stats-info">
          <h3>Đã Hoàn Thành</h3>
          <span class="number">{{ dashboardStats.completedProjects }}</span>
          <p>Dự án hoàn thành</p>
        </div>
      </div>

      <!-- Tạm Dừng -->
      <div class="stats-card secondary">
        <div class="stats-icon">
          <i class="fas fa-pause-circle"></i>
        </div>
        <div class="stats-info">
          <h3>Tạm Dừng</h3>
          <span class="number">{{ dashboardStats.pausedProjects }}</span>
          <p>Dự án tạm dừng</p>
        </div>
      </div>

      <!-- Hủy Bỏ -->
      <div class="stats-card danger">
        <div class="stats-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stats-info">
          <h3>Hủy Bỏ</h3>
          <span class="number">{{ dashboardStats.canceledProjects }}</span>
          <p>Dự án hủy bỏ</p>
        </div>
      </div>
    </div>

    <!-- Phần thông tin chi tiết -->
    <div class="dashboard-content">
      <!-- Dự án sắp đến hạn -->
      <div class="upcoming-deadlines">
        <div class="section-header">
          <h3><i class="fas fa-calendar-alt"></i> Dự Án Sắp Đến Hạn</h3>
        </div>
        <div v-if="upcomingDeadlines.length > 0" class="deadline-list">
          <div v-for="(project, index) in upcomingDeadlines" :key="index" class="deadline-item">
            <div class="deadline-info">
              <h4>{{ project.name }}</h4>
              <div class="deadline-meta">
                <span class="deadline-date">
                  <i class="fas fa-calendar"></i>
                  {{ formatDate(project.deadline) }}
                </span>
                <span class="deadline-status" :class="project.status.toLowerCase()">
                  {{ project.status }}
                </span>
              </div>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress" :style="{ width: `${project.progress}%` }"></div>
              </div>
              <span class="progress-text">{{ project.progress }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="no-deadlines">
          <p>Hiện không có dự án nào sắp đến hạn.</p>
        </div>
      </div>

      <!-- Thống kê theo loại dự án -->
      <div class="project-types">
        <div class="section-header">
          <h3><i class="fas fa-chart-pie"></i> Thống Kê Theo Loại</h3>
        </div>
        <div class="types-grid">
          <div v-for="(type, index) in projectTypesStats" :key="index" class="type-card"
            :style="{ borderColor: type.color }">
            <div class="type-info">
              <h4>{{ type.type }}</h4>
              <span class="type-count">{{ type.count }}</span>
            </div>
            <div class="type-icon" :style="{ backgroundColor: type.color }">
              <i class="fas fa-building"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1.5rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.welcome-text {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stats-card.primary .stats-icon {
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.stats-card.warning .stats-icon {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.stats-card.info .stats-icon {
  background: rgba(13, 202, 240, 0.1);
  color: #0dcaf0;
}

.stats-card.success .stats-icon {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.stats-card.secondary .stats-icon {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.stats-card.danger .stats-icon {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.stats-info h3 {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 0.5rem 0;
}

.stats-info .number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  display: block;
}

.stats-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 1.5rem;
  margin-top: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.upcoming-deadlines,
.project-types {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.deadline-item {
  padding: 1.25rem;
  border-bottom: 1px solid #eee;
}

.deadline-item:last-child {
  border-bottom: none;
}

.deadline-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.deadline-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.deadline-date {
  color: #6c757d;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.deadline-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.deadline-status.đang.thi.công {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar .progress {
  height: 100%;
  background: #0d6efd;
  border-radius: 4px;
}

.progress-text {
  min-width: 45px;
  text-align: right;
  font-weight: 500;
  color: #495057;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.type-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.type-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.type-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.type-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.no-deadlines {
  text-align: center;
  color: #6c757d;
  font-size: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .types-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
</style>