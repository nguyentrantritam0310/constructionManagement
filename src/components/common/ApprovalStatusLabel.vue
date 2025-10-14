<template>
  <span :class="statusClass" class="approval-status-label">
    <i :class="statusIcon" class="status-icon"></i>
    {{ displayText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const displayText = computed(() => {
  // Map status values to display text
  const statusMap = {
    'Created': 'Tạo mới',
    'Pending': 'Chờ duyệt', 
    'Approved': 'Đã duyệt',
    'Rejected': 'Từ chối',
    // Vietnamese strings from backend
    'Tạo mới': 'Tạo mới',
    'Chờ duyệt': 'Chờ duyệt',
    'Đã duyệt': 'Đã duyệt',
    'Từ chối': 'Từ chối'
  }
  return statusMap[props.status] || props.status
})

const statusIcon = computed(() => {
  // Map status to icons
  const iconMap = {
    'Created': 'fas fa-plus-circle',
    'Pending': 'fas fa-clock',
    'Approved': 'fas fa-check-circle', 
    'Rejected': 'fas fa-times-circle',
    // Vietnamese strings from backend
    'Tạo mới': 'fas fa-plus-circle',
    'Chờ duyệt': 'fas fa-clock',
    'Đã duyệt': 'fas fa-check-circle',
    'Từ chối': 'fas fa-times-circle'
  }
  return iconMap[props.status] || 'fas fa-question-circle'
})

const statusClass = computed(() => {
  // Map status to CSS classes
  const classMap = {
    'Created': 'status-created',
    'Pending': 'status-pending',
    'Approved': 'status-approved', 
    'Rejected': 'status-rejected',
    // Vietnamese strings from backend
    'Tạo mới': 'status-created',
    'Chờ duyệt': 'status-pending',
    'Đã duyệt': 'status-approved',
    'Từ chối': 'status-rejected'
  }
  return classMap[props.status] || 'status-default'
})
</script>

<style scoped>
.approval-status-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.875rem;
  text-align: center;
  border: 1.5px solid;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 0.8rem;
}

/* Tạo mới - Blue */
.status-created {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #2196f3;
}

.status-created:hover {
  background: #bbdefb;
  border-color: #1976d2;
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.25);
}

/* Chờ duyệt - Amber */
.status-pending {
  background: #fff8e1;
  color: #e65100;
  border-color: #ff9800;
}

.status-pending:hover {
  background: #ffecb3;
  border-color: #f57c00;
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.25);
}

/* Đã duyệt - Green */
.status-approved {
  background: #e8f5e8;
  color: #2e7d32;
  border-color: #4caf50;
}

.status-approved:hover {
  background: #c8e6c9;
  border-color: #388e3c;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.25);
}

/* Từ chối - Red */
.status-rejected {
  background: #ffebee;
  color: #c62828;
  border-color: #f44336;
}

.status-rejected:hover {
  background: #ffcdd2;
  border-color: #d32f2f;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.25);
}

/* Default fallback */
.status-default {
  background: #f5f5f5;
  color: #616161;
  border-color: #9e9e9e;
}

.status-default:hover {
  background: #e0e0e0;
  border-color: #757575;
  box-shadow: 0 2px 6px rgba(158, 158, 158, 0.25);
}

/* Responsive design */
@media (max-width: 768px) {
  .approval-status-label {
    padding: 5px 12px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .status-icon {
    font-size: 0.75rem;
  }
}
</style>
