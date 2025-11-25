<script setup>
import { reactive, watch, toRefs } from 'vue'
import FormField from '@/components/common/FormField.vue'

const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
  workshift: { type: Object, default: () => ({}) },
  employees: { type: Array, default: () => [] }, // danh sách nhân viên
  departments: { type: Array, default: () => [] } // danh sách phòng ban
})

const emit = defineEmits(['close'])

const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

// Always show all weekdays, map shiftDetails to correct day index, keep inactive days visible
const formData = reactive({
  shiftName: props.workshift.shiftName || '',
  assignedType: 'employee',
  assignedId: '',
  days: weekDays.map((dayName) => {
    // Find shiftDetail for this weekday by dayOfWeek
    const detail = props.workshift.shiftDetails?.find(d => d.dayOfWeek === dayName)
    return {
      day: dayName,
      id: detail ? detail.id ?? 0 : 0,
      workShiftID: detail ? detail.workShiftID ?? 0 : 0,
      active: !!detail,
      startTime: detail ? detail.startTime ?? '' : '',
      endTime: detail ? detail.endTime ?? '' : '',
      breakStart: detail ? detail.breakStart ?? '' : '',
      breakEnd: detail ? detail.breakEnd ?? '' : '',
      workHours: 0,
      workDate: 0
    }
  }),
  totalHours: 0,
  totalDays: 0
})

const calculateHours = (day) => {
  if (!day.active) {
    day.workHours = 0
    day.workDate = 0
    return
  }
  const parseTime = (t) => t ? t.split(':').map(Number) : [0, 0]
  const [sh, sm] = parseTime(day.startTime)
  const [eh, em] = parseTime(day.endTime)
  const [lh, lm] = parseTime(day.breakStart)
  const [lhEnd, lmEnd] = parseTime(day.breakEnd)

  let hours = (eh + em / 60) - (sh + sm / 60) - ((lhEnd + lmEnd / 60) - (lh + lm / 60))
  if (hours < 0) hours = 0
  day.workHours = Number(hours.toFixed(2))
  day.workDate = Number((hours / 8).toFixed(2))
}

// Watch từng ngày
formData.days.forEach(day => {
  watch(
    () => [day.startTime, day.endTime, day.breakStart, day.breakEnd, day.active],
    () => {
      calculateHours(day)
      formData.totalHours = formData.days.reduce((sum, d) => sum + d.workHours, 0).toFixed(2)
      formData.totalDays = formData.days.reduce((sum, d) => sum + d.workDate, 0).toFixed(2)
    },
    { immediate: true }
  )
})

const copyToAll = (sourceDay) => {
  if (!sourceDay.active) {
    return;
  }
  formData.days.forEach(day => {
    if (day.active && day.day !== sourceDay.day) {
      day.startTime = sourceDay.startTime;
      day.endTime = sourceDay.endTime;
      day.breakStart = sourceDay.breakStart;
      day.breakEnd = sourceDay.breakEnd;
    }
  });
}
const padTime = (t) => {
  if (!t) return '00:00:00'
  // Nếu đã có giây thì giữ nguyên, nếu chỉ có HH:mm thì thêm :00
  return t.length === 5 ? t + ':00' : t
}

const handleSubmit = () => {
  // Chỉ lấy những ngày có active = true để tạo shiftDetail
  // Backend sẽ xóa tất cả shiftDetails cũ và tạo lại từ danh sách này
  // Vì vậy những ngày không active sẽ không được tạo lại, tức là bị xóa
  const shiftDetails = formData.days
    .filter(day => day.active) // Chỉ lấy những ngày được bật toggle "Áp dụng"
    .map((day, idx) => ({
      id: day.id ?? 0,
      workShiftID: day.workShiftID ?? 0,
      dayOfWeek: day.day,
      startTime: padTime(day.startTime),
      endTime: padTime(day.endTime),
      breakStart: padTime(day.breakStart),
      breakEnd: padTime(day.breakEnd)
    }))
  
  const payload = {
    shiftName: formData.shiftName,
    shiftDetails
  }
  emit('submit', payload)
  // emit('close')
}

const handleClose = () => emit('close')
</script>

<template>
  <form @submit.prevent="handleSubmit" class="p-4 bg-white rounded shadow-sm">
    <div class="row g-3 mb-4">
      <div class="col-md-12">
        <FormField label="Tên ca" type="text" v-model="formData.shiftName" required />
      </div>
      <div class="col-md-6" v-if="formData.assignedType === 'department'">
        <FormField label="Chọn phòng ban" type="select" v-model="formData.assignedId" required>
          <option v-for="dep in departments" :key="dep.id" :value="dep.id">{{ dep.name }}</option>
        </FormField>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table shift-schedule-table">
        <thead>
          <tr>
            <th>Thứ</th>
            <th>Áp dụng</th>
            <th>Giờ vào</th>
            <th>Giờ ra</th>
            <th>Giờ công</th>
            <th>Ngày công</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(day, i) in formData.days" :key="i" :class="{ 'inactive': !day.active }">
            <td class="day-name">{{ day.day }}</td>
            <td class="text-center">
              <label class="switch">
                <input type="checkbox" v-model="day.active">
                <span class="slider round"></span>
              </label>
            </td>
            <td>
              <div class="time-range-input">
                <input type="time" v-model="day.startTime" class="form-control form-control-sm"
                  :disabled="!day.active" />
                <span>-</span>
                <input type="time" v-model="day.endTime" class="form-control form-control-sm" :disabled="!day.active" />
              </div>
            </td>
            <td>
              <div class="time-range-input">
                <input type="time" v-model="day.breakStart" class="form-control form-control-sm"
                  :disabled="!day.active" />
                <span>-</span>
                <input type="time" v-model="day.breakEnd" class="form-control form-control-sm"
                  :disabled="!day.active" />
              </div>
            </td>
            <td class="text-center work-hours">{{ day.workHours }}</td>
            <td class="text-center work-hours">{{ day.workDate }}</td>
            <td class="text-center">
              <button type="button" @click="copyToAll(day)" class="btn-copy" title="Áp dụng cho tất cả"
                :disabled="!day.active">
                <i class="fas fa-copy"></i>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="fw-bold">
            <td colspan="4" class="text-end">Tổng tuần:</td>
            <td class="text-center">{{ formData.totalHours }}</td>
            <td class="text-center">{{ formData.totalDays }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary btn-gradient">{{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới'
        }}</button>
    </div>
  </form>
</template>

<style scoped>
form {
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.shift-schedule-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  /* Add space between rows */
}

.shift-schedule-table thead th {
  background-color: #f8f9fa;
  color: #495057;
  text-align: center;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shift-schedule-table tbody tr {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease-in-out;
}

.shift-schedule-table tbody tr:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
}

.shift-schedule-table tbody tr.inactive {
  background-color: #f8f9fa;
  opacity: 0.7;
}

.shift-schedule-table tbody tr.inactive:hover {
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.shift-schedule-table tbody td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  border: none;
  border-bottom: 1px solid #f1f3f5;
}

.shift-schedule-table tbody tr td:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.shift-schedule-table tbody tr td:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.day-name {
  font-weight: 600;
  color: #343a40;
  text-align: left;
}

.time-range-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.time-range-input span {
  color: #adb5bd;
}

.form-control-sm {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.375rem 0.5rem;
  text-align: center;
  transition: 0.2s all;
  font-size: 0.9rem;
  background-color: #fff;
  color: #212529;
  font-weight: 500;
  max-width: 100px;
}

.form-control-sm:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, .25);
  outline: none;
}

.form-control-sm:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.work-hours {
  font-weight: 600;
  font-size: 1rem;
  color: #0d6efd;
}

tfoot td {
  padding: 1rem;
  font-weight: 600;
  border-top: 2px solid #e9ecef;
  text-align: center;
  background-color: #f1f5f9;
  color: #1a202c;
}

tfoot td.text-end {
  text-align: right !important;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
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
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #28a745;
}

input:focus+.slider {
  box-shadow: 0 0 1px #28a745;
}

input:checked+.slider:before {
  transform: translateX(20px);
}

/* Copy Button */
.btn-copy {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-copy:hover:not(:disabled) {
  background-color: #e9ecef;
  color: #0d6efd;
}

.btn-copy:disabled {
  color: #ced4da;
  cursor: not-allowed;
}
</style>
