<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    searchQuery: {
        type: String,
        required: true
    },
    statusFilter: {
        type: String,
        required: true
    },
    dateRangeFilter: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['update:searchQuery', 'update:statusFilter', 'update:dateRangeFilter', 'resetFilters'])

const handleResetFilters = () => {
    emit('resetFilters')
}
</script>

<template>
    <div class="row g-3">
        <!-- Tìm kiếm -->
        <div class="col-md-4">
            <div class="input-group">
                <span class="input-group-text">
                    <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control" :value="searchQuery"
                    @input="$emit('update:searchQuery', $event.target.value)"
                    placeholder="Tìm kiếm theo tên, địa điểm...">
            </div>
        </div>

        <!-- Lọc theo trạng thái -->
        <div class="col-md-3">
            <select class="form-select" :value="statusFilter"
                @change="$emit('update:statusFilter', $event.target.value)">
                <option value="all">Tất cả trạng thái</option>
                <option value="In Progress">Đang thực hiện</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Suspended">Tạm dừng</option>
                <option value="Planning">Đang lên kế hoạch</option>
            </select>
        </div>

        <!-- Lọc theo khoảng thời gian -->
        <div class="col-md-4">
            <div class="input-group">
                <input type="date" class="form-control" :value="dateRangeFilter.start"
                    @input="$emit('update:dateRangeFilter', { ...dateRangeFilter, start: $event.target.value })"
                    placeholder="Từ ngày">
                <span class="input-group-text">đến</span>
                <input type="date" class="form-control" :value="dateRangeFilter.end"
                    @input="$emit('update:dateRangeFilter', { ...dateRangeFilter, end: $event.target.value })"
                    placeholder="Đến ngày">
            </div>
        </div>

        <!-- Nút reset -->
        <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" @click="handleResetFilters" title="Đặt lại bộ lọc">
                <i class="fas fa-undo"></i>
            </button>
        </div>
    </div>
</template>

<style scoped>
.input-group-text {
    background-color: #f8f9fa;
    border-right: none;
}

.input-group .form-control {
    border-left: none;
}

.input-group .form-control:focus {
    border-color: #ced4da;
    box-shadow: none;
}

.input-group .form-control:focus+.input-group-text {
    border-color: #ced4da;
}

.form-select:focus {
    border-color: #ced4da;
    box-shadow: none;
}
</style>