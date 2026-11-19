# AMJO — Amman-Jordan Global Auto Auctions
# أمجـو — مزادات عمّان الأردن العالمية للسيارات

**Enterprise Bilingual (AR/EN) & Multi-Currency Global Public Vehicle Auction Platform**  
**منصة مزادات السيارات العالمية ثنائية اللغة (عربي / إنجليزي) ومتعددة العملات بمستوى مؤسسي**

---

## English Documentation

### 1. Project Overview
**AMJO (Amman-Jordan Global Auto Auctions)** is an enterprise-grade, static-deployment-ready global automotive exchange and live auction platform headquartered in Amman, Jordan, connecting international hubs across Zarqa Free Zone, Dubai, Stuttgart, Munich, Houston, Seoul, and London.

Designed with a luxury Midnight Obsidian and Metallic Gold aesthetic (with an instant Light Mode toggle), AMJO delivers instant **English (LTR) / Arabic (RTL)** localization, real-time multi-currency pricing, institutional escrow safeguards, and a complete end-to-end bidding, inspection, and customs clearance workflow.

---

### 2. Core Features

- **Live Auction Room & Anti-Sniping Engine:**
  - Real-time countdown timers (Days, Hours, Minutes, Seconds) with automated **anti-sniping protection** (+2 minutes automatic extension whenever a bid is placed within the final 30 seconds).
  - **Proxy / Auto-Bid Engine:** Confidential maximum bid ceiling that automatically counter-bids in minimum dynamic increments on the user's behalf.
  - **Buy It Now & Make an Offer:** Instant purchase settlement and binding direct-offer workflows alongside live bidding.
  - **Live Global Bid Ledger:** Real-time anonymized international bidder activity feed (`Bidder_JO***`, `Bidder_AE***`, `Bidder_DE***`, `Bidder_US***`) with rival-bid simulation controls.

- **150-Point Digital Diagnostics & Interactive 360° Gallery:**
  - Interactive media viewer with category tabs (**Exterior**, **Interior**, **Engine Bay**, **Undercarriage**, **Damage Close-ups**), **360° turntable angle scrubbing**, **2x zoom loupe**, and synthesized **Engine Cold-Start Audio**.
  - **Verified VIN Decoder & History Report:** Title status, odometer authenticity verification, accident records, service history, open recalls, and manufacturing plant metadata.
  - **150-Point Inspection Dossier:** Expandable engineering checklist covering Engine, Transmission, Hybrid/EV Battery State of Health (`SOH %`), Laser Chassis Symmetry, Electronics, and **Ultrasonic Paint Thickness Readings (µm)**.

- **Total Landed Cost & Jordan Customs Estimator:**
  - Real-time calculator estimating Winning Bid + AMJO Buyer Fee + International & Port Freight + Marine Cargo Insurance + Estimated Customs & Clearance Duties.
  - Pre-configured regional clearance presets: **Zarqa Free Zone (Transit / Bonded)**, **Amman Customs — Electric (EV)**, **Amman Customs — Hybrid**, **Amman Customs — Petrol**, and **GCC / Dubai Re-Export**.

- **Global Multi-Currency Engine:**
  - Instant currency conversion and locale-aware formatting across **8 currencies**: `JOD`, `USD`, `EUR`, `SAR`, `AED`, `KWD`, `GBP`, and `JPY` with admin-configurable live FX overrides.

- **Role-Based Workspaces (Buyer, Seller, Admin):**
  - **Buyer Desk:** Active Bids, Watchlist, Won Vehicles & Invoices, 5-stage Global Delivery & Customs Tracker, and Escrow Security Deposit Wallet (`10x` authorized bidding power).
  - **Seller / Dealer Portal:** 3-step consignment wizard with VIN auto-fill, photo upload dropzone, reserve/Buy-It-Now configuration, and consigned listing tracker.
  - **Admin Command Center:** Platform GMV & Escrow KPIs, Auction Approval Queue, Live Bid Moderation (flag/void), KYC Verification Panel, and live Commission & FX Rate configuration.

- **Enterprise Security & Compliance Architecture:**
  - Strict client-side **XSS input sanitization**, **CSRF token** validation on bidding and financial forms, and sliding-window **rate-limiting** protection against rapid-click abuse.
  - Multi-step **KYC Identity & Deposit Verification** gate for high-value bids (`>$25,000 USD`), **Two-Factor Authentication (2FA)** TOTP configuration modal, and bilingual **Escrow, AML & Terms of Auction** governance disclosures.

---

### 3. Tech Stack
- **Frontend Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite (configured with `base: './'` and hash routing for zero-404 GitHub Pages deployment)
- **Styling:** Tailwind CSS v4 (`@custom-variant dark`)
- **Icons:** Lucide React (`lucide-react`)

---

### 4. Local Setup & Build Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (http://localhost:3000)
npm run dev

# 3. Build production bundle into ./dist
npm run build
```

---

### 5. Credits & Intellectual Property
This project was architected and developed by **Kareem Khaleel (كريم علي مصطفى خليل)**, Founder & General Manager of **Special MarK Co. (مؤسسة العلامة المميزة لتطوير الأعمال وتكنولوجيا المعلومات)**.

© 2026 **Kareem Khaleel — Special MarK Co.** All rights reserved. Unauthorized reproduction, redistribution, or commercial white-labeling without explicit written authorization is strictly prohibited.

---

<div dir="rtl">

## التوثيق باللغة العربية

### 1. نظرة عامة على المشروع
منصة **أمجـو (AMJO — مزادات عمّان الأردن العالمية للسيارات)** هي منصة مزادات سيارات عالمية بمستوى مؤسسي، ثنائية اللغة بالكامل (**العربية RTL / الإنجليزية LTR**) ومتعددة العملات، تتخذ من عمّان — الأردن مقراً رئيسياً وتربط مراكز التصدير والفحص الدولية في المنطقة الحرة الزرقاء، دبي، شتوتغارت، ميونخ، هيوستن، سيول، ولندن.

صُممت المنصة بهوية بصرية فاخرة تجمع بين ثيم الأوبسيديان الداكن واللمسات الذهبية المعدنية (مع إمكانية التبديل الفوري إلى الوضع النهاري)، وتوفر تجربة متكاملة للمزايدة المباشرة، الفحص الهندسي الرقمي، وحساب التكاليف الجمركية الواصلة.

---

### 2. المزايا الأساسية

- **قاعة المزاد المباشر ونظام منع القنص (Anti-Sniping):**
  - عدادات وقت تنازلية لحظية (أيام، ساعات، دقائق، ثوانٍ) مزودة بنظام **منع القنص التلقائي** الذي يمدد وقت الإغلاق دقيقتين تلقائياً عند ورود أي مزايدة خلال آخر 30 ثانية.
  - **المزايدة التلقائية بالوكالة (Proxy Auto-Bid):** تحديد سقف سري للمزايدة يقوم النظام من خلاله بالمزايدة بأقل زيادة ممكنة نيابةً عنك عند تجاوز عرضك.
  - **الشراء الفوري وتقديم العروض:** خيارات "اشترِ الآن" و"تقديم عرض شراء مباشر ملزم" جنباً إلى جنب مع المزايدة الحيّة.
  - **سجل المزايدات العالمي المباشر:** بث حيّ للمزايدين الدوليين بهوية مشفرة (`Bidder_JO***`, `Bidder_AE***`, `Bidder_DE***`) مع أداة محاكاة المزايدة المنافسة.

- **تقرير الفحص الرقمي (150 نقطة) ومعرض 360° التفاعلي:**
  - معرض صور تفاعلي يشمل تبويبات (**الهيكل الخارجي، المقصورة، غرفة المحرك، أسفل المركبة، تفاصيل الأضرار**)، بالإضافة إلى **منصة دوران 360°**، **عدسة تكبير 2x**، ومشغل **صوت تشغيل المحرك البارد**.
  - **فك شيفرة رقم الشاصي (VIN Decoder):** توثيق حالة الملكية (Clean / Salvage)، مطابقة العداد، سجل الحوادث، سجلات الصيانة، واستدعاءات المصنع.
  - **تقرير الفحص الهندسي من 150 نقطة:** قوائم فحص تفصيلية للمحرك، ناقل الحركة، صحة بطارية الهايبرد والكهرباء (`SOH %`)، استقامة الشاصي بالليزر، الأنظمة الإلكترونية، و**قراءات سماكة الطلاء بالميكرون (µm)**.

- **حاسبة التكلفة الواصلة والجمارك الأردنية:**
  - حاسبة فورية تقدر: سعر الرسو التقديري + عمولة المشتري + الشحن الدولي والمناولة + التأمين البحري + الرسوم الجمركية والتخليص.
  - قوالب تخليص جاهزة تشمل: **المنطقة الحرة الزرقاء (ترانزيت/حر)**، **جمارك عمّان — كهرباء (EV)**، **جمارك عمّان — هايبرد**، **جمارك عمّان — بنزين**، و**إعادة التصدير لدول الخليج / دبي**.

- **محرك العملات المتعددة العالمي:**
  - تحويل لحظي للأسعار والمزايدات والمحافظ المالية عبر **8 عملات عالمية**: الدينار الأردني (`JOD`)، الدولار الأمريكي (`USD`)، اليورو (`EUR`)، الريال السعودي (`SAR`)، الدرهم الإماراتي (`AED`)، الدينار الكويتي (`KWD`)، الجنيه الإسترليني (`GBP`)، والين الياباني (`JPY`).

- **بوابات العمل حسب الدور (المشتري، البائع، الإدارة):**
  - **لوحة المشتري:** تتبع المزايدات النشطة، قائمة المراقبة، المركبات الرابحة والفواتير، متابعة الشحن البحري والتخليص في 5 مراحل، ومحفظة التأمين المستردة (قوة شرائية بمضاعفة `10x`).
  - **بوابة البائع والمعارض:** معالج إضافة مركبة من 3 خطوات مع تعبئة تلقائية عبر رقم الشاصي (VIN)، منطقة رفع الصور، وضبط السعر الاحتياطي.
  - **مركز القيادة والإدارة:** مؤشرات الأداء الكلية (GMV والضمان)، طابور اعتماد المزادات، رقابة المزايدات، توثيق الهوية (KYC)، وإعدادات العمولات وأسعار الصرف.

- **البنية الأمنية وحوكمة الامتثال:**
  - تنقية المدخلات لمنع هجمات **XSS**، التحقق من رموز **CSRF** في كافة نماذج المزايدة والإيداع، وحماية تحديد معدل الطلبات (**Rate Limiting**).
  - بوابة توثيق الهوية والضمان المالي (**KYC**) للمزايدات الكبرى فوق `25,000 دولار`، تفعيل المصادقة الثنائية (**2FA**)، ونصوص الامتثال القانوني لمكافحة غسل الأموال وحماية الضمان (**Escrow**).

---

### 3. الحزمة التقنية (Tech Stack)
- **React 19** و **TypeScript**
- **Vite** (مهيأ بمسارات نسبية `./` وتوجيه Hash لضمان التوافق الكامل مع GitHub Pages بدون أخطاء 404)
- **Tailwind CSS v4**
- **Lucide React**

---

### 4. التشغيل والبناء محلياً

```bash
# 1. تثبيت الحزم والاعتماديات
npm install

# 2. تشغيل بيئة التطوير المحلية
npm run dev

# 3. بناء نسخة الإنتاج النهائية في مجلد ./dist
npm run build
```

---

### 5. الحقوق الفكرية والتطوير
تم تصميم وهندسة وتطوير هذا المشروع بالكامل من قِبل **كريم علي مصطفى خليل (Kareem Khaleel)**، المؤسس والمدير العام لشركة **مؤسسة العلامة المميزة لتطوير الأعمال وتكنولوجيا المعلومات (Special MarK Co.)**.

جميع الحقوق محفوظة © 2026 **كريم علي مصطفى خليل — مؤسسة العلامة المميزة لتطوير الأعمال وتكنولوجيا المعلومات (Special MarK Co.)**. يُحظر نسخ أو إعادة توزيع أو استغلال الشيفرة البرمجية أو التصميم لأغراض تجارية دون موافقة خطية مسبقة.

</div>
