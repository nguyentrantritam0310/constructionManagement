# 🧪 Test Password Change Flow

## 🔍 **Vấn đề đã được sửa**

### **Trước đây:**
- Backend kiểm tra: `password == "TempPass@123"` (cố định)
- Thực tế: Password được generate ngẫu nhiên → Không khớp → Modal không hiện

### **Bây giờ:**
- Backend sử dụng: `user.RequiresPasswordChange` (flag trong database)
- Tất cả user mới: `RequiresPasswordChange = true`
- Sau khi đổi mật khẩu: `RequiresPasswordChange = false`

## 🚀 **Cách test**

### **Bước 1: Tạo nhân viên mới**
1. Đăng nhập với tài khoản admin
2. Tạo nhân viên mới trong hệ thống
3. Hệ thống sẽ:
   - Generate password ngẫu nhiên
   - Set `RequiresPasswordChange = true`
   - Gửi email với thông tin đăng nhập

### **Bước 2: Test đăng nhập lần đầu**
1. Đăng nhập với email và password từ email
2. Hệ thống sẽ:
   - Kiểm tra `user.RequiresPasswordChange = true`
   - Trả về `RequiresPasswordChange: true`
   - Frontend hiển thị modal bắt buộc đổi mật khẩu

### **Bước 3: Test đổi mật khẩu**
1. Đổi mật khẩu trong modal
2. Hệ thống sẽ:
   - Đổi mật khẩu thành công
   - Set `RequiresPasswordChange = false`
   - Gửi email xác nhận
   - Modal đóng

### **Bước 4: Test đăng nhập lại**
1. Đăng nhập với mật khẩu mới
2. Hệ thống sẽ:
   - Kiểm tra `user.RequiresPasswordChange = false`
   - Trả về `RequiresPasswordChange: false`
   - Không hiển thị modal

## 🔧 **Database Changes**

### **Migration Applied:**
```sql
ALTER TABLE [AspNetUsers] ADD [RequiresPasswordChange] bit NOT NULL DEFAULT CAST(0 AS bit);
```

### **Existing Users:**
- Tất cả user hiện tại: `RequiresPasswordChange = false`
- Chỉ user mới tạo: `RequiresPasswordChange = true`

## 📋 **Checklist Test**

- [ ] Tạo nhân viên mới thành công
- [ ] Email được gửi với thông tin đăng nhập
- [ ] Đăng nhập lần đầu hiển thị modal
- [ ] Modal không thể đóng (không có nút X, Hủy)
- [ ] Đổi mật khẩu thành công
- [ ] Email xác nhận được gửi
- [ ] Modal đóng sau khi đổi mật khẩu
- [ ] Đăng nhập lại không hiển thị modal
- [ ] Database flag được cập nhật đúng

## 🐛 **Debug Information**

### **Console Logs:**
- LoginView: `"User requires password change - flag set in localStorage"`
- App.vue: `"Password changed successfully: [message]"`

### **Network Requests:**
- `POST /Auth/login` → Response có `RequiresPasswordChange: true/false`
- `POST /Auth/change-password` → Success response

### **Database Check:**
```sql
SELECT Id, Email, RequiresPasswordChange 
FROM AspNetUsers 
WHERE Email = 'test@example.com';
```

## ✅ **Expected Results**

### **New Employee Flow:**
1. ✅ Create employee → `RequiresPasswordChange = true`
2. ✅ Email sent with random password
3. ✅ First login → Modal appears
4. ✅ Change password → Modal closes
5. ✅ `RequiresPasswordChange = false`

### **Existing Employee Flow:**
1. ✅ Login with current password → No modal
2. ✅ Normal system usage

## 🎯 **Success Criteria**

- ✅ Modal chỉ hiện cho user mới (RequiresPasswordChange = true)
- ✅ Modal không thể đóng cho đến khi đổi mật khẩu
- ✅ Password được generate ngẫu nhiên và mạnh
- ✅ Email được gửi với template đẹp
- ✅ Database flag được quản lý đúng cách
