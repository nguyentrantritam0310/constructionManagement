<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  steps: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:show', 'complete'])

const currentStepIndex = ref(0)
const highlightedElement = ref(null)
const highlightRect = ref(null)

const currentStep = computed(() => props.steps[currentStepIndex.value])
const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === props.steps.length - 1)

// Kiểm tra xem có modal đang mở không
// Reactive ref để track modal state
const modalState = ref(0) // Dùng counter để force reactivity

const hasOpenModal = computed(() => {
  // Force reactivity bằng cách access modalState
  const _ = modalState.value
  
  // Tìm modal đang mở với nhiều cách
  const openModal = document.querySelector('.modal.show') || 
                    document.querySelector('.modal-dialog.show') ||
                    document.querySelector('[data-tour="plan-modal"]')?.closest('.modal.show') ||
                    document.querySelector('[data-tour="assignment-modal"]')?.closest('.modal.show') ||
                    document.querySelector('[data-tour="plan-detail-modal"]')?.closest('.modal.show')
  
  // Nếu không tìm thấy, kiểm tra bằng cách khác
  if (!openModal) {
    const allModals = document.querySelectorAll('.modal, .modal-dialog, [data-tour*="modal"]')
    for (const modal of allModals) {
      const style = window.getComputedStyle(modal)
      if (style.display !== 'none' && style.visibility !== 'hidden' && modal.offsetParent !== null) {
        const rect = modal.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          return true
        }
      }
    }
  }
  
  return !!openModal
})

// Đóng modal/form nếu đang mở (trước khi thực hiện action mới)
const closeOpenModals = async () => {
  // Đóng tất cả modal đang mở
  const openModals = document.querySelectorAll('.modal.show')
  if (openModals.length > 0) {
    // Đóng tất cả modal
    openModals.forEach(modal => {
      const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]')
      if (closeBtn) {
        closeBtn.click()
      } else {
        // Nếu không tìm thấy nút đóng, thử đóng bằng cách remove class show
        modal.classList.remove('show')
        modal.style.display = 'none'
        const backdrop = document.querySelector('.modal-backdrop')
        if (backdrop) {
          backdrop.remove()
        }
      }
    })
    // Đợi một chút để animation đóng modal (50ms)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Kiểm tra lại và đóng nếu vẫn còn modal mở
    const stillOpenModals = document.querySelectorAll('.modal.show')
    if (stillOpenModals.length > 0) {
      stillOpenModals.forEach(modal => {
        modal.classList.remove('show')
        modal.style.display = 'none'
      })
      const backdrop = document.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.remove()
      }
    }
  }
}

// Thực hiện action trước khi highlight (mở modal, click button, etc.)
const executeStepAction = async () => {
  const action = currentStep.value?.action
  const targetSelector = currentStep.value?.target
  
  // Kiểm tra xem target có nằm trong modal không
  const isTargetInModal = targetSelector && (
    String(targetSelector).includes('plan-detail-modal') ||
    String(targetSelector).includes('plan-header') ||
    String(targetSelector).includes('add-task-button') ||
    String(targetSelector).includes('tasks-table') ||
    String(targetSelector).includes('workload-column') ||
    String(targetSelector).includes('actual-workload-input') ||
    String(targetSelector).includes('current-volume-column') ||
    String(targetSelector).includes('plan-actions') ||
    String(targetSelector).includes('plan-modal') ||
    String(targetSelector).includes('assignment-modal') ||
    String(targetSelector).includes('material-norm-modal') ||
    String(targetSelector).includes('material-summary') ||
    String(targetSelector).includes('material-detail') ||
    String(targetSelector).includes('select-workers') ||
    String(targetSelector).includes('select-date-range') ||
    String(targetSelector).includes('select-work-shifts') ||
    String(targetSelector).includes('assign-button') ||
    String(targetSelector).includes('first-task-row') ||
    String(targetSelector).includes('bulk-assign-modal') ||
    String(targetSelector).includes('bulk-shift-info') ||
    String(targetSelector).includes('bulk-date-range') ||
    String(targetSelector).includes('bulk-employee-selection') ||
    String(targetSelector).includes('bulk-actions') ||
    String(targetSelector).includes('modal-detail') ||
    String(targetSelector).includes('view-details-modal') ||
    String(targetSelector).includes('change-shift-section') ||
    String(targetSelector).includes('view-details-actions') ||
    String(targetSelector).includes('quick-add-modal') ||
    String(targetSelector).includes('quick-add-shift-select') ||
    String(targetSelector).includes('quick-add-actions') ||
    String(targetSelector).includes('change-shift-modal') ||
    String(targetSelector).includes('current-assignment-info') ||
    String(targetSelector).includes('new-assignment-form') ||
    String(targetSelector).includes('change-shift-actions') ||
    String(targetSelector).includes('employee-modal') ||
    String(targetSelector).includes('day-modal') ||
    String(targetSelector).includes('attendance-history') ||
    String(targetSelector).includes('work-history') ||
    String(targetSelector).includes('leave-form-modal') ||
    String(targetSelector).includes('overtime-modal') ||
    String(targetSelector).includes('image-modal') ||
    String(targetSelector).includes('create-form') ||
    String(targetSelector).includes('import-modal') ||
    String(targetSelector).includes('family-modal') ||
    String(targetSelector).includes('family-form-modal') ||
    String(targetSelector).includes('family-table') ||
    String(targetSelector).includes('extend-modal') ||
    String(targetSelector).includes('terminate-modal') ||
    String(targetSelector).includes('material-norm-modal') ||
    String(targetSelector).includes('material-summary') ||
    String(targetSelector).includes('material-detail') ||
    String(targetSelector).includes('order-detail-modal') ||
    String(targetSelector).includes('warehouse-form') ||
    String(targetSelector).includes('stock-out-detail-modal') ||
    String(targetSelector).includes('stock-out-detail')
  )
  
  if (!action) {
    // Nếu không có action và target không nằm trong modal, đóng các modal đang mở
    if (!isTargetInModal) {
      await closeOpenModals()
    }
    return
  }

  // Đợi DOM update
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))

  try {
    if (action.type === 'click') {
      // Đóng modal cũ trước khi mở modal mới
      await closeOpenModals()
      
      // Click vào một element
      const element = document.querySelector(action.selector)
      if (element) {
        element.click()
        
        // Đợi một chút để modal bắt đầu mở (100ms)
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Nếu có afterAction, thực hiện sau khi modal mở
        if (action.afterAction && typeof action.afterAction === 'function') {
          await action.afterAction()
        }
      }
    } else if (action.type === 'setValue') {
      // Set giá trị cho một biến (thông qua event)
      if (action.eventName) {
        window.dispatchEvent(new CustomEvent(action.eventName, { detail: action.value }))
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    } else if (action.type === 'function') {
      // Gọi một function trực tiếp hoặc từ window
      if (action.func && typeof action.func === 'function') {
        await action.func()
        await new Promise(resolve => setTimeout(resolve, 150))
      } else if (action.functionName && window[action.functionName] && typeof window[action.functionName] === 'function') {
        window[action.functionName](action.params)
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }
  } catch (error) {
    console.warn('Tour action error:', error)
  }
}

// Highlight và scroll đến phần tử
const highlightTarget = async () => {
  // Thực hiện action trước (mở modal, click button, etc.)
  await executeStepAction()

  if (!currentStep.value?.target) {
    highlightedElement.value = null
    highlightRect.value = null
    return
  }

  // Kiểm tra xem có bỏ highlight không
  if (currentStep.value.noHighlight === true) {
    highlightedElement.value = null
    highlightRect.value = null
    return
  }
  
  const targetSelector = currentStep.value.target
  
  // Kiểm tra xem có phải pagination không - nếu là pagination thì không highlight
  const isPagination = String(targetSelector).includes('pagination') || 
                       String(targetSelector).includes('[data-tour="pagination"]')
  
  if (isPagination) {
    // Pagination: không highlight, chỉ hiển thị modal ở giữa màn hình
    highlightedElement.value = null
    highlightRect.value = null
    return
  }

  // Đợi một chút để DOM update
  // Nếu target là first-task-row, đợi lâu hơn để đảm bảo data-tour đã được thêm
  const waitTime = targetSelector.includes('first-task-row') ? 200 : 30
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, waitTime))
  
  let target = null

  // Try multiple ways to find the target
  if (typeof targetSelector === 'string') {
    // Nếu target là modal/form, tìm modal container
    if (targetSelector.includes('create-form') || 
        targetSelector.includes('import-modal') ||
        targetSelector.includes('item-form-modal') ||
        targetSelector.includes('[data-tour="create-form"]') ||
        targetSelector.includes('[data-tour="import-modal"]') ||
        targetSelector.includes('[data-tour="item-form-modal"]')) {
      // Tìm modal đang mở
      const openModal = document.querySelector('.modal.show, .modal-dialog.show')
      if (openModal) {
        // Tìm modal-dialog hoặc modal-content
        target = openModal.querySelector('.modal-dialog') || openModal.querySelector('.modal-content') || openModal
      } else {
        // Nếu modal chưa mở, tìm bằng data-tour
        target = document.querySelector(targetSelector)
        // Nếu tìm thấy, tìm modal container cha
        if (target) {
          const modalContainer = target.closest('.modal-dialog') || target.closest('.modal-content') || target.closest('.modal')
          if (modalContainer) {
            target = modalContainer
          }
        } else {
          // Nếu không tìm thấy bằng data-tour, thử tìm modal bằng class
          const modalByClass = document.querySelector('.modal.show')
          if (modalByClass) {
            target = modalByClass.querySelector('.modal-dialog') || modalByClass.querySelector('.modal-content') || modalByClass
          }
        }
      }
    } else {
    // Try querySelector first
    target = document.querySelector(targetSelector)
    
    // If not found and it's a class selector
    if (!target && targetSelector.startsWith('.')) {
      // Handle multiple classes like ".d-flex.gap-2"
      const classes = targetSelector.substring(1).split('.')
      if (classes.length > 1) {
        // Try to find element that has all classes
        const allElements = document.querySelectorAll('.' + classes[0])
        for (const el of allElements) {
          if (classes.every(cls => el.classList.contains(cls))) {
            target = el
            break
          }
        }
      } else {
        // Single class
        const className = classes[0]
        target = document.querySelector(`[class*="${className}"]`) ||
                 document.getElementsByClassName(className)[0]
      }
    }
    
    // If still not found, try data attribute
    if (!target && targetSelector.includes('[data-')) {
      const match = targetSelector.match(/\[data-([^\]]+)\]/)
      if (match) {
        const attr = match[1].split('=')
        if (attr.length === 2) {
          const key = attr[0].trim()
          const value = attr[1].trim().replace(/['"]/g, '')
          target = document.querySelector(`[data-${key}="${value}"]`)
        } else {
          // Just attribute name without value
          const key = match[1].trim()
          target = document.querySelector(`[data-${key}]`)
        }
      }
    }
      
      // Nếu vẫn không tìm thấy, thử tìm bằng data-tour trực tiếp
      if (!target && targetSelector.includes('data-tour')) {
        const match = targetSelector.match(/data-tour="([^"]+)"/)
        if (match) {
          const tourValue = match[1]
          // Nếu là first-task-row, ưu tiên tìm trong modal đang mở
          if (tourValue === 'first-task-row') {
            const openModal = document.querySelector('.modal.show, [data-tour="plan-modal"]')
            if (openModal) {
              target = openModal.querySelector(`[data-tour="${tourValue}"]`)
            }
          }
          // Nếu chưa tìm thấy, tìm trong toàn bộ document
          if (!target) {
            target = document.querySelector(`[data-tour="${tourValue}"]`)
          }
        }
      }
    
    // Last resort: try to find by text content or other methods
    if (!target && targetSelector.includes('title')) {
      const elements = document.querySelectorAll('h4, h5, h1')
      for (const el of elements) {
        if (el.textContent?.includes('Danh sách đơn nghỉ phép')) {
          target = el
          break
        }
        }
      }
      
      // Nếu target là pagination, đảm bảo tìm được
      if (!target && targetSelector.includes('pagination')) {
        target = document.querySelector('[data-tour="pagination"]') ||
                 document.querySelector('.pagination') ||
                 document.querySelector('.page-item')
      }
    }
  } else if (targetSelector instanceof HTMLElement) {
    target = targetSelector
  }

  if (target) {
    // Kiểm tra xem target có nằm trong modal không
    const modal = target.closest('.modal.show, .modal-dialog')
    const modalBody = modal ? modal.querySelector('.modal-body') : null
    
    // Kiểm tra xem có phải pagination không để điều chỉnh scroll behavior
    const isPagination = targetSelector.includes('pagination') || 
                         target.getAttribute('data-tour') === 'pagination' ||
                         target.closest('[data-tour="pagination"]')
    
    // Scroll đến phần tử với smooth behavior
    if (isPagination) {
      // Pagination: scroll để phần tử ở cuối viewport, không scroll quá nhiều
      const targetRect = target.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const currentScrollY = window.scrollY
      const targetTop = targetRect.top + currentScrollY
      const targetBottom = targetRect.bottom + currentScrollY
      
      // Tính toán vị trí scroll để pagination ở gần cuối viewport nhưng vẫn thấy được
      // Đảm bảo pagination không bị che bởi modal hướng dẫn (modal height ~320px)
      const modalHeight = 320
      const gap = 20
      const padding = 20
      const desiredScrollY = targetBottom - viewportHeight + modalHeight + gap + padding
      
      // Chỉ scroll nếu cần thiết và không scroll quá nhiều
      const scrollDiff = Math.abs(currentScrollY - desiredScrollY)
      if (scrollDiff > 30) {
        window.scrollTo({
          top: Math.max(0, Math.min(desiredScrollY, document.documentElement.scrollHeight - viewportHeight)),
          behavior: 'smooth'
        })
      }
    } else if (modalBody && target.closest('.modal-body')) {
      // Nếu target nằm trong modal body, scroll modal body thay vì window
      const targetRect = target.getBoundingClientRect()
      const modalBodyRect = modalBody.getBoundingClientRect()
      const relativeTop = targetRect.top - modalBodyRect.top + modalBody.scrollTop
      
      modalBody.scrollTo({
        top: relativeTop - (modalBodyRect.height / 2) + (targetRect.height / 2),
        behavior: 'smooth'
      })
    } else {
      // Các phần tử khác: scroll vào giữa
      target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'nearest' 
      })
    }
    
    // Đợi scroll hoàn tất với requestAnimationFrame
    await new Promise(resolve => {
      let rafId
      let frameCount = 0
      const isPagination = targetSelector.includes('pagination') || 
                          target.getAttribute('data-tour') === 'pagination' ||
                          target.closest('[data-tour="pagination"]')
      
      const checkScroll = () => {
        rafId = requestAnimationFrame(() => {
          frameCount++
          if (isPagination) {
            // Pagination: kiểm tra scroll đã đúng vị trí chưa
            const targetRect = target.getBoundingClientRect()
            const targetBottom = targetRect.bottom + window.scrollY
            const viewportHeight = window.innerHeight
            const modalHeight = 320
            const gap = 20
            const padding = 20
            const desiredScrollY = targetBottom - viewportHeight + modalHeight + gap + padding
            const scrollDiff = Math.abs(window.scrollY - desiredScrollY)
            
            if (scrollDiff < 10 || frameCount > 15) {
              resolve()
            } else {
              checkScroll()
            }
          } else {
            // Các phần tử khác: kiểm tra scroll vào giữa
            if (Math.abs(window.scrollY - (target.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2)) < 5 || frameCount > 10) {
              resolve()
            } else {
              checkScroll()
            }
          }
        })
      }
      checkScroll()
      // Timeout fallback (300ms cho pagination, 200ms cho các phần tử khác)
      setTimeout(() => {
        cancelAnimationFrame(rafId)
        resolve()
      }, isPagination ? 300 : 200)
    })
    
    // Tính toán lại vị trí sau khi scroll với requestAnimationFrame
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    const rect = target.getBoundingClientRect()
    highlightRect.value = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      clientTop: rect.top,
      clientLeft: rect.left,
      clientBottom: rect.bottom,
      clientRight: rect.right
    }
    
    // Set highlighted element sau khi đã tính toán xong để animation mượt
    highlightedElement.value = target
  } else {
    // Fade out highlight khi không có target
    highlightedElement.value = null
    highlightRect.value = null
  }
}


// Next step với smooth transition
const nextStep = async () => {
  if (currentStepIndex.value < props.steps.length - 1) {
    const nextStep = props.steps[currentStepIndex.value + 1]
    const currentStep = props.steps[currentStepIndex.value]
    
    // Đóng modal cũ trước khi chuyển bước nếu:
    // 1. Bước hiện tại đang target modal (form/modal đang mở)
    // 2. Bước tiếp theo không có action mở modal mới
    const currentTarget = String(currentStep?.target || '')
    const nextTarget = String(nextStep?.target || '')
    const nextAction = nextStep?.action
    
    // Kiểm tra bước hiện tại có đang ở modal không
    const isCurrentStepModal = currentTarget.includes('plan-detail-modal') ||
                                currentTarget.includes('plan-header') ||
                                currentTarget.includes('add-task-button') ||
                                currentTarget.includes('tasks-table') ||
                                currentTarget.includes('workload-column') ||
                                currentTarget.includes('actual-workload-input') ||
                                currentTarget.includes('current-volume-column') ||
                                currentTarget.includes('plan-actions') ||
                                currentTarget.includes('plan-modal') ||
                                currentTarget.includes('assignment-modal') ||
                                currentTarget.includes('material-norm-modal') ||
                                currentTarget.includes('material-summary') ||
                                currentTarget.includes('material-detail') ||
                                currentTarget.includes('select-workers') ||
                                currentTarget.includes('select-date-range') ||
                                currentTarget.includes('select-work-shifts') ||
                                currentTarget.includes('assign-button') ||
                                currentTarget.includes('first-task-row') ||
                                currentTarget.includes('bulk-assign-modal') ||
                                currentTarget.includes('bulk-shift-info') ||
                                currentTarget.includes('bulk-date-range') ||
                                currentTarget.includes('bulk-employee-selection') ||
                                currentTarget.includes('bulk-actions') ||
                                currentTarget.includes('modal-detail') ||
                                currentTarget.includes('view-details-modal') ||
                                currentTarget.includes('change-shift-section') ||
                                currentTarget.includes('view-details-actions') ||
                                currentTarget.includes('quick-add-modal') ||
                                currentTarget.includes('quick-add-shift-select') ||
                                currentTarget.includes('quick-add-actions') ||
                                currentTarget.includes('change-shift-modal') ||
                                currentTarget.includes('current-assignment-info') ||
                                currentTarget.includes('new-assignment-form') ||
                                currentTarget.includes('change-shift-actions') ||
                                currentTarget.includes('employee-modal') ||
                                currentTarget.includes('day-modal') ||
                                currentTarget.includes('attendance-history') ||
                                currentTarget.includes('work-history') ||
                                currentTarget.includes('leave-form-modal') ||
                                currentTarget.includes('overtime-modal') ||
                                currentTarget.includes('image-modal') ||
                                currentTarget.includes('create-form') ||
                                currentTarget.includes('import-modal') ||
                                currentTarget.includes('family-modal') ||
                                currentTarget.includes('family-form-modal') ||
                                currentTarget.includes('family-table') ||
                                currentTarget.includes('extend-modal') ||
                                currentTarget.includes('terminate-modal') ||
                                currentTarget.includes('material-norm-modal') ||
                                currentTarget.includes('material-summary') ||
                                currentTarget.includes('material-detail') ||
                                currentTarget.includes('material-approve-button') ||
                                currentTarget.includes('material-reject-button') ||
                                currentTarget.includes('order-detail-modal') ||
                                currentTarget.includes('warehouse-form') ||
                                currentTarget.includes('stock-out-detail-modal') ||
                                currentTarget.includes('stock-out-detail') ||
                                currentTarget.includes('[data-tour="create-form"]') ||
                                currentTarget.includes('[data-tour="import-modal"]')
    
    // Kiểm tra bước tiếp theo có target là modal không
    const isNextStepModal = nextTarget && (
      String(nextTarget).includes('plan-detail-modal') ||
      String(nextTarget).includes('plan-header') ||
      String(nextTarget).includes('add-task-button') ||
      String(nextTarget).includes('tasks-table') ||
      String(nextTarget).includes('workload-column') ||
      String(nextTarget).includes('actual-workload-input') ||
      String(nextTarget).includes('current-volume-column') ||
      String(nextTarget).includes('plan-actions') ||
      String(nextTarget).includes('plan-modal') ||
      String(nextTarget).includes('assignment-modal') ||
      String(nextTarget).includes('select-workers') ||
      String(nextTarget).includes('select-date-range') ||
      String(nextTarget).includes('select-work-shifts') ||
      String(nextTarget).includes('assign-button') ||
      String(nextTarget).includes('first-task-row') ||
      String(nextTarget).includes('bulk-assign-modal') ||
      String(nextTarget).includes('bulk-shift-info') ||
      String(nextTarget).includes('bulk-date-range') ||
      String(nextTarget).includes('bulk-employee-selection') ||
      String(nextTarget).includes('bulk-actions') ||
      String(nextTarget).includes('modal-detail') ||
      String(nextTarget).includes('view-details-modal') ||
      String(nextTarget).includes('change-shift-section') ||
      String(nextTarget).includes('view-details-actions') ||
      String(nextTarget).includes('quick-add-modal') ||
      String(nextTarget).includes('quick-add-shift-select') ||
      String(nextTarget).includes('quick-add-actions') ||
      String(nextTarget).includes('change-shift-modal') ||
      String(nextTarget).includes('current-assignment-info') ||
      String(nextTarget).includes('new-assignment-form') ||
      String(nextTarget).includes('change-shift-actions') ||
      String(nextTarget).includes('employee-modal') ||
      String(nextTarget).includes('day-modal') ||
      String(nextTarget).includes('attendance-history') ||
      String(nextTarget).includes('work-history') ||
      String(nextTarget).includes('leave-form-modal') ||
      String(nextTarget).includes('overtime-modal') ||
      String(nextTarget).includes('image-modal') ||
      String(nextTarget).includes('create-form') ||
      String(nextTarget).includes('import-modal') ||
      String(nextTarget).includes('family-modal') ||
      String(nextTarget).includes('family-form-modal') ||
      String(nextTarget).includes('family-table') ||
      String(nextTarget).includes('extend-modal') ||
      String(nextTarget).includes('terminate-modal') ||
      String(nextTarget).includes('material-norm-modal') ||
      String(nextTarget).includes('material-summary') ||
      String(nextTarget).includes('material-detail') ||
      String(nextTarget).includes('material-approve-button') ||
      String(nextTarget).includes('material-reject-button') ||
      String(nextTarget).includes('order-detail-modal') ||
      String(nextTarget).includes('warehouse-form') ||
      String(nextTarget).includes('stock-out-detail-modal') ||
      String(nextTarget).includes('stock-out-detail')
    )
    
    // Kiểm tra bước tiếp theo có mở modal mới không (có action click)
    const isNextStepOpeningModal = nextAction?.type === 'click' && 
                                   (String(nextTarget).includes('modal') ||
                                    String(nextTarget).includes('create-form') ||
                                    String(nextTarget).includes('import-modal'))
    
    // Kiểm tra xem bước tiếp theo có action đóng modal không
    const hasCloseModalAction = nextAction && nextAction.type === 'function' && 
                                 nextAction.func && String(nextAction.func).includes('close')
    
    // Kiểm tra xem có modal đang mở trong DOM không
    const hasModalOpen = document.querySelector('.modal.show, .modal-dialog.show')
    
    // Chỉ đóng modal nếu:
    // 1. Bước hiện tại đang ở modal VÀ bước tiếp theo không phải modal VÀ không có action đóng modal
    // 2. Hoặc bước tiếp theo có action đóng modal rõ ràng
    // 3. Hoặc bước tiếp theo là pagination
    const needCloseModal = ((isCurrentStepModal || hasModalOpen) && !isNextStepModal && !hasCloseModalAction && !String(nextTarget).includes('pagination')) ||
                           hasCloseModalAction ||
                           (nextTarget && String(nextTarget).includes('pagination'))
    
    if (needCloseModal && !isNextStepModal) {
      await closeOpenModals()
      // Đợi một chút để modal đóng xong (50ms)
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Chuyển bước
    currentStepIndex.value++
    
    // Highlight target
    await highlightTarget()
  } else {
    completeTour()
  }
}

// Previous step với smooth transition
const prevStep = async () => {
  if (currentStepIndex.value > 0) {
    // Đóng modal cũ trước khi chuyển bước
    await closeOpenModals()
    
    // Fade out trước khi chuyển bước (nhanh hơn)
    highlightedElement.value = null
    highlightRect.value = null
    await new Promise(resolve => setTimeout(resolve, 100))
    
    currentStepIndex.value--
    await highlightTarget()
  }
}

// Complete tour
const completeTour = () => {
  highlightedElement.value = null
  highlightRect.value = null
  emit('complete')
  emit('update:show', false)
}

// Skip tour
const skipTour = () => {
  completeTour()
}

// Tính toán vị trí modal tour guide (né modal đang mở) với smooth updates
let lastPosition = null
const getModalPosition = () => {
  const modalWidth = 420
  const modalHeight = 320
  const padding = 20
  const gap = 20
  
  // Kiểm tra xem có modal nào đang mở không (luôn query lại để đảm bảo tìm được modal mới nhất)
  // Tìm tất cả các modal có thể: .modal.show, .modal-dialog.show, hoặc modal có data-tour
  let openModal = document.querySelector('.modal.show') || 
                  document.querySelector('.modal-dialog.show') ||
                  document.querySelector('[data-tour="plan-detail-modal"]')?.closest('.modal.show') ||
                  document.querySelector('[data-tour="plan-modal"]')?.closest('.modal.show') ||
                  document.querySelector('[data-tour="assignment-modal"]')?.closest('.modal.show') ||
                  document.querySelector('[data-tour="extend-modal"]')?.closest('.modal.show') ||
                  document.querySelector('[data-tour="terminate-modal"]')?.closest('.modal.show')
  
  // Nếu không tìm thấy, thử tìm bằng cách kiểm tra style display
  if (!openModal) {
    const allModals = document.querySelectorAll('.modal, .modal-dialog, [data-tour*="modal"]')
    for (const modal of allModals) {
      const style = window.getComputedStyle(modal)
      if (style.display !== 'none' && style.visibility !== 'hidden' && modal.offsetParent !== null) {
        // Kiểm tra xem có phải modal đang hiển thị không
        const rect = modal.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          openModal = modal
          break
        }
      }
    }
  }
  
  let modalRect = null
  const hasOpenModal = !!openModal
  if (openModal) {
    const modalDialog = openModal.querySelector('.modal-dialog') || openModal
    modalRect = modalDialog.getBoundingClientRect()
    // Đảm bảo modal có kích thước hợp lệ
    if (modalRect.width === 0 || modalRect.height === 0) {
      modalRect = null
    }
  }
  
  // Nếu có modal đang mở, LUÔN ưu tiên né modal (bất kể có highlight hay không)
  if (modalRect) {
    // Ưu tiên 1: Đặt bên trái modal
    if (modalRect.left - modalWidth - gap >= padding) {
      lastPosition = null
      return {
        top: Math.max(padding, modalRect.top) + 'px',
        left: (modalRect.left - modalWidth - gap) + 'px',
        transform: 'none',
        position: 'fixed',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
    // Ưu tiên 2: Bên phải modal
    else if (modalRect.right + gap + modalWidth <= window.innerWidth - padding) {
      lastPosition = null
      return {
        top: Math.max(padding, modalRect.top) + 'px',
        left: (modalRect.right + gap) + 'px',
        transform: 'none',
        position: 'fixed',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
    // Ưu tiên 3: Phía trên modal
    else if (modalRect.top - modalHeight - gap >= padding) {
      lastPosition = null
      return {
        top: (modalRect.top - modalHeight - gap) + 'px',
        left: Math.max(padding, modalRect.left) + 'px',
        transform: 'none',
        position: 'fixed',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
    // Ưu tiên 4: Phía dưới modal
    else if (modalRect.bottom + gap + modalHeight <= window.innerHeight - padding) {
      lastPosition = null
      return {
        top: (modalRect.bottom + gap) + 'px',
        left: Math.max(padding, modalRect.left) + 'px',
        transform: 'none',
        position: 'fixed',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }
  
  // Nếu không có highlight và không có modal, đặt ở giữa màn hình
  if (!highlightRect.value) {
    lastPosition = null
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }


  // Kiểm tra xem có phải pagination không
  const isPagination = highlightedElement.value?.getAttribute('data-tour') === 'pagination' ||
                       highlightedElement.value?.closest('[data-tour="pagination"]') ||
                       (highlightedElement.value && (
                         highlightedElement.value.classList.contains('pagination') ||
                         highlightedElement.value.querySelector('.pagination')
                       ))
  
  // Use clientTop/clientLeft for viewport-relative positioning
  // Nếu là pagination, đặt modal phía trên
  let top = isPagination 
    ? highlightRect.value.clientTop - modalHeight - gap
    : highlightRect.value.clientBottom + gap
  let left = highlightRect.value.clientLeft

  // Nếu có modal đang mở, đặt tour guide bên ngoài modal
  if (modalRect) {
    // Kiểm tra xem target có nằm trong modal không
    const targetInModal = highlightedElement.value && (
      modalRect.left <= highlightRect.value.clientLeft &&
      highlightRect.value.clientRight <= modalRect.right &&
      modalRect.top <= highlightRect.value.clientTop &&
      highlightRect.value.clientBottom <= modalRect.bottom
    )
    
    // Nếu target nằm trong modal, ưu tiên đặt bên trái modal
    if (targetInModal) {
      // Ưu tiên 1: Bên trái modal
      if (modalRect.left - modalWidth - gap >= padding) {
        left = modalRect.left - modalWidth - gap
        top = Math.max(padding, modalRect.top)
      }
      // Ưu tiên 2: Bên phải modal
      else if (modalRect.right + gap + modalWidth <= window.innerWidth - padding) {
        left = modalRect.right + gap
        top = Math.max(padding, modalRect.top)
      }
      // Ưu tiên 3: Phía trên modal
      else if (modalRect.top - modalHeight - gap >= padding) {
        left = Math.max(padding, modalRect.left)
        top = modalRect.top - modalHeight - gap
      }
      // Cuối cùng: Phía dưới modal (tránh nếu có thể)
      else if (modalRect.bottom + gap + modalHeight <= window.innerHeight - padding) {
        left = Math.max(padding, modalRect.left)
        top = modalRect.bottom + gap
      }
      // Nếu không có chỗ, đặt ở góc trái trên
      else {
        left = padding
        top = padding
      }
    } else {
      // Target không nằm trong modal, đặt như bình thường nhưng vẫn ưu tiên bên trái modal
      // Đặt tour guide bên trái modal nếu có chỗ
      if (modalRect.left - modalWidth - gap >= padding) {
        left = modalRect.left - modalWidth - gap
        top = Math.max(padding, modalRect.top)
      } 
      // Hoặc bên phải modal
      else if (modalRect.right + gap + modalWidth <= window.innerWidth - padding) {
        left = modalRect.right + gap
        top = Math.max(padding, modalRect.top)
      }
      // Hoặc phía trên modal
      else if (modalRect.top - modalHeight - gap >= padding) {
        left = Math.max(padding, modalRect.left)
        top = modalRect.top - modalHeight - gap
      }
      // Hoặc phía dưới modal
      else if (modalRect.bottom + gap + modalHeight <= window.innerHeight - padding) {
        left = Math.max(padding, modalRect.left)
        top = modalRect.bottom + gap
      }
      // Nếu không có chỗ, đặt ở góc màn hình
      else {
        left = padding
        top = padding
      }
    }
  } else {
    // Không có modal, đặt như bình thường
    // Nếu là pagination, đảm bảo modal không vượt quá top
    if (isPagination) {
      if (top < padding) {
        // Nếu không đủ chỗ phía trên, đặt ở giữa màn hình
        top = Math.max(padding, (window.innerHeight - modalHeight) / 2)
      }
    } else {
  // Kiểm tra nếu modal vượt quá bottom của màn hình
  if (top + modalHeight > window.innerHeight - padding) {
    // Đặt modal phía trên phần tử
    top = highlightRect.value.clientTop - modalHeight - gap
    // Nếu vẫn vượt quá top, đặt ở giữa màn hình
    if (top < padding) {
      top = Math.max(padding, (window.innerHeight - modalHeight) / 2)
        }
    }
  }

  // Điều chỉnh left để modal không vượt quá màn hình
  // Ưu tiên đặt modal bên phải phần tử
  if (highlightRect.value.clientRight + gap + modalWidth <= window.innerWidth - padding) {
    left = highlightRect.value.clientRight + gap
  } else if (highlightRect.value.clientLeft - modalWidth - gap >= padding) {
    // Nếu không đủ chỗ bên phải, đặt bên trái
    left = highlightRect.value.clientLeft - modalWidth - gap
  } else {
    // Nếu cả hai bên đều không đủ chỗ, đặt ở giữa phần tử
    left = highlightRect.value.clientLeft + (highlightRect.value.width - modalWidth) / 2
    // Đảm bảo không vượt quá màn hình
    if (left < padding) {
      left = padding
    }
    if (left + modalWidth > window.innerWidth - padding) {
      left = window.innerWidth - modalWidth - padding
      }
    }
  }

  // Nếu có modal đang mở, di chuyển nhanh hơn
  const transitionDuration = hasOpenModal ? '0.15s' : '0.3s'
  
  // Kiểm tra xem modal có đang ở phía dưới không (so với viewport center)
  const viewportCenter = window.innerHeight / 2
  const isBelow = top > viewportCenter
  
  const newPosition = {
    top: top + 'px',
    left: left + 'px',
    transform: 'none',
    position: 'fixed',
    transition: `all ${transitionDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
    '--is-below': isBelow ? '1' : '0'
  }
  
  // Chỉ update nếu vị trí thay đổi để tránh di chuyển không cần thiết
  const positionKey = `${top}-${left}`
  if (lastPosition === positionKey) {
    // Trả về position cũ với transition ngắn hơn để tránh animation không cần thiết
    return {
      ...newPosition,
      transition: 'none'
    }
  }
  
  lastPosition = positionKey
  return newPosition
}

// Watch show prop với smooth transition
watch(() => props.show, async (newVal) => {
  if (newVal) {
    currentStepIndex.value = 0
    // Wait for DOM to be ready
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Đợi animation fade in
    await highlightTarget()
  } else {
    // Fade out trước khi đóng
    highlightedElement.value = null
    highlightRect.value = null
    await new Promise(resolve => setTimeout(resolve, 200))
    currentStepIndex.value = 0
  }
})

// Watch current step
watch(() => currentStepIndex.value, () => {
  highlightTarget()
})

// Watch for modal open/close to update tour guide position
watch(() => hasOpenModal.value, () => {
  // Force update modal position when modal opens/closes
  if (props.show) {
    // Update modalState để trigger reactivity
    modalState.value++
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      // Trigger position recalculation by calling highlightTarget again
      // This will recalculate position based on current modal state
      if (highlightRect.value) {
        const currentRect = { ...highlightRect.value }
        highlightRect.value = null
        nextTick(() => {
          highlightRect.value = currentRect
        })
      } else {
        // Nếu không có highlight, vẫn cần cập nhật vị trí để né modal
        // Force re-render bằng cách trigger computed position
        nextTick(() => {
          // Trigger position update by accessing modalPosition
          const pos = modalPosition.value
        })
      }
    })
  }
})

// Also watch for DOM changes to catch modal open/close
let modalObserver = null
watch(() => props.show, (newVal) => {
  if (newVal) {
    // Create MutationObserver to watch for modal open/close
    modalObserver = new MutationObserver((mutations) => {
      // Only react to class changes on modal elements
      const hasModalChange = mutations.some(mutation => {
        const target = mutation.target
        return (target.classList?.contains('modal') || 
                target.classList?.contains('modal-dialog') ||
                target.closest('.modal')) &&
               mutation.type === 'attributes' &&
               mutation.attributeName === 'class'
      })
      
      if (hasModalChange && props.show) {
        // Update modalState để trigger reactivity
        modalState.value++
        
        // Debounce to avoid too many updates
        requestAnimationFrame(() => {
          if (highlightRect.value) {
            const currentRect = { ...highlightRect.value }
            highlightRect.value = null
            nextTick(() => {
              highlightRect.value = currentRect
            })
          } else {
            // Nếu không có highlight, vẫn cần cập nhật vị trí để né modal
            nextTick(() => {
              // Force position recalculation
              const pos = modalPosition.value
            })
          }
        })
      }
    })
    
    // Observe body for modal class changes
    modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    })
  } else {
    // Disconnect observer when tour guide closes
    if (modalObserver) {
      modalObserver.disconnect()
      modalObserver = null
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (modalObserver) {
    modalObserver.disconnect()
    modalObserver = null
  }
})

// Keyboard navigation
const handleKeydown = (event) => {
  // Chỉ xử lý khi tour guide đang hiển thị
  if (!props.show) return
  
  // Tránh xử lý khi đang focus vào input, textarea, select
  const activeElement = document.activeElement
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.tagName === 'SELECT' ||
    activeElement.isContentEditable
  )
  
  if (isInputFocused) return
  
  // Arrow Right: Next step
  if (event.key === 'ArrowRight' || event.key === '>') {
    event.preventDefault()
    if (!isLastStep.value) {
      nextStep()
    }
  }
  // Arrow Left: Previous step
  else if (event.key === 'ArrowLeft' || event.key === '<') {
    event.preventDefault()
    if (!isFirstStep.value) {
      prevStep()
    }
  }
  // Escape: Close tour
  else if (event.key === 'Escape') {
    event.preventDefault()
    emit('complete')
  }
}

// Load when component mounts
onMounted(() => {
  if (props.show) {
    nextTick(() => {
      highlightTarget()
    })
  }
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeydown)
})

// Remove event listener when component unmounts
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Watch for show prop changes to add/remove listener
watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      highlightTarget()
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="tour-guide-overlay">
      <!-- Highlight overlay -->
      <div
        v-if="highlightRect"
        class="tour-highlight"
        :style="{
          top: highlightRect.top + 'px',
          left: highlightRect.left + 'px',
          width: highlightRect.width + 'px',
          height: highlightRect.height + 'px'
        }"
      >
        <div class="highlight-ring"></div>
      </div>

      <!-- Modal Guide -->
      <div
        class="tour-guide-modal"
        :class="{ 
          'has-modal-open': hasOpenModal,
          'is-below': getModalPosition()['--is-below'] === '1'
        }"
        :style="getModalPosition()"
      >
        <div class="tour-guide-content">
          <!-- AI Assistant Character -->
          <div class="ai-assistant">
            <!-- AI Particles Background -->
            <div class="ai-particles">
              <div class="particle" v-for="i in 12" :key="i" :style="{ 
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 2 + 's',
                animationDuration: (2 + Math.random() * 2) + 's'
              }"></div>
            </div>
            
            <!-- Neural Network Lines -->
            <div class="neural-network">
              <svg class="neural-svg" viewBox="0 0 200 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgba(52, 152, 219, 0.3);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(41, 128, 185, 0.1);stop-opacity:1" />
                  </linearGradient>
                </defs>
                <path class="neural-path" d="M20,50 Q100,20 180,50" />
                <path class="neural-path" d="M20,100 Q100,70 180,100" />
                <path class="neural-path" d="M20,150 Q100,120 180,150" />
                <circle class="neural-node" cx="50" cy="50" r="3" />
                <circle class="neural-node" cx="100" cy="50" r="3" />
                <circle class="neural-node" cx="150" cy="50" r="3" />
                <circle class="neural-node" cx="50" cy="100" r="3" />
                <circle class="neural-node" cx="100" cy="100" r="3" />
                <circle class="neural-node" cx="150" cy="100" r="3" />
              </svg>
            </div>
            
            <div class="ai-avatar">
              <div class="ai-icon-wrapper">
                <div class="ai-robot-face">
              <i class="fas fa-robot"></i>
            </div>
                <div class="ai-scan-line"></div>
                <div class="ai-glow"></div>
                <div class="ai-ring-ring"></div>
                <div class="ai-ring-ring ai-ring-ring-2"></div>
              </div>
              <div class="ai-status-indicator">
                <div class="status-pulse"></div>
              </div>
              <div class="ai-tech-lines">
                <div class="tech-line tech-line-1"></div>
                <div class="tech-line tech-line-2"></div>
                <div class="tech-line tech-line-3"></div>
              </div>
            </div>
            <div class="ai-message-container">
              <div class="ai-message-header">
                <div class="ai-label-wrapper">
                  <span class="ai-label">AI Assistant</span>
                  <span class="ai-version">v2.0</span>
                </div>
                <div class="ai-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div class="ai-message-bubble">
                <div class="message-content">
                  <div class="message-icon">
                    <i class="fas fa-comment-dots"></i>
                  </div>
                <p class="tour-message">{{ currentStep?.message }}</p>
              </div>
              <div class="bubble-tail"></div>
                <div class="message-shine"></div>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="tour-navigation" :class="{ 'navigation-top': getModalPosition()['--is-below'] === '1' }">
            <div class="tour-progress">
              <span class="progress-text">
                Bước {{ currentStepIndex + 1 }} / {{ steps.length }}
              </span>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: ((currentStepIndex + 1) / steps.length) * 100 + '%' }"
                ></div>
              </div>
            </div>

            <div class="tour-actions">
              <button
                class="btn btn-outline-secondary btn-sm"
                @click="skipTour"
              >
                <i class="fas fa-times me-1"></i>
                Bỏ qua
              </button>
              <div class="btn-group">
                <button
                  class="btn btn-secondary btn-sm"
                  @click="prevStep"
                  :disabled="isFirstStep"
                >
                  <i class="fas fa-chevron-left me-1"></i>
                  Trước
                </button>
                <button
                  v-if="!isLastStep"
                  class="btn btn-primary btn-sm"
                  @click="nextStep"
                >
                  Tiếp theo
                  <i class="fas fa-chevron-right ms-1"></i>
                </button>
                <button
                  v-else
                  class="btn btn-success btn-sm"
                  @click="completeTour"
                >
                  <i class="fas fa-check me-1"></i>
                  Hoàn thành
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dimmed backdrop -->
      <div class="tour-backdrop" @click="skipTour"></div>
    </div>
  </Teleport>
</template>

<style scoped>
.tour-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  pointer-events: auto;
}

.tour-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1;
  animation: fadeIn 0.3s ease-out;
}

.tour-highlight {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  animation: highlightPulse 2s ease-in-out infinite;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.highlight-ring {
  width: 100%;
  height: 100%;
  border: 3px solid #0d6efd;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.3),
              0 0 20px rgba(13, 110, 253, 0.5);
  background-color: rgba(13, 110, 253, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.3),
                0 0 20px rgba(13, 110, 253, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(13, 110, 253, 0.2),
                0 0 30px rgba(13, 110, 253, 0.6);
  }
}

.tour-guide-modal {
  position: fixed;
  z-index: 3;
  max-width: 420px;
  min-width: 350px;
  animation: slideInUp 0.4s ease-out;
  will-change: top, left;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Khi có modal đang mở, di chuyển nhanh hơn */
.tour-guide-modal.has-modal-open {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tour-guide-content {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.ai-assistant {
  padding: 1.75rem;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  position: relative;
  overflow: hidden;
}

.ai-assistant::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
  z-index: 1;
}

.ai-assistant::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.1) 0%, transparent 70%);
  animation: aiRadialPulse 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes aiRadialPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* AI Particles */
.ai-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: particleFloat 3s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(52, 152, 219, 0.8);
}

@keyframes particleFloat {
  0%, 100% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) translateX(10px) scale(1.2);
    opacity: 1;
  }
}

/* Neural Network */
.neural-network {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.3;
}

.neural-svg {
  width: 100%;
  height: 100%;
}

.neural-path {
  fill: none;
  stroke: url(#neuralGradient);
  stroke-width: 1.5;
  stroke-dasharray: 5, 5;
  animation: neuralFlow 3s linear infinite;
}

.neural-node {
  fill: rgba(52, 152, 219, 0.6);
  animation: neuralPulse 2s ease-in-out infinite;
}

.neural-node:nth-child(4) { animation-delay: 0s; }
.neural-node:nth-child(5) { animation-delay: 0.3s; }
.neural-node:nth-child(6) { animation-delay: 0.6s; }
.neural-node:nth-child(7) { animation-delay: 0.9s; }
.neural-node:nth-child(8) { animation-delay: 1.2s; }
.neural-node:nth-child(9) { animation-delay: 1.5s; }

@keyframes neuralFlow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 20;
  }
}

@keyframes neuralPulse {
  0%, 100% {
    r: 3;
    opacity: 0.6;
  }
  50% {
    r: 5;
    opacity: 1;
  }
}

.ai-avatar {
  position: relative;
  flex-shrink: 0;
  z-index: 1;
}

.ai-icon-wrapper {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  color: #ffffff;
  box-shadow: 0 8px 32px rgba(52, 152, 219, 0.5),
              0 0 0 4px rgba(255, 255, 255, 0.2),
              inset 0 2px 8px rgba(255, 255, 255, 0.4),
              inset 0 -2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: aiPulse 3s ease-in-out infinite;
  overflow: hidden;
  z-index: 2;
}

.ai-icon-wrapper::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: aiShine 3s ease-in-out infinite;
  z-index: 1;
}

.ai-robot-face {
  position: relative;
  z-index: 3;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  animation: robotBlink 4s ease-in-out infinite;
}

@keyframes robotBlink {
  0%, 90%, 100% {
    transform: scale(1);
  }
  95% {
    transform: scale(0.95);
  }
}

.ai-scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: scanLine 2s linear infinite;
  z-index: 2;
}

@keyframes scanLine {
  0% {
    top: 0;
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.ai-glow {
  position: absolute;
  width: 140%;
  height: 140%;
  top: -20%;
  left: -20%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.6) 0%, rgba(41, 128, 185, 0.4) 40%, transparent 70%);
  animation: aiGlow 2s ease-in-out infinite;
  z-index: 0;
}

.ai-ring-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: ringExpand 2s ease-out infinite;
  z-index: 1;
}

.ai-ring-ring-2 {
  animation-delay: 1s;
}

@keyframes ringExpand {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes aiShine {
  0%, 100% {
    transform: rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: rotate(180deg);
    opacity: 1;
  }
}

.ai-status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.6),
              0 0 0 2px rgba(52, 152, 219, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
  animation: statusPulse 2s ease-in-out infinite;
  z-index: 4;
}

.status-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.6);
  animation: statusPulseRing 2s ease-out infinite;
}

@keyframes statusPulseRing {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

@keyframes aiPulse {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.02);
  }
}

@keyframes aiGlow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5),
                0 0 0 2px rgba(52, 152, 219, 0.3);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.7),
                0 0 0 4px rgba(52, 152, 219, 0.5);
  }
}

.ai-tech-lines {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.tech-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 2px;
  animation: techLineMove 3s ease-in-out infinite;
}

.tech-line-1 {
  width: 60%;
  height: 2px;
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.tech-line-2 {
  width: 40%;
  height: 2px;
  top: 50%;
  left: 30%;
  animation-delay: 1s;
}

.tech-line-3 {
  width: 50%;
  height: 2px;
  bottom: 20%;
  left: 25%;
  animation-delay: 2s;
}

@keyframes techLineMove {
  0%, 100% {
    opacity: 0;
    transform: translateX(-20px);
  }
  50% {
    opacity: 1;
    transform: translateX(20px);
  }
}

.ai-message-container {
  flex: 1;
  z-index: 1;
}

.ai-message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ai-label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ai-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.ai-label::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: labelShine 3s ease-in-out infinite;
}

@keyframes labelShine {
  0%, 100% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
}

.ai-version {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

.ai-typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.ai-typing-indicator span {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.ai-typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.ai-message-bubble {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 18px;
  padding: 1.5rem 1.75rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12),
              0 0 0 1px rgba(52, 152, 219, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(52, 152, 219, 0.15);
  overflow: hidden;
}

.message-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.message-icon {
  font-size: 1.1rem;
  color: #3498db;
  opacity: 0.7;
  margin-top: 0.1rem;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.message-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: messageShine 4s ease-in-out infinite;
  z-index: 1;
}

@keyframes messageShine {
  0%, 100% {
    left: -100%;
  }
  50% {
    left: 150%;
  }
}

.tour-message {
  margin: 0;
  color: #1f2937;
  font-size: 0.95rem;
  line-height: 1.7;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.bubble-tail {
  position: absolute;
  bottom: -8px;
  left: 40px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-right: 2px solid rgba(0, 0, 0, 0.05);
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
  transform: rotate(45deg);
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tour-navigation {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

/* Navigation ở trên đầu khi modal ở phía dưới */
.tour-navigation.navigation-top {
  border-top: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  order: -1;
}

.tour-navigation.navigation-top::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
  top: auto;
}

.tour-navigation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.tour-progress {
  margin-bottom: 1rem;
}

.progress-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 600;
  display: block;
  margin-bottom: 0.75rem;
  letter-spacing: 0.02em;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #e9ecef 0%, #f1f3f5 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  pointer-events: none;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 50%, #3498db 100%);
  background-size: 200% 100%;
  border-radius: 10px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: progressShine 2s linear infinite;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
}

@keyframes progressShine {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.tour-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-sm:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .tour-guide-modal {
    max-width: calc(100vw - 40px);
    min-width: auto;
    left: 20px !important;
    right: 20px;
  }

  .ai-assistant {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
  }

  .ai-avatar {
    margin-bottom: 0.5rem;
  }

  .ai-message-container {
    width: 100%;
  }

  .bubble-tail {
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    bottom: -8px;
  }

  .tour-actions {
    flex-direction: column;
  }

  .btn-group {
    width: 100%;
    justify-content: stretch;
  }

  .btn-group .btn {
    flex: 1;
  }
}
</style>

