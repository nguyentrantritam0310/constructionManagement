# 🔐 Hướng dẫn Bảo mật Mật khẩu

## 📋 Yêu cầu Mật khẩu Mạnh

### Regex Pattern
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
```

### Giải thích Regex
- `^` - Bắt đầu chuỗi
- `(?=.*[a-z])` - Lookahead: phải có ít nhất 1 chữ thường
- `(?=.*[A-Z])` - Lookahead: phải có ít nhất 1 chữ hoa  
- `(?=.*\d)` - Lookahead: phải có ít nhất 1 số
- `(?=.*[@$!%*?&])` - Lookahead: phải có ít nhất 1 ký tự đặc biệt
- `[A-Za-z\d@$!%*?&]{8,}` - Chỉ cho phép các ký tự được phép và tối thiểu 8 ký tự
- `$` - Kết thúc chuỗi

### Yêu cầu Chi tiết
1. **Độ dài**: Tối thiểu 8 ký tự
2. **Chữ thường**: Ít nhất 1 chữ cái thường (a-z)
3. **Chữ hoa**: Ít nhất 1 chữ cái hoa (A-Z)
4. **Số**: Ít nhất 1 chữ số (0-9)
5. **Ký tự đặc biệt**: Ít nhất 1 trong các ký tự (@$!%*?&)

### Ví dụ Mật khẩu Hợp lệ
- ✅ `MyPassword123!`
- ✅ `Secure@Pass1`
- ✅ `Strong$Pass2024`
- ✅ `TempPass@123`

### Ví dụ Mật khẩu Không hợp lệ
- ❌ `password123` (thiếu chữ hoa và ký tự đặc biệt)
- ❌ `PASSWORD123` (thiếu chữ thường và ký tự đặc biệt)
- ❌ `Password` (thiếu số và ký tự đặc biệt)
- ❌ `Pass1!` (quá ngắn, dưới 8 ký tự)

## 🔧 Implementation

### Backend (C#)
```csharp
[RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", 
    ErrorMessage = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)")]
public string Password { get; set; }
```

### Frontend (Vue.js)
```javascript
// usePasswordValidation.js
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const validatePassword = (password) => {
  return passwordRegex.test(password)
}
```

## 🎯 Mật khẩu Mặc định Mới

**Trước**: `123456789` (không đủ mạnh)
**Sau**: `TempPass@123` (tuân thủ regex)

## 🛡️ Lợi ích Bảo mật

1. **Chống Brute Force**: Mật khẩu phức tạp khó đoán
2. **Đa dạng Ký tự**: Tăng entropy và độ khó
3. **Tuân thủ Chuẩn**: Đáp ứng các tiêu chuẩn bảo mật quốc tế
4. **Phản hồi Tức thì**: Validation real-time giúp user tạo mật khẩu đúng ngay

## 📱 UX Features

### Password Strength Indicator
- Thanh tiến trình hiển thị độ mạnh
- Màu sắc: Đỏ (yếu) → Vàng (trung bình) → Xanh (mạnh)

### Real-time Validation
- Kiểm tra từng yêu cầu khi user nhập
- Icon check/x cho từng điều kiện
- Thông báo rõ ràng về yêu cầu

### Visual Feedback
- Border đỏ khi mật khẩu không hợp lệ
- Tooltip hướng dẫn chi tiết
- Không cho phép submit khi chưa đạt yêu cầu

## 🔄 Migration

### Tài khoản Hiện tại
- Mật khẩu cũ vẫn hoạt động bình thường
- Chỉ yêu cầu đổi khi đăng nhập với mật khẩu mặc định mới
- Không ảnh hưởng đến tài khoản đã có mật khẩu mạnh

### Tài khoản Mới
- Tự động áp dụng validation mạnh
- Mật khẩu mặc định tuân thủ regex
- Bắt buộc đổi mật khẩu khi lần đầu đăng nhập
