# Tiny Win — Gói Tài Nguyên Phát Hành & ASO (Giai Đoạn 5)

**Author:** Lead System & Database Architect & Senior Product Manager  
**Platform:** Apple App Store & Google Play Store

---

## 1. Thông tin Ứng dụng (Store Metadata)

- **Tên Ứng dụng (App Name)**: `Tiny Win — Flex nhỏ thôi`
- **Phụ đề (Subtitle - iOS)**: `Mạng xã hội tích cực & tối giản`
- **Mô tả ngắn (Short Description - Android)**: `Ghi lại 1 chiến thắng nhỏ mỗi ngày. Không like ảo, không áp lực.`
- **Từ khóa ASO (Keywords)**: `tiny win, thoi quen, nhat ky, streak, habit tracker, flex nho, positive social, mindfulness`

### 1.1 Mô tả chi tiết (Full Description)
> **Tiny Win** là nơi bạn ghi nhận những tiến bộ nhỏ mỗi ngày cùng bạn bè thân thiết.
> 
> ✨ **Đặc điểm nổi bật:**
> - **1 bài mỗi ngày**: Tối đa 120 ký tự, đăng bài trong chưa đầy 15 giây.
> - **Không áp lực**: Không hiển thị tổng số like công khai, không bình luận toxic.
> - **3 phản ứng chân thật**: 🔥 (Đỉnh), 👀 (Đã thấy), 🤝 (Đồng cảm).
> - **Widget màn hình chính**: Nhắc nhở tích cực và theo dõi chuỗi ngày chiến thắng.

---

## 2. Chính sách Quyền riêng tư & Luồng Xóa tài khoản (Store Compliance)

- **Chính sách riêng tư (Privacy Policy)**: Cam kết không bán dữ liệu, chỉ lưu trữ thông tin tối thiểu (Email, Timezone) phục vụ trải nghiệm app.
- **Tính năng Xóa tài khoản (Account Deletion)**: Người dùng có thể xóa toàn bộ dữ liệu vĩnh viễn trực tiếp trong mục *Cài đặt cá nhân*, thỏa mãn 100% chính sách bắt buộc của Apple App Store (Guideline 5.1.1(v)).

---

## 3. Cấu hình CI/CD Pipeline (`.github/workflows/ci.yml`)

Quy trình tự động:
1. Chạy linter & type check (`tsc --noEmit`, `flake8`).
2. Chạy bộ unit tests tự động (`pytest`).
3. Build Docker container cho Backend & đóng gói bản preview APK/IPA qua Expo EAS.
