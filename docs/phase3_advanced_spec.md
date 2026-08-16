# Tiny Win — Đặc Tả Tính Năng Nâng Cao (Giai Đoạn 3)

**Version:** 1.0  
**Author:** Senior Product Manager & System Architect  
**Scope:** Home Screen Widget, Push Notifications (FCM), QR Friend Connect, Weekly Summary Card.

---

## 1. Home Screen Widget (iOS & Android)

### 1.1 Mục tiêu
- Giúp người dùng xem nhanh trạng thái Tiny Win trong ngày và chuỗi Streak mà không cần mở ứng dụng.
- Chạm vào Widget để mở trực tiếp màn hình soạn thảo (< 5 giây hoàn thành thao tác).

### 1.2 Trạng thái Widget
1. **Chưa đăng bài (Pending)**:
   - Hiển thị thông điệp kích hoạt: *"Chiến thắng nhỏ hôm nay của bạn là gì?"*
   - Nút bấm *"Đăng ngay ✍️"* mở app thẳng vào HomeScreen có bàn phím sẵn sàng.
2. **Đã đăng bài (Completed)**:
   - Hiển thị nội dung bài viết Tiny Win hôm nay.
   - Huy hiệu Streak hiện tại (ví dụ: `🔥 7 ngày liên tiếp`).

### 1.3 Cơ chế Đồng bộ & Tiết kiệm Pin (Background Sync)
- Sử dụng API siêu nhẹ: `GET /v1/widget/today` (Payload < 200 bytes).
- iOS: Sử dụng `WidgetKit` + `TimelineReloadPolicy.after(midnight)`.
- Android: Sử dụng `Jetpack Glance` + `WorkManager` (chu kỳ tối thiểu 15-30 phút).

---

## 2. Hệ thống Thông báo đẩy (Firebase Cloud Messaging - FCM)

### 2.1 Các kịch bản Thông báo
| Loại thông báo | Thời điểm gửi | Nội dung mẫu | Hành động khi chạm |
| :--- | :--- | :--- | :--- |
| **Nhắc nhở hằng ngày** | **20:00** theo múi giờ người dùng | *"Đừng quên ghi lại 1 chiến thắng nhỏ hôm nay để giữ chuỗi 🔥"* | Mở màn hình Tạo Win |
| **Bạn bè đăng bài** | Khi bạn thân trong danh sách đăng | *"Hoàng Anh vừa hoàn thành Tiny Win hôm nay ✨"* | Mở Feed bạn bè |
| **Nhận Reaction** | Khi có người thả 🔥/👀/🤝 | *"Minh Thư đã đồng cảm 🤝 với bài viết của bạn"* | Mở chi tiết bài viết |

### 2.2 Quy tắc Tránh Spam (Anti-Fatigue)
- Không gửi thông báo nhắc nhở 20:00 nếu người dùng **đã đăng bài trước 20:00**.
- Gom nhóm (Batching) thông báo reaction: Tối đa 1 thông báo gom trong vòng 15 phút.

---

## 3. Kết nối Bạn bè qua Mã QR & Deep Link

### 3.1 Luồng kết nối 1-Chạm
1. Người dùng A mở Profile ➔ Chọn *"Mã kết bạn của tôi"*.
2. App sinh mã QR kèm link: `https://tinywin.app/add/{invite_token}` (Token có hạn 48 giờ).
3. Người dùng B dùng Camera quét mã ➔ Tự động gửi lời mời kết bạn và xác nhận 2 chiều.

---

## 4. Weekly Summary Card (Thẻ Tổng Kết Tuần)

### 4.1 Cơ chế hoạt động
- Vào mỗi sáng Chủ Nhật / Thứ Hai, app tự động tổng hợp danh sách các Tiny Win trong 7 ngày qua.
- Xuất ảnh dạng Story card (9:16) với thiết kế tối giản, thanh lịch để người dùng chia sẻ lên Instagram Story / Facebook Story.
- Giúp lan tỏa tự nhiên thông điệp *"Flex nhỏ thôi — nhưng thật"*.
