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

// Regex patterns cho validation
const regexPatterns = {
  // Tên dự án: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu gạch ngang và gạch dưới, độ dài 1-200
  constructionName: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_-]{1,200}$/,
  // Địa điểm: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu phẩy, dấu gạch ngang, dấu gạch dưới, dấu chấm, độ dài 1-300
  location: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_,.-]{1,300}$/,
  // Ngày: định dạng YYYY-MM-DD
  date: /^\d{4}-\d{2}-\d{2}$/,
  // Loại dự án: 1, 2, 3, 4
  constructionTypeID: /^[1-4]$/,
  // Diện tích: số dương, có thể có số thập phân (2 chữ số)
  totalArea: /^[1-9]\d{0,9}(\.\d{1,2})?$|^0\.\d{1,2}$/
}

// Validation errors
const errors = ref({
  constructionName: '',
  constructionTypeID: '',
  location: '',
  totalArea: '',
  startDate: '',
  expectedCompletionDate: ''
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

// Validation functions
const validateConstructionName = () => {
  const value = formData.value.constructionName?.trim()
  if (!value) {
    errors.value.constructionName = 'Tên dự án không được để trống'
    return false
  }
  if (!regexPatterns.constructionName.test(value)) {
    errors.value.constructionName = 'Tên dự án chỉ được chứa chữ cái, số, khoảng trắng, dấu tiếng Việt và các ký tự đặc biệt (gạch ngang, gạch dưới) (tối đa 200 ký tự)'
    return false
  }
  errors.value.constructionName = ''
  return true
}

const validateConstructionTypeID = () => {
  const value = formData.value.constructionTypeID
  if (!value) {
    errors.value.constructionTypeID = 'Vui lòng chọn loại dự án'
    return false
  }
  errors.value.constructionTypeID = ''
  return true
}

const validateLocation = () => {
  const value = formData.value.location?.trim()
  if (!value) {
    errors.value.location = 'Địa điểm không được để trống'
    return false
  }
  if (!regexPatterns.location.test(value)) {
    errors.value.location = 'Địa điểm chỉ được chứa chữ cái, số, khoảng trắng, dấu tiếng Việt và các ký tự đặc biệt (phẩy, gạch ngang, gạch dưới, chấm) (tối đa 300 ký tự)'
    return false
  }
  errors.value.location = ''
  return true
}

const validateTotalArea = () => {
  const value = formData.value.totalArea
  if (!value && value !== 0) {
    errors.value.totalArea = 'Tổng diện tích không được để trống'
    return false
  }
  
  const areaNum = parseFloat(value)
  if (isNaN(areaNum)) {
    errors.value.totalArea = 'Tổng diện tích phải là số'
    return false
  }
  
  if (areaNum <= 0) {
    errors.value.totalArea = 'Tổng diện tích phải lớn hơn 0'
    return false
  }
  
  // Validate format: tối đa 10 chữ số, 2 chữ số thập phân
  const valueStr = String(value)
  if (!regexPatterns.totalArea.test(valueStr)) {
    errors.value.totalArea = 'Tổng diện tích không đúng định dạng'
    return false
  }
  
  // Giới hạn: 0.01 đến 999,999,999,999.99
  if (areaNum > 999999999999.99) {
    errors.value.totalArea = 'Tổng diện tích không được vượt quá 999,999,999,999.99 m²'
    return false
  }
  
  errors.value.totalArea = ''
  return true
}

const validateStartDate = () => {
  const value = formData.value.startDate
  if (!value) {
    errors.value.startDate = 'Ngày bắt đầu không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.startDate = 'Định dạng ngày bắt đầu không hợp lệ'
    return false
  }
  
  const startDate = new Date(value)
  if (isNaN(startDate.getTime()) || startDate.toISOString().split('T')[0] !== value) {
    errors.value.startDate = 'Ngày bắt đầu không hợp lệ'
    return false
  }
  
  // Ngày bắt đầu không được quá tương lai (cho phép tối đa 5 năm)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 5)
  if (startDate > maxDate) {
    errors.value.startDate = 'Ngày bắt đầu không được vượt quá 5 năm trong tương lai'
    return false
  }
  
  // Validate end date when start date changes
  if (formData.value.expectedCompletionDate) {
    const endDate = new Date(formData.value.expectedCompletionDate)
    if (!isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.value.startDate = 'Ngày bắt đầu phải trước ngày hoàn thành dự kiến'
      // Also update end date error
      validateExpectedCompletionDate()
    }
  }
  
  errors.value.startDate = ''
  return true
}

const validateExpectedCompletionDate = () => {
  const value = formData.value.expectedCompletionDate
  if (!value) {
    errors.value.expectedCompletionDate = 'Ngày hoàn thành dự kiến không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.expectedCompletionDate = 'Định dạng ngày hoàn thành dự kiến không hợp lệ'
    return false
  }
  
  const endDate = new Date(value)
  if (isNaN(endDate.getTime()) || endDate.toISOString().split('T')[0] !== value) {
    errors.value.expectedCompletionDate = 'Ngày hoàn thành dự kiến không hợp lệ'
    return false
  }
  
  // Validate end date is after start date
  if (formData.value.startDate) {
    const startDate = new Date(formData.value.startDate)
    if (!isNaN(startDate.getTime())) {
      if (startDate >= endDate) {
        errors.value.expectedCompletionDate = 'Ngày hoàn thành dự kiến phải sau ngày bắt đầu'
        return false
      }
      
      // Ngày hoàn thành không được quá xa trong tương lai (tối đa 50 năm sau ngày bắt đầu)
      const maxDate = new Date(startDate)
      maxDate.setFullYear(maxDate.getFullYear() + 50)
      if (endDate > maxDate) {
        errors.value.expectedCompletionDate = 'Ngày hoàn thành dự kiến không được vượt quá 50 năm sau ngày bắt đầu'
        return false
      }
      
      // Ngày hoàn thành không được quá tương lai (cho phép tối đa 55 năm)
      const absoluteMaxDate = new Date()
      absoluteMaxDate.setFullYear(absoluteMaxDate.getFullYear() + 55)
      if (endDate > absoluteMaxDate) {
        errors.value.expectedCompletionDate = 'Ngày hoàn thành dự kiến không được vượt quá 55 năm trong tương lai'
        return false
      }
    }
  }
  
  errors.value.expectedCompletionDate = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'constructionName':
      validateConstructionName()
      break
    case 'constructionTypeID':
      validateConstructionTypeID()
      break
    case 'location':
      validateLocation()
      break
    case 'totalArea':
      validateTotalArea()
      break
    case 'startDate':
      validateStartDate()
      // Re-validate end date when start date changes
      if (formData.value.expectedCompletionDate) {
        validateExpectedCompletionDate()
      }
      break
    case 'expectedCompletionDate':
      validateExpectedCompletionDate()
      // Re-validate start date when end date changes
      if (formData.value.startDate) {
        validateStartDate()
      }
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateConstructionName(),
    validateConstructionTypeID(),
    validateLocation(),
    validateTotalArea(),
    validateStartDate(),
    validateExpectedCompletionDate()
  ]
  
  const isValid = validations.every(v => v === true)
  
  if (!isValid) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
  }
  
  return isValid
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
        <label class="form-label">Tên Dự Án <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.constructionName }"
          v-model="formData.constructionName"
          @blur="validateField('constructionName')"
          @input="validateField('constructionName')"
          maxlength="200"
          placeholder="VD: Tòa nhà Landmark 81"
        />
        <div class="invalid-feedback">{{ errors.constructionName }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Loại Dự Án <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.constructionTypeID }"
          v-model="formData.constructionTypeID"
          @change="validateField('constructionTypeID'); handleConstructionTypeChange()"
        >
          <option value="">Chọn loại dự án</option>
          <option value="1">Cầu đường</option>
          <option value="2">Nhà ở</option>
          <option value="3">Công nghiệp</option>
          <option value="4">Thủy lợi</option>
        </select>
        <div class="invalid-feedback">{{ errors.constructionTypeID }}</div>
      </div>
      <div class="col-12">
        <label class="form-label">Địa Điểm Thi Công <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.location }"
          v-model="formData.location"
          @blur="validateField('location')"
          @input="validateField('location')"
          maxlength="300"
          placeholder="VD: 208 Nguyễn Hữu Cảnh, P.22, Q.Bình Thạnh, TP.HCM"
        />
        <div class="invalid-feedback">{{ errors.location }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Tổng Diện Tích (m²) <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.totalArea }"
          v-model.number="formData.totalArea"
          @blur="validateField('totalArea')"
          @input="validateField('totalArea')"
          step="0.01"
          min="0.01"
          max="999999999999.99"
          placeholder="VD: 241000"
        />
        <div class="invalid-feedback">{{ errors.totalArea }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Ngày Bắt Đầu <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.startDate }"
          v-model="formData.startDate"
          @blur="validateField('startDate')"
          @change="validateField('startDate')"
          :max="new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.startDate }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Ngày Hoàn Thành Dự Kiến <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.expectedCompletionDate }"
          v-model="formData.expectedCompletionDate"
          @blur="validateField('expectedCompletionDate')"
          @change="validateField('expectedCompletionDate')"
          :min="formData.startDate || undefined"
          :max="new Date(new Date().setFullYear(new Date().getFullYear() + 55)).toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.expectedCompletionDate }}</div>
      </div>
      <div class="col-12">
        <label class="form-label">Tài Liệu Thiết Kế</label>
        <input 
          type="file" 
          class="form-control" 
          accept="image/*" 
          @change="handleFileUpload"
        />
        <small class="text-muted">Chỉ chấp nhận file ảnh (jpg, png, gif, jpeg, webp)</small>
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

/* Form validation styles */
.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-control,
.form-select {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.95rem;
  height: 45px;
  width: 100%;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control.is-invalid {
  background-position: right calc(0.375em + 0.1875rem) center;
  padding-right: calc(1.5em + 0.75rem);
}
</style>
