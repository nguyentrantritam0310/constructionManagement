<script setup>
import { ref, onMounted, computed } from 'vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
import { useManagementReport } from '../../composables/useManagementReport'
import { useAuth } from '../../composables/useAuth'
import { useMaterialPlan } from '../../composables/useMaterialPlan'
import { useImportOrder } from '../../composables/useImportOrder'
import TourGuide from '../../components/common/TourGuide.vue'
import AIChatbotButton from '../../components/common/AIChatbotButton.vue'

const { constructions, fetchConstructions } = useConstructionManagement()
const { materials, fetchMaterials } = useMaterialManagement()
const { reports, fetchReports } = useManagementReport()
const { currentUser } = useAuth()
const { getMaterialPlanByImportOrderID } = useMaterialPlan()
const { getByDirector } = useImportOrder()

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
    const type = construction.constructionTypeName || 'Không xác định'
    if (!types[type]) {
      types[type] = 0
    }
    types[type]++
  })

  const colors = {
    'Dân dụng': '#198754',
    'Công nghiệp': '#ffc107',
    'Cầu đường': '#dc3545',
    'Thủy lợi': '#0dcaf0',
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

// Thêm computed cho thống kê vật tư
const materialStats = computed(() => {
  const totalMaterials = materials.value.length
  const lowStock = materials.value.filter(m => m.stockQuantity <= m.minQuantity).length
  const totalValue = materials.value.reduce((sum, m) => sum + (m.stockQuantity * m.unitPrice), 0)

  return {
    totalMaterials,
    lowStock,
    totalValue
  }
})

// Thêm computed cho thống kê báo cáo chi tiết
const detailedReportStats = computed(() => {
  if (!reports.value) return {
    total: 0,
    construction: { total: 0, pending: 0, approved: 0, rejected: 0 },
    technical: { total: 0, pending: 0, approved: 0, rejected: 0 }
  }

  const getLatestStatus = (report) => {
    if (!report.statusLogs || report.statusLogs.length === 0) return 0
    return report.statusLogs.sort((a, b) =>
      new Date(b.reportDate) - new Date(a.reportDate)
    )[0].status
  }

  const constructionReports = reports.value.filter(r => r.reportType === 'Sự cố thi công')
  const technicalReports = reports.value.filter(r => r.reportType === 'Sự cố kĩ thuật')

  return {
    total: reports.value.length,
    construction: {
      total: constructionReports.length,
      pending: constructionReports.filter(r => getLatestStatus(r) === 0).length,
      approved: constructionReports.filter(r => getLatestStatus(r) === 1).length,
      rejected: constructionReports.filter(r => getLatestStatus(r) === 2).length
    },
    technical: {
      total: technicalReports.length,
      pending: technicalReports.filter(r => getLatestStatus(r) === 0).length,
      approved: technicalReports.filter(r => getLatestStatus(r) === 1).length,
      rejected: technicalReports.filter(r => getLatestStatus(r) === 2).length
    }
  }
})

// Thêm computed để kiểm tra role
const isDirector = computed(() => {
  return currentUser.value?.role === 'director'
})

const isManager = computed(() => {
  return currentUser.value?.role === 'manager'
})

// Thêm state cho đơn nhập hàng
const importOrders = ref([])
const importOrderStats = computed(() => {
  if (!importOrders.value) return {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0
  }

  return {
    total: importOrders.value.length,
    pending: importOrders.value.filter(p => p.status === 'Pending').length,
    approved: importOrders.value.filter(p => p.status === 'Approved').length,
    completed: importOrders.value.filter(p => p.status === 'Completed').length
  }
})

// Thêm hàm fetch đơn nhập hàng
const fetchImportOrders = async () => {
  try {
    const response = await getByDirector()
    importOrders.value = response
  } catch (error) {
    console.error('Error fetching import orders:', error)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      fetchConstructions(),
      fetchMaterials(),
      fetchReports(),
      isDirector.value && fetchImportOrders() // Chỉ fetch khi là giám đốc
    ])
  } catch (error) {
    console.error('Error fetching data:', error)
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

// Tour Guide Steps - Dynamic based on role
const showTourGuide = ref(false)
const tourSteps = computed(() => {
  const steps = [
    {
      target: '[data-tour="title"]',
      message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là bảng điều khiển (Dashboard). Trang này hiển thị tổng quan về các thống kê và thông tin quan trọng của hệ thống.'
    },
    {
      target: '[data-tour="construction-stats"]',
      message: 'Đây là phần thống kê công trình. Hiển thị tổng số công trình và số lượng công trình theo từng trạng thái như chờ khởi công, đang thi công, đã hoàn thành, tạm dừng và đã hủy.'
    }
  ]

  // Thêm step cho Manager
  if (isManager.value) {
    steps.push({
      target: '[data-tour="material-stats"]',
      message: 'Đây là phần thống kê vật tư (chỉ hiển thị cho Quản lý). Hiển thị tổng số vật tư, số vật tư sắp hết và tổng giá trị vật tư trong kho.'
    })
  }

  // Thêm step cho Director
  if (isDirector.value) {
    steps.push({
      target: '[data-tour="report-stats"]',
      message: 'Đây là phần thống kê báo cáo và kế hoạch vật tư (chỉ hiển thị cho Giám đốc). Hiển thị thống kê về báo cáo sự cố thi công, sự cố kỹ thuật và kế hoạch vật tư cần duyệt.'
    })
  }

  steps.push({
    target: '[data-tour="upcoming-deadlines"]',
    message: 'Đây là phần công trình sắp đến hạn và thống kê theo loại. Hiển thị danh sách công trình có ngày hoàn thành dự kiến trong vòng 30 ngày tới và số lượng công trình theo từng loại (Dân dụng, Công nghiệp, Cầu đường, Thủy lợi).'
  })

  return steps
})

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="welcome-section">
      <h2 data-tour="title">
        <i class="fas fa-tachometer-alt"></i>
        Bảng Điều Khiển
      </h2>
        <p class="welcome-text">
          Xin chào, {{ currentUser?.fullName || 'Admin' }}!
          <span class="current-time">{{ new Date().toLocaleTimeString('vi-VN') }}</span>
        </p>
      </div>
      <div class="quick-actions">
      </div>
    </div>

    <!-- Thống kê công trình -->
    <div class="stats-section mb-4" data-tour="construction-stats">
      <h3 class="section-title">
        <i class="fas fa-building"></i>
        Thống kê công trình
      </h3>
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
            <h3>Chờ Khởi Công</h3>
          <span class="number">{{ dashboardStats.pendingProjects }}</span>
            <p>Công trình</p>
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
            <p>Công trình</p>
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
            <p>Công trình</p>
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
            <p>Công trình</p>
        </div>
      </div>

      <!-- Hủy Bỏ -->
      <div class="stats-card danger">
        <div class="stats-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stats-info">
            <h3>Đã Hủy</h3>
          <span class="number">{{ dashboardStats.canceledProjects }}</span>
            <p>Công trình</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Thống kê vật tư - Chỉ hiển thị cho Manager -->
    <div v-if="isManager" class="stats-section mb-4" data-tour="material-stats">
      <h3 class="section-title">
        <i class="fas fa-boxes"></i>
        Thống kê vật tư
      </h3>
      <div class="stats-grid">
        <!-- Tổng số vật tư -->
        <div class="stats-card info">
          <div class="stats-icon">
            <i class="fas fa-boxes"></i>
          </div>
          <div class="stats-info">
            <h3>Tổng Số Vật Tư</h3>
            <span class="number">{{ materialStats.totalMaterials }}</span>
            <p>{{ materialStats.lowStock }} vật tư sắp hết</p>
          </div>
        </div>

        <!-- Tổng giá trị vật tư -->
        <div class="stats-card success">
          <div class="stats-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stats-info">
            <h3>Tổng Giá Trị Vật Tư</h3>
            <span class="number material-value">{{ formatCurrency(materialStats.totalValue) }}</span>
            <p>Giá trị tồn kho</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Thống kê báo cáo - Chỉ hiển thị cho Giám đốc -->
    <div v-if="isDirector" class="stats-section mb-4" data-tour="report-stats">
      <h3 class="section-title">
        <i class="fas fa-file-alt"></i>
        Thống kê báo cáo
      </h3>

      <!-- Báo cáo sự cố thi công -->
      <div class="report-category mb-4" data-tour="construction-reports">
        <h4 class="category-title">
          <i class="fas fa-hard-hat"></i>
          Sự cố thi công ({{ detailedReportStats.construction.total }})
        </h4>
        <div class="stats-grid">
          <div class="stats-card warning">
            <div class="stats-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stats-info">
              <h3>Chờ Duyệt</h3>
              <span class="number">{{ detailedReportStats.construction.pending }}</span>
              <p>Báo cáo đang chờ duyệt</p>
            </div>
          </div>

          <div class="stats-card success">
            <div class="stats-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stats-info">
              <h3>Đã Duyệt</h3>
              <span class="number">{{ detailedReportStats.construction.approved }}</span>
              <p>Báo cáo được chấp nhận</p>
            </div>
          </div>

          <div class="stats-card danger">
            <div class="stats-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="stats-info">
              <h3>Từ Chối</h3>
              <span class="number">{{ detailedReportStats.construction.rejected }}</span>
              <p>Báo cáo bị từ chối</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Báo cáo sự cố kỹ thuật -->
      <div class="report-category mb-4" data-tour="technical-reports">
        <h4 class="category-title">
          <i class="fas fa-tools"></i>
          Sự cố kỹ thuật ({{ detailedReportStats.technical.total }})
        </h4>
        <div class="stats-grid">
          <div class="stats-card warning">
            <div class="stats-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stats-info">
              <h3>Chờ Duyệt</h3>
              <span class="number">{{ detailedReportStats.technical.pending }}</span>
              <p>Báo cáo đang chờ duyệt</p>
            </div>
          </div>

          <div class="stats-card success">
            <div class="stats-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stats-info">
              <h3>Đã Duyệt</h3>
              <span class="number">{{ detailedReportStats.technical.approved }}</span>
              <p>Báo cáo được chấp nhận</p>
            </div>
          </div>

          <div class="stats-card danger">
            <div class="stats-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="stats-info">
              <h3>Từ Chối</h3>
              <span class="number">{{ detailedReportStats.technical.rejected }}</span>
              <p>Báo cáo bị từ chối</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Kế hoạch vật tư -->
      <div class="report-category" data-tour="material-plans">
        <h4 class="category-title">
          <i class="fas fa-clipboard-list"></i>
          Kế hoạch vật tư ({{ importOrderStats.total }} kế hoạch)
        </h4>
        <div class="stats-grid">
          <div class="stats-card warning">
            <div class="stats-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stats-info">
              <h3>Chờ Duyệt</h3>
              <span class="number">{{ importOrderStats.pending }}</span>
              <p>Kế hoạch đang chờ duyệt</p>
            </div>
          </div>

          <div class="stats-card info">
            <div class="stats-icon">
              <i class="fas fa-check"></i>
            </div>
            <div class="stats-info">
              <h3>Đã Duyệt</h3>
              <span class="number">{{ importOrderStats.approved }}</span>
              <p>Kế hoạch được chấp nhận</p>
            </div>
          </div>

          <div class="stats-card success">
            <div class="stats-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stats-info">
              <h3>Đã Hoàn Thành</h3>
              <span class="number">{{ importOrderStats.completed }}</span>
              <p>Kế hoạch đã thực hiện</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Công trình sắp đến hạn -->
      <div class="upcoming-deadlines" data-tour="upcoming-deadlines">
        <div class="section-header">
          <h3>
            <i class="fas fa-calendar-alt"></i>
            Công trình Sắp Đến Hạn
          </h3>
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
      <div class="project-types" data-tour="project-types">
        <div class="section-header">
          <h3>
            <i class="fas fa-chart-pie"></i>
            Thống Kê Theo Loại
          </h3>
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
    
    <!-- Tour Guide -->
    <TourGuide 
      :show="showTourGuide" 
      :steps="tourSteps" 
      @update:show="showTourGuide = $event" 
      @complete="handleTourComplete" 
    />
    <AIChatbotButton 
      message="Xin chào! Tôi có thể giúp gì cho bạn?" 
      title="Trợ lý AI"
      @guide-click="startTour"
    />
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1.5rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.current-time {
  color: #6c757d;
  font-size: 0.9rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 2px solid #dee2e6;
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn-outline-primary {
  color: #0d6efd;
  border-color: #0d6efd;
}

.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: white;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

.stats-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.material-value {
  font-size: 1.5rem;
  line-height: 1.2;
  word-break: break-word;
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
  position: relative;
  overflow: hidden;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stats-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1));
  transform: skewX(-15deg);
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  position: relative;
  z-index: 1;
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
  transition: transform 0.2s ease;
  cursor: pointer;
}

.deadline-item:last-child {
  border-bottom: none;
}

.deadline-item:hover {
  transform: translateX(5px);
  background-color: #f8f9fa;
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
  cursor: pointer;
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

.report-category {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.category-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.report-category .stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.report-category .stats-card {
  background: white;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }

  .quick-actions {
    width: 100%;
    justify-content: stretch;
  }

  .quick-actions .btn {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .material-value {
    font-size: 1.3rem;
  }

  .report-category {
    padding: 1rem;
  }

  .report-category .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
