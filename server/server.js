const http = require("http");
const fs = require("fs");
const path = require("path");

/* =====================================================
   مسیرها
   این فایل داخل پوشه‌ی server/ قرار داره، پس ریشه‌ی سایت
   (جایی که index.html و بقیه صفحات هستن) یک پوشه بالاتره.
===================================================== */
const SITE_ROOT = path.join(__dirname, "..");
const ratingFile = path.join(__dirname, "rating.json");
const shiftsFile = path.join(__dirname, "shifts.json");

/* =====================================================
   رمز عبور مدیر برای ویرایش شیفت‌ها
   ⚠️ این رمز رو حتماً به یک رمز دلخواه و خصوصی تغییر بده
   قبل از اینکه سایت رو آنلاین (روی رندر) منتشر کنی.
===================================================== */
const SHIFT_ADMIN_PASSWORD = "shiftlooksclear1!";

/* =====================================================
   ساختار پیش‌فرض rating.json
   سه بخش: پزشکان، پرستاران، داروخانه
   هرکدوم: { "شناسه‌ی فرد": { "شناسه‌ی رأی‌دهنده": {دسته‌ای: امتیاز, ...} } }
   هر مرورگر/گوشی یک voterId ثابت داره، پس رأی دوم همون شخص
   جای رأی قبلی‌اش را می‌گیرد (ویرایش) نه یک رأی اضافه.
===================================================== */
const DEFAULT_RATING_DATA = {
    doctors: {},
    nurses: {},
    pharmacy: {}
};

const VALID_SECTIONS = ["doctors", "nurses", "pharmacy"];

/* =====================================================
   خواندن امن rating.json
   اگر فایل خالی/خراب/ناقص بود، ساختار پیش‌فرض جایگزین می‌شه
===================================================== */
function readRatingData() {
    try {
        const raw = fs.readFileSync(ratingFile, "utf8");
        const parsed = JSON.parse(raw);
        return {
            doctors: parsed.doctors || {},
            nurses: parsed.nurses || {},
            pharmacy: parsed.pharmacy || {}
        };
    } catch (err) {
        return JSON.parse(JSON.stringify(DEFAULT_RATING_DATA));
    }
}

function writeRatingData(data) {
    fs.writeFileSync(ratingFile, JSON.stringify(data, null, 2), "utf8");
}

/* =====================================================
   ساختار پیش‌فرض shifts.json
   دو گروه: پزشکان، پرستاران
   هرکدوم: { "نام فرد": { "شماره روز": "M"|"E"|"N"|"X" } }
   M=صبح  E=عصر  N=شب  X=پیک شب
===================================================== */
const DEFAULT_SHIFTS_DATA = {
    doctors: {},
    nurses: {}
};

const VALID_SHIFT_GROUPS = ["doctors", "nurses"];
const SINGLE_SHIFT_CODES = ["M", "E", "N", "X"];

/* کد شیفت می‌تونه خالی، یک کد تکی، یا دو کد ترکیبی (مثل "M,E") باشه */
function isValidShiftCode(code) {
    if (code === "") return true;
    if (typeof code !== "string") return false;

    const parts = code.split(",").map(function (p) { return p.trim(); }).filter(Boolean);

    if (parts.length < 1 || parts.length > 2) return false;
    if (!parts.every(function (p) { return SINGLE_SHIFT_CODES.includes(p); })) return false;
    if (new Set(parts).size !== parts.length) return false; // بدون تکرار

    return true;
}

function readShiftsData() {
    try {
        const raw = fs.readFileSync(shiftsFile, "utf8");
        const parsed = JSON.parse(raw);
        return {
            doctors: parsed.doctors || {},
            nurses: parsed.nurses || {}
        };
    } catch (err) {
        return JSON.parse(JSON.stringify(DEFAULT_SHIFTS_DATA));
    }
}

function writeShiftsData(data) {
    fs.writeFileSync(shiftsFile, JSON.stringify(data, null, 2), "utf8");
}

/* =====================================================
   خواندن بدنه‌ی (body) درخواست POST
===================================================== */
function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(new Error("بدنه‌ی درخواست، JSON معتبر نیست."));
            }
        });
        req.on("error", reject);
    });
}

/* =====================================================
   ارسال پاسخ JSON (همراه هدرهای CORS)
===================================================== */
function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify(payload));
}

/* =====================================================
   سرو کردن فایل‌های استاتیک سایت (html, css, js, images...)
===================================================== */
const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
};

function serveStaticFile(req, res) {
    const parsedUrl = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname === "/") {
        pathname = "/index.html";
    }

    const filePath = path.join(SITE_ROOT, pathname);

    // جلوگیری از خروج از پوشه‌ی اصلی سایت (Directory traversal)
    if (!filePath.startsWith(SITE_ROOT)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("دسترسی غیرمجاز");
        return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("صفحه‌ی مورد نظر پیدا نشد (404)");
            } else {
                res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("خطای داخلی سرور");
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
}

/* =====================================================
   سرور اصلی
===================================================== */
const server = http.createServer((req, res) => {

    // درخواست‌های preflight مربوط به CORS
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
        return;
    }

    // -------- GET /rating : دریافت همه‌ی امتیازها --------*/
    if (req.url === "/rating" && req.method === "GET") {
        console.log("REQUEST RATING (GET)");
        const data = readRatingData();
        sendJson(res, 200, data);
        return;
    }

    // -------- POST /rating : ثبت یا ویرایش امتیاز یک نفر --------*/
    if (req.url === "/rating" && req.method === "POST") {
        console.log("REQUEST RATING (POST)");

        readRequestBody(req)
            .then((body) => {
                const { section, id, voterId, ratings } = body;

                if (!VALID_SECTIONS.includes(section)) {
                    sendJson(res, 400, {
                        error: "بخش (section) نامعتبر است. باید یکی از این‌ها باشد: doctors, nurses, pharmacy"
                    });
                    return;
                }
                if (id === undefined || id === null || id === "") {
                    sendJson(res, 400, { error: "شناسه (id) ارسال نشده است." });
                    return;
                }
                if (!voterId || typeof voterId !== "string") {
                    sendJson(res, 400, { error: "شناسه‌ی رأی‌دهنده (voterId) ارسال نشده است." });
                    return;
                }
                if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
                    sendJson(res, 400, { error: "امتیازها (ratings) نامعتبر است." });
                    return;
                }

                const data = readRatingData();
                const key = String(id);

                if (!data[section][key]) {
                    data[section][key] = {};
                }

                // اگر همین voterId قبلاً امتیاز داده باشه، امتیاز قبلی‌اش جایگزین می‌شه (ویرایش)
                // در غیر این صورت، این یک رأی جدیده
                data[section][key][voterId] = ratings;

                writeRatingData(data);

                sendJson(res, 200, { success: true });
            })
            .catch((err) => {
                sendJson(res, 400, { error: err.message });
            });

        return;
    }

    // -------- GET /shifts : دریافت همه‌ی شیفت‌ها --------
    if (req.url === "/shifts" && req.method === "GET") {
        console.log("REQUEST SHIFTS (GET)");
        const data = readShiftsData();
        sendJson(res, 200, data);
        return;
    }

    // -------- POST /shifts/login : فقط بررسی رمز مدیر (بدون تغییر داده) --------
    if (req.url === "/shifts/login" && req.method === "POST") {
        readRequestBody(req)
            .then((body) => {
                if (body.password === SHIFT_ADMIN_PASSWORD) {
                    sendJson(res, 200, { success: true });
                } else {
                    sendJson(res, 401, { error: "رمز عبور اشتباه است." });
                }
            })
            .catch((err) => {
                sendJson(res, 400, { error: err.message });
            });
        return;
    }

    // -------- POST /shifts : ثبت، ویرایش یا پاک‌کردن شیفت یک روز --------
    if (req.url === "/shifts" && req.method === "POST") {
        console.log("REQUEST SHIFTS (POST)");

        readRequestBody(req)
            .then((body) => {
                const { password, group, person, day, code } = body;

                if (password !== SHIFT_ADMIN_PASSWORD) {
                    sendJson(res, 401, { error: "رمز عبور اشتباه است." });
                    return;
                }
                if (!VALID_SHIFT_GROUPS.includes(group)) {
                    sendJson(res, 400, { error: "گروه نامعتبر است. باید doctors یا nurses باشد." });
                    return;
                }
                if (!person || typeof person !== "string") {
                    sendJson(res, 400, { error: "نام فرد ارسال نشده است." });
                    return;
                }

                const dayNum = Number(day);
                if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
                    sendJson(res, 400, { error: "روز نامعتبر است (باید بین ۱ تا ۳۱ باشد)." });
                    return;
                }
                if (!isValidShiftCode(code)) {
                    sendJson(res, 400, { error: "کد شیفت نامعتبر است." });
                    return;
                }

                const data = readShiftsData();
                if (!data[group][person]) {
                    data[group][person] = {};
                }

                if (code === "") {
                    delete data[group][person][dayNum];
                } else {
                    data[group][person][dayNum] = code;
                }

                writeShiftsData(data);
                sendJson(res, 200, { success: true });
            })
            .catch((err) => {
                sendJson(res, 400, { error: err.message });
            });

        return;
    }

    // -------- هر مسیر دیگه‌ای: فایل استاتیک سایت --------
    serveStaticFile(req, res);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
