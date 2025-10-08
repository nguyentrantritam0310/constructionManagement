<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { usePayrollAdjustment } from '../../composables/usePayrollAdjustment'
import ModalDialog from '@/components/common/ModalDialog.vue'
import AdjustmentForm from '@/components/common/adjustment/AdjustmentForm.vue'

const {
  payrollAdjustments,
  loading,
  error,
  fetchPayrollAdjustments,
  createPayrollAdjustment,
  updatePayrollAdjustment,
  deletePayrollAdjustment
} = usePayrollAdjustment()

onMounted(async () => {
  await fetchPayrollAdjustments()
})

const adjustmentColumns = [
  { key: 'voucherNo', label: 'Số phiếu' },
  { key: 'decisionDate', label: 'Ngày Quyết định' },
  { key: 'monthYear', label: 'Tháng - Năm' },
  { key: 'adjustmentTypeName', label: 'Khoản cộng trừ' },
  { key: 'adjustmentItemName', label: 'Hạng mục' },
  { key: 'totalValue', label: 'Tổng giá trị' },
  { key: 'employeeCount', label: 'Số nhân viên' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' },
]

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedItem = ref(null)

const adjustmentData = computed(() => {
  return payrollAdjustments.value.map(request => ({
    ...request,
    decisionDate: new Date(request.decisionDate)
      .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    monthYear: `${String(request.Month || request.month).padStart(2, '0')}/${request.Year || request.year}`,
    totalValue: (request.Employees || request.employees)?.reduce((sum, e) => sum + Math.abs(e.Value || e.value), 0) || 0,
    employeeCount: (request.Employees || request.employees)?.length || 0,
    // Ensure backward compatibility for display
    month: request.Month || request.month,
    year: request.Year || request.year,
    adjustmentTypeID: request.AdjustmentTypeID || request.adjustmentTypeID,
    adjustmentItemID: request.AdjustmentItemID || request.adjustmentItemID,
    reason: request.Reason || request.reason,
    employees: request.Employees || request.employees
  }))
})

const handleCreate = async (formData) => {
  try {
    await createPayrollAdjustment(formData)
    showCreateForm.value = false
  } catch (error) {
    console.error('Error creating adjustment:', error)
  }
}

const handleUpdate = async (formData) => {
  try {
    await updatePayrollAdjustment(formData.voucherNo, formData)
    showUpdateForm.value = false
  } catch (error) {
    console.error('Error updating adjustment:', error)
  }
}

const handleDelete = async (voucherNo) => {
  if (confirm('Bạn có chắc chắn muốn xóa khoản cộng trừ này?')) {
    try {
      await deletePayrollAdjustment(voucherNo)
    } catch (error) {
      console.error('Error deleting adjustment:', error)
    }
  }
}

const openUpdateForm = (voucherNo) => {
  selectedItem.value = adjustmentData.value.find(item => item.voucherNo === voucherNo)
  showUpdateForm.value = true
}

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
      <h4 class="adjustment-title mb-0">Danh sách khoản cộng trừ</h4>
      <button class="btn btn-primary" style="min-width:120px" @click="showCreateForm = true">
        <i class="fas fa-plus me-2"></i>Thêm
      </button>
    <ModalDialog v-model:show="showCreateForm" title="Thêm khoản cộng trừ" size="lg">
      <AdjustmentForm mode="create" @submit="handleCreate" @close="showCreateForm = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showUpdateForm" title="Sửa khoản cộng trừ" size="lg">
      <AdjustmentForm mode="update" :adjustment="selectedItem" @submit="handleUpdate" @close="showUpdateForm = false" />
    </ModalDialog>
    </div>
    <div class="table-responsive adjustment-table">
      <DataTable :columns="adjustmentColumns" :data="paginatedAdjustmentData">
        <template #actions="{ item }">
          <button class="table-action-btn" title="Xem chi tiết">
            <i class="fas fa-eye"></i>
          </button>
          <button class="table-action-btn" title="Sửa" @click="openUpdateForm(item.voucherNo)">
            <i class="fas fa-edit"></i>
          </button>
          <button class="table-action-btn delete" title="Xóa" @click="handleDelete(item.voucherNo)">
            <i class="fas fa-trash"></i>
          </button>
        </template>
        <template #status="{ item }">
          <span :class="[
            'status-badge',
            item.approveStatus === 'Đã duyệt' ? 'approved' : item.approveStatus === 'Chờ duyệt' ? 'pending' : 'rejected'
          ]">
            {{ item.approveStatus }}
          </span>
        </template>
      </DataTable>
    </div>
    <Pagination
      :totalItems="adjustmentData.length"
      :itemsPerPage="itemsPerPage"
      :currentPage="currentPage"
      @update:currentPage="currentPage = $event"
    />
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

