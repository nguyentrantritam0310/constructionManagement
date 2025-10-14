import { ref, computed } from 'vue'
import { contractService } from '../services/contractService'
import { useGlobalMessage } from './useGlobalMessage'

export function useContract() {
    const contracts = ref([])
    const loading = ref(false)
    const error = ref(null)
    const { showMessage } = useGlobalMessage()
    
    // Computed property để tính toán nhân viên chưa có hợp đồng
    const employeesWithoutContract = computed(() => {
        // Sẽ được set từ bên ngoài (từ useEmployee)
        return []
    })

    const fetchAllContracts = async () => {
        loading.value = true
        error.value = null
        try {
            contracts.value = await contractService.getAllContracts();
        } catch (err) {
            console.error('Error in fetchAllContracts:', err)
            error.value = 'Không thể tải danh sách hợp đồng '
            showMessage(error.value, 'error')
        } finally {
            loading.value = false
        }
    }
    
    // Function để tính toán nhân viên chưa có hợp đồng
    const calculateEmployeesWithoutContract = (allEmployees) => {
        if (!allEmployees || !contracts.value) {
            return []
        }

        // Lấy danh sách employeeID đã có hợp đồng
        const employeeIdsWithContract = new Set(
            contracts.value.map(contract => contract.employeeID)
        )

        // Lọc ra những nhân viên chưa có hợp đồng
        return allEmployees.filter(employee => 
            !employeeIdsWithContract.has(employee.id)
        )
    }

    const deleteContract = async (contractId) => {
        loading.value = true
        error.value = null
        try {
            await contractService.deleteContract(contractId)
            // Remove from local array
            contracts.value = contracts.value.filter(c => c.id !== contractId)
            showMessage('Xóa hợp đồng thành công!', 'success')
        } catch (err) {
            console.error('Error in deleteContract:', err)
            error.value = 'Không thể xóa hợp đồng'
            showMessage(error.value, 'error')
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        contracts,
        loading,
        error,
        employeesWithoutContract,
        fetchAllContracts,
        calculateEmployeesWithoutContract,
        deleteContract
    }
}
