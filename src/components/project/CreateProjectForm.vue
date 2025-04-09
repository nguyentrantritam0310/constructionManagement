<script setup>
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  constructionItem: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['cancel', 'submit', 'add-item', 'file-upload'])

const handleSubmit = () => {
  emit('submit')
}

const handleFileUpload = (event) => {
  emit('file-upload', event)
}

const handleAddItem = () => {
  emit('add-item')
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
          v-model="formData.constructionLocation"
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
          @click="$emit('add-item')"
        />
      </div>
      <div class="card-body">
        <!-- Construction Items List -->
        <div class="list-group">
          <div
            v-for="(item, index) in formData.constructionItems"
            :key="index"
            class="list-group-item"
          >
            <h6>Hạng Mục #{{ index + 1 }}</h6>
            <p class="mb-1">{{ item.name }}</p>
            <small class="text-muted">{{ item.description }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2 mt-4">
      <ActionButton
        type="secondary"
        icon="fas fa-times"
        @click="$emit('cancel')"
      >
        Hủy
      </ActionButton>
      <ActionButton
        type="primary"
        icon="fas fa-save"
        @click="handleSubmit"
      >
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

input, textarea {
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

h2, h3 {
  color: #333;
  margin-bottom: 20px;
}

h4 {
  color: #666;
  margin-bottom: 10px;
}
</style>