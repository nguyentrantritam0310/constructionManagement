<template>
    <teleport to="body">
        <ModalDialog :show="show" @update:show="closeMessage"
            :title="type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : 'Thông báo'" size="sm"
            customZIndex="99999">
            <div :class="['alert', alertClass, 'mb-0', 'text-center']">
                {{ message }}
            </div>
            <div class="d-flex justify-content-center mt-3">
                <button class="btn btn-primary" @click="closeMessage">Đóng</button>
            </div>
        </ModalDialog>
    </teleport>
</template>

<script setup>
import { computed } from 'vue'
import ModalDialog from './ModalDialog.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const { show, message, type, closeMessage } = useGlobalMessage()

const alertClass = computed(() => {
    switch (type.value) {
        case 'success': return 'alert-success'
        case 'error': return 'alert-danger'
        case 'warning': return 'alert-warning'
        default: return 'alert-info'
    }
})
</script>

<style scoped>
/* Đảm bảo modal thông báo luôn nổi trên cùng */
:deep(.modal) {
    z-index: 99999 !important;
}

:deep(.modal-backdrop) {
    z-index: 99998 !important;
}
</style>