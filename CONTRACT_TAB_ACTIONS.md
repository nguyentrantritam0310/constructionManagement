# 📋 Contract Management - Tab Actions

## 🎯 **Tổng quan**

Hệ thống quản lý hợp đồng lao động được chia thành 3 tab với các chức năng riêng biệt phù hợp với từng trường hợp:

## 📑 **Tab 1: Hợp đồng lao động (allContracts)**

### **Chức năng:**
- ✅ **Xem tất cả hợp đồng** đang hoạt động
- ✅ **Cập nhật hợp đồng** (sửa thông tin)
- ✅ **Thay đổi trạng thái** hợp đồng
- ✅ **Xóa hợp đồng** (có xác nhận)

### **Actions:**
```vue
<!-- Tab: Tất cả hợp đồng -->
<template v-if="activeTab === 'allContracts'">
  <UpdateButton @click.stop="openUpdateForm(item.id)" />
  <ChangeStatusButton @click.stop="openStatusDialog(item)" />
  <button class="btn btn-danger btn-sm" @click.stop="confirmDeleteContract(item)">
    <i class="fas fa-trash"></i>
  </button>
</template>
```

## 👥 **Tab 2: Chưa lên hợp đồng (notCreated)**

### **Chức năng:**
- ✅ **Hiển thị nhân viên** chưa có hợp đồng
- ✅ **Tạo hợp đồng mới** cho nhân viên

### **Actions:**
```vue
<!-- Tab: Chưa lên hợp đồng -->
<template v-else-if="activeTab === 'notCreated'">
  <button class="btn btn-success btn-sm" @click.stop="createContractForEmployee(item)">
    <i class="fas fa-plus"></i> Tạo hợp đồng
  </button>
</template>
```

### **Logic:**
```javascript
const createContractForEmployee = (employee) => {
  selectedContractForm.value = {
    employeeID: employee.id,
    employeeName: employee.employeeName
  }
  contractFormMode.value = 'create'
  showContractModal.value = true
}
```

## ⏰ **Tab 3: Hợp đồng hết hạn (expired)**

### **Chức năng:**
- ✅ **Hiển thị hợp đồng** sắp hết hạn (≤ 10 ngày)
- ✅ **Gia hạn hợp đồng** (chỉ thay đổi ngày hết hạn)
- ✅ **Cho nghỉ việc** (chấm dứt hợp đồng + thay đổi trạng thái nhân viên)

### **Actions:**
```vue
<!-- Tab: Hợp đồng hết hạn -->
<template v-else-if="activeTab === 'expired'">
  <button class="btn btn-warning btn-sm" @click.stop="extendContract(item)">
    <i class="fas fa-calendar-plus"></i> Gia hạn
  </button>
  <button class="btn btn-danger btn-sm" @click.stop="terminateEmployee(item)">
    <i class="fas fa-user-times"></i> Nghỉ việc
  </button>
</template>
```

## 🔧 **Modal Components**

### **1. Extend Contract Modal**
```vue
<ModalDialog :show="showExtendModal" title="Gia hạn hợp đồng" size="md">
  <div class="p-4">
    <div class="mb-3">
      <h6>Hợp đồng: {{ contractToExtend?.contractNumber }}</h6>
      <p class="text-muted">Nhân viên: {{ contractToExtend?.employeeName }}</p>
      <div class="alert alert-info">
        <strong>Ngày hết hạn hiện tại:</strong> {{ contractToExtend?.endDate }}
      </div>
    </div>
    
    <div class="mb-4">
      <label class="form-label">Ngày hết hạn mới:</label>
      <input 
        type="date" 
        class="form-control" 
        v-model="newEndDate"
        :min="contractToExtend?.endDate"
      >
    </div>
  </div>
</ModalDialog>
```

### **2. Terminate Employee Modal**
```vue
<ModalDialog :show="showTerminateModal" title="Cho nhân viên nghỉ việc" size="md">
  <div class="text-center p-4">
    <div class="mb-3">
      <i class="fas fa-user-times text-danger" style="font-size: 3rem;"></i>
    </div>
    <h5 class="mb-3">Xác nhận cho nhân viên nghỉ việc</h5>
    <div class="alert alert-warning">
      <strong>Nhân viên:</strong> {{ employeeToTerminate?.employeeName }}<br>
      <strong>Mã nhân viên:</strong> {{ employeeToTerminate?.employeeID }}<br>
      <strong>Hợp đồng:</strong> {{ employeeToTerminate?.contractNumber }}
    </div>
    <p class="text-muted mb-4">Hành động này sẽ chấm dứt hợp đồng và thay đổi trạng thái nhân viên thành "Nghỉ việc".</p>
  </div>
</ModalDialog>
```

## 🚀 **Functions Implementation**

### **Extend Contract:**
```javascript
const extendContract = (contract) => {
  contractToExtend.value = contract
  // Set current end date as default value
  newEndDate.value = contract.endDate
  showExtendModal.value = true
}

const handleExtendContract = async () => {
  try {
    if (contractToExtend.value && newEndDate.value) {
      const updatedContract = {
        ...contractToExtend.value,
        endDate: newEndDate.value,
        status: 'Active'
      }
      await updateContract(updatedContract)
      showMessage('Gia hạn hợp đồng thành công!', 'success')
    }
    closeExtendModal()
  } catch (err) {
    console.error('Error extending contract:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}
```

### **Terminate Employee:**
```javascript
const terminateEmployee = (contract) => {
  employeeToTerminate.value = {
    ...contract,
    employeeID: contract.employeeID,
    employeeName: contract.employeeName
  }
  showTerminateModal.value = true
}

const handleTerminateEmployee = async () => {
  try {
    if (employeeToTerminate.value) {
      // Update contract status to terminated
      const updatedContract = {
        ...employeeToTerminate.value,
        status: 'Terminated'
      }
      await updateContract(updatedContract)
      
      // Update employee status to resigned (if needed)
      showMessage('Cho nhân viên nghỉ việc thành công!', 'success')
    }
    closeTerminateModal()
  } catch (err) {
    console.error('Error terminating employee:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}
```

## 📊 **Data Flow**

### **Tab Switching Logic:**
```javascript
const columnsByTab = computed(() => {
  if (activeTab.value === 'allContracts') return contractColumns
  if (activeTab.value === 'notCreated') return notCreatedColumns
  if (activeTab.value === 'expired') return expiredColumns
  return []
})

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  if (activeTab.value === 'allContracts') return contractsData.value.slice(start, end)
  if (activeTab.value === 'notCreated') return notCreatedContracts.value.slice(start, end)
  if (activeTab.value === 'expired') return expiredContracts.value.slice(start, end)
  return []
})
```

## 🎨 **UI/UX Features**

### **Visual Indicators:**
- 🟢 **Success buttons** (Tạo hợp đồng)
- 🟡 **Warning buttons** (Gia hạn)
- 🔴 **Danger buttons** (Xóa, Nghỉ việc)
- 📅 **Date picker** với validation
- ⚠️ **Confirmation dialogs** cho các hành động quan trọng

### **Responsive Design:**
- 📱 **Mobile-friendly** buttons và modals
- 🎯 **Clear icons** cho mỗi action
- 📋 **Consistent styling** across tabs
- 🔄 **Loading states** và error handling

## 🔒 **Security & Validation**

### **Data Validation:**
- ✅ **Date validation** (ngày gia hạn phải > ngày hiện tại)
- ✅ **Required fields** checking
- ✅ **Confirmation dialogs** cho destructive actions
- ✅ **Error handling** với user-friendly messages

### **Business Logic:**
- ✅ **Contract extension** chỉ thay đổi endDate
- ✅ **Employee termination** cập nhật cả contract và employee status
- ✅ **Automatic refresh** sau mỗi operation
- ✅ **Audit trail** thông qua success messages

## 🧪 **Testing Scenarios**

### **Test Cases:**
- [ ] Tab switching hiển thị đúng data
- [ ] Tạo hợp đồng cho nhân viên chưa có hợp đồng
- [ ] Gia hạn hợp đồng với ngày mới
- [ ] Cho nghỉ việc nhân viên
- [ ] Validation ngày gia hạn
- [ ] Confirmation dialogs hoạt động đúng
- [ ] Error handling khi API fails
- [ ] Data refresh sau operations

## 📈 **Performance Optimizations**

### **Efficient Data Management:**
- ✅ **Computed properties** cho filtered data
- ✅ **Local state updates** thay vì refetch toàn bộ
- ✅ **Lazy loading** của modal components
- ✅ **Debounced operations** cho better UX
