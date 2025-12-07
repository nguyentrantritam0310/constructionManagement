<script setup>
import { ref, watch, computed } from 'vue'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'
import DataTable from '../common/DataTable.vue'
import { useWarehouseEntry } from '../../composables/useWarehouseEntry'
import { useAuth } from '../../composables/useAuth'
import StatusBadge from '../common/StatusBadge.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { importOrderService } from '@/services/importOrderService'

const { showMessage } = useGlobalMessage()

const { confirmWarehouseEntry, fetchByDirector } = useWarehouseEntry()
const { currentUser } = useAuth()
const employeeID = computed(() => currentUser.value?.id)

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  order: {
    type: Object,
    default: () => ({})
  },
  materialPlans: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  },
  approvalMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel', 'approve', 'reject'])

const formData = ref({
  importOrderID: '',
  materials: []
})

const columns = [
  { key: 'materialID', label: 'Mã vật tư' },
  { key: 'materialName', label: 'Tên vật tư' },
  { key: 'importQuantity', label: 'Số lượng dự kiến' },
  { key: 'actualQuantity', label: 'Số lượng thực tế' },
  { key: 'unitOfMeasurement', label: 'Đơn vị' },
  { key: 'price', label: 'Giá' },
  { key: 'totalAmount', label: 'Thành tiền' },
  { key: 'note', label: 'Ghi chú' }
]

const isCompleted = computed(() => props.order?.status === 'Completed')

// Watch for changes in order prop
watch(() => props.order, (newOrder) => {
  if (newOrder && Object.keys(newOrder).length > 0) {
    formData.value.importOrderID = newOrder.id
  }
}, { immediate: true })

// Watch for changes in materialPlans prop
watch(() => props.materialPlans, (newPlans) => {
  if (newPlans && newPlans.length > 0) {
    formData.value.materials = newPlans.map(plan => ({
      ...plan,
      actualQuantity: plan.importQuantity,
      note: plan.note || '',
    }))
  }
}, { immediate: true })

// Group materials by construction item
const groupedMaterials = computed(() => {
  const groups = {}
  formData.value.materials.forEach(material => {
    if (!groups[material.constructionItemID]) {
      groups[material.constructionItemID] = []
    }
    groups[material.constructionItemID].push(material)
  })
  return groups
})

// Calculate totals for each material
const materialTotals = computed(() => {
  const totals = {}
  formData.value.materials.forEach(material => {
    const key = `${material.materialID}-${material.materialName}`
    if (!totals[key]) {
      totals[key] = {
        materialID: material.materialID,
        materialName: material.materialName,
        totalImportQuantity: 0,
        totalActualQuantity: 0,
        unitOfMeasurement: material.unitOfMeasurement,
        price: parseFloat(material.price || material.unitPrice || 0) || 0,
        totalAmount: 0,
        status: material.status
      }
    }
    totals[key].totalImportQuantity += parseInt(material.importQuantity || 0)
    totals[key].totalActualQuantity += parseInt(material.actualQuantity || 0)
    const price = parseFloat(material.price || material.unitPrice || 0) || 0
    totals[key].totalAmount += (parseInt(material.actualQuantity || 0) * price)
  })
  return Object.values(totals)
})

const grandTotal = computed(() => {
  return materialTotals.value.reduce((sum, item) => sum + item.totalAmount, 0)
})

const formatCurrency = (value) => {
  // Parse value to number, handle string, null, undefined
  let numValue = 0
  if (value !== null && value !== undefined) {
    if (typeof value === 'string') {
      numValue = parseFloat(value) || 0
    } else if (typeof value === 'number') {
      numValue = value
    } else {
      numValue = 0
    }
  }
  
  // Check if valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return '0 ₫'
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numValue)
}

const validateForm = () => {
  if (!formData.value.importOrderID || formData.value.materials.length === 0) {
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }
  try {
    await confirmWarehouseEntry(
      formData.value.importOrderID,
      formData.value.materials,
      employeeID.value // truyền employeeID vào đây
    )
    emit('submit', formData.value)
  } catch (err) {
    alert('Có lỗi khi xác nhận nhập kho: ' + err.message)
  }
}

const handleReportIssue = (material) => {
  material.status = 'Issue'
  material.note = 'Có vấn đề với vật tư này'
}

const handleQuantityChange = (material, value) => {
  material.actualQuantity = parseInt(value) || 0
}

const handleApprove = async (item) => {
  try {
    await importOrderService.updateStatus(item.id, 1)
    // Cập nhật lại danh sách hoặc reload
    fetchByDirector()

    // Hiển thị thông báo thành công
    showMessage('Đã duyệt kế hoạch!', 'success')

  } catch (err) {
    console.error('Error fetching material plans:', err)
    // Hiển thị thông báo lỗi
    showMessage('Lỗi khi duyệt!', 'error')
  }
}
const handleReject = async (item) => {
  try {
    await importOrderService.updateStatus(item.id, 2)
    fetchByDirector()
    showMessage('Đã từ chối kế hoạch!', 'success')
  } catch (err) {
    console.error('Error fetching material plans:', err)
    showMessage('Lỗi khi từ chối!', 'error')
  }
}
</script>

<template>
  <div class="p-3">
    <div class="alert alert-info mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="alert-heading">Đơn hàng #{{ order.id }}</h5>
          <p class="mb-0">Người lập: {{ order.plannerName || 'Chưa có thông tin' }}</p>
          <p class="mb-0">Ngày đặt: {{ new Date(order.importDate).toLocaleDateString('vi-VN') }}</p>
        </div>
        <div>
          <StatusBadge :status="order.status" />
        </div>
      </div>
    </div>

    <!-- Tổng hợp vật tư -->
    <div class="card mb-4">
      <div class="card-header bg-light">
        <h5 class="mb-0">Tổng hợp vật tư</h5>
      </div>
      <div class="card-body p-0">
        <DataTable :columns="[
          { key: 'materialID', label: 'Mã vật tư' },
          { key: 'materialName', label: 'Tên vật tư' },
          { key: 'totalImportQuantity', label: 'Tổng số lượng dự kiến' },
          ...(props.readonly ? [] : [
            { key: 'totalActualQuantity', label: 'Tổng số lượng thực tế' }
          ]),
          { key: 'unitOfMeasurement', label: 'Đơn vị' },
          { key: 'price', label: 'Giá' },
          { key: 'totalAmount', label: 'Thành tiền' }
        ]" :data="materialTotals">
        <template #materialID="{ item }">
            <span class="text-primary"><b>VT-{{ item.materialID }}</b></span>
          </template>
          <template #materialName="{ item }">
            <span><b>{{ item.materialName }}</b></span>
          </template>
          <template #price="{ item }">
            {{ formatCurrency(item.price || item.unitPrice || 0) }}
          </template>
          <template #totalAmount="{ item }">
            {{ formatCurrency(item.totalAmount || 0) }}
          </template>
          <template #status="{ item }">
            <span :class="{
              'badge bg-success': item.status === 'Pending',
              'badge bg-danger': item.status === 'Issue'
            }">
              {{ item.status }}
            </span>
          </template>
        </DataTable>
      </div>
    </div>

    <div class="alert alert-success mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Tổng thành tiền:</h5>
        <h4 class="mb-0">{{ formatCurrency(grandTotal) }}</h4>
      </div>
    </div>

    <!-- Chi tiết theo hạng mục -->
    <div v-for="(materials, constructionItemID) in groupedMaterials" :key="constructionItemID" class="mb-4">
      <div class="card">
        <div class="card-header bg-light">
          <h5 class="mb-0">Hạng mục #{{ constructionItemID }}</h5>
        </div>
        <div class="card-body p-0">
          <DataTable :columns="columns.filter(col =>
            props.readonly ? !['actualQuantity', 'note'].includes(col.key) : true
          )" :data="materials">
            <template #materialID="{ item }">
              <span class="text-primary"><b>VT-{{ item.materialID }}</b></span>
            </template>
            <template #materialName="{ item }">
            <span><b>{{ item.materialName }}</b></span>
          </template>
            <template v-if="!props.readonly" #actualQuantity="{ item }">
              <FormField type="number" label="" :modelValue="item.actualQuantity"
                @update:modelValue="val => handleQuantityChange(item, val)"
                :disabled="item.status === 'Completed' || isCompleted" />
            </template>

            <template v-if="!props.readonly" #note="{ item }">
              <FormField type="text" label="" :modelValue="item.note" @update:modelValue="val => item.note = val"
                placeholder="Ghi chú (nếu có)" :disabled="item.status === 'Completed' || isCompleted" />
            </template>

            <template #price="{ item }">
              {{ formatCurrency(item.price || item.unitPrice || 0) }}
            </template>
            <template #totalAmount="{ item }">
              {{ formatCurrency((parseInt(item.actualQuantity || 0) || 0) * (parseFloat(item.price || item.unitPrice || 0) || 0)) }}
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <ActionButton type="secondary" @click="$emit('cancel')">
        Hủy
      </ActionButton>
      <template v-if="props.approvalMode">
        <ActionButton :disabled="order.status !== 'Pending'" type=" danger" @click="handleReject(order)">
          Từ chối
        </ActionButton>
        <ActionButton :disabled="order.status !== 'Pending'" type="primary" @click="handleApprove(order)">
          Duyệt
        </ActionButton>
      </template>
      <template v-else>
        <ActionButton type="primary" @click="handleSubmit" :disabled="isCompleted">
          Xác nhận nhập kho
        </ActionButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.badge {
  font-size: 0.875rem;
  padding: 0.5em 0.75em;
}

.form-control-sm {
  width: 100px;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.card-header h5 {
  color: #495057;
  font-size: 1.1rem;
}

.alert-info {
  background-color: #cff4fc;
  border-color: #b6effb;
  color: #055160;
}

.alert-info h5 {
  color: #055160;
}
</style>
