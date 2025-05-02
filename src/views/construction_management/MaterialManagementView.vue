<script setup>
import { ref, onMounted } from 'vue'
import { useMaterialManagement } from '../../composables/useMaterialManagement'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'

const {
  materials,
  fetchMaterial
} = useMaterialManagement()

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
    alert('Chuyển trạng thái vật tư thành công')
  }
}

const statusMaterial = [
  { value: 'conhang', label: 'Còn hàng' },
  { value: 'hethang', label: 'Hết hàng' },
  
]


</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Vật Tư</h1>
      <ActionButton
        icon="fas fa-plus"
        type="primary"
        tooltip="Thêm Vật Tư Mới"
        @click="() => openForm('add')"
      >
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <DataTable
      :columns="columns"
      :data="materials"
      @row-click="material => openForm('edit', material)"
    >
      <template #actions="{ item }">
        <button class="btn btn-primary btn-sm me-2" @click="() => openForm('edit', item)">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        <button
          class="btn btn-info btn-sm me-2"
          @click="() => handleChangeStatus(item.id, item.status === 'Hết hàng' ? 'Còn hàng' : 'Hết hàng')"
        >
        <i class="fa-solid fa-sync-alt"></i>

        
        </button>
      </template>
    </DataTable>

    <!-- Modal for Add/Edit Form -->
    <ModalDialog
      v-model:show="showForm"
      title="Thông Tin Vật Tư"
      size="lg"
    >
      <div class="mb-3">
        <label for="name" class="form-label">Tên Vật Tư</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          class="form-control"
          placeholder="Nhập tên vật tư"
        />
      </div>
      <div class="mb-3">
        <label for="unit" class="form-label">Đơn Vị Tính</label>
        <input
          id="unit"
          v-model="formData.unit"
          type="text"
          class="form-control"
          placeholder="Nhập đơn vị tính"
        />
      </div>
      <div class="mb-3">
        <label for="type" class="form-label">Loại Vật Tư</label>
        <input
          id="type"
          v-model="formData.type"
          type="text"
          class="form-control"
          placeholder="Nhập loại vật tư"
        />
      </div>
      <div class="mb-3">
        <label for="price" class="form-label">Đơn Giá</label>
        <input
          id="price"
          v-model="formData.price"
          type="number"
          class="form-control"
          placeholder="Nhập đơn giá"
        />
      </div>
      <div class="text-end">
        <ActionButton
          icon="fas fa-save"
          type="primary"
          @click="handleSubmit"
        >
          {{ formMode === 'add' ? 'Thêm Vật Tư' : 'Cập Nhật Vật Tư' }}
        </ActionButton>
        <ActionButton
          icon="fas fa-times"
          type="secondary"
          @click="closeForm"
        >
          Hủy
        </ActionButton>
      </div>
    </ModalDialog>

    <!-- Separate backdrop -->
    <div
      v-if="showForm"
      class="modal-backdrop fade show"
      @click="closeForm"
    ></div>
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
