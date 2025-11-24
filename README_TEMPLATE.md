# Hướng dẫn nhanh: Sử dụng Template Hợp đồng

## Bước 1: Chuyển đổi file mẫu

1. Mở file `src/assets/mau-hop-dong-lao-dong-chung.doc` bằng Microsoft Word
2. Lưu lại với định dạng `.docx` (File > Save As > chọn Word Document (*.docx))
3. Đặt tên: `mau-hop-dong-lao-dong-chung.docx`

## Bước 2: Copy file vào thư mục public

Copy file `mau-hop-dong-lao-dong-chung.docx` vào thư mục `public/`

Hoặc chạy script:
```bash
node copy-template.js
```

## Bước 3: Sử dụng từ khóa trong template

Trong file Word template, sử dụng các từ khóa sau:

### Các từ khóa chính:
- `{tk_sohopdong}` - Số hợp đồng
- `{tk_nhanvien}` - Tên nhân viên
- `{tk_ngaysinh}` - Ngày sinh
- `{tk_ngaybatdau}` - Ngày bắt đầu hợp đồng
- `{tk_ngayketthuc}` - Ngày kết thúc hợp đồng
- `{tk_luonghopdong}` - Lương hợp đồng (đã format)
- `{tk_luongbaohiem}` - Lương bảo hiểm (đã format)
- `{tk_phucap}` - Danh sách phụ cấp

### Ví dụ trong Word:
```
HỢP ĐỒNG LAO ĐỘNG
Số: {tk_sohopdong}

Nhân viên: {tk_nhanvien}
Ngày sinh: {tk_ngaysinh}
Lương: {tk_luonghopdong}
```

Xem file `CONTRACT_TEMPLATE_GUIDE.md` để biết đầy đủ danh sách từ khóa.

## Lưu ý

- File template phải là `.docx` (không hỗ trợ `.doc`)
- Tất cả từ khóa phải trong dấu ngoặc nhọn: `{từ_khóa}`
- File template phải nằm trong thư mục `public/`

