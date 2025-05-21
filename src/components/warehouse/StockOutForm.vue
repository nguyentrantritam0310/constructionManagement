<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import FormField from '../common/FormField.vue'
import { useMaterialManagement } from '../../composables/useMaterialManagement'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  exportOrder: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  constructionID: '',
  exportDate: new Date().toISOString().split('T')[0],
  status: 'Pending',
  note: '',
  material_ExportOrders: []
})

const { materials } = useMaterialManagement()

// Add material options computed property
const materialOptions = computed(() => {
  return materials.value.map(material => ({
    value: material.id,
    label: `${material.materialName} (Tồn kho: ${material.stockQuantity})`,
    stockQuantity: material.stockQuantity
  }))
})

// Add selected material stock tracking
const selectedMaterialStocks = ref({})

// Watch for changes in exportOrder prop
watch(() => props.exportOrder, (newOrder) => {
  if (newOrder && Object.keys(newOrder).length > 0) {
    formData.value = { ...newOrder }
  }
}, { immediate: true })

// Watch for material selection changes
watch(() => formData.value.material_ExportOrders, (newOrders) => {
  newOrders.forEach((order, index) => {
    if (order.materialID) {
      const material = materials.value.find(m => m.id === Number(order.materialID))
      if (material) {
        selectedMaterialStocks.value[index] = material.stockQuantity
      }
    }
  })
}, { deep: true })

const validateForm = () => {
  if (!formData.value.constructionID || !formData.value.exportDate || formData.value.material_ExportOrders.length === 0) {
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }
  emit('submit', formData.value)
}

const addMaterial = () => {
  formData.value.material_ExportOrders.push({
    materialID: '',
    quantity: 0,
    note: ''
  })
}

const removeMaterial = (index) => {
  formData.value.material_ExportOrders.splice(index, 1)
}

// Validate quantity against stock
const validateQuantity = (index) => {
  const order = formData.value.material_ExportOrders[index]
  const stock = selectedMaterialStocks.value[index] || 0
  if (order.quantity > stock) {
    alert(`Số lượng xuất không được vượt quá tồn kho (${stock})`)
    order.quantity = stock
  }
}
</script>

<template>
  <div class="stock-out-form p-4">
    <div class="row g-4">
      <!-- Basic Information Section -->
      <div class="col-12">
        <div class="form-section">
          <h5 class="section-title mb-4">
            <i class="fas fa-info-circle me-2"></i>
            Thông Tin Cơ Bản
          </h5>
          <div class="row g-3">
            <div class="col-md-6">
              <FormField
                label="Công Trình"
                type="select"
                v-model="formData.constructionID"
                :options="[]"
                required
                class="form-field-custom"
              />
            </div>
            <div class="col-md-6">
              <FormField
                label="Ngày Xuất"
                type="date"
                v-model="formData.exportDate"
                required
                class="form-field-custom"
              />
            </div>
            <div class="col-12">
              <FormField
                label="Ghi Chú"
                type="textarea"
                v-model="formData.note"
                rows="3"
                placeholder="Nhập ghi chú về phiếu xuất kho (nếu có)..."
                class="form-field-custom"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Materials Section -->
      <div class="col-12">
        <div class="form-section">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="section-title mb-0">
              <i class="fas fa-boxes-stacked me-2"></i>
              Danh Sách Vật Tư Xuất
            </h5>
            <button type="button" class="btn btn-primary btn-sm" @click="addMaterial">
              <i class="fas fa-plus me-2"></i>
              Thêm Vật Tư
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="formData.material_ExportOrders.length === 0" class="empty-state">
            <div class="text-center py-5">
              <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
              <p class="text-muted mb-0">Chưa có vật tư nào được thêm</p>
            </div>
          </div>

          <!-- Materials List -->
          <div v-else class="materials-list">
            <div v-for="(material, index) in formData.material_ExportOrders"
                 :key="index"
                 class="material-item card mb-3 border-0 shadow-sm">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-5">
                    <FormField
                      label="Tên Vật Tư"
                      type="select"
                      v-model="formData.material_ExportOrders[index].materialID"
                      :options="materialOptions"
                      required
                      class="form-field-custom"
                    />
                    <small v-if="selectedMaterialStocks[index]" class="text-muted">
                      Tồn kho hiện tại: {{ selectedMaterialStocks[index] }}
                    </small>
                  </div>
                  <div class="col-md-3">
                    <FormField
                      label="Số Lượng"
                      type="number"
                      v-model="formData.material_ExportOrders[index].quantity"
                      required
                      min="1"
                      :max="selectedMaterialStocks[index]"
                      @input="validateQuantity(index)"
                      class="form-field-custom"
                    />
                  </div>
                  <div class="col-md-3">
                    <FormField
                      label="Ghi Chú"
                      type="text"
                      v-model="formData.material_ExportOrders[index].note"
                      placeholder="Ghi chú cho vật tư này..."
                      class="form-field-custom"
                    />
                  </div>
                  <div class="col-md-1 d-flex align-items-center justify-content-center">
                    <button
                      type="button"
                      class="btn btn-outline-danger btn-sm btn-icon"
                      @click="removeMaterial(index)"
                      title="Xóa vật tư này"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stock-out-form {
  background-color: #fff;
  border-radius: 1rem;
}

.form-section {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
}

.section-title {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-field-custom :deep(.form-label) {
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.form-field-custom :deep(.form-control),
.form-field-custom :deep(.form-select) {
  border-radius: 0.5rem;
  border-color: #e2e8f0;
  padding: 0.625rem 1rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-field-custom :deep(.form-control:focus),
.form-field-custom :deep(.form-select:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.material-item {
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.material-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
}

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  transform: scale(1.05);
}

.empty-state {
  border: 2px dashed #e2e8f0;
  border-radius: 0.75rem;
  background-color: #f8fafc;
}

.empty-state i {
  color: #94a3b8;
}

.btn-primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
}

.btn-outline-danger {
  color: #ef4444;
  border-color: #ef4444;
}

.btn-outline-danger:hover {
  background-color: #ef4444;
  border-color: #ef4444;
  color: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .stock-out-form {
    padding: 1rem;
  }

  .form-section {
    padding: 1rem;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
  }
}

.text-muted {
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

/* Add warning style for stock limit */
.form-field-custom :deep(input[type="number"]:invalid) {
  border-color: #dc3545;
  background-color: #fff8f8;
}

.form-field-custom :deep(input[type="number"]:invalid:focus) {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}
</style>
