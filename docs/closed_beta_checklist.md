# Tiny Win — Closed Beta & Security Checklist (Giai Đoạn 4)

**Author:** Senior QA & Test Automation Specialist  
**Target:** 50 - 100 Beta Testers (TestFlight iOS & Google Play Internal Testing)

---

## 1. Danh mục Kiểm thử Bảo mật & Phân quyền (Security & Auth)
- [x] **Rate Limiting**: Thử gửi > 60 req/phút ➔ Bị chặn 429 Too Many Requests.
- [x] **Idempotency Key**: Gửi lại cùng 1 UUID ➔ Nhận 200 OK cùng bài viết cũ, không tạo bài trùng.
- [x] **Timezone Boundary**: Đổi múi giờ thiết bị trước và sau 00:00 ➔ Server là nguồn chân lý tính theo múi giờ tài khoản.
- [x] **Feed Lock Enforcement**: Cố truy vấn `GET /v1/feed` khi chưa đăng bài ➔ Bị chặn 403 Forbidden cứng từ backend.
- [x] **Self Reaction Prevention**: Cố gửi reaction bài của chính mình ➔ Nhận 403 `REACTION_FORBIDDEN`.

---

## 2. Kịch bản Trải nghiệm Người dùng (Closed Beta Testing Flow)
1. **Ngày 1 (Onboarding & First Win)**:
   - Đăng ký qua Email/Password ➔ Vào màn hình chính.
   - Soạn thảo bài viết đầu tiên (< 120 ký tự) ➔ Đăng thành công trong < 15 giây.
   - Mở khóa Bảng tin bạn bè.
2. **Ngày 2 -> Ngày 7 (Duy trì Chuỗi Streak)**:
   - Nhận thông báo nhắc nhở lúc 20:00.
   - Đăng bài ➔ Quan sát Streak tăng lên 2, 3, ... 7 ngày trên Profile Heatmap.
3. **Thả & Đổi Reaction**:
   - Thử bấm 🔥, đổi sang 👀, bấm lại để hủy reaction ➔ UI phản hồi mượt mà không giật lag.
