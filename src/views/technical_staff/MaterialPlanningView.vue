<script setup>
import { ref } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'

const selectedProject = ref(null)
const showConfirmDialog = ref(false)
const projects = ref([
  {
    id: 1,
    projectCode: 'PRJ001',
    projectName: 'Khu chung cư The Sun',
    location: '123 Đường ABC, Quận 1, TP.HCM',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'In Progress',
    constructionItems: [
      { id: 1, name: 'Móng Block A' },
      { id: 2, name: 'Tầng 1-5 Block A' }
    ]
  },
  {
    id: 2,
    projectCode: 'PRJ002',
    projectName: 'Cao ốc văn phòng Star',
    location: '456 Đường XYZ, Quận 2, TP.HCM',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    status: 'Not Started',
    constructionItems: [
      { id: 3, name: 'Móng tòa nhà' },
      { id: 4, name: 'Tầng hầm' }
    ]
  }
])

const materials = ref([])
const isEditing = ref(false)

const projectColumns = [
  { key: 'projectCode', label: 'Mã công trình' },
  { key: 'projectName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày khởi công' },
  { key: 'endDate', label: 'Ngày dự kiến hoàn thành' },
  { key: 'status', label: 'Trạng thái' }
]

const materialColumns = [
  { key: 'materialCode', label: 'Mã vật tư' },
  { key: 'materialName', label: 'Tên vật tư' },
  { key: 'unit', label: 'Đơn vị tính' },
  { key: 'estimatedQuantity', label: 'Số lượng dự đoán' },
  { key: 'availableQuantity', label: 'Số lượng tồn' },
  { key: 'requiredQuantity', label: 'Số lượng cần mua' }
]

const handleProjectSelect = (project) => {
  selectedProject.value = project
  // Giả lập dữ liệu vật tư
  materials.value = [
    {
      materialCode: 'MT001',
      materialName: 'Xi măng',
      unit: 'Tấn',
      estimatedQuantity: 100,
      availableQuantity: 20,
      requiredQuantity: 80
    },
    {
      materialCode: 'MT002',
      materialName: 'Cát',
      unit: 'm³',
      estimatedQuantity: 200,
      availableQuantity: 50,
      requiredQuantity: 150
    }
  ]
}

const handleConfirm = () => {
  // Xử lý lưu kế hoạch vật tư
  console.log('Lưu kế hoạch vật tư:', {
    project: selectedProject.value,
    materials: materials.value
  })
  // Hiển thị thông báo thành công
  alert('Lưu kế hoạch vật tư thành công')
}

const handleCancel = () => {
  showConfirmDialog.value = true
}

const handleQuantityChange = (material, event) => {
  const newQuantity = parseInt(event.target.value)
  if (isNaN(newQuantity) || newQuantity < 0) {
    alert('Vui lòng nhập số lượng hợp lệ')
    event.target.value = material.requiredQuantity
    return
  }
  material.requiredQuantity = newQuantity
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
        <DataTable
          :columns="projectColumns"
          :data="projects"
          @row-click="handleProjectSelect"
          class="project-table"
        >
          <template #projectCode="{ item }">
            <span class="fw-medium text-primary">{{ item.projectCode }}</span>
          </template>

          <template #projectName="{ item }">
            <div>
              <div class="fw-medium">{{ item.projectName }}</div>
              <small class="text-muted">
                {{ item.constructionItems.length }} hạng mục
              </small>
            </div>
          </template>

          <template #location="{ item }">
            <div class="d-flex align-items-center">
              <i class="fas fa-map-marker-alt text-muted me-1"></i>
              {{ item.location }}
            </div>
          </template>

          <template #startDate="{ item }">
            <div class="d-flex align-items-center">
              <i class="fas fa-calendar text-muted me-1"></i>
              {{ formatDate(item.startDate) }}
            </div>
          </template>

          <template #endDate="{ item }">
            <div class="d-flex align-items-center">
              <i class="fas fa-calendar-check text-muted me-1"></i>
              {{ formatDate(item.endDate) }}
            </div>
          </template>

          <template #status="{ item }">
            <StatusBadge :status="item.status" />
          </template>
        </DataTable>
      </div>
    </div>

    <div v-if="selectedProject" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4 class="mb-0">Danh sách vật tư - {{ selectedProject.projectName }}</h4>
        <div class="d-flex gap-2">
          <ActionButton
            type="secondary"
            icon="fas fa-times"
            @click="handleCancel"
          >
            Hủy
          </ActionButton>
          <ActionButton
            type="primary"
            icon="fas fa-save"
            @click="handleConfirm"
          >
            Xác nhận
          </ActionButton>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
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
                  <input
                    type="number"
                    class="form-control form-control-sm"
                    :value="material.requiredQuantity"
                    @input="(e) => handleQuantityChange(material, e)"
                    min="0"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dialog xác nhận hủy -->
    <ModalDialog
      v-model:show="showConfirmDialog"
      title="Xác nhận"
      size="sm"
    >
      <div class="p-3">
        <p>Bạn có muốn lưu kế hoạch vật tư không?</p>
        <div class="d-flex justify-content-end gap-2">
          <ActionButton
            type="secondary"
            @click="showConfirmDialog = false"
          >
            Không
          </ActionButton>
          <ActionButton
            type="primary"
            @click="handleConfirm"
          >
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
  background-color: rgba(0,123,255,0.05);
}

.table input {
  width: 100px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>