<!-- filepath: c:\Users\nguye\OneDrive\Desktop\ConstructionManagement\vue-app\src\views\human_resources\ShiftSetupView.vue -->
<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'

const activeTab = ref('shift')

const tabs = [
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'machine', label: 'Máy chấm công' }
]

// Phân trang ca làm việc
const shiftCurrentPage = ref(1)
const shiftItemsPerPage = ref(5)
const shiftColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'code', label: 'Mã ca' },
  { key: 'name', label: 'Tên ca' },
  { key: 'in', label: 'Giờ vào' },
  { key: 'out', label: 'Giờ ra' },
  { key: 'active', label: 'Đóng/mở ca' },
  { key: 'employeeCount', label: 'Số lượng NV' },
  { key: 'actions', label: 'Thao tác', class: 'text-center' }
]
const shiftData = Array.from({ length: 10 }, (_, i) => ({
  stt: i + 1,
  code: `CA${String(i + 1).padStart(3, '0')}`,
  name: `Ca ${i + 1}`,
  in: '08:00',
  out: '17:00',
  active: i % 2 === 0,
  employeeCount: Math.floor(Math.random() * 20) + 5
}))
function toggleShiftActive(item) {
  item.active = !item.active
}
const paginatedShiftData = computed(() => {
  const start = (shiftCurrentPage.value - 1) * shiftItemsPerPage.value
  return shiftData.slice(start, start + shiftItemsPerPage.value)
})

// Phân trang máy chấm công
const machineCurrentPage = ref(1)
const machineItemsPerPage = ref(5)
const machineColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'code', label: 'Mã máy chấm công' },
  { key: 'name', label: 'Tên máy chấm công' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'x', label: 'Tọa độ X' },
  { key: 'y', label: 'Tọa độ Y' },
  { key: 'radius', label: 'Bán kính cho phép' },
  { key: 'actions', label: 'Thao tác', class: 'text-center' }
]
const machineData = Array.from({ length: 10 }, (_, i) => ({
  stt: i + 1,
  code: `MC${String(i + 1).padStart(3, '0')}`,
  name: `Máy chấm công ${i + 1}`,
  status: i % 3 === 0 ? 'Bảo trì' : 'Hoạt động',
  x: (21 + i * 0.1).toFixed(4),
  y: (105 + i * 0.1).toFixed(4),
  radius: `${40 + i * 2}m`
}))
const paginatedMachineData = computed(() => {
  const start = (machineCurrentPage.value - 1) * machineItemsPerPage.value
  return machineData.slice(start, start + machineItemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="shift-tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-bar-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <button class="btn btn-primary" style="min-width:120px">
        <i class="fas fa-plus me-2"></i>Thêm
      </button>
    </div>
    <div v-if="activeTab === 'shift'">
      <DataTable :columns="shiftColumns" :data="paginatedShiftData">
        <template #active="{ item }">
          <label class="switch">
            <input type="checkbox" v-model="item.active" @change="toggleShiftActive(item)" />
            <span class="slider"></span>
          </label>
        </template>
        <template #employeeCount="{ item }">
          <span class="emp-count">{{ item.employeeCount }}</span>
        </template>
        <template #actions="{ item }">
          <button class="table-action-btn" title="Sửa"><i class="fas fa-edit"></i></button>
          <button class="table-action-btn delete" title="Xóa"><i class="fas fa-trash"></i></button>
        </template>
      </DataTable>
      <Pagination
        :totalItems="shiftData.length"
        :itemsPerPage="shiftItemsPerPage"
        :currentPage="shiftCurrentPage"
        @update:currentPage="shiftCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'machine'">
      <DataTable :columns="machineColumns" :data="paginatedMachineData">
        <template #status="{ item }">
          <span :class="['machine-status', item.status === 'Hoạt động' ? 'active' : 'inactive']">{{ item.status }}</span>
        </template>
        <template #actions="{ item }">
          <button class="table-action-btn" title="Sửa"><i class="fas fa-edit"></i></button>
          <button class="table-action-btn delete" title="Xóa"><i class="fas fa-trash"></i></button>
        </template>
      </DataTable>
      <Pagination
        :totalItems="machineData.length"
        :itemsPerPage="machineItemsPerPage"
        :currentPage="machineCurrentPage"
        @update:currentPage="machineCurrentPage = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.shift-tabs-bar {
  display: flex;
  gap: 8px;
}
.tab-bar-item {
  padding: 8px 24px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  background: #f5f7fa;
  cursor: pointer;
  border: none;
  transition: background 0.18s, color 0.18s;
}
.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
}
.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  vertical-align: middle;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e9ecef;
  transition: .4s;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #fff;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.switch input:checked + .slider {
  background-color: #28a745;
}
.switch input:checked + .slider:before {
  transform: translateX(20px);
}
.machine-status.active {
  color: #28a745;
  font-weight: 600;
}
.machine-status.inactive {
  color: #ff6b6b;
  font-weight: 600;
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
.emp-count {
  font-weight: 600;
  color: #0d6efd;
}
</style>