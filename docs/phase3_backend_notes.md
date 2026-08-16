# Tiny Win — Backend Technical Notes (Giai Đoạn 3)

**Author:** Senior Backend Engineer  
**Stack:** FastAPI + Firebase Admin SDK + Celery/Cron Worker + Redis

---

## 1. Firebase Cloud Messaging (FCM) Integration

### 1.1 Khởi tạo Firebase Admin SDK
```python
import firebase_admin
from firebase_admin import credentials, messaging

cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)

async def send_push_notification(device_token: str, title: str, body: str, data: dict):
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=data,
        token=device_token,
    )
    return messaging.send(message)
```

### 1.2 Cron Job nhắc nhở 20:00 theo từng Múi Giờ
Chạy worker mỗi giờ một lần:
1. Xác định các múi giờ hiện đang là 20:00 (Ví dụ: `Asia/Ho_Chi_Minh` khi UTC là 13:00).
2. Truy vấn danh sách `user_id` thuộc múi giờ đó **chưa có bản ghi trong bảng `wins` của ngày hôm nay**.
3. Gửi FCM multicast push notification.

---

## 2. API Đồng bộ Widget (`GET /v1/widget/today`)

### 2.1 Thiết kế Siêu Nhẹ
- Header: `Authorization: Bearer <token>`
- Response JSON (< 150 bytes):
```json
{
  "has_posted_today": true,
  "content": "Chạy bộ 3km đầu ngày 🏃",
  "streak": 7
}
```
- Cache Redis: `widget:{user_id}` (TTL 300s).

---

## 3. Router Quản lý Bạn bè & QR Token (`/v1/friends`)

- `POST /v1/friends/invite-token`: Tạo token mời tạm thời lưu trong Redis (TTL 48h).
- `POST /v1/friends/accept-invite`: Chấp nhận lời mời từ QR token và tự động tạo quan hệ bạn bè 2 chiều trong bảng `friendships`.
