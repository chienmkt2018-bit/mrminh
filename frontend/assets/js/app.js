// frontend/assets/js/app.js - Đã tích hợp tính năng Lịch sử thi & Bảng điểm chi tiết

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentAuthToken = localStorage.getItem('token') || null;

// Biến lưu danh sách câu hỏi tạm thời khi Admin tạo đề thi mới
let tempQuestions = [];

// Biến lưu trữ cache danh sách đề thi
let studentExamsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    renderAppView();
});

// Dispatcher chính của ứng dụng SPA
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

// --- 1. GIAO DIỆN ĐĂNG NHẬP ---
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
                Chưa có tài khoản học viên? <button id="go-to-register" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1">Đăng ký ngay</button>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
    document.getElementById('go-to-register').addEventListener('click', () => renderRegisterView(container));
}

// --- 2. GIAO DIỆN ĐĂNG KÝ HỌC VIÊN ---
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
                    <input type="password" id="reg-password" placeholder="Mật khẩu của bạn" required class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
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

// --- 3. BẢNG ĐIỀU KHIỂN ADMIN ---
function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gray-800 text-white rounded-xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2"><i class="fa-solid fa-user-shield text-amber-400"></i> Quản Trị Hệ Thống Đề Thi</h2>
                    <p class="text-gray-300 text-sm mt-1">Quản lý kho đề thi và ngân hàng câu hỏi trực tuyến.</p>
                </div>
                <button id="open-create-exam-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow">
                    <i class="fa-solid fa-plus"></i> Tạo Đề Thi Mới
                </button>
            </div>

            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
                <div class="flex gap-4 flex-wrap">
                    <div>
                        <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Môn học</label>
                        <select id="filter-subject" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                            <option value="">-- Tất cả các môn --</option>
                            <option value="Toán">Toán</option>
                            <option value="Anh">Anh</option>
                            <option value="Văn">Văn</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Lớp học</label>
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
                <button id="btn-reload-exams" class="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-rotate"></i> Làm mới danh sách
                </button>
            </div>

            <div id="exam-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="col-span-full text-center py-8 text-gray-500">Đang tải danh sách đề thi...</div>
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
                            <label class="block text-sm font-medium mb-1">Thời gian làm bài (Phút)</label>
                            <input type="number" id="exam-time" value="30" min="5" max="180" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                        </div>
                    </div>

                    <!-- TẠO NGẪU NHIÊN -->
                    <div class="p-4 bg-purple-50 dark:bg-gray-700/40 rounded-xl border border-purple-200 dark:border-gray-600 space-y-3">
                        <label class="block text-sm font-bold text-purple-800 dark:text-purple-300">
                            <i class="fa-solid fa-wand-magic-sparkles text-purple-600"></i> Bốc ngẫu nhiên từ ngân hàng câu hỏi
                        </label>
                        <div class="flex items-center gap-3">
                            <div class="flex-grow">
                                <input type="number" id="auto-question-count" value="10" min="1" max="100" class="w-full px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                            </div>
                            <button type="button" id="btn-auto-generate" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg transition shadow">
                                Bốc ngẫu nhiên
                            </button>
                        </div>
                    </div>

                    <!-- TẢI EXCEL -->
                    <div class="p-4 bg-emerald-50 dark:bg-gray-700/40 rounded-xl border border-emerald-200 dark:border-gray-600">
                        <label class="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                            <i class="fa-solid fa-file-excel text-emerald-600"></i> Hoặc tải lên file Excel (.xlsx)
                        </label>
                        <input type="file" id="excel-file-input" accept=".xlsx, .xls" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer">
                    </div>

                    <!-- DANH SÁCH CÂU HỎI -->
                    <div class="border-t pt-4 dark:border-gray-700">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="font-bold text-base text-gray-800 dark:text-gray-200">Danh sách câu hỏi (<span id="question-count">0</span>)</h4>
                        </div>
                        <div id="questions-list" class="space-y-3 max-h-60 overflow-y-auto pr-1">
                            <p class="text-sm text-gray-400 italic">Chưa có câu hỏi nào.</p>
                        </div>
                    </div>

                    <div class="pt-4 flex justify-end gap-3 border-t dark:border-gray-700">
                        <button type="button" id="btn-cancel-modal" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Hủy</button>
                        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition">Lưu Đề Thi</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupAdminEvents();
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
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-lg transition">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold text-xs rounded-full">${exam.examCode}</span>
                            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold text-xs rounded-full">${exam.grade}</span>
                        </div>
                        <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-2">${exam.title || 'Đề thi ' + exam.subject}</h3>
                        <div class="text-xs text-gray-500 space-y-1 mb-4">
                            <p><i class="fa-solid fa-book"></i> Môn: <b class="text-gray-700 dark:text-gray-300">${exam.subject}</b></p>
                            <p><i class="fa-solid fa-clock"></i> Thời gian: <b>${exam.timeLimit} phút</b></p>
                            <p><i class="fa-solid fa-circle-question"></i> Số câu hỏi: <b>${exam.questions ? exam.questions.length : 0} câu</b></p>
                        </div>
                    </div>
                    <div class="pt-3 border-t dark:border-gray-700 flex justify-end">
                        <button onclick="window.deleteExam('${exam.examCode}')" class="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition">
                            <i class="fa-solid fa-trash"></i> Xóa đề thi
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Chưa có đề thi nào phù hợp.</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Không thể tải danh sách đề thi!</div>`;
    }
}

function setupAdminEvents() {
    const modal = document.getElementById('create-exam-modal');
    const openBtn = document.getElementById('open-create-exam-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('btn-cancel-modal');
    const filterSubject = document.getElementById('filter-subject');
    const filterGrade = document.getElementById('filter-grade');
    const reloadBtn = document.getElementById('btn-reload-exams');
    const excelInput = document.getElementById('excel-file-input');
    const autoGenBtn = document.getElementById('btn-auto-generate');

    openBtn?.addEventListener('click', () => { tempQuestions = []; renderTempQuestions(); modal?.classList.remove('hidden'); });
    [closeBtn, cancelBtn].forEach(btn => btn?.addEventListener('click', () => modal?.classList.add('hidden')));
    filterSubject?.addEventListener('change', fetchExamsListForAdmin);
    filterGrade?.addEventListener('change', fetchExamsListForAdmin);
    reloadBtn?.addEventListener('click', fetchExamsListForAdmin);

    autoGenBtn?.addEventListener('click', async () => {
        const subject = document.getElementById('exam-subject').value;
        const grade = document.getElementById('exam-grade').value;
        const requestedCount = parseInt(document.getElementById('auto-question-count').value) || 10;
        try {
            const res = await fetch(`${API_URL}/exams?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`);
            const data = await res.json();
            if (!data.success || !data.exams || data.exams.length === 0) { alert('Ngân hàng câu hỏi trống!'); return; }
            let questionBank = [];
            data.exams.forEach(ex => { if (ex.questions) questionBank = questionBank.concat(ex.questions); });
            tempQuestions = [...questionBank].sort(() => 0.5 - Math.random()).slice(0, requestedCount);
            renderTempQuestions();
            alert(`Đã bốc ngẫu nhiên ${tempQuestions.length} câu hỏi!`);
        } catch (err) { alert('Lỗi kết nối ngân hàng câu hỏi!'); }
    });

    excelInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                let loadedCount = 0;
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row && row.length >= 6 && row[0]) {
                        tempQuestions.push({
                            question: String(row[0]).trim(),
                            options: [String(row[1]||'').trim(), String(row[2]||'').trim(), String(row[3]||'').trim(), String(row[4]||'').trim()],
                            answer: String(row[5]||'A').trim().toUpperCase()
                        });
                        loadedCount++;
                    }
                }
                renderTempQuestions();
                alert(`Đã tải thành công ${loadedCount} câu hỏi từ Excel!`);
                e.target.value = '';
            } catch (err) { alert('Lỗi đọc file Excel!'); }
        };
        reader.readAsArrayBuffer(file);
    });

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
    if (tempQuestions.length === 0) { list.innerHTML = `<p class="text-sm text-gray-400 italic">Chưa có câu hỏi nào.</p>`; return; }
    list.innerHTML = tempQuestions.map((q, idx) => `
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs relative">
            <p class="font-bold text-gray-800 dark:text-gray-200">Câu ${idx + 1}: ${q.question}</p>
            <p class="text-gray-500 mt-1">A. ${q.options[0]} | B. ${q.options[1]} | C. ${q.options[2]} | D. ${q.options[3]}</p>
            <p class="text-emerald-600 font-bold mt-1">Đáp án: ${q.answer}</p>
            <button type="button" onclick="window.removeTempQuestion(${idx})" class="absolute top-2 right-2 text-red-500 font-bold">✕</button>
        </div>
    `).join('');
}

window.removeTempQuestion = (i) => { tempQuestions.splice(i, 1); renderTempQuestions(); };
window.deleteExam = async (code) => {
    if (!confirm(`Xóa đề thi ${code}?`)) return;
    const res = await fetch(`${API_URL}/exams/${code}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchExamsListForAdmin();
};


// --- 4. GIAO DIỆN HỌC VIÊN & LỊCH SỬ THI ---
function renderStudentDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold">Chào mừng học viên, ${currentUser.fullname || currentUser.username}! 🎓</h2>
                    <p class="text-blue-100 text-sm mt-1">Chọn đề thi trực tuyến hoặc xem lại lịch sử các bài đã làm.</p>
                </div>
                <div class="flex gap-2">
                    <button id="tab-exams-btn" class="px-4 py-2 bg-white text-blue-600 font-bold rounded-xl text-sm shadow transition">Danh Sách Đề Thi</button>
                    <button id="tab-history-btn" class="px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition">Lịch Sử Thi 📊</button>
                </div>
            </div>

            <div id="student-main-content" class="space-y-6">
                <!-- Nội dung danh sách đề thi hoặc lịch sử sẽ render ở đây -->
            </div>
        </div>
    `;

    document.getElementById('tab-exams-btn').addEventListener('click', (e) => {
        e.target.className = "px-4 py-2 bg-white text-blue-600 font-bold rounded-xl text-sm shadow transition";
        document.getElementById('tab-history-btn').className = "px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition";
        loadExamsTab();
    });

    document.getElementById('tab-history-btn').addEventListener('click', (e) => {
        e.target.className = "px-4 py-2 bg-white text-blue-600 font-bold rounded-xl text-sm shadow transition";
        document.getElementById('tab-exams-btn').className = "px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition";
        loadExamHistoryTab();
    });

    loadExamsTab();
}

// Tab 1: Danh sách đề thi
function loadExamsTab() {
    const contentContainer = document.getElementById('student-main-content');
    contentContainer.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex gap-4 flex-wrap items-center">
            <div>
                <label class="text-xs font-semibold text-gray-500 block mb-1">Lọc môn học</label>
                <select id="student-filter-subject" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                    <option value="">-- Tất cả môn --</option>
                    <option value="Toán">Toán</option>
                    <option value="Anh">Anh</option>
                    <option value="Văn">Văn</option>
                </select>
            </div>
            <div>
                <label class="text-xs font-semibold text-gray-500 block mb-1">Lọc khối lớp</label>
                <select id="student-filter-grade" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                    <option value="">-- Tất cả lớp --</option>
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                </select>
            </div>
        </div>
        <div id="student-exam-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-10 text-gray-500">Đang tải danh sách đề thi...</div>
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
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border dark:border-gray-700 flex flex-col justify-between hover:shadow-lg transition">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">${exam.examCode}</span>
                            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">${exam.grade}</span>
                        </div>
                        <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-2">${exam.title || 'Đề thi ' + exam.subject}</h3>
                        <div class="text-xs text-gray-500 space-y-1 mb-4">
                            <p><i class="fa-solid fa-book"></i> Môn: <b class="text-gray-700 dark:text-gray-300">${exam.subject}</b></p>
                            <p><i class="fa-solid fa-clock"></i> Thời gian: <b>${exam.timeLimit} phút</b></p>
                            <p><i class="fa-solid fa-circle-question"></i> Số câu hỏi: <b>${exam.questions ? exam.questions.length : 0} câu</b></p>
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

// Tab 2: Lịch sử thi & Bảng điểm cá nhân
async function loadExamHistoryTab() {
    const contentContainer = document.getElementById('student-main-content');
    contentContainer.innerHTML = `
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
            historyContainer.innerHTML = data.results.map((item, idx) => {
                const dateStr = new Date(item.createdAt).toLocaleString('vi-VN');
                const isPassed = item.score >= 5;
                return `
                    <div class="p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow transition">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded">${item.examCode}</span>
                                <h4 class="font-bold text-base text-gray-800 dark:text-white">${item.examTitle || 'Bài thi ' + item.subject}</h4>
                            </div>
                            <p class="text-xs text-gray-500">Môn: <b>${item.subject || 'N/A'}</b> | Khối: <b>${item.grade || 'N/A'}</b> | Thời gian nộp: ${dateStr}</p>
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
            historyContainer.innerHTML = `<div class="text-center py-10 text-gray-400">Bạn chưa có lịch sử làm bài thi nào. Hãy bắt đầu thi ngay nhé!</div>`;
        }
    } catch (err) {
        historyContainer.innerHTML = `<div class="text-center py-10 text-red-500">Không thể tải dữ liệu lịch sử thi!</div>`;
    }
}

// --- PHÒNG THI & GỬI KẾT QUẢ TỰ ĐỘNG ---
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
                    <p class="text-xs text-gray-500">Môn: ${exam.subject} | Tổng số câu: ${exam.questions.length}</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="px-4 py-2 bg-red-100 text-red-700 font-mono font-bold text-lg rounded-xl flex items-center gap-2 shadow-inner">
                        <i class="fa-solid fa-stopwatch"></i> <span id="time-countdown">--:--</span>
                    </div>
                    <button id="btn-submit-exam" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition shadow">Nộp Bài</button>
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
                                        <input type="radio" name="question-${qIndex}" value="${optLabel}" data-qindex="${qIndex}" class="mt-1 text-blue-600 focus:ring-blue-500">
                                        <span class="text-sm text-gray-700 dark:text-gray-300"><b class="mr-1">${optLabel}.</b> ${optText}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="flex justify-end pt-4">
                <button id="btn-submit-exam-bottom" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg text-base">Nộp Bài Thi Ngay</button>
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
            if (!confirm('Bạn chưa trả lời hết các câu hỏi. Bạn có chắc chắn muốn nộp bài?')) return;
        } else {
            if (!confirm('Xác nhận nộp bài thi?')) return;
        }
        clearInterval(timerInterval);
        processAndSubmitExam(exam, userAnswers);
    };

    document.getElementById('btn-submit-exam')?.addEventListener('click', handleSubmitAction);
    document.getElementById('btn-submit-exam-bottom')?.addEventListener('click', handleSubmitAction);
}

// --- HÀM XỬ LÝ CHẤM ĐIỂM VÀ LƯU LỊCH SỬ THI LÊN SERVER ---
async function processAndSubmitExam(exam, userAnswers) {
    let correctCount = 0;
    const totalQuestions = exam.questions.length;

    exam.questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.answer) correctCount++;
    });

    const score = parseFloat(((correctCount / totalQuestions) * 10).toFixed(2));

    // Gửi kết quả lưu vào cơ sở dữ liệu server
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
        console.error('Không thể lưu kết quả thi lên server:', err);
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

            <div class="space-y-4">
                <h3 class="font-bold text-lg text-gray-800 dark:text-white">Xem lại chi tiết đáp án:</h3>
                <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
                    ${exam.questions.map((q, idx) => {
                        const userChoice = userAnswers[idx] || 'Không chọn';
                        const isCorrect = userChoice === q.answer;
                        return `
                            <div class="p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'} space-y-2">
                                <p class="font-bold text-sm text-gray-800 dark:text-gray-200">Câu ${idx + 1}:${q.question}</p>
                                <div class="text-xs space-y-1">
                                    <p class="${isCorrect ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}">Lựa chọn của bạn: ${userChoice}</p>
                                    <p class="text-emerald-700 font-semibold">Đáp án chuẩn: ${q.answer}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="pt-4 flex justify-center">
                <button id="btn-back-dashboard" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow">
                    Quay về Trang Chủ Học Viên
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-back-dashboard')?.addEventListener('click', () => renderAppView());
}

// --- CÁC HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ CHUNG ---
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
        showNotification(msgBox, 'Không thể kết nối đến máy chủ Backend!', 'error');
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
        showNotification(msgBox, 'Không thể kết nối đến máy chủ Backend!', 'error');
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
