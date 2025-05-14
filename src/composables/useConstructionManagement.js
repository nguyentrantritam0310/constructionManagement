import { ref, computed } from 'vue'
import api from '../api.js'
import { constructionService } from '../services/constructionService'
import { useGlobalMessage } from '../../src/composables/useGlobalMessage'
const { showMessage } = useGlobalMessage()

export function useConstructionManagement() {
  const constructions = ref([])
  const selectedConstruction = ref(null)
  const templateItem = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchConstructions = async () => {
    try {
      loading.value = true
      const data = await constructionService.getAll()
      constructions.value = data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể tải danh sách công trình', 'error')
      console.error('Error fetching constructions:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchConstructionDetail = async (id) => {
    try {
      loading.value = true
      const data = await constructionService.getById(id)
      selectedConstruction.value = data
      return data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể tải thông tin công trình', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchConstructionTemplateItem = async (constructionTypeID) => {
    try {
      const res = await api.get(`/ConstructionTemplateItem/${constructionTypeID}`)
      templateItem.value = res.data
      console.log('Fetched template items:', templateItem.value)
    } catch (error) {
      console.error('Error fetching template items:', error)
    }
  }

  const dashboardStats = computed(() => ({
    totalConstructions: constructions.value.length,
    pendingConstructions: constructions.value.filter(c => c.status === 'Pending').length,
    inProgressConstructions: constructions.value.filter(c => c.status === 'In Progress').length,
    completedConstructions: constructions.value.filter(c => c.status === 'Completed').length,
    pausedConstructions: constructions.value.filter(c => c.status === 'Paused').length,
    canceledConstructions: constructions.value.filter(c => c.status === 'Canceled').length
  }))


  const upcomingDeadlines = computed(() => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return constructions.value
      .filter(construction => {
        const deadline = new Date(construction.expectedCompletionDate)
        return deadline >= today && deadline <= thirtyDaysFromNow
      })
      .map(construction => ({
        name: construction.constructionName,
        deadline: construction.expectedCompletionDate,
        status: construction.status,
        progress: calculateProgress(construction)
      }))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  })

  const calculateProgress = (construction) => {
    if (!construction.constructionItems || construction.constructionItems.length === 0) return 0
    const totalItems = construction.constructionItems.length
    const completedItems = construction.constructionItems.filter(item => item.status === 'Completed').length
    return Math.round((completedItems / totalItems) * 100)
  }

  const showCreateForm = ref(false)
  const formData = ref({
    constructionName: '',
    constructionTypeID: '',
    constructionStatusID: 1,
    location: '',
    totalArea: '',
    startDate: '',
    expectedCompletionDate: '',
    designBlueprint: null,
    constructionItems: []
  })

  const pendingConstructions = computed(() => {
    return constructions.value.filter(construction => construction.status === 'Pending Start')
  })

  const inProgressConstructions = computed(() => {
    return constructions.value.filter(construction => construction.status === 'In Progress')
  })

  const handleCreateConstruction = () => {
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

  const handleConstructionCreated = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields correctly')
      return
    }

    const newConstruction = {
      ...formData.value,
      constructionCode: `CTR${String(constructions.value.length + 1).padStart(3, '0')}`,
      status: 'Pending Start'
    }
    constructions.value.push(newConstruction)
    showCreateForm.value = false
    resetForm()
    alert('Construction created successfully')
  }

  const createConstruction = async (data) => {
    try {
      loading.value = true
      const newConstruction = await constructionService.create(data)
      constructions.value.push(newConstruction)
      showMessage('Tạo công trình thành công', 'success')
      return newConstruction
    } catch (err) {
      error.value = err.message
      showMessage('Không thể tạo công trình', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateConstruction = async (id, data) => {
    try {
      loading.value = true
      const updatedConstruction = await constructionService.update(id, data)
      const index = constructions.value.findIndex(c => c.id === id)
      if (index !== -1) {
        constructions.value[index] = updatedConstruction
      }
      if (selectedConstruction.value?.id === id) {
        selectedConstruction.value = updatedConstruction
      }
      showMessage('Cập nhật công trình thành công', 'success')
      return updatedConstruction
    } catch (err) {
      error.value = err.message
      showMessage('Không thể cập nhật công trình', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateConstructionStatus = async (id, newStatus) => {
    try {
      console.log('Updating construction status:', id, newStatus)
      loading.value = true
      const updatedConstruction = await constructionService.updateStatus(id, newStatus)
      const index = constructions.value.findIndex(c => c.id === id)
      if (index !== -1) {
        constructions.value[index] = updatedConstruction
      }
      if (selectedConstruction.value?.id === id) {
        selectedConstruction.value = updatedConstruction
      }
      showMessage('Cập nhật trạng thái thành công', 'success')
      return updatedConstruction
    } catch (err) {
      error.value = err.message
      showMessage('Không thể cập nhật trạng thái', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteConstruction = async (id) => {
    try {
      loading.value = true
      await constructionService.delete(id)
      constructions.value = constructions.value.filter(c => c.id !== id)
      if (selectedConstruction.value?.id === id) {
        selectedConstruction.value = null
      }
      showMessage('Xóa công trình thành công', 'success')
    } catch (err) {
      error.value = err.message
      showMessage('Không thể xóa công trình', 'error')
      throw err
    } finally {
      loading.value = false
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

    if (isNaN(parseInt(formData.value.constructionTypeID))) {
      console.error('Invalid constructionTypeID')
      return false
    }

    if (isNaN(parseFloat(formData.value.totalArea))) {
      console.error('Invalid totalArea')
      return false
    }

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
      formData.value.designBlueprint = file
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

  const fetchConstructionItems = async (constructionId) => {
    try {
      loading.value = true
      const data = await constructionService.getItems(constructionId)
      return data
    } catch (err) {
      error.value = err.message
      showMessage('Không thể tải danh sách hạng mục', 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    constructions,
    selectedConstruction,
    templateItem,
    loading,
    error,
    fetchConstructions,
    fetchConstructionDetail,
    fetchConstructionTemplateItem,
    dashboardStats,
    upcomingDeadlines,
    showCreateForm,
    formData,
    pendingConstructions,
    inProgressConstructions,
    handleCreateConstruction,
    handleCancelCreate,
    handleConstructionCreated,
    addConstructionItem,
    createConstruction,
    updateConstruction,
    updateConstructionStatus,
    deleteConstruction,
    handleFileUpload,
    resetForm,
    resetConstructionItem,
    fetchConstructionItems
  }
}
