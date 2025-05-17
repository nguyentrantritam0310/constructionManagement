import { ref } from 'vue'
import { CONSTRUCTION_STATUS } from '../constants/status'

// Định nghĩa các trạng thái cơ bản
export const STATUS_TYPES = {
  CONSTRUCTION: 'construction',
  ITEM: 'item',
  PLAN: 'plan',
  TASK: 'task'
}

// Định nghĩa các trạng thái với ID
export const STATUS = {
  WAITING: { id: 1, name: 'Chờ khởi công' },
  IN_PROGRESS: { id: 2, name: 'Đang thi công' },
  SUSPENDED: { id: 3, name: 'Tạm dừng' },
  COMPLETED: { id: 4, name: 'Hoàn thành' },
  CANCELLED: { id: 5, name: 'Hủy bỏ' },
  WAITING_ASSIGNMENT: { id: 6, name: 'Chờ phân công' }
}

const statusTransitions = {
  construction: {
    'Chờ khởi công': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Đang thi công': [STATUS.SUSPENDED, STATUS.COMPLETED, STATUS.CANCELLED],
    'Tạm dừng': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Hoàn thành': [],
    'Hủy bỏ': []
  },
  item: {
    'Chờ khởi công': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Đang thi công': [STATUS.SUSPENDED, STATUS.COMPLETED, STATUS.CANCELLED],
    'Tạm dừng': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Hoàn thành': [],
    'Hủy bỏ': []
  },
  plan: {
    'Chờ khởi công': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Đang thi công': [STATUS.SUSPENDED, STATUS.COMPLETED, STATUS.CANCELLED],
    'Tạm dừng': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Hoàn thành': [],
    'Hủy bỏ': []
  },
  task: {
    'Chờ khởi công': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Đang thi công': [STATUS.SUSPENDED, STATUS.COMPLETED, STATUS.CANCELLED],
    'Tạm dừng': [STATUS.IN_PROGRESS, STATUS.CANCELLED],
    'Hoàn thành': [],
    'Hủy bỏ': []
  }
}

const statusWarnings = {
  'Hủy bỏ': 'Bạn có chắc chắn muốn hủy bỏ? Hành động này không thể hoàn tác.',
  'Tạm dừng': 'Việc tạm dừng có thể ảnh hưởng đến tiến độ dự án.',
  'Hoàn thành': 'Xác nhận hoàn thành sẽ khóa các thay đổi tiếp theo.'
}

export function useStatusTransition(type) {
  const getStatusOptions = (currentStatus) => {
    const transitions = statusTransitions[type] || {}
    const availableStatuses = transitions[currentStatus] || []

    return availableStatuses.map(status => ({
      value: status.id,
      label: status.name
    }))
  }

  const getStatusWarning = (status) => {
    return statusWarnings[status] || null
  }

  return {
    getStatusOptions,
    getStatusWarning
  }
}
