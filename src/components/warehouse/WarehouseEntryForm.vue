<script setup>
import { ref, watch } from 'vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  order: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  supplier: '',
  date: new Date().toISOString().split('T')[0],
  status: 'Chờ nhập kho',
  materials: []
})

// Watch for changes in order prop
watch(() => props.order, (newOrder) => {
  if (newOrder && Object.keys(newOrder).length > 0) {
    formData.value = { ...newOrder }
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.supplier || !formData.value.date || formData.value.materials.length === 0) {
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

const addMaterial = () => {
  formData.value.materials.push({
    name: '',
    quantity: 0,
    unit: '',
    actual: 0,
    note: ''
  })
}

const removeMaterial = (index) => {
  formData.value.materials.splice(index, 1)
}
</script>

<template>
  <div class="p-3">
    <FormField
      label="Nhà Cung Cấp"
      type="text"
      v-model="formData.supplier"
      required
    />

    <FormField
      label="Ngày Đặt"
      type="date"
      v-model="formData.date"
      required
    />

    <div class="mb-3">
      <label class="form-label">Vật Tư</label>
      <div v-for="(material, index) in formData.materials" :key="index" class="row g-2 mb-2">
        <div class="col">
          <input type="text" v-model="material.name" class="form-control" placeholder="Tên vật tư" />
        </div>
        <div class="col">
          <input type="number" v-model="material.quantity" class="form-control" placeholder="Số lượng" />
        </div>
        <div class="col">
          <input type="text" v-model="material.unit" class="form-control" placeholder="Đơn vị" />
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-danger" @click="removeMaterial(index)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <button type="button" class="btn btn-outline-primary btn-sm" @click="addMaterial">
        <i class="fas fa-plus me-2"></i>Thêm vật tư
      </button>
    </div>
  </div>
</template>
