<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(Boolean)
  const items = []
  let path = ''

  // Trang chủ
  items.push({
    text: 'Trang chủ',
    path: '/',
    active: pathArray.length === 0,
    icon: 'fas fa-home'
  })

  // Các trang khác
  pathArray.forEach((item, index) => {
    path += `/${item}`
    let text = ''
    let icon = ''

    switch (item) {
      case 'project-management':
        text = 'Quản lý dự án'
        icon = 'fas fa-project-diagram'
        break
      case 'construction-plan-management':
        text = 'Quản lý kế hoạch thi công'
        icon = 'fas fa-tasks'
        break
      case 'construction-management':
        text = 'Quản lý Công trình'
        icon = 'fas fa-building'
        break
      case 'technical-reports':
        text = 'Báo cáo kỹ thuật'
        icon = 'fas fa-file-alt'
        break
      case 'material-planning':
        text = 'Lập kế hoạch vật tư'
        icon = 'fas fa-boxes'
        break
      case 'material-management':
        text = 'Quản lý vật tư'
        icon = 'fas fa-warehouse'
        break
      case 'warehouse-entry':
        text = 'Nhập kho'
        icon = 'fas fa-truck-loading'
        break
      case 'stock-out':
        text = 'Xuất kho'
        icon = 'fas fa-truck'
        break
      case 'task-status':
        text = 'Quản lý công trình'
        icon = 'fas fa-tasks'
        break
      case 'incident-report':
        text = 'Báo cáo sự cố thi công'
        icon = 'fas fa-exclamation-triangle'
        break
      case 'proposal-approval':
        text = 'Phê duyệt đề xuất'
        icon = 'fas fa-check-circle'
        break
      case 'weather-forecast':
        text = 'Dự báo thời tiết'
        icon = 'fas fa-cloud-sun'
        break
      case 'leave':
        text = 'Nghỉ phép'
        icon = 'fas fa-calendar-day'
        break
      case 'Overtime':
        text = 'Tăng ca'
        icon = 'fas fa-clock'
        break
      case 'salary-adjustment':
        text = 'Khoản cộng trừ'
        icon = 'fas fa-plus-minus'
        break
      case 'salary-table':
        text = 'Bảng lương'
        icon = 'fas fa-file-invoice-dollar'
        break
      case 'attendance-summary':
        text = 'Bảng tổng hợp công'
        icon = 'fas fa-table'
        break
      case 'shift-setup':
        text = 'Thiết lập ca'
        icon = 'fas fa-cog'
        break
      case 'shift-assignment':
        text = 'Phân ca nhân viên'
        icon = 'fas fa-user-clock'
        break
      case 'annual-leave':
        text = 'Quản lý phép năm'
        icon = 'fas fa-calendar-plus'
        break
      case 'human-resources':
        text = 'Hồ sơ nhân sự'
        icon = 'fas fa-id-card'
        break
      case 'personnel-contract':
        text = 'Hợp đồng lao động'
        icon = 'fas fa-file-contract'
        break
      case 'permission-management':
        text = 'Quản lý phân quyền'
        icon = 'fas fa-shield-alt'
        break
      default:
        text = item.charAt(0).toUpperCase() + item.slice(1)
        icon = 'fas fa-folder'
    }

    items.push({
      text,
      path,
      active: index === pathArray.length - 1,
      icon
    })
  })

  return items
})
</script>

<template>
  <nav aria-label="breadcrumb" class="breadcrumb-wrapper">
    <ol class="breadcrumb">
      <li
        v-for="(item, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
        :class="{ active: item.active }"
      >
        <router-link
          v-if="!item.active"
          :to="item.path"
          class="breadcrumb-link"
        >
          <i :class="item.icon" class="breadcrumb-icon"></i>
          <span class="breadcrumb-text">{{ item.text }}</span>
        </router-link>
        <span v-else class="breadcrumb-current">
          <i :class="item.icon" class="breadcrumb-icon"></i>
          <span class="breadcrumb-text">{{ item.text }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb-wrapper {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 1rem 0;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.breadcrumb-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #2980b9, #3498db);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

.breadcrumb {
  margin: 0;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  position: relative;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1;
  padding: 0 0.75rem;
  transition: color 0.2s ease;
}

.breadcrumb-item:hover + .breadcrumb-item::before {
  color: rgba(255, 255, 255, 0.95);
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  overflow: hidden;
}


.breadcrumb-link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.breadcrumb-icon {
  font-size: 0.9rem;
  width: 16px;
  text-align: center;
  transition: all 0.2s ease;
}

.breadcrumb-link:hover .breadcrumb-icon {
  color: rgba(255, 255, 255, 0.95);
}

.breadcrumb-text {
  font-size: 0.9rem;
  transition: all 0.2s ease;
}


/* Responsive */
@media (max-width: 768px) {
  .breadcrumb-wrapper {
    padding: 0.75rem 0;
    margin-bottom: 1rem;
  }
  
  .breadcrumb {
    padding: 0 1rem;
    gap: 0.125rem;
  }
  
  .breadcrumb-link,
  .breadcrumb-current {
    padding: 0.375rem 0.625rem;
    font-size: 0.85rem;
  }
  
  .breadcrumb-icon {
    font-size: 0.8rem;
    width: 14px;
  }
  
  .breadcrumb-item + .breadcrumb-item::before {
    padding: 0 0.5rem;
    font-size: 1rem;
  }
}
</style>
