import { createRouter, createWebHistory } from 'vue-router'
import ProjectManagementView from '../views/technical_staff/ProjectManagementView.vue'
import DashboardView from '../views/technical_staff/DashboardView.vue'
import MaterialPlanningView from '../views/technical_staff/MaterialPlanningView.vue'
import TechnicalReportView from '../views/technical_staff/TechnicalReportView.vue'
import { useAuth } from '../composables/useAuth'

import IncidentReportListView from '../views/construction_management/IncidentReportListView.vue'
import MaterialManagementView from '../views/construction_management/MaterialManagementView.vue'
import WarehouseEntryView from '..//views/construction_management/WarehouseEntryView.vue'
import StockOutView from '../views/construction_management/StockOutView.vue'
import TaskDetailView from '@/views/construction_management/TaskDetailView.vue'
import TaskStatusView from '@/views/construction_management/TaskStatusView.vue'
import ProposalApprovalView from '@/views/director/ProposalApprovalView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      meta: { requiresAuth: true },
      children: [
        {
          path: '/',
          name: 'dashboard',
          component: DashboardView
        },
        {
          path: '/project-management',
          name: 'project-management',
          component: ProjectManagementView
        },
        {
          path: '/project-management/:id',
          name: 'project-detail',
          component: () => import('../views/technical_staff/ProjectDetailView.vue'),
          props: true
        },
        {
          path: '/project-management-leader/:id',
          name: 'project-management-leader',
          component: () => import('../views/construction_management/ProjectDetailForLeaderView.vue'),
          props: true
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
          component: MaterialPlanningView
        },
        {
          path: '/technical-reports',
          name: 'technical-reports',
          component: TechnicalReportView
        },
        {
          path: '/task-status',
          name: 'task-status',
          component: TaskStatusView
        },
        {
          path: '/task-detail',
          name: 'TaskDetail',
          component: TaskDetailView
        },
        {
          path: '/incident-report',
          name: 'IncidentReportList',
          component: IncidentReportListView
        },
        {
          path: '/material-management',
          name: 'MaterialManagement',
          component: MaterialManagementView
        },
        {
          path: '/warehouse-entry',
          name: 'WarehouseEntry',
          component: WarehouseEntryView
        },
        {
          path: '/stock-out',
          name: 'StockOut',
          component: StockOutView
        },
        {
          path: '/proposal-approval',
          name: 'ProposalApproval',
          component: ProposalApprovalView,
        }
      ]
    }
  ]
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated.value) {
    next('/')
  } else {
    next()
  }
})

export default router
