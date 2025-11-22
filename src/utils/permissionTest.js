import { usePermissions } from '../composables/usePermissions.js'
import { useAuth } from '../composables/useAuth.js'

// Test function để kiểm tra permissions
export function testPermissions() {
  const { currentUser } = useAuth()
  const { 
    canView, 
    canCreate, 
    canEditItem, 
    canDeleteItem, 
    canApprove,
    pagePermissions 
  } = usePermissions()

  console.log('=== PERMISSION SYSTEM TEST ===')
  console.log('Current user:', currentUser.value)
  console.log('User role:', currentUser.value?.role)
  
  // Test permissions for leave page
  console.log('\n--- LEAVE PAGE PERMISSIONS ---')
  console.log('Can view leave:', canView('leave'))
  console.log('Can create leave:', canCreate('leave'))
  console.log('Can approve leave:', canApprove('leave'))
  
  if (!canView('leave')) {
    console.log('❌ Cannot view leave - should not have any other permissions')
    console.log('Create permission:', canCreate('leave'), '(should be false)')
    console.log('Approve permission:', canApprove('leave'), '(should be false)')
  } else {
    console.log('✅ Can view leave - checking other permissions')
  }
  
  // Test with sample item
  const sampleItem = {
    voucherCode: 'LV001',
    employeeID: currentUser.value?.id || 'test-id',
    approveStatus: 1
  }
  
  console.log('\n--- SAMPLE ITEM PERMISSIONS ---')
  console.log('Sample item:', sampleItem)
  console.log('Can edit this item:', canEditItem('leave', sampleItem))
  console.log('Can delete this item:', canDeleteItem('leave', sampleItem))
  
  // Show all permissions for current role
  console.log('\n--- ALL PERMISSIONS FOR CURRENT ROLE ---')
  const userRole = currentUser.value?.role
  if (userRole && pagePermissions) {
    Object.keys(pagePermissions).forEach(page => {
      const permissions = pagePermissions[page][userRole] || []
      console.log(`${page}:`, permissions)
    })
  }
  
  console.log('\n=== END PERMISSION TEST ===')
}

// Export để có thể gọi từ console
window.testPermissions = testPermissions
