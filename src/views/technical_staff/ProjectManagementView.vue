<script setup>
import { ref, onMounted } from 'vue'
import { useProjectManagement } from '../../composables/useProjectManagement'
import ProjectList from '../../components/project/ProjectList.vue'
import CreateProjectForm from '../../components/project/CreateProjectForm.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'



const {
  projects,
  fetchProjects,
  formData,
  constructionItem,
  handleCreateProject,
  handleCancelCreate,
  handleProjectCreated,
  addConstructionItem,
  handleFileUpload
} = useProjectManagement()




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
</script>

<template>
   
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Dự Án</h1>
      <ActionButton
        icon="fas fa-plus"
        type="primary"
        tooltip="Thêm Dự Án Mới"
        @click="openCreateForm"
      >
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <ProjectList
      :projects="projects"
      @update-project-status="handleUpdateProjectStatus"
    />

    <!-- Use ModalDialog component -->
    <ModalDialog
      v-model:show="showCreateForm"
      title="Tạo Dự Án Mới"
      size="lg"
      scrollable
    >
      <CreateProjectForm
        :form-data="formData"
        :construction-item="constructionItem"
        @cancel="closeCreateForm"
        @submit="handleProjectCreated"
        @add-item="addConstructionItem"
        @file-upload="handleFileUpload"
      />
    </ModalDialog>

    <!-- Separate backdrop -->
    <div
      v-if="showCreateForm"
      class="modal-backdrop fade show"
      @click="closeCreateForm"
    ></div>
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
</style>
