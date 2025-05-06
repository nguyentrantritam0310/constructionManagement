<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import FilterSearch from '../../components/common/FilterSearch.vue'
import Pagination from '../../components/common/Pagination.vue'

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

const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({ start: null, end: null })

const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    const matchesSearch = searchQuery.value === '' || project.projectName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || project.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProjects.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

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

    <!-- Bộ lọc và tìm kiếm -->
    <div class="card mb-4">
      <div class="card-body">
        <FilterSearch :searchQuery="searchQuery" :statusFilter="statusFilter" :dateRangeFilter="dateRangeFilter"
          @update:searchQuery="searchQuery = $event" @update:statusFilter="statusFilter = $event"
          @update:dateRangeFilter="dateRangeFilter = $event" @resetFilters="resetFilters" />
      </div>
    </div>

    <!-- Danh sách nhiệm vụ -->
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
            <tr v-for="project in paginatedProjects" :key="project.projectCode" @click="handleViewProject(project)"
              style="cursor: pointer;">
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

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedProjects.length }} trên {{ filteredProjects.length }} nhiệm vụ
      </div>
      <Pagination :total-items="filteredProjects.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
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
