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

const {
  materials,
  fetchMaterial
} = useMaterialManagement()

const selectedProject = ref(null)
onMounted(fetchMaterial)

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
const formData = ref({
  id: null,
  name: '',
  unit: '',
  type: '',
  price: null,
  status: 'Hết hàng'
})

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

const handleSubmit = () => {
  if (formMode.value === 'add') {
    const newId = materials.value.length + 1
    materials.value.push({ ...formData.value, id: newId })
    alert('Thêm vật tư thành công')
  } else if (formMode.value === 'edit') {
    const index = materials.value.findIndex(material => material.id === formData.value.id)
    if (index !== -1) {
      materials.value[index] = { ...formData.value }
      alert('Cập nhật thông tin vật tư thành công')
    }
  }
  closeForm()
}

const handleDelete = (id) => {
  materials.value = materials.value.filter(material => material.id !== id)
}

const handleChangeStatus = (id, newStatus) => {
  const material = materials.value.find(material => material.id === id)
  if (material) {
    material.status = newStatus
    alert(`Trạng thái vật tư "${material.materialName}" đã được chuyển thành ${newStatus === 'conhang' ? 'Còn hàng' : 'Hết hàng'}.`)
  }
}

const statusMaterial = [
  { value: 'conhang', label: 'Còn hàng' },
  { value: 'hethang', label: 'Hết hàng' },

]

const searchQuery = ref('')
const statusFilter = ref('all')
const dateRangeFilter = ref({ start: null, end: null })

const filteredMaterials = computed(() => {
  return materials.value.filter(material => {
    const matchesSearch = searchQuery.value === '' || material.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || material.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

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
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Vật Tư</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Thêm Vật Tư Mới" @click="() => openForm('add')">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Bộ lọc và tìm kiếm -->
    <div class="card mb-4">
      <div class="card-body">
        <FilterSearch :searchQuery="searchQuery" :statusFilter="statusFilter" :dateRangeFilter="dateRangeFilter"
          @update:searchQuery="searchQuery = $event" @update:statusFilter="statusFilter = $event"
          @update:dateRangeFilter="dateRangeFilter = $event" @resetFilters="resetFilters" />
      </div>
    </div>

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
      <Pagination :total-items="filteredMaterials.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Modal for Add/Edit Form -->
    <ModalDialog v-model:show="showForm" title="Thông Tin Vật Tư" size="lg">
      <div class="mb-3">
        <label for="name" class="form-label">Tên Vật Tư</label>
        <input id="name" v-model="formData.name" type="text" class="form-control" placeholder="Nhập tên vật tư" />
      </div>
      <div class="mb-3">
        <label for="unit" class="form-label">Đơn Vị Tính</label>
        <input id="unit" v-model="formData.unit" type="text" class="form-control" placeholder="Nhập đơn vị tính" />
      </div>
      <div class="mb-3">
        <label for="type" class="form-label">Loại Vật Tư</label>
        <input id="type" v-model="formData.type" type="text" class="form-control" placeholder="Nhập loại vật tư" />
      </div>
      <div class="mb-3">
        <label for="price" class="form-label">Đơn Giá</label>
        <input id="price" v-model="formData.price" type="number" class="form-control" placeholder="Nhập đơn giá" />
      </div>
      <div class="text-end">
        <ActionButton icon="fas fa-save" type="primary" @click="handleSubmit">
          {{ formMode === 'add' ? 'Thêm Vật Tư' : 'Cập Nhật Vật Tư' }}
        </ActionButton>
        <ActionButton icon="fas fa-times" type="secondary" @click="closeForm">
          Hủy
        </ActionButton>
      </div>
    </ModalDialog>

    <!-- Change Status Dialog -->
    <ChangeStatusDialog v-if="selectedProject" :show="showStatusDialog" :project="selectedProject"
      @update:show="showStatusDialog = $event" @submit="handleStatusSubmit" />

    <!-- Thêm Modal cho form cập nhật -->
    <ModalDialog v-model:show="showUpdateDialog" title="Cập Nhật Dự Án" size="lg">
      <UpdateProjectForm v-if="selectedProject" :project="selectedProject" @update="handleUpdateSubmit"
        @cancel="handleUpdateCancel" />
    </ModalDialog>


    <!-- Separate backdrop -->
    <div v-if="showForm" class="modal-backdrop fade show" @click="closeForm"></div>
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
