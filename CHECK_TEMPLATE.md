# Kiểm tra và thiết lập Template Hợp đồng

## Lỗi thường gặp: "Can't find end of central directory"

Lỗi này xảy ra khi:
1. File template không tồn tại trong thư mục `public/`
2. File là định dạng `.doc` (cũ) thay vì `.docx`
3. File bị hỏng hoặc không phải là file Word hợp lệ

## Cách khắc phục:

### Bước 1: Chuyển đổi file .doc sang .docx

1. Mở file `src/assets/mau-hop-dong-lao-dong-chung.doc` bằng **Microsoft Word**
2. Click **File** > **Save As** (hoặc **Lưu thành**)
3. Trong hộp thoại Save As:
   - Chọn vị trí lưu: thư mục `public/` của project
   - **Quan trọng**: Trong dropdown "Save as type" (Loại tệp), chọn **"Word Document (*.docx)"**
   - Đặt tên: `mau-hop-dong-lao-dong-chung.docx`
4. Click **Save**

### Bước 2: Kiểm tra file đã được tạo

Sau khi lưu, bạn sẽ có file:
```
constructionManagement/public/mau-hop-dong-lao-dong-chung.docx
```

### Bước 3: Thêm các từ khóa placeholder vào file Word

Mở file `public/mau-hop-dong-lao-dong-chung.docx` và thêm các từ khóa như:

```
Số hợp đồng: {tk_sohopdong}
Nhân viên: {tk_nhanvien}
Ngày sinh: {tk_ngaysinh}
Lương: {tk_luonghopdong}
```

Xem file `CONTRACT_TEMPLATE_GUIDE.md` để biết đầy đủ danh sách từ khóa.

### Bước 4: Kiểm tra lại

1. Restart dev server nếu đang chạy
2. Thử xuất hợp đồng lại

## Nếu vẫn gặp lỗi:

1. **Kiểm tra file có đúng định dạng .docx không:**
   - Click chuột phải vào file > Properties
   - Kiểm tra "Type of file" phải là "Microsoft Word Document" hoặc ".docx"

2. **Kiểm tra file có trong thư mục public không:**
   - Đường dẫn: `constructionManagement/public/mau-hop-dong-lao-dong-chung.docx`
   - File phải ở đúng vị trí này

3. **Thử mở file bằng Word:**
   - Nếu file không mở được, file có thể bị hỏng
   - Tạo lại file từ đầu

4. **Kiểm tra console:**
   - Mở Developer Tools (F12)
   - Xem tab Console để biết lỗi chi tiết

## Tạo file template mẫu (nếu chưa có)

Nếu bạn chưa có file template, có thể tạo một file Word mới với nội dung cơ bản:

1. Tạo file Word mới
2. Thêm nội dung với các placeholder:
   ```
   HỢP ĐỒNG LAO ĐỘNG
   
   Số hợp đồng: {tk_sohopdong}
   Ngày {tk_ngayhientai_ngay} tháng {tk_ngayhientai_thang} năm {tk_ngayhientai_nam}
   
   BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):
   Công ty: {tk_tencongty}
   
   BÊN B (NGƯỜI LAO ĐỘNG):
   Họ và tên: {tk_nhanvien}
   Ngày sinh: {tk_ngaysinh}
   Lương: {tk_luonghopdong}
   ```
3. Lưu với tên `mau-hop-dong-lao-dong-chung.docx` vào thư mục `public/`

