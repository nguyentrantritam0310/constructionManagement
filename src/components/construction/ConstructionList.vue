<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../common/DataTable.vue'
import StatusBadge from '../common/StatusBadge.vue'
import ActionButton from '../common/ActionButton.vue'
import Pagination from '../common/Pagination.vue'
import UpdateConstructionForm from './UpdateConstructionForm.vue'
import ModalDialog from '../common/ModalDialog.vue'
import UpdateButton from '../common/UpdateButton.vue'
import ChangeStatusButton from '../common/ChangeStatusButton.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

import StatusChangeDialog from '../common/StatusChangeDialog.vue'
import ConstructionForm from './ConstructionForm.vue'

const { selectedConstruction, fetchConstructionDetail, updateConstructionStatus, fetchConstructions } = useConstructionManagement()
const { showMessage } = useGlobalMessage()

const router = useRouter()
const props = defineProps({
  constructions: {
    // type: Array,
    required: true
  }
})

const emit = defineEmits(['update-status', 'update-construction', 'open-update-form', 'refresh-constructions'])

const showStatusDialog = ref(false)
const showUpdateDialog = ref(false)
const currentPage = ref(1)
const itemsPerPage = 5

const searchQuery = ref('')
const statusFilter = ref('')
const dateRangeFilter = ref({
  start: null,
  end: null
})

const columns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày BĐ', class: 'col-date' },
  { key: 'expectedCompletionDate', label: 'Ngày KTDK', class: 'col-date' },
  { key: 'actualCompletionDate', label: 'Ngày KTTT', class: 'col-date' },
  { key: 'statusName', label: 'Trạng thái', class: 'col-status' }
]

// Filtered constructions
const filteredConstructions = computed(() => {
  return props.constructions.filter(construction => {
    const matchesSearch = searchQuery.value === '' ||
      construction.constructionName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      construction.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      construction.id.toString().includes(searchQuery.value)

    const matchesStatus = statusFilter.value === '' ||
      construction.statusName === statusFilter.value

    const matchesDateRange = !dateRangeFilter.value.start || !dateRangeFilter.value.end ||
      (new Date(construction.startDate) >= new Date(dateRangeFilter.value.start) &&
        new Date(construction.startDate) <= new Date(dateRangeFilter.value.end))

    return matchesSearch && matchesStatus && matchesDateRange
  })
})

// Update paginated constructions to use filtered data
const paginatedConstructions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredConstructions.value.slice(start, end)
})

const handleRowClick = (construction) => {
  router.push(`/construction-management/${construction.id}`) // Chuyển đến trang chi tiết công trình
}

const handleStatusClick = (construction, event) => {
  event.stopPropagation()
  selectedConstruction.value = { ...construction }
  showStatusDialog.value = true
}

const closeStatusDialog = () => {
  showStatusDialog.value = false
}

const handleStatusChange = async (data) => {
  try {
    const { newStatus, item } = data
    await updateConstructionStatus(item.id, newStatus)
    emit('refresh-constructions') // Emit event to refresh the list
    showMessage('Cập nhật trạng thái thành công', 'success')
  } catch (error) {
    console.error('Error updating status:', error)
    showMessage('Không thể cập nhật trạng thái', 'error')
  }
}

const handleUpdateClick = async (construction, event) => {
  event.stopPropagation()
  emit('open-update-form', construction.id)
}

const closeUpdateDialog = () => {
  showUpdateDialog.value = false
}

const handleUpdateSubmit = async () => {
  try {
    await api.put(`/constructions/${selectedConstruction.value.id}`, selectedConstruction.value) // Gửi dữ liệu cập nhật
    alert('Cập nhật công trình thành công!')
    closeUpdateDialog()
    emit('refresh-constructions') // Phát sự kiện để làm mới danh sách công trình
  } catch (error) {
    console.error('Error updating construction:', error)
    alert('Cập nhật công trình thất bại!')
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

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRangeFilter.value = { start: null, end: null }
}
</script>

<template>
  <div class="construction-list">
    <!-- Search and Filter Section -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" class="form-control" v-model="searchQuery" placeholder="Tìm kiếm công trình...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Chờ khởi công">Chờ khởi công</option>
              <option value="Đang thi công">Đang thi công</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Hủy bỏ">Hủy bỏ</option>
            </select>
          </div>
          <div class="col-md-4">
            <div class="input-group">
              <input type="date" class="form-control" v-model="dateRangeFilter.start" placeholder="Từ ngày">
              <input type="date" class="form-control" v-model="dateRangeFilter.end" placeholder="Đến ngày">
            </div>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" @click="resetFilters">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Constructions Table -->
    <div class="card">
      <div class="card-body p-0">
        <DataTable :columns="columns" :data="paginatedConstructions" @row-click="handleRowClick"
          class="construction-table">
          <template #id="{ item }">
            <span class="fw-medium text-primary">CT-{{ item.id }}</span>
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

              <span v-if="formatDate(item.actualCompletionDate) === '1/1/1'" class="date-placeholder">
                (Chưa cập nhật)
              </span>
              <span v-else>
                <i class="fas fa-calendar-check text-muted"></i>
                {{ formatDate(item.actualCompletionDate, true) }}
              </span>
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
        Hiển thị {{ paginatedConstructions.length }} trên {{ filteredConstructions.length }} công trình
      </div>
      <Pagination :total-items="filteredConstructions.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Change Status Dialog -->
    <StatusChangeDialog v-if="showStatusDialog && selectedConstruction" :show="showStatusDialog"
      :item="selectedConstruction" type="construction" title="Thay Đổi Trạng Thái Công Trình"
      @update:show="showStatusDialog = $event" @submit="handleStatusChange" />

    <!-- Update Dialog -->
    <ModalDialog v-model:show="showUpdateDialog" title="Cập Nhật Công Trình" size="lg">
      <UpdateConstructionForm v-if="selectedConstruction" :construction="selectedConstruction"
        @cancel="closeUpdateDialog" @submit="handleUpdateSubmit" />
    </ModalDialog>
  </div>
</template>

<style scoped>
.construction-list {
  animation: fadeIn 0.3s ease-out;
}

.card {
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.construction-table {
  margin: 0;
}

.construction-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
  padding: 1rem;
  white-space: nowrap;
}

.construction-table :deep(td) {
  padding: 1rem;
  vertical-align: middle;
}

.date-placeholder {
  color: #5c5c5c;
  /* Xám nhẹ, hiện đại */
  font-size: 0.9rem;
  margin-left: 6px;
  letter-spacing: 0.3px;
  opacity: 0.85;
}

.construction-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.construction-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.construction-code {
  font-family: monospace;
  font-weight: 600;
  color: #2c3e50;
}

.construction-name {
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

.form-select:focus,
.form-control:focus {
  border-color: #ced4da;
  box-shadow: none;
}
</style>
