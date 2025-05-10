<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useWarehouseEntry } from '../../composables/useWarehouseEntry'

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

const filteredOrders = ref([])

const columns = [
  { key: 'id', label: 'Mã Đơn Hàng' },
  { key: 'supplier', label: 'Nhà Cung Cấp' },
  { key: 'date', label: 'Ngày Đặt' },
  { key: 'status', label: 'Trạng Thái' }
]

const showDetails = ref(false)
const selectedOrder = ref(null)
const actualQuantities = ref([])

const {
  importOrders,
  loading,
  error,
  formData,
  fetchImportOrders,
  createImportOrder,
  updateImportOrder,
  updateImportOrderStatus
} = useWarehouseEntry()

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  fetchImportOrders()
})

const handleConfirmEntry = async () => {
  try {
    await updateImportOrderStatus(selectedOrder.value.id, 'Completed')
    alert('Nhập kho thành công!')
    closeDetails()
  } catch (err) {
    console.error('Error confirming entry:', err)
    alert('Có lỗi xảy ra khi xác nhận nhập kho')
  }
}

const handleReportIssue = async (material) => {
  try {
    await updateImportOrderStatus(selectedOrder.value.id, 'Issue')
    alert(`Đã báo cáo sự cố cho vật tư: ${material.name}`)
  } catch (err) {
    console.error('Error reporting issue:', err)
    alert('Có lỗi xảy ra khi báo cáo sự cố')
  }
}

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
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Nhập Kho</h1>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter
      :items="orders"
      :searchFields="['supplier']"
      dateField="date"
      statusField="status"
      v-model:filteredItems="filteredOrders"
    />

    <!-- Danh sách đơn hàng -->
    <DataTable :columns="columns" :data="paginatedOrders" @row-click="openDetails">
      <template #actions="{ item }">
        <button class="btn btn-primary btn-sm" @click="openDetails(item)">
          Nhập Kho
        </button>
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedOrders.length }} trên {{ filteredOrders.length }} đơn hàng
      </div>
      <Pagination
        :total-items="filteredOrders.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <!-- Modal for Order Details -->
    <ModalDialog v-model:show="showDetails" title="Chi Tiết Đơn Hàng" size="lg">
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
                <input type="number" v-model="material.actual" class="form-control" />
              </td>
              <td>{{ material.unit }}</td>
              <td>
                <input type="text" v-model="material.note" class="form-control" placeholder="Ghi chú (nếu có)" />
              </td>
              <td>
                <button class="btn btn-danger btn-sm" @click="handleReportIssue(material)">
                  Báo Cáo Sự Cố
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-end">
          <ActionButton icon="fas fa-check" type="primary" @click="handleConfirmEntry">
            Hoàn Tất Nhập Kho
          </ActionButton>
          <ActionButton icon="fas fa-times" type="secondary" @click="closeDetails">
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
