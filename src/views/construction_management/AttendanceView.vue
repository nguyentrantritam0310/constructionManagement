<script setup>
import { ref } from 'vue'
import DataTable from '../../components/common/DataTable.vue'

const activeTab = ref('checkin')

const workers = ref([
  { id: 'worker1', name: 'Thợ 1', phone: '0123456789', selected: false, note: '' },
  { id: 'worker2', name: 'Thợ 2', phone: '0987654321', selected: false, note: '' },
  { id: 'worker3', name: 'Thợ 3', phone: '0912345678', selected: false, note: '' }
])

const confirmAttendance = (type) => {
  const selectedWorkers = workers.value
    .filter(worker => worker.selected)
    .map(worker => ({
      id: worker.id,
      name: worker.name,
      phone: worker.phone,
      note: worker.note
    }))
  console.log({
    type,
    workers: selectedWorkers
  })
}

const columns = [
  { key: 'selected', label: 'Chọn' },
  { key: 'id', label: 'Mã thợ' },
  { key: 'name', label: 'Họ và tên' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'notes', label: 'Ghi chú' }
]


</script>

<template>
  <div class="container-fluid py-4">
    <h1 class="h3 mb-4">Chấm công thợ</h1>

    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'checkin' }"
          @click.prevent="activeTab = 'checkin'"
          href="#"
        >
          Check-in
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'checkout' }"
          @click.prevent="activeTab = 'checkout'"
          href="#"
        >
          Check-out
        </a>
      </li>
    </ul>

    <div class="tab-content mt-4">
      <div v-show="activeTab === 'checkin'">
        <h4>Chấm công đầu ngày</h4>
        <DataTable :data="workers" :columns="columns">
          <template #selected="{ row }">
            <input
              type="checkbox"
              v-model="row.selected"
            />
          </template>
          <template #note="{ row }">
            <textarea
              v-model="row.note"
              class="form-control"
              rows="2"
              placeholder="Ghi chú..."
            ></textarea>
          </template>
        </DataTable>
        <button class="btn btn-primary mt-3" @click="confirmAttendance('checkin')">
          Xác nhận Check-in
        </button>
      </div>

      <div v-show="activeTab === 'checkout'">
        <h4>Chấm công cuối ngày</h4>
        <DataTable :data="workers" :columns="columns">
          <template #selected="{ row }">
            <input
              type="checkbox"
              v-model="row.selected"
            />
          </template>
          <template #note="{ row }">
            <textarea
              v-model="row.note"
              class="form-control"
              rows="2"
              placeholder="Ghi chú..."
            ></textarea>
          </template>
        </DataTable>
        <button class="btn btn-success mt-3" @click="confirmAttendance('checkout')">
          Xác nhận Check-out
        </button>
      </div>
    </div>
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
