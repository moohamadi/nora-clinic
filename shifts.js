console.log("shifts.js loaded");

/* =========================================================
   این فایل فقط توی shifts.html استفاده می‌شه.
   شامل: تعویض تب پزشکان/پرستاران + کل مدیریت شیفت
   (خوندن از سرور، نمایش جدول، ورود مدیر، ویرایش با کلیک)
   کدهای شیفت: M=صبح  E=عصر  N=شب  X=پیک شب
   ========================================================= */

const SHIFT_API_BASE = '';

/* =====================================
   تعویض تب «پزشکان» / «پرستاران»
===================================== */

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

        sessionStorage.setItem('nora_shift_active_tab', activeBtnId);
    }

    staffButtons.forEach(function (item) {
        const btn = document.getElementById(item.btnId);
        if (!btn) return;

        btn.addEventListener('click', function () {
            showSection(item.btnId);
        });
    });

    // فقط در بازکردن تازه‌ی صفحه پیش‌فرض روی «پزشکان»ه؛
    // اگه قبلاً توی همین تب مرورگر روی «پرستاران» بودی، همونجا می‌مونه
    const lastActiveTab = sessionStorage.getItem('nora_shift_active_tab') || 'doctor-btn';
    showSection(lastActiveTab);
});

/* =====================================
   داده‌ی شیفت‌ها (از سرور خونده می‌شه)
===================================== */

const shiftNames = {
    M: "صبح",
    E: "عصر",
    N: "شب",
    X: "پیک شب"
};

let shiftsData = { doctors: {}, nurses: {} };
let isShiftAdmin = false;
let shiftAdminPassword = '';

async function fetchShiftsFromServer() {
    try {
        const res = await fetch(`${SHIFT_API_BASE}/shifts`);
        shiftsData = await res.json();
    } catch (err) {
        console.error('خطا در دریافت شیفت‌ها از سرور:', err);
        shiftsData = { doctors: {}, nurses: {} };
    }
}

/* =====================================
   نمایش یک جدول شیفت (پزشکان یا پرستاران)
===================================== */

const SHIFT_CLASS_MAP = {
    doctors: { M: "shift-morning", E: "shift-evening", N: "shift-night", X: "shift-peak" },
    nurses:  { M: "shift-M", E: "shift-E", N: "shift-N", X: "shift-X" }
};

/* رنگ پس‌زمینه‌ی هر کد شیفت (دقیقاً همون رنگ‌هایی که توی style.css تعریف شده)
   برای ساختن گرادیان دقیق شیفت‌های ترکیبی استفاده می‌شه */
const SHIFT_BG_COLORS = {
    doctors: { M: "#cdf7e3", E: "#f59d06", N: "#0f7afc", X: "#eee0ff" },
    nurses:  { M: "#c7fae2", E: "#fabe1a", N: "#0f7afc", X: "#eee0ff" }
};

const SHIFT_CODE_ORDER = ['M', 'E', 'N', 'X'];

function renderShiftTable(tableSelector, group, nameClass) {
    const table = document.querySelector(tableSelector);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(function (row) {
        const nameCell = row.querySelector('.' + nameClass);
        if (!nameCell) return;

        const personName = nameCell.textContent.trim();
        const personShifts = (shiftsData[group] && shiftsData[group][personName]) || {};

        const dayCells = row.querySelectorAll('td:not(.' + nameClass + ')');

        dayCells.forEach(function (cell, index) {
            const day = index + 1;
            const code = personShifts[day] || '';

            cell.classList.remove(
                'shift-M', 'shift-E', 'shift-N', 'shift-X',
                'shift-morning', 'shift-evening', 'shift-night', 'shift-peak',
                'shift-combined', 'shift-night-evening'
            );
            // پاک کردن استایل اختصاصیِ رندر قبلی (برای شیفت ترکیبی)
            cell.style.background = '';
            cell.style.color = '';
            cell.style.textShadow = '';
            cell.style.fontWeight = '';

            cell.dataset.day = day;
            cell.dataset.person = personName;
            cell.dataset.group = group;
            cell.dataset.code = code;

            const parts = code ? code.split(',').map(function (p) { return p.trim(); }).filter(Boolean) : [];
            const colors = SHIFT_BG_COLORS[group] || SHIFT_BG_COLORS.doctors;

            if (parts.length === 0) {
                cell.innerHTML = '';
            } else if (parts.length === 1) {
                cell.textContent = shiftNames[parts[0]] || parts[0];
                const className = (SHIFT_CLASS_MAP[group] && SHIFT_CLASS_MAP[group][parts[0]]) || ('shift-' + parts[0]);
                cell.classList.add(className);
            } else {
                // شیفت ترکیبی: گرادیان دقیقاً از رنگ واقعی همون دو شیفت ساخته می‌شه
                cell.innerHTML = parts.map(function (p) { return shiftNames[p] || p; }).join('<br>');
                const color1 = colors[parts[0]] || '#ccc';
                const color2 = colors[parts[1]] || '#ccc';
                cell.style.background = `linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`;
                cell.style.color = '#1a1a1a';
                cell.style.textShadow = '0 0 3px rgba(255,255,255,.85)';
                cell.style.fontWeight = 'bold';
            }

            cell.style.cursor = isShiftAdmin ? 'pointer' : '';
        });
    });
}

function renderAllShiftTables() {
    renderShiftTable('.doctertable', 'doctors', 'doctor-name');
    renderShiftTable('.nurses-table', 'nurses', 'person-name');
}

/* =====================================
   پاپ‌آپ انتخاب شیفت (فقط برای مدیر)
===================================== */

let activeShiftPopover = null;

function closeShiftPopover() {
    if (activeShiftPopover) {
        activeShiftPopover.remove();
        activeShiftPopover = null;
    }
}

function openShiftPopover(cell) {
    closeShiftPopover();

    const currentCode = cell.dataset.code || '';
    let selected = currentCode
        ? currentCode.split(',').map(function (p) { return p.trim(); }).filter(Boolean)
        : [];

    const popover = document.createElement('div');
    popover.style.cssText = 'position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:130px;';

    const codeButtons = [
        { code: 'M', label: 'صبح' },
        { code: 'E', label: 'عصر' },
        { code: 'N', label: 'شب' },
        { code: 'X', label: 'پیک شب' }
    ];

    const hint = document.createElement('div');
    hint.textContent = 'برای شیفت دو‌نوبته، دو مورد را انتخاب کنید';
    hint.style.cssText = 'font-size:11px;color:#888;text-align:center;margin-bottom:2px;';
    popover.appendChild(hint);

    function refreshButtons() {
        codeButtons.forEach(function (opt) {
            const isActive = selected.includes(opt.code);
            opt.btn.style.cssText = 'border:none;border-radius:6px;padding:8px;font-size:13px;cursor:pointer;text-align:center;font-family:inherit;' +
                (isActive
                    ? 'background:#1f7d68;color:#fff;font-weight:700;'
                    : 'background:#f5f5f5;color:#333;');
        });
    }

    codeButtons.forEach(function (opt) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.label;
        opt.btn = btn;

        btn.addEventListener('click', function () {
            if (selected.includes(opt.code)) {
                selected = selected.filter(function (c) { return c !== opt.code; });
            } else {
                if (selected.length >= 2) {
                    selected.shift(); // فقط دو شیفت هم‌زمان مجازه؛ قدیمی‌ترین انتخاب حذف می‌شه
                }
                selected.push(opt.code);
            }
            refreshButtons();
        });

        popover.appendChild(btn);
    });

    refreshButtons();

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = '✓ ثبت';
    saveBtn.style.cssText = 'border:none;background:#0e9ab0;color:#fff;border-radius:6px;padding:8px;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;font-family:inherit;';
    saveBtn.addEventListener('click', function () {
        const ordered = SHIFT_CODE_ORDER.filter(function (c) { return selected.includes(c); });
        saveShift(cell.dataset.group, cell.dataset.person, Number(cell.dataset.day), ordered.join(','));
        closeShiftPopover();
    });
    popover.appendChild(saveBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = '✕ پاک کردن';
    clearBtn.style.cssText = 'border:none;background:#fdecec;color:#c0392b;border-radius:6px;padding:8px;font-size:13px;cursor:pointer;font-family:inherit;';
    clearBtn.addEventListener('click', function () {
        saveShift(cell.dataset.group, cell.dataset.person, Number(cell.dataset.day), '');
        closeShiftPopover();
    });
    popover.appendChild(clearBtn);

    document.body.appendChild(popover);

    const rect = cell.getBoundingClientRect();
    popover.style.top = (window.scrollY + rect.bottom + 4) + 'px';
    popover.style.left = (window.scrollX + rect.left) + 'px';

    activeShiftPopover = popover;
}

document.addEventListener('click', function (e) {
    if (activeShiftPopover && !activeShiftPopover.contains(e.target) && !e.target.closest('td[data-day]')) {
        closeShiftPopover();
    }
});

/* =====================================
   ثبت شیفت روی سرور
===================================== */

async function saveShift(group, person, day, code) {
    try {
        const res = await fetch(`${SHIFT_API_BASE}/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: shiftAdminPassword,
                group: group,
                person: person,
                day: day,
                code: code
            })
        });

        if (!res.ok) {
            const errBody = await res.json().catch(function () { return {}; });
            throw new Error(errBody.error || 'ثبت شیفت با خطا مواجه شد.');
        }

        if (!shiftsData[group][person]) {
            shiftsData[group][person] = {};
        }
        if (code) {
            shiftsData[group][person][day] = code;
        } else {
            delete shiftsData[group][person][day];
        }

        renderAllShiftTables();
    } catch (err) {
        alert('خطا: ' + err.message);
    }
}

/* =====================================
   ورود / خروج مدیر
===================================== */

async function loginShiftAdmin(password) {
    const res = await fetch(`${SHIFT_API_BASE}/shifts/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
    });

    if (!res.ok) {
        throw new Error('رمز عبور اشتباه است.');
    }

    shiftAdminPassword = password;
    isShiftAdmin = true;
    sessionStorage.setItem('nora_shift_admin_pw', password);
}

function logoutShiftAdmin() {
    isShiftAdmin = false;
    shiftAdminPassword = '';
    sessionStorage.removeItem('nora_shift_admin_pw');
    closeShiftPopover();
}

function initShiftAdminUI() {
    const loginBox = document.getElementById('shift-admin-login');
    const loggedInBox = document.getElementById('shift-admin-logged-in');
    const passwordInput = document.getElementById('shift-admin-password');
    const loginBtn = document.getElementById('shift-admin-login-btn');
    const logoutBtn = document.getElementById('shift-admin-logout-btn');
    const errorEl = document.getElementById('shift-admin-error');

    if (!loginBox || !loggedInBox || !passwordInput || !loginBtn || !logoutBtn) {
        console.warn('shifts.js: عناصر باکس ورود مدیر توی HTML پیدا نشدن.');
        return;
    }

    function refreshAdminBoxes() {
        loginBox.style.display = isShiftAdmin ? 'none' : 'flex';
        loggedInBox.style.display = isShiftAdmin ? 'flex' : 'none';
        renderAllShiftTables();
    }

    loginBtn.addEventListener('click', async function () {
        if (errorEl) errorEl.textContent = '';
        try {
            await loginShiftAdmin(passwordInput.value);
            passwordInput.value = '';
            refreshAdminBoxes();
        } catch (err) {
            if (errorEl) errorEl.textContent = err.message;
        }
    });

    logoutBtn.addEventListener('click', function () {
        logoutShiftAdmin();
        refreshAdminBoxes();
    });

    // کلیک روی سلول‌های روز (فقط وقتی مدیر وارد شده باشه)
    document.addEventListener('click', function (e) {
        const cell = e.target.closest('td[data-day]');
        if (!cell || !isShiftAdmin) return;
        openShiftPopover(cell);
    });

    // اگر همین مرورگر قبلاً (در همین تب) وارد شده بود
    const savedPassword = sessionStorage.getItem('nora_shift_admin_pw');
    if (savedPassword) {
        loginShiftAdmin(savedPassword)
            .then(refreshAdminBoxes)
            .catch(function () {
                sessionStorage.removeItem('nora_shift_admin_pw');
                refreshAdminBoxes();
            });
    } else {
        refreshAdminBoxes();
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    if (!document.querySelector('.shift-table-section')) return;

    await fetchShiftsFromServer();
    renderAllShiftTables();
    initShiftAdminUI();
});
