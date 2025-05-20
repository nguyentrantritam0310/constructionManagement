<script setup>
import { computed, ref } from 'vue'
import ModalDialog from './ModalDialog.vue'
import StatusBadge from './StatusBadge.vue'
import api from '../../api.js'

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
  }
})

const emit = defineEmits(['update:show', 'reject', 'approve'])

// Thêm state cho modal zoom ảnh
const showImageModal = ref(false)
const selectedImage = ref(null)

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

const handleReject = () => {
  emit('reject', props.report)
  emit('update:show', false)
}

const handleApprove = () => {
  emit('approve', props.report)
  emit('update:show', false)
}

const handleImageError = (e) => {
  console.error('Failed to load image:', e.target.src)
  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
}

const handleImageClick = (attachment) => {
  selectedImage.value = attachment
  showImageModal.value = true
}

const apiBaseUrl = computed(() => {
  const baseUrl = api.defaults.baseURL || 'http://localhost:5244'
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
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="(value) => emit('update:show', value)"
    title="Chi Tiết Báo Cáo"
    size="lg"
  >
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

      <!-- Ảnh đính kèm -->
      <div v-if="hasAttachments" class="mb-3">
        <div class="text-muted small mb-2">
          <i class="fas fa-images me-1"></i>Ảnh đính kèm
          <span class="text-muted">({{ formattedAttachments.length }} ảnh)</span>
        </div>
        <div class="row g-3">
          <div v-for="attachment in formattedAttachments" :key="attachment.id" class="col-12 col-md-4">
            <div class="img-sample position-relative">
              <img
                :src="attachment.fullUrl"
                :alt="'Ảnh ' + attachment.id"
                class="img-fluid shadow-sm"
                @error="handleImageError"
                @click="handleImageClick(attachment)"
              />
              <div class="img-upload-date text-muted small text-center mt-2">
                <i class="fas fa-clock me-1"></i>
                {{ formatDate(attachment.uploadDate) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Nút thao tác -->
      <div v-if="showActions" class="d-flex justify-content-end gap-2 mt-4">
        <button class="btn btn-outline-danger" @click="handleReject">
          <i class="fas fa-times-circle me-1"></i> Từ chối
        </button>
        <button class="btn btn-primary" @click="handleApprove">
          <i class="fas fa-check-circle me-1"></i> Duyệt
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- Modal Zoom Ảnh -->
  <ModalDialog
    v-if="selectedImage"
    :show="showImageModal"
    @update:show="showImageModal = $event"
    title="Xem Chi Tiết Ảnh"
    size="xl"
  >
    <div class="image-zoom-container">
      <img
        :src="selectedImage.fullUrl"
        :alt="'Ảnh ' + selectedImage.id"
        class="img-zoom"
        @error="handleImageError"
      />
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
</style>
