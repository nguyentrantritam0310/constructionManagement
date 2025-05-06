import { createRouter, createWebHistory } from 'vue-router'
import ProjectManagementView from '../views/technical_staff/ProjectManagementView.vue'
import DashboardView from '../views/technical_staff/DashboardView.vue'
import MaterialPlanningView from '../views/technical_staff/MaterialPlanningView.vue'
import TechnicalReportView from '../views/technical_staff/TechnicalReportView.vue'
import { useAuth } from '../composables/useAuth'

import IncidentReportListView from '../views/construction_management/IncidentReportListView.vue'
import MaterialManagementView from '../views/construction_management/MaterialManagementView.vue'
import WarehouseEntryView from '../views/construction_management/WarehouseEntryView.vue'
import StockOutView from '../views/construction_management/StockOutView.vue'
import TaskDetailView from '../views/construction_management/TaskDetailView.vue'
import TaskStatusView from '../views/construction_management/TaskStatusView.vue'
import ProposalApprovalView from '../views/director/ProposalApprovalView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/technical_staff/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/project-management',
      name: 'project-management',
      component: ProjectManagementView,
      meta: { requiresAuth: true }
    },
    {
      path: '/project-management/:id',
      name: 'project-detail',
      component: () => import('../views/technical_staff/ProjectDetailView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/project-management-leader/:id',
      name: 'project-management-leader',
      component: () => import('../views/construction_management/ProjectDetailForLeaderView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/construction-plan-management',
      name: 'construction-plan-management',
      component: () => import('../views/technical_staff/ConstructionPlanManagementView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/material-planning',
      name: 'material-planning',
      component: MaterialPlanningView,
      meta: { requiresAuth: true }
    },
    {
      path: '/technical-reports',
      name: 'technical-reports',
      component: TechnicalReportView,
      meta: { requiresAuth: true }
    },
    {
      path: '/task-status',
      name: 'task-status',
      component: TaskStatusView,
      meta: { requiresAuth: true }
    },
    {
      path: '/task-detail',
      name: 'TaskDetail',
      component: TaskDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/incident-report',
      name: 'IncidentReportList',
      component: IncidentReportListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/material-management',
      name: 'MaterialManagement',
      component: MaterialManagementView,
      meta: { requiresAuth: true }
    },
    {
      path: '/warehouse-entry',
      name: 'WarehouseEntry',
      component: WarehouseEntryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/stock-out',
      name: 'StockOut',
      component: StockOutView,
      meta: { requiresAuth: true }
    },
    {
      path: '/proposal-approval',
      name: 'ProposalApproval',
      component: ProposalApprovalView,
      meta: { requiresAuth: true }
    },
    {
      path: '/weather-forecast',
      name: 'WeatherForecast',
      component: () => import('../views/director/WeatherForecastView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, checkAuth } = useAuth()

  // Kiểm tra xem route có yêu cầu xác thực không
  if (to.meta.requiresAuth) {
    // Nếu chưa xác thực, kiểm tra token và refresh nếu cần
    if (!isAuthenticated.value) {
      const isAuth = await checkAuth()
      if (!isAuth) {
        next({ name: 'login' })
        return
      }
    }
  } else if (to.name === 'login' && isAuthenticated.value) {
    // Nếu đã đăng nhập và cố truy cập trang login, chuyển về trang chủ
    next({ name: 'home' })
    return
  }

  next()
})

export default router
