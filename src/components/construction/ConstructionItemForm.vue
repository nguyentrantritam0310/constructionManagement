<script setup>
import { ref, watch } from 'vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  item: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  id: null,
  constructionItemName: '',
  startDate: '',
  expectedCompletionDate: '',
  totalVolume: 0,
  unit: '',
  status: 'Chưa bắt đầu'
})

// Watch for changes in item prop
watch(() => props.item, (newItem) => {
  if (newItem && Object.keys(newItem).length > 0) {
    formData.value = { ...newItem }
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.constructionItemName || !formData.value.startDate ||
      !formData.value.expectedCompletionDate || !formData.value.totalVolume ||
      !formData.value.unit) {
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }
  emit('submit', formData.value)
}
</script>

<template>
  <div class="p-3">
    <FormField
      label="Tên Hạng Mục"
      type="text"
      v-model="formData.constructionItemName"
      required
    />

    <FormField
      label="Ngày Bắt Đầu"
      type="date"
      v-model="formData.startDate"
      required
    />

    <FormField
      label="Ngày Dự Kiến Hoàn Thành"
      type="date"
      v-model="formData.expectedCompletionDate"
      required
    />

    <FormField
      label="Tổng Khối Lượng"
      type="number"
      v-model="formData.totalVolume"
      required
    />

    <FormField
      label="Đơn Vị"
      type="text"
      v-model="formData.unit"
      required
    />
  </div>
</template>
