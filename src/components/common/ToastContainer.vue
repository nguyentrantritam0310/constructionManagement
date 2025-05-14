<template>
    <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
            {{ toast.message }}
        </div>
    </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast'
const { toasts } = useToast()
</script>

<style scoped>
.toast-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
}

.toast {
    margin-bottom: 12px;
    padding: 12px 20px;
    border-radius: 4px;
    color: #fff;
    min-width: 200px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-size: 1rem;
    animation: fadeIn 0.3s;
}

.toast.success {
    background: #28a745;
}

.toast.error {
    background: #dc3545;
}

.toast.warning {
    background: #ffc107;
    color: #212529;
}

.toast.info {
    background: #17a2b8;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>