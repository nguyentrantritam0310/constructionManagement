# 🧪 Test Guide - Header Dropdown

## 🔍 **Cách Test Dropdown Menu**

### **Bước 1: Kiểm tra Header**
1. Đăng nhập vào hệ thống
2. Nhìn vào góc phải header
3. Bạn sẽ thấy tên user với icon mũi tên xuống

### **Bước 2: Test Hover Effect**
1. **Hover chuột** vào vùng tên user
2. **Dropdown menu sẽ xuất hiện** với:
   - 🔑 "Đổi mật khẩu"
   - ➖ Đường kẻ ngang
   - 🚪 "Đăng xuất"

### **Bước 3: Test Chức năng**
1. **Click "Đổi mật khẩu"** → Modal đổi mật khẩu mở
2. **Click "Đăng xuất"** → Đăng xuất khỏi hệ thống
3. **Di chuột ra ngoài** → Dropdown đóng

## 🎨 **Visual Effects**

### **Hover Animations:**
- ✅ Background user-info sáng hơn
- ✅ Mũi tên xoay 180 độ
- ✅ Dropdown xuất hiện mượt mà

### **Dropdown Design:**
- ✅ Background trắng
- ✅ Shadow đẹp
- ✅ Border radius 8px
- ✅ Hover effects cho items

## 🐛 **Troubleshooting**

### **Nếu dropdown không hiện:**

#### **1. Kiểm tra CSS:**
```css
.user-dropdown:hover .dropdown-menu {
  display: block !important;
}
```

#### **2. Kiểm tra HTML Structure:**
```html
<div class="user-dropdown">
  <div class="user-info">
    <!-- User info -->
  </div>
  <div class="dropdown-menu">
    <!-- Menu items -->
  </div>
</div>
```

#### **3. Kiểm tra Console:**
- Mở Developer Tools (F12)
- Kiểm tra tab Console có lỗi không
- Kiểm tra tab Elements xem CSS có load đúng không

### **Nếu dropdown hiện nhưng không click được:**
1. Kiểm tra z-index của dropdown-menu
2. Đảm bảo không có element nào che phủ
3. Kiểm tra pointer-events

## 🔧 **CSS Debug**

### **Thêm CSS tạm thời để debug:**
```css
.user-dropdown {
  border: 2px solid red !important; /* Debug border */
}

.dropdown-menu {
  border: 2px solid blue !important; /* Debug border */
  display: block !important; /* Force show */
}
```

## 📱 **Browser Compatibility**

### **Test trên các browser:**
- ✅ Chrome/Edge
- ✅ Firefox  
- ✅ Safari
- ✅ Mobile browsers

### **Mobile Testing:**
- Touch và hold trên tên user
- Dropdown sẽ hiện và có thể tap

## 🎯 **Expected Behavior**

### **Desktop:**
```
Hover → Dropdown appears → Click item → Action executed
```

### **Mobile:**
```
Tap → Dropdown appears → Tap item → Action executed
```

## 📋 **Test Checklist**

- [ ] Hover vào tên user
- [ ] Dropdown menu xuất hiện
- [ ] Mũi tên xoay 180 độ
- [ ] Background user-info sáng hơn
- [ ] Click "Đổi mật khẩu" → Modal mở
- [ ] Click "Đăng xuất" → Logout
- [ ] Di chuột ra ngoài → Dropdown đóng
- [ ] Test trên mobile/touch devices

## 🚀 **Performance**

### **Optimizations:**
- ✅ CSS-only hover (không cần JavaScript)
- ✅ Smooth transitions
- ✅ No layout shifts
- ✅ Fast rendering

## 🎨 **Customization**

### **Thay đổi màu sắc:**
```css
.dropdown-menu {
  background: #your-color;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.dropdown-item:hover {
  background-color: #your-hover-color;
}
```

### **Thay đổi vị trí:**
```css
.dropdown-menu {
  right: 0; /* Align right */
  left: 0;  /* Align left */
  top: 100%; /* Below user info */
}
```
