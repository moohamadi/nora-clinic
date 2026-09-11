/* =====================================================
   home-ratings.js
   خواندن امتیازهای پزشکان از سرور (همون API که
   doctors-evaluation.js استفاده می‌کنه: GET /rating)
   و نمایش میانگین واقعی روی کارت‌های صفحه اصلی.

   اگه سرور در دسترس نباشه یا برای یک پزشک هنوز نظری
   ثبت نشده باشه، مقدار پیش‌فرضی که همین الان توی
   HTML نوشته شده (استارز/عدد ثابت) دست نخورده می‌مونه.
===================================================== */

(function () {
    const API_BASE = ''; // مثل doctors-evaluation.js — اگه فایل‌ها از خود Node سرو بشن نسبیه
    const SECTION = 'doctors';

    /* میانگین کلی یک پزشک از روی همه‌ی ارزیابی‌های ثبت‌شده */
    function computeDoctorAverage(entry) {
        // entry می‌تونه آبجکت {voterId: ratings} یا آرایه‌ی قدیمی [ratings, ...] باشه
        const evaluations = Object.values(entry || {});
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
            average: total / count,
            evaluationsCount: evaluations.length
        };
    }

    function renderStars(container, average) {
        const rounded = Math.round(average);
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rounded ? '★' : '☆';
        }
        container.textContent = stars;
    }

    async function applyRatingsToHomeCards() {
        const cards = document.querySelectorAll('.doctor-card[data-doctor-id]');
        if (cards.length === 0) return;

        let ratingsData;
        try {
            const res = await fetch(`${API_BASE}/rating`);
            if (!res.ok) throw new Error('پاسخ سرور نامعتبر بود');
            ratingsData = await res.json();
        } catch (err) {
            console.error('خطا در دریافت امتیازها برای صفحه اصلی:', err);
            return; // مقادیر پیش‌فرض توی HTML دست‌نخورده می‌مونن
        }

        const doctorsRatings = ratingsData[SECTION] || {};

        cards.forEach(function (card) {
            const doctorId = card.getAttribute('data-doctor-id');
            const result = computeDoctorAverage(doctorsRatings[doctorId]);
            if (!result) return; // هنوز نظری ثبت نشده -> مقدار پیش‌فرض بمونه

            const starsEl = card.querySelector('.stars');
            const numberEl = card.querySelector('.rating-number');

            if (starsEl) renderStars(starsEl, result.average);
            if (numberEl) numberEl.textContent = result.average.toFixed(1);
        });
    }

    document.addEventListener('DOMContentLoaded', applyRatingsToHomeCards);
})();
