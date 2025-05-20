<template>
  <!-- No changes to template section -->
</template>

<script>
import { ref } from 'vue'

const formData = ref({
  constructionID: '',
  reportType: props.reportType === 'technical' ? 'Sự cố kĩ thuật' : 'Sự cố thi công',
  content: '',
  level: '',
  status: '',
  images: [],
  newImages: [],
  deletedImagePaths: [],
  attachments: []
})

const getStatusInfo = (status) => {
  // Implement your logic to get status information based on the status
  return {
    color: 'success',
    icon: 'check',
    label: 'Đã hoàn thành'
  }
}

const getSeverityInfo = (level) => {
  // Implement your logic to get severity information based on the level
  return {
    color: 'warning',
    icon: 'exclamation-triangle',
    label: 'Trung bình'
  }
}
</script>

<template>
  <!-- No changes to template section -->
</template>

<style>
  /* No changes to style section */
</style>
