<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MaterialForm from '../../components/material/MaterialForm.vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
import UpdateButton from '../../components/common/UpdateButton.vue'

const {
  materials,
  fetchMaterials,
  createMaterial,
  updateMaterial
} = useMaterialManagement()

const showFormDialog = ref(false)
const selectedMaterial = ref(null)
const formMode = ref('create') // 'create' or 'update'

const currentPage = ref(1)
const itemsPerPage = 5

const searchQuery = ref('')
const materialTypeFilter = ref('')
const stockQuantityRange = ref({ min: '', max: '' })
const unitPriceRange = ref({ min: '', max: '' })

// Lấy danh sách loại vật tư duy nhất
const materialTypes = computed(() => {
  const types = new Set(materials.value.map(m => m.materialTypeName))
  return Array.from(types)
})

// Lọc dữ liệu
const filteredMaterials = computed(() => {
  let result = [...materials.value]

  // Tìm kiếm theo từ khóa (mã và tên vật tư)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(material =>
      material.id?.toString().toLowerCase().includes(query) ||
      material.materialName?.toLowerCase().includes(query)
    )
  }

  // Lọc theo loại vật tư
  if (materialTypeFilter.value) {
    result = result.filter(material =>
      material.materialTypeName === materialTypeFilter.value
    )
  }

  // Lọc theo khoảng tồn kho
  if (stockQuantityRange.value.min !== '') {
    result = result.filter(material =>
      Number(material.stockQuantity) >= Number(stockQuantityRange.value.min)
    )
  }
  if (stockQuantityRange.value.max !== '') {
    result = result.filter(material =>
      Number(material.stockQuantity) <= Number(stockQuantityRange.value.max)
    )
  }

  // Lọc theo khoảng đơn giá
  if (unitPriceRange.value.min !== '') {
    result = result.filter(material =>
      Number(material.unitPrice) >= Number(unitPriceRange.value.min)
    )
  }
  if (unitPriceRange.value.max !== '') {
    result = result.filter(material =>
      Number(material.unitPrice) <= Number(unitPriceRange.value.max)
    )
  }

  return result
})

// Phân trang
const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMaterials.value.slice(start, end)
})

// Reset về trang 1 khi thay đổi bộ lọc
watch([searchQuery, materialTypeFilter, stockQuantityRange, unitPriceRange], () => {
  currentPage.value = 1
})

const resetFilters = () => {
  searchQuery.value = ''
  materialTypeFilter.value = ''
  stockQuantityRange.value = { min: '', max: '' }
  unitPriceRange.value = { min: '', max: '' }
  currentPage.value = 1
}

onMounted(async () => {
  await fetchMaterials()
})

const openForm = (mode, material = null) => {
  formMode.value = mode
  selectedMaterial.value = material ? { ...material } : null
  showFormDialog.value = true
}

const closeForm = () => {
  showFormDialog.value = false
  selectedMaterial.value = null
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleUpdateSuccess = async () => {
  await fetchMaterials() // Refresh the data after successful update
}

// Thêm computed properties cho min-max values
const stockQuantityBounds = computed(() => {
  const quantities = materials.value.map(m => Number(m.stockQuantity))
  return {
    min: Math.min(...quantities),
    max: Math.max(...quantities)
  }
})

const unitPriceBounds = computed(() => {
  const prices = materials.value.map(m => Number(m.unitPrice))
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Vật Tư</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Thêm Vật Tư Mới" @click="openForm('create')">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Filter Section -->
    <div class="filter-section mb-4">
      <div class="row g-3">
        <!-- Tìm kiếm -->
        <div class="col-lg-4 col-md-6">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-search"></i>
            </span>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Tìm kiếm theo mã, tên vật tư..."
            >
          </div>
        </div>

        <!-- Loại vật tư -->
        <div class="col-lg-3 col-md-6">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-tags"></i>
            </span>
            <select class="form-control" v-model="materialTypeFilter">
              <option value="">Tất cả loại vật tư</option>
              <option v-for="type in materialTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
        </div>

                <!-- Nút đặt lại -->
        <div class="col-lg-2 col-md-12">
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fas fa-undo me-2"></i>Đặt lại
          </button>
        </div>

        <!-- Khoảng tồn kho -->
        <div class="col-lg-6 col-md-12">
          <div class="filter-range-container">
            <label class="form-label mb-2">
              <i class="fas fa-box me-1"></i>
              Tồn kho
            </label>
            <div class="range-with-inputs">
              <div class="range-inputs">
                <input
                  type="number"
                  class="form-control form-control-sm"
                  v-model.number="stockQuantityRange.min"
                  :min="stockQuantityBounds.min"
                  :max="stockQuantityBounds.max"
                  placeholder="Từ"
                >
                <span class="range-separator">-</span>
                <input
                  type="number"
                  class="form-control form-control-sm"
                  v-model.number="stockQuantityRange.max"
                  :min="stockQuantityBounds.min"
                  :max="stockQuantityBounds.max"
                  placeholder="Đến"
                >
              </div>
              <div class="range-slider-container">
                <input
                  type="range"
                  class="form-range"
                  v-model.number="stockQuantityRange.min"
                  :min="stockQuantityBounds.min"
                  :max="stockQuantityBounds.max"
                  step="1"
                >
                <input
                  type="range"
                  class="form-range"
                  v-model.number="stockQuantityRange.max"
                  :min="stockQuantityBounds.min"
                  :max="stockQuantityBounds.max"
                  step="1"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Khoảng đơn giá -->
        <div class="col-lg-6 col-md-12">
          <div class="filter-range-container">
            <label class="form-label mb-2">
              <i class="fas fa-dollar-sign me-1"></i>
              Đơn giá
            </label>
            <div class="range-with-inputs">
              <div class="range-inputs">
                <input
                  type="number"
                  class="form-control form-control-sm"
                  v-model.number="unitPriceRange.min"
                  :min="unitPriceBounds.min"
                  :max="unitPriceBounds.max"
                  step="1000"
                  placeholder="Từ"
                >
                <span class="range-separator">-</span>
                <input
                  type="number"
                  class="form-control form-control-sm"
                  v-model.number="unitPriceRange.max"
                  :min="unitPriceBounds.min"
                  :max="unitPriceBounds.max"
                  step="1000"
                  placeholder="Đến"
                >
              </div>
              <div class="range-slider-container">
                <input
                  type="range"
                  class="form-range"
                  v-model.number="unitPriceRange.min"
                  :min="unitPriceBounds.min"
                  :max="unitPriceBounds.max"
                  step="1000"
                >
                <input
                  type="range"
                  class="form-range"
                  v-model.number="unitPriceRange.max"
                  :min="unitPriceBounds.min"
                  :max="unitPriceBounds.max"
                  step="1000"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Danh sách vật tư -->
    <DataTable :columns="[
      { key: 'id', label: 'Mã Vật Tư' },
      { key: 'materialName', label: 'Tên Vật Tư' },
      { key: 'materialTypeName', label: 'Tên Loại Vật Tư' },
      { key: 'stockQuantity', label: 'Tồn Kho' },
      { key: 'unitPrice', label: 'Đơn Giá' },
      { key: 'unitOfMeasurement', label: 'Đơn Vị Tính' }
    ]" :data="paginatedMaterials">
      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="openForm('update', item)" />
        </div>
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedMaterials.length }} trên {{ filteredMaterials.length }} vật tư
      </div>
      <Pagination
        :total-items="filteredMaterials.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <!-- Modal for Add/Edit Form -->
    <ModalDialog size="lg" v-model:show="showFormDialog" :title="formMode === 'create' ? 'Thêm Vật Tư' : 'Cập Nhật Vật Tư'">
      <MaterialForm
        :mode="formMode"
        :material="selectedMaterial"
        @cancel="closeForm"
        @update-success="handleUpdateSuccess"
      />
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

.gap-2 {
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
  color: #007bff;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.input-group-text {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem 0 0 0.5rem;
  padding: 0.5rem 1rem;
  color: #6c757d;
}

.input-group .form-control {
  border-radius: 0 0.5rem 0.5rem 0;
}

.btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #495057;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .d-flex.gap-2 {
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group + .input-group {
    margin-left: 0;
  }
}

.filter-range-container {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.form-label {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  display: block;
}

.range-with-inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
}

.range-inputs input {
  width: calc(50% - 8px);
  height: 32px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
}

.range-separator {
  color: #6c757d;
  font-weight: 500;
  padding: 0 0.25rem;
  margin-top: -2px;
}

.range-slider-container {
  position: relative;
  height: 32px;
  flex: 1;
}

.form-range {
  position: absolute;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  background: none;
  -webkit-appearance: none;
}

.form-range::-webkit-slider-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  pointer-events: auto;
  -webkit-appearance: none;
}

.form-range::-webkit-slider-runnable-track {
  height: 4px;
  background: #dee2e6;
  border-radius: 2px;
}

.form-range:nth-child(1) {
  z-index: 2;
}

.form-range:nth-child(2) {
  z-index: 1;
}

.form-range:focus {
  outline: none;
}

.form-range:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}
</style>
