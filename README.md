# Ordo - نظام إدارة الأعمال المتكامل

## 🏗️ هيكل المشروع

```
ordo/
├── index.html                      # الصفحة الرئيسية (4,564 سطر)
├── README.md                       # هذا الملف
│
├── css/                            # ملفات الأنماط (1,550 سطر)
│   ├── variables-and-base.css      # المتغيرات الأساسية + CSS Reset
│   ├── components.css              # مكونات UI (أزرار، كروت، مودالات)
│   ├── layout.css                  # تخطيط الصفحة + Responsive
│   ├── quill-custom.css            # أنماط محرر النصوص Quill
│   └── toast.css                   # إشعارات Toast
│
├── js/
│   ├── core/                       # النواة الأساسية (4,803 سطر)
│   │   ├── supabase-config.js      # إعدادات Supabase + نظام الحفظ السحابي
│   │   ├── state-and-nav.js        # حالة التطبيق + التنقل + Trial System
│   │   ├── helpers-and-settings.js # دوال مساعدة + إعدادات النظام
│   │   ├── dashboard-auth.js       # لوحة التحكم + نظام المصادقة
│   │   ├── auth-state.js           # حالة المصادقة + Dashboard extras
│   │   ├── theme-platform.js       # مزامنة الثيم + إعدادات المنصة
│   │   ├── init-offline.js         # كشف حالة الإنترنت
│   │   └── init-theme.js           # تهيئة الثيم عند التحميل
│   │
│   ├── pages/                      # صفحات التطبيق (12,084 سطر)
│   │   ├── tasks.js                # إدارة المهام + Theme + Auto-fill
│   │   ├── clients.js              # قاعدة العملاء + كشوفات الحساب
│   │   ├── finance.js              # الحسابات المالية
│   │   ├── finance-stats.js        # إحصائيات مالية + خزنة الحسابات
│   │   ├── invoices.js             # الفواتير + PDF Export
│   │   ├── projects.js             # إدارة المشاريع
│   │   ├── teams.js                # فريق العمل + الاشتراكات
│   │   ├── services.js             # نظام الخدمات الكامل
│   │   ├── meetings.js             # إدارة الاجتماعات
│   │   ├── courses.js              # الدورات والتعلم
│   │   ├── goals-schedule.js       # الأهداف + الجدول اليومي
│   │   ├── reviews.js              # التقييمات
│   │   ├── support.js              # نظام الدعم
│   │   ├── client-portal.js        # بوابة العميل
│   │   └── proposals-vault.js      # عروض الأسعار
│   │
│   ├── modules/                    # وحدات إضافية (9,175 سطر)
│   │   ├── task-comments.js        # نظام التعليقات على المهام
│   │   ├── task-statuses-wallets.js# حالات مخصصة + المحافظ
│   │   ├── task-time-tracking.js   # تتبع وقت المهام
│   │   ├── kanban-and-socials.js   # Kanban + روابط التواصل
│   │   ├── backup-and-init.js      # نظام النسخ الاحتياطي
│   │   ├── features-updates.js     # الميزات والتحديثات
│   │   ├── finance-extras.js       # إضافات مالية
│   │   ├── notifications-inbox.js  # الإشعارات + صندوق الوارد
│   │   ├── admin-functions.js      # وظائف الإدارة
│   │   ├── archive-tracking-status.js # الأرشفة + التتبع + حالات
│   │   ├── patches-enhancements.js # تحسينات ورقع
│   │   ├── receipt-team-invite.js  # إيصالات + دعوات الفريق
│   │   ├── team-membership.js      # عضوية الفريق
│   │   └── loans-budgets.js        # القروض والميزانيات
│   │
│   └── utils/                      # أدوات مساعدة
│       └── qr-handler.js           # معالج QR Code
│
└── pages/                          # صفحات مستقلة
    ├── admin.html                  # لوحة الإدارة (6,608 سطر)
    ├── store.html                  # متجر الخدمات (1,232 سطر)
    ├── client-portal.html          # بوابة العميل (2,338 سطر)
    ├── proposal.html               # عرض السعر (750 سطر)
    └── review.html                 # صفحة التقييم (477 سطر)
```

## 📊 ملخص الأرقام

| القسم | عدد الملفات | عدد الأسطر |
|-------|-------------|------------|
| CSS | 5 | 1,550 |
| JS Core | 8 | 4,803 |
| JS Pages | 15 | 12,084 |
| JS Modules | 14 | 9,175 |
| JS Utils | 1 | 59 |
| index.html | 1 | 4,564 |
| صفحات مستقلة | 5 | 11,405 |
| **الإجمالي** | **49** | **~43,640** |

## 🔧 التقنيات المستخدمة

- **Backend**: Supabase (Auth + Database + Storage)
- **Frontend**: Vanilla JS + Cairo Font
- **Icons**: Font Awesome 6.5
- **Editor**: Quill.js
- **QR**: qrcode.js
- **Encryption**: Web Crypto API (AES-256-GCM للخزنة)

## 🚀 ترتيب تحميل الملفات

1. Anti-flash script (inline)
2. CSS files
3. Supabase SDK + Config
4. QR + Quill libraries
5. Init scripts (offline + theme)
6. HTML Body + Modals
7. Core JS (state → nav → helpers → auth)
8. Page JS files
9. Module JS files
