<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Xác nhận'
  },
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])
</script>

<template>
  <div
    class="modal fade"
    :class="{ 'show': show }"
    :style="{ display: show ? 'block' : 'none' }"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('update:show', false)"
          ></button>
        </div>
        <div class="modal-body">
          {{ message }}
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('cancel')"
          >
            Hủy
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="$emit('confirm')"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  </div>
</template>