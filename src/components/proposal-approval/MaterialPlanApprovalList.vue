<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import { useWarehouseEntry } from '@/composables/useWarehouseEntry'
import StatusBadge from '@/components/common/StatusBadge.vue'
import WarehouseEntryForm from '@/components/warehouse/WarehouseEntryForm.vue'
import ModalDialog from '../common/ModalDialog.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useMaterialPlan } from '../../composables/useMaterialPlan'
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { importOrderService } from '@/services/importOrderService'

const { showMessage } = useGlobalMessage()
const materialPlans = ref([])
const showDetails = ref(false)
const { importOrders, loading, error, fetchByDirector } = useWarehouseEntry()
const { getMaterialPlanByImportOrderID } = useMaterialPlan()
const currentPage = ref(1)
const itemsPerPage = 5

const paginatedOrders = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return importOrders.value.slice(start, end)
})

const handlePageChange = (page) => {
    currentPage.value = page
}
const closeDetails = () => {
    showDetails.value = false
    document.body.classList.remove('modal-open')
}

onMounted(() => {
    fetchByDirector()
})

const columns = [
    { key: 'id', label: 'Mã Đơn Hàng' },
    { key: 'plannerName', label: 'Người lập kế hoạch' },
    { key: 'receiverName', label: 'Người nhập kho' },
    { key: 'importDate', label: 'Ngày Đặt' },
    { key: 'status', label: 'Trạng thái' }
]

const mappedOrders = computed(() => {
    return importOrders.value.map(order => {
        const planner = order.importOrderEmployee?.find(e => e.role === 'Planner')
        const receiver = order.importOrderEmployee?.find(e => e.role === 'Receiver')
        return {
            ...order,
            plannerName: planner ? planner.employeeName : '',
            receiverName: receiver ? receiver.employeeName : '(chưa cập nhật)'
        }
    })
})

const showEntryForm = ref(false)
const selectedOrder = ref(null)

const handleRowClick = (order) => {
    selectedOrder.value = order
    showEntryForm.value = true
}
const openDetails = async (order) => {
    try {
        selectedOrder.value = order
        // Fetch material plans for this import order
        const plans = await getMaterialPlanByImportOrderID(order.id)
        materialPlans.value = plans
        showDetails.value = true
        document.body.classList.add('modal-open')
    } catch (err) {
        console.error('Error fetching material plans:', err)
        showMessage('Có lỗi xảy ra khi tải thông tin vật tư', 'error')
    }
}

const handleApprove = async (item) => {
    try {
        await importOrderService.updateStatus(item.id, 1)
        // Cập nhật lại danh sách hoặc reload
        fetchByDirector()
        // Hiển thị thông báo thành công
        showMessage('Đã duyệt kế hoạch!', 'success')

    } catch (err) {
        console.error('Error fetching material plans:', err)
        // Hiển thị thông báo lỗi
        showMessage('Lỗi khi duyệt!', 'error')
    }
}
const handleReject = async (item) => {
    try {
        await importOrderService.updateStatus(item.id, 2)
        fetchByDirector()
        showMessage('Đã từ chối kế hoạch!', 'success')
    } catch (err) {
        console.error('Error fetching material plans:', err)
        showMessage('Lỗi khi từ chối!', 'error')
    }
}
</script>

<template>
    <div>
        <DataTable :columns="[
            ...columns
        ]" :data="mappedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)"
            @row-click="openDetails">
            <template #id="{ item }">
                <span class="fw-medium text-primary">#{{ item.id }}</span>
            </template>
            <template #plannerName="{ item }">
                <div>{{ item.plannerName }}</div>
            </template>
            <template #receiverName="{ item }">
                <div>{{ item.receiverName }}</div>
            </template>
            <template #importDate="{ item }">
                {{ new Date(item.importDate).toLocaleDateString('vi-VN') }}
            </template>
            <template #status="{ item }">
                <StatusBadge :status="item.status" />
            </template>
            <template #actions="{ item }">
                <button class="btn btn-link text-success p-0 me-2" title="Duyệt" @click.stop="handleApprove(item)"
                    :disabled="item.status !== 'Pending'" @approval="handleApprove(item)">
                    <FontAwesomeIcon :icon="faCheckCircle" size="xl" />
                </button>
                <button class="btn btn-link text-danger p-0" title="Từ chối" @click.stop="handleReject(item)"
                    :disabled="item.status !== 'Pending'">
                    <FontAwesomeIcon :icon="faTimesCircle" size="xl" />
                </button>
            </template>
        </DataTable>
        <div class="d-flex justify-content-between align-items-center mt-4">
            <div class="text-muted">
                Hiển thị {{ Math.min(itemsPerPage, mappedOrders.length - (currentPage - 1) * itemsPerPage) }} trên {{
                    mappedOrders.length }} đơn hàng
            </div>
            <Pagination :total-items="mappedOrders.length" :items-per-page="itemsPerPage" :current-page="currentPage"
                @update:currentPage="handlePageChange" />
        </div>
        <ModalDialog v-model:show="showDetails" title="Chi Tiết Đơn Hàng" size="xl">
            <div v-if="selectedOrder">
                <WarehouseEntryForm :readonly="true" mode="update" :order="selectedOrder"
                    :material-plans="materialPlans" approvalMode @cancel="closeDetails" />
            </div>
        </ModalDialog>

    </div>
</template>