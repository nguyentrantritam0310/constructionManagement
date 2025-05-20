<script setup>
import { computed } from 'vue'
import DataTable from '../common/DataTable.vue'

const props = defineProps({
  stockOut: {
    type: Object,
    required: true
  },
  actualQuantities: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'confirm'])

const columns = [
  { key: 'materialId', label: 'Mã Vật Tư' },
  { key: 'name', label: 'Tên Vật Tư' },
  { key: 'stock', label: 'Số Lượng Tồn' },
  { key: 'actual', label: 'Số Lượng Xuất' },
  { key: 'remaining', label: 'Số Lượng Còn Lại' },
  { key: 'unit', label: 'Đơn Vị' },
  { key: 'status', label: 'Trạng Thái' }
]

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

const totalItems = computed(() => props.actualQuantities.length)
</script>

<template>
  <div class="stock-out-detail">
    <!-- Header Section -->
    <div class="detail-header mb-4">
      <div class="row g-4">
        <div class="col-md-8">
          <div class="project-info card">
            <div class="card-body">
              <h4 class="project-name">
                <i class="fas fa-building me-2 text-primary"></i>
                {{ stockOut.constructionName }}
              </h4>
              <div class="project-meta mt-3">
                <div class="meta-item">
                  <i class="fas fa-tasks text-muted"></i>
                  <span>Hạng mục: {{ stockOut.constructionItemName }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-calendar-alt text-muted"></i>
                  <span>Ngày xuất: {{ formatDate(stockOut.exportDate) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-user text-muted"></i>
                  <span>Người xuất: {{ stockOut.employeeName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Materials Table Section -->
    <div class="materials-section">
      <h5 class="section-title mb-3">
        <i class="fas fa-boxes me-2"></i>
        Chi Tiết Vật Tư Xuất Kho
      </h5>

      <DataTable
        :columns="columns"
        :data="actualQuantities"
      >
        <!-- Material ID Column -->
        <template #materialId="{ item }">
          <div>
            <span class="fw-bold text-primary">VT-{{ item.id }}</span>
          </div>
        </template>

        <!-- Name Column -->
        <template #name="{ item }">
          <div><b>{{ item.name }}</b></div>
        </template>

        <!-- Stock Column -->
        <template #stock="{ item }">
          <div class="text-center">
            <span>
              {{ item.stock }}
            </span>
          </div>
        </template>

        <!-- Actual Column -->
        <template #actual="{ item }">
          <div class="text-center">
            <span>
              {{ item.actual }}
            </span>
          </div>
        </template>

        <!-- Remaining Column -->
        <template #remaining="{ item }">
          <div class="text-center">
            <span :class="item.remaining >= 0 ? 'success' : 'warning'">
              {{ item.remaining }}
            </span>
          </div>
        </template>

        <!-- Unit Column -->
        <template #unit="{ item }">
          <span>{{ item.unitOfMeasurement }}</span>
        </template>

        <!-- Status Column -->
        <template #status="{ item }">
          <div class="text-center">
            <span class="status-badge" :class="item.remaining >= 0 ? 'success' : 'warning'">
              {{ item.remaining >= 0 ? 'Đủ số lượng' : 'Thiếu hàng' }}
            </span>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.stock-out-detail {
  background: #fff;
  border-radius: 0.75rem;
}

.detail-header {
  margin-bottom: 2rem;
}

.project-info.card {
  border: none;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  border-radius: 1rem;
}

.project-name {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0;
}

.project-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.95rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.meta-item i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.stat-card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

.section-title {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Table Customization */
.materials-table :deep(.table) {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.materials-table :deep(th) {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  padding: 1rem;
  font-size: 0.9rem;
}

.code-badge {
  background: #eff6ff;
  color: #3b82f6;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.9rem;
}

.material-name {
  font-weight: 500;
  color: #334155;
}

.quantity-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.quantity-badge.stock {
  background: #f1f5f9;
  color: #475569;
}

.quantity-badge.export {
  background: #e0f2fe;
  color: #0369a1;
}

.quantity-badge.success {
  background: #f0fdf4;
  color: #166534;
}

.quantity-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.unit-text {
  color: #64748b;
  font-size: 0.9rem;
}

.btn {
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #1e293b;
}

@media (max-width: 768px) {
  .project-meta {
    grid-template-columns: 1fr;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .quantity-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
  }
}
</style>
