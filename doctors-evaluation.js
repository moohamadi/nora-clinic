console.log("doctor-evaluation loaded");

/* =====================================
   آدرس پایه‌ی سرور
   وقتی مرحله‌ی serve کردن فایل‌های سایت از خود Node انجام شد
   و صفحات مستقیم از http://localhost:3000 باز شدن،
   کافیه این مقدار رو '' (رشته‌ی خالی) کنی تا آدرس‌ها نسبی بشن.
===================================== */
const API_BASE = '';
const SECTION = 'doctors';

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
   اطلاعات پزشکان درمانگاه نورا
===================================== */

const doctors = [

    {
        id: 1,
        name: "دکتر سعید فقهی",
        specialty: "پزشک عمومی",
        image: "images/docters/سعید فقهی.png",
        graduation: "۱۳۹۲",
        university: "دانشگاه علوم پزشکی خرم آباد",
        experience: "۱۰ سال",
        medicalCode: "۱۳۴۵۲"
    },

    {
        id: 2,
        name: "دکتر داوود مرادی",
        specialty: "پزشک عمومی",
        image: "images/docters/داود مرادی.png",
        graduation: "۱۳۹۰",
        university: "دانشگاه علوم پزشکی خرم آباد",
        experience: "۱۲ سال",
        medicalCode: "۱۲۸۷۶"
    },

    {
        id: 3,
        name: "دکتر سیده فاطمه موسوی",
        specialty: "پزشک عمومی",
        image: "images/docters/سیده فاطمه موسوی.png",
        graduation: "۱۴۰۲",
        university: "دانشگاه علوم پزشکی خرم آباد",
        experience: "۳ سال",
        medicalCode: "۱۱۶۵۴"
    },

    {
        id: 4,
        name: "دکتر تندیس خسروی",
        specialty: "پزشک عمومی",
        image: "images/docters/تندیس خسروی9.png",
        graduation: "۱۳۹۸",
        university: "دانشگاه علوم پزشکی خرم آباد",
        experience: "۱۱ سال",
        medicalCode: "۱۴۲۳۱"
    },

    {
        id: 5,
        name: "دکتر راضیه قاسمی‌پور",
        specialty: "پزشک عمومی",
        image: "images/docters/راضیه قاسمی پور.png",
        graduation: "۱۳۹۸",
        university: "دانشگاه علوم پزشکی شیراز",
        experience: "۱۳ سال",
        medicalCode: "۱۲۳۴۵"
    },

    {
        id: 6,
        name: "دکتر علی ساروقی",
        specialty: "پزشک عمومی",
        image: "images/docters/علی ساروقی .png",
        graduation: "۱۳۹۳",
        university: "دانشگاه علوم پزشکی لرستان",
        experience: "۹ سال",
        medicalCode: "۱۵۲۳۴"
    },

    {
        id: 7,
        name: "دکتر نوشین غلامی",
        specialty: "پزشک عمومی",
        image: "images/docters/نوشین غلامی .png",
        graduation: "۱۴۰۲",
        university: "دانشگاه علوم پزشکی همدان",
        experience: "۳ سال",
        medicalCode: "۱۰۹۸۷"
    },

    {
        id: 8,
        name: "دکتر زهرا محمدپور",
        specialty: "پزشک عمومی",
        image: "images/docters/زهرا محمدپور.png",
        graduation: "۱۳۹۰",
        university: "دانشگاه علوم پزشکی اصفهان",
        experience: "۱۲ سال",
        medicalCode: "۱۳۵۶۷"
    },

    {
        id: 9,
        name: "دکتر شکیبا غلامرضایی",
        specialty: "پزشک عمومی",
        image: "images/docters/شکیبا غلامرضائی .png",
        graduation: "۱۳۹۲",
        university: "دانشگاه علوم پزشکی لرستان",
        experience: "۱۰ سال",
        medicalCode: "۱۴۶۷۸"
    },

    {
        id: 10,
        name: "دکتر احمد سوری",
        specialty: "پزشک عمومی",
        image: "images/docters/احمد سوری.png",
        graduation: "۱۳۸۶",
        university: "دانشگاه علوم پزشکی خرم آباد",
        experience: "۱۶ سال",
        medicalCode: "۱۰۵۴۳"
    },

    {
        id: 11,
        name: "دکتر امیرحسین شاکرمی",
        specialty: "پزشک عمومی",
        image: "images/docters/امیرحسین شاکرمی .png",
        graduation: "۱۳۹۱",
        university: "دانشگاه علوم پزشکی خرم آباد",
        experience: "۱۱ سال",
        medicalCode: "۱۴۱۲۳"
    }

];

/* =====================================
   وضعیت فعلی (پزشک انتخاب‌شده)
===================================== */

let selectedDoctorId = doctors[0].id;

/* =====================================
   کش محلی امتیازها (از سرور خونده می‌شه)
   ساختار: { "شناسه‌ی پزشک": [ {skill: 5, behavior: 4, ...}, ... ] }
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

async function submitRatingToServer(doctorId, ratings) {
    const res = await fetch(`${API_BASE}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: SECTION, id: doctorId, voterId: VOTER_ID, ratings })
    });

    if (!res.ok) {
        const errBody = await res.json().catch(function () { return {}; });
        throw new Error(errBody.error || 'ثبت امتیاز با خطا مواجه شد.');
    }

    const key = String(doctorId);
    if (!ratingsCache[key]) {
        ratingsCache[key] = {};
    }
    ratingsCache[key][VOTER_ID] = ratings;
}

/* آیا همین مرورگر قبلاً به این پزشک امتیاز داده؟ اگر آره، همون امتیاز رو برمی‌گردونه */
function getMyDoctorRating(doctorId) {
    const entry = ratingsCache[String(doctorId)];
    return entry ? (entry[VOTER_ID] || null) : null;
}

/* =====================================
   نمایش اطلاعات پزشک در پنل سمت چپ
===================================== */

function renderDoctorInfo(doctor) {
    const nameEl = document.getElementById('selectedDoctorName');
    const specialtyEl = document.getElementById('selectedDoctorSpecialty');
    const photoEl = document.getElementById('selectedDoctorImage');
    const graduationEl = document.getElementById('selectedDoctorGraduation');
    const universityEl = document.getElementById('selectedDoctorUniversity');
    const experienceEl = document.getElementById('selectedDoctorExperience');
    const medicalCodeEl = document.getElementById('selectedDoctorMedicalCode');

    if (nameEl) nameEl.textContent = doctor.name;
    if (specialtyEl) specialtyEl.textContent = doctor.specialty;
    if (photoEl) {
        photoEl.src = doctor.image;
        photoEl.alt = doctor.name;
    }
    if (graduationEl) graduationEl.textContent = doctor.graduation;
    if (universityEl) universityEl.textContent = doctor.university;
    if (experienceEl) experienceEl.textContent = doctor.experience;
    if (medicalCodeEl) medicalCodeEl.textContent = doctor.medicalCode;

    renderDoctorAverageCard(doctor.id);
}

/* =====================================
   ساخت لیست پزشکان در سایدبار راست
===================================== */

const INITIAL_DOCTOR_COUNT = 5;
let showingAllDoctors = false;

function renderDoctorList(filteredDoctors) {
    const listEl = document.getElementById('doctorList');
    if (!listEl) return;

    let list;
    if (filteredDoctors) {
        list = filteredDoctors;
    } else if (showingAllDoctors) {
        list = doctors;
    } else {
        list = doctors.slice(0, INITIAL_DOCTOR_COUNT);
    }
    listEl.innerHTML = '';

    list.forEach(function (doctor) {
        const item = document.createElement('div');
        item.className = 'doctor-select-item';
        item.dataset.doctorId = doctor.id;

        const isSelected = doctor.id === selectedDoctorId;
        if (isSelected) {
            item.classList.add('active');
        }

        const avgResult = getDoctorAverage(doctor.id);
        const avgLabel = avgResult ? `★ ${avgResult.average}` : '';

        item.innerHTML = `
            <img src="${doctor.image}" alt="${doctor.name}">
            <div class="doctor-select-info">
                <strong>${doctor.name}</strong>
                <span>${doctor.specialty}${avgLabel ? ' · ' + avgLabel : ''}</span>
            </div>
            ${isSelected
                ? '<span class="doctor-check">✓</span>'
                : '<span class="doctor-arrow">‹</span>'}
        `;

        item.addEventListener('click', function () {
            selectDoctor(doctor.id);
        });

        listEl.appendChild(item);
    });
}

/* =====================================
   انتخاب یک پزشک (از روی کلیک در لیست)
===================================== */

function selectDoctor(doctorId) {
    const doctor = doctors.find(function (d) { return d.id === doctorId; });
    if (!doctor) return;

    selectedDoctorId = doctorId;

    renderDoctorInfo(doctor);
    renderDoctorList();
    updateVotingUI(doctorId);
}

/* =====================================
   جستجوی پزشک بر اساس نام
===================================== */

function initDoctorSearch() {
    const searchEl = document.getElementById('doctorSearch');
    if (!searchEl) return;

    searchEl.addEventListener('input', function () {
        const query = searchEl.value.trim();
        const filtered = doctors.filter(function (d) {
            return d.name.indexOf(query) !== -1;
        });
        renderDoctorList(filtered);
    });
}

/* =====================================
   دکمه مشاهده همه پزشکان
===================================== */

function initAllDoctorsButton() {
    const btn = document.querySelector('.all-doctors-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        showingAllDoctors = !showingAllDoctors;
        renderDoctorList();

        btn.innerHTML = showingAllDoctors
            ? '<span>‹</span> نمایش کمتر'
            : '<span>♧</span> مشاهده همه پزشکان';
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

/* میانگین کل (همه‌ی معیارها با هم) برای یک پزشک */
function getDoctorAverage(doctorId) {
    const evaluations = Object.values(ratingsCache[String(doctorId)] || {});
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

/* =====================================
   کارت میانگین امتیازات (دایره + نوارهای تفکیکی)
===================================== */

function getDoctorBreakdown(doctorId) {
    const evaluations = Object.values(ratingsCache[String(doctorId)] || {});

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

function renderDoctorAverageCard(doctorId) {
    const circleEl = document.getElementById('averageCircleProgress');
    const numberEl = document.getElementById('averageScoreNumber');
    const starsEl = document.getElementById('averageStarsDisplay');
    const countEl = document.getElementById('averageReviewCount');
    const breakdownEl = document.getElementById('averageBreakdown');

    if (!circleEl || !numberEl || !starsEl || !countEl || !breakdownEl) return;

    const data = getDoctorBreakdown(doctorId);
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

function updateVotingUI(doctorId) {
    const submitBtn = document.querySelector('.submit-evaluation');
    const editBtn = getOrCreateEditButton();
    const myRating = getMyDoctorRating(doctorId);

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
        const ratings = collectRatings();

        submitBtn.disabled = true;
        try {
            await submitRatingToServer(selectedDoctorId, ratings);
            renderDoctorAverageCard(selectedDoctorId);
            renderDoctorList();
            updateVotingUI(selectedDoctorId);
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
    const urlParams = new URLSearchParams(window.location.search);
    const doctorIdFromUrl = Number(urlParams.get('doctor'));
    const initialDoctor = doctors.find(function (d) {
        return d.id === doctorIdFromUrl;
    }) || doctors[0];

    selectedDoctorId = initialDoctor ? initialDoctor.id : null;

    await fetchRatingsFromServer();

    renderDoctorInfo(initialDoctor);
    renderDoctorList();
    initDoctorSearch();
    initAllDoctorsButton();
    initStarRatings();
    initSubmitButton();
    updateVotingUI(selectedDoctorId);
});
