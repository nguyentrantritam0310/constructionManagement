import { createRouter, createWebHistory } from 'vue-router'
import ConstructionManagementView from '../views/technical_staff/ConstructionManagementView.vue'
import DashboardView from '../views/technical_staff/DashboardView.vue'
import MaterialPlanningView from '../views/technical_staff/MaterialPlanningView.vue'
import TechnicalReportView from '../views/technical_staff/TechnicalReportView.vue'
import ConstructionDetailView from '../views/technical_staff/ConstructionDetailView.vue'
import { useAuth } from '../composables/useAuth'

import IncidentReportListView from '../views/construction_management/IncidentReportListView.vue'
import MaterialManagementView from '../views/construction_management/MaterialManagementView.vue'
import WarehouseEntryView from '../views/construction_management/WarehouseEntryView.vue'
import StockOutView from '../views/construction_management/StockOutView.vue'
import TaskDetailView from '../views/construction_management/TaskDetailView.vue'
import TaskStatusView from '../views/construction_management/TaskStatusView.vue'
import ProposalApprovalView from '../views/director/ProposalApprovalView.vue'
import ConstructionPlanManagementView from '@/views/technical_staff/ConstructionPlanManagementView.vue'

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
      path: '/attendance-summary',
      name: 'AttendanceSummary',
      component: () => import('../views/human_resources/AttendanceSummaryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/personnel-contract',
      name: 'LaborContracts',
      component: () => import('../views/human_resources/LaborContractView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/construction-management',
      name: 'construction-management',
      component: ConstructionManagementView,
      meta: { requiresAuth: true }
    },
    {
      path: '/construction-plan-management',
      name: 'construction-plan-management',
      component: ConstructionPlanManagementView,
      meta: { requiresAuth: true }
    },
    {
      path: '/construction-management/:id',
      name: 'construction-detail',
      component: ConstructionDetailView,
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/task-status/:id',
      name: 'task-status-detail',
      component: () => import('../views/construction_management/ConstructionDetailForLeaderView.vue'),
      props: true,
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
    },
    {
      path: '/human-resources',
      component: () => import('../views/human_resources/HumanResourcesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/shift-setup',
      component: () => import('../views/human_resources/ShiftSetupView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/shift-assignment',
      component: () => import('../views/human_resources/ShiftAssignmentView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/annual-leave',
      component: () => import('../views/human_resources/AnnualLeaveView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/salary-adjustment',
      component: () => import('../views/human_resources/AdjustmentListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/salary-table',
      component: () => import('../views/human_resources/SalaryTableView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/leave',
      component: () => import('../views/human_resources/leave.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/Overtime',
      component: () => import('../views/human_resources/Overtime.vue'),
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
