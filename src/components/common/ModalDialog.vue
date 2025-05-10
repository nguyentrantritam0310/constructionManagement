<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: ''
  },
  scrollable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div v-if="show" class="modal-backdrop fade show" @click="$emit('update:show', false)"></div>

    <!-- Modal -->
    <div v-if="show" class="modal fade show" style="display: block;">
      <div :class="[
        'modal-dialog',
        size ? `modal-${size}` : '',
        { 'modal-dialog-scrollable': scrollable }
      ]" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ title }}</h5>
            <button type="button" class="btn-close" @click="$emit('update:show', false)"></button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal {
  z-index: 1055;
}

.modal-backdrop {
  z-index: 1050;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  margin: 1.75rem auto;
}

.modal-content {
  animation: modalShow 0.3s ease-out;
}

@keyframes modalShow {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ensure modal is above sidebar */
:deep(.modal-dialog) {
  z-index: 1060;
}

/* Add some padding to body when modal is open */
:global(body.modal-open) {
  padding-right: 0 !important;
  overflow: hidden;
}
</style>
