# Test Cases Matrix - Tiny Win (Functionality, Security, Performance & Edge Cases)

This document details the test matrix for both the Backend API and the Mobile App of the Tiny Win application. It covers functional features, security verification, performance checks, and critical edge cases (including timezone manipulation, double posting, and reaction spamming).

## 1. Feature Coverage Matrix

| ID | Component | Feature / Flow | Test Scenario | Input Data | Expected Result | Category |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | Backend | Authentication | Register with valid details | `email`, `password` (>=8 chars), `display_name`, `timezone` | `201 Created` with JWT access token and user info | Functionality |
| **TC-002** | Backend | Authentication | Register with duplicate email | Existing `email` | `409 Conflict`, "Email is already registered" | Functionality |
| **TC-003** | Backend | Authentication | Register with invalid timezone | `timezone: "Invalid/Zone"` | `422 Unprocessable Entity` | Edge Case |
| **TC-004** | Backend | Authentication | Login with valid credentials | Matching `email` & `password` | `200 OK` with JWT access token | Functionality |
| **TC-005** | Backend | Authentication | Login with incorrect password | Matching `email`, incorrect `password` | `401 Unauthorized`, "Invalid email or password" | Security |
| **TC-006** | Backend | Profile | Access profile via `/auth/me` | Valid Authorization header | `200 OK` with matching user profile | Security |
| **TC-007** | Backend | Profile | Access profile without token | Missing or invalid Bearer token | `401 Unauthorized`, "Invalid or expired access token" | Security |
| **TC-008** | Backend | Profile | Update profile display name & timezone | New `display_name`, `timezone` | `200 OK` with updated values in response | Functionality |
| **TC-009** | Backend | Profile | Update profile with blank display name | `display_name: "   "` | `422 Unprocessable Entity` or validation error | Security |
| **TC-010** | Backend | Posts | Create post successfully | Content (<=120 chars) | `201 Created`, post saved, `local_post_date` calculated | Functionality |
| **TC-011** | Backend | Posts | Create post with content exceeding limit | Content (>3000 chars or >120 chars client-side) | `422 Unprocessable Entity` or blocked | Functionality |
| **TC-012** | Backend | Posts | Double posting on same local day | Send 2nd post request for the same day | `409 Conflict`, "You have already posted for your local day" | Edge Case |
| **TC-013** | Backend | Posts | Post creation timezone boundary | Post at 23:59 and then at 00:01 next day | First post succeeds. Second post succeeds (different local dates) | Edge Case |
| **TC-014** | Backend | Posts | Timezone transition check (advance) | User changes timezone from UTC (say 23:00 Nov 1) to Asia/HCM (+7, making it 06:00 Nov 2). Then posts. | Post is assigned `local_post_date = 202X-11-02`. Succeeds. | Edge Case |
| **TC-015** | Backend | Posts | Timezone transition check (delay) | User posts in Asia/HCM (Nov 2). Changes timezone to US/Pacific (where it is still Nov 1). Posts again. | Allowed since `local_post_date` for US/Pacific is Nov 1. Total 2 posts in UTC day, but 1 post per local day. | Edge Case |
| **TC-016** | Backend | Posts | Timezone shift double-posting exploit | User posts on Nov 2 in Asia/HCM. Changes timezone back to US/Pacific (Nov 1) and posts. Then timezone moves to Nov 2 in US/Pacific, posts again. | Allowed as long as each post corresponds to a unique `local_post_date` for the author's then-current timezone. DB constraint `uq_posts_author_local_post_date` must not be violated. | Edge Case |
| **TC-017** | Backend | Feed | Access feed when locked (not posted today) | Get feed before posting | `200 OK`