<script setup>
import { ref, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useMaterialType } from '../../composables/useMaterialType'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
import { useUnitofMeasurement } from '../../composables/useUnitofMeasurement'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  material: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'update-success'])

const formData = ref({
  materialName: '',
  materialTypeID: '',
  unitOfMeasurementID: '',
  stockQuantity: 0,
  unitPrice: 0,
  specification: '',
  note: '',
  status: 'Available'
})

const formError = ref('')

// Regex patterns cho validation
const regexPatterns = {
  // Tên vật tư: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu gạch ngang và gạch dưới, độ dài 1-200
  materialName: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_-]{1,200}$/,
  // Chi tiết vật tư: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu câu, độ dài 10-5000
  specification: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_,.\-!?;:()\[\]{}\"']{10,5000}$/,
  // Ghi chú: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu câu, độ dài 1-1000
  note: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_,.\-!?;:()\[\]{}\"']{0,1000}$/,
  // Số lượng tồn kho: số nguyên không âm (0 đến 999,999,999,999)
  stockQuantity: /^(0|[1-9]\d{0,11})$/,
  // Đơn giá: số dương, có thể có số thập phân (2 chữ số)
  unitPrice: /^[1-9]\d{0,11}(\.\d{1,2})?$|^0\.\d{1,2}$/
}

// Validation errors
const errors = ref({
  materialName: '',
  materialTypeID: '',
  unitOfMeasurementID: '',
  stockQuantity: '',
  unitPrice: '',
  specification: '',
  note: ''
})

// Fetch material types and unit measurements
const { materialTypes, loadMaterialTypes } = useMaterialType()
const { unitMeasurements, loadUnitMeasurements } = useUnitofMeasurement()
const { showMessage } = useGlobalMessage()

const { updateMaterial, createMaterial, materials } = useMaterialManagement()

// Initialize form data based on the mode and props
const initFormData = () => {
  if (props.mode === 'update' && props.material) {
    Object.assign(formData.value, props.material)
  }
}

onMounted(() => {
  loadMaterialTypes() // Load material types when the component is mounted
  loadUnitMeasurements() // Load unit measurements when the component is mounted
    .then(() => {
      console.log('Unit Measurements:', unitMeasurements.value)
    })
    .catch((error) => {
      console.error('Error loading unit measurements:', error)
    })
  initFormData()
})

// Watch for changes in props.material to update formData
watch(() => props.material, (newMaterial) => {
  if (props.mode === 'update' && newMaterial) {
    Object.assign(formData.value, newMaterial)
    formData.value.materialTypeID = newMaterial.materialTypeID // Update default material type
    formData.value.unitOfMeasurementID = newMaterial.unitMeasurementID // Update default unit measurement
  }
}, { immediate: true })

// Validation functions
const validateMaterialName = () => {
  const value = formData.value.materialName?.trim()
  if (!value) {
    errors.value.materialName = 'Tên vật tư không được để trống'
    return false
  }
  if (!regexPatterns.materialName.test(value)) {
    errors.value.materialName = 'Tên vật tư chỉ được chứa chữ cái, số, khoảng trắng, dấu tiếng Việt và các ký tự đặc biệt (gạch ngang, gạch dưới) (tối đa 200 ký tự)'
    return false
  }
  errors.value.materialName = ''
  return true
}

const validateMaterialTypeID = () => {
  const value = formData.value.materialTypeID
  if (!value) {
    errors.value.materialTypeID = 'Vui lòng chọn loại vật tư'
    return false
  }
  errors.value.materialTypeID = ''
  return true
}

const validateUnitOfMeasurementID = () => {
  const value = formData.value.unitOfMeasurementID
  if (!value) {
    errors.value.unitOfMeasurementID = 'Vui lòng chọn đơn vị tính'
    return false
  }
  errors.value.unitOfMeasurementID = ''
  return true
}

const validateStockQuantity = () => {
  const value = formData.value.stockQuantity
  if (value === null || value === undefined || value === '') {
    errors.value.stockQuantity = 'Số lượng tồn kho không được để trống'
    return false
  }
  
  const quantityNum = Number(value)
  if (isNaN(quantityNum)) {
    errors.value.stockQuantity = 'Số lượng tồn kho phải là số'
    return false
  }
  
  if (quantityNum < 0) {
    errors.value.stockQuantity = 'Số lượng tồn kho không được âm'
    return false
  }
  
  // Giới hạn: 0 đến 999,999,999,999
  if (quantityNum > 999999999999) {
    errors.value.stockQuantity = 'Số lượng tồn kho không được vượt quá 999,999,999,999'
    return false
  }
  
  // Validate format: số nguyên không âm (0 đến 999,999,999,999)
  const valueStr = String(Math.floor(quantityNum))
  if (!regexPatterns.stockQuantity.test(valueStr)) {
    errors.value.stockQuantity = 'Số lượng tồn kho phải là số nguyên không âm'
    return false
  }
  
  errors.value.stockQuantity = ''
  return true
}

const validateUnitPrice = () => {
  const value = formData.value.unitPrice
  if (value === null || value === undefined || value === '') {
    errors.value.unitPrice = 'Đơn giá không được để trống'
    return false
  }
  
  const priceNum = parseFloat(value)
  if (isNaN(priceNum)) {
    errors.value.unitPrice = 'Đơn giá phải là số'
    return false
  }
  
  if (priceNum < 0) {
    errors.value.unitPrice = 'Đơn giá không được âm'
    return false
  }
  
  // Validate format: số dương, có thể có số thập phân (2 chữ số)
  const valueStr = String(value)
  if (!regexPatterns.unitPrice.test(valueStr)) {
    errors.value.unitPrice = 'Đơn giá không đúng định dạng'
    return false
  }
  
  // Giới hạn: 0 đến 999,999,999,999.99
  if (priceNum > 999999999999.99) {
    errors.value.unitPrice = 'Đơn giá không được vượt quá 999,999,999,999.99'
    return false
  }
  
  // Tối thiểu 0.01 nếu > 0
  if (priceNum > 0 && priceNum < 0.01) {
    errors.value.unitPrice = 'Đơn giá tối thiểu là 0.01'
    return false
  }
  
  errors.value.unitPrice = ''
  return true
}

const validateSpecification = () => {
  const value = formData.value.specification?.trim()
  if (!value) {
    errors.value.specification = 'Chi tiết vật tư không được để trống'
    return false
  }
  if (value.length < 10) {
    errors.value.specification = 'Chi tiết vật tư phải có ít nhất 10 ký tự'
    return false
  }
  if (value.length > 5000) {
    errors.value.specification = 'Chi tiết vật tư không được vượt quá 5000 ký tự'
    return false
  }
  if (!regexPatterns.specification.test(value)) {
    errors.value.specification = 'Chi tiết vật tư chứa ký tự không hợp lệ'
    return false
  }
  errors.value.specification = ''
  return true
}

const validateNote = () => {
  const value = formData.value.note?.trim()
  if (value && value.length > 1000) {
    errors.value.note = 'Ghi chú không được vượt quá 1000 ký tự'
    return false
  }
  if (value && !regexPatterns.note.test(value)) {
    errors.value.note = 'Ghi chú chứa ký tự không hợp lệ'
    return false
  }
  errors.value.note = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'materialName':
      validateMaterialName()
      break
    case 'materialTypeID':
      validateMaterialTypeID()
      break
    case 'unitOfMeasurementID':
      validateUnitOfMeasurementID()
      break
    case 'stockQuantity':
      validateStockQuantity()
      break
    case 'unitPrice':
      validateUnitPrice()
      break
    case 'specification':
      validateSpecification()
      break
    case 'note':
      validateNote()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateMaterialName(),
    validateMaterialTypeID(),
    validateUnitOfMeasurementID(),
    validateStockQuantity(),
    validateUnitPrice(),
    validateSpecification(),
    validateNote()
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
  formError.value = ''
  
  // Validate form trước khi submit
  if (!validateForm()) {
    return
  }
  
  try {

    const materialData = {
      id: 0,
      ...formData.value,
      stockQuantity: Number(formData.value.stockQuantity),
      unitPrice: Number(formData.value.unitPrice),
      materialTypeID: Number(formData.value.materialTypeID),
      unitOfMeasurementID: Number(formData.value.unitOfMeasurementID),
      status: 'Available'
    }

    console.log('Submitting material data:', materialData)

    if (props.mode === 'create') {
      await createMaterial(materialData)
      showMessage('Thêm vật tư thành công', 'success')
    } else {
      await updateMaterial(props.material.id, materialData)
      showMessage('Cập nhật vật tư thành công', 'success')
      emit('update-success')
    }

    emit('cancel')

  } catch (error) {
    console.error('Error submitting material:', error)
    formError.value = error.response?.data?.message
    showMessage(formError.value, 'error')
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="formError" class="alert alert-danger py-2 mb-3">
      {{ formError }}
    </div>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Tên Vật Tư <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.materialName }"
          v-model="formData.materialName"
          @blur="validateField('materialName')"
          @input="validateField('materialName')"
          maxlength="200"
          placeholder="Nhập tên vật tư"
        />
        <div class="invalid-feedback">{{ errors.materialName }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Loại Vật Tư <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.materialTypeID }"
          v-model="formData.materialTypeID"
          @change="validateField('materialTypeID')"
        >
          <option value="">Chọn loại vật tư</option>
          <option v-for="type in materialTypes" :key="type.id" :value="type.id">
            {{ type.materialTypeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.materialTypeID }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Đơn vị <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.unitOfMeasurementID }"
          v-model="formData.unitOfMeasurementID"
          @change="validateField('unitOfMeasurementID')"
        >
          <option value="">Chọn đơn vị</option>
          <option v-for="unit in unitMeasurements" :key="unit.id" :value="unit.id">
            {{ unit.unitName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.unitOfMeasurementID }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Số Lượng Tồn Kho <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.stockQuantity }"
          v-model.number="formData.stockQuantity"
          @blur="validateField('stockQuantity')"
          @input="validateField('stockQuantity')"
          min="0"
          max="999999999999"
          step="1"
          placeholder="Nhập số lượng tồn kho"
        />
        <div class="invalid-feedback">{{ errors.stockQuantity }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Đơn Giá <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.unitPrice }"
          v-model.number="formData.unitPrice"
          @blur="validateField('unitPrice')"
          @input="validateField('unitPrice')"
          min="0"
          max="999999999999.99"
          step="0.01"
          placeholder="Nhập đơn giá"
        />
        <div class="invalid-feedback">{{ errors.unitPrice }}</div>
      </div>
      <div class="col-md-12">
        <label class="form-label">Chi Tiết Vật Tư <span class="text-danger">*</span></label>
        <textarea 
          class="form-control" 
          :class="{ 'is-invalid': errors.specification }"
          v-model="formData.specification"
          @blur="validateField('specification')"
          @input="validateField('specification')"
          rows="4"
          maxlength="5000"
          placeholder="Nhập chi tiết vật tư (tối thiểu 10 ký tự)"
        ></textarea>
        <div class="invalid-feedback">{{ errors.specification }}</div>
        <small class="text-muted">{{ formData.specification?.length || 0 }}/5000 ký tự</small>
      </div>
      <div class="col-md-12">
        <label class="form-label">Ghi Chú</label>
        <textarea 
          class="form-control" 
          :class="{ 'is-invalid': errors.note }"
          v-model="formData.note"
          @blur="validateField('note')"
          @input="validateField('note')"
          rows="3"
          maxlength="1000"
          placeholder="Nhập ghi chú (tùy chọn)"
        ></textarea>
        <div class="invalid-feedback">{{ errors.note }}</div>
        <small class="text-muted">{{ formData.note?.length || 0 }}/1000 ký tự</small>
      </div>
    </div>
    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-secondary" @click="handleCancel">
        Hủy
      </button>
      <button type="submit" class="btn btn-primary">
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
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
  width: 100%;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select {
  height: 45px;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

textarea.form-control {
  min-height: 100px;
  resize: vertical;
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

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #6c757d;
  font-size: 0.875rem;
}
</style>
