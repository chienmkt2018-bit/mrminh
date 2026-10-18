# mrminh
Trang web học tập
mrminh/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── index.html
    ├── sw.js
    └── assets/
        ├── js/
        │   ├── app.js
        │   └── exam.js
        └── css/
            └── custom.css

            2026/09/28
            🌐 DỰ ÁN: WEB HỌC TẬP ONLINE CHUYÊN NGHIỆP ("Học học nữa học mãi")
│
├── 1. 🔐 Hệ thống Xác thực & Tài khoản
│   ├── Đăng nhập / Đăng ký (Phân quyền Admin & Học viên)
│   ├── Đổi mật khẩu bảo mật (Xác nhận khớp, tối thiểu 6 ký tự)
│   └── Quản lý phiên làm việc (Lưu trữ currentUser & token qua localStorage)
│
├── 2. 👨‍🎓 Giao diện & Chức năng Học viên (Student Dashboard)
│   ├── Bộ lọc thông minh (Theo Môn học & Khối lớp từ 1 đến 5)
│   ├── Phòng thi trực tuyến (Trắc nghiệm A, B, C, D + Đồng hồ đếm ngược tự động nộp)
│   ├── Chấm điểm tức thì (Hiển thị số câu đúng/sai, điểm hệ 10, Đạt/Chưa đạt)
│   └── Lịch sử cá nhân (Tra cứu toàn bộ kết quả bài thi đã làm)
│
├── 3. 👨‍💼 Giao diện & Chức năng Quản trị (Admin Dashboard)
│   ├── Thống kê tổng quan (Số học sinh, tổng đề thi, lượt thi, điểm trung bình)
│   ├── Biểu đồ phân tích (Chart.js cho lượt thi và phân bổ đề thi)
│   ├── Quản lý kho đề thi (Xem, Lọc, Tạo câu hỏi/đáp án mới, Xóa đề)
│   └── Lịch sử toàn trường (Theo dõi và tìm kiếm nhanh lịch sử thi của mọi học viên)
│
└── 4. 🏆 Bảng Xếp Hạng (Leaderboard)
    └── Vinh danh học viên xuất sắc (Top điểm cao, huy hiệu, thông tin đề thi và môn học)

    


## Cấu hình bảo mật khi triển khai trên Render

Trước khi đưa thay đổi bảo mật lên môi trường đang chạy, hãy mở **Render → Web Service → Environment** và cấu hình các biến sau:

- `MONGODB_URI`: chuỗi kết nối MongoDB Atlas hiện tại.
- `JWT_SECRET`: chuỗi bí mật ngẫu nhiên dài tối thiểu 32 byte. Không lưu giá trị này trong GitHub hoặc gửi công khai.
- `ADMIN_USERNAME`: tên tài khoản quản trị muốn sử dụng.
- `ADMIN_PASSWORD`: mật khẩu quản trị mới, mạnh và duy nhất.

Khi cả `ADMIN_USERNAME` và `ADMIN_PASSWORD` được đặt, lúc backend kết nối MongoDB, hệ thống sẽ tạo tài khoản Admin nếu chưa có; nếu tài khoản đó đã là Admin, mật khẩu sẽ được đồng bộ từ biến môi trường. Không dùng lại mật khẩu mặc định cũ. Nếu `ADMIN_USERNAME` đang thuộc tài khoản học viên, hệ thống sẽ không tự nâng quyền tài khoản đó.

Nếu chưa cấu hình `JWT_SECRET`, máy chủ tạo khóa ngẫu nhiên tạm thời và ghi cảnh báo; các token sẽ mất hiệu lực khi máy chủ khởi động lại. Vì vậy, hãy đặt `JWT_SECRET` ổn định trên Render trước khi kiểm thử đăng nhập.

### Các kiểm soát bảo mật đã áp dụng

- API tạo/xóa đề thi và thống kê Admin yêu cầu token hợp lệ và quyền Admin được kiểm tra từ MongoDB.
- Học viên chỉ nhận câu hỏi, không nhận trường đáp án đúng từ API đề thi.
- Điểm thi được tính trên backend từ đáp án lưu trong MongoDB; backend bỏ qua điểm hoặc username do trình duyệt tự gửi.
- Học viên chỉ xem được lịch sử của chính tài khoản đã xác thực; Admin có thể xem lịch sử toàn trường.
- API đề thi, lịch sử và bảng xếp hạng yêu cầu đăng nhập.

Sau khi triển khai, kiểm tra cả hai vai trò: học viên không được tạo/xóa đề hoặc xem lịch sử toàn trường; Admin có thể quản trị; bài thi phải nộp và lưu kết quả bình thường.
