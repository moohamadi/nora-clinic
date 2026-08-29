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

// اسلایدر هیروی موبایل
(function () {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-slide-dots .dot");
  if (!slides.length) return;

  let current = 0;

  function showSlide(i) {
    slides.forEach((s) => s.classList.remove("active"));
    dots.forEach((d) => d.classList.remove("active"));
    slides[i].classList.add("active");
    dots[i].classList.add("active");
    current = i;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => showSlide(i));
  });

  setInterval(() => {
    showSlide((current + 1) % slides.length);
  }, 5000);
})();