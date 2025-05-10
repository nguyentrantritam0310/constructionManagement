<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import FilterSearch from '../../components/common/FilterSearch.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import MaterialForm from '../../components/material/MaterialForm.vue'
import WarehouseEntryForm from '../../components/warehouse/WarehouseEntryForm.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'

const {
  materials,
  loading,
  error,
  formData,
  fetchMaterials,
  createMaterial,
  updateMaterial,
  updateMaterialStatus
} = useMaterialManagement()

const selectedProject = ref(null)
const filteredMaterials = ref([])

onMounted(() => {
  fetchMaterials()
})

const columns = [
  { key: 'id', label: 'Mã Vật Tư' },
  { key: 'materialName', label: 'Tên Vật Tư' },
  { key: 'stockQuantity', label: 'Tồn kho' },
  { key: 'materialTypeName', label: 'Loại Vật Tư' },
  { key: 'unitPrice', label: 'Đơn Giá' },
  { key: 'status', label: 'Trạng Thái' }
]

const showForm = ref(false)
const formMode = ref('add') // 'add' or 'edit'

const openForm = (mode, material = null) => {
  formMode.value = mode
  if (mode === 'edit' && material) {
    formData.value = { ...material }
  } else {
    formData.value = {
      id: null,
      name: '',
      unit: '',
      type: '',
      price: null,
      status: 'Hết hàng'
    }
  }
  showForm.value = true
  document.body.classList.add('modal-open')
}

const closeForm = () => {
  showForm.value = false
  document.body.classList.remove('modal-open')
}

const handleSubmit = async () => {
  try {
    if (formMode.value === 'add') {
      await createMaterial(formData.value)
      alert('Thêm vật tư thành công')
    } else if (formMode.value === 'edit') {
      await updateMaterial(formData.value.id, formData.value)
      alert('Cập nhật thông tin vật tư thành công')
    }
    closeForm()
  } catch (err) {
    console.error('Error handling material:', err)
    alert('Có lỗi xảy ra khi xử lý vật tư')
  }
}

const handleDelete = (id) => {
  materials.value = materials.value.filter(material => material.id !== id)
}

const handleChangeStatus = async (id, newStatus) => {
  try {
    await updateMaterialStatus(id, newStatus)
    const material = materials.value.find(material => material.id === id)
    if (material) {
      alert(`Trạng thái vật tư "${material.materialName}" đã được chuyển thành ${newStatus === 'conhang' ? 'Còn hàng' : 'Hết hàng'}.`)
    }
  } catch (err) {
    console.error('Error updating material status:', err)
    alert('Có lỗi xảy ra khi cập nhật trạng thái vật tư')
  }
}

const statusMaterial = [
  { value: 'conhang', label: 'Còn hàng' },
  { value: 'hethang', label: 'Hết hàng' },
]

const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({ start: null, end: null })

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateRangeFilter.value = { start: null, end: null }
}

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMaterials.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleStatusClick = (material, event) => {
  event.stopPropagation()
  selectedMaterial.value = material
  // Thực hiện logic thay đổi trạng thái tại đây
  handleChangeStatus(material.id, material.status === 'conhang' ? 'hethang' : 'conhang')
}

const selectedMaterial = ref(null)

const handleUpdateClick = (material, event) => {
  event.stopPropagation()
  selectedMaterial.value = material
  openForm('edit', material)
}

const showDetails = ref(false)
const selectedOrder = ref(null)

const openDetails = (order) => {
  selectedOrder.value = order
  showDetails.value = true
}

const closeDetails = () => {
  showDetails.value = false
}

const handleConfirmEntry = async () => {
  try {
    // Xử lý xác nhận nhập kho
    closeDetails()
  } catch (err) {
    console.error('Error confirming entry:', err)
    alert('Có lỗi xảy ra khi xác nhận nhập kho')
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Vật Tư</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Thêm Vật Tư Mới" @click="() => openForm('add')">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter
      :items="materials"
      :searchFields="['materialName', 'materialTypeName']"
      dateField="createdAt"
      statusField="status"
      v-model:filteredItems="filteredMaterials"
    />

    <!-- Danh sách vật tư -->
    <DataTable :columns="columns" :data="paginatedMaterials">
      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="handleUpdateClick(item, $event)" />
          <ChangeStatusButton @click.stop="handleStatusClick(item, $event)" />
        </div>
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedMaterials.length }} trên {{ filteredMaterials.length }} vật tư
      </div>
      <Pagination
        :total-items="filteredMaterials.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <!-- Modal for Add/Edit Form -->
    <FormDialog v-model:show="showForm" :title="formMode === 'add' ? 'Thêm Vật Tư' : 'Cập Nhật Vật Tư'">
      <MaterialForm
        :mode="formMode"
        :material="formData"
        @submit="handleSubmit"
        @cancel="closeForm"
      />
    </FormDialog>

    <!-- Change Status Dialog -->
    <ChangeStatusDialog v-if="selectedProject" :show="showStatusDialog" :project="selectedProject"
      @update:show="showStatusDialog = $event" @submit="handleStatusSubmit" />

    <!-- Separate backdrop -->
    <div v-if="showForm" class="modal-backdrop fade show" @click="closeForm"></div>

    <!-- Modal for Order Details -->
    <FormDialog v-model:show="showDetails" title="Chi Tiết Đơn Hàng">
      <WarehouseEntryForm
        mode="update"
        :order="selectedOrder"
        @submit="handleConfirmEntry"
        @cancel="closeDetails"
      />
    </FormDialog>
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
