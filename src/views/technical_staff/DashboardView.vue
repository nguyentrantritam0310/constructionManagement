<script setup>
import { ref, onMounted, computed } from 'vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'

const { constructions, fetchConstructions } = useConstructionManagement()

// Computed properties for dashboard statistics
const dashboardStats = computed(() => {
  const total = constructions.value.length
  const pending = constructions.value.filter(c => c.statusName === 'Chờ khởi công').length
  const inProgress = constructions.value.filter(c => c.statusName === 'Đang thi công').length
  const completed = constructions.value.filter(c => c.statusName === 'Hoàn thành').length
  const paused = constructions.value.filter(c => c.statusName === 'Tạm dừng').length
  const canceled = constructions.value.filter(c => c.statusName === 'Hủy bỏ').length

  return {
    totalProjects: total,
    pendingProjects: pending,
    inProgressProjects: inProgress,
    completedProjects: completed,
    pausedProjects: paused,
    canceledProjects: canceled
  }
})

const constructionTypesStats = computed(() => {
  const types = {}
  constructions.value.forEach(construction => {
    const type = construction.constructionType || construction.type || 'Không xác định'
    if (!types[type]) {
      types[type] = 0
    }
    types[type]++
  })

  const colors = {
    'Chung cư': '#0d6efd',
    'Nhà phố': '#198754',
    'Biệt thự': '#ffc107',
    'Công trình công cộng': '#dc3545',
    'Công trình công nghiệp': '#ffc107',
    'Công trình giao thông': '#dc3545',
    'Công trình thủy lợi': '#0dcaf0',
    'Không xác định': '#6c757d'
  }

  return Object.entries(types).map(([type, count]) => ({
    type,
    count,
    color: colors[type] || '#6c757d'
  }))
})

const upcomingDeadlines = computed(() => {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return constructions.value
    .filter(construction => {
      const endDate = new Date(construction.endDate)
      return endDate > now && endDate <= thirtyDaysFromNow
    })
    .map(construction => ({
      name: construction.constructionName,
      deadline: construction.endDate,
      status: construction.statusName,
      progress: construction.progress || 0
    }))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
})

onMounted(async () => {
  try {
    await fetchConstructions()
  } catch (error) {
    console.error('Error fetching constructions:', error)
  }
})

// Hàm format ngày
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
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
      <!-- Tổng Số Công trình -->
      <div class="stats-card primary">
        <div class="stats-icon">
          <i class="fas fa-project-diagram"></i>
        </div>
        <div class="stats-info">
          <h3>Tổng Số Công trình</h3>
          <span class="number">{{ dashboardStats.totalProjects }}</span>
          <p>Công trình</p>
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
          <p>Công trình chờ khởi công</p>
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
          <p>Công trình đang thực hiện</p>
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
          <p>Công trình hoàn thành</p>
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
          <p>Công trình tạm dừng</p>
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
          <p>Công trình hủy bỏ</p>
        </div>
      </div>
    </div>

    <!-- Phần thông tin chi tiết -->
    <div class="dashboard-content">
      <!-- Công trình sắp đến hạn -->
      <div class="upcoming-deadlines">
        <div class="section-header">
          <h3><i class="fas fa-calendar-alt"></i> Công trình Sắp Đến Hạn</h3>
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
          <p>Hiện không có Công trình nào sắp đến hạn.</p>
        </div>
      </div>

      <!-- Thống kê theo loại Công trình -->
      <div class="project-types">
        <div class="section-header">
          <h3><i class="fas fa-chart-pie"></i> Thống Kê Theo Loại</h3>
        </div>
        <div class="types-grid">
          <div v-for="(type, index) in constructionTypesStats" :key="index" class="type-card"
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
  transition: transform 0.2s ease;
}

.type-card:hover {
  transform: translateY(-2px);
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
