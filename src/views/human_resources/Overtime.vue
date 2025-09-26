<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'

const adjustmentColumns = [
  { key: 'no', label: 'Số phiếu' },
  { key: 'creator', label: 'Mã nhân viên' },
  { key: 'decisionDate', label: 'Tên nhân viên' },
  { key: 'value', label: 'loại nghỉ phép' },
  { key: 'monthYear', label: 'Ngày bắt đầu' },
  { key: 'type', label: 'Ngày kết thúc' },
  { key: 'category', label: 'Ca làm việc ' },
  { key: 'reason', label: 'Lý do' },
  { key: 'status', label: 'Trạng thái' },
 
]

const adjustmentData = Array.from({ length: 15 }, (_, i) => ({
  no: `PT${202500 + i}`,
  creator: `Người lập ${i + 1}`,
  decisionDate: `0${(i % 9) + 1}/0${(i % 12) + 1}/2025`,
  value: `${(i + 1) * 1000000} VNĐ`,
  monthYear: `${(i % 12) + 1}/2025`,
  type: ['Khen thưởng', 'Kỷ luật', 'Tạm ứng', 'Truy thu', 'Thu nhập khác'][i % 5],
  category: ['Chi tiết A', 'Chi tiết B', 'Chi tiết C'][i % 3],
  reason: ['Hoàn thành xuất sắc', 'Vi phạm nội quy', 'Ứng lương', 'Truy thu sai sót', 'Thu nhập ngoài'][i % 5],
  status: i % 3 === 0 ? 'Đã duyệt' : (i % 3 === 1 ? 'Chờ duyệt' : 'Từ chối')
}))

const currentPage = ref(1)
const itemsPerPage = ref(8)
const paginatedAdjustmentData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return adjustmentData.slice(start, start + itemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="adjustment-title mb-0">Danh sách đơn tăng ca</h4>
      <button class="btn btn-primary" style="min-width:120px">
        <i class="fas fa-plus me-2"></i>Thêm
      </button>
    </div>
    <div class="table-responsive adjustment-table">
      <DataTable :columns="adjustmentColumns" :data="paginatedAdjustmentData">
        <template #actions="{ item }">
          <button class="table-action-btn" title="Xem chi tiết">
            <i class="fas fa-eye"></i>
          </button>
          <button class="table-action-btn" title="Sửa">
            <i class="fas fa-edit"></i>
          </button>
          <button class="table-action-btn delete" title="Xóa">
            <i class="fas fa-trash"></i>
          </button>
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
      <Pagination
        :totalItems="adjustmentData.length"
        :itemsPerPage="itemsPerPage"
        :currentPage="currentPage"
        @update:currentPage="currentPage = $event"
      />
    </div>
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

