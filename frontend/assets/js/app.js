// frontend/assets/js/app.js - Tích hợp Quản lý Lịch sử thi toàn trường, Lọc học viên & Bảng xếp hạng

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentAuthToken = localStorage.getItem('token') || null;

let tempQuestions = [];
let studentExamsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    renderAppView();
});

export function renderAppView() {
    const appView = document.getElementById('app-view');
    const userInfoHeader = document.getElementById('user-info');
    if (!appView) return;

    if (!currentUser) {
        if (userInfoHeader) userInfoHeader.innerHTML = '';
        renderLoginView(appView);
    } else {
        if (userInfoHeader) {
            userInfoHeader.innerHTML = `
                <span class="mr-2">Xin chào, <b class="text-blue-600 dark:text-blue-400">${currentUser.fullname || currentUser.username}</b> (${currentUser.role === 'admin' ? 'Admin 👑' : 'Học viên 🎓'})</span>
                <button id="logout-btn" class="text-red-500 hover:text-red-700 font-semibold text-xs border border-red-200 px-2 py-1 rounded">Đăng xuất</button>
            `;
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
        }

        if (currentUser.role === 'admin') {
            renderAdminDashboard(appView);
        } else {
            renderStudentDashboard(appView);
        }
    }
}

// --- 1. ĐĂNG NHẬP ---
function renderLoginView(container) {
    container.innerHTML = `
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg mt-10 border dark:border-gray-700">
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Xin mời đăng nhập</h2>
            <div id="auth-message" class="hidden mb-4 p-3 rounded-lg text-sm"></div>
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                    <input type="text" id="username" placeholder="Nhập tên đăng nhập" required class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input type="password" id="password" placeholder="Nhập mật khẩu" required class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition shadow-md">Đăng Nhập</button>
            </form>
            <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Chưa có tài khoản? <button id="go-to-register" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1">Đăng ký ngay</button>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
    document.getElementById('go-to-register').addEventListener('click', () => renderRegisterView(container));
}

// --- 2. ĐĂNG KÝ ---
function renderRegisterView(container) {
    container.innerHTML = `
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg mt-10 border dark:border-gray-700">
            <h2 class="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-white">Đăng Ký Học Viên</h2>
            <div id="auth-message" class="hidden mb-4 p-3 rounded-lg text-sm"></div>
            <form id="register-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Họ và tên</label>
                    <input type="text" id="reg-fullname" placeholder="Nguyễn Văn A" required class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                    <input type="text" id="reg-username" placeholder="nguyenvana" required class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input type="password" id="reg-password" placeholder="Mật khẩu" required class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition shadow-md">Xác Nhận Đăng Ký</button>
            </form>
            <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Đã có tài khoản? <button id="go-to-login" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1">Đăng nhập</button>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', handleRegisterSubmit);
    document.getElementById('go-to-login').addEventListener('click', () => renderLoginView(container));
}

// --- 3. BẢNG ĐIỀU KHIỂN ADMIN (Đã thêm Tab Quản lý lịch sử toàn trường & Bảng xếp hạng) ---
function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gray-800 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2"><i class="fa-solid fa-user-shield text-amber-400"></i> Quản Trị Hệ Thống Đề Thi</h2>
                    <p class="text-gray-300 text-sm mt-1">Quản lý kho đề thi và giám sát kết quả thi của toàn bộ học viên.</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <button id="admin-tab-exams-btn" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow transition">Quản Lý Đề Thi</button>
                    <button id="admin-tab-history-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-sm shadow transition">Lịch Sử Toàn Trường 📊</button>
                    <button id="admin-tab-leaderboard-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-sm shadow transition">Bảng Xếp Hạng 🏆</button>
                </div>
            </div>

            <div id="admin-main-content" class="space-y-6">
                <!-- Nội dung các tab Admin sẽ render ở đây -->
            </div>
        </div>

        <!-- MODAL TẠO ĐỀ THI MỚI -->
        <div id="create-exam-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 hidden">
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto relative border dark:border-gray-700">
                <button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold">✕</button>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-file-circle-plus text-blue-600"></i> Tạo Đề Thi Mới
                </h3>
                <form id="create-exam-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Mã đề thi <span class="text-red-500">*</span></label>
                            <input type="text" id="exam-code" placeholder="VD: TOAN101" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Môn học <span class="text-red-500">*</span></label>
                            <select id="exam-subject" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                                <option value="Toán">Toán</option>
                                <option value="Anh">Anh</option>
                                <option value="Văn">Văn</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Khối Lớp <span class="text-red-500">*</span></label>
                            <select id="exam-grade" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                                <option value="Lớp 1">Lớp 1</option>
                                <option value="Lớp 2">Lớp 2</option>
                                <option value="Lớp 3">Lớp 3</option>
                                <option value="Lớp 4">Lớp 4</option>
                                <option value="Lớp 5">Lớp 5</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Thời gian (Phút)</label>
                            <input type="number" id="exam-time" value="30" min="5" max="180" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                        </div>
                    </div>
                    <div class="border-t pt-4 dark:border-gray-700">
                        <h4 class="font-bold text-base text-gray-800 dark:text-gray-200 mb-2">Danh sách câu hỏi (<span id="question-count">0</span>)</h4>
                        <div id="questions-list" class="space-y-3 max-h-60 overflow-y-auto pr-1">
                            <p class="text-sm text-gray-400 italic">Chưa có câu hỏi nào.</p>
                        </div>
                    </div>
                    <div class="pt-4 flex justify-end gap-3 border-t dark:border-gray-700">
                        <button type="button" id="btn-cancel-modal" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">Hủy</button>
                        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition">Lưu Đề Thi</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('admin-tab-exams-btn').addEventListener('click', (e) => {
        setActiveAdminTab(e.target);
        loadAdminExamsTab();
    });
    document.getElementById('admin-tab-history-btn').addEventListener('click', (e) => {
        setActiveAdminTab(e.target);
        loadAdminHistoryTab();
    });
    document.getElementById('admin-tab-leaderboard-btn').addEventListener('click', (e) => {
        setActiveAdminTab(e.target);
        loadLeaderboardTab('admin-main-content');
    });

    loadAdminExamsTab();
}

function setActiveAdminTab(activeBtn) {
    ['admin-tab-exams-btn', 'admin-tab-history-btn', 'admin-tab-leaderboard-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.className = "px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-sm shadow transition";
    });
    if (activeBtn) activeBtn.className = "px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow transition";
}

// Admin Tab 1: Quản lý đề thi
function loadAdminExamsTab() {
    const container = document.getElementById('admin-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
            <div class="flex gap-4 flex-wrap">
                <div>
                    <label class="text-xs font-semibold text-gray-500 block mb-1">Môn học</label>
                    <select id="filter-subject" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                        <option value="">-- Tất cả các môn --</option>
                        <option value="Toán">Toán</option>
                        <option value="Anh">Anh</option>
                        <option value="Văn">Văn</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs font-semibold text-gray-500 block mb-1">Lớp học</label>
                    <select id="filter-grade" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                        <option value="">-- Tất cả các lớp --</option>
                        <option value="Lớp 1">Lớp 1</option>
                        <option value="Lớp 2">Lớp 2</option>
                        <option value="Lớp 3">Lớp 3</option>
                        <option value="Lớp 4">Lớp 4</option>
                        <option value="Lớp 5">Lớp 5</option>
                    </select>
                </div>
            </div>
            <button id="open-create-exam-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition shadow flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Tạo Đề Thi Mới
            </button>
        </div>
        <div id="exam-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-8 text-gray-500">Đang tải danh sách đề thi...</div>
        </div>
    `;

    document.getElementById('open-create-exam-btn').addEventListener('click', () => {
        tempQuestions = [];
        renderTempQuestions();
        document.getElementById('create-exam-modal')?.classList.remove('hidden');
    });

    document.getElementById('filter-subject')?.addEventListener('change', fetchExamsListForAdmin);
    document.getElementById('filter-grade')?.addEventListener('change', fetchExamsListForAdmin);

    setupAdminModalEvents();
    fetchExamsListForAdmin();
}

async function fetchExamsListForAdmin() {
    const container = document.getElementById('exam-list-container');
    const subject = document.getElementById('filter-subject')?.value || '';
    const grade = document.getElementById('filter-grade')?.value || '';
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/exams?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`);
        const data = await res.json();
        if (data.success && data.exams.length > 0) {
            container.innerHTML = data.exams.map(exam => `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2.5 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">${exam.examCode}</span>
                            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">${exam.grade}</span>
                        </div>
                        <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-2">${exam.title || 'Đề thi ' + exam.subject}</h3>
                        <div class="text-xs text-gray-500 space-y-1 mb-4">
                            <p>Môn: <b class="text-gray-700 dark:text-gray-300">${exam.subject}</b></p>
                            <p>Thời gian: <b>${exam.timeLimit} phút</b></p>
                            <p>Số câu hỏi: <b>${exam.questions ? exam.questions.length : 0} câu</b></p>
                        </div>
                    </div>
                    <div class="pt-3 border-t dark:border-gray-700 flex justify-end">
                        <button onclick="window.deleteExam('${exam.examCode}')" class="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50">
                            <i class="fa-solid fa-trash"></i> Xóa đề thi
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Chưa có đề thi nào phù hợp.</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi tải danh sách đề thi!</div>`;
    }
}

function setupAdminModalEvents() {
    const modal = document.getElementById('create-exam-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('btn-cancel-modal');
    [closeBtn, cancelBtn].forEach(btn => btn?.addEventListener('click', () => modal?.classList.add('hidden')));

    document.getElementById('create-exam-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const examCode = document.getElementById('exam-code').value.trim();
        const subject = document.getElementById('exam-subject').value;
        const grade = document.getElementById('exam-grade').value;
        const timeLimit = document.getElementById('exam-time').value;

        if (tempQuestions.length === 0) { alert('Vui lòng thêm ít nhất một câu hỏi!'); return; }

        try {
            const res = await fetch(`${API_URL}/exams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examCode, title: `Đề thi ${subject} - ${grade}`, subject, grade, timeLimit, questions: tempQuestions })
            });
            const data = await res.json();
            if (data.success) {
                alert('Tạo đề thi mới thành công!');
                modal?.classList.add('hidden');
                document.getElementById('create-exam-form').reset();
                tempQuestions = [];
                fetchExamsListForAdmin();
            } else { alert(data.message || 'Thất bại!'); }
        } catch (err) { alert('Lỗi kết nối Server!'); }
    });
}

function renderTempQuestions() {
    const list = document.getElementById('questions-list');
    const countSpan = document.getElementById('question-count');
    if (!list) return;
    if (countSpan) countSpan.innerText = tempQuestions.length;
    if (tempQuestions.length === 0) { list.innerHTML = `<p class="text-sm text-gray-400 italic">Chưa có câu hỏi.</p>`; return; }
    list.innerHTML = tempQuestions.map((q, idx) => `
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs relative">
            <p class="font-bold">Câu ${idx + 1}: ${q.question}</p>
            <p class="text-emerald-600 font-bold mt-1">Đáp án đúng: ${q.answer}</p>
        </div>
    `).join('');
}

window.deleteExam = async (code) => {
    if (!confirm(`Xóa đề thi ${code}?`)) return;
    const res = await fetch(`${API_URL}/exams/${code}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchExamsListForAdmin();
};

// Admin Tab 2: Lịch sử thi toàn trường & Lọc theo tên học viên
async function loadAdminHistoryTab() {
    const container = document.getElementById('admin-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 space-y-4">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fa-solid fa-users-rectangle text-blue-600"></i> Lịch Sử Thi Toàn Trường
                </h3>
                <div class="w-full md:w-80">
                    <input type="text" id="admin-search-input" placeholder="Tìm theo tên học viên, username, mã đề..." class="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            <div id="admin-history-list" class="space-y-3">
                <p class="text-sm text-gray-500 py-4 text-center">Đang tải lịch sử thi...</p>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('admin-search-input');
    searchInput?.addEventListener('input', (e) => {
        fetchAdminHistories(e.target.value.trim());
    });

    fetchAdminHistories('');
}

async function fetchAdminHistories(searchQuery) {
    const historyListContainer = document.getElementById('admin-history-list');
    if (!historyListContainer) return;

    try {
        const res = await fetch(`${API_URL}/results?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();

        if (data.success && data.results.length > 0) {
            historyListContainer.innerHTML = data.results.map((item) => {
                const dateStr = new Date(item.createdAt).toLocaleString('vi-VN');
                const isPassed = item.score >= 5;
                return `
                    <div class="p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-xs rounded">Học viên: ${item.fullname || item.username} (${item.username})</span>
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded">Đề: ${item.examCode}</span>
                            </div>
                            <h4 class="font-bold text-base text-gray-800 dark:text-white">${item.examTitle}</h4>
                            <p class="text-xs text-gray-500">Môn: <b>${item.subject}</b> | Khối: <b>${item.grade}</b> | Nộp lúc: ${dateStr}</p>
                        </div>
                        <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0">
                            <div class="text-right">
                                <p class="text-xs text-gray-400">Câu đúng</p>
                                <p class="font-bold text-sm">${item.correctCount} / ${item.totalQuestions}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-gray-400">Điểm số</p>
                                <p class="text-lg font-black text-blue-600">${item.score}</p>
                            </div>
                            <div>
                                <span class="px-3 py-1 rounded-full text-xs font-bold ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                                    ${isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            historyListContainer.innerHTML = `<div class="text-center py-10 text-gray-400">Không tìm thấy kết quả phù hợp.</div>`;
        }
    } catch (err) {
        historyListContainer.innerHTML = `<div class="text-center py-10 text-red-500">Không thể tải dữ liệu lịch sử!</div>`;
    }
}


// --- 4. GIAO DIỆN HỌC VIÊN & BẢNG XẾP HẠNG CHUNG ---
function renderStudentDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold">Chào mừng học viên, ${currentUser.fullname || currentUser.username}! 🎓</h2>
                    <p class="text-blue-100 text-sm mt-1">Làm bài thi, tra cứu lịch sử cá nhân và đua top bảng vàng thành tích.</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <button id="tab-exams-btn" class="px-4 py-2 bg-white text-blue-600 font-bold rounded-xl text-sm shadow transition">Danh Sách Đề Thi</button>
                    <button id="tab-history-btn" class="px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition">Lịch Sử Thi 📊</button>
                    <button id="tab-leaderboard-btn" class="px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition">Bảng Xếp Hạng 🏆</button>
                </div>
            </div>

            <div id="student-main-content" class="space-y-6"></div>
        </div>
    `;

    document.getElementById('tab-exams-btn').addEventListener('click', (e) => {
        setActiveStudentTab(e.target);
        loadExamsTab();
    });
    document.getElementById('tab-history-btn').addEventListener('click', (e) => {
        setActiveStudentTab(e.target);
        loadExamHistoryTab();
    });
    document.getElementById('tab-leaderboard-btn').addEventListener('click', (e) => {
        setActiveStudentTab(e.target);
        loadLeaderboardTab('student-main-content');
    });

    loadExamsTab();
}

function setActiveStudentTab(activeBtn) {
    ['tab-exams-btn', 'tab-history-btn', 'tab-leaderboard-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.className = "px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition";
    });
    if (activeBtn) activeBtn.className = "px-4 py-2 bg-white text-blue-600 font-bold rounded-xl text-sm shadow transition";
}

// Bảng Xếp Hạng (Dùng chung cho cả Admin & Học viên)
async function loadLeaderboardTab(targetContainerId) {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border dark:border-gray-700 space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <i class="fa-solid fa-trophy text-amber-500"></i> Bảng Xếp Hạng Thành Tích Học Viên
                    </h3>
                    <p class="text-xs text-gray-500 mt-1">Xếp hạng theo điểm số cao nhất và thời gian hoàn thành bài thi sớm nhất.</p>
                </div>
            </div>
            <div id="leaderboard-ranking-list" class="overflow-x-auto">
                <p class="text-sm text-gray-500 py-6 text-center">Đang tải bảng xếp hạng...</p>
            </div>
        </div>
    `;

    const rankingListEl = document.getElementById('leaderboard-ranking-list');
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();

        if (data.success && data.rankings.length > 0) {
            rankingListEl.innerHTML = `
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b dark:border-gray-700 text-xs text-gray-400 uppercase">
                            <th class="py-3 px-4">Hạng</th>
                            <th class="py-3 px-4">Học viên</th>
                            <th class="py-3 px-4">Đề thi</th>
                            <th class="py-3 px-4">Môn</th>
                            <th class="py-3 px-4 text-center">Đúng</th>
                            <th class="py-3 px-4 text-right">Điểm số</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y dark:divide-gray-700 text-sm">
                        ${data.rankings.map((item, idx) => {
                            let badgeColor = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
                            if (idx === 0) badgeColor = "bg-amber-100 text-amber-800 font-black";
                            else if (idx === 1) badgeColor = "bg-slate-200 text-slate-800 font-bold";
                            else if (idx === 2) badgeColor = "bg-amber-700/20 text-amber-900 font-bold";

                            return `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <td class="py-3 px-4">
                                        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${badgeColor}">
                                            ${idx + 1}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 font-bold text-gray-800 dark:text-white">${item.fullname || item.username}</td>
                                    <td class="py-3 px-4"><span class="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">${item.examCode}</span></td>
                                    <td class="py-3 px-4">${item.subject || 'N/A'}</td>
                                    <td class="py-3 px-4 text-center font-semibold">${item.correctCount}/${item.totalQuestions}</td>
                                    <td class="py-3 px-4 text-right font-black text-blue-600 text-base">${item.score}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            rankingListEl.innerHTML = `<div class="text-center py-10 text-gray-400">Chưa có dữ liệu xếp hạng nào.</div>`;
        }
    } catch (e) {
        rankingListEl.innerHTML = `<div class="text-center py-10 text-red-500">Không thể tải bảng xếp hạng!</div>`;
    }
}

// Student Tab 1: Danh sách đề thi
function loadExamsTab() {
    const container = document.getElementById('student-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex gap-4 flex-wrap items-center">
            <div>
                <label class="text-xs font-semibold text-gray-500 block mb-1">Môn học</label>
                <select id="student-filter-subject" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                    <option value="">-- Tất cả --</option>
                    <option value="Toán">Toán</option>
                    <option value="Anh">Anh</option>
                    <option value="Văn">Văn</option>
                </select>
            </div>
            <div>
                <label class="text-xs font-semibold text-gray-500 block mb-1">Khối lớp</label>
                <select id="student-filter-grade" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                    <option value="">-- Tất cả --</option>
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                </select>
            </div>
        </div>
        <div id="student-exam-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-10 text-gray-500">Đang tải đề thi...</div>
        </div>
    `;

    document.getElementById('student-filter-subject')?.addEventListener('change', fetchExamsForStudent);
    document.getElementById('student-filter-grade')?.addEventListener('change', fetchExamsForStudent);
    fetchExamsForStudent();
}

async function fetchExamsForStudent() {
    const container = document.getElementById('student-exam-list');
    const subject = document.getElementById('student-filter-subject')?.value || '';
    const grade = document.getElementById('student-filter-grade')?.value || '';
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/exams?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`);
        const data = await res.json();
        if (data.success && data.exams.length > 0) {
            studentExamsCache = data.exams;
            container.innerHTML = data.exams.map(exam => `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">${exam.examCode}</span>
                            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">${exam.grade}</span>
                        </div>
                        <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-2">${exam.title || 'Đề thi ' + exam.subject}</h3>
                        <div class="text-xs text-gray-500 space-y-1 mb-4">
                            <p>Môn: <b class="text-gray-700 dark:text-gray-300">${exam.subject}</b></p>
                            <p>Thời gian: <b>${exam.timeLimit} phút</b></p>
                            <p>Số câu: <b>${exam.questions ? exam.questions.length : 0} câu</b></p>
                        </div>
                    </div>
                    <button onclick="window.startExam('${exam.examCode}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition shadow flex items-center justify-center gap-2">
                        <i class="fa-solid fa-pen-to-square"></i> Bắt đầu làm bài
                    </button>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Không có đề thi nào khả dụng.</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi kết nối khi tải đề thi!</div>`;
    }
}

// Student Tab 2: Lịch sử thi cá nhân
async function loadExamHistoryTab() {
    const container = document.getElementById('student-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border dark:border-gray-700 space-y-4">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-blue-600"></i> Lịch Sử Làm Bài Của Tôi
            </h3>
            <div id="history-list-container" class="space-y-3">
                <p class="text-sm text-gray-500 py-4 text-center">Đang tải lịch sử thi...</p>
            </div>
        </div>
    `;

    const historyContainer = document.getElementById('history-list-container');
    try {
        const res = await fetch(`${API_URL}/results?username=${encodeURIComponent(currentUser.username)}`);
        const data = await res.json();

        if (data.success && data.results.length > 0) {
            historyContainer.innerHTML = data.results.map((item) => {
                const dateStr = new Date(item.createdAt).toLocaleString('vi-VN');
                const isPassed = item.score >= 5;
                return `
                    <div class="p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded">${item.examCode}</span>
                                <h4 class="font-bold text-base text-gray-800 dark:text-white">${item.examTitle}</h4>
                            </div>
                            <p class="text-xs text-gray-500">Môn: <b>${item.subject}</b> | Khối: <b>${item.grade}</b> | Thời gian: ${dateStr}</p>
                        </div>
                        <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0">
                            <div class="text-right">
                                <p class="text-xs text-gray-400">Số câu đúng</p>
                                <p class="font-bold text-sm">${item.correctCount} / ${item.totalQuestions}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-gray-400">Điểm số</p>
                                <p class="text-lg font-black text-blue-600">${item.score}</p>
                            </div>
                            <div>
                                <span class="px-3 py-1 rounded-full text-xs font-bold ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                                    ${isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            historyContainer.innerHTML = `<div class="text-center py-10 text-gray-400">Bạn chưa có lịch sử làm bài thi nào.</div>`;
        }
    } catch (err) {
        historyContainer.innerHTML = `<div class="text-center py-10 text-red-500">Không thể tải dữ liệu lịch sử thi!</div>`;
    }
}

// --- GIAO DIỆN LÀM BÀI THI ---
window.startExam = function(examCode) {
    const exam = studentExamsCache.find(e => e.examCode === examCode);
    if (!exam) { alert('Không tìm thấy thông tin đề thi!'); return; }
    renderExamInterface(exam);
};

function renderExamInterface(exam) {
    const container = document.getElementById('app-view');
    let timeLeft = (exam.timeLimit || 30) * 60;
    let userAnswers = {};

    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6 pb-12">
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex justify-between items-center sticky top-4 z-40">
                <div>
                    <h2 class="font-bold text-lg text-gray-800 dark:text-white">${exam.title || exam.examCode}</h2>
                    <p class="text-xs text-gray-500">Môn: ${exam.subject} | Tổng câu: ${exam.questions.length}</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="px-4 py-2 bg-red-100 text-red-700 font-mono font-bold text-lg rounded-xl flex items-center gap-2">
                        <i class="fa-solid fa-stopwatch"></i> <span id="time-countdown">--:--</span>
                    </div>
                    <button id="btn-submit-exam" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition">Nộp Bài</button>
                </div>
            </div>

            <div class="space-y-4">
                ${exam.questions.map((q, qIndex) => `
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 space-y-3">
                        <p class="font-bold text-gray-900 dark:text-white text-base">
                            <span class="text-blue-600 mr-1">Câu ${qIndex + 1}:</span>${q.question}
                        </p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            ${['A', 'B', 'C', 'D'].map((optLabel, optIdx) => {
                                const optText = q.options[optIdx];
                                if (!optText) return '';
                                return `
                                    <label class="flex items-start gap-3 p-3 border rounded-xl dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer transition">
                                        <input type="radio" name="question-${qIndex}" value="${optLabel}" data-qindex="${qIndex}" class="mt-1 text-blue-600">
                                        <span class="text-sm text-gray-700 dark:text-gray-300"><b>${optLabel}.</b> ${optText}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', (e) => {
            userAnswers[e.target.getAttribute('data-qindex')] = e.target.value;
        });
    });

    const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Hết giờ làm bài! Hệ thống tự động nộp bài.');
            processAndSubmitExam(exam, userAnswers);
            return;
        }
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const timeEl = document.getElementById('time-countdown');
        if (timeEl) timeEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);

    const handleSubmitAction = () => {
        if (Object.keys(userAnswers).length < exam.questions.length) {
            if (!confirm('Bạn chưa trả lời hết các câu hỏi. Vẫn muốn nộp bài?')) return;
        } else {
            if (!confirm('Xác nhận nộp bài thi?')) return;
        }
        clearInterval(timerInterval);
        processAndSubmitExam(exam, userAnswers);
    };

    document.getElementById('btn-submit-exam')?.addEventListener('click', handleSubmitAction);
}

async function processAndSubmitExam(exam, userAnswers) {
    let correctCount = 0;
    const totalQuestions = exam.questions.length;

    exam.questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.answer) correctCount++;
    });

    const score = parseFloat(((correctCount / totalQuestions) * 10).toFixed(2));

    try {
        await fetch(`${API_URL}/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser.username,
                examCode: exam.examCode,
                examTitle: exam.title || 'Đề thi ' + exam.subject,
                subject: exam.subject,
                grade: exam.grade,
                score,
                correctCount,
                totalQuestions
            })
        });
    } catch (err) {
        console.error('Lỗi khi lưu kết quả:', err);
    }

    renderResultScreen(exam, userAnswers, correctCount, score, totalQuestions);
}

function renderResultScreen(exam, userAnswers, correctCount, score, totalQuestions) {
    const container = document.getElementById('app-view');
    container.innerHTML = `
        <div class="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700 space-y-6 mt-6">
            <div class="text-center space-y-2">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full text-3xl mb-2">
                    <i class="fa-solid fa-award"></i>
                </div>
                <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Kết Quả Bài Thi</h2>
                <p class="text-gray-500 text-sm">Đề thi: ${exam.title || exam.examCode}</p>
            </div>

            <div class="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                <div>
                    <p class="text-xs text-gray-500">Số câu đúng</p>
                    <p class="text-2xl font-bold text-emerald-600">${correctCount} / ${totalQuestions}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500">Điểm số</p>
                    <p class="text-3xl font-black text-blue-600">${score}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500">Trạng thái</p>
                    <p class="text-lg font-bold ${score >= 5 ? 'text-emerald-600' : 'text-red-500'}">${score >= 5 ? 'Đạt ✅' : 'Chưa đạt ❌'}</p>
                </div>
            </div>

            <div class="pt-4 flex justify-center">
                <button id="btn-back-dashboard" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow">
                    Quay về Trang Chủ
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-back-dashboard')?.addEventListener('click', () => renderAppView());
}

// --- XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ CHUNG ---
async function handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const msgBox = document.getElementById('auth-message');
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
            currentUser = { username: data.username, fullname: data.fullname, role: data.role };
            currentAuthToken = data.token;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('token', currentAuthToken);
            renderAppView();
        } else {
            showNotification(msgBox, data.message || 'Sai tên đăng nhập hoặc mật khẩu!', 'error');
        }
    } catch (err) {
        showNotification(msgBox, 'Không thể kết nối đến Backend!', 'error');
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const fullname = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const msgBox = document.getElementById('auth-message');
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, username, password })
        });
        const data = await response.json();
        if (data.success) {
            showNotification(msgBox, 'Đăng ký thành công! Đang chuyển hướng...', 'success');
            setTimeout(() => { renderLoginView(document.getElementById('app-view')); }, 1200);
        } else {
            showNotification(msgBox, data.message || 'Đăng ký thất bại!', 'error');
        }
    } catch (err) {
        showNotification(msgBox, 'Không thể kết nối đến Backend!', 'error');
    }
}

function showNotification(element, message, type) {
    if (!element) return;
    element.classList.remove('hidden');
    element.className = type === 'success' 
        ? 'mb-4 p-3 rounded-lg text-sm bg-green-100 text-green-700' 
        : 'mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700';
    element.innerText = message;
}

function handleLogout() {
    currentUser = null;
    currentAuthToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    renderAppView();
}
