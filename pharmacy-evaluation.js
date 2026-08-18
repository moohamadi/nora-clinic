console.log("pharmacy-evaluation loaded");

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
    resetAllStars();
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

function initStarRatings() {
    document.querySelectorAll('.star-group').forEach(function (group) {
        const stars = Array.from(group.querySelectorAll('button'));
        group.dataset.rating = 0;

        stars.forEach(function (star, index) {
            const value = index + 1;

            star.addEventListener('mouseenter', function () {
                highlight(stars, value, 'hover');
            });

            star.addEventListener('click', function () {
                group.dataset.rating = value;
                highlight(stars, value, 'active');
            });
        });

        group.addEventListener('mouseleave', function () {
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

/* =====================================
   ذخیره‌سازی امتیازها (localStorage)
===================================== */

const RATINGS_STORAGE_KEY = 'pharmacyEvaluations';

function getRatingsStore() {
    try {
        return JSON.parse(localStorage.getItem(RATINGS_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function savePharmacyEvaluation(staffId, ratings) {
    const store = getRatingsStore();
    if (!store[staffId]) {
        store[staffId] = [];
    }
    store[staffId].push(ratings);
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(store));
}

/* میانگین ساده (برای نمایش کنار اسم توی لیست) */
function getPharmacyAverage(staffId) {
    const store = getRatingsStore();
    const evaluations = store[staffId] || [];
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

/ تفکیک بر اساس تعداد ستاره (برای کارت میانگین + نمودار میله‌ای) /
function getPharmacyBreakdown(staffId) {
    const store = getRatingsStore();
    const evaluations = store[staffId] || [];

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
        const percent = data.totalCount > 0 ? (count / data.totalCount)  * 100 : 0;

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
   دکمه ثبت ارزیابی
===================================== */

function initSubmitButton() {
    const submitBtn = document.querySelector('.submit-evaluation');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
        if (!selectedPharmacyId) {
            alert('لطفاً ابتدا یکی از پرسنل داروخانه را انتخاب کنید.');
            return;
        }

        const ratings = collectRatings();

        savePharmacyEvaluation(selectedPharmacyId, ratings);
        renderPharmacyAverageCard(selectedPharmacyId);
        renderPharmacyList();
        resetAllStars();

        alert('ارزیابی شما با موفقیت ثبت شد. سپاسگزاریم!');
    });
}

/* =====================================
   شروع اجرای برنامه
===================================== */

document.addEventListener('DOMContentLoaded', function () {
    const firstStaff = pharmacyStaff.length > 0 ? pharmacyStaff[0] : null;
    renderPharmacyInfo(firstStaff);
    renderPharmacyList();
    initPharmacySearch();
    initAllPharmacyButton();
    initStarRatings();
    initSubmitButton();
});