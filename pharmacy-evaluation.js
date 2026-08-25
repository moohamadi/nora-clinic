console.log("pharmacy-evaluation loaded");

/* =====================================
   آدرس پایه‌ی سرور
   وقتی مرحله‌ی serve کردن فایل‌های سایت از خود Node انجام شد
   و صفحات مستقیم از http://localhost:3000 باز شدن،
   کافیه این مقدار رو '' (رشته‌ی خالی) کنی تا آدرس‌ها نسبی بشن.
===================================== */
const API_BASE = '';
const SECTION = 'pharmacy';

/* =====================================
   شناسه‌ی ناشناس این مرورگر/گوشی
   یک‌بار ساخته می‌شه و توی localStorage می‌مونه تا هر رأی بعدی
   از همین دستگاه، به‌جای رأی جدید، جایگزین رأی قبلی بشه.
===================================== */
function getOrCreateVoterId() {
    let id = localStorage.getItem('nora_voter_id');
    if (!id) {
        id = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'v-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        localStorage.setItem('nora_voter_id', id);
    }
    return id;
}

const VOTER_ID = getOrCreateVoterId();

/* =====================================
   اطلاعات پرسنل داروخانه (۱ داروساز + ۳ تکنسین)
   (فعلاً خالیه — بعداً با اطلاعات واقعی پر می‌شه)
===================================== */

const pharmacyStaff = [
    {
        id: 1,
        name: "دکتر مهران نظافتی",
        role: "دکتر داروساز",
        image: "images/pharmcy/مهران نظافتی 3.png",
        graduation: " دکترای حرفه ای داروسازی",
        university: "",
        experience: "",
        licenseCode: ""
    }

    // بقیه‌ی پرسنل (۳ تکنسین) بعداً همینجا اضافه می‌شن، مثلاً:
    // {
    //     id: 2,
    //     name: "...",
    //     role: "تکنسین داروخانه",
    //     image: "images/pharmacy/....png",
    //     graduation: "۱۳۹۲",
    //     university: "...",
    //     experience: "...",
    //     licenseCode: "..."
    // }
];

/* =====================================
   وضعیت فعلی (پرسنل انتخاب‌شده)
===================================== */

let selectedPharmacyId = pharmacyStaff.length > 0 ? pharmacyStaff[0].id : null;

/* =====================================
   کش محلی امتیازها (از سرور خونده می‌شه)
   ساختار: { "شناسه‌ی پرسنل": [ {accuracy: 5, guidance: 4, ...}, ... ] }
===================================== */

let ratingsCache = {};

async function fetchRatingsFromServer() {
    try {
        const res = await fetch(`${API_BASE}/rating`);
        const data = await res.json();
        ratingsCache = data[SECTION] || {};
    } catch (err) {
        console.error('خطا در دریافت امتیازها از سرور:', err);
        ratingsCache = {};
    }
}

async function submitRatingToServer(staffId, ratings) {
    const res = await fetch(`${API_BASE}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: SECTION, id: staffId, voterId: VOTER_ID, ratings })
    });

    if (!res.ok) {
        const errBody = await res.json().catch(function () { return {}; });
        throw new Error(errBody.error || 'ثبت امتیاز با خطا مواجه شد.');
    }

    const key = String(staffId);
    if (!ratingsCache[key]) {
        ratingsCache[key] = {};
    }
    ratingsCache[key][VOTER_ID] = ratings;
}

/* آیا همین مرورگر قبلاً به این نفر امتیاز داده؟ اگر آره، همون امتیاز رو برمی‌گردونه */
function getMyPharmacyRating(staffId) {
    const entry = ratingsCache[String(staffId)];
    return entry ? (entry[VOTER_ID] || null) : null;
}

/* =====================================
   نمایش اطلاعات پرسنل در پنل سمت چپ
===================================== */

function renderPharmacyInfo(staff) {
    const nameEl = document.getElementById('selectedPharmacyName');
    const roleEl = document.getElementById('selectedPharmacyRole');
    const photoEl = document.getElementById('selectedPharmacyImage');
    const graduationEl = document.getElementById('selectedPharmacyGraduation');
    const universityEl = document.getElementById('selectedPharmacyUniversity');
    const experienceEl = document.getElementById('selectedPharmacyExperience');
    const licenseCodeEl = document.getElementById('selectedPharmacyLicenseCode');

    if (!staff) {
        if (nameEl) nameEl.textContent = 'هنوز پرسنلی ثبت نشده';
        if (roleEl) roleEl.textContent = '—';
        if (photoEl) { photoEl.src = ''; photoEl.alt = ''; }
        if (graduationEl) graduationEl.textContent = '—';
        if (universityEl) universityEl.textContent = '—';
        if (experienceEl) experienceEl.textContent = '—';
        if (licenseCodeEl) licenseCodeEl.textContent = '—';
        renderPharmacyAverageCard(null);
        return;
    }

    if (nameEl) nameEl.textContent = staff.name;
    if (roleEl) roleEl.textContent = staff.role;
    if (photoEl) {
        photoEl.src = staff.image;
        photoEl.alt = staff.name;
    }
    if (graduationEl) graduationEl.textContent = staff.graduation;
    if (universityEl) universityEl.textContent = staff.university;
    if (experienceEl) experienceEl.textContent = staff.experience;
    if (licenseCodeEl) licenseCodeEl.textContent = staff.licenseCode;

    renderPharmacyAverageCard(staff.id);
}

/* =====================================
   ساخت لیست پرسنل در سایدبار راست
===================================== */

const INITIAL_PHARMACY_COUNT = 5;
let showingAllPharmacyStaff = false;

function renderPharmacyList(filteredStaff) {
    const listEl = document.getElementById('pharmacyList');
    if (!listEl) return;

    let list;
    if (filteredStaff) {
        list = filteredStaff;
    } else if (showingAllPharmacyStaff) {
        list = pharmacyStaff;
    } else {
        list = pharmacyStaff.slice(0, INITIAL_PHARMACY_COUNT);
    }

    listEl.innerHTML = '';

    if (list.length === 0) {
        listEl.innerHTML = '<p style="font-size:13px; color:#7b8586; text-align:center; padding:10px;">هنوز پرسنلی اضافه نشده است.</p>';
        return;
    }

    list.forEach(function (staff) {
        const item = document.createElement('div');
        item.className = 'doctor-select-item';
        item.dataset.staffId = staff.id;

        const isSelected = staff.id === selectedPharmacyId;
        if (isSelected) {
            item.classList.add('active');
        }

        const avgResult = getPharmacyAverage(staff.id);
        const avgLabel = avgResult ? `★ ${avgResult.average}` : '';

        item.innerHTML = `
            <img src="${staff.image}" alt="${staff.name}">
            <div class="doctor-select-info">
                <strong>${staff.name}</strong>

<span>${staff.role}${avgLabel ? ' · ' + avgLabel : ''}</span>
            </div>
            ${isSelected
                ? '<span class="doctor-check">✓</span>'
                : '<span class="doctor-arrow">‹</span>'}
        `;

        item.addEventListener('click', function () {
            selectPharmacyStaff(staff.id);
        });

        listEl.appendChild(item);
    });
}

/* =====================================
   انتخاب یک نفر از پرسنل (از روی کلیک در لیست)
===================================== */

function selectPharmacyStaff(staffId) {
    const staff = pharmacyStaff.find(function (s) { return s.id === staffId; });
    if (!staff) return;

    selectedPharmacyId = staffId;

    renderPharmacyInfo(staff);
    renderPharmacyList();
    updateVotingUI(staffId);
}

/* =====================================
   جستجو بر اساس نام
===================================== */

function initPharmacySearch() {
    const searchEl = document.getElementById('pharmacySearch');
    if (!searchEl) return;

    searchEl.addEventListener('input', function () {
        const query = searchEl.value.trim();
        const filtered = pharmacyStaff.filter(function (s) {
            return s.name.indexOf(query) !== -1;
        });
        renderPharmacyList(filtered);
    });
}

/* =====================================
   دکمه مشاهده همه پرسنل داروخانه
===================================== */

function initAllPharmacyButton() {
    const btn = document.querySelector('.all-doctors-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        showingAllPharmacyStaff = !showingAllPharmacyStaff;
        renderPharmacyList();

        btn.innerHTML = showingAllPharmacyStaff
            ? '<span>‹</span> نمایش کمتر'
            : '<span>♧</span> مشاهده همه پرسنل داروخانه';
    });
}

/* =====================================
   منطق امتیازدهی ستاره‌ای
===================================== */

let starsLocked = false;

function initStarRatings() {
    document.querySelectorAll('.star-group').forEach(function (group) {
        const stars = Array.from(group.querySelectorAll('button'));
        if (!group.dataset.rating) {
            group.dataset.rating = 0;
        }

        stars.forEach(function (star, index) {
            const value = index + 1;

            star.addEventListener('mouseenter', function () {
                if (starsLocked) return;
                highlight(stars, value, 'hover');
            });

            star.addEventListener('click', function () {
                if (starsLocked) return;
                group.dataset.rating = value;
                highlight(stars, value, 'active');
            });
        });

        group.addEventListener('mouseleave', function () {
            if (starsLocked) return;
            stars.forEach(function (s) { s.classList.remove('hover'); });
        });
    });
}

function highlight(stars, value, className) {
    stars.forEach(function (star, i) {
        star.classList.toggle(className, i < value);
    });
}

function resetAllStars() {
    document.querySelectorAll('.star-group').forEach(function (group) {
        group.dataset.rating = 0;
        group.querySelectorAll('button').forEach(function (star) {
            star.classList.remove('active', 'hover');
        });
    });
}

/* =====================================
   جمع‌آوری امتیازها هنگام ثبت ارزیابی
===================================== */

function collectRatings() {
    const ratings = {};
    document.querySelectorAll('.rating-stars').forEach(function (group) {
        const category = group.dataset.category;
        const starGroup = group.querySelector('.star-group');
        ratings[category] = starGroup ? Number(starGroup.dataset.rating) : 0;
    });
    return ratings;
}

/* میانگین ساده (برای نمایش کنار اسم توی لیست) */
function getPharmacyAverage(staffId) {
    const evaluations = Object.values(ratingsCache[String(staffId)] || {});
    if (evaluations.length === 0) return null;

    let total = 0;
    let count = 0;

    evaluations.forEach(function (evaluation) {
        Object.values(evaluation).forEach(function (value) {
            if (typeof value === 'number' && value > 0) {
                total += value;
                count++;
            }
        });
    });

    if (count === 0) return null;

    return {
        average: (total / count).toFixed(1),
        evaluationsCount: evaluations.length
    };
}

/* تفکیک بر اساس تعداد ستاره (برای کارت میانگین + نمودار میله‌ای) */
function getPharmacyBreakdown(staffId) {
    const evaluations = Object.values(ratingsCache[String(staffId)] || {});

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalOverall = 0;
    let ratedCount = 0;

    evaluations.forEach(function (evaluation) {
        const values = Object.values(evaluation).filter(function (v) {
            return typeof v === 'number' && v > 0;
        });
        if (values.length === 0) return;

        const evalAverage = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
        const rounded = Math.min(5, Math.max(1, Math.round(evalAverage)));

        counts[rounded]++;
        totalOverall += evalAverage;
        ratedCount++;
    });

    return {
        average: ratedCount > 0 ? (totalOverall / ratedCount).toFixed(1) : '0',
        totalCount: ratedCount,
        counts: counts
    };
}

function renderPharmacyAverageCard(staffId) {
    const circleEl = document.getElementById('averageCircleProgress');
    const numberEl = document.getElementById('averageScoreNumber');
    const starsEl = document.getElementById('averageStarsDisplay');
    const countEl = document.getElementById('averageReviewCount');
    const breakdownEl = document.getElementById('averageBreakdown');

    if (!circleEl || !numberEl || !starsEl || !countEl || !breakdownEl) return;

    const data = staffId ? getPharmacyBreakdown(staffId) : { average: '0', totalCount: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const average = Number(data.average) || 0;

    numberEl.textContent = data.average;

    const circumference = 327; // 2 * π * 52 (شعاع دایره در SVG)
    const offset = data.totalCount > 0
        ? circumference - (average / 5) * circumference
        : circumference;
    circleEl.style.strokeDashoffset = offset;

    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const starSpan = document.createElement('span');
        starSpan.textContent = '★';
        if (i <= Math.round(average)) {
            starSpan.classList.add('filled');
        }
        starsEl.appendChild(starSpan);
    }

    countEl.textContent = data.totalCount > 0
        ? `(${data.totalCount} نظر ثبت شده)`
        : 'هنوز نظری ثبت نشده';

    breakdownEl.innerHTML = '';
    for (let star = 5; star >= 1; star--) {
        const count = data.counts[star];
        const percent = data.totalCount > 0 ? (count / data.totalCount) * 100 : 0;

        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
            <span class="breakdown-label">${star} ستاره</span>
            <span class="breakdown-bar-track">
                <span class="breakdown-bar-fill" style="width: ${percent}%"></span>
            </span>
            <span class="breakdown-count">${count}</span>
        `;
        breakdownEl.appendChild(row);
    }
}

/* =====================================
   وضعیت «قبل از ثبت / بعد از ثبت» طبق رأی همین مرورگر
===================================== */

function getOrCreateEditButton() {
    let editBtn = document.querySelector('.edit-evaluation-btn');
    const submitBtn = document.querySelector('.submit-evaluation');
    if (!editBtn && submitBtn) {
        editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'edit-evaluation-btn';
        editBtn.innerHTML = '✏️ ویرایش ارزیابی';
        editBtn.style.cssText = 'display:none;margin-inline-start:10px;background:#fff;border:1.5px solid #999;border-radius:10px;padding:9px 16px;font-size:14px;font-weight:600;color:#333;cursor:pointer;';
        submitBtn.parentNode.insertBefore(editBtn, submitBtn.nextSibling);

        editBtn.addEventListener('click', function () {
            starsLocked = false;
            document.querySelectorAll('.star-group button').forEach(function (s) {
                s.style.pointerEvents = '';
            });
            submitBtn.style.display = '';
            editBtn.style.display = 'none';
        });
    }
    return editBtn;
}

function updateVotingUI(staffId) {
    const submitBtn = document.querySelector('.submit-evaluation');
    const editBtn = getOrCreateEditButton();
    const myRating = staffId ? getMyPharmacyRating(staffId) : null;

    if (myRating) {
        starsLocked = true;

        document.querySelectorAll('.rating-stars').forEach(function (group) {
            const category = group.dataset.category;
            const starGroup = group.querySelector('.star-group');
            if (!starGroup) return;

            const value = myRating[category] || 0;
            const stars = Array.from(starGroup.querySelectorAll('button'));
            starGroup.dataset.rating = value;
            highlight(stars, value, 'active');
            stars.forEach(function (s) { s.style.pointerEvents = 'none'; });
        });

        if (submitBtn) submitBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = 'inline-block';
    } else {
        starsLocked = false;
        resetAllStars();
        document.querySelectorAll('.star-group button').forEach(function (s) {
            s.style.pointerEvents = '';
        });

        if (submitBtn) submitBtn.style.display = '';
        if (editBtn) editBtn.style.display = 'none';
    }
}

/* =====================================
   دکمه ثبت ارزیابی
===================================== */

function initSubmitButton() {
    const submitBtn = document.querySelector('.submit-evaluation');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async function () {
        if (!selectedPharmacyId) {
            alert('لطفاً ابتدا یکی از پرسنل داروخانه را انتخاب کنید.');
            return;
        }

        const ratings = collectRatings();

        submitBtn.disabled = true;
        try {
            await submitRatingToServer(selectedPharmacyId, ratings);
            renderPharmacyAverageCard(selectedPharmacyId);
            renderPharmacyList();
            updateVotingUI(selectedPharmacyId);
            alert('ارزیابی شما با موفقیت ثبت شد. سپاسگزاریم!');
        } catch (err) {
            alert('خطا در ثبت ارزیابی: ' + err.message);
        } finally {
            submitBtn.disabled = false;
        }
    });
}

/* =====================================
   شروع اجرای برنامه
===================================== */

document.addEventListener('DOMContentLoaded', async function () {
    const firstStaff = pharmacyStaff.length > 0 ? pharmacyStaff[0] : null;
    selectedPharmacyId = firstStaff ? firstStaff.id : null;

    await fetchRatingsFromServer();

    renderPharmacyInfo(firstStaff);
    renderPharmacyList();
    initPharmacySearch();
    initAllPharmacyButton();
    initStarRatings();
    initSubmitButton();
    updateVotingUI(selectedPharmacyId);
});
