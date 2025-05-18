<script setup>
import { ref, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useMaterialType } from '../../composables/useMaterialType'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
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

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  materialName: '',
  materialTypeID: '',
  stockQuantity: 0,
  unitPrice: 0,
  specification: '',
  note: '',
  status: 'Available'
})

const formError = ref('')

// Fetch material types
const { materialTypes, loadMaterialTypes } = useMaterialType()
const { createMaterial, updateMaterial } = useMaterialManagement()
const { showMessage } = useGlobalMessage()

// Initialize form data based on the mode and props
const initFormData = () => {
  if (props.mode === 'update' && props.material) {
    Object.assign(formData.value, props.material)
  }
}

onMounted(() => {
  loadMaterialTypes() // Load material types when the component is mounted
  initFormData()
})

// Watch for changes in props.material to update formData
watch(() => props.material, (newMaterial) => {
  if (props.mode === 'update' && newMaterial) {
    Object.assign(formData.value, newMaterial)
    formData.value.materialTypeID = newMaterial.materialTypeID // Update default material type
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.materialName?.trim()) {
    formError.value = 'Vui lòng nhập tên vật tư'
    return false
  }
  if (!formData.value.materialTypeID) {
    formError.value = 'Vui lòng chọn loại vật tư'
    return false
  }
  if (formData.value.stockQuantity < 0) {
    formError.value = 'Số lượng tồn kho không được âm'
    return false
  }
  if (formData.value.unitPrice < 0) {
    formError.value = 'Đơn giá không được âm'
    return false
  }
  return true
}

const handleSubmit = async () => {
  formError.value = ''
  try {
    if (!validateForm()) {
      return
    }

    const materialData = {
      ...formData.value,
      stockQuantity: Number(formData.value.stockQuantity),
      unitPrice: Number(formData.value.unitPrice),
      materialTypeID: Number(formData.value.materialTypeID)
    }

    if (props.mode === 'create') {
      await createMaterial(materialData)
      showMessage('Thêm vật tư thành công', 'success')
    } else {
      await updateMaterial(props.material.id, materialData)
      showMessage('Cập nhật vật tư thành công', 'success')
    }

    emit('submit')
  } catch (error) {
    console.error('Error submitting material:', error)
    formError.value = error.response?.data?.message || 'Có lỗi xảy ra khi xử lý vật tư'
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
        <FormField
          label="Tên Vật Tư"
          type="text"
          v-model="formData.materialName"
          required
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Loại Vật Tư"
          type="select"
          v-model="formData.materialTypeID"
          :options="materialTypes.map(type => ({
            value: type.materialTypeID,
            label: type.materialTypeName
          }))"
          required
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Số Lượng Tồn Kho"
          type="number"
          v-model="formData.stockQuantity"
          required
        />
      </div>
      <div class="col-md-6">
        <FormField
          label="Đơn Giá"
          type="number"
          v-model="formData.unitPrice"
          required
        />
      </div>
      <div class="col-md-12">
        <FormField
          label="Chi Tiết Vật Tư"
          type="textarea"
          v-model="formData.specification"
          required
        />
      </div>
      <div class="col-md-12">
        <FormField
          label="Ghi Chú"
          type="textarea"
          v-model="formData.note"
        />
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
