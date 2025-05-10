<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useConstructionPlan } from '../../composables/useConstructionPlan'
import { useToast } from '../../composables/useToast'
import { useUser } from '../../composables/useUser'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  plan: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const {
  formData,
  createPlan,
  updatePlan,
} = useConstructionPlan()

const { constructions, fetchConstructions } = useConstructionManagement()

const {
  users,
  fetchUsers,
} = useUser()

const emit = defineEmits(['close'])

const { showSuccess, showError } = useToast()

// Khởi tạo formData với dữ liệu của plan nếu là chế độ update
const initFormData = () => {
  if (props.mode === 'update' && props.plan) {
    Object.assign(formData, {
      constructionID: props.plan.constructionID,
      constructionItemID: props.plan.constructionItemID,
      employeeID: props.plan.employeeID,
      startDate: new Date(props.plan.startDate).toISOString().split('T')[0],
      expectedCompletionDate: new Date(props.plan.expectedCompletionDate).toISOString().split('T')[0]
    })
  }
}

onMounted(() => {
  fetchConstructions()
  fetchUsers('manager')
  initFormData()
})

// Watch cho props.plan để cập nhật formData khi plan thay đổi
watch(() => props.plan, (newPlan) => {
  if (props.mode === 'update' && newPlan) {
    initFormData()
  }
}, { immediate: true })

const filteredConstructionItems = computed(() => {
  if (!constructions.value.length || !formData.constructionID) return []
  const selectedID = Number(formData.constructionID)
  const selectedconstruction = constructions.value.find(construction => construction.id === selectedID)
  return selectedconstruction?.constructionItems || []
})

watch(() => formData.constructionID, (newVal) => {
  if (newVal) {
    console.log('Đã chọn công trình ID:', newVal)
    const construction = constructions.value.find(p => p.id === Number(newVal))
    console.log('Hạng mục của công trình:', construction?.constructionItems)
  }
})

const handleSubmit = async () => {
  try {
    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.constructionID || !formData.constructionItemID || !formData.employeeID || !formData.startDate || !formData.expectedCompletionDate) {
      showError('Vui lòng điền đầy đủ thông tin')
      return
    }

    const planData = {
      constructionID: Number(formData.constructionID),
      constructionItemID: Number(formData.constructionItemID),
      employeeID: formData.employeeID,
      startDate: new Date(formData.startDate).toISOString(),
      expectedCompletionDate: new Date(formData.expectedCompletionDate).toISOString(),
      constructionStatusID: props.mode === 'update' ? props.plan.constructionStatusID : 1
    }

    // Log dữ liệu trước khi gửi
    console.log('📤 Dữ liệu gửi đi:', planData)

    if (props.mode === 'update') {
      planData.id = props.plan.id
      await updatePlan(props.plan.id, planData)
      showSuccess('Cập nhật kế hoạch thành công')
    } else {
      await createPlan(planData)
      showSuccess('Tạo kế hoạch thành công')
    }

    emit('close')
  } catch (error) {
    console.error(`Error ${props.mode === 'update' ? 'updating' : 'creating'} plan:`, error)
    if (error.response?.data) {
      showError(error.response.data.message || `Không thể ${props.mode === 'update' ? 'cập nhật' : 'tạo'} kế hoạch`)
    } else {
      showError(`Không thể ${props.mode === 'update' ? 'cập nhật' : 'tạo'} kế hoạch`)
    }
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="row g-3">
      <!-- Chọn công trình -->
      <div class="col-md-6">
        <FormField label="Tên Công Trình" type="select" v-model="formData.constructionID" :options="constructions.map(construction => ({
          value: construction.id,
          label: construction.constructionName
        }))" required />
      </div>

      <!-- Chọn hạng mục -->
      <div class="col-md-6">
        <FormField label="Hạng Mục" type="select" v-model="formData.constructionItemID" :options="filteredConstructionItems.map(item => ({
          value: item.id,
          label: item.constructionItemName
        }))" required />
      </div>

      <!-- Chỉ huy phụ trách -->
      <div class="col-12">
        <FormField label="Chỉ Huy Phụ Trách" type="select" v-model="formData.employeeID" :options="users.map(user => ({
          value: user.id,
          label: user.employeeName
        }))" required />
      </div>

      <!-- Ngày bắt đầu -->
      <div class="col-md-6">
        <FormField label="Ngày Bắt Đầu" type="date" v-model="formData.startDate" required />
      </div>

      <!-- Ngày kết thúc -->
      <div class="col-md-6">
        <FormField label="Ngày Kết Thúc Dự Kiến" type="date" v-model="formData.expectedCompletionDate" required />
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
