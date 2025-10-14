# Tính năng Đổi Mật Khẩu Bắt Buộc

## Tổng quan
Tính năng này yêu cầu người dùng đổi mật khẩu khi họ đăng nhập bằng mật khẩu mặc định "123456789".

## Cách hoạt động

### 1. Backend (API)
- **Endpoint**: `POST /api/auth/change-password`
- **DTO**: `ChangePasswordDTO`
  - `CurrentPassword` (bắt buộc): Mật khẩu hiện tại
  - `NewPassword` (bắt buộc, tối thiểu 6 ký tự): Mật khẩu mới
  - `ConfirmPassword` (bắt buộc): Xác nhận mật khẩu mới

- **Login Response**: Thêm trường `RequiresPasswordChange` để báo hiệu cần đổi mật khẩu

### 2. Frontend Components

#### ChangePasswordModal.vue
- Modal dialog hiển thị form đổi mật khẩu
- Validation form:
  - Mật khẩu mới tối thiểu 6 ký tự
  - Xác nhận mật khẩu phải khớp
- Sử dụng `useChangePassword` composable

#### useChangePassword.js
- Composable quản lý logic đổi mật khẩu
- Xử lý API calls và error handling
- Trả về loading state và error messages

### 3. Flow hoạt động

1. **Đăng nhập với mật khẩu mặc định**:
   - User nhập email và password "123456789"
   - API trả về `RequiresPasswordChange: true`
   - Thông tin được lưu vào localStorage

2. **Hiển thị modal đổi mật khẩu**:
   - App.vue theo dõi trạng thái đăng nhập
   - Khi `requiresPasswordChange = true`, hiển thị modal
   - Modal không thể đóng cho đến khi đổi mật khẩu thành công

3. **Đổi mật khẩu**:
   - User nhập mật khẩu hiện tại, mới và xác nhận
   - API kiểm tra mật khẩu hiện tại
   - Nếu hợp lệ, cập nhật mật khẩu mới
   - Xóa flag `requiresPasswordChange` khỏi localStorage

## Files được thêm/sửa đổi

### Backend
- `dotnet-api/dotnet-api/DTOs/AuthDTOs.cs` - Thêm ChangePasswordDTO và cập nhật AuthResponseDTO
- `dotnet-api/dotnet-api/Controllers/AuthController.cs` - Thêm endpoint change-password và logic kiểm tra mật khẩu mặc định

### Frontend
- `constructionManagement/src/components/common/ChangePasswordModal.vue` - Component modal đổi mật khẩu
- `constructionManagement/src/composables/useChangePassword.js` - Composable quản lý đổi mật khẩu
- `constructionManagement/src/views/LoginView.vue` - Xử lý yêu cầu đổi mật khẩu sau đăng nhập
- `constructionManagement/src/App.vue` - Hiển thị modal khi cần thiết
- `constructionManagement/src/composables/useAuth.js` - Cập nhật login function để xử lý RequiresPasswordChange

## Bảo mật
- Mật khẩu hiện tại được kiểm tra trước khi cho phép đổi
- Mật khẩu mới phải đáp ứng yêu cầu tối thiểu (6 ký tự)
- Xác nhận mật khẩu phải khớp với mật khẩu mới
- Modal bắt buộc phải đổi mật khẩu trước khi tiếp tục sử dụng hệ thống

## Testing
Để test tính năng này:
1. Tạo user với mật khẩu "123456789"
2. Đăng nhập với mật khẩu này
3. Modal đổi mật khẩu sẽ xuất hiện
4. Đổi mật khẩu thành công
5. Modal sẽ đóng và user có thể tiếp tục sử dụng hệ thống
