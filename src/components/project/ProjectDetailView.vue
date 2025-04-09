<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/layout/Breadcrumb.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import DataTable from '../components/common/DataTable.vue'
import UpdateButton from '../components/common/UpdateButton.vue'
import ChangeStatusButton from '../components/common/ChangeStatusButton.vue'

// ... existing imports and code ...

const constructionItemColumns = [
  { key: 'name', label: 'Tên hạng mục' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày kết thúc' },
  { key: 'totalVolume', label: 'Tổng khối lượng' },
  { key: 'unit', label: 'Đơn vị' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'actions', label: 'Thao tác' }  // Thêm cột thao tác
]

// Thêm các hàm xử lý sự kiện
const handleUpdateItem = (item, event) => {
  event.stopPropagation()
  // Xử lý cập nhật hạng mục
  console.log('Update item:', item)
}

const handleStatusChange = (item, event) => {
  event.stopPropagation()
  // Xử lý đổi trạng thái
  console.log('Change status:', item)
}
</script>

<template>
  <!-- ... existing template code ... -->

  <!-- Cập nhật phần DataTable trong tab Hạng mục thi công -->
  <div v-show="activeTab === 'items'" class="fade-in">
    <div class="table-toolbar mb-3">
      <h2 class="section-title">
        <i class="fas fa-list me-2"></i>
        Danh sách hạng mục
      </h2>
    </div>
    <DataTable
      :columns="constructionItemColumns"
      :data="project.constructionItems"
      @row-click="handleItemClick"
      class="custom-table"
    >
      <template #status="{ item }">
        <StatusBadge :status="item.status" type="construction" />
      </template>

      <template #totalVolume="{ item }">
        <span class="fw-medium">{{ item.totalVolume }}</span>
        <span class="text-muted ms-1">{{ item.unit }}</span>
      </template>

      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton
            @click="(e) => handleUpdateItem(item, e)"
          />
          <ChangeStatusButton
            @click="(e) => handleStatusChange(item, e)"
          />
        </div>
      </template>
    </DataTable>
  </div>

  <!-- ... rest of the template ... -->
</template>

<style scoped>
/* ... existing styles ... */

/* Thêm styles cho các nút trong bảng */
.custom-table :deep(.action-btn) {
  opacity: 0.8;
  transition: all 0.2s ease;
}

.custom-table :deep(.action-btn:hover) {
  opacity: 1;
  transform: scale(1.1);
}

/* Cập nhật style cho hover effect của bảng */
.custom-table :deep(tr:hover) {
  background-color: rgba(0,123,255,0.05);
}

.custom-table :deep(td) {
  vertical-align: middle;
}
</style>