<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'project' // 'project' or 'construction'
  }
})

const statusClasses = computed(() => {
  const baseClass = 'badge'
  if (props.type === 'project') {
    switch (props.status) {
      case 'Pending Start': return `${baseClass} bg-warning`
      case 'In Progress': return `${baseClass} bg-info`
      case 'Completed': return `${baseClass} bg-success`
      case 'Delayed': return `${baseClass} bg-danger`
      default: return `${baseClass} bg-secondary`
    }
  } else {
    // Construction item status classes
    switch (props.status) {
      case 'Not Started': return `${baseClass} bg-secondary`
      case 'In Progress': return `${baseClass} bg-primary`
      case 'Completed': return `${baseClass} bg-success`
      case 'Delayed': return `${baseClass} bg-danger`
      default: return `${baseClass} bg-secondary`
    }
  }
})
</script>

<template>
  <span :class="statusClasses">{{ status }}</span>
</template>