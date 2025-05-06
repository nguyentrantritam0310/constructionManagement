<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProjectManagement } from '../../composables/useProjectManagement'
import ProjectList from '../../components/project/ProjectList.vue'
import CreateProjectForm from '../../components/project/CreateProjectForm.vue'
import UpdateProjectForm from '../../components/project/UpdateProjectForm.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import FilterSearch from '../../components/common/FilterSearch.vue'
import ChangeStatusDialog from '../../components/project/ChangeStatusDialog.vue'

const {
  projects,
  fetchProjects,
  formData,
  constructionItem,
  handleCreateProject,
  handleCancelCreate,
  handleProjectCreated,
  addConstructionItem,
  handleFileUpload,
  fetchProjectDetail,
  selectedProject,
  createProject
} = useProjectManagement()

// Thêm các biến cho bộ lọc
const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({
  start: null,
  end: null
})

// Tính toán danh sách dự án đã lọc
const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    // Lọc theo từ khóa tìm kiếm
    const matchesSearch = searchQuery.value === '' ||
      project.constructionName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      project.id.toString().includes(searchQuery.value)

    // Lọc theo trạng thái
    const matchesStatus = statusFilter.value === 'all' ||
      project.statusName === statusFilter.value

    // Lọc theo khoảng thời gian
    const matchesDateRange = !dateRangeFilter.value.start || !dateRangeFilter.value.end ||
      (new Date(project.startDate) >= new Date(dateRangeFilter.value.start) &&
        new Date(project.startDate) <= new Date(dateRangeFilter.value.end))

    return matchesSearch && matchesStatus && matchesDateRange
  })
})

// Reset bộ lọc
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateRangeFilter.value = {
    start: null,
    end: null
  }
}

onMounted(fetchProjects);

console.log(projects.value)
const showCreateForm = ref(false)

const handleUpdateProjectStatus = ({ projectId, newStatus }) => {
  const project = projects.value.find(p => p.projectCode === projectId)
  if (project) {
    project.status = newStatus

    // If project is suspended, update all related items
    if (newStatus === 'Suspended') {
      // Here you would typically update all related items in the database
      console.log('Updating all related items to suspended status')
    }
  }
}

const openCreateForm = () => {
  showCreateForm.value = true
  document.body.classList.add('modal-open')
}

const closeCreateForm = () => {
  showCreateForm.value = false
  document.body.classList.remove('modal-open')
  handleCancelCreate()
}

const showUpdateForm = ref(false)

const openUpdateForm = async (projectId) => {
  await fetchProjectDetail(projectId) // Gọi API để lấy thông tin chi tiết công trình
  showUpdateForm.value = true // Hiển thị modal cập nhật
}

const closeUpdateForm = () => {
  showUpdateForm.value = false
}

const handleProjectUpdated = async () => {
  try {
    await api.put(`/constructions/${selectedProject.id}`, selectedProject) // Gửi dữ liệu cập nhật
    alert('Cập nhật dự án thành công!')
    closeUpdateForm()
    await fetchProjects() // Làm mới danh sách dự án
  } catch (error) {
    console.error('Error updating project:', error)
    alert('Cập nhật dự án thất bại!')
  }
}

const showStatusDialog = ref(false)

const handleStatusSubmit = async (status) => {
  try {
    selectedProject.status = status
    await api.put(`/constructions/${selectedProject.id}`, selectedProject)
    alert('Cập nhật trạng thái thành công!')
    showStatusDialog.value = false
    await fetchProjects()
  } catch (error) {
    console.error('Error updating status:', error)
    alert('Cập nhật trạng thái thất bại!')
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Dự Án</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Thêm Dự Án Mới" @click="openCreateForm">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Bộ lọc và tìm kiếm -->
    <div class="card mb-4">
      <div class="card-body">
        <FilterSearch :searchQuery="searchQuery" :statusFilter="statusFilter" :dateRangeFilter="dateRangeFilter"
          @update:searchQuery="searchQuery = $event" @update:statusFilter="statusFilter = $event"
          @update:dateRangeFilter="dateRangeFilter = $event" @resetFilters="resetFilters" />
      </div>
    </div>

    <ProjectList :projects="filteredProjects" @update-project-status="handleUpdateProjectStatus"
      @open-update-form="openUpdateForm" @refresh-projects="fetchProjects" />

    <!-- Use ModalDialog component -->
    <ModalDialog v-model:show="showCreateForm" title="Tạo Dự Án Mới" size="lg" scrollable>
      <CreateProjectForm :form-data="formData" :construction-item="constructionItem" @cancel="closeCreateForm"
        @submit="createProject" />
    </ModalDialog>

    <ModalDialog v-model:show="showUpdateForm" title="Cập Nhật Dự Án" size="lg">
      <UpdateProjectForm v-if="selectedProject" :project="selectedProject" @cancel="closeUpdateForm"
        @submit="handleProjectUpdated" />
    </ModalDialog>

    <ChangeStatusDialog v-if="selectedProject" :show="showStatusDialog" :project="selectedProject"
      @update:show="showStatusDialog = $event" @submit="handleStatusSubmit" />

    <!-- Separate backdrop -->
    <div v-if="showCreateForm" class="modal-backdrop fade show" @click="closeCreateForm"></div>
  </div>
</template>

<style scoped>
/* Ensure proper z-index stacking */
.modal {
  z-index: 1055;
}

.modal-backdrop {
  z-index: 1050;
}

/* Add scrolling for long content */
.modal-dialog-scrollable .modal-content {
  max-height: 90vh;
  overflow-y: auto;
}

/* Prevent body scrolling when modal is open */
:deep(body.modal-open) {
  overflow: hidden;
}

.input-group-text {
  background-color: #f8f9fa;
  border-right: none;
}

.input-group .form-control {
  border-left: none;
}

.input-group .form-control:focus {
  border-color: #ced4da;
  box-shadow: none;
}

.input-group .form-control:focus+.input-group-text {
  border-color: #ced4da;
}

.form-select:focus {
  border-color: #ced4da;
  box-shadow: none;
}
</style>
