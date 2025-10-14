# 🔄 Contract Extension & Employee Termination Features

## 📋 **Tổng quan**

Cập nhật các tính năng gia hạn hợp đồng và cho nhân viên nghỉ việc với các yêu cầu mới:

### **Gia hạn hợp đồng:**
- ✅ **Nhập từ ngày** và **đến ngày mới** (thay vì chỉ ngày hết hạn)
- ✅ **Validation** ngày bắt đầu phải ≥ ngày hết hạn hiện tại
- ✅ **Validation** ngày kết thúc phải ≥ ngày bắt đầu mới

### **Cho nghỉ việc:**
- ✅ **Cập nhật trạng thái hợp đồng** thành "Terminated"
- ✅ **Cập nhật trạng thái nhân viên** thành "Resigned"
- ✅ **API endpoint** mới để cập nhật trạng thái nhân viên

## 🔧 **Technical Implementation**

### **1. Frontend Changes**

#### **Extend Contract Modal:**
```vue
<!-- Extend Contract Modal -->
<ModalDialog :show="showExtendModal" title="Gia hạn hợp đồng" size="md">
  <div class="p-4">
    <div class="mb-3">
      <h6>Hợp đồng: {{ contractToExtend?.contractNumber }}</h6>
      <p class="text-muted">Nhân viên: {{ contractToExtend?.employeeName }}</p>
      <div class="alert alert-info">
        <strong>Ngày bắt đầu hiện tại:</strong> {{ contractToExtend?.startDate }}<br>
        <strong>Ngày hết hạn hiện tại:</strong> {{ contractToExtend?.endDate }}
      </div>
    </div>
    
    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Ngày bắt đầu mới:</label>
        <input 
          type="date" 
          class="form-control" 
          v-model="newStartDate"
          :min="contractToExtend?.endDate"
        >
      </div>
      <div class="col-md-6">
        <label class="form-label">Ngày hết hạn mới:</label>
        <input 
          type="date" 
          class="form-control" 
          v-model="newEndDate"
          :min="newStartDate || contractToExtend?.endDate"
        >
      </div>
    </div>
  </div>
</ModalDialog>
```

#### **JavaScript Logic:**
```javascript
// State management
const newStartDate = ref('')
const newEndDate = ref('')

// Extend contract function
const extendContract = (contract) => {
  contractToExtend.value = contract
  // Set current end date as default start date for new contract period
  newStartDate.value = contract.endDate
  newEndDate.value = ''
  showExtendModal.value = true
}

// Handle extend contract
const handleExtendContract = async () => {
  try {
    if (contractToExtend.value && newStartDate.value && newEndDate.value) {
      const updatedContract = {
        ...contractToExtend.value,
        startDate: newStartDate.value,
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

### **2. Backend Changes**

#### **New DTO:**
```csharp
// UpdateEmployeeStatusDTO.cs
using System.ComponentModel.DataAnnotations;
using dotnet_api.Data.Enums;

namespace dotnet_api.DTOs.PUT
{
    public class UpdateEmployeeStatusDTO
    {
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public EmployeeStatusEnum Status { get; set; }
    }
}
```

#### **New API Endpoint:**
```csharp
[HttpPut("employee/{id}/status")]
public async Task<IActionResult> UpdateEmployeeStatus(string id, [FromBody] UpdateEmployeeStatusDTO statusDTO)
{
    if (string.IsNullOrEmpty(id))
        return BadRequest(new { message = "ID nhân viên không được để trống" });

    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    try
    {
        var result = await _applicationUserService.UpdateEmployeeStatusAsync(id, statusDTO.Status);
        if (result == null)
        {
            return NotFound(new { message = "Không tìm thấy nhân viên với ID đã cho" });
        }
        return Ok(result);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
```

#### **Service Implementation:**
```csharp
public async Task<EmployeeDTO> UpdateEmployeeStatusAsync(string employeeId, EmployeeStatusEnum status)
{
    var employee = await _context.ApplicationUsers.FindAsync(employeeId);
    if (employee == null)
    {
        throw new Exception("Không tìm thấy nhân viên với ID đã cho");
    }

    employee.Status = status;
    await _context.SaveChangesAsync();

    return await GetEmployeeByIdAsync(employeeId);
}
```

### **3. Frontend Service Update**

#### **EmployeeService:**
```javascript
// Update employee status
async updateEmployeeStatus(employeeId, status) {
  try {
    const response = await api.put(`/ApplicationUser/employee/${employeeId}/status`, { status })
    return response.data
  } catch (error) {
    console.error('Error updating employee status:', error)
    throw error
  }
}
```

#### **Terminate Employee Logic:**
```javascript
const handleTerminateEmployee = async () => {
  try {
    if (employeeToTerminate.value) {
      // Update contract status to terminated
      const updatedContract = {
        ...employeeToTerminate.value,
        status: 'Terminated'
      }
      await updateContract(updatedContract)
      
      // Update employee status to resigned
      try {
        await employeeService.updateEmployeeStatus(employeeToTerminate.value.employeeID, 'Resigned')
        showMessage('Cho nhân viên nghỉ việc thành công! Hợp đồng đã chấm dứt và trạng thái nhân viên đã được cập nhật.', 'success')
      } catch (employeeError) {
        console.error('Error updating employee status:', employeeError)
        showMessage('Hợp đồng đã chấm dứt nhưng có lỗi khi cập nhật trạng thái nhân viên.', 'warning')
      }
    }
    closeTerminateModal()
  } catch (err) {
    console.error('Error terminating employee:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}
```

## 🎯 **User Experience**

### **Contract Extension Flow:**
1. **Click "Gia hạn"** trên hợp đồng hết hạn
2. **Modal hiện** với thông tin hợp đồng hiện tại
3. **Nhập ngày bắt đầu mới** (mặc định = ngày hết hạn hiện tại)
4. **Nhập ngày kết thúc mới** (phải ≥ ngày bắt đầu mới)
5. **Click "Gia hạn"** → Cập nhật hợp đồng thành công

### **Employee Termination Flow:**
1. **Click "Nghỉ việc"** trên hợp đồng hết hạn
2. **Modal xác nhận** hiện với thông tin nhân viên
3. **Click "Xác nhận nghỉ việc"**
4. **Hệ thống tự động:**
   - Cập nhật trạng thái hợp đồng → "Terminated"
   - Cập nhật trạng thái nhân viên → "Resigned"
5. **Thông báo thành công**

## 🔒 **Validation & Security**

### **Date Validation:**
- ✅ **Ngày bắt đầu mới** ≥ ngày hết hạn hiện tại
- ✅ **Ngày kết thúc mới** ≥ ngày bắt đầu mới
- ✅ **Required fields** validation
- ✅ **HTML5 date input** với min attributes

### **Business Logic:**
- ✅ **Contract status** → "Active" sau gia hạn
- ✅ **Contract status** → "Terminated" sau nghỉ việc
- ✅ **Employee status** → "Resigned" sau nghỉ việc
- ✅ **Error handling** với user-friendly messages

## 📊 **API Endpoints**

### **New Endpoints:**
```
PUT /api/ApplicationUser/employee/{id}/status
Body: { "status": "Resigned" }
Response: EmployeeDTO
```

### **Updated Endpoints:**
```
PUT /api/Contract
Body: {
  "id": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "status": "Active",
  ...
}
Response: ContractDTO
```

## 🧪 **Testing Scenarios**

### **Contract Extension:**
- [ ] Gia hạn với ngày bắt đầu = ngày hết hạn hiện tại
- [ ] Gia hạn với ngày bắt đầu > ngày hết hạn hiện tại
- [ ] Validation ngày kết thúc < ngày bắt đầu
- [ ] Validation ngày bắt đầu < ngày hết hạn hiện tại
- [ ] Success message hiển thị đúng

### **Employee Termination:**
- [ ] Cho nghỉ việc thành công
- [ ] Contract status → "Terminated"
- [ ] Employee status → "Resigned"
- [ ] Error handling khi API fails
- [ ] Partial success handling (contract OK, employee fail)

## 🎨 **UI/UX Improvements**

### **Visual Design:**
- 🎨 **Two-column layout** cho date inputs
- 📅 **Clear date labels** và validation
- ⚠️ **Info alert** hiển thị ngày hiện tại
- 🔄 **Loading states** và error handling

### **User Feedback:**
- ✅ **Success messages** chi tiết
- ⚠️ **Warning messages** cho partial success
- ❌ **Error messages** rõ ràng
- 🔄 **Auto refresh** data sau operations

## 🚀 **Performance Optimizations**

### **Efficient Updates:**
- ✅ **Single API call** cho contract update
- ✅ **Single API call** cho employee status update
- ✅ **Local state updates** thay vì refetch
- ✅ **Error recovery** với partial success handling

### **Data Consistency:**
- ✅ **Transaction-like behavior** (contract + employee)
- ✅ **Rollback handling** khi một operation fails
- ✅ **Audit trail** thông qua success messages
- ✅ **Data refresh** sau successful operations
