<script setup>
import { ref } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import StatusBadge from '../common/StatusBadge.vue'
import DataTable from '../common/DataTable.vue'

const props = defineProps({
  show: Boolean,
  item: Object
})

const emit = defineEmits(['update:show'])

const columns = [
  { key: 'planName', label: 'Tên Kế Hoạch' },
  { key: 'startDate', label: 'Ngày Bắt Đầu' },
  { key: 'endDate', label: 'Ngày Kết Thúc' },
  { key: 'supervisor', label: 'Người Phụ Trách' },
  { key: 'completedVolume', label: 'Khối Lượng Hoàn Thành' },
  { key: 'status', label: 'Trạng Thái' }
]

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="$emit('update:show', $event)"
    :title="`Chi Tiết Hạng Mục: ${item?.name}`"
    size="xl"
  >
    <div class="p-4">
      <!-- Thông tin hạng mục -->
      <div class="item-info mb-4">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="info-card">
              <h6 class="mb-2">Thông Tin Chung</h6>
              <div class="info-grid">
                <div class="info-item">
                  <label>Tên hạng mục:</label>
                  <span>{{ item?.name }}</span>
                </div>
                <div class="info-item">
                  <label>Trạng thái:</label>
                  <StatusBadge :status="item?.status" type="construction" />
                </div>
                <div class="info-item">
                  <label>Ngày bắt đầu:</label>
                  <span>{{ formatDate(item?.startDate) }}</span>
                </div>
                <div class="info-item">
                  <label>Ngày kết thúc:</label>
                  <span>{{ formatDate(item?.endDate) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="info-card">
              <h6 class="mb-2">Khối Lượng</h6>
              <div class="info-grid">
                <div class="info-item">
                  <label>Tổng khối lượng:</label>
                  <span>{{ item?.totalVolume }} {{ item?.unit }}</span>
                </div>
                <div class="info-item">
                  <label>Đã hoàn thành:</label>
                  <span>{{ item?.completedVolume || 0 }} {{ item?.unit }}</span>
                </div>
                <div class="info-item">
                  <label>Tiến độ:</label>
                  <div class="progress" style="height: 20px;">
                    <div
                      class="progress-bar"
                      :style="`width: ${(item?.completedVolume / item?.totalVolume) * 100}%`"
                    >
                      {{ Math.round((item?.completedVolume / item?.totalVolume) * 100) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danh sách kế hoạch -->
      <div class="plans-section">
        <h6 class="mb-3">Kế Hoạch Chi Tiết</h6>
        <DataTable
          :columns="columns"
          :data="item?.plans || []"
          class="custom-table"
        >
          <template #status="{ item }">
            <StatusBadge :status="item.status" type="construction" />
          </template>
          <template #completedVolume="{ item }">
            {{ item.completedVolume }} / {{ item.plannedVolume }} {{ item.unit }}
          </template>
        </DataTable>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.info-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-item label {
  color: #6c757d;
  min-width: 120px;
  margin: 0;
}

.progress {
  flex: 1;
  background-color: #e9ecef;
  border-radius: 0.25rem;
}

.progress-bar {
  background-color: #198754;
  color: white;
  text-align: center;
  line-height: 20px;
  border-radius: 0.25rem;
}

.custom-table :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
}

.custom-table :deep(td) {
  vertical-align: middle;
}
</style>