import { ref, computed } from 'vue'
import api from '../api.js';

export function useProjectManagement() {
  const projects = ref([])
  const selectedProject = ref(null)

  const fetchProjects = async () => {
    const res = await api.get('/constructions');
    projects.value = res.data;
  };

  const fetchProjectDetail = async (projectId) => {
    try {
      const res = await api.get(`/constructions/${projectId}`)
      selectedProject.value = res.data // Đảm bảo dữ liệu được gán đúng
      console.log('Fetched project detail:', selectedProject.value) // Debug dữ liệu
    } catch (error) {
      console.error('Error fetching project detail:', error)
    }
  }

  const dashboardStats = computed(() => {
    const totalProjects = projects.value.length
    const pendingProjects = projects.value.filter(project => project.statusName === 'Chờ khởi công').length
    const inProgressProjects = projects.value.filter(project => project.statusName === 'Đang thi công').length
    const completedProjects = projects.value.filter(project => project.statusName === 'Hoàn thành').length
    const pausedProjects = projects.value.filter(project => project.statusName === 'Tạm dừng').length;
    const canceledProjects = projects.value.filter(project => project.statusName === 'Hủy bỏ').length;
    const delayedProjects = projects.value.filter(project => {
      const expectedDate = new Date(project.expectedCompletionDate)
      const actualDate = project.actualCompletionDate ? new Date(project.actualCompletionDate) : null
      return actualDate && actualDate > expectedDate
    }).length

    return {
      totalProjects,
      pendingProjects,
      inProgressProjects,
      completedProjects,
      delayedProjects,
      pausedProjects,
      canceledProjects
    }
  })

  const projectTypesStats = computed(() => {
    const typeCounts = {
      1: { type: 'Cầu đường', count: 0, color: '#0d6efd' },
      2: { type: 'Nhà ở', count: 0, color: '#198754' },
      3: { type: 'Công nghiệp', count: 0, color: '#dc3545' },
      4: { type: 'Thủy lợi', count: 0, color: '#ffc107' }
    }

    projects.value.forEach(project => {
      if (typeCounts[project.constructionTypeID]) {
        typeCounts[project.constructionTypeID].count++
      }
    })

    return Object.values(typeCounts)
  })

  const upcomingDeadlines = computed(() => {
    const today = new Date()
    const threeMonthsLater = new Date()
    threeMonthsLater.setMonth(today.getMonth() + 3)

    return projects.value.filter(project => {
      const expectedDate = new Date(project.expectedCompletionDate)
      return expectedDate >= today && expectedDate <= threeMonthsLater
    }).map(project => ({
      name: project.constructionName,
      deadline: project.expectedCompletionDate,
      progress: calculateProgress(project),
      status: project.statusName
    }))
  })

  // Hàm tính toán tiến độ (giả định)
  const calculateProgress = (project) => {
    const startDate = new Date(project.startDate)
    const expectedDate = new Date(project.expectedCompletionDate)
    const today = new Date()

    if (today < startDate) return 0
    if (today > expectedDate) return 100

    const totalDuration = expectedDate - startDate
    const elapsedDuration = today - startDate
    return Math.min(100, Math.floor((elapsedDuration / totalDuration) * 100))
  }

  const showCreateForm = ref(false)
  const formData = ref({
    constructionName: '',
    constructionTypeID: '',
    constructionStatusID: 1, // Mặc định là trạng thái "Chờ khởi công"
    location: '',
    totalArea: '',
    startDate: '',
    expectedCompletionDate: '',
    designBlueprint: null,
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

  const createProject = async () => {
    try {
      // Validate form trước khi gửi
      if (!validateForm()) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
        return
      }

      // Chuẩn bị dữ liệu gửi lên server
      const projectData = {
        constructionDTO: {
          constructionName: formData.value.constructionName,
          constructionTypeID: parseInt(formData.value.constructionTypeID),
          constructionStatusID: 1, // Luôn set là 1 (Pending) khi tạo mới
          location: formData.value.location,
          totalArea: parseFloat(formData.value.totalArea),
          startDate: new Date(formData.value.startDate).toISOString(),
          expectedCompletionDate: new Date(formData.value.expectedCompletionDate).toISOString(),
          actualCompletionDate: null,
          designBlueprint: formData.value.designBlueprint ? formData.value.designBlueprint.name : null,
          constructionItems: []
        }
      }

      // Log dữ liệu để debug
      console.log('Data being sent to API:', JSON.stringify(projectData, null, 2))

      const res = await api.post('/constructions', projectData)
      console.log('API Response:', res.data)
      projects.value.push(res.data)
      alert('Dự án đã được tạo thành công!')
      resetForm()
      showCreateForm.value = false
    } catch (error) {
      console.error('Error creating project:', error)
      // Log chi tiết lỗi
      if (error.response) {
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
        console.error('Error details:', JSON.stringify(error.response.data.errors, null, 2))
      }
      alert('Đã xảy ra lỗi khi tạo dự án!')
    }
  }

  const validateForm = () => {
    const required = [
      'constructionName',
      'constructionTypeID',
      'location',
      'totalArea',
      'startDate',
      'expectedCompletionDate'
    ]

    for (const field of required) {
      if (!formData.value[field]) {
        console.error(`Missing required field: ${field}`)
        return false
      }
    }

    // Validate kiểu dữ liệu
    if (isNaN(parseInt(formData.value.constructionTypeID))) {
      console.error('Invalid constructionTypeID')
      return false
    }

    if (isNaN(parseFloat(formData.value.totalArea))) {
      console.error('Invalid totalArea')
      return false
    }

    // Validate ngày tháng
    const startDate = new Date(formData.value.startDate)
    const expectedDate = new Date(formData.value.expectedCompletionDate)

    if (isNaN(startDate.getTime())) {
      console.error('Invalid startDate')
      return false
    }

    if (isNaN(expectedDate.getTime())) {
      console.error('Invalid expectedCompletionDate')
      return false
    }

    if (startDate > expectedDate) {
      console.error('Start date cannot be after expected completion date')
      return false
    }

    return true
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      formData.value.designBlueprint = file // Lưu toàn bộ file object
    }
  }

  const resetForm = () => {
    formData.value = {
      constructionName: '',
      constructionTypeID: '',
      constructionStatusID: 1,
      location: '',
      totalArea: '',
      startDate: '',
      expectedCompletionDate: '',
      designBlueprint: null,
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
    selectedProject,
    fetchProjects,
    fetchProjectDetail,
    dashboardStats,
    projectTypesStats,
    upcomingDeadlines,
    showCreateForm,
    formData,
    constructionItem,
    pendingProjects,
    inProgressProjects,
    handleCreateProject,
    handleCancelCreate,
    handleProjectCreated,
    addConstructionItem,
    createProject,
    handleFileUpload
  }
}