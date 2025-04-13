<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'

const route = useRoute()

const project = ref(null)

const projects = [
  {
    projectCode: 'P001',
    projectName: 'Công trình A',
    location: '123 Đường ABC, TP.HCM',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'In Progress',
    workItems: [
      { id: 1, name: 'Móng Block A', startDate: '2024-01-15', endDate: '2024-03-15', status: 'In Progress' },
      { id: 2, name: 'Tường Block A', startDate: '2024-03-16', endDate: '2024-05-15', status: 'Not Started' }
    ]
  },
  {
    projectCode: 'P002',
    projectName: 'Công trình B',
    location: '456 Đường XYZ, TP.HCM',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    status: 'Completed',
    workItems: []
  }
]

onMounted(() => {
  const projectCode = route.query.projectCode
  project.value = projects.find(p => p.projectCode === projectCode) || null
})

const workItemColumns = [
  { key: 'name', label: 'Tên Hạng Mục' },
  { key: 'startDate', label: 'Ngày Bắt Đầu' },
  { key: 'endDate', label: 'Ngày Kết Thúc' },
  { key: 'status', label: 'Trạng Thái' }
]
</script>

<template>
  <div v-if="project" class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4">{{ project.projectName }}</h2>
      <StatusBadge :status="project.status" />
    </div>

    <p><strong>Địa điểm:</strong> {{ project.location }}</p>
    <p><strong>Ngày bắt đầu:</strong> {{ project.startDate }}</p>
    <p><strong>Ngày kết thúc:</strong> {{ project.endDate }}</p>

    <h3 class="h5 mt-4">Danh Sách Hạng Mục</h3>
    <DataTable :columns="workItemColumns" :data="project.workItems" />
  </div>
  <div v-else class="container-fluid py-4">
    <p>Không tìm thấy thông tin công trình.</p>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
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
