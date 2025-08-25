<script setup>
import { ref, computed } from 'vue'
import TabBar from '../../components/common/TabBar.vue'

const activeTab = ref('summary')
const showMoreTabs = ref(false) // Control visibility of the "More" dropdown

const tabs = [
  { key: 'summary', label: 'Bảng tổng hợp công', icon: 'fas fa-table' },
  { key: 'overtime', label: 'Bảng công tăng ca', icon: 'fas fa-business-time' },
  { key: 'detail', label: 'Bảng công chi tiết', icon: 'fas fa-list-alt' },
  { key: 'attendance', label: 'Dữ liệu chấm công', icon: 'fas fa-fingerprint' },
  { key: 'closeHistory', label: 'Lịch sử chốt công', icon: 'fas fa-history' },
  { key: 'feedbackHistory', label: 'Lịch sử phản ánh', icon: 'fas fa-comment-dots' },
  { key: 'dataErrors', label: 'Các lỗi dữ liệu', icon: 'fas fa-exclamation-triangle' }
]

// Limit the number of visible tabs
const visibleTabsCount = 4
const visibleTabs = computed(() => tabs.slice(0, visibleTabsCount))
const hiddenTabs = computed(() => tabs.slice(visibleTabsCount))

const selectTab = (tabKey) => {
  activeTab.value = tabKey
  showMoreTabs.value = false // Close the "More" dropdown when a tab is selected
}

// Danh sách nhân viên và dữ liệu công cho từng ngày trong tháng
const employees = [
  {
    id: 'NV0001',
    name: 'Vũ Thị Hợp',
    position: 'Tổng giám đốc'
  },
  {
    id: 'NV0002',
    name: 'Trần Nha Trang',
    position: 'Phó Tổng Giám đốc phụ trách Kinh doanh'
  },
  {
    id: 'NV0224',
    name: 'Nguyễn Thạc Hùng',
    position: 'Giám đốc Ban Đầu tư'
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc'
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc'
  },
  {
    id: 'NV0253',
    name: 'Nguyễn Duy Phúc',
    position: 'Kiến trúc sư trưởng khối Công trình kiến trúc'
  },
  {
    id: 'NV0280',
    name: 'Nguyễn Thiện Đức',
    position: 'Chuyên viên Quản lý thiết kế Kết cấu & Hạ tầng'
  }
]

// Tạo danh sách ngày trong tháng hiện tại
const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1
const daysInMonth = new Date(year, month, 0).getDate()
const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
  const d = new Date(year, month - 1, i + 1)
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
  return `${i + 1}/${month} (${weekday})`
})

// Tạo dữ liệu công cho từng nhân viên, từng ngày trong tháng
function generateAttendanceForEmployee(empIdx) {
  // Quy tắc mẫu: cứ 7 ngày thì 1 ngày nghỉ, 1 ngày remote, còn lại đi làm
  return dayHeaders.map((day, idx) => {
    if (idx % 7 === 5) return { status: 'leave', time: '08:00-17:00' }
    if (idx % 7 === 6) return { status: 'remote', time: '08:30-17:00' }
    return { status: 'work', time: '08:30-17:30' }
  })
}

// Khởi tạo ma trận dữ liệu công sau khi dayHeaders đã có
const attendanceMatrix = employees.map((emp, idx) => generateAttendanceForEmployee(idx))

const getCell = (empIdx, dayIdx) => attendanceMatrix[empIdx][dayIdx];

const getCellClass = (empIdx, dayIdx) => {
  const cell = getCell(empIdx, dayIdx);
  if (!cell) return '';
  return {
    'cell-work': cell.status === 'work',
    'cell-leave': cell.status === 'leave',
    'cell-remote': cell.status === 'remote',
    'cell-late': cell.status === 'late',
    'cell-other': cell.status === 'other'
  };
};

const getCellTitle = (empIdx, dayIdx) => {
  const cell = getCell(empIdx, dayIdx);
  if (!cell) return '';
  if (cell.status === 'work') return 'Đi làm';
  if (cell.status === 'leave') return 'Nghỉ phép';
  if (cell.status === 'remote') return 'Làm việc từ xa';
  return '';
};

const statusColor = {
  work: '#28a745',
  leave: '#ff6b6b',
  remote: '#6c63ff',
  late: '#ffc107',
  other: '#adb5bd'
}
</script>

<template>
  <div class="container-fluid py-4">
    <TabBar :tabs="tabs" :activeTab="activeTab" @update:activeTab="activeTab = $event" />
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="activeTab === 'summary'">
          <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center legend-row">
            <span class="legend-item" style="background:#28a745"></span> Đi làm
            <span class="legend-item" style="background:#ff6b6b"></span> Nghỉ phép
            <span class="legend-item" style="background:#6c63ff"></span> Làm việc từ xa
          </div>
          <div class="attendance-summary-table">
            <table class="table table-bordered align-middle modern-table">
              <thead>
                <tr>
                  <th class="text-center" style="width:40px">STT</th>
                  <th class="text-center" style="min-width:180px">Nhân viên</th>
                  <th class="text-center" v-for="day in dayHeaders" :key="day">{{ day }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(emp, eIdx) in employees" :key="emp.id">
                  <td class="text-center">{{ eIdx + 1 }}</td>
                  <td>
                    <span class="emp-id fw-bold text-primary">{{ emp.id }}</span>
                    <span class="fw-bold ms-2">{{ emp.name }}</span>
                    <div class="text-muted small">{{ emp.position }}</div>
                  </td>
                  <td v-for="(day, sIdx) in dayHeaders" :key="day">
                    <div
                      class="schedule-cell-modern"
                      :class="getCellClass(eIdx, sIdx)"
                      :title="getCellTitle(eIdx, sIdx)"
                    >
                      <span class="cell-time">{{ attendanceMatrix[eIdx][sIdx].time }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else>
          <div class="text-muted">Nội dung tab "{{ tabs.find(t => t.key === activeTab)?.label }}" sẽ được mô tả sau.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-tabs-bar {
  display: flex;
  gap: 8px;
  border-radius: 8px;
  background: #f5f7fa;
  padding: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  margin-bottom: 1rem;
  position: relative;
}

.tab-bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  background: transparent;
}

.tab-bar-item .tab-bar-icon {
  font-size: 1.15rem;
  color: #0d6efd;
}

.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
  box-shadow: 0 2px 8px rgba(13,110,253,0.07);
}

.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

.more-tab {
  position: relative;
}

.more-tabs-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 8px;
  min-width: 200px;
}

.dropdown-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.dropdown-tab-item .dropdown-tab-icon {
  font-size: 1.1rem;
  color: #0d6efd;
}

.dropdown-tab-item.active {
  background: #e9ecef;
  color: #0d6efd;
}

.dropdown-tab-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

.card {
  border-radius: 0.75rem;
  border: none;
}

.card-body {
  padding: 1.5rem;
}

.attendance-summary-table {
  max-height: calc(100vh - 100px); /* Ensure the table fits within the viewport */
  overflow-y: auto; /* Enable vertical scrolling for the table content */
  padding: 16px; /* Add padding around the table */
  margin: 16px; /* Add margin around the table container */
  border-radius: 16px; /* Rounded corners for the table container */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); /* Subtle shadow for the table container */
  background: #fff; /* White background for the table container */
  border: 1px solid #e9ecef; /* Add a border to the table container */
}

.attendance-summary-table .modern-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%; /* Ensure the table takes up the full width of the container */
}

.attendance-summary-table th {
  background: #f5f7fa;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  border-bottom: 2px solid #e9ecef;
  vertical-align: middle;
  position: sticky;
  top: 0; /* Keep table headers visible while scrolling */
  z-index: 2;
}

.attendance-summary-table td {
  vertical-align: middle;
  text-align: center;
  border-color: #e9ecef;
  background: #fff;
  padding: 0;
}

.attendance-summary-table .schedule-cell-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 44px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  margin: 4px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  border: 1.5px solid #e9ecef;
}

.attendance-summary-table .schedule-cell-modern:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: scale(1.04);
  border-color: #0d6efd;
}

.attendance-summary-table .cell-work {
  background: #43d17a;
  color: #fff;
}

.attendance-summary-table .cell-leave {
  background: #ff6b6b;
  color: #fff;
}

.attendance-summary-table .cell-remote {
  background: #6c63ff;
  color: #fff;
}

.attendance-summary-table .cell-other,
.attendance-summary-table .cell-empty {
  background: #e0e0e0;
  color: #888;
}

.attendance-summary-table .cell-time {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.legend-row {
  font-size: 1rem;
  gap: 18px;
  margin-top: 8px;
}

.legend-item {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #e0e0e0;
}

@media (max-width: 900px) {
  .attendance-tabs-bar {
    flex-direction: column;
    gap: 4px;
    padding: 2px 4px;
  }
  .tab-bar-item {
    padding: 7px 12px;
    font-size: 0.98rem;
  }
  .attendance-summary-table .modern-table th,
  .attendance-summary-table .modern-table td {
    font-size: 0.95rem;
    min-width: 60px;
    padding: 4px;
  }
  .attendance-summary-table .schedule-cell-modern {
    min-width: 60px;
    min-height: 36px;
    font-size: 0.95rem;
  }
}
</style>
