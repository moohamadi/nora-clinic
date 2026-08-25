console.log("nurse-evaluation loaded");

/* =====================================
   آدرس پایه‌ی سرور
   وقتی مرحله‌ی serve کردن فایل‌های سایت از خود Node انجام شد
   و صفحات مستقیم از http://localhost:3000 باز شدن،
   کافیه این مقدار رو '' (رشته‌ی خالی) کنی تا آدرس‌ها نسبی بشن.
===================================== */
const API_BASE = 'http://localhost:3000';
const SECTION = 'nurses';

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
   اطلاعات پرستاران درمانگاه نورا
   (سال فارغ‌التحصیلی، سابقه و شماره نظام فعلاً تقریبی/تصادفی‌اند —
   بعداً باید از خودشون پرسیده و اصلاح بشن)
===================================== */

const nurses = [
    {
        id: 1,
        name: "مهسا کرمی",
        specialty: "پرستار عمومی",
        image: "images/nurses/مهسا کرمی.png",
        graduation: "۱403",
        university: "دانشگاه علوم پزشکی خرم‌آباد",
        experience: " 2 سال",
        licenseCode: "۲۳۴۵۶"
    },
    {
        id: 2,
        name: "راضیه عالی‌نژاد",
        specialty: "پرستار عمومی",
        image: "images/nurses/راضیه عالی‌نژاد.png",
        graduation: "۱۳۹۲",
        university: "دانشگاه علوم پزشکی خرم‌آباد",
        experience: "1 سال",
        licenseCode: "۱۹۸۷۶"
    },
    {
        id: 3,
        name: "محدثه سهیلی",
        specialty: "پرستار عمومی",
        image: "images/nurses/محدثه سهیلی.png",
        graduation: "۱۳۹۷",
        university: "دانشگاه علوم پزشکی خرم‌آباد",
        experience: "۴ سال",
        licenseCode: "۲۲۱۱۰"
    },
    {
        id: 4,
        name: "محمد عصمتی",
        specialty: "پرستار عمومی",
        image: "images/nurse/محمد عصمتی.jpg",
        graduation: "۱۳۹۳",
        university: "دانشگاه علوم پزشکی خرم‌آباد",
        experience: "۷ سال",
        licenseCode: "۲۰۵۴۳"
    }
];

/* =====================================
   وضعیت فعلی (پرستار انتخاب‌شده)
===================================== */

let selectedNurseId = nurses.length > 0 ? nurses[0].id : null;

/* =====================================
   کش محلی امتیازها (از سرور خونده می‌شه)
   ساختار: { "شناسه‌ی پرستار": [ {care: 5, skill: 4, ...}, ... ] }
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

async function submitRatingToServer(nurseId, ratings) {
    const res = await fetch(`${API_BASE}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: SECTION, id: nurseId, voterId: VOTER_ID, ratings })
    });

    if (!res.ok) {
        const errBody = await res.json().catch(function () { return {}; });
        throw new Error(errBody.error || 'ثبت امتیاز با خطا مواجه شد.');
    }

    const key = String(nurseId);
    if (!ratingsCache[key]) {
        ratingsCache[key] = {};
    }
    ratingsCache[key][VOTER_ID] = ratings;
}

/* آیا همین مرورگر قبلاً به این پرستار امتیاز داده؟ اگر آره، همون امتیاز رو برمی‌گردونه */
function getMyNurseRating(nurseId) {
    const entry = ratingsCache[String(nurseId)];
    return entry ? (entry[VOTER_ID] || null) : null;
}

/* =====================================
   نمایش اطلاعات پرستار در پنل سمت چپ
===================================== */

function renderNurseInfo(nurse) {
    const nameEl = document.getElementById('selectedNurseName');
    const specialtyEl = document.getElementById('selectedNurseSpecialty');
    const photoEl = document.getElementById('selectedNurseImage');
    const graduationEl = document.getElementById('selectedNurseGraduation');
    const universityEl = document.getElementById('selectedNurseUniversity');
    const experienceEl = document.getElementById('selectedNurseExperience');
    const licenseCodeEl = document.getElementById('selectedNurseLicenseCode');

    if (!nurse) {
        if (nameEl) nameEl.textContent = 'هنوز پرستاری ثبت نشده';
        if (specialtyEl) specialtyEl.textContent = '—';
        if (photoEl) { photoEl.src = ''; photoEl.alt = ''; }
        if (graduationEl) graduationEl.textContent = '—';
        if (universityEl) universityEl.textContent = '—';
        if (experienceEl) experienceEl.textContent = '—';
        if (licenseCodeEl) licenseCodeEl.textContent = '—';
        renderNurseAverageCard(null);
        return;
    }

    if (nameEl) nameEl.textContent = nurse.name;
    if (specialtyEl) specialtyEl.textContent = nurse.specialty;
    if (photoEl) {
        photoEl.src = nurse.image;
        photoEl.alt = nurse.name;
    }
    if (graduationEl) graduationEl.textContent = nurse.graduation;
    if (universityEl) universityEl.textContent = nurse.university;
    if (experienceEl) experienceEl.textContent = nurse.experience;
    if (licenseCodeEl) licenseCodeEl.textContent = nurse.licenseCode;

    renderNurseAverageCard(nurse.id);
}

/* =====================================
   ساخت لیست پرستاران در سایدبار راست
===================================== */

const INITIAL_NURSE_COUNT = 5;
let showingAllNurses = false;

function renderNurseList(filteredNurses) {
    const listEl = document.getElementById('nurseList');
    if (!listEl) return;

    let list;
    if (filteredNurses) {
        list = filteredNurses;
    } else if (showingAllNurses) {
        list = nurses;
    } else {
        list = nurses.slice(0, INITIAL_NURSE_COUNT);
    }

    listEl.innerHTML = '';

    if (list.length === 0) {
        listEl.innerHTML = '<p style="font-size:13px; color:#7b8586; text-align:center; padding:10px;">هنوز پرستاری اضافه نشده است.</p>';
        return;
    }

    list.forEach(function (nurse) {
        const item = document.createElement('div');
        item.className = 'doctor-select-item';
        item.dataset.nurseId = nurse.id;

        const isSelected = nurse.id === selectedNurseId;
        if (isSelected) {
            item.classList.add('active');
        }

        const avgResult = getNurseAverage(nurse.id);
        const avgLabel = avgResult ? `★ ${avgResult.average}` : '';

        item.innerHTML = `
            <img src="${nurse.image}" alt="${nurse.name}">
            <div class="doctor-select-info">
                <strong>${nurse.name}</strong>
                <span>${nurse.specialty}${avgLabel ? ' · ' + avgLabel : ''}</span>
            </div>
            ${isSelected
                ? '<span class="doctor-check">✓</span>'
                : '<span class="doctor-arrow">‹</span>'}
        `;

        item.addEventListener('click', function () {
            selectNurse(nurse.id);
        });

        listEl.appendChild(item);
    });
}

/* =====================================
   انتخاب یک پرستار (از روی کلیک در لیست)
===================================== */

function selectNurse(nurseId) {
    const nurse = nurses.find(function (n) { return n.id === nurseId; });
    if (!nurse) return;

    selectedNurseId = nurseId;

    renderNurseInfo(nurse);
    renderNurseList();
    updateVotingUI(nurseId);
}

/* =====================================
   جستجوی پرستار بر اساس نام
===================================== */

function initNurseSearch() {
    const searchEl = document.getElementById('nurseSearch');
    if (!searchEl) return;

    searchEl.addEventListener('input', function () {
        const query = searchEl.value.trim();
        const filtered = nurses.filter(function (n) {
            return n.name.indexOf(query) !== -1;
        });
        renderNurseList(filtered);
    });
}

/* =====================================
   دکمه مشاهده همه پرستاران
===================================== */

function initAllNursesButton() {
    const btn = document.querySelector('.all-doctors-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        showingAllNurses = !showingAllNurses;
        renderNurseList();

        btn.innerHTML = showingAllNurses
            ? '<span>‹</span> نمایش کمتر'
            : '<span>♧</span> مشاهده همه پرستاران';
    });
}

/* =====================================
   منطق امتیازدهی ستاره‌ای
=====================================*/

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
function getNurseAverage(nurseId) {
    const evaluations = Object.values(ratingsCache[String(nurseId)] || {});
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
function getNurseBreakdown(nurseId) {
    const evaluations = Object.values(ratingsCache[String(nurseId)] || {});

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

function renderNurseAverageCard(nurseId) {
    const circleEl = document.getElementById('averageCircleProgress');
    const numberEl = document.getElementById('averageScoreNumber');
    const starsEl = document.getElementById('averageStarsDisplay');
    const countEl = document.getElementById('averageReviewCount');
    const breakdownEl = document.getElementById('averageBreakdown');

    if (!circleEl || !numberEl || !starsEl || !countEl || !breakdownEl) return;

    const data = nurseId ? getNurseBreakdown(nurseId) : { average: '0', totalCount: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
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

function updateVotingUI(nurseId) {
    const submitBtn = document.querySelector('.submit-evaluation');
    const editBtn = getOrCreateEditButton();
    const myRating = nurseId ? getMyNurseRating(nurseId) : null;

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

/* ====================================
   دکمه ثبت ارزیابی
===================================== */

function initSubmitButton() {
    const submitBtn = document.querySelector('.submit-evaluation');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async function () {
        if (!selectedNurseId) {
            alert('لطفاً ابتدا یک پرستار را انتخاب کنید.');
            return;
        }

        const ratings = collectRatings();

        submitBtn.disabled = true;
        try {
            await submitRatingToServer(selectedNurseId, ratings);
            renderNurseAverageCard(selectedNurseId);
            renderNurseList();
            updateVotingUI(selectedNurseId);
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
    const firstNurse = nurses.length > 0 ? nurses[0] : null;
    selectedNurseId = firstNurse ? firstNurse.id : null;

    await fetchRatingsFromServer();

    renderNurseInfo(firstNurse);
    renderNurseList();
    initNurseSearch();
    initAllNursesButton();
    initStarRatings();
    initSubmitButton();
    updateVotingUI(selectedNurseId);
});
