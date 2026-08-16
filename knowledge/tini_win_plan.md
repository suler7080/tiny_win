
TÀI LIỆU KẾ HOẠCH PHÁT TRIỂN & PHÂN CHIA VAI TRÒ THI CÔNG (PROJECT EXECUTION PLAN & RACI MATRIX)
I. TỔNG QUAN DỰ ÁN & MỤC TIÊU SẢN PHẨM
1. Định vị Sản phẩm
Tên dự án: Tiny Win (Mạng xã hội tích cực & Tối giản).
Thông điệp cốt lõi (Core Concept): "Flex nhỏ thôi — nhưng thật."
Triết lý sản phẩm (Anti-Instagram):
Tối giản ma sát (Zero Friction): Mở app là thấy ngay khung tạo nội dung, đăng bài trong dưới 15 giây.
Giảm áp lực (Low Pressure): Giới hạn 1 bài/ngày, câu văn ngắn (max 120 ký tự), không bình luận, không hiển thị tổng lượt like công khai.
Tương tác chân thực (High Resonance): Giới hạn đúng 3 phản ứng cảm xúc nguyên bản: 🔥 (Lit/Đỉnh), 👀 (Noted/Đã thấy), 🤝 (Same/Đồng cảm).
Kích hoạt "Reverse FOMO": Giúp người dùng nhìn thấy sự tiến bộ nhỏ hàng ngày của bạn bè thân thiết để tạo động lực cho chính mình.
2. Chỉ số Mục tiêu (Key Project KPIs)
D1 Retention Rate: > 45% người dùng quay lại sau 1 ngày.
D7 Retention Rate: > 25% người dùng quay lại sau 7 ngày.
Daily Active Post Rate: > 60% người dùng hoạt động hoàn thành đăng Tiny Win trong ngày.
Độ ổn định hệ thống (Crash-free Rate): > 99.9% phiên hoạt động không gặp sự cố.
II. MA TRẬN PHÂN CHIA VAI TRÒ VÀ TRÁCH NHIỆM (RACI MATRIX)
Vai trò
Thành viên đảm nhận
Trách nhiệm chính (Accountabilities & Deliverables)
Product Manager (PM) / Product Owner (PO)
Trưởng nhóm Sản phẩm
- Chịu trách nhiệm toàn bộ về mục tiêu, phạm vi dự án (Scope) và Lộ trình (Roadmap).- Duyệt tài liệu Yêu cầu Sản phẩm (PRD), User Stories và quản lý Sprint Backlog.- Theo dõi tiến độ Sprint, điều phối liên phòng ban và đo lường các chỉ số KPIs sau ra mắt.
UI/UX Designer
Chuyên viên Thiết kế
- Xây dựng hệ thống thiết kế (Design System: Color Palette, Typography, Component Library).- Thiết kế sơ đồ Luồng người dùng (User Flow), Wireframes Lo-Fi và Prototype Hi-Fi trên Figma.- Tối ưu trải nghiệm chạm/vuốt, micro-interactions.- Thiết kế tài nguyên quảng bá cửa hàng ứng dụng (ASO Graphics).
Lead Mobile Engineer
Kỹ sư Di động Chính
- Khởi tạo cấu trúc dự án di động (React Native / Flutter), quản lý State Management.- Lập trình các màn hình cốt lõi: Auth, Đăng Win, Feed bạn bè.- Phát triển Module Widget Native trên iOS (SwiftUI/WidgetKit) và Android (Kotlin/Glance).- Tối ưu hiệu năng ứng dụng, đóng gói bản build.
Mobile Developer 2
Kỹ sư Di động
- Phối hợp phát triển các màn hình phụ: Quản lý bạn bè (QR Code/Deep Link), Profile & Lịch Win.- Tích hợp hệ thống Thông báo đẩy (Firebase Push Notifications).- Lập trình xử lý lưu trữ cục bộ, xử lý logic Offline Caching và đồng bộ dữ liệu ngầm.
Backend / Infrastructure Engineer
Kỹ sư Hệ thống & Database
- Thiết kế Cơ sở dữ liệu PostgreSQL và Caching Redis.- Phát triển hệ thống RESTful APIs / gRPC và tài liệu OpenAPI/Swagger.- Tích hợp dịch vụ Authentication và Firebase FCM Server.- Thiết lập môi trường Server và đường ống tự động CI/CD.
QA / Testing Engineer
Chuyên viên Kiểm thử
- Xây dựng Kế hoạch Kiểm thử (Test Plan) và Kịch bản Kiểm thử (Test Cases).- Thực hiện kiểm thử chức năng, giao diện, hiệu năng và độ ổn định trên đa thiết bị di động.- Quản lý chương trình Closed Beta Testing (50-100 người dùng thử nghiệm).- Phát hiện, ghi nhận và theo dõi lỗi (Bug Tracking).

III. KẾ HOẠCH PHÁT TRIỂN CHI TIẾT THEO 5 GIAI ĐOẠN (12 TUẦN)
GIAI ĐOẠN 1: NGHIÊN CỨU, THIẾT KẾ UI/UX & KIẾN TRÚC HỆ THỐNG (Tuần 1 - Tuần 2)
Tuần 1:
PM & Designer: Khảo sát nhu cầu người dùng, vẽ User Flow Diagram, chốt khung tính năng MVP, hoàn thiện thiết kế Wireframe Lo-Fi.
Backend & Lead Mobile: Thiết kế Database Schema PostgreSQL (Bảng Users, Friendships, Wins, Reactions, Streaks) và xây dựng API Specification.
Tuần 2:
Designer: Hoàn thiện Design System & Prototype Hi-Fi trên Figma với đầy đủ trạng thái Dark/Light Mode và Micro-animations.
Backend: Khởi tạo Server Environment, cài đặt Docker, Supabase/PostgreSQL, Redis và cấu hình CI/CD Pipeline tự động.
Lead Mobile: Khởi tạo khung dự án React Native/Flutter, cấu hình ESLint, Prettier, Redux/Zustand State Management.
GIAI ĐOẠN 2: PHÁT TRIỂN CHỨC NĂNG CỐT LÕI - BẢN MVP (Tuần 3 - Tuần 7)
Tuần 3:
Backend: Phát triển Auth Service (Đăng nhập OTP / OAuth Apple/Google) và User/Friendship APIs.
Mobile Team: Lập trình Màn hình Onboarding, Đăng nhập, Nhập thông tin cá nhân.
Tuần 4 - Tuần 5:
Backend: Phát triển Win Post Service (API đăng bài 1 câu, kiểm tra điều kiện 1 Win/ngày) và Reaction Service (API 3 nút 🔥/👀/🤝).
Mobile Team: Lập trình Màn hình Đăng Win (Tích hợp Camera Native chụp trực tiếp, đếm ngược 120 ký tự) và Màn hình Feed Bạn Bè (Cơ chế làm mờ Locked Feed).
Tuần 6:
Mobile Team: Phát triển Màn hình Quản lý bạn bè (Kết nối qua SĐT, Mã QR, chia sẻ Deep Link).
Backend: Tối ưu hóa truy vấn Feed bằng Redis Cache để đảm bảo tốc độ phản hồi API < 100ms.
Tuần 7:
Backend & Mobile: Tích hợp Firebase Cloud Messaging (FCM) gửi thông báo đẩy: khi bạn bè đăng Win, khi nhận được Reaction và thông báo nhắc nhở tự động lúc 20:00 hằng ngày.
GIAI ĐOẠN 3: TÍNH NĂNG NÂNG CAO - WIDGET, STREAK & LỊCH CÁ NHÂN (Tuần 8 - Tuần 9)
Tuần 8:
Backend: Xây dựng logic đếm Weekly Streak theo mốc tuần (YYYY-WW) và API truy xuất lịch sử Win theo tháng.
Mobile Team: Lập trình Màn hình Profile & Lịch Win cá nhân (Giao diện lưới Heatmap/Calendar).
Tuần 9:
Lead Mobile: Phát triển iOS Home Screen Widget bằng SwiftUI / WidgetKit.
Mobile 2: Phát triển Android Home Screen Widget bằng Kotlin / Jetpack Glance.
Backend: Thiết lập cơ chế Background Sync đồng bộ dữ liệu ngầm cho Widget.
GIAI ĐOẠN 4: KIỂM THỬ, TỐI ƯU HÓA & CLOSED BETA (Tuần 10 - Tuần 11)
Tuần 10 (Closed Beta):
QA & PM: Phát hành bản build Beta qua TestFlight (iOS) và Google Play Closed Testing (Android) cho nhóm 50-100 người dùng thử nghiệm.
Tuần 11 (Bug Fix & Polish):
Mobile & Backend: Sửa các lỗi phát sinh, xử lý lệch múi giờ (Timezone Reset), tối ưu thời gian khởi động app (Cold start < 1.5s), tối ưu nén dung lượng ảnh tải lên.
QA: Kiểm thử toàn diện tính năng bảo mật, kiểm tra phân quyền API và xác minh chức năng Xóa tài khoản bắt buộc.
GIAI ĐOẠN 5: CHÍNH THỨC PHÁT HÀNH & KÍCH HOẠT TĂNG TRƯỞNG (Tuần 12 & Sau Launch)
Tuần 12 (App Store Release):
PM & Designer: Chuẩn bị đầy đủ tài nguyên ASO (Tên app, Mô tả, Screenshots, App Icon).
Lead Mobile: Đóng gói bản Production Build và nộp kiểm duyệt lên Apple App Store & Google Play Store.
Sau Launch (Growth & Monitoring):
Mobile Team: Kích hoạt tính năng xuất ảnh "Weekly Summary Card" để người dùng chia sẻ lên mạng xã hội khác.
PM & QA: Theo dõi sát sao các chỉ số D1/D7 Retention, Daily Active Post Rate và Crash-free rate qua Firebase Analytics.
IV. QUY TRÌNH QUẢN LÝ DỰ ÁN & VẬN HÀNH DỰ ÁN
Phương pháp Quản lý: Áp dụng mô hình Agile / Scrum với chu kỳ Sprint 1 tuần.
Chế độ Báo cáo & Họp:
Daily Standup (15 phút mỗi sáng): Cập nhật 3 nội dung (Hôm qua đã làm gì? Hôm nay sẽ làm gì? Có khó khăn/blocker gì không?).
Sprint Planning (Đầu tuần): Phân chia công việc và chốt cam kết Sprint Backlog.
Sprint Review & Retrospective (Cuối tuần): Demo sản phẩm hoàn thành trong tuần và rút kinh nghiệm cải tiến quy trình.
Công cụ Quản trị:
Quản lý Công việc: Jira / Trello.
Quản lý Mã nguồn: GitHub / GitLab (Áp dụng GitFlow Workflow).
Thiết kế & Tài liệu: Figma, Notion.
Báo cáo Lỗi: Jira / GitHub Issues.
Kênh Trao đổi: Slack / Zalo Work.

Tài liệu này được lập và thông qua làm căn cứ triển khai chính thức cho dự án di động Tiny Win.
