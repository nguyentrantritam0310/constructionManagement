<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import Pagination from '../../components/common/Pagination.vue'

const router = useRouter()

const {
  constructions,
  loading,
  error,
  fetchConstructions
} = useConstructionManagement()

onMounted(() => {
  fetchConstructions()
})

const filteredConstructions = ref([])

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedConstructions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredConstructions.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const columns = [
  { key: 'id', label: 'Mã công trình' },
  { key: 'constructionName', label: 'Tên công trình' },
  { key: 'location', label: 'Địa điểm' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'expectedCompletionDate', label: 'Ngày kết thúc' },
  { key: 'statusName', label: 'Trạng thái' }
]

const handleConstructionClick = (construction) => {
  router.push(`/construction-management/${construction.id}`)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Cập Nhật Trạng Thái Công Trình</h1>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter
      :items="constructions"
      :searchFields="['constructionName', 'location', 'id']"
      dateField="startDate"
      statusField="statusName"
      v-model:filteredItems="filteredConstructions"
    />

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <DataTable v-else :columns="columns" :data="paginatedConstructions" class="construction-table" @row-click="handleConstructionClick">
      <template #id="{ item }">
        <span class="fw-medium text-primary">CT-{{ item.id }}</span>
      </template>

      <template #constructionName="{ item }">
        <div>
          <div class="fw-medium">{{ item.constructionName }}</div>
        </div>
      </template>

      <template #location="{ item }">
        <div class="d-flex align-items-center">
          <i class="fas fa-map-marker-alt text-muted me-1"></i>
          {{ item.location }}
        </div>
      </template>

      <template #startDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar text-muted me-1"></i>
          {{ formatDate(item.startDate) }}
        </div>
      </template>

      <template #expectedCompletionDate="{ item }">
        <div class="date-info">
          <i class="fas fa-calendar-check text-muted me-1"></i>
          {{ formatDate(item.expectedCompletionDate) }}
        </div>
      </template>

      <template #statusName="{ item }">
        <StatusBadge :status="item.statusName" />
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedConstructions.length }} trên {{ filteredConstructions.length }} công trình
      </div>
      <Pagination
        :total-items="filteredConstructions.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

.construction-table {
  margin-bottom: 2rem;
}

.construction-table :deep(tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.construction-table :deep(tr:hover) {
  background-color: rgba(0, 123, 255, 0.05);
}

.date-info {
  font-size: 0.875rem;
  color: #495057;
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
