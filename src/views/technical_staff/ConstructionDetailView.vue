<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '../../components/common/StatusBadge.vue'
import DataTable from '../../components/common/DataTable.vue'
import UpdateButton from '../../components/common/UpdateButton.vue'
import ChangeStatusButton from '../../components/common/ChangeStatusButton.vue'
import ChangeStatusDialog from '../../components/common/ChangeStatusDialog.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ChangeStatusForm from '../../components/common/ChangeStatusForm.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useToast } from '../../composables/useToast'
import ActionButton from '../../components/common/ActionButton.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ConstructionItemForm from '../../components/construction/ConstructionItemForm.vue'

const route = useRoute()
const router = useRouter()
const constructionId = route.params.id
const construction = ref(null)
const activeTab = ref('info')
const showStatusDialog = ref(false)
const selectedItem = ref(null)
const { selectedConstruction, fetchConstructionDetail } = useConstructionManagement()
const { showSuccess, showError } = useToast()
const showItemForm = ref(false)
const formMode = ref('add')

onMounted(async () => {
  console.log('construction ID:', constructionId) // Debug constructionId
  await fetchConstructionDetail(constructionId) // Gọi API để lấy thông tin chi tiết công trình
  console.log('Selected construction:', selectedConstruction.value) // Debug dữ liệu sau khi gọi API
  try {
    console.log('Construction ID:', constructionId) // Debug constructionId
    await fetchConstructionDetail(constructionId) // Gọi API để lấy thông tin chi tiết công trình
    console.log('Selected Construction:', selectedConstruction.value) // Debug dữ liệu sau khi gọi API
    construction.value = selectedConstruction.value
    construction.value.constructionItems = selectedConstruction.value.constructionItems
  } catch (error) {
    console.error('Error fetching construction details:', error)
    showError('Không thể tải thông tin công trình')
  }
})

const constructionItemColumns = [
  { key: 'id', label: 'Mã hạng mục' },
  { key: 'constructionItemName', label: 'Tên hạng mục' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày kết thúc' },
  { key: 'totalVolume', label: 'Tổng khối lượng' },
  { key: 'unit', label: 'Đơn vị' },
  { key: 'statusName', label: 'Trạng thái' }
]

const handleItemClick = (item) => {
  router.push(`/construction-plan-management?itemId=${item.id}`)
}

const handleUpdateItem = (item, event) => {
  event.stopPropagation()
  console.log('Update construction item:', item)
  // Xử lý cập nhật hạng mục
}

const handleStatusChange = async (itemId, newStatus) => {
  try {
    // Tìm hạng mục cần cập nhật
    const itemIndex = construction.value.constructionItems.findIndex(
      item => item.id === itemId
    )

    if (itemIndex === -1) {
      throw new Error('Không tìm thấy hạng mục')
    }

    // Cập nhật trạng thái
    construction.value.constructionItems[itemIndex].status = newStatus
    showSuccess('Cập nhật trạng thái thành công')
  } catch (error) {
    console.error('Error updating item status:', error)
    showError('Không thể cập nhật trạng thái hạng mục')
  }
}

const handleStatusSubmit = (newStatus) => {
  if (selectedItem.value) {
    // Cập nhật trạng thái của hạng mục
    const itemIndex = construction.value.constructionItems.findIndex(
      item => item.id === selectedItem.value.id
    )
    if (itemIndex !== -1) {
      construction.value.constructionItems[itemIndex].status = newStatus
    }
  }
  showStatusDialog.value = false
  selectedItem.value = null
}

const formatDate = (date) => {
  if (!date) return 'Chưa cập nhật'
  return new Date(date).toLocaleDateString('vi-VN')
}

const downloadDesign = async () => {
  try {
    console.log('Downloading design file:', construction.value.designFile)
    // Implement download logic here
    showSuccess('Tải file thiết kế thành công')
  } catch (error) {
    console.error('Error downloading design file:', error)
    showError('Không thể tải file thiết kế')
  }
}

const calculateRemainingDays = (endDate) => {
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const handleItemSubmit = (item) => {
  // Handle item submission
  console.log('Item submitted:', item)
  showItemForm.value = false
}
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
                {{ formatDate(selectedConstruction.startDate) }} - {{ formatDate(selectedConstruction.expectedCompletionDate) }}
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
              <p>{{ selectedConstruction.constructionTypeName || 'Chưa xác định' }}</p> <!-- Nếu không có constructionType -->
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
                      <p>{{ selectedConstruction.constructionType || 'Chưa xác định' }}</p> <!-- Nếu không có constructionType -->
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
                    Tài liệu
                  </h2>
                  <div class="document-card">
                    <div class="document-icon">
                      <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="document-info">
                      <h4>Bản thiết kế</h4>
                      <p>{{ selectedConstruction.designBlueprint }}</p>
                      <button class="btn btn-sm btn-primary" @click="downloadDesign">
                        <i class="fas fa-download me-1"></i>
                        Tải xuống
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hạng mục thi công -->
          <div v-show="activeTab === 'items'" class="fade-in">
            <div class="table-toolbar mb-3">
              <h2 class="section-title">
                <i class="fas fa-list me-2"></i>
                Danh sách hạng mục
              </h2>
            </div>
            <DataTable :columns="constructionItemColumns" :data="selectedConstruction.constructionItems"
              @row-click="handleItemClick" class="custom-table">
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
                  <span class="text-muted ms-1">{{ item.unit }}</span>
                </div>
              </template>

              <template #status="{ item }">
                <StatusBadge :status="item.status" type="construction" />
              </template>

              <template #actions="{ item }">
                <div class="d-flex justify-content-center gap-2">
                  <UpdateButton @click="(e) => handleUpdateItem(item, e)" />
                  <ChangeStatusButton @click="(e) => handleStatusChange(item.id, e)" />
                </div>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Dialog đổi trạng thái -->
    <ModalDialog v-if="selectedItem" :show="showStatusDialog" @update:show="showStatusDialog = $event"
      title="Đổi Trạng Thái Hạng Mục" size="md">
      <ChangeStatusForm :current-status="selectedItem.status" type="construction" @submit="handleStatusSubmit"
        @cancel="showStatusDialog = false" />
    </ModalDialog>

    <FormDialog v-model:show="showItemForm" :title="formMode === 'add' ? 'Thêm Hạng Mục' : 'Cập Nhật Hạng Mục'">
      <ConstructionItemForm
        :mode="formMode"
        :item="selectedItem"
        @submit="handleItemSubmit"
        @cancel="showItemForm = false"
      />
    </FormDialog>
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
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.document-icon {
  font-size: 2rem;
  color: #dc3545;
}

.document-info h4 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.document-info p {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
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
</style>
