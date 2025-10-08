<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useUser } from '../../composables/useUser'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import LeaveForm from '@/components/common/leave/LeaveForm.vue'

// Composables
const {
  leaveRequests,
  loading,
  fetchLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest
} = useLeaveRequest()

const { users, fetchUsers } = useUser()

// Leave types will be loaded from API in LeaveForm component

// Table columns
const leaveColumns = [
  { key: 'voucherCode', label: 'Số phiếu' },
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'userName', label: 'Tên nhân viên' },
  { key: 'leaveTypeName', label: 'Loại nghỉ phép' },
  { key: 'workShiftName', label: 'Ca làm việc' },
  { key: 'startDateTime', label: 'Ngày bắt đầu' },
  { key: 'endDateTime', label: 'Ngày kết thúc' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' }
]

// Form states
const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const showDeleteDialog = ref(false)
const selectedItem = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(8)

// Computed
const paginatedLeaveData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return leaveRequests.value.slice(start, start + itemsPerPage.value)
})

// Methods
const handleCreate = async (formData) => {
  try {
    await createLeaveRequest(formData)
    showCreateForm.value = false
  } catch (error) {
    console.error('Error creating leave request:', error)
  }
}

const handleUpdate = async (formData) => {
  try {
    await updateLeaveRequest(formData.voucherCode, formData)
    showUpdateForm.value = false
    selectedItem.value = null
  } catch (error) {
    console.error('Error updating leave request:', error)
  }
}

const handleDelete = async (voucherCode) => {
  try {
    await deleteLeaveRequest(voucherCode)
    showDeleteDialog.value = false
    selectedItem.value = null
  } catch (error) {
    console.error('Error deleting leave request:', error)
  }
}

const openUpdateForm = (voucherCode) => {
  selectedItem.value = leaveRequests.value.find(item => item.voucherCode === voucherCode)
  showUpdateForm.value = true
}

const openDeleteDialog = (voucherCode) => {
  selectedItem.value = leaveRequests.value.find(item => item.voucherCode === voucherCode)
  showDeleteDialog.value = true
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('vi-VN')
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchLeaveRequests(),
    fetchUsers()
  ])
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="adjustment-title mb-0">Danh sách đơn nghỉ phép</h4>
      <div class="d-flex gap-2">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateForm = true">
          Thêm
        </ActionButton>
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel('leave')">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
      </div>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>
    
    <!-- Data table -->
    <div v-else class="table-responsive adjustment-table">
      <DataTable :columns="leaveColumns" :data="paginatedLeaveData">
        <template #actions="{ item }">
          <div class="d-flex justify-content-center gap-2">
            <UpdateButton @click.stop="openUpdateForm(item.voucherCode)" />
            <button 
              class="btn btn-sm btn-outline-danger" 
              @click.stop="openDeleteDialog(item.voucherCode)"
              title="Xóa"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </template>
        <template #startDateTime="{ item }">
          {{ formatDateTime(item.startDateTime) }}
        </template>
        <template #endDateTime="{ item }">
          {{ formatDateTime(item.endDateTime) }}
        </template>
        <template #workShiftName="{ item }">
          {{ item.workShiftName || 'N/A' }}
        </template>
        <template #approveStatus="{ item }">
          <span :class="[
            'status-badge',
            item.approveStatus === 'Đã duyệt' ? 'approved' : 
            item.approveStatus === 'Chờ duyệt' ? 'pending' : 'rejected'
          ]">
            {{ item.approveStatus }}
          </span>
        </template>
      </DataTable>
    </div>
    
    <!-- Pagination -->
    <Pagination 
      :totalItems="leaveRequests.length" 
      :itemsPerPage="itemsPerPage" 
      :currentPage="currentPage"
      @update:currentPage="currentPage = $event" 
    />
  </div>
  
  <!-- Create Form Modal -->
  <ModalDialog v-model:show="showCreateForm" title="Thêm đơn nghỉ phép" size="lg">
    <LeaveForm 
      mode="create" 
      @submit="handleCreate" 
      @close="showCreateForm = false" 
    />
  </ModalDialog>
  
  <!-- Update Form Modal -->
  <ModalDialog v-model:show="showUpdateForm" title="Sửa đơn nghỉ phép" size="lg">
    <LeaveForm 
      mode="update" 
      :leave="selectedItem"
      @submit="handleUpdate" 
      @close="showUpdateForm = false" 
    />
  </ModalDialog>
  
  <!-- Delete Confirmation Modal -->
  <ModalDialog v-model:show="showDeleteDialog" title="Xác nhận xóa" size="md">
    <div class="text-center">
      <p>Bạn có chắc chắn muốn xóa đơn nghỉ phép <strong>{{ selectedItem?.voucherCode }}</strong>?</p>
      <div class="d-flex justify-content-center gap-2 mt-3">
        <button class="btn btn-outline-secondary" @click="showDeleteDialog = false">
          Hủy
        </button>
        <button class="btn btn-danger" @click="handleDelete(selectedItem?.voucherCode)">
          Xóa
        </button>
      </div>
    </div>
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
