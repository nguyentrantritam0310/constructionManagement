<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        @click="removeToast(toast.id)"
      >
        <div class="toast-content">
          <i :class="getIcon(toast.type)" class="toast-icon"></i>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()

const getIcon = (type) => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }
  return icons[type] || icons.info
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  min-width: 300px;
  padding: 12px 16px;
  border-radius: 4px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  font-size: 0.875rem;
  color: #2c3e50;
}

.toast-close {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.toast-close:hover {
  color: #2c3e50;
}

.toast.success {
  border-left: 4px solid #198754;
}

.toast.success .toast-icon {
  color: #198754;
}

.toast.error {
  border-left: 4px solid #dc3545;
}

.toast.error .toast-icon {
  color: #dc3545;
}

.toast.warning {
  border-left: 4px solid #ffc107;
}

.toast.warning .toast-icon {
  color: #ffc107;
}

.toast.info {
  border-left: 4px solid #0dcaf0;
}

.toast.info .toast-icon {
  color: #0dcaf0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
