// frontend/assets/js/app.js - Tích hợp tính năng tạo đề thi tự động từ Ngân hàng câu hỏi

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentAuthToken = localStorage.getItem('token') || null;

// Biến lưu danh sách câu hỏi tạm thời khi Admin tạo đề thi mới
let tempQuestions = [];

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

// --- 3. BẢNG ĐIỀU KHIỂN ADMIN & QUẢN LÝ ĐỀ THI ---
function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gray-800 text-white rounded-xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2"><i class="fa-solid fa-user-shield text-amber-400"></i> Quản Trị Hệ Thống Đề Thi</h2>
                    <p class="text-gray-300 text-sm mt-1">Tạo thủ công, tải file Excel hoặc bốc ngẫu nhiên từ ngân hàng câu hỏi.</p>
                </div>
                <button id="open-create-exam-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow">
                    <i class="fa-solid fa-plus"></i> Tạo Đề Thi Mới
                </button>
            </div>

            <div id="admin-message" class="hidden p-4 rounded-lg text-sm"></div>

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

        <!-- MODAL TẠO ĐỀ THI MỚI, UPLOAD EXCEL & TẠO TỰ ĐỘNG TỪ NGÂN HÀNG -->
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

                    <!-- KHU VỰC 1: TẠO TỰ ĐỘNG TỪ NGÂN HÀNG CÂU HỎI -->
                    <div class="p-4 bg-purple-50 dark:bg-gray-700/40 rounded-xl border border-purple-200 dark:border-gray-600 space-y-3">
                        <label class="block text-sm font-bold text-purple-800 dark:text-purple-300">
                            <i class="fa-solid fa-wand-magic-sparkles text-purple-600"></i> Tạo tự động từ Ngân hàng câu hỏi
                        </label>
                        <div class="flex items-center gap-3">
                            <div class="flex-grow">
                                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Số lượng câu hỏi ngẫu nhiên cần lấy:</label>
                                <input type="number" id="auto-question-count" value="10" min="1" max="100" class="w-full px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                            </div>
                            <div class="flex items-end">
                                <button type="button" id="btn-auto-generate" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg transition shadow flex items-center gap-1.5">
                                    <i class="fa-solid fa-shuffle"></i> Bốc ngẫu nhiên
                                </button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Hệ thống sẽ trộn ngẫu nhiên từ kho câu hỏi đã có của môn học và khối lớp tương ứng.</p>
                    </div>

                    <!-- KHU VỰC 2: TẢI LÊN FILE EXCEL -->
                    <div class="p-4 bg-emerald-50 dark:bg-gray-700/40 rounded-xl border border-emerald-200 dark:border-gray-600">
                        <label class="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                            <i class="fa-solid fa-file-excel text-emerald-600"></i> Hoặc tải lên file Excel (.xlsx)
                        </label>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Cấu trúc cột: <code class="bg-white dark:bg-gray-800 px-1 py-0.5 rounded text-red-500 font-semibold">Câu hỏi | Đáp án A | Đáp án B | Đáp án C | Đáp án D | Đáp án đúng (A/B/C/D)</code>
                        </p>
                        <input type="file" id="excel-file-input" accept=".xlsx, .xls" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer">
                    </div>

                    <!-- DANH SÁCH CÂU HỎI -->
                    <div class="border-t pt-4 dark:border-gray-700">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="font-bold text-base text-gray-800 dark:text-gray-200">Danh sách câu hỏi hiện tại (<span id="question-count">0</span>)</h4>
                            <button type="button" id="btn-add-question-prompt" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition">
                                + Thêm thủ công
                            </button>
                        </div>
                        <div id="questions-list" class="space-y-3 max-h-60 overflow-y-auto pr-1">
                            <p class="text-sm text-gray-400 italic">Chưa có câu hỏi nào. Hãy bốc tự động từ ngân hàng hoặc tải file Excel.</p>
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
    fetchExamsList();
}

// Lấy danh sách đề thi từ API Backend
async function fetchExamsList() {
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
                        <button onclick="window.deleteExam('${exam.examCode}')" class="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            <i class="fa-solid fa-trash"></i> Xóa đề thi
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Chưa có đề thi nào phù hợp với bộ lọc.</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Không thể tải danh sách đề thi!</div>`;
    }
}

// Thiết lập sự kiện trang Admin
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

    openBtn?.addEventListener('click', () => {
        tempQuestions = [];
        renderTempQuestions();
        modal?.classList.remove('hidden');
    });

    [closeBtn, cancelBtn].forEach(btn => btn?.addEventListener('click', () => modal?.classList.add('hidden')));

    filterSubject?.addEventListener('change', fetchExamsList);
    filterGrade?.addEventListener('change', fetchExamsList);
    reloadBtn?.addEventListener('click', fetchExamsList);

    // --- TÍNH NĂNG 1: TẠO TỰ ĐỘNG TỪ NGÂN HÀNG CÂU HỎI ---
    autoGenBtn?.addEventListener('click', async () => {
        const subject = document.getElementById('exam-subject').value;
        const grade = document.getElementById('exam-grade').value;
        const requestedCount = parseInt(document.getElementById('auto-question-count').value) || 10;

        if (!subject || !grade) {
            alert('Vui lòng chọn Môn học và Khối lớp ở trên trước khi tạo tự động!');
            return;
        }

        try {
            // Lấy toàn bộ đề thi hiện có thuộc môn và lớp này để trích xuất ngân hàng câu hỏi
            const res = await fetch(`${API_URL}/exams?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`);
            const data = await res.json();

            if (!data.success || !data.exams || data.exams.length === 0) {
                alert('Ngân hàng câu hỏi trống! Chưa có đề thi nào thuộc môn và lớp này để bốc ngẫu nhiên.');
                return;
            }

            // Gom toàn bộ câu hỏi từ các đề thi tìm được
            let questionBank = [];
            data.exams.forEach(exam => {
                if (exam.questions && Array.isArray(exam.questions)) {
                    questionBank = questionBank.concat(exam.questions);
                }
            });

            if (questionBank.length === 0) {
                alert('Không tìm thấy câu hỏi nào trong các đề thi hiện có!');
                return;
            }

            if (requestedCount > questionBank.length) {
                alert(`Ngân hàng hiện chỉ có tổng cộng ${questionBank.length} câu hỏi. Hệ thống sẽ lấy toàn bộ số câu này.`);
            }

            // Xáo trộn ngẫu nhiên mảng câu hỏi (Fisher-Yates shuffle) và cắt lấy số lượng yêu cầu
            const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
            tempQuestions = shuffled.slice(0, requestedCount);

            renderTempQuestions();
            alert(`Đã bốc ngẫu nhiên thành công ${tempQuestions.length} câu hỏi từ ngân hàng!`);

        } catch (err) {
            console.error(err);
            alert('Lỗi kết nối khi lấy dữ liệu ngân hàng câu hỏi!');
        }
    });

    // --- TÍNH NĂNG 2: ĐỌC FILE EXCEL BẰNG SHEETJS ---
    excelInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                let loadedCount = 0;
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row && row.length >= 6 && row[0]) {
                        tempQuestions.push({
                            question: String(row[0]).trim(),
                            options: [
                                String(row[1] || '').trim(),
                                String(row[2] || '').trim(),
                                String(row[3] || '').trim(),
                                String(row[4] || '').trim()
                            ],
                            answer: String(row[5] || 'A').trim().toUpperCase()
                        });
                        loadedCount++;
                    }
                }

                renderTempQuestions();
                alert(`Đã tải thành công ${loadedCount} câu hỏi từ file Excel!`);
                e.target.value = '';
            } catch (err) {
                console.error(err);
                alert('Lỗi đọc file Excel! Vui lòng kiểm tra định dạng file.');
            }
        };
        reader.readAsArrayBuffer(file);
    });

    // Thêm câu hỏi thủ công
    document.getElementById('btn-add-question-prompt')?.addEventListener('click', () => {
        const qText = prompt('Nhập nội dung câu hỏi:');
        if (!qText) return;
        const optA = prompt('Nhập Đáp án A:');
        const optB = prompt('Nhập Đáp án B:');
        const optC = prompt('Nhập Đáp án C:');
        const optD = prompt('Nhập Đáp án D:');
        const correct = prompt('Nhập đáp án đúng (A, B, C hoặc D):')?.toUpperCase();

        if (qText && optA && optB && correct) {
            tempQuestions.push({
                question: qText,
                options: [optA, optB, optC || '', optD || ''],
                answer: correct
            });
            renderTempQuestions();
        } else {
            alert('Vui lòng nhập đầy đủ câu hỏi và các đáp án!');
        }
    });

    // Gửi form lưu đề thi lên Server
    document.getElementById('create-exam-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const examCode = document.getElementById('exam-code').value.trim();
        const subject = document.getElementById('exam-subject').value;
        const grade = document.getElementById('exam-grade').value;
        const timeLimit = document.getElementById('exam-time').value;

        if (tempQuestions.length === 0) {
            alert('Vui lòng thêm câu hỏi (bằng cách bốc tự động, file Excel hoặc thủ công)!');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/exams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examCode,
                    title: `Đề thi ${subject} - ${grade}`,
                    subject,
                    grade,
                    timeLimit,
                    questions: tempQuestions
                })
            });
            const data = await res.json();

            if (data.success) {
                alert('Tạo đề thi mới thành công!');
                modal?.classList.add('hidden');
                document.getElementById('create-exam-form').reset();
                tempQuestions = [];
                fetchExamsList();
            } else {
                alert(data.message || 'Tạo đề thi thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối tới Server!');
        }
    });
}

// Hiển thị danh sách câu hỏi tạm trong Modal
function renderTempQuestions() {
    const list = document.getElementById('questions-list');
    const countSpan = document.getElementById('question-count');
    if (!list) return;

    if (countSpan) countSpan.innerText = tempQuestions.length;

    if (tempQuestions.length === 0) {
        list.innerHTML = `<p class="text-sm text-gray-400 italic">Chưa có câu hỏi nào. Hãy bốc tự động từ ngân hàng hoặc tải file Excel.</p>`;
        return;
    }

    list.innerHTML = tempQuestions.map((q, idx) => `
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs relative">
            <p class="font-bold text-gray-800 dark:text-gray-200">Câu ${idx + 1}: ${q.question}</p>
            <p class="text-gray-500 dark:text-gray-400 mt-1">A. ${q.options[0]} | B. ${q.options[1]} | C. ${q.options[2]} | D. ${q.options[3]}</p>
            <p class="text-emerald-600 font-bold mt-1">Đáp án đúng: ${q.answer}</p>
            <button type="button" onclick="window.removeTempQuestion(${idx})" class="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
    `).join('');
}

window.removeTempQuestion = function(index) {
    tempQuestions.splice(index, 1);
    renderTempQuestions();
};

window.deleteExam = async function(examCode) {
    if (!confirm(`Bạn có chắc chắn muốn xóa đề thi ${examCode} không?`)) return;

    try {
        const res = await fetch(`${API_URL}/exams/${examCode}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            fetchExamsList();
        } else {
            alert(data.message || 'Xóa thất bại!');
        }
    } catch (e) {
        alert('Lỗi khi gửi yêu cầu xóa!');
    }
};

// --- 4. GIAO DIỆN HỌC VIÊN ---
function renderStudentDashboard(container) {
    container.innerHTML = `
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center mt-6">
            <div>
                <h2 class="text-2xl font-bold">Chào mừng học viên, ${currentUser.fullname || currentUser.username}! 🎓</h2>
                <p class="text-blue-100 text-sm mt-1">Nền tảng học tập trực tuyến đang sẵn sàng cho bạn.</p>
            </div>
        </div>
    `;
}

// --- 5. HÀM XỬ LÝ CHUNG ---
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
            currentUser = { username: data.username, fullname: data.fullname, role: data.role, mcion: data.mcion };
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
            setTimeout(() => {
                renderLoginView(document.getElementById('app-view'));
            }, 1200);
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
        ? 'mb-4 p-3 rounded-lg text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
        : 'mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    element.innerText = message;
}

function handleLogout() {
    currentUser = null;
    currentAuthToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    renderAppView();
}
