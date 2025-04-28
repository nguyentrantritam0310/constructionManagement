<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../common/DataTable.vue'
import StatusBadge from '../common/StatusBadge.vue'
import ActionButton from '../common/ActionButton.vue'
import ChangeStatusDialog from './ChangeStatusDialog.vue'
import Pagination from '../common/Pagination.vue'
import UpdateProjectForm from './UpdateProjectForm.vue'
import ModalDialog from '../common/ModalDialog.vue'
import UpdateButton from '../common/UpdateButton.vue'
import ChangeStatusButton from '../common/ChangeStatusButton.vue'

const router = useRouter()
const props = defineProps({
  projects: {
    // type: Array,
    required: true
  }
})

const emit = defineEmits(['update-status', 'update-project'])

const showStatusDialog = ref(false)
const showUpdateDialog = ref(false)
const selectedProject = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5

const columns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày khởi công' },
  { key: 'expectedCompletionDate', label: 'Ngày dự kiến hoàn thành' },
  { key: 'status', label: 'Trạng thái' }
]

// Phân trang
const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.projects.slice(start, end)
})

const handleRowClick = (project) => {
  router.push(`/project-management/${project.id}`)
}

const handleStatusClick = (project, event) => {
  event.stopPropagation()
  selectedProject.value = { ...project }
  showStatusDialog.value = true
}

const handleStatusSubmit = (newStatus) => {
  emit('update-status', {
    project: selectedProject.value,
    newStatus
  })
  showStatusDialog.value = false
  selectedProject.value = null
}

const handleUpdateClick = (project, event) => {
  event.stopPropagation()
  selectedProject.value = project
  showUpdateDialog.value = true
}

const handleUpdateSubmit = (updatedData) => {
  emit('update-project', updatedData)
  showUpdateDialog.value = false
  selectedProject.value = null
}

const handleUpdateCancel = () => {
  showUpdateDialog.value = false
  selectedProject.value = null
}



const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="project-list">
    <!-- Projects Table -->
    <div class="card">
      <div class="card-body p-0">
        <DataTable
          :columns="columns"
          :data="paginatedProjects"
          @row-click="handleRowClick"
          class="project-table"
        >
          <template #projectCode="{ item }">
            <span class="project-code">{{ item.projectCode }}</span>
          </template>

          <template #projectName="{ item }">
            <div class="project-name">
              <span class="name">{{ item.projectName }}</span>
            </div>
          </template>

          <template #location="{ item }">
            <div class="location">
              <i class="fas fa-map-marker-alt text-muted me-1"></i>
              {{ item.location }}
            </div>
          </template>

          <template #startDate="{ item }">
            <div class="date-info">
              <i class="fas fa-calendar text-muted me-1"></i>
              {{ formatDate(item.startDate) }}
            </div>
          </template>

          <template #endDate="{ item }">
            <div class="date-info">
              <i class="fas fa-calendar-check text-muted me-1"></i>
              {{ formatDate(item.endDate) }}
            </div>
          </template>

          <template #status="{ item }">
            <StatusBadge :status="item.status" />
          </template>

          <template #actions="{ item }">
            <div class="d-flex justify-content-center gap-2">
              <UpdateButton
                @click.stop="handleUpdateClick(item, $event)"
              />
              <ChangeStatusButton
                @click.stop="handleStatusClick(item, $event)"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Pagination -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedProjects.length }} trên {{ props.projects.length }} dự án
      </div>
      <Pagination
        :total-items="props.projects.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="currentPage = $event" 
      />
    </div>

    <!-- Change Status Dialog -->
    <ChangeStatusDialog
      v-if="selectedProject"
      :show="showStatusDialog"
      :project="selectedProject"
      @update:show="showStatusDialog = $event"
      @submit="handleStatusSubmit"
    />

    <!-- Thêm Modal cho form cập nhật -->
    <ModalDialog
      v-model:show="showUpdateDialog"
      title="Cập Nhật Dự Án"
      size="lg"
    >
      <UpdateProjectForm
        v-if="selectedProject"
        :project="selectedProject"
        @update="handleUpdateSubmit"
        @cancel="handleUpdateCancel"
      />
    </ModalDialog>
  </div>
</template>

<style scoped>
.project-list {
  animation: fadeIn 0.3s ease-out;
}

.card {
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

.project-table {
  margin: 0;
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

.project-code {
  font-family: monospace;
  font-weight: 600;
  color: #2c3e50;
}

.project-name {
  font-weight: 500;
  color: #007bff;
}

.location {
  color: #6c757d;
  font-size: 0.875rem;
}

.date-info {
  font-size: 0.875rem;
  color: #495057;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
</style>