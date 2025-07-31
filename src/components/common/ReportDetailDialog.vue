<script setup>
import { computed, ref } from 'vue'
import ModalDialog from './ModalDialog.vue'
import StatusBadge from './StatusBadge.vue'
import api from '../../api.js'
import Pagination from './Pagination.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  report: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'reject', 'approve', 'resubmit', 'edit'])

// Thêm state cho modal zoom ảnh
const showImageModal = ref(false)
const selectedImage = ref(null)

const statusNote = ref('')
const showStatusNoteInput = ref(false)
const pendingAction = ref(null) // 'approve' or 'reject'

// Add pagination state
const statusLogsPerPage = 4
const currentStatusPage = ref(1)

const paginatedStatusLogs = computed(() => {
  const start = (currentStatusPage.value - 1) * statusLogsPerPage
  const end = start + statusLogsPerPage
  return props.report.statusLogs.slice(start, end)
})

const totalStatusPages = computed(() => {
  return Math.ceil(props.report.statusLogs.length / statusLogsPerPage)
})

const handleStatusPageChange = (page) => {
  currentStatusPage.value = page
}

const formatDate = (date) => {
  if (!date) return 'Chưa cập nhật'
  return new Date(date).toLocaleDateString('vi-VN')
}

const getStatusLabel = (status) => {
  switch (status) {
    case 0:
      return 'Pending'
    case 1:
      return 'Approved'
    case 2:
      return 'Rejected'
    case 3:
      return 'Completed'
    default:
      return 'Không xác định'
  }
}

const handleStatusAction = (action) => {
  pendingAction.value = action
  showStatusNoteInput.value = true
}

const confirmStatusAction = () => {
  if (pendingAction.value === 'approve') {
    emit('approve', props.report, statusNote.value)
  } else {
    emit('reject', props.report, statusNote.value)
  }
  showStatusNoteInput.value = false
  statusNote.value = ''
  pendingAction.value = null
}

const cancelStatusAction = () => {
  showStatusNoteInput.value = false
  statusNote.value = ''
  pendingAction.value = null
}

const PLACEHOLDER_SRC = '/img/image-not-found.png'

const handleImageError = (e) => {
  if (!e.target.src.includes('image-not-found.png')) {
    e.target.src = PLACEHOLDER_SRC
  }
}

const handleImageClick = (attachment) => {
  selectedImage.value = attachment
  showImageModal.value = true
}

const apiBaseUrl = computed(() => {
  const baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL
  // Remove /api from the end if it exists
  return baseUrl.endsWith('/api')
    ? baseUrl.slice(0, -4)
    : baseUrl
})

const formattedAttachments = computed(() => {
  if (!props.report.attachments) return []

  return props.report.attachments.map(attachment => {
    // Remove leading slash if exists
    const cleanPath = attachment.filePath.startsWith('/') ? attachment.filePath.slice(1) : attachment.filePath

    // Construct full URL
    const fullUrl = `${apiBaseUrl.value}/${cleanPath}`
    console.log('Image URL:', fullUrl) // Debug log

    return {
      ...attachment,
      fullUrl
    }
  })
})

const hasAttachments = computed(() => {
  return props.report.attachments && props.report.attachments.length > 0
})

const getLatestStatusLog = computed(() => {
  if (!props.report.statusLogs || props.report.statusLogs.length === 0) return null
  return props.report.statusLogs[0] // Assuming logs are ordered by date descending
})

const getStatusNoteLabel = computed(() => {
  const status = getLatestStatusLog.value?.status
  if (status === 1) return 'Giải pháp đề xuất'
  if (status === 2) return 'Lý do từ chối'
  return null
})

const getStatusIcon = (status) => {
  switch (status) {
    case 0:
      return 'fa-clock text-warning'
    case 1:
      return 'fa-check-circle text-success'
    case 2:
      return 'fa-times-circle text-danger'
    case 3:
      return 'fa-check-double text-info'
    default:
      return 'fa-question-circle text-secondary'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 0:
      return 'Chờ xử lý'
    case 1:
      return 'Đã duyệt'
    case 2:
      return 'Đã từ chối'
    case 3:
      return 'Hoàn thành'
    default:
      return 'Không xác định'
  }
}

const canResubmit = computed(() => {
  const currentStatus = props.report.statusLogs[0]?.status
  return currentStatus === 2 // Rejected
})

const handleResubmit = () => {
  emit('resubmit', props.report)
}

const handleEdit = () => {
  emit('edit', props.report)
}

const canEdit = computed(() => {
  const currentStatus = props.report.statusLogs[0]?.status
  return currentStatus === 0 || currentStatus === 2 // Pending or Rejected
})
</script>

<template>
  <ModalDialog :show="show" @update:show="(value) => emit('update:show', value)" title="Chi Tiết Báo Cáo" size="lg">
    <div class="report-detail-modal">
      <!-- Header: Ngày tạo + Công trình + badge + trạng thái -->
      <div class="header mb-4 pb-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between">
          <div>
            <div class="text-muted small mb-1">
              <i class="fas fa-calendar-alt me-1"></i>Ngày tạo:
              <span class="fw-medium">{{ formatDate(report.reportDate) }}</span>
            </div>
            <div class="d-flex align-items-center gap-3 flex-wrap">
              <i class="fas fa-building fa-2x text-primary"></i>
              <div>
                <div class="fw-bold fs-5 mb-1">{{ report.constructionName }}</div>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="badge badge-type">
                    <i class="fas fa-exclamation-circle me-1"></i>
                    {{ report.reportType }}
                  </span>
                  <span class="badge badge-level" :class="report.level">
                    <i class="fas fa-signal me-1"></i>
                    {{ report.level }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <span class="text-muted small"><i class="fas fa-info-circle me-1"></i>Trạng thái:</span>
            <StatusBadge :status="getStatusLabel(report.statusLogs[0].status)" />
          </div>
        </div>
      </div>

      <!-- Mô tả full width -->
      <div class="row mb-3">
        <div class="col-12 mb-3">
          <div class="text-muted small mb-1"><i class="fas fa-align-left me-1"></i>Mô tả vấn đề</div>
          <div class="bg-light rounded p-3">{{ report.content }}</div>
        </div>
      </div>

      <!-- Status Note Section -->
      <div v-if="getLatestStatusLog && (getLatestStatusLog.status === 1 || getLatestStatusLog.status === 2)"
        class="row mb-3">
        <div class="col-12">
          <div class="text-muted small mb-1">
            <i class="fas"
              :class="getLatestStatusLog.status === 1 ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'"></i>
            {{ getStatusNoteLabel }}
          </div>
          <div class="bg-light rounded p-3 status-note">
            {{ getLatestStatusLog.note }}
            <div class="text-muted small mt-2">
              <i class="fas fa-clock me-1"></i>
              {{ formatDate(getLatestStatusLog.reportDate) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Ảnh đính kèm -->
      <div v-if="hasAttachments" class="mb-3">
        <div class="text-muted small mb-2">
          <i class="fas fa-images me-1"></i>Ảnh đính kèm
          <span class="text-muted">({{ formattedAttachments.length }} ảnh)</span>
        </div>
        <div class="row g-3">
          <div v-for="attachment in formattedAttachments" :key="attachment.id" class="col-12 col-md-4">
            <div class="img-sample position-relative">
              <img :src="attachment.fullUrl" :alt="'Ảnh ' + attachment.id" class="img-fluid shadow-sm"
                @error="handleImageError" @click="handleImageClick(attachment)" />
              <div class="img-upload-date text-muted small text-center mt-2">
                <i class="fas fa-clock me-1"></i>
                {{ formatDate(attachment.uploadDate) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status History Timeline -->
      <div class="row mb-3">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="text-muted small">
              <i class="fas fa-history me-1"></i>Lịch sử trạng thái
            </div>
            <div class="text-muted small">
              Hiển thị {{ paginatedStatusLogs.length }} trên {{ report.statusLogs.length }} trạng thái
            </div>
          </div>
          <div class="status-timeline">
            <div v-for="(log, index) in paginatedStatusLogs" :key="log.id" class="status-timeline-item"
              :class="{ 'is-latest': index === 0 && currentStatusPage === 1 }">
              <div class="status-timeline-icon">
                <i class="fas" :class="getStatusIcon(log.status)"></i>
              </div>
              <div class="status-timeline-content">
                <div class="status-timeline-header">
                  <span class="status-badge" :class="getStatusLabel(log.status).toLowerCase()">
                    {{ getStatusText(log.status) }}
                  </span>
                  <span class="status-date">
                    <i class="fas fa-clock me-1"></i>
                    {{ formatDate(log.reportDate) }}
                  </span>
                </div>
                <div v-if="log.note" class="status-note mt-2">
                  {{ log.note }}
                </div>
              </div>
            </div>
          </div>
          <!-- Pagination -->
          <div v-if="totalStatusPages > 1" class="d-flex justify-content-center mt-3">
            <Pagination :total-items="report.statusLogs.length" :items-per-page="statusLogsPerPage"
              :current-page="currentStatusPage" @update:currentPage="handleStatusPageChange" />
          </div>
        </div>
      </div>

      <!-- Nút thao tác -->
      <div v-if="showActions" class="d-flex flex-column gap-3 mt-4">
        <!-- Status note input -->
        <div v-if="showStatusNoteInput" class="status-note-input">
          <div class="form-group">
            <label class="form-label">Ghi chú:</label>
            <textarea v-model="statusNote" class="form-control" rows="3"
              :placeholder="pendingAction === 'approve' ? 'Nhập ghi chú khi duyệt...' : 'Nhập ghi chú khi từ chối...'"></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-2">
            <button class="btn btn-secondary" @click="cancelStatusAction">
              Hủy
            </button>
            <button class="btn" :class="pendingAction === 'approve' ? 'btn-primary' : 'btn-danger'"
              @click="confirmStatusAction">
              {{ pendingAction === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối' }}
            </button>
          </div>
        </div>

        <!-- Action buttons -->
        <div v-else class="d-flex justify-content-end gap-2">
          <template v-if="props.canEdit">
            <!-- Resubmit button - only show for rejected reports -->
            <button v-if="canResubmit" class="btn btn-warning" @click="handleResubmit"
              title="Gửi lại báo cáo để xem xét">
              <i class="fas fa-redo me-1"></i> Gửi lại báo cáo
            </button>
            <!-- Edit button - show for pending or rejected reports -->
            <button v-if="canEdit" class="btn btn-primary" @click="handleEdit" title="Chỉnh sửa nội dung báo cáo">
              <i class="fas fa-edit me-1"></i> Chỉnh sửa
            </button>
          </template>
          <template v-else>
            <button class="btn btn-outline-danger" @click="handleStatusAction('reject')">
              <i class="fas fa-times-circle me-1"></i> Từ chối
            </button>
            <button class="btn btn-primary" @click="handleStatusAction('approve')">
              <i class="fas fa-check-circle me-1"></i> Duyệt
            </button>
          </template>
        </div>
      </div>
    </div>
  </ModalDialog>

  <!-- Modal Zoom Ảnh -->
  <ModalDialog v-if="selectedImage" :show="showImageModal" @update:show="showImageModal = $event"
    title="Xem Chi Tiết Ảnh" size="xl">
    <div class="image-zoom-container">
      <img :src="selectedImage.fullUrl" :alt="'Ảnh ' + selectedImage.id" class="img-zoom" @error="handleImageError" />
      <div class="image-info mt-3">
        <div class="text-muted small">
          <i class="fas fa-clock me-1"></i>
          Ngày tải lên: {{ formatDate(selectedImage.uploadDate) }}
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.report-detail-modal {
  background: #fafdff;
  border-radius: 1.2rem;
  padding: 1.2rem 1rem 0.5rem 1rem;
}

.report-detail-modal .header {
  border-bottom: 1.5px solid #e3f0fa;
  margin-bottom: 1.2rem;
  padding-bottom: 1rem;
}

.report-detail-modal .badge-type {
  background: #e3f0fa;
  color: #1976d2;
  font-weight: 500;
  font-size: 0.98rem;
  padding: 0.45em 1em;
  border-radius: 1.2em;
}

.report-detail-modal .badge-level {
  font-weight: 500;
  font-size: 0.98rem;
  padding: 0.45em 1em;
  border-radius: 1.2em;
}

.report-detail-modal .badge-level.Cao {
  background: #fff3cd;
  color: #856404;
}

.report-detail-modal .badge-level[class*="Trung"] {
  background: #d1ecf1;
  color: #0c5460;
}

.report-detail-modal .badge-level.Thấp {
  background: #d4edda;
  color: #155724;
}

.report-detail-modal .badge-level.Nghiêm {
  background: #f8d7da;
  color: #721c24;
}

.report-detail-modal .img-sample img {
  border-radius: 10px;
  border: 1.5px solid #e0e0e0;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.report-detail-modal .img-sample img:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 24px rgba(21, 101, 192, 0.12);
}

.report-detail-modal .img-upload-date {
  margin-top: 0.5rem;
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
}

.image-info {
  width: 100%;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-note-input {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
}

.status-note-input .form-label {
  font-weight: 500;
  color: #495057;
}

.status-note-input textarea {
  resize: none;
  border-radius: 0.375rem;
  border-color: #ced4da;
}

.status-note-input textarea:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.status-note {
  border-left: 4px solid;
  border-color: var(--bs-primary);
  background-color: #f8f9fa;
}

.status-note .text-muted {
  font-size: 0.85rem;
}

.status-timeline {
  position: relative;
  padding: 1rem 0;
}

.status-timeline::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1.25rem;
  height: 100%;
  width: 2px;
  background: #e3f0fa;
}

.status-timeline-item {
  position: relative;
  padding-left: 3rem;
  padding-bottom: 1.5rem;
}

.status-timeline-item:last-child {
  padding-bottom: 0;
}

.status-timeline-item.is-latest .status-timeline-icon {
  background: #fff;
  border: 2px solid var(--bs-primary);
}

.status-timeline-icon {
  position: absolute;
  left: 0.75rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #e3f0fa;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.status-timeline-icon i {
  font-size: 1rem;
}

.status-timeline-content {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-badge {
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.completed {
  background: #cce5ff;
  color: #004085;
}

.status-date {
  color: #6c757d;
  font-size: 0.85rem;
}

.status-note {
  color: #495057;
  font-size: 0.95rem;
  line-height: 1.5;
  background: #fff;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border-left: 3px solid var(--bs-primary);
}

/* Add styles for pagination container */
.status-timeline+.d-flex {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e3f0fa;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
  transition: all 0.2s ease;
}

.btn-warning:hover {
  background-color: #ffca2c;
  border-color: #ffc720;
  color: #000;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
