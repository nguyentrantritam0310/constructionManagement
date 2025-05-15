<script setup>
import { ref, watch } from 'vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  exportOrder: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  constructionID: '',
  exportDate: new Date().toISOString().split('T')[0],
  status: 'Pending',
  note: '',
  material_ExportOrders: []
})

// Watch for changes in exportOrder prop
watch(() => props.exportOrder, (newOrder) => {
  if (newOrder && Object.keys(newOrder).length > 0) {
    formData.value = { ...newOrder }
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.constructionID || !formData.value.exportDate || formData.value.material_ExportOrders.length === 0) {
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
  formData.value.material_ExportOrders.push({
    materialID: '',
    quantity: 0,
    note: ''
  })
}

const removeMaterial = (index) => {
  formData.value.material_ExportOrders.splice(index, 1)
}
</script>

<template>
  <div class="p-3">
    <FormField label="Công Trình" type="select" v-model="formData.constructionID" :options="[]" required />

    <FormField label="Ngày Xuất" type="date" v-model="formData.exportDate" required />

    <FormField label="Ghi Chú" type="textarea" v-model="formData.note" rows="3" />

    <div class="mb-3">
      <label class="form-label fw-bold">
        <i class="fas fa-boxes-stacked me-2"></i>Vật Tư Xuất
      </label>
      <div v-for="(material, index) in formData.material_ExportOrders" :key="index" class="card mb-2 shadow-sm">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-5">
              <FormField label="Tên Vật Tư" type="text" v-model="formData.material_ExportOrders[index].materialID"
                required />
            </div>
            <div class="col-md-3">
              <FormField label="Số Lượng" type="number" v-model="formData.material_ExportOrders[index].quantity"
                required min="1" />
            </div>
            <div class="col-md-3">
              <FormField label="Ghi Chú" type="text" v-model="formData.material_ExportOrders[index].note" />
            </div>
            <div class="col-md-1 d-flex align-items-end">
              <button type="button" class="btn btn-danger btn-sm" @click="removeMaterial(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="text-end">
        <button type="button" class="btn btn-outline-primary btn-sm" @click="addMaterial">
          <i class="fas fa-plus me-2"></i>Thêm vật tư
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.card {
  border-radius: 0.5rem;
}

.card-body {
  padding: 0.75rem 1rem;
}

.table th,
.table td {
  vertical-align: middle;
}
</style>
