<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  construction: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const { templateItem, fetchConstructionTemplateItem, createConstruction, updateConstruction, fetchConstructions } = useConstructionManagement()
const { showMessage } = useGlobalMessage()

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

// Khởi tạo formData với dữ liệu của construction nếu là chế độ update
const initFormData = () => {
  if (props.mode === 'update' && props.construction) {
    formData.value = {
      ...props.construction,
      startDate: props.construction.startDate ? props.construction.startDate.split('T')[0] : '',
      expectedCompletionDate: props.construction.expectedCompletionDate ? props.construction.expectedCompletionDate.split('T')[0] : ''
    }
    // Khởi tạo danh sách hạng mục
    if (props.construction.constructionItems) {
      constructionItems.value = props.construction.constructionItems.map(item => ({
        ...item,
        startDate: item.startDate ? item.startDate.split('T')[0] : '',
        endDate: item.endDate ? item.endDate.split('T')[0] : ''
      }))
    }
  }
}

onMounted(() => {
  initFormData()
})

// Watch cho props.construction để cập nhật formData khi construction thay đổi
watch(() => props.construction, (newConstruction) => {
  if (props.mode === 'update' && newConstruction) {
    initFormData()
  }
}, { immediate: true })

// Thêm một hàng nhập hạng mục mới
const addNewItemRow = () => {
  if (!newItem.value.constructionItemName) {
    showError('Vui lòng nhập tên hạng mục')
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

const validateForm = () => {
  if (!formData.value.constructionName.trim()) {
    showError('Vui lòng nhập tên công trình')
    return false
  }
  if (!formData.value.location.trim()) {
    showError('Vui lòng nhập địa điểm')
    return false
  }
  if (!formData.value.totalArea) {
    showError('Vui lòng nhập tổng diện tích')
    return false
  }
  if (!formData.value.startDate) {
    showError('Vui lòng chọn ngày bắt đầu')
    return false
  }
  if (!formData.value.expectedCompletionDate) {
    showError('Vui lòng chọn ngày dự kiến hoàn thành')
    return false
  }
  if (new Date(formData.value.expectedCompletionDate) <= new Date(formData.value.startDate)) {
    showError('Ngày hoàn thành phải sau ngày bắt đầu')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const dataToSubmit = {
      ...formData.value,
      constructionItems: constructionItems.value
    }

    if (props.mode === 'update') {
      await updateConstruction(props.construction.id, dataToSubmit)
      showMessage('Cập nhật công trình thành công', 'success')
    } else {
      await createConstruction(dataToSubmit)
      showMessage('Tạo công trình thành công', 'success')
    }

    // Fetch lại dữ liệu sau khi tạo/cập nhật thành công
    await fetchConstructions()
    emit('close')
  } catch (error) {
    console.error(`Error ${props.mode === 'update' ? 'updating' : 'creating'} construction:`, error)
    showMessage(`Không thể ${props.mode === 'update' ? 'cập nhật' : 'tạo'} công trình`, 'error')
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

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      // Kiểm tra định dạng file
      if (!file.type.startsWith('image/')) {
        showError('Vui lòng chọn file ảnh')
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
      showError('Có lỗi xảy ra khi upload file')
    }
  }
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
        <FormField label="Tài Liệu Thiết Kế" type="file" accept="image/*" @change="handleFileUpload" />
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
      <ActionButton type="secondary" icon="fas fa-times" @click="$emit('close')">
        Hủy
      </ActionButton>
      <ActionButton type="primary" icon="fas fa-save" @click="handleSubmit">
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </ActionButton>
    </div>
  </form>
</template>

<style scoped>
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

h4 {
  color: #666;
  margin-bottom: 10px;
}
</style>
