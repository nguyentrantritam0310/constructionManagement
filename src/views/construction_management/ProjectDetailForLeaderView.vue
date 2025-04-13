<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '@/components/common/Breadcrumb.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import DataTable from '../../components/common/DataTable.vue'
import UpdateButton from '../../components/common/UpdateButton.vue'
import ChangeStatusButton from '../../components/common/ChangeStatusButton.vue'
import ChangeStatusDialog from '../../components/common/ChangeStatusDialog.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ChangeStatusForm from '../../components/common/ChangeStatusForm.vue'
import MultiSelect from 'vue-multiselect'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id
const project = ref(null)
const activeTab = ref('info')
const showStatusDialog = ref(false)
const selectedItem = ref(null)
const selectedPlan = ref(null)
const showTaskAssignment = ref(false)
const selectedTask = ref(null)
const showAssignmentModal = ref(false)
const availableWorkers = ref([
  { id: 'worker1', name: 'Thợ 1' },
  { id: 'worker2', name: 'Thợ 2' },
  { id: 'worker3', name: 'Thợ 3' }
])
const selectedWorkers = ref([])

const breadcrumbItems = computed(() => [
    { text: 'Trang chủ', to: '/' },
    { text: 'Quản lý dự án', to: '/project-management' },
    { text: project.value?.projectName || 'Chi tiết dự án' }
])

// Giả lập dữ liệu dự án
onMounted(async () => {
    project.value = {
        id: projectId,
        projectName: 'Khu chung cư cao cấp The Sun',
        projectType: 'Chung cư cao tầng',
        location: '123 Đường ABC, Quận XYZ, TP.HCM',
        totalArea: '5000 m²',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'In Progress',
        designFile: 'thietke.pdf',
        constructionItems: [
            {
                id: 1,
                name: 'Móng Block A',
                description: 'Đổ móng cho Block A',
                startDate: '2024-01-15',
                endDate: '2024-03-15',
                totalVolume: 1000,
                unit: 'm³',
                status: 'In Progress'
            },
            {
                id: 2,
                name: 'Tường Block A',
                description: 'Xây tường Block A',
                startDate: '2024-03-16',
                endDate: '2024-05-15',
                totalVolume: 2000,
                unit: 'm²',
                status: 'Not Started'
            }
        ],
        constructionPlans: [
            {
                id: 1,
                name: 'Kế hoạch thi công móng',
                projectCode: 'P001',
                itemCode: 'I001',
                supervisor: 'Nguyễn Văn A',
                startDate: '2024-01-15',
                endDate: '2024-03-15',
                monthlyPlanVolume: 30,
                tasks: [
                    {
                        id: 'T001',
                        name: 'Đào móng',
                        unit: 'm³',
                        plannedVolume: 100,
                        currentVolume: 50,
                        progress: '40%'
                    },
                    {
                        id: 'T002',
                        name: 'Đổ bê tông móng',
                        unit: 'm³',
                        plannedVolume: 200,
                        currentVolume: 0,
                        progress: '0%'
                    }
                ]
            },
            {
                id: 2,
                name: 'Kế hoạch thi công tường',
                startDate: '2024-03-16',
                endDate: '2024-05-15',
                tasks: [
                    { id: 3, name: 'Xây tường tầng 1', assignedWorkers: 4, status: 'Not Started' },
                    { id: 4, name: 'Xây tường tầng 2', assignedWorkers: 6, status: 'Not Started' }
                ]
            }
        ]
    }
})

const constructionItemColumns = [
    { key: 'name', label: 'Tên hạng mục' },
    { key: 'startDate', label: 'Ngày bắt đầu' },
    { key: 'endDate', label: 'Ngày kết thúc' },
    { key: 'totalVolume', label: 'Tổng khối lượng' },
    { key: 'unit', label: 'Đơn vị' },
    { key: 'status', label: 'Trạng thái' }
]

const planColumns = [
    { key: 'name', label: 'Tên kế hoạch' },
    { key: 'projectCode', label: 'Mã công trình' },
    { key: 'itemCode', label: 'Mã hạng mục' },
    { key: 'supervisor', label: 'Chỉ huy phụ trách' },
    { key: 'startDate', label: 'Ngày bắt đầu' },
    { key: 'endDate', label: 'Ngày kết thúc' }
]

const taskColumns = [
    { key: 'id', label: 'Mã nhiệm vụ' },
    { key: 'name', label: 'Tên nhiệm vụ' },
    { key: 'unit', label: 'Đơn vị' },
    { key: 'plannedVolume', label: 'Khối lượng hoạch định' },
    { key: 'currentVolume', label: 'Khối lượng hiện tại' },
    { key: 'progress', label: 'Tiến độ' }
]

const handleItemClick = (item) => {
    router.push(`/construction-plan-management?itemId=${item.id}`)
}

const handleUpdateItem = (item, event) => {
    event.stopPropagation()
    console.log('Update construction item:', item)
    // Xử lý cập nhật hạng mục
}

const handleStatusChange = (item, event) => {
    event.stopPropagation()
    selectedItem.value = item
    showStatusDialog.value = true
}

const handleStatusSubmit = (newStatus) => {
    if (selectedItem.value) {
        // Cập nhật trạng thái của hạng mục
        const itemIndex = project.value.constructionItems.findIndex(
            item => item.id === selectedItem.value.id
        )
        if (itemIndex !== -1) {
            project.value.constructionItems[itemIndex].status = newStatus
        }
    }
    showStatusDialog.value = false
    selectedItem.value = null
}

const handlePlanClick = (plan) => {
    selectedPlan.value = plan
}

const handleAssignWorkers = (task) => {
    selectedTask.value = task
    showAssignmentModal.value = true
}

const assignWorkers = (assignmentData) => {
    console.log('Assignment data:', assignmentData)
    showAssignmentModal.value = false
}

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN')
}

const downloadDesign = () => {
    // Xử lý tải bản thiết kế
    console.log('Downloading design file:', project.value.designFile)
}

const attendanceDate = ref(new Date().toISOString().split('T')[0]) // Default to today's date
// Ensure all workers have a default status
const attendanceWorkers = ref([
  { id: 'worker1', name: 'Thợ 1', phone: '0123456789', status: 'Có mặt' },
  { id: 'worker2', name: 'Thợ 2', phone: '0987654321', status: 'Đi trễ' },
  { id: 'worker3', name: 'Thợ 3', phone: '0912345678', status: 'Vắng mặt' }
])

const attendanceColumns = [
  { key: 'id', label: 'Mã thợ' },
  { key: 'name', label: 'Họ và tên' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'status', label: 'Trạng thái' }
]

// Add a fallback for undefined status
const updateAttendanceStatus = (worker, newStatus) => {
  worker.status = newStatus; // Default to 'Có mặt' if undefined
}

const confirmAttendance = () => {
  console.log('Attendance data:', {
    date: attendanceDate.value,
    workers: attendanceWorkers.value
  })
  alert('Chấm công thành công!')
}
</script>

<template>
    <div class="container-fluid py-4">
        <div v-if="project" class="project-detail">
            <!-- Header Section -->
            <div class="header-section mb-4">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h1 class="project-title mb-2">{{ project.projectName }}</h1>
                        <div class="project-meta">
                            <span class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                {{ project.location }}
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-calendar"></i>
                                {{ project.startDate }} - {{ project.endDate }}
                            </span>
                        </div>
                    </div>
                    <div class="d-flex flex-column align-items-end">
                        <StatusBadge :status="project.status" class="mb-2" />
                        <button class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-file-download me-1"></i>
                            Tải bản thiết kế
                        </button>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Loại công trình</h3>
                            <p>{{ project.projectType }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-ruler-combined"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Tổng diện tích</h3>
                            <p>{{ project.totalArea }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Số hạng mục</h3>
                            <p>{{ project.constructionItems.length }} hạng mục</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Thời gian còn lại</h3>
                            <p>180 ngày</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Tabs -->
            <div class="content-tabs">
                <ul class="nav nav-tabs nav-tabs-custom">
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: activeTab === 'info' }"
                            @click.prevent="activeTab = 'info'" href="#">
                            <i class="fas fa-info-circle me-2"></i>
                            Thông tin chung
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: activeTab === 'items' }"
                            @click.prevent="activeTab = 'items'" href="#">
                            <i class="fas fa-list me-2"></i>
                            Hạng mục thi công
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: activeTab === 'plans' }"
                            @click.prevent="activeTab = 'plans'" href="#">
                            <i class="fa-solid fa-clipboard me-2"></i>
                            Kế hoạch thi công
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: activeTab === 'attendance' }"
                            @click.prevent="activeTab = 'attendance'" href="#">
                            <!-- <i class="fas fa-list me-2"></i> -->
                            <i class="fa-solid fa-calendar-check me-2"></i>
                            Chấm công
                        </a>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content p-4 bg-white rounded-bottom shadow-sm">
                    <!-- Thông tin chung -->
                    <div v-show="activeTab === 'info'" class="fade-in">
                        <div class="row g-4">
                            <div class="col-md-8">
                                <div class="info-section">
                                    <h2 class="section-title">
                                        <i class="fas fa-info-circle me-2"></i>
                                        Chi tiết dự án
                                    </h2>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <label>Loại công trình</label>
                                            <p>{{ project.projectType }}</p>
                                        </div>
                                        <div class="info-item">
                                            <label>Tổng diện tích</label>
                                            <p>{{ project.totalArea }}</p>
                                        </div>
                                        <div class="info-item">
                                            <label>Ngày khởi công</label>
                                            <p>{{ project.startDate }}</p>
                                        </div>
                                        <div class="info-item">
                                            <label>Ngày dự kiến hoàn thành</label>
                                            <p>{{ project.endDate }}</p>
                                        </div>
                                        <div class="info-item full-width">
                                            <label>Địa điểm xây dựng</label>
                                            <p>{{ project.location }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="document-section">
                                    <h2 class="section-title">
                                        <i class="fas fa-file-alt me-2"></i>
                                        Tài liệu
                                    </h2>
                                    <div class="document-card">
                                        <div class="document-icon">
                                            <i class="fas fa-file-pdf"></i>
                                        </div>
                                        <div class="document-info">
                                            <h4>Bản thiết kế</h4>
                                            <p>{{ project.designFile }}</p>
                                            <button class="btn btn-sm btn-primary" @click="downloadDesign">
                                                <i class="fas fa-download me-1"></i>
                                                Tải xuống
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Hạng mục thi công -->
                    <div v-show="activeTab === 'items'" class="fade-in">
                        <div class="table-toolbar mb-3">
                            <h2 class="section-title">
                                <i class="fas fa-list me-2"></i>
                                Danh sách hạng mục
                            </h2>
                        </div>
                        <DataTable :columns="constructionItemColumns" :data="project.constructionItems"
                            @row-click="handleItemClick" class="custom-table">
                            <template #name="{ item }">
                                <div class="fw-medium text-primary">{{ item.name }}</div>
                            </template>

                            <template #startDate="{ item }">
                                <div class="date-info">
                                    <i class="fas fa-calendar text-muted me-1"></i>
                                    {{ formatDate(item.startDate) }}
                                </div>
                            </template>

                            <template #endDate="{ item }">
                                <div class="date-info">
                                    <i class="fas fa-calendar-check text-muted me-1"></i>
                                    {{ formatDate(item.endDate) }}
                                </div>
                            </template>

                            <template #totalVolume="{ item }">
                                <div class="volume-info">
                                    <span class="fw-medium">{{ item.totalVolume }}</span>
                                    <span class="text-muted ms-1">{{ item.unit }}</span>
                                </div>
                            </template>

                            <template #status="{ item }">
                                <StatusBadge :status="item.status" type="construction" />
                            </template>

                            <template #actions="{ item }">
                                <div class="d-flex justify-content-center gap-2">
                                    <UpdateButton @click="(e) => handleUpdateItem(item, e)" />
                                    <ChangeStatusButton @click="(e) => handleStatusChange(item, e)" />
                                </div>
                            </template>
                        </DataTable>
                    </div>

                    <!-- Kế hoạch thi công -->
                    <div v-show="activeTab === 'plans'" class="fade-in">
                        <div class="table-toolbar mb-3">
                            <h2 class="section-title">
                                <i class="fas fa-list me-2"></i>
                                Danh sách kế hoạch
                            </h2>
                        </div>
                        <DataTable :columns="planColumns" :data="project.constructionPlans" @row-click="handlePlanClick" />

                        <div v-if="selectedPlan" class="mt-4">
                            <h5>Nhiệm vụ trong kế hoạch: {{ selectedPlan.name }}</h5>
                            <p><strong>Kế hoạch tháng:</strong> {{ selectedPlan.monthlyPlanVolume }} m³</p>
                            <DataTable :columns="taskColumns" :data="selectedPlan.tasks">
                                <template #actions="{ item }">
                                    <button class="btn btn-sm btn-outline-primary" @click="handleAssignWorkers(item)">Phân công</button>
                                </template>
                            </DataTable>
                        </div>
                    </div>

                    <!-- Chấm công -->
                    <div v-show="activeTab === 'attendance'" class="fade-in">
                        <h4>Chấm công</h4>
                        <div class="mb-3">
                            <label for="attendanceDate" class="form-label">Chọn ngày</label>
                            <input
                                type="date"
                                id="attendanceDate"
                                v-model="attendanceDate"
                                class="form-control"
                            />
                        </div>
                        <DataTable :data="attendanceWorkers" :columns="attendanceColumns">
                            <template #status="{ item }">
                                <select
                                    v-model="item.status"
                                    class="form-select"
                                    @change="updateAttendanceStatus(item, item.status)"
                                >
                                    <option value="Có mặt">Có mặt</option>
                                    <option value="Đi trễ">Đi trễ</option>
                                    <option value="Vắng mặt">Vắng mặt</option>
                                </select>
                            </template>
                        </DataTable>
                        <button class="btn btn-primary mt-3" @click="confirmAttendance">
                            Xác nhận chấm công
                        </button>
                    </div>
                </div>


            </div>
        </div>

        <div v-else class="loading-container">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <!-- Dialog đổi trạng thái -->
        <ModalDialog v-if="selectedItem" :show="showStatusDialog" @update:show="showStatusDialog = $event"
            title="Đổi Trạng Thái Hạng Mục" size="md">
            <ChangeStatusForm :current-status="selectedItem.status" type="construction" @submit="handleStatusSubmit"
                @cancel="showStatusDialog = false" />
        </ModalDialog>

        <!-- Modal for Assigning Workers -->
        <ModalDialog
            v-if="selectedTask"
            :show="showAssignmentModal"
            @update:show="showAssignmentModal = $event"
            title="Phân công thợ"
        >
            <form @submit.prevent="assignWorkers({ task: selectedTask, workers: selectedWorkers, startDate: '', endDate: '', notes: '' })">
                <div class="mb-3">
                    <label for="workers" class="form-label">Chọn thợ</label>
                    <MultiSelect
                        v-model="selectedWorkers"
                        :options="availableWorkers"
                        label="name"
                        track-by="id"
                        placeholder="Chọn thợ..."
                        multiple
                        class="form-control"
                    />
                </div>
                <div class="mb-3">
                    <label for="startDate" class="form-label">Ngày bắt đầu</label>
                    <input type="date" id="startDate" class="form-control" />
                </div>
                <div class="mb-3">
                    <label for="endDate" class="form-label">Ngày kết thúc</label>
                    <input type="date" id="endDate" class="form-control" />
                </div>
                <div class="mb-3">
                    <label for="notes" class="form-label">Ghi chú</label>
                    <textarea id="notes" class="form-control" rows="3"></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" @click="showAssignmentModal = false">Hủy</button>
                    <button type="submit" class="btn btn-primary">Xác nhận</button>
                </div>
            </form>
        </ModalDialog>
    </div>
</template>

<style scoped>
.project-detail {
    animation: fadeIn 0.3s ease-out;
}

.header-section {
    background: linear-gradient(to right, #ffffff, #f8f9fa);
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.project-title {
    font-size: 2rem;
    color: #2c3e50;
    font-weight: 600;
}

.project-meta {
    display: flex;
    gap: 1.5rem;
    color: #6c757d;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-icon {
    width: 48px;
    height: 48px;
    background: #f8f9fa;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #007bff;
}

.stat-content h3 {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
}

.stat-content p {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
}

.nav-tabs-custom {
    border: none;
    margin-top: 2rem;
}

.nav-tabs-custom .nav-link {
    border: none;
    padding: 1rem 1.5rem;
    color: #6c757d;
    font-weight: 500;
    transition: all 0.2s ease;
}

.nav-tabs-custom .nav-link:hover {
    color: #007bff;
    background: rgba(0, 123, 255, 0.05);
}

.nav-tabs-custom .nav-link.active {
    color: #007bff;
    background: white;
    border-top: 3px solid #007bff;
}

.section-title {
    font-size: 1.25rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    font-weight: 600;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
}

.info-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
}

.info-item.full-width {
    grid-column: 1 / -1;
}

.info-item label {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
    display: block;
}

.info-item p {
    margin: 0;
    color: #2c3e50;
    font-weight: 500;
}

.document-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
}

.document-icon {
    font-size: 2rem;
    color: #dc3545;
}

.document-info h4 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
}

.document-info p {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
}

.custom-table {
    margin-bottom: 2rem;
}

.custom-table :deep(th) {
    background: #f8f9fa;
    font-weight: 600;
    padding: 1rem;
    white-space: nowrap;
}

.custom-table :deep(td) {
    padding: 1rem;
    vertical-align: middle;
}

.custom-table :deep(tr) {
    cursor: pointer;
    transition: all 0.2s ease;
}

.custom-table :deep(tr:hover) {
    background-color: rgba(0, 123, 255, 0.05);
}

.date-info {
    font-size: 0.875rem;
    color: #495057;
}

.volume-info {
    font-size: 0.875rem;
}

.action-btn {
    padding: 0.25rem;
    transition: all 0.2s ease;
}

.action-btn:hover {
    transform: scale(1.1);
}

.gap-2 {
    gap: 0.5rem;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.fade-in {
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

.multiselect {
    border: 1px solid #ced4da;
    border-radius: 0.375rem;
    padding: 0.375rem 0.75rem;
}
</style>