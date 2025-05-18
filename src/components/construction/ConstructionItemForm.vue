<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  item: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const { showMessage } = useGlobalMessage()
const { createConstructionItem, updateConstructionItem } = useConstructionManagement()

const emit = defineEmits(['close'])

const formData = ref({
  constructionItemName: '',
  startDate: '',
  expectedCompletionDate: '',
  totalVolume: '',
  unitName: '',
})

const formError = ref('')

// Initialize form data if in update mode
const initFormData = () => {
  if (props.mode === 'update' && props.item) {
    formData.value = {
      constructionItemName: props.item.constructionItemName,
      startDate: new Date(props.item.startDate).toISOString().split('T')[0],
      expectedCompletionDate: new Date(props.item.expectedCompletionDate).toISOString().split('T')[0],
      totalVolume: props.item.totalVolume,
      unitName: props.item.unitName,
    }
  }
}

onMounted(() => {
  initFormData()
})

// Watch for changes in item prop
watch(() => props.item, (newItem) => {
  if (props.mode === 'update' && newItem) {
    initFormData()
  }
}, { immediate: true })

const handleSubmit = async () => {
  formError.value = ''
  try {
    // Validate form data
    if (!formData.value.constructionItemName || !formData.value.startDate ||
        !formData.value.expectedCompletionDate || !formData.value.totalVolume ||
        !formData.value.unitName) {
      formError.value = 'Vui lòng điền đầy đủ thông tin'
      return
    }

    const itemData = {
      constructionItemName: formData.value.constructionItemName,
      startDate: new Date(formData.value.startDate).toISOString(),
      expectedCompletionDate: new Date(formData.value.expectedCompletionDate).toISOString(),
      totalVolume: Number(formData.value.totalVolume),
      unitName: formData.value.unitName,
    }

    if (props.mode === 'update') {
      await updateConstructionItem(props.item.id, itemData)
      showMessage('Cập nhật hạng mục thành công', 'success')
    } else {
      await createConstructionItem(itemData)
      showMessage('Tạo hạng mục thành công', 'success')
    }

    emit('close')
  } catch (error) {
    console.error(`Error ${props.mode === 'update' ? 'updating' : 'creating'} construction item:`, error)
    showMessage(`Không thể ${props.mode === 'update' ? 'cập nhật' : 'tạo'} hạng mục`, 'error')
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="formError" class="alert alert-danger py-2 mb-3">
      {{ formError }}
    </div>
    <div class="row g-3">
      <!-- Tên hạng mục -->
      <div class="col-12">
        <FormField
          label="Tên Hạng Mục"
          type="text"
          v-model="formData.constructionItemName"
          required
        />
      </div>

      <!-- Ngày bắt đầu -->
      <div class="col-md-6">
        <FormField
          label="Ngày Bắt Đầu"
          type="date"
          v-model="formData.startDate"
          required
        />
      </div>

      <!-- Ngày kết thúc -->
      <div class="col-md-6">
        <FormField
          label="Ngày Kết Thúc Dự Kiến"
          type="date"
          v-model="formData.expectedCompletionDate"
          required
        />
      </div>

      <!-- Khối lượng -->
      <div class="col-md-6">
        <FormField
          label="Tổng Khối Lượng"
          type="number"
          v-model="formData.totalVolume"
          required
        />
      </div>

      <!-- Đơn vị -->
      <div class="col-md-6">
        <FormField
          label="Đơn Vị"
          type="text"
          v-model="formData.unitName"
          required
        />
      </div>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-secondary" @click="handleClose">
        Hủy
      </button>
      <button type="submit" class="btn btn-primary">
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </button>
    </div>
  </form>
</template>
