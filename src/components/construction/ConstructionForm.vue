<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useUnitofMeasurement } from '../../composables/useUnitofMeasurement'
import { useWorkSubTypeVariant } from '../../composables/useWorkSubTypeVariant'
import { useConstructionItem } from '../../composables/useConstructionItem'
import ConstructionItemForm from './ConstructionItemForm.vue'

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

const { templateItem, fetchConstructionTemplateItem, createConstruction, updateConstruction, fetchConstructions, deleteConstruction } = useConstructionManagement()
const { showMessage } = useGlobalMessage()
const { unitMeasurements, loadUnitMeasurements } = useUnitofMeasurement()
const { variants, loadVariants } = useWorkSubTypeVariant()

// Danh sách hạng mục
const constructionItems = ref([])
const showAddForm = ref(false)
const showItemForm = ref(false)
const selectedItem = ref(null)
const editingItemIndex = ref(-1)

// Hạng mục mới
const newItem = ref({
  constructionItemName: '',
  startDate: '',
  endDate: '',
  totalVolume: '',
  unitOfMeasurementID: '',
  workSubTypeVariantID: ''
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
        expectedCompletionDate: item.expectedCompletionDate ? item.expectedCompletionDate.split('T')[0] : '',
        unitName: item.unitName,
        workSubTypeVariantID: item.workSubTypeVariantID,
        unitOfMeasurementID: item.unitOfMeasurementID
      }))
    }
  }
}

onMounted(async () => {
  initFormData()
  await Promise.all([
    loadUnitMeasurements(),
    loadVariants()
  ])
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
    showMessage('Vui lòng nhập tên hạng mục', error)
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
    expectedCompletionDate: '',
    totalVolume: '',
    unitOfMeasurementID: '',
    workSubTypeVariantID: ''
  }
}

const validateForm = () => {
  if (!formData.value.constructionName.trim()) {
    showMessage('Vui lòng nhập tên công trình', 'error')
    return false
  }
  if (!formData.value.location.trim()) {
    showMessage('Vui lòng nhập địa điểm', 'error')
    return false
  }
  if (!formData.value.totalArea) {
    showMessage('Vui lòng nhập tổng diện tích', 'error')
    return false
  }
  if (!formData.value.startDate) {
    showMessage('Vui lòng chọn ngày bắt đầu', 'error')
    return false
  }
  if (!formData.value.expectedCompletionDate) {
    showMessage('Vui lòng chọn ngày dự kiến hoàn thành', 'error')
    return false
  }
  if (new Date(formData.value.expectedCompletionDate) <= new Date(formData.value.startDate)) {
    showMessage('Ngày hoàn thành phải sau ngày bắt đầu', 'error')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    // Step 1: Create construction first
    const constructionData = {
      constructionTypeID: Number(formData.value.constructionTypeID),
      constructionStatusID: 1,
      constructionName: formData.value.constructionName,
      location: formData.value.location,
      totalArea: Number(formData.value.totalArea),
      startDate: `${formData.value.startDate}T00:00:00.000Z`,
      expectedCompletionDate: `${formData.value.expectedCompletionDate}T00:00:00.000Z`,
      designBlueprint: formData.value.designBlueprint
    }

    // Log request data
    console.log('Construction Data being sent:', {
      ...constructionData,
      designBlueprint: constructionData.designBlueprint ? 'File present' : 'No file'
    })

    let createdConstruction
    if (props.mode === 'update') {
      console.log('Updating construction with ID:', props.construction.id)
      createdConstruction = await updateConstruction(props.construction.id, constructionData)
      showMessage('Cập nhật công trình thành công', 'success')
      // Fetch lại data sau khi cập nhật thành công
      await fetchConstructions()
      emit('close')
    } else {
      console.log('Creating new construction')
      try {
        createdConstruction = await createConstruction(constructionData)
        console.log('Construction created successfully:', createdConstruction)
        // Step 2: Create construction items using the new construction's ID
        if (constructionItems.value.length > 0) {
          console.log('Creating construction items:', constructionItems.value)
          const { createConstructionItem } = useConstructionItem()
          const itemPromises = constructionItems.value.map(item => {
            const itemData = {
              constructionID: createdConstruction.id,
              constructionItemName: item.constructionItemName,
              startDate: `${item.startDate}T00:00:00.000Z`,
              expectedCompletionDate: `${item.expectedCompletionDate}T00:00:00.000Z`,
              totalVolume: Number(item.totalVolume),
              unitOfMeasurementID: Number(item.unitOfMeasurementID),
              workSubTypeVariantID: Number(item.workSubTypeVariantID),
              constructionItemStatusID: 1
            }
            console.log('Creating item with data:', itemData)
            return createConstructionItem(itemData)
          })

          try {
            const results = await Promise.all(itemPromises)
            console.log('All items created successfully:', results)
            showMessage('Tạo công trình thành công', 'success')
          } catch (error) {
            console.error('Error creating construction items:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              items: constructionItems.value
            })
            showMessage('Có lỗi xảy ra khi tạo công trình', 'error')
            return
          }
        }

        // Step 3: Refresh data and close form
        console.log('Refreshing construction list...')
        await fetchConstructions()
        emit('close')
      } catch (error) {
        console.error('Error creating construction:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          requestData: constructionData
        })
        showMessage(`Không thể tạo công trình: ${error.response?.data?.message || error.message}`, 'error')
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    showMessage('Có lỗi xảy ra', 'error')
  }
}

const handleConstructionTypeChange = async () => {
  if (formData.value.constructionTypeID) {
    await fetchConstructionTemplateItem(formData.value.constructionTypeID)
    // Thay thế hoàn toàn danh sách hạng mục bằng các hạng mục mẫu
    if (templateItem.value && templateItem.value.length > 0) {
      constructionItems.value = templateItem.value.map(item => ({
          constructionItemName: item.constructionTemplateItemName,
          startDate: '',
          endDate: '',
          totalVolume: '',
        unitOfMeasurementID: item.unitOfMeasurementID,
        workSubTypeVariantID: item.workSubTypeVariantID,
        unitName: item.unitName
      }))
    } else {
      // Nếu không có hạng mục mẫu, xóa sạch danh sách
      constructionItems.value = []
    }
  } else {
    // Nếu không chọn loại dự án, xóa sạch danh sách
    constructionItems.value = []
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
      if (!file.type.startsWith('image/')) {
      showMessage('Vui lòng chọn file ảnh', 'error')
        return
      }
    formData.value.designBlueprint = file
  }
}

const handleEditItem = (index) => {
  selectedItem.value = { ...constructionItems.value[index] }
  editingItemIndex.value = index
  showItemForm.value = true
}

const handleUpdateItem = (itemData) => {
  if (editingItemIndex.value >= 0) {
    constructionItems.value[editingItemIndex.value] = {
      ...itemData,
      startDate: itemData.startDate.split('T')[0],
      expectedCompletionDate: itemData.expectedCompletionDate.split('T')[0]
    }
    showMessage('Cập nhật hạng mục thành công', 'success')
  } else {
    constructionItems.value.push({
      ...itemData,
      startDate: itemData.startDate.split('T')[0],
      expectedCompletionDate: itemData.expectedCompletionDate.split('T')[0]
    })
    showMessage('Thêm hạng mục thành công', 'success')
  }
  showItemForm.value = false
  selectedItem.value = null
  editingItemIndex.value = -1
}

const handleCancelItem = () => {
  showItemForm.value = false
  selectedItem.value = null
  editingItemIndex.value = -1
}
</script>

<template>
  <div class="p-3">
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
      <div class="col-md-4">
        <FormField label="Tổng Diện Tích (m²)" type="number" v-model="formData.totalArea" required />
      </div>
      <div class="col-md-4">
        <FormField label="Ngày Bắt Đầu" type="date" v-model="formData.startDate" required />
      </div>
      <div class="col-md-4">
        <FormField label="Ngày Hoàn Thành Dự Kiến" type="date" v-model="formData.expectedCompletionDate" required />
      </div>
      <div class="col-12">
        <FormField label="Tài Liệu Thiết Kế" type="file" accept="image/*" @change="handleFileUpload" />
        <small class="text-muted">Chỉ chấp nhận file ảnh (jpg, png, gif)</small>
      </div>
    </div>

    <div class="construction-items mt-4">
      <div class="section-header d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">
          <i class="fas fa-list-ul me-2"></i>
          Danh Sách Hạng Mục
        </h4>
        <ActionButton
          v-if="!showItemForm && props.mode === 'create'"
          type="primary"
          icon="fas fa-plus"
          @click="showItemForm = true"
        >
          Thêm Hạng Mục
        </ActionButton>
      </div>

      <div v-if="props.mode === 'update'" class="alert alert-info mb-4">
        <i class="fas fa-info-circle me-2"></i>
        Để quản lý hạng mục, vui lòng vào trang chi tiết công trình
      </div>

      <div v-if="constructionItems.length > 0" class="items-list mb-4">
        <div v-for="(item, index) in constructionItems" :key="index" class="item-card mb-3">
          <div class="item-header d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">{{ item.constructionItemName }}</h5>
            <div v-if="props.mode === 'create'" class="btn-group">
              <button type="button" class="btn btn-outline-danger btn-sm" @click="removeItemRow(index)">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          <div class="row g-3">
            <div class="col-md-3">
              <FormField
                label="Ngày Bắt Đầu"
                type="date"
                v-model="item.startDate"
                required
                :disabled="true"
              />
            </div>
            <div class="col-md-3">
              <FormField
                label="Ngày Kết Thúc"
                type="date"
                v-model="item.expectedCompletionDate"
                required
                :disabled="true"
              />
            </div>
            <div class="col-md-3">
              <FormField
                label="Tổng Khối Lượng"
                type="number"
                v-model="item.totalVolume"
                required
                :disabled="true"
              />
            </div>
            <div class="col-md-3">
              <FormField
                label="Đơn Vị"
                type="select"
                v-model="item.unitOfMeasurementID"
                :options="unitMeasurements.map(unit => ({
                  value: unit.id,
                  label: unit.shortName || unit.name
                }))"
                required
                :disabled="true"
              />
            </div>
            <div class="col-md-12">
              <FormField
                label="Loại Công Tác"
                type="select"
                v-model="item.workSubTypeVariantID"
                :options="variants.map(variant => ({
                  value: variant.id,
                  label: variant.description
                }))"
                required
                :disabled="true"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="showItemForm && props.mode === 'create'" class="add-item-form">
        <div class="card">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Thêm Hạng Mục Mới</h5>
            <button type="button" class="btn-close" @click="handleCancelItem"></button>
          </div>
          <div class="card-body">
            <ConstructionItemForm
              mode="create"
              @submit="handleUpdateItem"
              @cancel="handleCancelItem"
            />
          </div>
        </div>
      </div>

      <div v-if="!showItemForm && constructionItems.length === 0 && props.mode === 'create'" class="empty-state text-center py-5">
        <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
        <p class="text-muted">Chưa có hạng mục nào được thêm</p>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2 mt-4">
      <ActionButton type="secondary" icon="fas fa-times" @click="$emit('close')">
        Hủy
      </ActionButton>
      <button type="button" class="btn btn-primary" @click="handleSubmit">
        <i class="fas fa-save me-2"></i>
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.construction-items {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
}

.section-header h4 {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.item-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.item-card:hover {
  border-color: #dee2e6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.item-header {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.item-header h5 {
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.empty-state {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  color: #6c757d;
}

.empty-state i {
  opacity: 0.5;
}

.add-item-form {
  margin-top: 1.5rem;
}

.add-item-form .card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.add-item-form .card-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.add-item-form .card-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn-close {
  padding: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn i {
  font-size: 0.875rem;
}

.gap-2 {
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.form-group div {
  font-weight: 500;
  color: #212529;
}

.btn-group {
  display: flex;
  gap: 0.25rem;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.alert-info {
  background-color: #e8f4f8;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert i {
  color: #17a2b8;
}
</style>
