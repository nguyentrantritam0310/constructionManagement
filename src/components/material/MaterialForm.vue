<script setup>
import { ref, watch } from 'vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  material: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  id: null,
  name: '',
  unit: '',
  type: '',
  price: null,
  status: 'Hết hàng'
})

// Watch for changes in material prop
watch(() => props.material, (newMaterial) => {
  if (newMaterial && Object.keys(newMaterial).length > 0) {
    formData.value = { ...newMaterial }
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.name || !formData.value.unit || !formData.value.type || !formData.value.price) {
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
      label="Tên Vật Tư"
      type="text"
      v-model="formData.name"
      required
    />

    <FormField
      label="Đơn Vị Tính"
      type="text"
      v-model="formData.unit"
      required
    />

    <FormField
      label="Loại Vật Tư"
      type="text"
      v-model="formData.type"
      required
    />

    <FormField
      label="Đơn Giá"
      type="number"
      v-model="formData.price"
      required
    />
  </div>
</template>
