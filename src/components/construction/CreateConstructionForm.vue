<script setup>
import { reactive, ref } from 'vue'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
const { templateItem, fetchConstructionTemplateItem } = useConstructionManagement()

const props = defineProps({
  formData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['cancel', 'submit'])

// Danh sách hạng mục
const constructionItems = ref([])
const showAddForm = ref(false)

// Hạng mục mới
const newItem = ref({
  constructionItemName: '',
  startDate: '',
  endDate: '',
  totalVolume: '',
  unitOfMeasurement: '',
  taskType: '',
  description: ''
})

// Form data
const formData = ref({
  constructionName: '',
  constructionTypeID: '',
  location: '',
  totalArea: '',
  startDate: '',
  expectedCompletionDate: '',
  designBlueprint: null
})

// Thêm một hàng nhập hạng mục mới
const addNewItemRow = () => {
  if (!newItem.value.constructionItemName) {
    alert('Vui lòng nhập tên hạng mục')
    return
  }
  constructionItems.value.push({ ...newItem.value })
  resetNewItem()
  showAddForm.value = false
}

// Hủy thêm hạng mục mới
const cancelAddItem = () => {
  resetNewItem()
  showAddForm.value = false
}

// Xóa một hàng nhập hạng mục
const removeItemRow = (index) => {
  constructionItems.value.splice(index, 1)
}

// Reset hạng mục mới
const resetNewItem = () => {
  newItem.value = {
    constructionItemName: '',
    startDate: '',
    endDate: '',
    totalVolume: '',
    unitOfMeasurement: '',
    taskType: '',
    description: ''
  }
}

const handleSubmit = () => {
  const formDataToSubmit = {
    ...formData.value,
    constructionItems: constructionItems.value
  }
  emit('submit', formDataToSubmit)
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      // Kiểm tra định dạng file
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh')
        return
      }

      // Tạo FormData để gửi file
      const formData = new FormData()
      formData.append('file', file)

      // Gọi API để upload file
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      // Lưu tên file vào formData
      formData.value.designBlueprint = result.filename
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Có lỗi xảy ra khi upload file')
    }
  }
}

const handleConstructionTypeChange = async () => {
  if (formData.value.constructionTypeID) {
    await fetchConstructionTemplateItem(formData.value.constructionTypeID)
    // Thêm các hạng mục mẫu vào danh sách
    if (templateItem.value && templateItem.value.length > 0) {
      templateItem.value.forEach(item => {
        constructionItems.value.push({
          constructionItemName: item.constructionTemplateItemName,
          startDate: '',
          endDate: '',
          totalVolume: '',
          unitOfMeasurement: item.unitOfMeasurement,
          taskType: item.workSubTypeVariantDescription,
          description: item.description
        })
      })
    }
  }
}
</script>

<template>
  <div v-if="true" class="modal-backdrop" @click="$emit('cancel')"></div>
  <div v-if="true" class="modal fade show" style="display: block;">
    <div class="modal-dialog modal-lg" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Thêm Công Trình Mới</h5>
          <button type="button" class="btn-close" @click="$emit('cancel')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit" class="p-3">
            <div class="row g-3">
              <div class="col-md-6">
                <FormField label="Tên Dự Án" v-model="formData.constructionName" required />
              </div>
              <div class="col-md-6">
                <FormField label="Loại Dự Án" type="select" v-model="formData.constructionTypeID" :options="[
                  { value: 1, label: 'Cầu đường' },
                  { value: 2, label: 'Nhà ở' },
                  { value: 3, label: 'Công nghiệp' },
                  { value: 4, label: 'Thủy lợi' }
                ]" required @change="handleConstructionTypeChange" />
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
                <FormField
                  label="Tài Liệu Thiết Kế"
                  type="file"
                  accept="image/*"
                  @change="handleFileUpload"
                />
                <small class="text-muted">Chỉ chấp nhận file ảnh (jpg, png, gif)</small>
              </div>
            </div>

            <div class="construction-items mt-4">
              <h4>Danh Sách Hạng Mục</h4>

              <!-- Danh sách hạng mục đã thêm -->
              <div class="row g-3 align-items-end" v-for="(item, index) in constructionItems" :key="index">
                <div class="col-md-6">
                  <FormField label="Tên Hạng Mục" v-model="item.constructionItemName" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Ngày Bắt Đầu" type="date" v-model="item.startDate" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Ngày Kết Thúc" type="date" v-model="item.endDate" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Tổng Khối Lượng" type="number" v-model="item.totalVolume" required />
                </div>
                <div class="col-md-2">
                  <FormField label="Đơn Vị" type="select" v-model="item.unitOfMeasurement" :options="[
                    { value: '1', label: 'm' },
                    { value: '2', label: 'kg' },
                    { value: '3', label: 'khối' },
                    { value: '4', label: 'viên' }
                  ]" required />
                </div>
                <div class="col-md-4">
                  <FormField label="Loại Công Tác" v-model="item.taskType" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Mô Tả" v-model="item.description" />
                </div>
                <div class="col-12 text-end">
                  <button type="button" class="btn btn-sm btn-danger" @click="removeItemRow(index)">
                    Xóa
                  </button>
                </div>
              </div>

              <!-- Form thêm hạng mục mới -->
              <div v-if="showAddForm" class="row g-3 align-items-end mt-3 border-top pt-3">
                <div class="col-md-6">
                  <FormField label="Tên Hạng Mục" v-model="newItem.constructionItemName" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Ngày Bắt Đầu" type="date" v-model="newItem.startDate" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Ngày Kết Thúc" type="date" v-model="newItem.endDate" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Tổng Khối Lượng" type="number" v-model="newItem.totalVolume" required />
                </div>
                <div class="col-md-2">
                  <FormField label="Đơn Vị" type="select" v-model="newItem.unitOfMeasurement" :options="[
                    { value: '1', label: 'm' },
                    { value: '2', label: 'kg' },
                    { value: '3', label: 'khối' },
                    { value: '4', label: 'viên' }
                  ]" required />
                </div>
                <div class="col-md-4">
                  <FormField label="Loại Công Tác" v-model="newItem.taskType" required />
                </div>
                <div class="col-md-3">
                  <FormField label="Mô Tả" v-model="newItem.description" />
                </div>
                <div class="col-12 text-end">
                  <button type="button" class="btn btn-sm btn-secondary me-2" @click="cancelAddItem">
                    Hủy
                  </button>
                  <button type="button" class="btn btn-sm btn-primary" @click="addNewItemRow">
                    Thêm
                  </button>
                </div>
              </div>

              <!-- Nút thêm hạng mục -->
              <div class="text-end mt-3">
                <ActionButton v-if="!showAddForm" type="primary" icon="fas fa-plus" @click="showAddForm = true">
                  Thêm Hạng Mục
                </ActionButton>
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
        </div>
      </div>
    </div>
  </div>
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

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1055;
}

.modal-dialog {
  max-width: 800px;
  width: 90%;
  margin: 1.75rem auto;
}

.modal-content {
  animation: modalShow 0.3s ease-out;
}

@keyframes modalShow {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
