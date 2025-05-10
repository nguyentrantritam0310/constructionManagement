<script setup>
import { ref } from 'vue'
import api from '../../api.js'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'

const props = defineProps({
  construction: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['cancel'])

const formData = ref({
  ...props.construction,
  startDate: props.construction?.startDate ? props.construction.startDate.split('T')[0] : '',
  expectedCompletionDate: props.construction?.expectedCompletionDate ? props.construction.expectedCompletionDate.split('T')[0] : ''
})

const errorMessage = ref('')

const validateForm = () => {
  if (!formData.value.constructionName.trim()) {
    errorMessage.value = 'Vui lòng nhập tên công trình'
    return false
  }
  if (!formData.value.location.trim()) {
    errorMessage.value = 'Vui lòng nhập địa điểm'
    return false
  }
  if (!formData.value.totalArea) {
    errorMessage.value = 'Vui lòng nhập tổng diện tích'
    return false
  }
  if (!formData.value.startDate) {
    errorMessage.value = 'Vui lòng chọn ngày bắt đầu'
    return false
  }
  if (!formData.value.expectedCompletionDate) {
    errorMessage.value = 'Vui lòng chọn ngày dự kiến hoàn thành'
    return false
  }
  if (new Date(formData.value.expectedCompletionDate) <= new Date(formData.value.startDate)) {
    errorMessage.value = 'Ngày hoàn thành phải sau ngày bắt đầu'
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  try {
    await api.put(`/constructions/${formData.value.id}`, formData.value) // Gửi dữ liệu cập nhật
    alert('Cập nhật thành công!')
  } catch (error) {
    console.error('Error updating project:', error)
    alert('Cập nhật thất bại!')
  }
}

const fileInput = ref(null)

const triggerFileUpload = () => {
  fileInput.value.click() // Mở input upload file
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.designBlueprint = file.name // Lưu tên file
    // Bạn có thể thêm logic upload file tại đây
  }
}

const removeDesignBlueprint = () => {
  formData.value.designBlueprint = null
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="p-3">
    <div class="row g-3">
      <div class="col-md-6">
        <FormField label="Tên Dự Án" v-model="formData.constructionName" required />
      </div>
      <div class="col-md-6">
        <FormField label="Loại Dự Án" type="select" v-model="formData.constructionTypeID" :options="[
          { value: '1', label: 'Cầu đường' },
          { value: '2', label: 'Nhà ở' },
          { value: '3', label: 'Công nghiệp' },
          { value: '4', label: 'Thủy lợi' }
        ]" required />
      </div>
      <div class="col-12">
        <FormField label="Địa Điểm Thi Công" v-model="formData.location" required />
      </div>
      <div class="col-md-6">
        <FormField label="Tổng Diện Tích (m²)" type="number" v-model="formData.totalArea" required />
      </div>
      <div class="col-md-6">
        <FormField label="Ngày Bắt Đầu" type="date" v-model="formData.startDate" required />
      </div>
      <div class="col-md-6">
        <FormField label="Ngày Hoàn Thành Dự Kiến" type="date" v-model="formData.expectedCompletionDate" required />
      </div>
      <div class="col-12">
        <FormField label="Tài Liệu Thiết Kế" type="file" v-model="formData.designBlueprint" />
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2 mt-4">
      <ActionButton type="secondary" icon="fas fa-times" @click="$emit('cancel')">
        Hủy
      </ActionButton>
      <ActionButton type="primary" icon="fas fa-save" @click="handleSubmit">
        Xác Nhận
      </ActionButton>
    </div>
  </form>
</template>



<style scoped>
.create-project-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.construction-items {
  margin-top: 20px;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
}

.construction-item-form {
  margin-bottom: 20px;
}

.add-item-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.construction-items-list ul {
  list-style: none;
  padding: 0;
}

.construction-items-list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

h2,
h3 {
  color: #333;
  margin-bottom: 20px;
}

h4 {
  color: #666;
  margin-bottom: 10px;
}
</style>
