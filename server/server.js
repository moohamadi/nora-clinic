const http = require("http");
const path = require("path");
const { MongoClient } = require("mongodb");

/* =====================================================
   مسیرها
===================================================== */
const SITE_ROOT = path.join(__dirname, "..");

/* =====================================================
   اتصال به MongoDB
   ⚠️ این مقدار رو از داشبورد Atlas کپی کن
   و در Render به عنوان Environment Variable بذار (اسم: MONGO_URI)
===================================================== */
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "nora_clinic";

let db;
let shiftsCollection;
let ratingCollection;

/* =====================================================
   رمز عبور مدیر
===================================================== */
const SHIFT_ADMIN_PASSWORD = "shiftlooksclear1!";

/* =====================================================
   ساختار پیش‌فرض
===================================================== */
const DEFAULT_RATING_DATA = {
    doctors: {},
    nurses: {},
    pharmacy: {}
};

const VALID_SECTIONS = ["doctors", "nurses", "pharmacy"];
const VALID_SHIFT_GROUPS = ["doctors", "nurses"];
const SINGLE_SHIFT_CODES = ["M", "E", "N", "X"];

// ماه/سالی که داده‌های قدیمی (سند "main") قبل از اضافه شدن قابلیت
// ماه‌بندی، برای آن ثبت شده بودند — فقط برای migration یک‌بارهٔ اولیه استفاده می‌شه.
const LEGACY_DATA_MONTH_ID = "1405-6"; // شهریور ۱۴۰۵

function isValidShiftCode(code) {
    if (code === "") return true;
    if (typeof code !== "string") return false;
    const parts = code.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length < 1 || parts.length > 2) return false;
    if (!parts.every(p => SINGLE_SHIFT_CODES.includes(p))) return false;
    if (new Set(parts).size !== parts.length) return false;
    return true;
}

/* =====================================================
   ساخت شناسه‌ی سند شیفتِ یک ماه مشخص، مثلاً "1405-7"
   اگر year/month نامعتبر یا ارسال‌نشده بود، null برمی‌گردونه
   (یعنی به‌جای سند ماهانه، همون سند قدیمی "main" استفاده بشه)
===================================================== */
function buildShiftMonthId(year, month) {
    const y = Number(year);
    const m = Number(month);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
        return null;
    }
    return `${y}-${m}`;
}

/* =====================================================
   اتصال به دیتابیس (فقط یک بار اجرا میشه)
===================================================== */
async function connectToDatabase() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log("✅ به MongoDB متصل شد");

        db = client.db(DB_NAME);
        shiftsCollection = db.collection("shifts");
        ratingCollection = db.collection("ratings");

        // ایجاد index برای جستجوی سریع‌تر
        await shiftsCollection.createIndex({ group: 1, person: 1 });
        await ratingCollection.createIndex({ section: 1, id: 1 });

    } catch (err) {
        console.error("❌ خطا در اتصال به MongoDB:", err);
        process.exit(1);
    }
}

/* =====================================================
   انتقال یک‌بارهٔ داده‌های قدیمیِ شیفت (سند "main")
   به سند ماهانه‌ی مربوطه — تا داده‌های فعلی از دست نرن
===================================================== */
async function migrateLegacyShiftsDocument() {
    try {
        const legacy = await shiftsCollection.findOne({ _id: "main" });
        if (!legacy) return;

        const alreadyMigrated = await shiftsCollection.findOne({ _id: LEGACY_DATA_MONTH_ID });
        if (alreadyMigrated) return;

        const { _id, ...rest } = legacy;
        await shiftsCollection.insertOne({ _id: LEGACY_DATA_MONTH_ID, ...rest });
        console.log(`✅ داده‌های قدیمی شیفت به سند ماه «${LEGACY_DATA_MONTH_ID}» منتقل شدند`);
    } catch (err) {
        console.error("خطا در انتقال داده‌های قدیمی شیفت:", err);
    }
}

/* =====================================================
   حذف فیلد _id قبل از $set
   (چون _id غیرقابل تغییره و MongoDB با ست کردنش دوباره خطا میده)
===================================================== */
function stripId(data) {
    const { _id, ...rest } = data;
    return rest;
}

/* =====================================================
   خواندن/نوشتن شیفت‌ها از MongoDB (مخصوص یک ماه مشخص)
   monthId = null یعنی برگشت به سند قدیمیِ "main" (سازگاری با نسخه‌ی قبلی)
===================================================== */
async function readShiftsData(monthId) {
    try {
        const id = monthId || "main";
        const data = await shiftsCollection.findOne({ _id: id });
        return {
            doctors: (data && data.doctors) || {},
            nurses: (data && data.nurses) || {}
        };
    } catch (err) {
        console.error("خطا در خواندن شیفت‌ها:", err);
        return { doctors: {}, nurses: {} };
    }
}

async function writeShiftsData(monthId, data) {
    try {
        const id = monthId || "main";
        await shiftsCollection.updateOne(
            { _id: id },
            { $set: stripId(data) },
            { upsert: true }
        );
    } catch (err) {
        console.error("خطا در نوشتن شیفت‌ها:", err);
    }
}

/* =====================================================
   خواندن/نوشتن امتیازها از MongoDB
===================================================== */
async function readRatingData() {
    try {
        const data = await ratingCollection.findOne({ _id: "main" });
        return {
            doctors: (data && data.doctors) || {},
            nurses: (data && data.nurses) || {},
            pharmacy: (data && data.pharmacy) || {}
        };
    } catch (err) {
        console.error("خطا در خواندن امتیازها:", err);
        return JSON.parse(JSON.stringify(DEFAULT_RATING_DATA));
    }
}

async function writeRatingData(data) {
    try {
        await ratingCollection.updateOne(
            { _id: "main" },
            { $set: stripId(data) },
            { upsert: true }
        );
    } catch (err) {
        console.error("خطا در نوشتن امتیازها:", err);
    }
}

/* =====================================================
   خواندن بدنه‌ی درخواست POST
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
   ارسال پاسخ JSON
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
   سرو کردن فایل‌های استاتیک
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
    if (pathname === "/") pathname = "/index.html";

    const filePath = path.join(SITE_ROOT, pathname);
    if (!filePath.startsWith(SITE_ROOT)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("دسترسی غیرمجاز");
        return;
    }

    require("fs").readFile(filePath, (err, content) => {
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
const server = http.createServer(async (req, res) => {
    // آدرس و query string رو یک‌بار همین اول جدا می‌کنیم
    // (چون حالا GET /shifts هم می‌تونه با ?year=...&month=... بیاد)
    const parsedUrl = new URL(req.url, "http://localhost");
    const pathname = parsedUrl.pathname;

    // CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
        return;
    }

    // -------- GET /rating --------
    if (pathname === "/rating" && req.method === "GET") {
        console.log("REQUEST RATING (GET)");
        const data = await readRatingData();
        sendJson(res, 200, data);
        return;
    }

    // -------- POST /rating --------
    if (pathname === "/rating" && req.method === "POST") {
        console.log("REQUEST RATING (POST)");
        try {
            const body = await readRequestBody(req);
            const { section, id, voterId, ratings } = body;

            if (!VALID_SECTIONS.includes(section)) {
                sendJson(res, 400, { error: "بخش نامعتبر است" });
                return;
            }
            if (id === undefined || id === null || id === "") {
                sendJson(res, 400, { error: "شناسه ارسال نشده است" });
                return;
            }
            if (!voterId || typeof voterId !== "string") {
                sendJson(res, 400, { error: "شناسه‌ی رأی‌دهنده ارسال نشده است" });
                return;
            }
            if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
                sendJson(res, 400, { error: "امتیازها نامعتبر است" });
                return;
            }

            const data = await readRatingData();
            const key = String(id);
            if (!data[section][key] || Array.isArray(data[section][key])) {
                data[section][key] = {};
            }
            data[section][key][voterId] = ratings;
            await writeRatingData(data);
            sendJson(res, 200, { success: true });
        } catch (err) {
            sendJson(res, 400, { error: err.message });
        }
        return;
    }

    // -------- GET /shifts?year=1405&month=7 --------
    if (pathname === "/shifts" && req.method === "GET") {
        const year = parsedUrl.searchParams.get("year");
        const month = parsedUrl.searchParams.get("month");
        const monthId = buildShiftMonthId(year, month);

        console.log("REQUEST SHIFTS (GET)", monthId || "main (بدون year/month — حالت قدیمی)");
        const data = await readShiftsData(monthId);
        sendJson(res, 200, data);
        return;
    }

    // -------- POST /shifts/login --------
    if (pathname === "/shifts/login" && req.method === "POST") {
        try {
            const body = await readRequestBody(req);
            if (body.password === SHIFT_ADMIN_PASSWORD) {
                sendJson(res, 200, { success: true });
            } else {
                sendJson(res, 401, { error: "رمز عبور اشتباه است" });
            }
        } catch (err) {
            sendJson(res, 400, { error: err.message });
        }
        return;
    }

    // -------- POST /shifts --------
    if (pathname === "/shifts" && req.method === "POST") {
        console.log("REQUEST SHIFTS (POST)");
        try {
            const body = await readRequestBody(req);
            const { password, year, month, group, person, day, code } = body;

            if (password !== SHIFT_ADMIN_PASSWORD) {
                sendJson(res, 401, { error: "رمز عبور اشتباه است" });
                return;
            }
            if (!VALID_SHIFT_GROUPS.includes(group)) {
                sendJson(res, 400, { error: "گروه نامعتبر است" });
                return;
            }
            if (!person || typeof person !== "string") {
                sendJson(res, 400, { error: "نام فرد ارسال نشده است" });
                return;
            }
            const dayNum = Number(day);
            if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
                sendJson(res, 400, { error: "روز نامعتبر است" });
                return;
            }
            if (!isValidShiftCode(code)) {
                sendJson(res, 400, { error: "کد شیفت نامعتبر است" });
                return;
            }

            const monthId = buildShiftMonthId(year, month);

            const data = await readShiftsData(monthId);
            if (!data[group][person]) {
                data[group][person] = {};
            }
            if (code === "") {
                delete data[group][person][dayNum];
            } else {
                data[group][person][dayNum] = code;
            }
            await writeShiftsData(monthId, data);
            sendJson(res, 200, { success: true });
        } catch (err) {
            sendJson(res, 400, { error: err.message });
        }
        return;
    }

    // -------- فایل استاتیک --------
    serveStaticFile(req, res);
});

/* =====================================================
   راه‌اندازی سرور
===================================================== */
const PORT = process.env.PORT || 3000;

// اول به دیتابیس وصل شو، بعد داده‌ی قدیمی رو منتقل کن، بعد سرور رو راه‌اندازی کن
connectToDatabase()
    .then(() => migrateLegacyShiftsDocument())
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    });
