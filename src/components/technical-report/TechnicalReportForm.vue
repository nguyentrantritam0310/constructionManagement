<script setup>
import { ref, watch, computed } from 'vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  reportType: {
    type: String,
    required: true,
    validator: (value) => ['incident', 'technical'].includes(value)
  },
  report: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'resubmit', 'cancel'])

const formData = ref({
  constructionCode: '',
  constructionName: '',
  issueType: '',
  description: '',
  severity: '',
  status: 'Pending',
  images: []
})

// Watch for changes in report prop
watch(() => props.report, (newReport) => {
  if (newReport && Object.keys(newReport).length > 0) {
    formData.value = { ...newReport }
  }
}, { immediate: true })

// Watch for form data changes and emit them
watch(formData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

const issueTypes = [
  { value: 'equipment', label: 'Lỗi thiết bị' },
  { value: 'material', label: 'Thiếu vật tư' },
  { value: 'construction', label: 'Sự cố công trình' },
  { value: 'other', label: 'Vấn đề khác' }
]

const severityLevels = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
  { value: 'critical', label: 'Nghiêm trọng' }
]

const isRejected = computed(() => {
  if (props.report && props.report.statusLogs && props.report.statusLogs.length > 0) {
    // Lấy trạng thái mới nhất
    const latestStatus = props.report.statusLogs[0].status
    return latestStatus === 2 // 2 là Rejected
  }
  return false
})

const handleSubmit = () => {
  if (!formData.value.constructionCode || !formData.value.issueType ||
    !formData.value.description || !formData.value.severity) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }
  if (isRejected.value) {
    emit('resubmit', formData.value)
  } else {
    emit('submit', formData.value)
  }
}
</script>

<template>
  <div class="p-3">
    <FormField
      label="Công trình"
      type="select"
      v-model="formData.constructionCode"
      :options="[]"
      required
    />

    <FormField
      label="Loại vấn đề"
      type="select"
      v-model="formData.issueType"
      :options="issueTypes"
      required
    />

    <FormField
      label="Mức độ ảnh hưởng"
      type="select"
      v-model="formData.severity"
      :options="severityLevels"
      required
    />

    <FormField
      label="Mô tả vấn đề"
      type="textarea"
      v-model="formData.description"
      rows="4"
      required
    />

    <FormField
      label="Hình ảnh"
      type="file"
      v-model="formData.images"
      multiple
      accept="image/*"
    />
  </div>
</template>
