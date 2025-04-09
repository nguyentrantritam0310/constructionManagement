<script setup>
import { ref, watch } from 'vue'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'cancel'])

const formData = ref({
  projectName: '',
  projectType: '',
  location: '',
  totalArea: '',
  startDate: '',
  estimatedCompletionDate: '',
  designDocument: null,
  constructionItems: []
})

const errorMessage = ref('')
const showConfirmDialog = ref(false)

// Watch for changes in the project prop
watch(() => props.project, (newProject) => {
  if (newProject) {
    // Initialize form data with project data
    formData.value = {
      projectName: newProject.projectName || '',
      projectType: newProject.projectType || '',
      location: newProject.location || '',
      totalArea: newProject.totalArea || '',
      startDate: newProject.startDate || '',
      estimatedCompletionDate: newProject.estimatedCompletionDate || '',
      designDocument: newProject.designDocument || null,
      constructionItems: newProject.constructionItems ? [...newProject.constructionItems] : []
    }
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.projectName.trim()) {
    errorMessage.value = 'Vui lòng nhập tên dự án'
    return false
  }
  if (!formData.value.projectType.trim()) {
    errorMessage.value = 'Vui lòng chọn loại dự án'
    return false
  }
  if (!formData.value.location.trim()) {
    errorMessage.value = 'Vui lòng nhập địa điểm thi công'
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
  if (!formData.value.estimatedCompletionDate) {
    errorMessage.value = 'Vui lòng chọn ngày hoàn thành dự kiến'
    return false
  }
  if (new Date(formData.value.estimatedCompletionDate) <= new Date(formData.value.startDate)) {
    errorMessage.value = 'Ngày hoàn thành phải sau ngày bắt đầu'
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) return
  emit('update', formData.value)
}

const handleCancel = () => {
  showConfirmDialog.value = true
}

const confirmCancel = () => {
  emit('cancel')
}

const cancelConfirm = () => {
  showConfirmDialog.value = false
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.designDocument = file
  }
}

const addConstructionItem = () => {
  formData.value.constructionItems.push({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalVolume: '',
    unitOfMeasurement: ''
  })
}

const removeConstructionItem = (index) => {
  formData.value.constructionItems.splice(index, 1)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="p-3">
    <div class="row g-3">
      <div class="col-md-6">
        <FormField
          label="Tên Dự Án"
          v-model="formData.projectName"
          required
          :error="errorMessage"
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Loại Dự Án"
          v-model="formData.projectType"
          required
        />
      </div>
      <div class="col-12">
        <FormField
          label="Địa Điểm Thi Công"
          v-model="formData.location"
          required
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Tổng Diện Tích (m²)"
          type="number"
          v-model="formData.totalArea"
          required
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Ngày Bắt Đầu"
          type="date"
          v-model="formData.startDate"
          required
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Ngày Hoàn Thành Dự Kiến"
          type="date"
          v-model="formData.estimatedCompletionDate"
          required
        />
      </div>
      <div class="col-12">
        <FormField
          label="Tài Liệu Thiết Kế"
          type="file"
          @change="handleFileUpload"
          accept=".pdf,.doc,.docx"
        />
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Hạng Mục Thi Công</h5>
        <ActionButton
          icon="fas fa-plus"
          type="success"
          tooltip="Thêm hạng mục"
          @click="addConstructionItem"
        />
      </div>
      <div class="card-body">
        <div
          v-for="(item, index) in formData.constructionItems"
          :key="index"
          class="border rounded p-3 mb-3"
        >
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Hạng Mục #{{ index + 1 }}</h6>
            <ActionButton
              icon="fas fa-trash"
              type="danger"
              tooltip="Xóa hạng mục"
              @click="removeConstructionItem(index)"
            />
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <FormField
                label="Tên Hạng Mục"
                v-model="item.name"
                required
              />
            </div>
            <div class="col-12">
              <FormField
                label="Mô Tả"
                type="textarea"
                v-model="item.description"
              />
            </div>
            <div class="col-md-6">
              <FormField
                label="Ngày Bắt Đầu"
                type="date"
                v-model="item.startDate"
              />
            </div>
            <div class="col-md-6">
              <FormField
                label="Ngày Kết Thúc"
                type="date"
                v-model="item.endDate"
              />
            </div>
            <div class="col-md-6">
              <FormField
                label="Khối Lượng"
                type="number"
                v-model="item.totalVolume"
              />
            </div>
            <div class="col-md-6">
              <FormField
                label="Đơn Vị Đo"
                v-model="item.unitOfMeasurement"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2 mt-4">
      <ActionButton
        type="secondary"
        icon="fas fa-times"
        @click="handleCancel"
      >
        Hủy
      </ActionButton>
      <ActionButton
        type="primary"
        icon="fas fa-save"
        @click="handleSubmit"
      >
        Cập Nhật
      </ActionButton>
    </div>

    <ConfirmDialog
      v-model:show="showConfirmDialog"
      title="Xác nhận hủy"
      message="Thông tin chưa được lưu, bạn có chắc chắn muốn thoát?"
      @confirm="confirmCancel"
      @cancel="showConfirmDialog = false"
    />
  </form>
</template>

<style scoped>
.update-project-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

textarea.form-control {
  min-height: 100px;
  resize: vertical;
}

.construction-items {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: white;
}

.btn-icon i {
  font-size: 1.1rem;
}

.btn-primary {
  background-color: #3498db;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.btn-danger {
  background-color: #e74c3c;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.construction-item {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.item-header h4 {
  margin: 0;
  color: #333;
}

.error-message {
  color: #e74c3c;
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: #fde8e8;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.confirm-content p {
  margin: 0 0 1rem 0;
  color: #333;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.confirm-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-actions button:first-child {
  background-color: #95a5a6;
  color: white;
}

.confirm-actions button:last-child {
  background-color: #e74c3c;
  color: white;
}
</style>