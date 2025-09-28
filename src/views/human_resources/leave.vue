<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import { useEmployeeRequest } from '../../composables/useEmployeeRequest'
import ActionButton from '@/components/common/ActionButton.vue'
const {
  employeeRequests,
  fetchEmployeeRequests,
} = useEmployeeRequest()
onMounted(async () => {
  await fetchEmployeeRequests()
})
const adjustmentColumns = [
  { key: 'voucherCode', label: 'Số phiếu' },
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'userName', label: 'Tên nhân viên' },
  { key: 'leaveTypeName', label: 'loại nghỉ phép' },
  { key: 'startDateTime', label: 'Ngày bắt đầu' },
  { key: 'endDateTime', label: 'Ngày kết thúc' },
  { key: 'category', label: 'Ca làm việc ' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' },

]

const adjustmentData = computed(() => {
  return employeeRequests.value
  .filter(request => request.leaveTypeName != null) 
  .map((request) => ({
    ...request,
  }))
})

const currentPage = ref(1)
const itemsPerPage = ref(8)
const paginatedAdjustmentData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return adjustmentData.value.slice(start, start + itemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="adjustment-title mb-0">Danh sách đơn nghỉ phép</h4>
      <div class="d-flex gap-2" >

        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateForm = true">
          Thêm
        </ActionButton>
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel('shift')">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
      </div>
    </div>
    <div class="table-responsive adjustment-table">
      <DataTable :columns="adjustmentColumns" :data="paginatedAdjustmentData">
        <template #actions="{ item }">
          <div class="d-flex justify-content-center gap-2">
            <UpdateButton @click.stop="openUpdateForm(item.id)" />
            <ChangeStatusButton @click.stop="openStatusDialog(item)" />
          </div>
        </template>
        <template #status="{ item }">
          <span :class="[
            'status-badge',
            item.status === 'Đã duyệt' ? 'approved' : item.status === 'Chờ duyệt' ? 'pending' : 'rejected'
          ]">
            {{ item.status }}
          </span>
        </template>
      </DataTable>
    </div>
    <Pagination :totalItems="adjustmentData.length" :itemsPerPage="itemsPerPage" :currentPage="currentPage"
      @update:currentPage="currentPage = $event" />
  </div>
</template>

<style scoped>
.adjustment-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0d6efd;
  letter-spacing: 0.5px;
}

.adjustment-table {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(13, 110, 253, 0.07);
  padding: 0;
  margin-bottom: 0;
}

.table th {
  background-color: #f5f7fa;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  min-width: 100px;
  font-size: 1rem;
  font-weight: 600;
  color: #0d6efd;
}

.table td,
.table th {
  padding: 0.75rem;
  vertical-align: middle;
}

.table tr {
  transition: background 0.18s;
}

.table tr:hover {
  background: #f0f6ff;
}

.table-action-btn {
  background: none;
  border: none;
  color: #0d6efd;
  font-size: 1.15rem;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.table-action-btn.delete {
  color: #ff6b6b;
}

.table-action-btn:hover {
  background: #e9ecef;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: #fff;
}

.status-badge.approved {
  background: #28a745;
}

.status-badge.pending {
  background: #ffc107;
  color: #222;
}

.status-badge.rejected {
  background: #ff6b6b;
}
</style>
