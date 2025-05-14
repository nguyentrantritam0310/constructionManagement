import { ref } from 'vue'

const show = ref(false)
const message = ref('')
const type = ref('success') // 'success' | 'error' | 'info' | 'warning'

export function useGlobalMessage() {
    function showMessage(msg, msgType = 'success') {
        message.value = msg
        type.value = msgType
        show.value = true
    }
    function closeMessage() {
        show.value = false
    }
    return {
        show,
        message,
        type,
        showMessage,
        closeMessage
    }
}