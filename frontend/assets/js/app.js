// frontend/assets/js/app.js - Tối ưu hóa giao diện Mobile Responsive toàn diện & Đã sửa lỗi

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
                <div class="flex items-center gap-2 text-xs sm:text-sm">
                    <span class="truncate max-w-[120px] sm:max-w-none">Chào, <b class="text-blue-600 dark:text-blue-400">${currentUser.fullname || currentUser.username}</b></span>
                    <span class="hidden sm:inline">(${currentUser.role === 'admin' ? 'Admin 👑' : 'Học viên 🎓'})</span>
                    <button id="logout-btn" class="text-red-500 hover:text-red-700 font-semibold text-xs border border-red-200 px-2 py-1 rounded transition">Thoát</button>
                </div>
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
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg mt-6 sm:mt-10 border dark:border-gray-700">
            <h2 class="text-xl sm:text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Đăng Nhập Hệ Thống</h2>
            <div id="auth-message" class="hidden mb-4 p-3 rounded-lg text-sm"></div>
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                    <input type="text" id="username" placeholder="Nhập tên đăng nhập" required class="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input type="password" id="password" placeholder="Nhập mật khẩu" required class="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md text-sm">Đăng Nhập</button>
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
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg mt-6 sm:mt-10 border dark:border-gray-700">
            <h2 class="text-xl sm:text-2xl font-bold mb-2 text-center text-gray-800 dark:text-white">Đăng Ký Học Viên</h2>
            <div id="auth-message" class="hidden mb-4 p-3 rounded-lg text-sm"></div>
            <form id="register-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Họ và tên</label>
                    <input type="text" id="reg-fullname" placeholder="Nguyễn Văn A" required class="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                    <input type="text" id="reg-username" placeholder="nguyenvana" required class="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input type="password" id="reg-password" placeholder="Mật khẩu" required class="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md text-sm">Xác Nhận Đăng Ký</button>
            </form>
            <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Đã có tài khoản? <button id="go-to-login" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1">Đăng nhập</button>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', handleRegisterSubmit);
    document.getElementById('go-to-login').addEventListener('click', () => renderLoginView(container));
}

// --- 3. DASHBOARD ADMIN (TỐI ƯU MOBILE TAB & UI) ---
function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gray-800 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col gap-4">
                <div>
                    <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2"><i class="fa-solid fa-user-shield text-amber-400"></i> Quản Trị Hệ Thống</h2>
                    <p class="text-gray-300 text-xs sm:text-sm mt-1">Quản lý kho đề thi, thống kê tổng quan và theo dõi kết quả toàn trường.</p>
                </div>
                <!-- Menu Tab Admin cuộn ngang mượt mà trên mobile -->
                <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button id="admin-tab-stats-btn" class="px-3.5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">📊 Thống Kê</button>
                    <button id="admin-tab-exams-btn" class="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">📝 Đề Thi</button>
                    <button id="admin-tab-history-btn" class="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">📋 Lịch Sử</button>
                    <button id="admin-tab-leaderboard-btn" class="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">🏆 Xếp Hạng</button>
                </div>
            </div>

            <div id="admin-main-content" class="space-y-6"></div>
        </div>

        <!-- MODAL TẠO ĐỀ THI (Đã tích hợp giao diện thêm câu hỏi hoàn chỉnh) -->
        <div id="create-exam-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 hidden">
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto relative border dark:border-gray-700">
                <button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold">✕</button>
                <h3 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-file-circle-plus text-blue-600"></i> Tạo Đề Thi Mới
                </h3>
                <form id="create-exam-form" class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs sm:text-sm font-medium mb-1">Mã đề thi <span class="text-red-500">*</span></label>
                            <input type="text" id="exam-code" placeholder="VD: TOAN101" required class="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium mb-1">Môn học <span class="text-red-500">*</span></label>
                            <select id="exam-subject" required class="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm">
                                <option value="Toán">Toán</option>
                                <option value="Anh">Anh</option>
                                <option value="Văn">Văn</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium mb-1">Khối Lớp <span class="text-red-500">*</span></label>
                            <select id="exam-grade" required class="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm">
                                <option value="Lớp 1">Lớp 1</option>
                                <option value="Lớp 2">Lớp 2</option>
                                <option value="Lớp 3">Lớp 3</option>
                                <option value="Lớp 4">Lớp 4</option>
                                <option value="Lớp 5">Lớp 5</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium mb-1">Thời gian (Phút)</label>
                            <input type="number" id="exam-time" value="30" min="5" max="180" class="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm">
                        </div>
                    </div>

                    <!-- Phần thêm câu hỏi thủ công vào đề thi -->
                    <div class="border-t pt-4 dark:border-gray-700 space-y-3">
                        <h4 class="font-bold text-sm text-gray-800 dark:text-gray-200">Soạn Câu Hỏi</h4>
                        <div class="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-2 border dark:border-gray-600">
                            <input type="text" id="new-q-text" placeholder="Nhập nội dung câu hỏi..." class="w-full px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input type="text" id="new-q-optA" placeholder="Đáp án A" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs">
                                <input type="text" id="new-q-optB" placeholder="Đáp án B" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs">
                                <input type="text" id="new-q-optC" placeholder="Đáp án C" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs">
                                <input type="text" id="new-q-optD" placeholder="Đáp án D" class="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs">
                            </div>
                            <div class="flex items-center justify-between pt-1">
                                <div class="flex items-center gap-2">
                                    <label class="text-xs font-semibold">Đáp án đúng:</label>
                                    <select id="new-q-answer" class="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs font-bold text-emerald-600">
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>
                                <button type="button" id="btn-add-question" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow">Thêm Câu Hỏi</button>
                            </div>
                        </div>

                        <h4 class="font-bold text-sm text-gray-800 dark:text-gray-200 mt-3">Danh sách câu hỏi đã thêm (<span id="question-count">0</span>)</h4>
                        <div id="questions-list" class="space-y-2 max-h-40 overflow-y-auto pr-1">
                            <p class="text-xs text-gray-400 italic">Chưa có câu hỏi nào.</p>
                        </div>
                    </div>

                    <div class="pt-4 flex flex-col sm:flex-row justify-end gap-2 border-t dark:border-gray-700">
                        <button type="button" id="btn-cancel-modal" class="w-full sm:w-auto px-4 py-2 border rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Hủy</button>
                        <button type="submit" class="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow">Lưu Đề Thi</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('admin-tab-stats-btn').addEventListener('click', (e) => {
        setActiveAdminTab(e.target);
        loadAdminStatsTab();
    });
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

    loadAdminStatsTab();
}

function setActiveAdminTab(activeBtn) {
    ['admin-tab-stats-btn', 'admin-tab-exams-btn', 'admin-tab-history-btn', 'admin-tab-leaderboard-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.className = "px-3.5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0";
    });
    if (activeBtn) activeBtn.className = "px-3.5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0";
}

// Admin Tab 0: Thống kê & Biểu đồ
async function loadAdminStatsTab() {
    const container = document.getElementById('admin-main-content');
    container.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase">Tổng học sinh</p>
                        <h3 id="stat-total-students" class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">...</h3>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0">
                        <i class="fa-solid fa-users"></i>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase">Tổng đề thi</p>
                        <h3 id="stat-total-exams" class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">...</h3>
                    </div>
                    <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase">Tổng lượt thi</p>
                        <h3 id="stat-total-attempts" class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">...</h3>
                    </div>
                    <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0">
                        <i class="fa-solid fa-clipboard-check"></i>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase">Điểm trung bình</p>
                        <h3 id="stat-avg-score" class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">...</h3>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md border dark:border-gray-700">
                    <h4 class="font-bold text-sm sm:text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-chart-bar text-blue-600"></i> Lượt thi theo môn học
                    </h4>
                    <div class="relative h-60 sm:h-64">
                        <canvas id="attemptsChart"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md border dark:border-gray-700">
                    <h4 class="font-bold text-sm sm:text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-chart-pie text-emerald-600"></i> Phân bổ đề thi theo môn
                    </h4>
                    <div class="relative h-60 sm:h-64 flex justify-center">
                        <canvas id="examsChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md border dark:border-gray-700 space-y-4">
                <h4 class="font-bold text-sm sm:text-base text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fa-solid fa-trophy text-amber-500"></i> Top Học Sinh Xuất Sắc Nhất
                </h4>
                <div id="admin-top-students-list" class="overflow-x-auto">
                    <p class="text-xs sm:text-sm text-gray-400 text-center py-4">Đang tải danh sách...</p>
                </div>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${API_URL}/admin/stats`);
        const data = await res.json();
        if (data.success) {
            const { totalStudents, totalExams, totalAttempts, averageScore, topStudents, attemptsBySubject, examsBySubject } = data.stats;

            document.getElementById('stat-total-students').innerText = totalStudents;
            document.getElementById('stat-total-exams').innerText = totalExams;
            document.getElementById('stat-total-attempts').innerText = totalAttempts;
            document.getElementById('stat-avg-score').innerText = averageScore;

            const topContainer = document.getElementById('admin-top-students-list');
            if (topStudents && topStudents.length > 0) {
                topContainer.innerHTML = `
                    <table class="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr class="border-b dark:border-gray-700 text-xs text-gray-400 uppercase">
                                <th class="py-3 px-3">Hạng</th>
                                <th class="py-3 px-3">Học viên</th>
                                <th class="py-3 px-3">Đề thi</th>
                                <th class="py-3 px-3">Môn học</th>
                                <th class="py-3 px-3 text-center">Đúng</th>
                                <th class="py-3 px-3 text-right">Điểm số</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y dark:divide-gray-700 text-xs sm:text-sm">
                            ${topStudents.map((item, idx) => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <td class="py-3 px-3 font-bold text-amber-600">#${idx + 1}</td>
                                    <td class="py-3 px-3 font-bold text-gray-800 dark:text-white truncate max-w-[120px] sm:max-w-none">${item.fullname || item.username}</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">${item.examCode}</span></td>
                                    <td class="py-3 px-3">${item.subject || 'Toán'}</td>
                                    <td class="py-3 px-3 text-center font-semibold">${item.correctCount}/${item.totalQuestions}</td>
                                    <td class="py-3 px-3 text-right font-black text-blue-600">${item.score}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                topContainer.innerHTML = `<p class="text-xs sm:text-sm text-gray-400 text-center py-4">Chưa có lịch sử làm bài nào.</p>`;
            }

            loadChartJsIfNeeded(() => {
                const attemptsCtx = document.getElementById('attemptsChart').getContext('2d');
                const subjects = attemptsBySubject.map(i => i._id || 'Khác');
                const attemptCounts = attemptsBySubject.map(i => i.count);

                new Chart(attemptsCtx, {
                    type: 'bar',
                    data: {
                        labels: subjects.length ? subjects : ['Toán', 'Anh', 'Văn'],
                        datasets: [{
                            label: 'Số lượt thi',
                            data: attemptCounts.length ? attemptCounts : [0, 0, 0],
                            backgroundColor: 'rgba(37, 99, 235, 0.8)',
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                    }
                });

                const examsCtx = document.getElementById('examsChart').getContext('2d');
                const examSubjects = examsBySubject.map(i => i._id || 'Khác');
                const examCounts = examsBySubject.map(i => i.count);

                new Chart(examsCtx, {
                    type: 'doughnut',
                    data: {
                        labels: examSubjects.length ? examSubjects : ['Toán', 'Anh', 'Văn'],
                        datasets: [{
                            data: examCounts.length ? examCounts : [1, 1, 1],
                            backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
                    }
                });
            });
        }
    } catch (err) {
        console.error('Lỗi khi tải thống kê admin:', err);
    }
}

function loadChartJsIfNeeded(callback) {
    if (window.Chart) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => callback();
    document.head.appendChild(script);
}

// Admin Tab 1: Quản lý đề thi
function loadAdminExamsTab() {
    const container = document.getElementById('admin-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div class="flex gap-3 w-full sm:w-auto">
                <div class="w-1/2 sm:w-auto">
                    <label class="text-xs font-semibold text-gray-500 block mb-1">Môn học</label>
                    <select id="filter-subject" class="w-full sm:w-auto px-3 py-1.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-xs sm:text-sm">
                        <option value="">-- Tất cả môn --</option>
                        <option value="Toán">Toán</option>
                        <option value="Anh">Anh</option>
                        <option value="Văn">Văn</option>
                    </select>
                </div>
                <div class="w-1/2 sm:w-auto">
                    <label class="text-xs font-semibold text-gray-500 block mb-1">Lớp học</label>
                    <select id="filter-grade" class="w-full sm:w-auto px-3 py-1.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-xs sm:text-sm">
                        <option value="">-- Tất cả lớp --</option>
                        <option value="Lớp 1">Lớp 1</option>
                        <option value="Lớp 2">Lớp 2</option>
                        <option value="Lớp 3">Lớp 3</option>
                        <option value="Lớp 4">Lớp 4</option>
                        <option value="Lớp 5">Lớp 5</option>
                    </select>
                </div>
            </div>
            <button id="open-create-exam-btn" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition shadow flex items-center justify-center gap-2">
                <i class="fa-solid fa-plus"></i> Tạo Đề Thi Mới
            </button>
        </div>
        <div id="exam-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div class="col-span-full text-center py-8 text-gray-500 text-sm">Đang tải danh sách đề thi...</div>
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
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2.5 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">${exam.examCode}</span>
                            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">${exam.grade}</span>
                        </div>
                        <h3 class="font-bold text-base sm:text-lg text-gray-800 dark:text-white mb-2">${exam.title || 'Đề thi ' + exam.subject}</h3>
                        <div class="text-xs text-gray-500 space-y-1 mb-4">
                            <p>Môn: <b class="text-gray-700 dark:text-gray-300">${exam.subject}</b></p>
                            <p>Thời gian: <b>${exam.timeLimit} phút</b></p>
                            <p>Số câu hỏi: <b>${exam.questions ? exam.questions.length : 0} câu</b></p>
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
            container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400 text-sm">Chưa có đề thi nào phù hợp.</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 text-sm">Lỗi tải danh sách đề thi!</div>`;
    }
}

function setupAdminModalEvents() {
    const modal = document.getElementById('create-exam-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('btn-cancel-modal');
    [closeBtn, cancelBtn].forEach(btn => btn?.addEventListener('click', () => modal?.classList.add('hidden')));

    // Lắng nghe sự kiện thêm từng câu hỏi vào mảng tạm
    const addQuestionBtn = document.getElementById('btn-add-question');
    if (addQuestionBtn) {
        addQuestionBtn.onclick = () => {
            const qText = document.getElementById('new-q-text').value.trim();
            const optA = document.getElementById('new-q-optA').value.trim();
            const optB = document.getElementById('new-q-optB').value.trim();
            const optC = document.getElementById('new-q-optC').value.trim();
            const optD = document.getElementById('new-q-optD').value.trim();
            const answer = document.getElementById('new-q-answer').value;

            if (!qText || !optA || !optB || !optC || !optD) {
                alert('Vui lòng nhập đầy đủ nội dung câu hỏi và 4 đáp án!');
                return;
            }

            tempQuestions.push({
                question: qText,
                options: [optA, optB, optC, optD],
                answer: answer
            });

            renderTempQuestions();

            // Reset input form câu hỏi sau khi thêm
            document.getElementById('new-q-text').value = '';
            document.getElementById('new-q-optA').value = '';
            document.getElementById('new-q-optB').value = '';
            document.getElementById('new-q-optC').value = '';
            document.getElementById('new-q-optD').value = '';
            document.getElementById('new-q-text').focus();
        };
    }

    document.getElementById('create-exam-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const examCode = document.getElementById('exam-code').value.trim();
        const subject = document.getElementById('exam-subject').value;
        const grade = document.getElementById('exam-grade').value;
        const timeLimit = document.getElementById('exam-time').value;

        if (tempQuestions.length === 0) { 
            alert('Vui lòng thêm ít nhất một câu hỏi vào đề thi!'); 
            return; 
        }

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
    if (tempQuestions.length === 0) { 
        list.innerHTML = `<p class="text-xs sm:text-sm text-gray-400 italic">Chưa có câu hỏi.</p>`; 
        return; 
    }
    list.innerHTML = tempQuestions.map((q, idx) => `
        <div class="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs relative flex justify-between items-start">
            <div>
                <p class="font-bold">Câu ${idx + 1}: ${q.question}</p>
                <p class="text-[11px] text-gray-500 mt-0.5">A: ${q.options?.[0]} | B: ${q.options?.[1]} | C: ${q.options?.[2]} | D: ${q.options?.[3]}</p>
                <p class="text-emerald-600 font-bold mt-0.5">Đáp án đúng: ${q.answer}</p>
            </div>
            <button type="button" onclick="window.removeTempQuestion(${idx})" class="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5">✕</button>
        </div>
    `).join('');
}

window.removeTempQuestion = (idx) => {
    tempQuestions.splice(idx, 1);
    renderTempQuestions();
};

window.deleteExam = async (code) => {
    if (!confirm(`Xóa đề thi ${code}?`)) return;
    const res = await fetch(`${API_URL}/exams/${code}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchExamsListForAdmin();
};

// Admin Tab 2: Lịch sử toàn trường
async function loadAdminHistoryTab() {
    const container = document.getElementById('admin-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md border dark:border-gray-700 space-y-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fa-solid fa-users-rectangle text-blue-600"></i> Lịch Sử Toàn Trường
                </h3>
                <div class="w-full sm:w-80">
                    <input type="text" id="admin-search-input" placeholder="Tìm theo tên học viên, mã đề..." class="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            <div id="admin-history-list" class="space-y-3">
                <p class="text-xs sm:text-sm text-gray-500 py-4 text-center">Đang tải lịch sử thi...</p>
            </div>
        </div>
    `;

    document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
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
                    <div class="p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-xs rounded">Học viên: ${item.fullname || item.username}</span>
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded">Đề: ${item.examCode}</span>
                            </div>
                            <h4 class="font-bold text-sm sm:text-base text-gray-800 dark:text-white">${item.examTitle}</h4>
                            <p class="text-[11px] sm:text-xs text-gray-500">Môn: <b>${item.subject}</b> | Khối: <b>${item.grade}</b> | Lúc: ${dateStr}</p>
                        </div>
                        <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div class="text-left sm:text-right">
                                <p class="text-[10px] text-gray-400">Đúng</p>
                                <p class="font-bold text-xs sm:text-sm">${item.correctCount}/${item.totalQuestions}</p>
                            </div>
                            <div class="text-left sm:text-right">
                                <p class="text-[10px] text-gray-400">Điểm</p>
                                <p class="text-base sm:text-lg font-black text-blue-600">${item.score}</p>
                            </div>
                            <div>
                                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                                    ${isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            historyListContainer.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">Không tìm thấy kết quả phù hợp.</div>`;
        }
    } catch (err) {
        historyListContainer.innerHTML = `<div class="text-center py-10 text-red-500 text-sm">Không thể tải dữ liệu lịch sử!</div>`;
    }
}

// --- 4. GIAO DIỆN HỌC VIÊN & BẢNG XẾP HẠNG ---
function renderStudentDashboard(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col gap-4">
                <div>
                    <h2 class="text-xl sm:text-2xl font-bold">Chào học viên, ${currentUser.fullname || currentUser.username}! 🎓</h2>
                    <p class="text-blue-100 text-xs sm:text-sm mt-1">Làm bài thi, tra cứu lịch sử cá nhân và đua top bảng vàng.</p>
                </div>
                <!-- Tab học viên cuộn ngang trên mobile -->
                <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button id="tab-exams-btn" class="px-3.5 py-2 bg-white text-blue-600 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">Danh Sách Đề</button>
                    <button id="tab-history-btn" class="px-3.5 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">Lịch Sử 📊</button>
                    <button id="tab-leaderboard-btn" class="px-3.5 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0">Xếp Hạng 🏆</button>
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
        if (btn) btn.className = "px-3.5 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0";
    });
    if (activeBtn) activeBtn.className = "px-3.5 py-2 bg-white text-blue-600 font-bold rounded-xl text-xs sm:text-sm whitespace-nowrap shadow transition shrink-0";
}

// Bảng Xếp Hạng Chung (Hỗ trợ cuộn ngang bảng trên mobile)
async function loadLeaderboardTab(targetContainerId) {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md border dark:border-gray-700 space-y-4">
            <div>
                <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fa-solid fa-trophy text-amber-500"></i> Bảng Xếp Hạng Thành Tích
                </h3>
                <p class="text-xs text-gray-500 mt-1">Xếp hạng theo điểm số cao nhất và thời gian hoàn thành sớm nhất.</p>
            </div>
            <div id="leaderboard-ranking-list" class="overflow-x-auto">
                <p class="text-xs sm:text-sm text-gray-500 py-6 text-center">Đang tải bảng xếp hạng...</p>
            </div>
        </div>
    `;

    const rankingListEl = document.getElementById('leaderboard-ranking-list');
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();

        if (data.success && data.rankings.length > 0) {
            rankingListEl.innerHTML = `
                <table class="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr class="border-b dark:border-gray-700 text-xs text-gray-400 uppercase">
                            <th class="py-3 px-3">Hạng</th>
                            <th class="py-3 px-3">Học viên</th>
                            <th class="py-3 px-3">Đề thi</th>
                            <th class="py-3 px-3">Môn</th>
                            <th class="py-3 px-3 text-center">Đúng</th>
                            <th class="py-3 px-3 text-right">Điểm số</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y dark:divide-gray-700 text-xs sm:text-sm">
                        ${data.rankings.map((item, idx) => {
                            let badgeColor = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
                            if (idx === 0) badgeColor = "bg-amber-100 text-amber-800 font-black";
                            else if (idx === 1) badgeColor = "bg-slate-200 text-slate-800 font-bold";
                            else if (idx === 2) badgeColor = "bg-amber-700/20 text-amber-900 font-bold";

                            return `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <td class="py-3 px-3">
                                        <span class="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs ${badgeColor}">
                                            ${idx + 1}
                                        </span>
                                    </td>
                                    <td class="py-3 px-3 font-bold text-gray-800 dark:text-white truncate max-w-[120px] sm:max-w-none">${item.fullname || item.username}</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">${item.examCode}</span></td>
                                    <td class="py-3 px-3">${item.subject || 'N/A'}</td>
                                    <td class="py-3 px-3 text-center font-semibold">${item.correctCount}/${item.totalQuestions}</td>
                                    <td class="py-3 px-3 text-right font-black text-blue-600 text-sm sm:text-base">${item.score}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            rankingListEl.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">Chưa có dữ liệu xếp hạng nào.</div>`;
        }
    } catch (e) {
        rankingListEl.innerHTML = `<div class="text-center py-10 text-red-500 text-sm">Không thể tải bảng xếp hạng!</div>`;
    }
}

// Student Tab 1: Danh sách đề thi
function loadExamsTab() {
    const container = document.getElementById('student-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border dark:border-gray-700 flex gap-3 flex-wrap items-center">
            <div class="w-1/2 sm:w-auto">
                <label class="text-xs font-semibold text-gray-500 block mb-1">Môn học</label>
                <select id="student-filter-subject" class="w-full sm:w-auto px-3 py-1.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-xs sm:text-sm">
                    <option value="">-- Tất cả môn --</option>
                    <option value="Toán">Toán</option>
                    <option value="Anh">Anh</option>
                    <option value="Văn">Văn</option>
                </select>
            </div>
            <div class="w-1/2 sm:w-auto">
                <label class="text-xs font-semibold text-gray-500 block mb-1">Khối lớp</label>
                <select id="student-filter-grade" class="w-full sm:w-auto px-3 py-1.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-xs sm:text-sm">
                    <option value="">-- Tất cả lớp --</option>
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                </select>
            </div>
        </div>
        <div id="student-exam-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div class="col-span-full text-center py-10 text-gray-500 text-sm">Đang tải đề thi...</div>
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
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">${exam.examCode}</span>
                            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">${exam.grade}</span>
                        </div>
                        <h3 class="font-bold text-base sm:text-lg text-gray-800 dark:text-white mb-2">${exam.title || 'Đề thi ' + exam.subject}</h3>
                        <div class="text-xs text-gray-500 space-y-1 mb-4">
                            <p>Môn: <b class="text-gray-700 dark:text-gray-300">${exam.subject}</b></p>
                            <p>Thời gian: <b>${exam.timeLimit} phút</b></p>
                            <p>Số câu: <b>${exam.questions ? exam.questions.length : 0} câu</b></p>
                        </div>
                    </div>
                    <button onclick="window.startExam('${exam.examCode}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition shadow flex items-center justify-center gap-2">
                        <i class="fa-solid fa-pen-to-square"></i> Bắt đầu làm bài
                    </button>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400 text-sm">Không có đề thi nào khả dụng.</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 text-sm">Lỗi kết nối khi tải đề thi!</div>`;
    }
}

// Student Tab 2: Lịch sử cá nhân
async function loadExamHistoryTab() {
    const container = document.getElementById('student-main-content');
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md border dark:border-gray-700 space-y-4">
            <h3 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-blue-600"></i> Lịch Sử Làm Bài Của Tôi
            </h3>
            <div id="history-list-container" class="space-y-3">
                <p class="text-xs sm:text-sm text-gray-500 py-4 text-center">Đang tải lịch sử thi...</p>
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
                    <div class="p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-xs rounded">${item.examCode}</span>
                                <h4 class="font-bold text-sm sm:text-base text-gray-800 dark:text-white">${item.examTitle}</h4>
                            </div>
                            <p class="text-[11px] sm:text-xs text-gray-500">Môn: <b>${item.subject}</b> | Khối: <b>${item.grade}</b> | Lúc: ${dateStr}</p>
                        </div>
                        <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div class="text-left sm:text-right">
                                <p class="text-[10px] text-gray-400">Số câu đúng</p>
                                <p class="font-bold text-xs sm:text-sm">${item.correctCount}/${item.totalQuestions}</p>
                            </div>
                            <div class="text-left sm:text-right">
                                <p class="text-[10px] text-gray-400">Điểm số</p>
                                <p class="text-base sm:text-lg font-black text-blue-600">${item.score}</p>
                            </div>
                            <div>
                                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                                    ${isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            historyContainer.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">Bạn chưa có lịch sử làm bài thi nào.</div>`;
        }
    } catch (err) {
        historyContainer.innerHTML = `<div class="text-center py-10 text-red-500 text-sm">Không thể tải dữ liệu lịch sử thi!</div>`;
    }
}

// --- GIAO DIỆN LÀM BÀI THI (Tối ưu thiết bị di động) ---
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
            <div class="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-md border dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sticky top-3 z-40">
                <div>
                    <h2 class="font-bold text-sm sm:text-lg text-gray-800 dark:text-white truncate max-w-[280px] sm:max-w-none">${exam.title || exam.examCode}</h2>
                    <p class="text-[11px] sm:text-xs text-gray-500">Môn: ${exam.subject} | Tổng: ${exam.questions.length} câu</p>
                </div>
                <div class="flex items-center justify-between w-full sm:w-auto gap-3">
                    <div class="px-3 py-1.5 bg-red-100 text-red-700 font-mono font-bold text-sm sm:text-base rounded-xl flex items-center gap-2">
                        <i class="fa-solid fa-stopwatch"></i> <span id="time-countdown">--:--</span>
                    </div>
                    <button id="btn-submit-exam" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs sm:text-sm transition shadow">Nộp Bài</button>
                </div>
            </div>

            <div class="space-y-4">
                ${exam.questions.map((q, qIndex) => `
                    <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-md border dark:border-gray-700 space-y-3">
                        <p class="font-bold text-gray-900 dark:text-white text-xs sm:text-base">
                            <span class="text-blue-600 mr-1">Câu ${qIndex + 1}:</span>${q.question}
                        </p>
                        <div class="grid grid-cols-1 gap-2.5 pt-1">
                            ${['A', 'B', 'C', 'D'].map((optLabel, optIdx) => {
                                const optText = q.options?.[optIdx];
                                if (!optText) return '';
                                return `
                                    <label class="flex items-start gap-3 p-3 border rounded-xl dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer transition">
                                        <input type="radio" name="question-${qIndex}" value="${optLabel}" data-qindex="${qIndex}" class="mt-0.5 text-blue-600 shrink-0">
                                        <span class="text-xs sm:text-sm text-gray-700 dark:text-gray-300"><b>${optLabel}.</b> ${optText}</span>
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
        <div class="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl border dark:border-gray-700 space-y-6 mt-6">
            <div class="text-center space-y-2">
                <div class="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full text-2xl mb-1">
                    <i class="fa-solid fa-award"></i>
                </div>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Kết Quả Bài Thi</h2>
                <p class="text-gray-500 text-xs sm:text-sm">Đề thi: ${exam.title || exam.examCode}</p>
            </div>

            <div class="grid grid-cols-3 gap-3 p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                <div>
                    <p class="text-[11px] text-gray-500">Số câu đúng</p>
                    <p class="text-lg sm:text-2xl font-bold text-emerald-600">${correctCount}/${totalQuestions}</p>
                </div>
                <div>
                    <p class="text-[11px] text-gray-500">Điểm số</p>
                    <p class="text-xl sm:text-3xl font-black text-blue-600">${score}</p>
                </div>
                <div>
                    <p class="text-[11px] text-gray-500">Trạng thái</p>
                    <p class="text-sm sm:text-lg font-bold ${score >= 5 ? 'text-emerald-600' : 'text-red-500'}">${score >= 5 ? 'Đạt ✅' : 'Chưa đạt ❌'}</p>
                </div>
            </div>

            <div class="pt-2 flex justify-center">
                <button id="btn-back-dashboard" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition shadow text-sm">
                    Quay Về Trang Chủ
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
        ? 'mb-4 p-3 rounded-xl text-xs sm:text-sm bg-green-100 text-green-700' 
        : 'mb-4 p-3 rounded-xl text-xs sm:text-sm bg-red-100 text-red-700';
    element.innerText = message;
}

function handleLogout() {
    currentUser = null;
    currentAuthToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    renderAppView();
}

// ==========================================
// TÍNH NĂNG ĐỔI MẬT KHẨU (SPA Component)
// ==========================================

export function renderChangePasswordView() {
    const appView = document.getElementById('app-view');
    if (!appView) return;

    appView.innerHTML = `
        <div class="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                <i class="fa-solid fa-key text-blue-500 mr-2"></i> Đổi Mật Khẩu
            </h3>
            
            <div id="password-message" class="hidden mb-4 p-3 rounded-lg text-sm font-medium text-center"></div>

            <form id="change-password-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Mật khẩu hiện tại</label>
                    <input type="password" id="currentPassword" required 
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        placeholder="••••••••">
                </div>

                <div>
                    <label class="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Mật khẩu mới</label>
                    <input type="password" id="newPassword" required 
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        placeholder="••••••••">
                </div>

                <div>
                    <label class="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Xác nhận mật khẩu mới</label>
                    <input type="password" id="confirmPassword" required 
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        placeholder="••••••••">
                </div>

                <button type="submit" id="submit-btn" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 shadow-sm cursor-pointer">
                    Cập nhật mật khẩu
                </button>
            </form>
        </div>
    `;

    setupChangePasswordEvent();
}

function setupChangePasswordEvent() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (newPassword !== confirmPassword) {
            showPasswordMessage('Mật khẩu mới và xác nhận mật khẩu không khớp!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showPasswordMessage('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showPasswordMessage('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!', 'error');
                return;
            }

            // Đã đồng bộ sử dụng biến API_URL thay vì hardcode /api/change-password
            const response = await fetch(`${API_URL}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showPasswordMessage(data.message || 'Đổi mật khẩu thành công!', 'success');
                form.reset();
            } else {
                showPasswordMessage(data.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
            }

        } catch (error) {
            console.error('Lỗi kết nối API đổi mật khẩu:', error);
            showPasswordMessage('Không thể kết nối đến máy chủ, vui lòng thử lại sau.', 'error');
        }
    });
}

function showPasswordMessage(text, type) {
    const messageDiv = document.getElementById('password-message');
    if (!messageDiv) return;

    messageDiv.textContent = text;
    messageDiv.classList.remove('hidden');

    if (type === 'success') {
        messageDiv.className = 'mb-4 p-3 rounded-lg text-sm font-medium text-center bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    } else {
        messageDiv.className = 'mb-4 p-3 rounded-lg text-sm font-medium text-center bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
}
