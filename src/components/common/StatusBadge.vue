<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const statusClass = computed(() => {
  const classMap = {
    'Chờ khởi công': 'status-pending',
    'Pending': 'status-pending',
    'Chờ duyệt': 'status-pending',
    'Đang thi công': 'status-in-progress',
    'Approved': 'status-approved',
    'Đã duyệt': 'status-approved',
    'Hoàn thành': 'status-completed',
    'Completed': 'status-completed',
    'Tạm dừng': 'status-paused',
    'Hủy bỏ': 'status-rejected',
    'Rejected': 'status-rejected',
    'Đã từ chối': 'status-rejected',
    'Không xác định': 'status-default',
    // Mức độ
    'Thấp': 'level-low',
    'Trung bình': 'level-medium',
    'Cao': 'level-high',
    'Nghiêm trọng': 'level-critical',
  }
  return classMap[props.status] || 'status-default'
})
</script>

<template>
  <span :class="statusClass" class="status-badge">
    {{ status }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
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

/* Chờ duyệt / Pending - Amber */
.status-pending {
  background: #fff8e1;
  color: #e65100;
  border-color: #ff9800;
}

.status-pending:hover {
  background: #ffecb3;
  border-color: #f57c00;
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.25);
  transform: translateY(-1px);
}

/* Đang thi công - Blue */
.status-in-progress {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #2196f3;
}

.status-in-progress:hover {
  background: #bbdefb;
  border-color: #1976d2;
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.25);
  transform: translateY(-1px);
}

/* Đã duyệt / Approved - Green */
.status-approved {
  background: #e8f5e8;
  color: #2e7d32;
  border-color: #4caf50;
}

.status-approved:hover {
  background: #c8e6c9;
  border-color: #388e3c;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.25);
  transform: translateY(-1px);
}

/* Hoàn thành / Completed - Dark Green */
.status-completed {
  background: #c8e6c9;
  color: #1b5e20;
  border-color: #388e3c;
}

.status-completed:hover {
  background: #a5d6a7;
  border-color: #2e7d32;
  box-shadow: 0 2px 6px rgba(56, 142, 60, 0.25);
  transform: translateY(-1px);
}

/* Tạm dừng - Gray */
.status-paused {
  background: #f5f5f5;
  color: #616161;
  border-color: #9e9e9e;
}

.status-paused:hover {
  background: #e0e0e0;
  border-color: #757575;
  box-shadow: 0 2px 6px rgba(158, 158, 158, 0.25);
  transform: translateY(-1px);
}

/* Đã từ chối / Rejected - Red */
.status-rejected {
  background: #ffebee;
  color: #c62828;
  border-color: #f44336;
}

.status-rejected:hover {
  background: #ffcdd2;
  border-color: #d32f2f;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.25);
  transform: translateY(-1px);
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
  transform: translateY(-1px);
}

/* Mức độ - Thấp - Green */
.level-low {
  background: #e8f5e8;
  color: #2e7d32;
  border-color: #4caf50;
}

.level-low:hover {
  background: #c8e6c9;
  border-color: #388e3c;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.25);
  transform: translateY(-1px);
}

/* Mức độ - Trung bình - Blue */
.level-medium {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #2196f3;
}

.level-medium:hover {
  background: #bbdefb;
  border-color: #1976d2;
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.25);
  transform: translateY(-1px);
}

/* Mức độ - Cao - Orange */
.level-high {
  background: #fff3e0;
  color: #e65100;
  border-color: #ff9800;
}

.level-high:hover {
  background: #ffe0b2;
  border-color: #f57c00;
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.25);
  transform: translateY(-1px);
}

/* Mức độ - Nghiêm trọng - Red */
.level-critical {
  background: #ffebee;
  color: #c62828;
  border-color: #f44336;
}

.level-critical:hover {
  background: #ffcdd2;
  border-color: #d32f2f;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.25);
  transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 768px) {
  .status-badge {
    padding: 5px 12px;
    font-size: 0.8rem;
  }
}
</style>
