# Hướng dẫn sử dụng Template Hợp đồng Lao động

## Cách thiết lập

1. **Chuyển đổi file mẫu sang định dạng .docx**
   - File hiện tại: `src/assets/mau-hop-dong-lao-dong-chung.doc`
   - Cần chuyển đổi sang `.docx` (có thể mở bằng Microsoft Word và Save As .docx)
   - Đặt tên file: `mau-hop-dong-lao-dong-chung.docx`

2. **Đặt file template vào thư mục public**
   - Copy file `mau-hop-dong-lao-dong-chung.docx` vào thư mục `public/`
   - File sẽ được truy cập tại: `/mau-hop-dong-lao-dong-chung.docx`

## Các từ khóa placeholder trong template

Khi tạo file template Word, bạn có thể sử dụng các từ khóa sau để thay thế bằng dữ liệu thực tế:

### Thông tin hợp đồng
- `{tk_sohopdong}` - Số hợp đồng
- `{tk_loaihopdong}` - Loại hợp đồng (ví dụ: Hợp đồng lao động xác định thời hạn)

### Thông tin nhân viên
- `{tk_nhanvien}` - Họ và tên đầy đủ
- `{tk_honhanvien}` - Họ và tên đệm
- `{tk_tennhanvien}` - Tên
- `{tk_ngaysinh}` - Ngày sinh (dd/mm/yyyy)
- `{tk_gioitinh}` - Giới tính (Nam/Nữ/Khác)
- `{tk_cmnd}` - Số CMND/CCCD
- `{tk_noicap}` - Nơi cấp CMND/CCCD
- `{tk_diachi}` - Địa chỉ thường trú
- `{tk_sdt}` - Số điện thoại
- `{tk_email}` - Email

### Thông tin hợp đồng
- `{tk_ngaybatdau}` - Ngày bắt đầu hợp đồng (dd/mm/yyyy)
- `{tk_ngaybatdau_ngay}` - Ngày bắt đầu (chỉ số ngày)
- `{tk_ngaybatdau_thang}` - Ngày bắt đầu (chỉ số tháng)
- `{tk_ngaybatdau_nam}` - Ngày bắt đầu (chỉ số năm)
- `{tk_ngayketthuc}` - Ngày kết thúc hợp đồng (dd/mm/yyyy)
- `{tk_ngayketthuc_ngay}` - Ngày kết thúc (chỉ số ngày)
- `{tk_ngayketthuc_thang}` - Ngày kết thúc (chỉ số tháng)
- `{tk_ngayketthuc_nam}` - Ngày kết thúc (chỉ số năm)

### Lương và phụ cấp
- `{tk_luonghopdong}` - Lương hợp đồng (đã format: 15.000.000 đồng)
- `{tk_luonghopdong_so}` - Lương hợp đồng (chỉ số: 15.000.000)
- `{tk_luongbaohiem}` - Lương bảo hiểm (đã format: 15.000.000 đồng)
- `{tk_luongbaohiem_so}` - Lương bảo hiểm (chỉ số: 15.000.000)
- `{tk_phucap}` - Danh sách phụ cấp (mỗi phụ cấp trên một dòng)

### Ngày hiện tại
- `{tk_ngayhientai}` - Ngày hiện tại (dd/mm/yyyy)
- `{tk_ngayhientai_ngay}` - Ngày hiện tại (chỉ số ngày)
- `{tk_ngayhientai_thang}` - Ngày hiện tại (chỉ số tháng)
- `{tk_ngayhientai_nam}` - Ngày hiện tại (chỉ số năm)

### Thông tin công ty (cần cấu hình)
- `{tk_tencongty}` - Tên công ty
- `{tk_diachicongty}` - Địa chỉ công ty
- `{tk_sdtcongty}` - Số điện thoại công ty
- `{tk_vitricongviec}` - Vị trí công việc

## Cách sử dụng trong file Word

1. Mở file template trong Microsoft Word
2. Tìm vị trí cần điền thông tin
3. Gõ từ khóa placeholder, ví dụ: `{tk_nhanvien}`
4. Lưu file với định dạng `.docx`
5. Đặt file vào thư mục `public/`

## Ví dụ trong file Word

```
HỢP ĐỒNG LAO ĐỘNG

Số hợp đồng: {tk_sohopdong}
Ngày {tk_ngayhientai_ngay} tháng {tk_ngayhientai_thang} năm {tk_ngayhientai_nam}

BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):
Công ty: {tk_tencongty}
Địa chỉ: {tk_diachicongty}
Điện thoại: {tk_sdtcongty}

BÊN B (NGƯỜI LAO ĐỘNG):
Họ và tên: {tk_nhanvien}
Ngày sinh: {tk_ngaysinh}
Giới tính: {tk_gioitinh}
Số CMND/CCCD: {tk_cmnd}
Nơi cấp: {tk_noicap}
Địa chỉ: {tk_diachi}
Số điện thoại: {tk_sdt}
Email: {tk_email}

ĐIỀU 1: VỊ TRÍ CÔNG VIỆC
Bên B được tuyển dụng vào làm việc tại công ty với vị trí: {tk_vitricongviec}

ĐIỀU 2: LOẠI HỢP ĐỒNG
Loại hợp đồng: {tk_loaihopdong}

ĐIỀU 3: THỜI HẠN HỢP ĐỒNG
Thời hạn hợp đồng: Từ ngày {tk_ngaybatdau} đến ngày {tk_ngayketthuc}

ĐIỀU 4: MỨC LƯƠNG VÀ PHỤ CẤP
1. Mức lương: {tk_luonghopdong}
2. Mức lương đóng bảo hiểm: {tk_luongbaohiem}
3. Phụ cấp:
{tk_phucap}
```

## Lưu ý

- Tất cả từ khóa phải được đặt trong dấu ngoặc nhọn: `{từ_khóa}`
- Từ khóa không phân biệt hoa thường
- Nếu thiếu dữ liệu, hệ thống sẽ hiển thị giá trị mặc định hoặc `[N/A]`
- File template phải là định dạng `.docx` (không hỗ trợ `.doc`)

