<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '../../components/common/StatusBadge.vue'
import DataTable from '../../components/common/DataTable.vue'
import UpdateButton from '../../components/common/UpdateButton.vue'
import ChangeStatusButton from '../../components/common/ChangeStatusButton.vue'
import ChangeStatusDialog from '../../components/common/ChangeStatusDialog.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ChangeStatusForm from '../../components/common/ChangeStatusForm.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import ActionButton from '../../components/common/ActionButton.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ConstructionItemForm from '../../components/construction/ConstructionItemForm.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import StatusChangeDialog from '../../components/common/StatusChangeDialog.vue'
import { useStatusTransition, STATUS_TYPES, STATUS } from '../../composables/useStatusTransition'
import { useConstructionItem } from '../../composables/useConstructionItem'
import Pagination from '../../components/common/Pagination.vue'
import api from '../../api.js'

const route = useRoute()
const router = useRouter()
const constructionId = route.params.id
const construction = ref(null)
const activeTab = ref('info')
const showStatusDialog = ref(false)
const selectedItem = ref(null)
const { selectedConstruction, fetchConstructionDetail } = useConstructionManagement()
const { showMessage } = useGlobalMessage()
const showItemForm = ref(false)
const formMode = ref('create')
const { createConstructionItem, updateConstructionItem, updateConstructionItemStatus } = useConstructionItem()

const { getStatusOptions } = useStatusTransition(STATUS_TYPES.ITEM)

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedItems = computed(() => {
  if (!selectedConstruction.value?.constructionItems) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return selectedConstruction.value.constructionItems.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(async () => {
  try {
    console.log('Construction ID:', constructionId)
    await fetchConstructionDetail(constructionId)
    console.log('Selected Construction:', selectedConstruction.value)
    console.log('Design Blueprint:', selectedConstruction.value?.designBlueprint) // Debug log
    construction.value = selectedConstruction.value
  } catch (error) {
    console.error('Error fetching construction details:', error)
    showMessage('Không thể tải thông tin công trình', 'error')
  }
})

const constructionItemColumns = [
  { key: 'id', label: 'Mã hạng mục' },
  { key: 'constructionItemName', label: 'Tên hạng mục' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày kết thúc' },
  { key: 'totalVolume', label: 'Tổng khối lượng' },
  { key: 'unitName', label: 'Đơn vị' },
  { key: 'constructionItemStatusName', label: 'Trạng thái' }
]

const handleAddItem = () => {
  formMode.value = 'create'
  selectedItem.value = null
  showItemForm.value = true
}

const handleUpdateItem = (item, event) => {
  event.stopPropagation()
  formMode.value = 'update'
  selectedItem.value = item
  showItemForm.value = true
}

const handleItemFormClose = async () => {
  showItemForm.value = false
  selectedItem.value = null
  await fetchConstructionDetail(constructionId)
}

const handleItemSubmit = async (item) => {
  try {
    if (formMode.value === 'create') {
      const itemData = {
        ...item,
        constructionID: parseInt(constructionId)
      }
      console.log('Creating item with data:', itemData) // Debug log
      await createConstructionItem(itemData)
      showMessage('Tạo hạng mục thành công', 'success')
    } else {
      const updateData = {
        ...item,
        id: selectedItem.value.id
      }
      console.log('Updating item with data:', updateData) // Debug log
      await updateConstructionItem(selectedItem.value.id, updateData)
      showMessage('Cập nhật hạng mục thành công', 'success')
    }
    await fetchConstructionDetail(constructionId)
    handleItemFormClose()
  } catch (error) {
    console.error('Error submitting item:', error)
    showMessage(error.response?.data?.message || 'Không thể thực hiện thao tác', 'error')
  }
}

const handleStatusSubmit = async (data) => {
  try {
    const { newStatus, item } = data
    await updateConstructionItemStatus(item.id, newStatus)
    await fetchConstructionDetail(constructionId)
    showMessage('Cập nhật trạng thái thành công', 'success')
  } catch (error) {
    console.error('Error updating status:', error)
    showMessage('Không thể cập nhật trạng thái', 'error')
  } finally {
    showStatusDialog.value = false
    selectedItem.value = null
  }
}

const normalizeStatusName = (statusName) => {
  const statusMap = {
    'Chờ khởi công': 'Chờ khởi công',
    'Đang thi công': 'Đang thi công',
    'Tạm dừng': 'Tạm dừng',
    'Hoàn thành': 'Hoàn thành',
    'Hủy bỏ': 'Hủy bỏ',
  }
  return statusMap[statusName] || statusName
}

const getStatusId = (statusName) => {
  const statusEntry = Object.entries(STATUS).find(([_, value]) => value.name === statusName)
  return statusEntry ? statusEntry[1].id : null
}

const getStatusNameById = (statusId) => {
  const status = Object.values(STATUS).find(s => s.id === statusId)
  return status ? status.name : null
}

const handleStatusChange = async (item, event) => {
  event.stopPropagation()
  selectedItem.value = {
    ...item,
    id: item.id,
    statusName: item.constructionItemStatusName,
    status: item.constructionItemStatusName
  }
  showStatusDialog.value = true
}

const formatDate = (date) => {
  if (!date) return 'Chưa cập nhật'
  return new Date(date).toLocaleDateString('vi-VN')
}

const API_BASE_URL = computed(() => {
  const baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL
  // Remove /api from the end if it exists
  return baseUrl.endsWith('/api')
    ? baseUrl.slice(0, -4)
    : baseUrl
})

const imageUrl = ref(null)
const imageLoadError = ref(false)
const imageLoading = ref(false)

const getImageUrl = (path) => {
  if (!path) {
    console.log('No image path provided')
    return null
  }

  // Debug log
  console.log('Original path:', path)

  // Nếu path đã là URL đầy đủ
  if (path.startsWith('http')) {
    console.log('Using full URL:', path)
    return path
  }

  // Nếu path là đường dẫn tương đối
  const baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL
  const cleanBaseUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl
  const fullUrl = `${cleanBaseUrl}/${path}`
  console.log('API Base URL:', cleanBaseUrl)
  console.log('Constructed URL:', fullUrl)
  return fullUrl
}

const loadImage = async () => {
  if (!selectedConstruction.value?.designBlueprint) {
    imageUrl.value = null
    imageLoadError.value = false
    return
  }

  imageLoading.value = true
  imageLoadError.value = false

  try {
    const url = getImageUrl(selectedConstruction.value.designBlueprint)
    console.log('Loading image from URL:', url)

    // Kiểm tra kết nối
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    imageUrl.value = url
    imageLoadError.value = false
  } catch (error) {
    console.error('Error loading image:', error)
    imageUrl.value = null
    imageLoadError.value = true
  } finally {
    imageLoading.value = false
  }
}

watch(() => selectedConstruction.value?.designBlueprint, () => {
  loadImage()
}, { immediate: true })

const retryLoadImage = () => {
  loadImage()
}

const handleImageError = (e) => {
  console.error('Image load error:', {
    src: e.target.src,
    alt: e.target.alt,
    error: e
  })
  imageLoadError.value = true
  imageLoading.value = false
  // Không set lại src để tránh vòng lặp
}

const handleImageLoad = () => {
  console.log('Image loaded successfully')
  imageLoadError.value = false
  imageLoading.value = false
}

const handleImageClick = () => {
  if (!imageUrl.value || imageLoadError.value) {
    console.log('Cannot open image modal - URL invalid or load error')
    return
  }

  selectedImage.value = {
    fullUrl: imageUrl.value,
    uploadDate: selectedConstruction.value.startDate
  }
  showImageModal.value = true
}

onMounted(() => {
  imageLoadError.value = false
  imageLoading.value = false
})

const showImageModal = ref(false)
const selectedImage = ref(null)

const downloadDesign = async () => {
  try {
    if (!selectedConstruction.value?.designBlueprint) {
      showMessage('Không có file thiết kế', 'warning')
      return
    }

    const imageUrl = getImageUrl(selectedConstruction.value.designBlueprint)
    if (!imageUrl) {
      showMessage('Không thể tải file thiết kế', 'error')
      return
    }

    // Tải ảnh và chuyển thành blob
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Không thể tải file')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    // Tạo link tải xuống
    const link = document.createElement('a')
    link.href = url
    link.download = `design_${selectedConstruction.value.constructionName}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showMessage('Tải file thiết kế thành công', 'success')
  } catch (error) {
    console.error('Error downloading design file:', error)
    showMessage('Không thể tải file thiết kế', 'error')
  }
}

const calculateRemainingDays = (endDate) => {
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

// Thêm hàm kiểm tra kết nối
const checkImageAvailability = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Error checking image availability:', error)
    return false
  }
}

// Sửa lại computed để kiểm tra kết nối
const designImageUrl = computed(async () => {
  if (!selectedConstruction.value?.designBlueprint) {
    imageLoadError.value = false
    return null
  }
  const url = getImageUrl(selectedConstruction.value.designBlueprint)
  console.log('Checking image availability:', url)

  try {
    const isAvailable = await checkImageAvailability(url)
    if (!isAvailable) {
      console.error('Image not available at URL:', url)
      imageLoadError.value = true
      return null
    }
    imageLoadError.value = false
    return url
  } catch (error) {
    console.error('Error in designImageUrl computed:', error)
    imageLoadError.value = true
    return null
  }
})

// Thêm state cho zoom
const isZoomed = ref(false)
const zoomScale = ref(1)
const zoomPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// Hàm xử lý zoom
const handleZoom = () => {
  if (!imageUrl.value || imageLoadError.value) return
  isZoomed.value = !isZoomed.value
  // Reset về vị trí giữa khi zoom
  zoomScale.value = 1
  zoomPosition.value = { x: 0, y: 0 }
}

// Hàm xử lý wheel
const handleWheel = (e) => {
  if (!isZoomed.value) return
  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(1, Math.min(3, zoomScale.value + delta))
  zoomScale.value = newScale
}

// Hàm xử lý drag
const handleMouseDown = (e) => {
  if (!isZoomed.value) return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - zoomPosition.value.x,
    y: e.clientY - zoomPosition.value.y
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  zoomPosition.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

// Thêm event listeners khi component mount/unmount
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isZoomed.value) {
      handleZoom()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="container-fluid py-4">
    <div v-if="selectedConstruction" class="construction-detail">
      <!-- Header Section -->
      <div class="header-section mb-4">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h1 class="construction-title mb-2">{{ selectedConstruction.constructionName }}</h1>
            <div class="construction-meta">
              <span class="meta-item">
                <i class="fas fa-map-marker-alt"></i>
                {{ selectedConstruction.location }}
              </span>
              <span class="meta-item">
                <i class="fas fa-calendar"></i>
                {{ formatDate(selectedConstruction.startDate) }} - {{
                  formatDate(selectedConstruction.expectedCompletionDate) }}
              </span>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end">
            <StatusBadge :status="selectedConstruction.statusName" class="mb-2" />
            <button class="btn btn-outline-primary btn-sm">
              <i class="fas fa-file-download me-1"></i>
              Tải bản thiết kế
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="stat-content">
              <h3>Loại công trình</h3>
              <p>{{ selectedConstruction.constructionTypeName || 'Chưa xác định' }}</p>
              <!-- Nếu không có constructionType -->
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-ruler-combined"></i>
            </div>
            <div class="stat-content">
              <h3>Tổng diện tích</h3>
              <p>{{ selectedConstruction.totalArea }}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-content">
              <h3>Số hạng mục</h3>
              <p>{{ selectedConstruction.constructionItems.length }} hạng mục</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <h3>Thời gian còn lại</h3>
              <p>{{ calculateRemainingDays(selectedConstruction.expectedCompletionDate) }} ngày</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div class="content-tabs">
        <ul class="nav nav-tabs nav-tabs-custom">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'info' }" @click.prevent="activeTab = 'info'" href="#">
              <i class="fas fa-info-circle me-2"></i>
              Thông tin chung
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'items' }" @click.prevent="activeTab = 'items'"
              href="#">
              <i class="fas fa-list me-2"></i>
              Hạng mục thi công
            </a>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content p-4 bg-white rounded-bottom shadow-sm">
          <!-- Thông tin chung -->
          <div v-show="activeTab === 'info'" class="fade-in">
            <div class="row g-4">
              <div class="col-md-8">
                <div class="info-section">
                  <h2 class="section-title">
                    <i class="fas fa-info-circle me-2"></i>
                    Chi tiết công trình
                  </h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Loại công trình</label>
                      <p>{{ selectedConstruction.constructionTypeName || 'Chưa xác định' }}</p>
                      <!-- Nếu không có constructionType -->
                    </div>
                    <div class="info-item">
                      <label>Tổng diện tích</label>
                      <p>{{ selectedConstruction.totalArea }}</p>
                    </div>
                    <div class="info-item">
                      <label>Ngày khởi công</label>
                      <p>{{ formatDate(selectedConstruction.startDate) }}</p>
                    </div>
                    <div class="info-item">
                      <label>Ngày dự kiến hoàn thành</label>
                      <p>{{ formatDate(selectedConstruction.expectedCompletionDate) }}</p>
                    </div>
                    <div class="info-item full-width">
                      <label>Địa điểm xây dựng</label>
                      <p>{{ selectedConstruction.location }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="document-section">
                  <h2 class="section-title">
                    <i class="fas fa-file-alt me-2"></i>
                    Tài liệu thiết kế
                  </h2>
                  <div class="document-card">
                    <div v-if="imageLoading" class="design-preview">
                      <div class="image-loading">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    </div>
                    <template v-else-if="imageUrl && !imageLoadError">
                      <div class="design-preview" :class="{ 'zoomed': isZoomed }" @click="handleZoom">
                        <div class="zoom-container">
                          <div class="image-wrapper">
                            <img :src="imageUrl" :alt="selectedConstruction?.constructionName || 'Bản thiết kế'"
                              class="design-image" :style="isZoomed ? {
                                transform: `scale(${zoomScale})`,
                                cursor: isDragging ? 'grabbing' : 'grab'
                              } : {}" @wheel="handleWheel" @mousedown="handleMouseDown" @error="handleImageError"
                              @load="handleImageLoad" loading="lazy" />
                          </div>
                        </div>
                        <div class="design-overlay" v-if="!isZoomed">
                          <div class="overlay-content">
                            <button class="btn btn-light btn-sm me-2" @click.stop="downloadDesign"
                              :disabled="imageLoadError">
                              <i class="fas fa-download me-1"></i>
                              Tải xuống
                            </button>
                            <span class="text-light">
                              <i class="fas fa-search-plus me-1"></i>
                              Click để phóng to
                            </span>
                          </div>
                        </div>
                        <div v-if="isZoomed" class="zoom-controls">
                          <button class="btn btn-light btn-sm" @click.stop="handleZoom">
                            <i class="fas fa-times"></i>
                          </button>
                          <div class="zoom-info">
                            <i class="fas fa-search-plus me-1"></i>
                            {{ Math.round(zoomScale * 100) }}%
                          </div>
                        </div>
                        <div v-if="isZoomed" class="zoom-exit-message">
                          <div class="message-content">
                            <i class="fas fa-mouse-pointer me-2"></i>
                            Click bất kỳ đâu để thoát
                          </div>
                        </div>
                      </div>
                    </template>
                    <div v-else class="no-design">
                      <div class="document-icon">
                        <i class="fas fa-exclamation-circle text-warning"></i>
                      </div>
                      <div class="document-info">
                        <h4>{{ imageLoadError ? 'Không thể kết nối đến server' : 'Chưa có bản thiết kế' }}</h4>
                        <p class="text-muted">
                          {{ imageLoadError ? 'Vui lòng kiểm tra kết nối và thử lại' : 'Bản thiết kế chưa được tải lên'
                          }}
                        </p>
                        <button v-if="imageLoadError" class="btn btn-outline-primary btn-sm mt-2"
                          @click="retryLoadImage">
                          <i class="fas fa-sync-alt me-1"></i>
                          Thử lại
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hạng mục thi công -->
          <div v-show="activeTab === 'items'" class="fade-in">
            <div class="table-toolbar mb-3 d-flex justify-content-between align-items-center">
              <h2 class="section-title mb-0">
                <i class="fas fa-list me-2"></i>
                Danh sách hạng mục
              </h2>
              <button class="btn btn-primary" @click="handleAddItem">
                <i class="fas fa-plus me-2"></i>
                Thêm Hạng Mục
              </button>
            </div>
            <DataTable :columns="constructionItemColumns" :data="paginatedItems"
              class="custom-table">
              <template #id="{ item }">
                <div class="fw-medium text-primary">HM-{{ item.id }}</div>
              </template>

              <template #startDate="{ item }">
                <div class="date-info">
                  <i class="fas fa-calendar text-muted me-1"></i>
                  {{ formatDate(item.startDate) }}
                </div>
              </template>

              <template #expectedCompletionDate="{ item }">
                <div class="date-info">
                  <i class="fas fa-calendar-check text-muted me-1"></i>
                  {{ formatDate(item.expectedCompletionDate) }}
                </div>
              </template>

              <template #constructionItemName="{ item }">
                <div class="volume-info">
                  <span class="fw-medium">{{ item.constructionItemName }}</span>
                </div>
              </template>

              <template #constructionItemStatusName="{ item }">
                <StatusBadge :status="item.constructionItemStatusName" />
              </template>

              <template #actions="{ item }">
                <div class="d-flex justify-content-center gap-2">
                  <UpdateButton @click="(e) => handleUpdateItem(item, e)" />
                  <ChangeStatusButton @click="(e) => handleStatusChange(item, e)" />
                </div>
              </template>
            </DataTable>

            <!-- Add pagination -->
            <div class="d-flex justify-content-between align-items-center mt-4">
              <div class="text-muted">
                Hiển thị {{ paginatedItems.length }} trên {{ selectedConstruction?.constructionItems?.length || 0 }}
                hạng mục
              </div>
              <Pagination :total-items="selectedConstruction?.constructionItems?.length || 0"
                :items-per-page="itemsPerPage" :current-page="currentPage" @update:currentPage="handlePageChange" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <ModalDialog v-model:show="showItemForm" :title="formMode === 'create' ? 'Thêm Hạng Mục' : 'Cập Nhật Hạng Mục'"
      size="lg">
      <ConstructionItemForm :mode="formMode" :item="selectedItem" @submit="handleItemSubmit"
        @cancel="handleItemFormClose" />
    </ModalDialog>

    <StatusChangeDialog v-if="showStatusDialog && selectedItem" :show="showStatusDialog" :item="selectedItem"
      type="item" title="Thay Đổi Trạng Thái Hạng Mục" @update:show="showStatusDialog = $event"
      @submit="handleStatusSubmit" />

    <!-- Add task details section -->
    <div v-if="selectedItem" class="task-details mt-4">
      <div class="card">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Chi tiết hạng mục: {{ selectedItem.constructionItemName }}</h5>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" @click="handleUpdateItem(selectedItem, $event)">
              <i class="fas fa-edit me-1"></i>
              Cập nhật
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="handleStatusChange(selectedItem, $event)">
              <i class="fas fa-exchange-alt me-1"></i>
              Đổi trạng thái
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <div class="info-group">
                <label class="fw-bold">Ngày bắt đầu:</label>
                <p>{{ formatDate(selectedItem.startDate) }}</p>
              </div>
              <div class="info-group">
                <label class="fw-bold">Ngày kết thúc dự kiến:</label>
                <p>{{ formatDate(selectedItem.expectedCompletionDate) }}</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-group">
                <label class="fw-bold">Khối lượng:</label>
                <p>{{ selectedItem.totalVolume }} {{ selectedItem.unitName }}</p>
              </div>
              <div class="info-group">
                <label class="fw-bold">Trạng thái:</label>
                <StatusBadge :status="selectedItem.constructionItemStatusName" />
              </div>
            </div>
            <div class="col-12">
              <div class="progress-section">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold">Tiến độ thực hiện</span>
                  <span class="badge bg-info">{{ selectedItem.completionPercentage || 0 }}%</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar" role="progressbar"
                    :style="{ width: (selectedItem.completionPercentage || 0) + '%' }"
                    :aria-valuenow="selectedItem.completionPercentage || 0" aria-valuemin="0" aria-valuemax="100">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Image Zoom Modal -->
    <ModalDialog v-if="imageUrl && !imageLoadError" :show="showImageModal" @update:show="showImageModal = $event"
      title="Xem Chi Tiết Bản Thiết Kế" size="xl">
      <div class="image-zoom-container">
        <div class="image-wrapper">
          <div v-if="imageLoading" class="image-loading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <img v-show="!imageLoading" :src="imageUrl" :alt="selectedConstruction?.constructionName || 'Bản thiết kế'"
            class="img-zoom" @error="handleImageError" @load="handleImageLoad" loading="lazy" />
        </div>
        <div class="image-info mt-3">
          <div class="text-muted small">
            <i class="fas fa-calendar me-1"></i>
            Ngày tạo: {{ formatDate(selectedConstruction?.startDate) }}
          </div>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style scoped>
.construction-detail {
  animation: fadeIn 0.3s ease-out;
}

.header-section {
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.construction-title {
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 600;
}

.construction-meta {
  display: flex;
  gap: 1.5rem;
  color: #6c757d;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #f8f9fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #007bff;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-content p {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.nav-tabs-custom {
  border: none;
  margin-top: 2rem;
}

.nav-tabs-custom .nav-link {
  border: none;
  padding: 1rem 1.5rem;
  color: #6c757d;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-tabs-custom .nav-link:hover {
  color: #007bff;
  background: rgba(0, 123, 255, 0.05);
}

.nav-tabs-custom .nav-link.active {
  color: #007bff;
  background: white;
  border-top: 3px solid #007bff;
}

.section-title {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  display: block;
}

.info-item p {
  margin: 0;
  color: #2c3e50;
  font-weight: 500;
}

.document-card {
  background: #f8f9fa;
  border-radius: 0.5rem;
  overflow: hidden;
}

.design-preview {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 10px;
  border: 1.5px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.design-preview.zoomed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  border: none;
  border-radius: 0;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: none;
}

.zoom-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.design-preview.zoomed .image-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.design-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}

.design-preview.zoomed .design-image {
  position: relative;
  width: auto;
  height: auto;
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.1s ease;
}

.design-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

.design-preview:hover .design-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.zoom-controls {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 0.5rem;
  backdrop-filter: none;
}

.zoom-info {
  color: white;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.25rem;
}

.no-design {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.no-design .document-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-design h4 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.no-design p {
  font-size: 0.9rem;
  margin: 0;
}

.custom-table {
  margin-bottom: 2rem;
}

.custom-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.custom-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.custom-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.date-info {
  font-size: 0.875rem;
  color: #495057;
}

.volume-info {
  font-size: 0.875rem;
}

.action-btn {
  padding: 0.25rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.gap-2 {
  gap: 0.5rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Thêm styles cho dialog */
:deep(.modal-body) {
  padding: 1.5rem;
}

:deep(.status-change-form) {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

:deep(.form-group) {
  margin-bottom: 1.5rem;
}

:deep(.status-options) {
  margin-top: 1rem;
}

:deep(.modal-footer) {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

/* Styles cho table actions */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-button {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.action-button:hover {
  transform: scale(1.1);
}

/* Đảm bảo padding cho table cells giống nhau */
:deep(.table td),
:deep(.table th) {
  padding: 1rem;
  vertical-align: middle;
}

:deep(.table th) {
  background: #f8f9fa;
  font-weight: 600;
  white-space: nowrap;
}

:deep(.table tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.table tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.info-group {
  margin-bottom: 1rem;
}

.info-group label {
  display: block;
  margin-bottom: 0.25rem;
  color: #495057;
}

.info-group p {
  margin: 0;
  color: #2c3e50;
}

.progress-section {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.progress {
  background-color: #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
}

.progress-bar {
  background-color: #3498db;
  transition: width 0.6s ease;
}

.task-details .card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-details .card-header {
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-bottom: 1px solid #eee;
}

.image-zoom-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem;
}

.img-zoom {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  will-change: transform;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}

.image-info {
  width: 100%;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1;
}

.zoom-exit-message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background: rgba(13, 110, 253, 0.85);
  padding: 1rem 2rem;
  border-radius: 2rem;
  backdrop-filter: blur(4px);
  animation: fadeInUp 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message-content {
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-content i {
  font-size: 1.3rem;
  animation: bounce 2s infinite;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, 1rem);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-3px);
  }

  60% {
    transform: translateY(-2px);
  }
}
</style>
