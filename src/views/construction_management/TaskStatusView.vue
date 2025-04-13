<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const projects = ref([
  {
    projectCode: 'P001',
    projectName: 'Công trình A',
    location: '123 Đường ABC, TP.HCM',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'In Progress'
  },
  {
    projectCode: 'P002',
    projectName: 'Công trình B',
    location: '456 Đường XYZ, TP.HCM',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    status: 'Completed'
  }
])

const handleViewProject = (project) => {
  router.push(`/project-management-leader/${project.projectCode}`)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Cập Nhật Trạng Thái Nhiệm Vụ</h1>
    </div>

    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Mã Công Trình</th>
              <th>Tên Công Trình</th>
              <th>Địa Điểm</th>
              <th>Ngày Khởi Công</th>
              <th>Ngày Dự Kiến Hoàn Thành</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.projectCode" @click="handleViewProject(project)" style="cursor: pointer;">
              <td>{{ project.projectCode }}</td>
              <td>{{ project.projectName }}</td>
              <td>{{ project.location }}</td>
              <td>{{ formatDate(project.startDate) }}</td>
              <td>{{ formatDate(project.endDate) }}</td>
              <td>
                <span :class="['badge', project.status === 'In Progress' ? 'bg-primary' : 'bg-success']">
                  {{ project.status }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary" @click.stop="handleViewProject(project)">
                  Xem Chi Tiết
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

.card {
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  white-space: nowrap;
}

.table td {
  vertical-align: middle;
}

.table-hover tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.badge {
  font-size: 0.875rem;
  padding: 0.5em 0.75em;
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
