<script setup>
import { ref } from 'vue'
import DataTable from '../common/DataTable.vue'
import StatusBadge from '../common/StatusBadge.vue'
import ActionButton from '../common/ActionButton.vue'

const props = defineProps({
  reports: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-report-status'])

const columns = [
  { key: 'reportId', label: 'Mã báo cáo' },
  { key: 'projectName', label: 'Dự án' },
  { key: 'reportDate', label: 'Ngày báo cáo' },
  { key: 'reportType', label: 'Loại báo cáo' },
  { key: 'description', label: 'Mô tả' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'actions', label: 'Thao tác' }
]

const handleRowClick = (report) => {
  emit('row-click', report)
}

const getStatusVariant = (status) => {
  switch (status) {
    case 'Pending': return 'warning'
    case 'Resolved': return 'success'
    case 'In Progress': return 'info'
    case 'Rejected': return 'danger'
    default: return 'secondary'
  }
}
</script>

<template>
  <div class="report-list">
    <div class="card">
      <div class="card-body p-0">
        <DataTable
          :columns="columns"
          :data="reports"
          @row-click="handleRowClick"
          class="report-table"
        >
          <!-- Custom cell rendering for status -->
          <template #cell-status="{ item }">
            <StatusBadge
              :status="item.status"
              :variant="getStatusVariant(item.status)"
            />
          </template>

          <!-- Custom cell rendering for actions -->
          <template #cell-actions="{ item }">
            <div class="d-flex gap-2">
              <ActionButton
                icon="fas fa-edit"
                size="sm"
                variant="outline-primary"
                @click.stop="$emit('edit-report', item)"
                tooltip="Chỉnh sửa"
              />
              <ActionButton
                icon="fas fa-sync-alt"
                size="sm"
                variant="outline-warning"
                @click.stop="$emit('update-report-status', item)"
                tooltip="Cập nhật trạng thái"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-list {
  animation: fadeIn 0.3s ease-out;
}

.report-table {
  min-height: 400px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}
</style>