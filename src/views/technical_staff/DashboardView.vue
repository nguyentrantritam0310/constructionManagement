<script setup>
import { ref, onMounted } from 'vue'
import { useProjectManagement } from '../../composables/useProjectManagement'

const { pendingProjects, inProgressProjects } = useProjectManagement()

// Thêm các thống kê mới
const totalProjects = ref(0)
const completedProjects = ref(0)
const delayedProjects = ref(0)

// Dữ liệu dự án sắp đến hạn
const upcomingDeadlines = ref([
  {
    name: 'Dự án xây dựng cầu ABC',
    deadline: '2024-04-20',
    progress: 75,
    status: 'Đang thi công'
  },
  {
    name: 'Dự án đường cao tốc XYZ',
    deadline: '2024-04-25',
    progress: 60,
    status: 'Đang thi công'
  },
  {
    name: 'Dự án chung cư MNP',
    deadline: '2024-04-30',
    progress: 45,
    status: 'Đang thi công'
  }
])

// Dữ liệu thống kê theo loại dự án
const projectTypes = ref([
  { type: 'Cầu đường', count: 12, color: '#0d6efd' },
  { type: 'Nhà ở', count: 8, color: '#198754' },
  { type: 'Công nghiệp', count: 6, color: '#dc3545' },
  { type: 'Thủy lợi', count: 4, color: '#ffc107' }
])

onMounted(() => {
  // Giả lập dữ liệu thống kê
  totalProjects.value = pendingProjects.length + inProgressProjects.length + 15
  completedProjects.value = 8
  delayedProjects.value = 3
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
      <div class="stats-card primary">
        <div class="stats-icon">
          <i class="fas fa-project-diagram"></i>
        </div>
        <div class="stats-info">
          <h3>Tổng Số Dự Án</h3>
          <span class="number">{{ totalProjects }}</span>
          <p>Dự án</p>
        </div>
      </div>

      <div class="stats-card warning">
        <div class="stats-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stats-info">
          <h3>Đang Chờ</h3>
          <span class="number">{{ pendingProjects.length }}</span>
          <p>Dự án chờ khởi công</p>
        </div>
      </div>

      <div class="stats-card info">
        <div class="stats-icon">
          <i class="fas fa-hammer"></i>
        </div>
        <div class="stats-info">
          <h3>Đang Thi Công</h3>
          <span class="number">{{ inProgressProjects.length }}</span>
          <p>Dự án đang thực hiện</p>
        </div>
      </div>

      <div class="stats-card success">
        <div class="stats-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stats-info">
          <h3>Đã Hoàn Thành</h3>
          <span class="number">{{ completedProjects }}</span>
          <p>Dự án hoàn thành</p>
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
        <div class="deadline-list">
          <div v-for="(project, index) in upcomingDeadlines"
               :key="index"
               class="deadline-item">
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
      </div>

      <!-- Thống kê theo loại dự án -->
      <div class="project-types">
        <div class="section-header">
          <h3><i class="fas fa-chart-pie"></i> Thống Kê Theo Loại</h3>
        </div>
        <div class="types-grid">
          <div v-for="(type, index) in projectTypes"
               :key="index"
               class="type-card"
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

.upcoming-deadlines, .project-types {
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

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .types-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
</style>