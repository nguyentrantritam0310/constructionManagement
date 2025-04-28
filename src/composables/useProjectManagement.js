import { ref, computed } from 'vue'
import api from '../api.js';

export function useProjectManagement() {
  const projects = ref([])
  const fetchProjects = async () => {
    const res = await api.get('/constructions');
    projects.value = res.data;
  };

  const showCreateForm = ref(false)
  const formData = ref({
    projectName: '',
    projectType: '',
    constructionLocation: '',
    totalArea: '',
    startDate: '',
    estimatedCompletionDate: '',
    designDocument: null,
    constructionItems: []
  })

  const constructionItem = ref({
    itemName: '',
    description: '',
    startDate: '',
    endDate: '',
    totalVolume: '',
    unitOfMeasurement: ''
  })

  const pendingProjects = computed(() => {
    return projects.value.filter(project => project.status === 'Pending Start')
  })

  const inProgressProjects = computed(() => {
    return projects.value.filter(project => project.status === 'In Progress')
  })

  const handleCreateProject = () => {
    showCreateForm.value = true
  }

  const handleCancelCreate = () => {
    if (confirm('The information has not been saved, are you sure you want to exit?')) {
      showCreateForm.value = false
      resetForm()
    }
  }

  const addConstructionItem = () => {
    if (!constructionItem.value.itemName) {
      alert('Please enter an item name')
      return
    }
    formData.value.constructionItems.push({ ...constructionItem.value })
    resetConstructionItem()
  }

  const handleProjectCreated = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields correctly')
      return
    }

    const newProject = {
      ...formData.value,
      projectCode: `PRJ${String(projects.value.length + 1).padStart(3, '0')}`,
      status: 'Pending Start'
    }
    projects.value.push(newProject)
    showCreateForm.value = false
    resetForm()
    alert('Project created successfully')
  }

  const validateForm = () => {
    return (
      formData.value.projectName &&
      formData.value.projectType &&
      formData.value.constructionLocation &&
      formData.value.totalArea &&
      formData.value.startDate &&
      formData.value.estimatedCompletionDate
    )
  }

  const handleFileUpload = (event) => {
    formData.value.designDocument = event.target.files[0]
  }

  const resetForm = () => {
    formData.value = {
      projectName: '',
      projectType: '',
      constructionLocation: '',
      totalArea: '',
      startDate: '',
      estimatedCompletionDate: '',
      designDocument: null,
      constructionItems: []
    }
  }

  const resetConstructionItem = () => {
    constructionItem.value = {
      itemName: '',
      description: '',
      startDate: '',
      endDate: '',
      totalVolume: '',
      unitOfMeasurement: ''
    }
  }

  return {
    projects,
    fetchProjects,
    showCreateForm,
    formData,
    constructionItem,
    pendingProjects,
    inProgressProjects,
    handleCreateProject,
    handleCancelCreate,
    handleProjectCreated,
    addConstructionItem,
    handleFileUpload
  }
} 