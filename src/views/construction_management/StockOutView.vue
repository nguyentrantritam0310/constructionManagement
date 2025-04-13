<script setup>
import { ref } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'

const materials = ref([
  { id: 1, name: 'Xi măng', stock: 100, unit: 'Bao', quantityToExport: 0 },
  { id: 2, name: 'Gạch', stock: 500, unit: 'Viên', quantityToExport: 0 },
  { id: 3, name: 'Cát', stock: 200, unit: 'Khối', quantityToExport: 0 },
  { id: 4, name: 'Thép', stock: 50, unit: 'Tấn', quantityToExport: 0 }
])

const columns = [
  { key: 'id', label: 'Mã Vật Tư' },
  { key: 'name', label: 'Tên Vật Tư' },
  { key: 'stock', label: 'Tồn Kho' },
  { key: 'unit', label: 'Đơn Vị' },
  { key: 'quantityToExport', label: 'Số Lượng Xuất' }
]

const showConfirmation = ref(false)

const handleExport = () => {
  const invalidMaterials = materials.value.filter(
    material => material.quantityToExport > material.stock
  )
  if (invalidMaterials.length > 0) {
    alert('Một số vật tư có số lượng xuất vượt quá tồn kho. Vui lòng kiểm tra lại.')
    return
  }

  materials.value.forEach(material => {
    if (material.quantityToExport > 0) {
      material.stock -= material.quantityToExport
      material.quantityToExport = 0
    }
  })

  alert('Xuất kho thành công!')
  showConfirmation.value = false
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Xuất Kho</h1>
    </div>

    <DataTable :columns="columns" :data="materials">
      <template #actions="{ item }">
        <input
          type="number"
          v-model="item.quantityToExport"
          class="form-control form-control-sm"
          :placeholder="`Tối đa ${item.stock}`"
          :max="item.stock"
          :min="0"
        />
      </template>
    </DataTable>

    <div class="text-end mt-4">
      <ActionButton
        icon="fas fa-check"
        type="primary"
        @click="() => (showConfirmation.value = true)"
      >
        Xác Nhận Xuất Kho
      </ActionButton>
    </div>

    <!-- Confirmation Modal -->
    <ModalDialog
      v-model:show="showConfirmation"
      title="Xác Nhận Xuất Kho"
      size="md"
    >
      <p>Bạn có chắc chắn muốn xuất kho các vật tư đã chọn?</p>
      <div class="text-end">
        <ActionButton
          icon="fas fa-check"
          type="primary"
          @click="handleExport"
        >
          Xác Nhận
        </ActionButton>
        <ActionButton
          icon="fas fa-times"
          type="secondary"
          @click="() => (showConfirmation.value = false)"
        >
          Hủy
        </ActionButton>
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
