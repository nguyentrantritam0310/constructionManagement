import { ref } from 'vue'
import { contractService } from '../services/contractService'
import { useGlobalMessage } from './useGlobalMessage'
export function useContract() {
    const contracts = ref([])
    const loading = ref(false)
    const error = ref(null)
    const { showMessage } = useGlobalMessage()
        const employeesWithoutContract = ref([])
        const loadingEmployeesWithoutContract = ref(false)
        const errorEmployeesWithoutContract = ref(null)

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
    
        const fetchEmployeesWithoutContract = async () => {
            loadingEmployeesWithoutContract.value = true
            errorEmployeesWithoutContract.value = null
            try {
                employeesWithoutContract.value = await contractService.getEmployeesWithoutContract();
            } catch (err) {
                console.error('Error in fetchEmployeesWithoutContract:', err)
                errorEmployeesWithoutContract.value = 'Không thể tải danh sách nhân viên chưa có hợp đồng'
                showMessage(errorEmployeesWithoutContract.value, 'error')
            } finally {
                loadingEmployeesWithoutContract.value = false
            }
        }


    return {
        contracts,
        loading,
        error,
            employeesWithoutContract, 
            loadingEmployeesWithoutContract, 
            errorEmployeesWithoutContract, 
            fetchEmployeesWithoutContract,
        fetchAllContracts
    }
}
