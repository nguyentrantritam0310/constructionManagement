<script setup>
import { ref, onMounted } from 'vue'
import { useMaterialPlanning } from '../../composables/useMaterialPlanning'
import { useProjectManagement } from '../../composables/useProjectManagement'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'

const selectedProject = ref(null)
const showConfirmDialog = ref(false)

const {
  materials,
  loading,
  error,
  fetchMaterials,
  updateMaterialQuantity,
  saveMaterialPlan
} = useMaterialPlanning()

const {
  projects,
  fetchProjects
} = useProjectManagement()
onMounted(() => {
  fetchProjects()
})

const projectColumns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày khởi công' },
  { key: 'expectedCompletionDate', label: 'Ngày dự kiến hoàn thành' },
  { key: 'statusName', label: 'Trạng thái' }
]

const materialColumns = [
  { key: 'id', label: 'Mã Vật Tư' },
  { key: 'materialName', label: 'Tên Vật Tư' },
  { key: 'stockQuantity', label: 'Tồn kho' },
  { key: 'materialTypeName', label: 'Loại Vật Tư' },
  { key: 'unitPrice', label: 'Đơn Giá' },
  { key: 'status', label: 'Trạng Thái' },
  { key: 'requiredQuantity', label: 'Số lượng cần mua' }
]

const handleProjectSelect = async (project) => {
  selectedProject.value = project
  try {
    await fetchMaterials(project.id)
  } catch (err) {
    console.error('Error fetching materials:', err)
    alert('Có lỗi xảy ra khi tải danh sách vật tư')
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

const handleConfirm = async () => {
  try {
    await saveMaterialPlan(selectedProject.value.id, {
      materials: materials.value
    })
    alert('Lưu kế hoạch vật tư thành công')
    showConfirmDialog.value = false
  } catch (err) {
    console.error('Error saving material plan:', err)
    alert('Có lỗi xảy ra khi lưu kế hoạch vật tư')
  }
}

const handleCancel = () => {
  showConfirmDialog.value = true
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
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

        <div v-else-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <DataTable v-else :columns="projectColumns" :data="projects" @row-click="handleProjectSelect" class="id">
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
      </div>
    </div>

    <div v-if="selectedProject" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4 class="mb-0">Danh sách vật tư - {{ selectedProject.constructionName }}</h4>
        <div class="d-flex gap-2">
          <ActionButton type="secondary" icon="fas fa-times" @click="handleCancel">
            Hủy
          </ActionButton>
          <ActionButton type="primary" icon="fas fa-save" @click="handleConfirm">
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

        <div v-else-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th v-for="col in materialColumns" :key="col.key">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="material in materials" :key="material.materialCode">
                <td>{{ material.materialCode }}</td>
                <td>{{ material.materialName }}</td>
                <td>{{ material.unit }}</td>
                <td>{{ material.estimatedQuantity }}</td>
                <td>{{ material.availableQuantity }}</td>
                <td>
                  <input type="number" class="form-control form-control-sm" :value="material.requiredQuantity"
                    @input="(e) => handleQuantityChange(material, e)" min="0">
                </td>
              </tr>
            </tbody>
          </table>
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
          <ActionButton type="primary" @click="handleConfirm">
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

.project-table {
  margin-bottom: 0;
}

.project-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.project-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.project-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-table :deep(tr:hover) {
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
