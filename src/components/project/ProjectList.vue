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
import { useProjectManagement } from '../../composables/useProjectManagement'
const { selectedProject, fetchProjectDetail } = useProjectManagement()

const router = useRouter()
const props = defineProps({
  projects: {
    // type: Array,
    required: true
  }
})

const emit = defineEmits(['update-status', 'update-project', 'open-update-form', 'refresh-projects'])

const showStatusDialog = ref(false)
const showUpdateDialog = ref(false)
const currentPage = ref(1)
const itemsPerPage = 5

const columns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày BĐ', class: 'col-date' },
  { key: 'expectedCompletionDate', label: 'Ngày KTDK', class: 'col-date' },
  { key: 'actualCompletionDate', label: 'Ngày KTTT', class: 'col-date' },
  { key: 'statusName', label: 'Trạng thái', class: 'col-status' }
]

// Phân trang
const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.projects.slice(start, end)
})

const handleRowClick = (project) => {
  router.push(`/project-management/${project.id}`) // Chuyển đến trang chi tiết dự án
}

const handleStatusClick = (project, event) => {
  event.stopPropagation()
  selectedProject.value = { ...project }
  showStatusDialog.value = true // Hiển thị modal đổi trạng thái
}

const closeStatusDialog = () => {
  showStatusDialog.value = false
}

const handleStatusSubmit = (newStatus) => {
  emit('update-project-status', {
    projectId: selectedProject.value.id,
    newStatus
  })
  closeStatusDialog()
}

const handleUpdateClick = async (project, event) => {
  event.stopPropagation()
  await fetchProjectDetail(project.id) // Gọi API để lấy thông tin chi tiết dự án
  showUpdateDialog.value = true // Hiển thị modal sửa
}

const closeUpdateDialog = () => {
  showUpdateDialog.value = false
}

const handleUpdateSubmit = async () => {
  try {
    await api.put(`/constructions/${selectedProject.value.id}`, selectedProject.value) // Gửi dữ liệu cập nhật
    alert('Cập nhật dự án thành công!')
    closeUpdateDialog()
    emit('refresh-projects') // Phát sự kiện để làm mới danh sách dự án
  } catch (error) {
    console.error('Error updating project:', error)
    alert('Cập nhật dự án thất bại!')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const formatDate = (date, isActualCompletion = false) => {
  if (!date) {
    return isActualCompletion ? '(Chưa cập nhật)' : '-'
  }
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="project-list">
    <!-- Projects Table -->
    <div class="card">
      <div class="card-body p-0">
        <DataTable :columns="columns" :data="paginatedProjects" @row-click="handleRowClick" class="project-table">
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
              <i class=" text-muted me-1"></i>
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

          <template #actualCompletionDate="{ item }">
            <div class="date-info">
              <i class="fas fa-calendar-check text-muted"></i>
              {{ formatDate(item.actualCompletionDate) }}
            </div>
          </template>

          <template #statusName="{ item }">
            <StatusBadge :status="item.statusName" />
          </template>

          <template #actions="{ item }">
            <div class="d-flex justify-content-center gap-2">
              <UpdateButton @click.stop="handleUpdateClick(item, $event)" />
              <ChangeStatusButton @click.stop="handleStatusClick(item, $event)" />
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
      <Pagination :total-items="props.projects.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Change Status Dialog -->
    <ChangeStatusDialog v-if="selectedProject" :show="showStatusDialog" :project="selectedProject"
      @update:show="showStatusDialog = $event" @submit="handleStatusSubmit" />

    <!-- Modal Sửa -->
    <ModalDialog v-model:show="showUpdateDialog" title="Cập Nhật Dự Án" size="lg">
      <UpdateProjectForm v-if="selectedProject" :project="selectedProject" @cancel="closeUpdateDialog"
        @submit="handleUpdateSubmit" />
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  background-color: rgba(0, 123, 255, 0.05);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
  white-space: nowrap;
  font-style: italic;
}

.date-info i {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
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
