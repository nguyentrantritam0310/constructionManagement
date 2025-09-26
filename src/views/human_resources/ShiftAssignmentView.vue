<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useWorkShift } from '../../composables/useWorkShift'

const {
  workshifts,
  fetchWorkShifts,
} = useWorkShift()

const activeTab = ref('shift')
const tabs = [
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'schedule', label: 'Xếp lịch' },
  { key: 'history', label: 'Lịch sử phân ca' },
  { key: 'unassigned', label: 'Nhân viên chưa phân ca' }
]
onMounted(async () => {
  await fetchWorkShifts()
})
// Tab Ca làm việc
const shiftCurrentPage = ref(1)
const shiftItemsPerPage = ref(5)
const shiftColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'code', label: 'Mã ca' },
  { key: 'name', label: 'Tên ca' },
  { key: 'in', label: 'Giờ vào' },
  { key: 'out', label: 'Giờ ra' },
  { key: 'employeeCount', label: 'Số lượng NV' },
]
const shiftData = computed(() => {
  return workshifts.value.map((shift, index) => {
    // Lấy mảng giờ vào và giờ ra
    const startTimes = shift.shiftDetails.map(d => d.startTime)
    const endTimes = shift.shiftDetails.map(d => d.endTime)

    // Tìm giờ vào sớm nhất (min) và giờ ra trễ nhất (max)
    const earliestStart = startTimes.reduce((a, b) => a < b ? a : b)
    const latestEnd = endTimes.reduce((a, b) => a > b ? a : b)

    return {
      stt: index + 1,
      code: shift.id,
      name: shift.shiftName,
      in: earliestStart, // giờ vào sớm nhất
      out: latestEnd    // giờ ra trễ nhất
    }
  })
})  
const paginatedShiftData = computed(() => {
  const start = (shiftCurrentPage.value - 1) * shiftItemsPerPage.value
  return shiftData.value.slice(start, start + shiftItemsPerPage.value)
})

// Tab Lịch sử phân ca
const historyCurrentPage = ref(1)
const historyItemsPerPage = ref(5)
const historyColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'empId', label: 'Mã Nhân viên' },
  { key: 'empName', label: 'Tên Nhân viên' },
  { key: 'dept', label: 'Phòng ban' },
  { key: 'shiftCode', label: 'Mã ca' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày kết thúc' },
  { key: 'actions', label: 'Thao tác', class: 'text-center' }
]
const historyData = Array.from({ length: 10 }, (_, i) => ({
  stt: i + 1,
  empId: `NV${String(1000 + i)}`,
  empName: `Nhân viên ${i + 1}`,
  dept: 'Phòng Kỹ thuật',
  shiftCode: `CA${String(i + 1).padStart(3, '0')}`,
  shiftName: `Ca ${i + 1}`,
  startDate: '01/09/2025',
  endDate: '07/09/2025'
}))
const paginatedHistoryData = computed(() => {
  const start = (historyCurrentPage.value - 1) * historyItemsPerPage.value
  return historyData.slice(start, start + historyItemsPerPage.value)
})

// Tab Nhân viên chưa phân ca
const unassignedCurrentPage = ref(1)
const unassignedItemsPerPage = ref(5)
const unassignedColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'empId', label: 'Mã Nhân viên' },
  { key: 'empName', label: 'Tên Nhân viên' },
  { key: 'dept', label: 'Phòng ban' },
  { key: 'title', label: 'Chức danh' },
  { key: 'joinDate', label: 'Ngày vào làm' },
  { key: 'machineCode', label: 'Mã chấm công' }
]
const unassignedData = Array.from({ length: 10 }, (_, i) => ({
  stt: i + 1,
  empId: `NV${String(2000 + i)}`,
  empName: `Nhân viên ${i + 1}`,
  dept: 'Phòng Hành chính',
  title: 'Nhân viên',
  joinDate: '01/08/2025',
  machineCode: `MC${String(i + 1).padStart(3, '0')}`
}))
const paginatedUnassignedData = computed(() => {
  const start = (unassignedCurrentPage.value - 1) * unassignedItemsPerPage.value
  return unassignedData.slice(start, start + unassignedItemsPerPage.value)
})

// Tab Xếp lịch (cải tiến: tách nhân viên ra 3 cột, mỗi ngày là mảng ca, Chủ nhật là thứ 8)
const scheduleColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  ...Array.from({ length: 7 }, (_, i) => ({
    key: `day${i + 1}`,
    label: `${String(i + 1).padStart(2, '0')}/09 (${['T2','T3','T4','T5','T6','T7','CN'][i]})`
  }))
]
const scheduleData = [
  {
    empId: 'NV0001',
    empName: 'Admin HrOnline',
    title: 'Support Hronline',
    day1: [{ in: '07:30', out: '17:00'}],
    day2: [{ in: '07:30', out: '17:00'}],
    day3: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day4: [{ in: '07:30', out: '17:00'}],
    day5: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day6: [{ in: '08:00', out: '12:00'}],
    day7: []
  },
  {
    empId: 'NV0163',
    empName: 'Trần Duy Đức',
    title: 'Giám đốc Công ty Điện DH',
    day1: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day2: [{ in: '08:30', out: '17:30'}],
    day3: [{ in: '08:30', out: '17:30'}],
    day4: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day5: [{ in: '08:30', out: '17:30'}],
    day6: [{ in: '08:30', out: '12:00'}],
    day7: []
  },
    {
    empId: 'NV0001',
    empName: 'Admin HrOnline',
    title: 'Support Hronline',
    day1: [{ in: '07:30', out: '17:00'}],
    day2: [{ in: '07:30', out: '17:00'}],
    day3: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day4: [{ in: '07:30', out: '17:00'}],
    day5: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day6: [{ in: '08:00', out: '12:00'}],
    day7: []
  },
  {
    empId: 'NV0163',
    empName: 'Trần Duy Đức',
    title: 'Giám đốc Công ty Điện DH',
    day1: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day2: [{ in: '08:30', out: '17:30'}],
    day3: [{ in: '08:30', out: '17:30'}],
    day4: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day5: [{ in: '08:30', out: '17:30'}],
    day6: [{ in: '08:30', out: '12:00'}],
    day7: []
  },
    {
    empId: 'NV0001',
    empName: 'Admin HrOnline',
    title: 'Support Hronline',
    day1: [{ in: '07:30', out: '17:00'}],
    day2: [{ in: '07:30', out: '17:00'}],
    day3: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day4: [{ in: '07:30', out: '17:00'}],
    day5: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day6: [{ in: '08:00', out: '12:00'}],
    day7: []
  },
  {
    empId: 'NV0163',
    empName: 'Trần Duy Đức',
    title: 'Giám đốc Công ty Điện DH',
    day1: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day2: [{ in: '08:30', out: '17:30'}],
    day3: [{ in: '08:30', out: '17:30'}],
    day4: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day5: [{ in: '08:30', out: '17:30'}],
    day6: [{ in: '08:30', out: '12:00'}],
    day7: []
  },
    {
    empId: 'NV0001',
    empName: 'Admin HrOnline',
    title: 'Support Hronline',
    day1: [{ in: '07:30', out: '17:00'}],
    day2: [{ in: '07:30', out: '17:00'}],
    day3: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day4: [{ in: '07:30', out: '17:00'}],
    day5: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day6: [{ in: '08:00', out: '12:00'}],
    day7: []
  },
  {
    empId: 'NV0163',
    empName: 'Trần Duy Đức',
    title: 'Giám đốc Công ty Điện DH',
    day1: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day2: [{ in: '08:30', out: '17:30'}],
    day3: [{ in: '08:30', out: '17:30'}],
    day4: [{ in: '07:30', out: '17:00'}, { in: '18:00', out: '22:00'}],
    day5: [{ in: '08:30', out: '17:30'}],
    day6: [{ in: '08:30', out: '12:00'}],
    day7: []
  }
  // ...thêm dữ liệu mẫu cho các nhân viên khác
]
const scheduleCurrentPage = ref(1)
const scheduleItemsPerPage = ref(5)
const paginatedScheduleData = computed(() => {
  const start = (scheduleCurrentPage.value - 1) * scheduleItemsPerPage.value
  return scheduleData.slice(start, start + scheduleItemsPerPage.value)
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
        <template #actions="{ item }">
          <button class="table-action-btn" title="Phân ca nhân viên">
            <i class="fas fa-user-plus"></i>
          </button>
          <button class="table-action-btn" title="Phân ca phòng ban">
            <i class="fas fa-users"></i>
          </button>
        </template>
      </DataTable>
      <Pagination
        :totalItems="shiftData.length"
        :itemsPerPage="shiftItemsPerPage"
        :currentPage="shiftCurrentPage"
        @update:currentPage="shiftCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'schedule'">
      <DataTable :columns="scheduleColumns" :data="paginatedScheduleData">
        <template #empId="{ item }">
          <span class="emp-id">{{ item.empId }}</span>
        </template>
        <template #empName="{ item }">
          <span class="emp-name">{{ item.empName }}</span>
        </template>
        <template #title="{ item }">
          <span class="emp-title">{{ item.title }}</span>
        </template>
        <template v-for="i in 7" #[`day${i}`]="{ item }">
          <div class="schedule-cell-blocks">
            <template v-if="item[`day${i}`] && item[`day${i}`].length">
              <div
                v-for="(shift, idx) in item[`day${i}`]"
                :key="idx"
                class="shift-block"
              >
                <span class="shift-time">{{ shift.in }} - {{ shift.out }}</span>
              </div>
            </template>
            <button v-else class="btn btn-success btn-sm"><i class="fas fa-plus"></i></button>
          </div>
        </template>
      </DataTable>
      <Pagination
        :totalItems="scheduleData.length"
        :itemsPerPage="scheduleItemsPerPage"
        :currentPage="scheduleCurrentPage"
        @update:currentPage="scheduleCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'history'">
      <DataTable :columns="historyColumns" :data="paginatedHistoryData">
        <template #actions="{ item }">
          <button class="table-action-btn" title="Sửa phân ca">
            <i class="fas fa-edit"></i>
          </button>
          <button class="table-action-btn delete" title="Đóng ca">
            <i class="fas fa-lock"></i>
          </button>
        </template>
      </DataTable>
      <Pagination
        :totalItems="historyData.length"
        :itemsPerPage="historyItemsPerPage"
        :currentPage="historyCurrentPage"
        @update:currentPage="historyCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'unassigned'">
      <DataTable :columns="unassignedColumns" :data="paginatedUnassignedData" />
      <Pagination
        :totalItems="unassignedData.length"
        :itemsPerPage="unassignedItemsPerPage"
        :currentPage="unassignedCurrentPage"
        @update:currentPage="unassignedCurrentPage = $event"
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
.emp-id, .emp-name, .emp-title {
  display: block;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  text-align: left;
  padding: 2px 8px;
  white-space: nowrap;
}
.schedule-cell-blocks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 110px;
  align-items: flex-start;
  justify-content: flex-start;
}
.shift-block {
  background: #f0f6ff;
  border: 1px solid #cce3ff;
  border-radius: 6px;
  padding: 2px 10px;
  margin-bottom: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 90px;
}
.shift-code {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0d6efd;
  min-width: 56px;
  text-align: left;
}
.shift-time {
  font-size: 0.95rem;
  color: #222;
  min-width: 70px;
  text-align: left;
}
.btn-success.btn-sm {
  font-size: 1rem;
  padding: 2px 8px;
  margin-top: 2px;
}
</style>