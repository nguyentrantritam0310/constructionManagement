<script setup>
import { ref } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'

const orders = ref([
  {
    id: 1,
    supplier: 'Nhà cung cấp A',
    date: '2023-10-01',
    status: 'Chờ nhập kho',
    materials: [
      { name: 'Xi măng', quantity: 100, unit: 'Bao' },
      { name: 'Gạch', quantity: 500, unit: 'Viên' }
    ]
  },
  {
    id: 2,
    supplier: 'Nhà cung cấp B',
    date: '2023-10-02',
    status: 'Chờ nhập kho',
    materials: [
      { name: 'Cát', quantity: 200, unit: 'Khối' },
      { name: 'Thép', quantity: 50, unit: 'Tấn' }
    ]
  }
])

const columns = [
  { key: 'id', label: 'Mã Đơn Hàng' },
  { key: 'supplier', label: 'Nhà Cung Cấp' },
  { key: 'date', label: 'Ngày Đặt' },
  { key: 'status', label: 'Trạng Thái' }
]

const showDetails = ref(false)
const selectedOrder = ref(null)
const actualQuantities = ref([])

const openDetails = (order) => {
  selectedOrder.value = order
  actualQuantities.value = order.materials.map(material => ({
    name: material.name,
    expected: material.quantity,
    actual: material.quantity,
    unit: material.unit,
    note: ''
  }))
  showDetails.value = true
  document.body.classList.add('modal-open')
}

const closeDetails = () => {
  showDetails.value = false
  document.body.classList.remove('modal-open')
}

const handleConfirmEntry = () => {
  // Update the order status and log the warehouse entry
  selectedOrder.value.status = 'Đã nhập kho'
  alert('Nhập kho thành công!')
  closeDetails()
}

const handleReportIssue = (material) => {
  alert(`Báo cáo sự cố cho vật tư: ${material.name}`)
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Nhập Kho</h1>
    </div>

    <DataTable
      :columns="columns"
      :data="orders"
      @row-click="openDetails"
    >
      <template #actions="{ item }">
        <button class="btn btn-primary btn-sm" @click="openDetails(item)">
          Nhập Kho
        </button>
      </template>
    </DataTable>

    <!-- Modal for Order Details -->
    <ModalDialog
      v-model:show="showDetails"
      title="Chi Tiết Đơn Hàng"
      size="lg"
    >
      <div v-if="selectedOrder">
        <h5>Nhà Cung Cấp: {{ selectedOrder.supplier }}</h5>
        <p>Ngày Đặt: {{ selectedOrder.date }}</p>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Tên Vật Tư</th>
              <th>Số Lượng Dự Kiến</th>
              <th>Số Lượng Thực Tế</th>
              <th>Đơn Vị</th>
              <th>Ghi Chú</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(material, index) in actualQuantities" :key="index">
              <td>{{ material.name }}</td>
              <td>{{ material.expected }}</td>
              <td>
                <input
                  type="number"
                  v-model="material.actual"
                  class="form-control"
                />
              </td>
              <td>{{ material.unit }}</td>
              <td>
                <input
                  type="text"
                  v-model="material.note"
                  class="form-control"
                  placeholder="Ghi chú (nếu có)"
                />
              </td>
              <td>
                <button
                  class="btn btn-danger btn-sm"
                  @click="handleReportIssue(material)"
                >
                  Báo Cáo Sự Cố
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end">
          <ActionButton
            icon="fas fa-check"
            type="primary"
            @click="handleConfirmEntry"
          >
            Hoàn Tất Nhập Kho
          </ActionButton>
          <ActionButton
            icon="fas fa-times"
            type="secondary"
            @click="closeDetails"
          >
            Hủy
          </ActionButton>
        </div>
      </div>
    </ModalDialog>
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
