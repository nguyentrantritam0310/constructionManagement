<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMaterialPlanning } from '../../composables/useMaterialPlanning'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useToast } from '../../composables/useToast'
import Pagination from '../../components/common/Pagination.vue'

const { showSuccess, showError } = useToast()
const selectedConstruction = ref(null)
const showConfirmDialog = ref(false)
const materials = ref([])
const materialPlan = ref([])
const loading = ref(false)

const {
  constructions,
  fetchConstructions
} = useConstructionManagement()

const {
  materials: constructionMaterials,
  loading: constructionLoading,
  error: constructionError,
  fetchMaterials,
  updateMaterialQuantity,
  saveMaterialPlan
} = useMaterialPlanning()

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedConstructions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return constructions.value.slice(start, end)
})

const currentMaterialPage = ref(1)
const materialItemsPerPage = 5

const paginatedMaterials = computed(() => {
  const start = (currentMaterialPage.value - 1) * materialItemsPerPage
  const end = start + materialItemsPerPage
  return materials.value.slice(start, end)
})

onMounted(async () => {
  await fetchConstructions()
})

const constructionColumns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày hoàn thành dự kiến' },
  { key: 'statusName', label: 'Trạng thái' }
]

const materialColumns = [
  { key: 'materialCode', label: 'Mã vật tư' },
  { key: 'materialName', label: 'Tên vật tư' },
  { key: 'unit', label: 'Đơn vị' },
  { key: 'quantity', label: 'Số lượng' },
  { key: 'price', label: 'Đơn giá' },
  { key: 'total', label: 'Thành tiền' }
]

const handleConstructionSelect = async (construction) => {
  selectedConstruction.value = construction
  try {
    await fetchMaterials(construction.id)
  } catch (error) {
    showError('Không thể tải danh sách vật tư')
  }
}

const handleQuantityChange = async (material, event) => {
  const newQuantity = parseInt(event.target.value)
  if (isNaN(newQuantity) || newQuantity < 0) {
    alert('Vui lòng nhập số lượng hợp lệ')
    event.target.value = material.requiredQuantity
    return
  }
  try {
    await updateMaterialQuantity(material.id, newQuantity)
  } catch (err) {
    console.error('Error updating quantity:', err)
    alert('Có lỗi xảy ra khi cập nhật số lượng')
  }
}

const handleSavePlan = async () => {
  if (!selectedConstruction.value) {
    showError('Vui lòng chọn công trình')
    return
  }

  try {
    loading.value = true
    await saveMaterialPlan(selectedConstruction.value.id, {
      materials: materialPlan.value
    })
    showSuccess('Lưu kế hoạch vật tư thành công')
  } catch (error) {
    showError('Không thể lưu kế hoạch vật tư')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  showConfirmDialog.value = true
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleMaterialPageChange = (page) => {
  currentMaterialPage.value = page
}
</script>

<template>
  <div class="material-planning">
    <div class="card mb-4">
      <div class="card-header">
        <h4 class="mb-0">Chọn công trình</h4>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="constructionError" class="alert alert-danger" role="alert">
          {{ constructionError }}
        </div>

        <DataTable v-else :columns="constructionColumns" :data="paginatedConstructions" @row-click="handleConstructionSelect" class="id">
          <template #id="{ item }">
            <span class="fw-medium text-primary">{{ item.id }}</span>
          </template>

          <template #constructionName="{ item }">
            <div>
              <div class="fw-medium">{{ item.constructionName }}</div>
            </div>
          </template>

          <template #location="{ item }">
            <div class="d-flex align-items-center">
              <i class="fas fa-map-marker-alt text-muted me-1"></i>
              {{ item.location }}
            </div>
          </template>

          <template #startDate="{ item }">
            <div class="date-info">
              <i class="fas fa-calendar text-muted"></i>
              {{ formatDate(item.startDate) }}
            </div>
          </template>

          <template #expectedCompletionDate="{ item }">
            <div class="date-info">
              <i class="fas fa-calendar-check text-muted"></i>
              {{ formatDate(item.expectedCompletionDate) }}
            </div>
          </template>

          <template #statusName="{ item }">
            <StatusBadge :status="item.statusName" />
          </template>
        </DataTable>

        <!-- Phân trang công trình -->
        <div class="d-flex justify-content-between align-items-center mt-4">
          <div class="text-muted">
            Hiển thị {{ paginatedConstructions.length }} trên {{ constructions.length }} công trình
          </div>
          <Pagination
            :total-items="constructions.length"
            :items-per-page="itemsPerPage"
            :current-page="currentPage"
            @update:currentPage="handlePageChange"
          />
        </div>
      </div>
    </div>

    <div v-if="selectedConstruction" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4 class="mb-0">Danh sách vật tư - {{ selectedConstruction.constructionName }}</h4>
        <div class="d-flex gap-2">
          <ActionButton type="secondary" icon="fas fa-times" @click="handleCancel">
            Hủy
          </ActionButton>
          <ActionButton type="primary" icon="fas fa-save" @click="handleSavePlan">
            Xác nhận
          </ActionButton>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="constructionError" class="alert alert-danger" role="alert">
          {{ constructionError }}
        </div>

        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th v-for="col in materialColumns" :key="col.key">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="material in paginatedMaterials" :key="material.materialCode">
                <td>{{ material.materialCode }}</td>
                <td>{{ material.materialName }}</td>
                <td>{{ material.unit }}</td>
                <td>{{ material.quantity }}</td>
                <td>{{ formatCurrency(material.price) }}</td>
                <td>{{ formatCurrency(material.total) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Phân trang vật tư -->
          <div class="d-flex justify-content-between align-items-center mt-4">
            <div class="text-muted">
              Hiển thị {{ paginatedMaterials.length }} trên {{ materials.length }} vật tư
            </div>
            <Pagination
              :total-items="materials.length"
              :items-per-page="materialItemsPerPage"
              :current-page="currentMaterialPage"
              @update:currentPage="handleMaterialPageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog xác nhận hủy -->
    <ModalDialog v-model:show="showConfirmDialog" title="Xác nhận" size="sm">
      <div class="p-3">
        <p>Bạn có muốn lưu kế hoạch vật tư không?</p>
        <div class="d-flex justify-content-end gap-2">
          <ActionButton type="secondary" @click="showConfirmDialog = false">
            Không
          </ActionButton>
          <ActionButton type="primary" @click="handleSavePlan">
            Có
          </ActionButton>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style scoped>
.material-planning {
  animation: fadeIn 0.3s ease-out;
}

.construction-table {
  margin-bottom: 0;
}

.construction-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.construction-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.construction-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.construction-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.table input {
  width: 100px;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
  white-space: nowrap;
  font-style: italic;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
