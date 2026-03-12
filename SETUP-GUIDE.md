# 🚀 دليل التشغيل على GitHub

## الخطوة 1: إنشاء Repository

1. ادخل على [github.com/new](https://github.com/new)
2. اسم الريبو: `ordo` (أو أي اسم تحبه)
3. اختار **Private** (عشان الكود مش public)
4. اضغط **Create repository**

---

## الخطوة 2: رفع الملفات

### الطريقة السهلة (من المتصفح):
1. افتح الريبو اللي عملته
2. اضغط **"uploading an existing file"**
3. اسحب مجلد `ordo` كامل وارميه
4. اضغط **Commit changes**

### الطريقة الاحترافية (من Terminal):
```bash
# ادخل مجلد المشروع
cd ordo

# هيئ Git
git init
git branch -M main

# أضف كل الملفات
git add .
git commit -m "Initial commit - Ordo structured project"

# اربط بالريبو على GitHub
git remote add origin https://github.com/USERNAME/ordo.git

# ارفع
git push -u origin main
```
> غيّر `USERNAME` باسم حسابك على GitHub

---

## الخطوة 3: تفعيل GitHub Pages

1. ادخل **Settings** في الريبو
2. من القائمة الجانبية اضغط **Pages**
3. تحت **Source** اختار: **GitHub Actions**
4. الـ workflow اللي في `.github/workflows/deploy.yml` هيشتغل تلقائي

---

## الخطوة 4: الموقع شغال! 🎉

بعد دقيقة أو اتنين، الموقع هيكون متاح على:
```
https://USERNAME.github.io/ordo/
```

### الصفحات المتاحة:
| الصفحة | الرابط |
|--------|--------|
| الرئيسية | `/ordo/` |
| لوحة الإدارة | `/ordo/pages/admin.html` |
| المتجر | `/ordo/pages/store.html` |
| بوابة العميل | `/ordo/pages/client-portal.html` |
| عرض السعر | `/ordo/pages/proposal.html` |
| التقييم | `/ordo/pages/review.html` |

---

## 🔄 تحديث الموقع

أي تعديل بعد كده:
```bash
git add .
git commit -m "وصف التعديل"
git push
```
GitHub Pages هيتحدث تلقائي خلال دقيقة.

---

## ⚡ تشغيل محلي (للتطوير)

### الطريقة 1: VS Code Live Server
1. افتح المشروع في VS Code
2. ثبّت إضافة **Live Server**
3. اضغط كليك يمين على `index.html` → **Open with Live Server**

### الطريقة 2: Python
```bash
cd ordo
python3 -m http.server 8080
# افتح http://localhost:8080
```

### الطريقة 3: Node.js
```bash
npx serve .
# أو
npx http-server .
```

> ⚠️ **مهم:** لازم تشغل سيرفر محلي. فتح `index.html` مباشر من الملفات مش هيشتغل لأن المتصفح بيمنع تحميل ملفات JS خارجية لأسباب أمنية (CORS).

---

## 🔒 ملاحظات أمان

- مفاتيح Supabase (`SUPA_ANON`) موجودة في `js/core/supabase-config.js`
- ده **Anon Key** وهو مصمم يكون في الـ client-side
- الحماية الحقيقية بتكون من **Row Level Security (RLS)** في Supabase
- لو الريبو **Private**، المفاتيح دي آمنة
- لو حبيت تخليه **Public**، الـ anon key مش مشكلة طالما RLS مفعّل

---

## 📁 هيكل الملفات
```
ordo/
├── .github/workflows/deploy.yml  ← GitHub Pages auto-deploy
├── .gitignore
├── index.html                    ← الصفحة الرئيسية
├── README.md                     ← توثيق المشروع
├── SETUP-GUIDE.md               ← هذا الدليل
├── css/                          ← الأنماط
├── js/
│   ├── core/                     ← النواة
│   ├── pages/                    ← الصفحات
│   ├── modules/                  ← الوحدات
│   └── utils/                    ← أدوات
└── pages/                        ← صفحات مستقلة
```
