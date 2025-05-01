import { ref, computed } from 'vue'

export function useProjectManagement() {
  const projects = ref([
    {
      projectCode: 'PRJ001',
      projectName: 'Office Building Construction',
      location: '123 Business Street, City',
      status: 'Pending Start',
      startDate: '2024-03-15',
      estimatedCompletionDate: '2025-06-30'
    },
    {
      projectCode: 'PRJ002',
      projectName: 'Residential Complex',
      location: '456 Housing Avenue, City',
      status: 'In Progress',
      startDate: '2024-02-01',
      estimatedCompletionDate: '2025-12-31'
    },
    {
      projectCode: 'PRJ003',
      projectName: 'Shopping Mall Renovation',
      location: '789 Retail Road, City',
      status: 'Pending Start',
      startDate: '2024-04-01',
      estimatedCompletionDate: '2025-03-15'
    },

  ])

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