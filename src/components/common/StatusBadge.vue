<script setup>
const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const getStatusConfig = (status) => {
  const configs = {
    'Chờ khởi công': {
      bgColor: 'bg-warning',
      textColor: 'text-dark'
    },
    'Đang thi công': {
      bgColor: 'bg-info',
      textColor: 'text-white'
    },
    'Hoàn thành': {
      bgColor: 'bg-success',
      textColor: 'text-white'
    },
    'Tạm dừng': {
      bgColor: 'bg-secondary',
      textColor: 'text-white'
    },
    'Hủy bỏ': {
      bgColor: 'bg-danger',
      textColor: 'text-white'
    }
  }

  return configs[status] || {
    bgColor: 'bg-secondary',
    textColor: 'text-white'
  }
}

const statusConfig = getStatusConfig(props.status)
</script>

<template>
  <span
    class="badge rounded-pill px-3 py-2"
    :class="[statusConfig.bgColor, statusConfig.textColor]"
  >
    {{ status }}
  </span>
</template>

<style scoped>
.badge {
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Custom colors for different statuses */
.bg-warning {
  background-color: #ffc107 !important;
}

.bg-info {
  background-color: #17a2b8 !important;
}

.bg-success {
  background-color: #28a745 !important;
}

.bg-secondary {
  background-color: #6c757d !important;
}

.bg-danger {
  background-color: #dc3545 !important;
}

/* Hover effects */
.badge:hover.bg-warning {
  background-color: #e0a800 !important;
}

.badge:hover.bg-info {
  background-color: #138496 !important;
}

.badge:hover.bg-success {
  background-color: #218838 !important;
}

.badge:hover.bg-secondary {
  background-color: #5a6268 !important;
}

.badge:hover.bg-danger {
  background-color: #c82333 !important;
}
</style>
