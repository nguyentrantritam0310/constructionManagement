<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ReportForm from '../../components/common/ReportForm.vue'
import Pagination from '../../components/common/Pagination.vue'

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedReport = ref(null)

const reports = ref([
  {
    id: 1,
    employeeID: "manager1-id",
    constructionName: "Khu chung cư An Hòa Garden",
    constructionID: 1,
    reportDate: "2023-01-01T00:00:00",
    reportType: "Sự cố kĩ thuật",
    content: "Báo cáo tiến độ ngày 1",
    level: "Cao",
    problemType: "Chậm tiến độ",
    statusLogs: [
      {
        id: 1,
        reportID: 1,
        status: 0,
        note: "Đang chờ phê duyệt",
        reportDate: "2023-01-01T00:00:00"
      }
    ],
    attachments: [
      {
        id: 1,
        reportID: 1,
        filePath: "/uploads/report1.pdf",
        uploadDate: "2023-01-01T00:00:00"
      }
    ]
  }
])

const filteredReports = ref([])

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredReports.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const columns = [
  { key: 'id', label: 'Mã báo cáo' },
  { key: 'constructionName', label: 'Công trình' },
  { key: 'problemType', label: 'Loại vấn đề' },
  { key: 'content', label: 'Mô tả' },
  { key: 'level', label: 'Mức độ' },
  { key: 'statusLogs[0].status', label: 'Trạng thái' },
  { key: 'reportDate', label: 'Ngày báo cáo' }
]

const problemTypes = [
  { value: 'Chậm tiến độ', label: 'Chậm tiến độ' },
  { value: 'Thiếu vật liệu', label: 'Thiếu vật liệu' },
  { value: 'Sự cố thiết bị', label: 'Sự cố thiết bị' },
  { value: 'Vấn đề khác', label: 'Vấn đề khác' }
]

const securityLevels = [
  { value: 'Thấp', label: 'Thấp' },
  { value: 'Trung bình', label: 'Trung bình' },
  { value: 'Cao', label: 'Cao' },
  { value: 'Nghiêm trọng', label: 'Nghiêm trọng' }
]

const handleUpdateStatus = (report) => {
  selectedReport.value = report
  showUpdateForm.value = true
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const handleUpdateSubmit = (updatedReport) => {
  const index = reports.value.findIndex(r => r.id === updatedReport.id)
  if (index !== -1) {
    reports.value[index] = updatedReport
    showUpdateForm.value = false
    selectedReport.value = null
    alert('Cập nhật báo cáo thành công')
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 0:
      return 'Chờ phê duyệt'
    case 1:
      return 'Đã phê duyệt'
    case 2:
      return 'Đã từ chối'
    default:
      return 'Không xác định'
  }
}
</script>

<template>
  <div class="technical-report">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Báo Cáo Sự Cố Thi Công</h2>
      <ActionButton type="primary" icon="fas fa-plus" @click="showCreateForm = true">
        Tạo báo cáo mới
      </ActionButton>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter
      :items="reports"
      :searchFields="['constructionName', 'content', 'problemType']"
      dateField="reportDate"
      statusField="statusLogs[0].status"
      v-model:filteredItems="filteredReports"
    />

    <DataTable :columns="columns" :data="paginatedReports" class="report-table">
      <template #problemType="{ item }">
        <span :class="'badge bg-' + (item.problemType === 'Chậm tiến độ' ? 'warning' :
          item.problemType === 'Thiếu vật liệu' ? 'info' :
            item.problemType === 'Sự cố thiết bị' ? 'danger' : 'secondary')">
          {{item.problemType}}
        </span>
      </template>

      <template #level="{ item }">
        <span :class="'badge bg-' + (item.level === 'Nghiêm trọng' ? 'danger' :
          item.level === 'Cao' ? 'warning' :
            item.level === 'Trung bình' ? 'info' : 'success')">
          {{item.level}}
        </span>
      </template>

      <template #status="{ item }">
        <StatusBadge :status="getStatusLabel(item.statusLogs[0].status)" />
      </template>

      <template #reportDate="{ item }">
        {{ formatDate(item.reportDate) }}
      </template>

      <template #actions="{ item }">
        <ActionButton type="primary" icon="fas fa-edit" tooltip="Cập nhật trạng thái"
          @click="handleUpdateStatus(item)" />
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedReports.length }} trên {{ filteredReports.length }} báo cáo
      </div>
      <Pagination
        :total-items="filteredReports.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <!-- Form tạo báo cáo mới -->
    <FormDialog v-model:show="showCreateForm" title="Tạo Báo Cáo Mới">
      <ReportForm
        mode="create"
        reportType="incident"
        @submit="handleSubmit"
        @cancel="showCreateForm = false"
      />
    </FormDialog>

    <!-- Form cập nhật báo cáo -->
    <FormDialog v-if="selectedReport" v-model:show="showUpdateForm" title="Cập Nhật Báo Cáo">
      <ReportForm
        mode="update"
        reportType="incident"
        :report="selectedReport"
        @submit="handleUpdateSubmit"
        @cancel="showUpdateForm = false"
      />
    </FormDialog>
  </div>
</template>

<style scoped>
.technical-report {
  animation: fadeIn 0.3s ease-out;
}

.report-table {
  margin-bottom: 2rem;
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
