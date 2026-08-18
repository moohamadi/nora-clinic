console.log("script loaded");


/* =====================================
   BACK TO TOP
===================================== */

const backToTop = document.getElementById("backToTop");

if (backToTop) {

    window.addEventListener("scroll", function () {

        if (window.scrollY > 400) {

            backToTop.style.display = "block";

        } else {

            backToTop.style.display = "none";

        }

    });


    backToTop.addEventListener("click", function () {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}



/* =====================================
   HAMBURGER MENU
===================================== */

const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");


if (menuBtn && closeBtn && sideMenu && menuOverlay) {

    menuBtn.addEventListener("click", function () {

        sideMenu.classList.add("active");
        menuOverlay.classList.add("active");

    });


    closeBtn.addEventListener("click", function () {

        sideMenu.classList.remove("active");
        menuOverlay.classList.remove("active");

    });


    menuOverlay.addEventListener("click", function () {

        sideMenu.classList.remove("active");
        menuOverlay.classList.remove("active");

    });

}



/* =====================================
   GALLERY LIGHTBOX
===================================== */

const galleryImages = document.querySelectorAll(
    ".gallery-item img, .gallery-main img"
);

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let currentImageIndex = 0;


/* =====================================
   اگر صفحه گالری باشد
===================================== */

if (
    galleryImages.length &&
    lightbox &&
    lightboxImage &&
    lightboxClose &&
    lightboxPrev &&
    lightboxNext
) {


    /* =================================
       باز کردن عکس
    ================================= */

    galleryImages.forEach(function (image, index) {

        image.addEventListener("click", function () {

            currentImageIndex = index;

            lightboxImage.src = image.src;
            lightboxImage.alt = image.alt;

            lightbox.classList.add("active");

            document.body.style.overflow = "hidden";

        });

    });



    /* =================================
       عکس بعدی
    ================================= */

    lightboxNext.addEventListener("click", function (event) {

        event.stopPropagation();

        currentImageIndex++;

        if (currentImageIndex >= galleryImages.length) {

            currentImageIndex = 0;

        }

        lightboxImage.src =
            galleryImages[currentImageIndex].src;

        lightboxImage.alt =
            galleryImages[currentImageIndex].alt;

    });



    /* =================================
       عکس قبلی
    ================================= */

    lightboxPrev.addEventListener("click", function (event) {

        event.stopPropagation();

        currentImageIndex--;

        if (currentImageIndex < 0) {

            currentImageIndex = galleryImages.length - 1;

        }

        lightboxImage.src =
            galleryImages[currentImageIndex].src;

        lightboxImage.alt =
            galleryImages[currentImageIndex].alt;

    });



    /* =================================
       بستن با دکمه ×
    ================================= */

    lightboxClose.addEventListener("click", function () {

        closeLightbox();

    });



    /* =================================
       بستن با کلیک بیرون عکس
    ================================= */

    lightbox.addEventListener("click", function (event) {

        if (event.target === lightbox) {closeLightbox();

        }

    });



    /* =================================
       کنترل با کیبورد
    ================================= */

    document.addEventListener("keydown", function (event) {

        if (!lightbox.classList.contains("active")) {

            return;

        }


        if (event.key === "Escape") {

            closeLightbox();

        }


        if (event.key === "ArrowRight") {

            lightboxNext.click();

        }


        if (event.key === "ArrowLeft") {

            lightboxPrev.click();

        }

    });



    /* =================================
       تابع بستن گالری
    ================================= */

    function closeLightbox() {

        lightbox.classList.remove("active");

        document.body.style.overflow = "";

    }

}

/* =========================================
   شیفت پزشکان - اطلاعات ماه
   روزها: 1 تا 31
   M = صبح
   E = عصر
   N = شب
   X = پیک شب
   ========================================= */

const doctorShifts = {

    // پزشک ردیف 1
    1: {
        31: "M",
        28: "M",
        27: "M",
        26: "M",
        25: "M",
        20: "M",
        19: "M",
        18: "M",
        17: "M",
        14: "M",
        12: "M",
        11: "M",
        10: "M",
        6: "M",
        5: "M",
        4: "M",
        3: "M",
        1: "M"
    },


    // پزشک ردیف 2
    2: {
        30: "N",
        28: "E",
        26: "E",
        24: "E",
        20: "E",
        19: "E",
        18: "E",
        17: "E",
        14: "E",
        12: "E",
        11: "E",
        10: "E",
        5: "E",
        4: "E",
        3: "E",
     
    },


    // پزشک ردیف 3
    3: {
        27: "N",
        25: "N",
        20: "N",
        18: "N",
        9: "N",
        4: "N"
    },


    // پزشک ردیف 4
    4: {
        30: "E",
        23: "E",
        19: "N",
        17: "N",
        16: "N",
        2: "E",
        1: "E"
    },

    // پزشک ردیف 5
    5: {
        27: "E",
        22: "E",
        21: "N",
       13: "E",
        6: "E",
        2: "N"
    },


    // پزشک ردیف 6
    6: {
        30: "M",
        23: "M",
        22: "M",
        21: "M",
        16: "M",
        15: "M",
        13: "N",
        9: "M",
        8: "M",

        7: "M",
        2: "M"
    },


    // پزشک ردیف 7
    7: {
        31: "E",
        29: "N",
        23: "N",
       16: "N+E",
       15: "E",
        9: "E",
        8: "E",
        7: "E",
        6: "N",
        1: "N"
},

    // پزشک ردیف 8
    8: {
        29: "E",
        28: "N",
        26: "N",
        25: "E",
        24: "M",
        
        14: "N",
        11: "N",
          8: "N",
          7: "N",
          3: "E",
          2: "E"
    },


    // پزشک ردیف 9
    9: {
        31: "N",
        22: "N",
        15: "N",
       12: "N",
        10: "N",
        6: "M", 
    },


    // پزشک ردیف 10
    10: {
        29: "M",
        24: "N",
        21: "N",
        13: "M",
        12: "M",
          5: "N"
    }

};

document.addEventListener("DOMContentLoaded", function () {

    const tableBody = document.querySelector("table tbody");

    if (!tableBody) return;

    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row, rowIndex) => {

        // شماره پزشک
        const doctorNumber = rowIndex + 1;

        // اطلاعات شیفت این پزشک
        const shifts = doctorShifts[doctorNumber];

        if (!shifts) return;

        // سلول‌های روزهای ماه
        const cells = row.querySelectorAll("td");

        Object.keys(shifts).forEach(day => {

            const dayNumber = Number(day);

            // چون سلول اول نام پزشک است،
            // روز 1 در cells[1] قرار دارد.
            const cell = cells[dayNumber];

            if (!cell) return;

            const shift = shifts[day];

            // پاک کردن محتوای قبلی
            cell.textContent = "";

            // نمایش شیفت
            if (shift === "M") {
                cell.textContent = "صبح";
                cell.classList.add("shift-morning");

            } else if (shift === "E") {
                cell.textContent = "عصر";
                cell.classList.add("shift-evening");

            } else if (shift === "N") {
                cell.textContent = "شب";
                cell.classList.add("shift-night");

            } else if (shift === "X") {
                cell.textContent = "پیک شب";
                cell.classList.add("shift-peak");

            } else if (shift === "N+E") {
                cell.textContent = "شب + عصر";
                cell.classList.add("shift-night-evening");
            }

        });

    });

});

const nurseShifts = {

    // 1 — سیما ندری
    "سیما ندری": {
        1: "M",
        2: "M",
        3: "E",
        4: "E",
        5: "E",
        6: "N",
        7: "E",
        8: "M,E",
        9: "N",
        10: "E",
        11: "E",
        12: "E",
        15: "M",
        16: "M,N",
        17: "N",
        18: "N",
        19: "E",
        20: "E",
        21: "M,N",
        24: "N",
        25: "E",
        26: "N",
        27: "E",
        28: "E",
        29: "M",
        30: "E",
        31: "E"
    },

    // 2 — مهسا کرمی
    "مهسا کرمی": {
        2: "E",
        3: "M",
        12: "M",
        13: "M",
        14: "M",
        16: "E",
        17: "M",
        19: "M",
        20: "M",
        21: "E",
        26: "E",
        27: "M",
        30: "M",
        31: "M"
    },

    // 3 — راضیه عالی‌نژاد
    "راضیه عالی‌نژاد": {
        1: "E",        
        22: "N",
        23: "E",
        24: "N",
        25: "N",
        26: "N"
    },

    // 4 — محدثه سهیلی
    "محدثه سهیلی": {
   
        17: "E"
      
    },

    // 5 — مائده معززی
    "مائده معززی": {
        3: "N",
 
        13: "N",
        14: "N",
        15: "N",
        16: "N",
        22: "M",
        25: "M",
    },

    // 6 — فاطمه مرادی
    "فاطمه مرادی": {
  
        11: "N",
        17: "N",
        23: "N",
    },

    // 7 — نسترن بیرانوند
    "نسترن بیرانوند": {
        5: "M",
        9: "M",
        10: "M,E",
        11: "M",
        17: "E",
        22: "E",
        30: "M",
        31: "M"
    },

    // 8 — هانیه بازوند
    "هانیه بازوند": {
        5: "M",
        7: "M",
        9: "M",
        11: "M",
        22: "E",
    },

    // 9 — محمد عصمتی
    "محمد عصمتی": {
 
        3: "N",
        4: "M",
        9: "N",
        11: "N",
        17: "X",
        18: "X",
        21: "X",
        22: "M",
        27: "X",
        28: "X",
    },

    // 10 — عرفان احمدی
    "عرفان احمدی": {
        6: "M",
        7: "M",
        10: "N",
        18: "M",
        22: "N"
    },

    // 11 — حمید ندری
    "حمید ندری": {
        5: "N",
        12: "N",
        19: "N",
        26: "N",
    },

    // 12 — امیر مقدم
    "امیر مقدم": {
        1: "N",
        2: "N",
        15: "N",
        29: "X",
        30: "X",
    },

    // 13 — کاظمیان
    "کاظمیان": {
        16: "X",
        23: "X",
    },

    // 14 — مومنی
    "مومنی": {
        3: "N",
        6: "N",
        10: "E",
        11: "E",
        12: "E",
        17: "N",
        26: "N",
        27: "N",        
        31: "N"
    }

};

/* =====================================
   نمایش شیفت پرستاران در جدول
===================================== */

const nursesTable = document.querySelector(".nurses-table");

if (nursesTable) {

    // تبدیل کد شیفت به نام فارسی
    const shiftNames = {
        M: "صبح",
        E: "عصر",
        N: "شب",
        X: "پیک شب"
    };

    // تمام ردیف‌های پرستاران
    const nurseRows = nursesTable.querySelectorAll("tbody tr");

    nurseRows.forEach(function (row) {

        // نام پرستار
        const nurseName =
            row.querySelector(".person-name").textContent.trim();

        // اطلاعات شیفت این پرستار
        const shifts = nurseShifts[nurseName];

        // اگر اطلاعاتی برای این پرستار وجود نداشت
        if (!shifts) {
            return;
        }

        // سلول‌های روزهای ماه
        const cells = row.querySelectorAll("td:not(.person-name)");

        cells.forEach(function (cell, index) {

            // روز ماه
            const day = index + 1;

            // شیفت آن روز
            const shift = shifts[day];

            // اگر آن روز شیفت داشت
            if (shift) {

                // حالت شیفت ترکیبی مثل M,E یا M,N
                const shiftParts = shift.split(",");

                // نمایش نام شیفت
                cell.innerHTML = shiftParts
                    .map(function (part) {
                        return shiftNames[part.trim()] || part.trim();
                    })
                    .join("<br>");

                // حذف کلاس‌های قبلی
                cell.classList.remove(
                    "shift-M",
                    "shift-E",
                    "shift-N",
                    "shift-X"
                );

                // اگر شیفت ترکیبی بود
                if (shiftParts.length > 1) {

                    cell.classList.add("shift-combined");

                } else {

                    // اضافه کردن کلاس مربوط به شیفت
                    cell.classList.add(
                        "shift-" + shiftParts[0].trim()
                    );
                }
            }

        });

    });

}

/* =====================================
   سیستم امتیازدهی ستاره‌ای پزشکان
===================================== */

const ratingGroups = document.querySelectorAll(".rating-stars");

ratingGroups.forEach(function (group) {

    const stars = group.querySelectorAll("button");

    let selectedRating = 0;


    /* ==============================
       حرکت موس روی ستاره‌ها
    ============================== */

    stars.forEach(function (star, index) {

        star.addEventListener("mouseenter", function () {

            const hoverRating = index + 1;

            stars.forEach(function (item, i) {

                if (i < hoverRating) {
                    item.classList.add("hovered");
                } else {
                    item.classList.remove("hovered");
                }

            });

        });


        /* ==============================
           کلیک روی ستاره
        ============================== */

        star.addEventListener("click", function () {

            selectedRating = index + 1;

            stars.forEach(function (item, i) {

                if (i < selectedRating) {
                    item.classList.add("selected");
                } else {
                    item.classList.remove("selected");
                }

            });

            /* نمایش امتیاز در Console */
            console.log(
                "دسته:",
                group.dataset.category,
                "امتیاز:",
                selectedRating
            );

        });

    });


    /* ==============================
       خروج موس از قسمت ستاره‌ها
    ============================== */

    group.addEventListener("mouseleave", function () {

        stars.forEach(function (item, i) {

            item.classList.remove("hovered");

            if (i < selectedRating) {
                item.classList.add("selected");
            } else {
                item.classList.remove("selected");
            }

        });

    });

});


    /* ==============================
      کشوی منویی ارزیابی پرسنل
    ============================== */
const dropdownToggle = document.querySelector('.dropdown-toggle');
if (dropdownToggle) {
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.dropdown-menu').classList.toggle('show');
    });
}

document.addEventListener('click', function(e) {
    const menu = document.querySelector('.dropdown-menu');
    if (menu && !e.target.closest('.dropdown')) {
        menu.classList.remove('show');
    }
});

document.addEventListener('DOMContentLoaded', function () {

    const staffButtons = [
        { btnId: 'doctor-btn', sectionSelector: '.shift-table-section:not(.nurses-section)' },
        { btnId: 'nurse-btn',  sectionSelector: '.shift-table-section.nurses-section' }
    ];

    function showSection(activeBtnId) {
        staffButtons.forEach(function (item) {
            const btn = document.getElementById(item.btnId);
            const section = document.querySelector(item.sectionSelector);

            if (!btn || !section) return;

            if (item.btnId === activeBtnId) {
                btn.classList.add('active');
                section.classList.remove('hidden');
            } else {
                btn.classList.remove('active');
                section.classList.add('hidden');
            }
        });
    }

    staffButtons.forEach(function (item) {
        const btn = document.getElementById(item.btnId);
        if (!btn) return;

        btn.addEventListener('click', function () {
            showSection(item.btnId);
        });
    });

    // نمایش پیش‌فرض: جدول پزشکان
    showSection('doctor-btn');

});


const fadeSections = document.querySelectorAll('.fade.section');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.15 });

fadeSections.forEach(section => observer.observe(section));