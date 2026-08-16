# Tiny Win — Mobile Native Widgets & Advanced Features (Giai Đoạn 3)

**Author:** Lead Mobile Engineer  
**Stack:** React Native / Expo + SwiftUI (WidgetKit) + Jetpack Glance (Android)

---

## 1. Native iOS Widget (SwiftUI / WidgetKit)

### Mã nguồn mẫu `TinyWinWidget.swift`:
```swift
import WidgetKit
import SwiftUI

struct TinyWinEntry: TimelineEntry {
    let date: Date
    let hasPosted: Bool
    let content: String
    let streak: Int
}

struct TinyWinWidgetView : View {
    var entry: TinyWinEntry

    var body: some View {
        ZStack {
            Color(hex: "#1A1A1E")
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("✨ Tiny Win")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Spacer()
                    if entry.hasPosted {
                        Text("🔥 \(entry.streak)")
                            .font(.caption).bold()
                            .foregroundColor(.orange)
                    }
                }
                
                if entry.hasPosted {
                    Text(entry.content)
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .lineLimit(3)
                } else {
                    Text("Hôm nay của bạn có gì vui?")
                        .font(.footnote)
                        .foregroundColor(.white)
                    Text("Chạm để ghi lại ✍️")
                        .font(.caption2)
                        .foregroundColor(Color(hex: "#10B981"))
                }
            }
            .padding()
        }
    }
}
```

---

## 2. Native Android Widget (Jetpack Glance / Kotlin)

### Mã nguồn mẫu `TinyWinGlanceWidget.kt`:
```kotlin
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.layout.*
import androidx.glance.text.*
import androidx.glance.unit.ColorProvider

class TinyWinGlanceWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            Column(
                modifier = GlanceModifier.fillMaxSize().background(ColorProvider(0xFF1A1A1E.toInt())).padding(12.dp)
            ) {
                Text(text = "✨ Tiny Win", style = TextStyle(color = ColorProvider(0xFF9E9E9E.toInt())))
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(text = "Hôm nay của bạn thế nào? Đăng ngay!", style = TextStyle(color = ColorProvider(0xFFFFFFFF.toInt())))
            }
        }
    }
}
```
