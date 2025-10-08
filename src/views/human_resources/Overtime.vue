<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useOvertimeRequest } from '../../composables/useOvertimeRequest'
import ModalDialog from '@/components/common/ModalDialog.vue'
import OvertimeForm from '@/components/common/overtime/OvertimeForm.vue'

const {
  overtimeRequests,
  loading,
  fetchOvertimeRequests,
  createOvertimeRequest,
  updateOvertimeRequest,
  deleteOvertimeRequest
} = useOvertimeRequest()

onMounted(async () => {
  await fetchOvertimeRequests()
})

const overtimeColumns = [
  { key: 'voucherCode', label: 'Số phiếu' },
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'userName', label: 'Tên nhân viên' },
  { key: 'overtimeTypeName', label: 'Loại tăng ca' },
  { key: 'overtimeFormName', label: 'Hình thức tăng ca' },
  { key: 'coefficient', label: 'Hệ số' },
  { key: 'startDateTime', label: 'Ngày bắt đầu' },
  { key: 'endDateTime', label: 'Ngày kết thúc' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' }
]

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedItem = ref(null)

const handleCreate = async (formData) => {
  try {
    await createOvertimeRequest(formData)
    showCreateForm.value = false
  } catch (error) {
    console.error('Error creating overtime request:', error)
  }
}

const handleUpdate = async (formData) => {
  try {
    await updateOvertimeRequest(formData.voucherCode, formData)
    showUpdateForm.value = false
  } catch (error) {
    console.error('Error updating overtime request:', error)
  }
}

const handleDelete = async (voucherCode) => {
  if (confirm('Bạn có chắc chắn muốn xóa đơn tăng ca này?')) {
    try {
      await deleteOvertimeRequest(voucherCode)
    } catch (error) {
      console.error('Error deleting overtime request:', error)
    }
  }
}

const openUpdateForm = (voucherCode) => {
  selectedItem.value = overtimeRequests.value.find(item => item.voucherCode === voucherCode)
  showUpdateForm.value = true
}

const currentPage = ref(1)
const itemsPerPage = ref(8)
const paginatedOvertimeData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return overtimeRequests.value.slice(start, start + itemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="adjustment-title mb-0">Danh sách đơn tăng ca</h4>
      <button class="btn btn-primary" style="min-width:120px" @click="showCreateForm = true">
        <i class="fas fa-plus me-2"></i>Thêm
      </button>
    </div>
    <div class="table-responsive adjustment-table">
      <DataTable :columns="overtimeColumns" :data="paginatedOvertimeData">
        <template #actions="{ item }">
          <button class="table-action-btn" title="Sửa" @click="openUpdateForm(item.voucherCode)">
            <i class="fas fa-edit"></i>
          </button>
          <button class="table-action-btn delete" title="Xóa" @click="handleDelete(item.voucherCode)">
            <i class="fas fa-trash"></i>
          </button>
        </template>
        <template #approveStatus="{ item }">
          <span :class="[
            'status-badge',
            item.approveStatus === 'Đã duyệt' ? 'approved' : item.approveStatus === 'Chờ duyệt' ? 'pending' : 'rejected'
          ]">
            {{ item.approveStatus }}
          </span>
        </template>
        <template #startDateTime="{ item }">
          {{ new Date(item.startDateTime).toLocaleString('vi-VN') }}
        </template>
        <template #endDateTime="{ item }">
          {{ new Date(item.endDateTime).toLocaleString('vi-VN') }}
        </template>
      </DataTable>
    </div>
    <Pagination
    :totalItems="overtimeRequests.length"
    :itemsPerPage="itemsPerPage"
    :currentPage="currentPage"
    @update:currentPage="currentPage = $event"
    />
  </div>
  <ModalDialog v-model:show="showCreateForm" title="Thêm đơn tăng ca" size="lg">
    <OvertimeForm mode="create" @submit="handleCreate" @close="showCreateForm = false" />
  </ModalDialog>
  <ModalDialog v-model:show="showUpdateForm" title="Sửa đơn tăng ca" size="lg">
    <OvertimeForm mode="update" :overtime="selectedItem" @submit="handleUpdate" @close="showUpdateForm = false" />
  </ModalDialog>
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
  box-shadow: 0 2px 12px rgba(13,110,253,0.07);
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

