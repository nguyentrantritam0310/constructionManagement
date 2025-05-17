<script setup>
import { ref, watch, computed } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import FormField from '../common/FormField.vue'
import DataTable from '../common/DataTable.vue'
import Pagination from '../common/Pagination.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const props = defineProps({
  show: Boolean,
  mode: {
    type: String,
    default: 'create'
  },
  task: {
    type: Object,
    default: null
  },
  existingTasks: {
    type: Array,
    default: () => []
  },
  totalWorkload: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:show', 'submit'])
const { showMessage } = useGlobalMessage()

const formData = ref({
  plannedVolume: ''
})
const errors = ref({})

watch(
  () => props.show,
  (val) => {
    if (val && props.mode === 'edit' && props.task) {
      formData.value = {
        plannedVolume: props.task.plannedVolume ?? props.task.workload ?? ''
      }
    } else if (val && props.mode === 'create') {
      formData.value = {
        plannedVolume: ''
      }
    }
    errors.value = {}
  },
  { immediate: true }
)

const validateForm = () => {
  errors.value = {}
  let isValid = true
  const plannedVolume = parseFloat(formData.value.plannedVolume)
  if (isNaN(plannedVolume) || plannedVolume <= 0) {
    errors.value.plannedVolume = 'Vui lòng nhập khối lượng hoạch định hợp lệ'
    isValid = false
  } else if (plannedVolume > 1000000) {
    errors.value.plannedVolume = 'Khối lượng hoạch định không được vượt quá 1,000,000'
    isValid = false
  }
  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) return
  try {
    emit('submit', {
      ...formData.value,
      ...(props.mode === 'edit' && props.task ? { id: props.task.id } : {}),
      workload: parseFloat(formData.value.plannedVolume)
    })
    if (props.mode === 'create') {
      formData.value = { plannedVolume: '' }
      errors.value = {}
    }
  } catch (err) {
    showMessage('Có lỗi xảy ra khi tạo nhiệm vụ mới', 'error')
  }
}

const handleCancel = () => {
  formData.value = { plannedVolume: '' }
  errors.value = {}
  emit('update:show', false)
}

const dialogTitle = computed(() =>
  props.mode === 'edit' ? 'Chỉnh Sửa Nhiệm Vụ' : 'Thêm Nhiệm Vụ Mới'
)
const submitLabel = computed(() =>
  props.mode === 'edit' ? 'Cập nhật' : 'Thêm'
)

const totalPlannedVolume = computed(() =>
  props.existingTasks.reduce((sum, t) => sum + (parseFloat(t.plannedVolume || t.workload) || 0), 0)
)
const remainingVolume = computed(() => {
  const planned = parseFloat(formData.value.plannedVolume) || 0
  if (props.mode === 'edit' && props.task) {
    // Khi sửa: cộng lại khối lượng cũ, trừ đi khối lượng mới
    const oldPlanned = parseFloat(props.task.plannedVolume ?? props.task.workload) || 0
    return props.totalWorkload - totalPlannedVolume.value + oldPlanned - planned
  } else {
    // Khi thêm mới
    return props.totalWorkload - totalPlannedVolume.value - planned
  }
})
const groupedTasks = computed(() => {
  const groups = {}
  props.existingTasks.forEach(t => {
    const key = t.planName || t.planId || 'Chưa rõ kế hoạch'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return groups
})
const flattenedTasks = computed(() => {
  const arr = []
  Object.entries(groupedTasks.value).forEach(([plan, tasks]) => {
    tasks.forEach(t => {
      arr.push({
        plan,
        id: t.id,
        plannedVolume: t.workload,
        constructionPlanID: t.constructionPlanID
      })
    })
  })
  return arr
})

const itemsPerPage = 3
const currentPage = ref(1)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return flattenedTasks.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

watch(flattenedTasks, () => {
  currentPage.value = 1
})
</script>

<template>
  <ModalDialog :show="props.show" @update:show="val => emit('update:show', val)" :title="dialogTitle" size="lg">
    <div class="fw-bold mb-2 text-primary">
      Thông tin tổng quan
    </div>
    <div class="mb-3">
      <div class="info-summary shadow-sm rounded-3 p-3 mb-3">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <span class="text-muted small">Tổng KL hạng mục:</span>
            <br>
            <span class="fw-bold text-dark ms-1">{{ props.totalWorkload }} {{ props.unit }}</span>
          </div>
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <span class="text-muted small">Tổng KL hoạch định:</span>
            <br>
            <span class="fw-bold text-dark ms-1">{{ totalPlannedVolume }} {{ props.unit }}</span>
          </div>
          <div class="col-12 col-md-4">
            <span class="text-muted small">Khối lượng còn lại:</span>
            <br>
            <span :class="[
              'fw-bold ms-1 remaining-highlight',
              remainingVolume < 0 ? 'text-danger' : 'text-success'
            ]">
              {{ remainingVolume }} {{ props.unit }}
            </span>
          </div>
        </div>
      </div>
      <!-- Danh sách nhiệm vụ đã tạo theo từng kế hoạch: DataTable -->
      <div v-if="Object.keys(groupedTasks).length" class="mb-2">
        <div class="fw-bold mb-2 text-primary">
          Danh sách nhiệm vụ đã tạo
        </div>
        <DataTable :columns="[
          { key: 'constructionPlanID', label: 'Mã kế hoạch' },
          { key: 'id', label: 'Mã nhiệm vụ' },
          { key: 'plannedVolume', label: 'Khối lượng hoạch định' }
        ]" :data="paginatedTasks">
          <template #constructionPlanID="{ item }">
            <span>{{ item.constructionPlanID }}</span>
          </template>
          <template #id="{ item }">
            <span>{{ item.id }}</span>
          </template>
          <template #plannedVolume="{ item }">
            <span>{{ item.plannedVolume }} {{ props.unit }}</span>
          </template>
        </DataTable>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="text-muted small">
            Hiển thị {{ paginatedTasks.length }} trên {{ flattenedTasks.length }} nhiệm vụ
          </div>
          <Pagination :total-items="flattenedTasks.length" :items-per-page="itemsPerPage" :current-page="currentPage"
            @update:currentPage="handlePageChange" />
        </div>
      </div>
    </div>
    <!-- Form nhập -->
    <form @submit.prevent="handleSubmit">
      <div class="row g-3">
        <div class="col-md-6">
          <FormField label="Khối lượng hoạch định" type="number" v-model="formData.plannedVolume"
            :error="errors.plannedVolume" required min="0" max="1000000" step="0.01"
            :disabled="props.mode === 'create' && remainingVolume <= 0" />
        </div>
        <div class="col-md-6">
          <FormField label="Đơn vị" v-model="props.unit" disabled />
        </div>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-4">
        <button type="button" class="btn btn-outline-secondary" @click="handleCancel">
          Hủy
        </button>
        <button type="submit" class="btn btn-primary" :disabled="props.mode === 'create' && remainingVolume <= 0">
          {{ submitLabel }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<style scoped>
.info-summary {
  background: #f8fbff;
  border: 1px solid #e3eaf3;
}

.table th,
.table td {
  vertical-align: middle !important;
}

.fw-bold {
  font-weight: 600;
}
</style>
