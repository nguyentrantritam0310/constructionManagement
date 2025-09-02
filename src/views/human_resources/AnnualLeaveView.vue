<script setup>
import { ref, computed } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'

const activeTab = ref('annual')
const tabs = [
  { key: 'annual', label: 'Phép năm quy định' },
  { key: 'otLeave', label: 'Phép bù tăng ca' }
]

// ----------- Phép năm quy định -----------
const leaveColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `month${i + 1}`,
    label: `${i + 1 < 10 ? '0' : ''}${i + 1}/2025`
  })),
  { key: 'joinDate', label: 'Ngày vào làm' },
  { key: 'leavePolicy', label: 'Phép năm quy định' },
  { key: 'seniorityLeave', label: 'Phép thâm niên' },
  { key: 'totalLeave', label: 'Tổng số phép năm' },
  { key: 'totalUsed', label: 'Tổng ngày đã nghỉ' },
  { key: 'leaveRemain', label: 'Số phép còn lại' },
  { key: 'seniorityDate', label: 'Ngày thâm niên' }
]

const leaveData = Array.from({ length: 15 }, (_, i) => ({
  empId: `NV${String(1001 + i)}`,
  empName: `Nhân viên ${i + 1}`,
  month1: i % 3 === 0 ? 1 : 0,
  month2: i % 4 === 0 ? 2 : 0,
  month3: i % 5 === 0 ? 1 : 0,
  month4: i % 2 === 0 ? 1 : 0,
  month5: i % 6 === 0 ? 1 : 0,
  month6: i % 7 === 0 ? 2 : 0,
  month7: i % 3 === 0 ? 1 : 0,
  month8: i % 4 === 0 ? 1 : 0,
  month9: i % 5 === 0 ? 2 : 0,
  month10: i % 2 === 0 ? 1 : 0,
  month11: i % 6 === 0 ? 1 : 0,
  month12: i % 7 === 0 ? 1 : 0,
  joinDate: `0${(i % 9) + 1}/0${(i % 12) + 1}/2020`,
  leavePolicy: 12,
  seniorityLeave: i % 3,
  totalLeave: 12 + (i % 3),
  totalUsed: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15][i],
  leaveRemain: 12 + (i % 3) - [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15][i],
  seniorityDate: `0${(i % 9) + 1}/0${(i % 12) + 1}/2022`
}))

const annualCurrentPage = ref(1)
const annualItemsPerPage = ref(10)
const paginatedLeaveData = computed(() => {
  const start = (annualCurrentPage.value - 1) * annualItemsPerPage.value
  return leaveData.slice(start, start + annualItemsPerPage.value)
})

// ----------- Phép bù tăng ca -----------
const otLeaveColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `month${i + 1}`,
    label: `${i + 1 < 10 ? '0' : ''}${i + 1}/2025`
  })),
  { key: 'totalOTHours', label: 'Tổng giờ tăng ca' },
  { key: 'otLeaveDays', label: 'Số ngày phép bù' },
  { key: 'otLeaveUsed', label: 'Đã nghỉ phép bù' },
  { key: 'otLeaveRemain', label: 'Phép bù còn lại' }
]

const otLeaveData = Array.from({ length: 15 }, (_, i) => ({
  empId: `NV${String(1001 + i)}`,
  empName: `Nhân viên ${i + 1}`,
  month1: i % 2 === 0 ? 1 : 0,
  month2: i % 3 === 0 ? 2 : 0,
  month3: i % 4 === 0 ? 1 : 0,
  month4: i % 5 === 0 ? 2 : 0,
  month5: i % 6 === 0 ? 1 : 0,
  month6: i % 7 === 0 ? 2 : 0,
  month7: i % 2 === 0 ? 1 : 0,
  month8: i % 3 === 0 ? 1 : 0,
  month9: i % 4 === 0 ? 2 : 0,
  month10: i % 5 === 0 ? 1 : 0,
  month11: i % 6 === 0 ? 1 : 0,
  month12: i % 7 === 0 ? 1 : 0,
  totalOTHours: 20 + i * 3,
  otLeaveDays: Math.floor((20 + i * 3) / 8),
  otLeaveUsed: i % 4,
  otLeaveRemain: Math.floor((20 + i * 3) / 8) - (i % 4)
}))

const otCurrentPage = ref(1)
const otItemsPerPage = ref(10)
const paginatedOtLeaveData = computed(() => {
  const start = (otCurrentPage.value - 1) * otItemsPerPage.value
  return otLeaveData.slice(start, start + otItemsPerPage.value)
})

// ----------- Modal phiếu nghỉ phép -----------
// Dùng chung cho cả hai tab
const showModal = ref(false)
const modalMonth = ref(null)
const modalEmployee = ref(null)
const modalType = ref('annual') // 'annual' hoặc 'otLeave'
const modalField = ref('month') // 'month' hoặc 'totalUsed' hoặc 'otLeaveUsed'

const leaveTicketColumns = [
  { key: 'ticketId', label: 'Mã phiếu' },
  { key: 'empName', label: 'Họ tên' },
  { key: 'fromDate', label: 'Từ ngày' },
  { key: 'toDate', label: 'Đến ngày' },
  { key: 'days', label: 'Số ngày nghỉ' },
  { key: 'reason', label: 'Lý do' }
]

// Dữ liệu phiếu nghỉ phép cho phép năm quy định
const leaveTickets = {}
for (let i = 0; i < 15; i++) {
  const empId = `NV${1001 + i}`
  leaveTickets[empId] = {}
  for (let m = 1; m <= 12; m++) {
    if (leaveData[i][`month${m}`] > 0) {
      leaveTickets[empId][m] = [
        {
          ticketId: `P${empId}${m}`,
          empName: leaveData[i].empName,
          fromDate: `0${m}/0${(i % 28) + 1}/2025`,
          toDate: `0${m}/0${(i % 28) + 1}/2025`,
          days: leaveData[i][`month${m}`],
          reason: 'Nghỉ phép cá nhân'
        }
      ]
    }
  }
  // Tổng ngày đã nghỉ: gom tất cả phiếu nghỉ trong năm
  leaveTickets[empId]['total'] = Object.values(leaveTickets[empId]).flat()
}

// Dữ liệu phiếu nghỉ phép bù tăng ca
const otTickets = {}
for (let i = 0; i < 15; i++) {
  const empId = `NV${1001 + i}`
  otTickets[empId] = {}
  for (let m = 1; m <= 12; m++) {
    if (otLeaveData[i][`month${m}`] > 0) {
      otTickets[empId][m] = [
        {
          ticketId: `OT${empId}${m}`,
          empName: otLeaveData[i].empName,
          fromDate: `0${m}/0${(i % 28) + 1}/2025`,
          toDate: `0${m}/0${(i % 28) + 1}/2025`,
          days: otLeaveData[i][`month${m}`],
          reason: 'Phép bù tăng ca'
        }
      ]
    }
  }
  // Đã nghỉ phép bù: gom tất cả phiếu nghỉ phép bù trong năm
  otTickets[empId]['total'] = Object.values(otTickets[empId]).flat()
}

function openLeaveModal(emp, month, type = 'annual', field = 'month') {
  modalEmployee.value = emp
  modalMonth.value = month
  modalType.value = type
  modalField.value = field
  showModal.value = true
}

function getTickets(empId, month, type, field) {
  if (type === 'annual') {
    if (field === 'month') return leaveTickets[empId]?.[month] || []
    if (field === 'totalUsed') return leaveTickets[empId]?.['total'] || []
  }
  if (type === 'otLeave') {
    if (field === 'month') return otTickets[empId]?.[month] || []
    if (field === 'otLeaveUsed') return otTickets[empId]?.['total'] || []
  }
  return []
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="leave-tabs-bar mb-3">
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
    <div v-if="activeTab === 'annual'">
      <div class="table-responsive leave-table">
        <DataTable :columns="leaveColumns" :data="paginatedLeaveData">
          <template v-for="i in 12" #[`month${i}`]="{ item }">
            <span
              v-if="item[`month${i}`] > 0"
              class="leave-cell clickable"
              @click.stop="openLeaveModal(item.empId, i, 'annual', 'month')"
              title="Xem phiếu nghỉ phép"
            >
              {{ item[`month${i}`] }}
            </span>
            <span v-else class="leave-cell">{{ item[`month${i}`] }}</span>
          </template>
          <template #empId="{ item }">
            <span class="emp-id">{{ item.empId }}</span>
          </template>
          <template #empName="{ item }">
            <span class="emp-name">{{ item.empName }}</span>
          </template>
          <template #joinDate="{ item }">
            <span class="join-date">{{ item.joinDate }}</span>
          </template>
          <template #leavePolicy="{ item }">
            <span class="leave-policy">{{ item.leavePolicy }}</span>
          </template>
          <template #seniorityLeave="{ item }">
            <span class="seniority-leave">{{ item.seniorityLeave }}</span>
          </template>
          <template #totalLeave="{ item }">
            <span class="total-leave">{{ item.totalLeave }}</span>
          </template>
          <template #totalUsed="{ item }">
            <span
              class="total-used clickable"
              @click.stop="openLeaveModal(item.empId, 'total', 'annual', 'totalUsed')"
              title="Xem tất cả phiếu nghỉ phép năm"
            >
              {{ item.totalUsed }}
            </span>
          </template>
          <template #leaveRemain="{ item }">
            <span class="leave-remain">{{ item.leaveRemain }}</span>
          </template>
          <template #seniorityDate="{ item }">
            <span class="seniority-date">{{ item.seniorityDate }}</span>
          </template>
        </DataTable>
        <Pagination
          :totalItems="leaveData.length"
          :itemsPerPage="annualItemsPerPage"
          :currentPage="annualCurrentPage"
          @update:currentPage="annualCurrentPage = $event"
        />
      </div>
    </div>
    <div v-else-if="activeTab === 'otLeave'">
      <div class="table-responsive leave-table">
        <DataTable :columns="otLeaveColumns" :data="paginatedOtLeaveData">
          <template v-for="i in 12" #[`month${i}`]="{ item }">
            <span
              v-if="item[`month${i}`] > 0"
              class="leave-cell leave-ot clickable"
              @click.stop="openLeaveModal(item.empId, i, 'otLeave', 'month')"
              title="Xem phiếu phép bù tăng ca"
            >
              {{ item[`month${i}`] }}
            </span>
            <span v-else class="leave-cell">{{ item[`month${i}`] }}</span>
          </template>
          <template #empId="{ item }">
            <span class="emp-id">{{ item.empId }}</span>
          </template>
          <template #empName="{ item }">
            <span class="emp-name">{{ item.empName }}</span>
          </template>
          <template #totalOTHours="{ item }">
            <span class="ot-hours">{{ item.totalOTHours }}</span>
          </template>
          <template #otLeaveDays="{ item }">
            <span class="ot-leave-days">{{ item.otLeaveDays }}</span>
          </template>
          <template #otLeaveUsed="{ item }">
            <span
              class="ot-leave-used clickable"
              @click.stop="openLeaveModal(item.empId, 'total', 'otLeave', 'otLeaveUsed')"
              title="Xem tất cả phiếu phép bù tăng ca"
            >
              {{ item.otLeaveUsed }}
            </span>
          </template>
          <template #otLeaveRemain="{ item }">
            <span class="ot-leave-remain">{{ item.otLeaveRemain }}</span>
          </template>
        </DataTable>
        <Pagination
          :totalItems="otLeaveData.length"
          :itemsPerPage="otItemsPerPage"
          :currentPage="otCurrentPage"
          @update:currentPage="otCurrentPage = $event"
        />
      </div>
    </div>
    <ModalDialog
      v-model:show="showModal"
      :title="modalType === 'annual'
        ? (modalField === 'month'
            ? `Phiếu nghỉ phép năm - ${modalEmployee} tháng ${modalMonth}`
            : `Tất cả phiếu nghỉ phép năm - ${modalEmployee}`)
        : (modalField === 'month'
            ? `Phiếu phép bù tăng ca - ${modalEmployee} tháng ${modalMonth}`
            : `Tất cả phiếu phép bù tăng ca - ${modalEmployee}`)"
      size="xl"
      scrollable
    >
      <div class="modal-leave-table">
        <DataTable
          :columns="leaveTicketColumns"
          :data="getTickets(modalEmployee, modalMonth, modalType, modalField)"
        >
          <template #ticketId="{ item }">
            <span class="ticket-id">{{ item.ticketId }}</span>
          </template>
          <template #empName="{ item }">
            <span class="ticket-name">{{ item.empName }}</span>
          </template>
          <template #fromDate="{ item }">
            <span class="ticket-date">{{ item.fromDate }}</span>
          </template>
          <template #toDate="{ item }">
            <span class="ticket-date">{{ item.toDate }}</span>
          </template>
          <template #days="{ item }">
            <span class="ticket-days">{{ item.days }}</span>
          </template>
          <template #reason="{ item }">
            <span class="ticket-reason">{{ item.reason }}</span>
          </template>
        </DataTable>
      </div>
    </ModalDialog>
  </div>
</template>

<style scoped>
.leave-tabs-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
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
.leave-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0d6efd;
  letter-spacing: 0.5px;
}
.leave-table {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(13,110,253,0.07);
  padding: 0;
  margin-bottom: 0;
}
.leave-cell {
  display: inline-block;
  min-width: 32px;
  text-align: center;
  padding: 4px 0;
  border-radius: 6px;
  background: #f8f9fa;
  color: #222;
  font-weight: 500;
  cursor: default;
  transition: background 0.18s, color 0.18s;
}
.leave-cell.clickable {
  background: #eafbe7;
  color: #0d6efd;
  cursor: pointer;
}
.leave-cell.clickable:hover {
  background: #d1e7dd;
  color: #0a58ca;
}
.leave-cell.leave-ot {
  background: #e0f7fa;
  color: #009688;
  font-weight: 600;
}
.emp-id, .emp-name, .join-date, .leave-policy, .seniority-leave, .total-leave, .total-used, .leave-remain, .seniority-date,
.ot-hours, .ot-leave-days, .ot-leave-used, .ot-leave-remain {
  font-weight: 500;
  font-size: 1rem;
  color: #222;
  padding: 2px 8px;
  display: inline-block;
  text-align: left;
}
.total-used.clickable, .ot-leave-used.clickable {
  background: #eafbe7;
  color: #0d6efd;
  border-radius: 6px;
  cursor: pointer;
  padding: 4px 8px;
  font-weight: 600;
  transition: background 0.18s, color 0.18s;
}
.total-used.clickable:hover, .ot-leave-used.clickable:hover {
  background: #d1e7dd;
  color: #0a58ca;
}
.table th {
  background-color: #f5f7fa;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  min-width: 100px;
  font-size: 1rem;
  font-weight: 600;
  color: #0d6efd;
}
.table td,
.table th {
  padding: 0.75rem;
  vertical-align: middle;
}
.table tr {
  transition: background 0.18s;
}
.table tr:hover {
  background: #f0f6ff;
}
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: rgba(0, 123, 255, 0.05);
}
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.modal-leave-table {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 16px rgba(13,110,253,0.12);
  padding: 16px 8px;
  margin: 0;
}
.ticket-id, .ticket-name, .ticket-date, .ticket-days, .ticket-reason {
  font-size: 1.05rem;
  font-weight: 500;
  color: #222;
  padding: 4px 12px;
  display: inline-block;
  border-radius: 6px;
  background: #f8f9fa;
  margin-bottom: 2px;
}
.ticket-id {
  color: #0d6efd;
  background: #eafbe7;
}
.ticket-days {
  color: #009688;
  background: #e0f7fa;
}
.ticket-reason {
  color: #ff6b6b;
  background: #fff0f0;
}
.modal-leave-table .table th {
  background: #f5f7fa;
  color: #0d6efd;
  font-size: 1.05rem;
  font-weight: 600;
}
.modal-leave-table .table td {
  background: #fff;
  font-size: 1.05rem;
  vertical-align: middle;
}
</style>