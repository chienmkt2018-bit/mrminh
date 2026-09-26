// frontend/assets/js/app.js - Logic điều phối chính của ứng dụng SPA

// Tự động nhận diện môi trường API
export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api'; // Khi lên Render, tự động gọi vào /api cùng domain hiện tại

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentAuthToken = localStorage.getItem('token') || null;

// Khởi chạy ứng dụng khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderAppView();
    setupAuthListeners();
});

// Quản lý Dark / Light Mode
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
}

// Chuyển đổi qua lại các View (SPA)
export function renderAppView() {
    const appView = document.getElementById('app-view');
    if (!appView) return;

    if (!currentUser) {
        // Giao diện Đăng nhập / Đăng ký
        appView.innerHTML = `
            <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl mt-10">
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold">Xin mời đăng nhập</h2>
                    <p class="text-sm text-gray-500 mt-1">Nền tảng học tập trực tuyến thông minh</p>
                </div>
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                        <input type="text" id="username" required class="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                        <input type="password" id="password" required class="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition shadow-md">Đăng Nhập</button>
                </form>
            </div>
        `;
        setupAuthListeners();
    } else {
        if (currentUser.role === 'admin') {
            renderAdminDashboard(appView);
        } else {
            renderStudentDashboard(appView);
        }
    }
}

// Xử lý sự kiện đăng nhập
function setupAuthListeners() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (data.success) {
                currentUser = { username: data.username, role: data.role, mcion: data.mcion };
                currentAuthToken = data.token;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('token', currentAuthToken);
                alert('Đăng nhập thành công!');
                renderAppView();
            } else {
                alert(data.message || 'Đăng nhập thất bại!');
            }
        } catch (err) {
            console.error('Lỗi kết nối API:', err);
            // Fallback đăng nhập giả lập khi test local chưa bật server
            if (username === 'admin' && password === 'admin123') {
                currentUser = { username: 'admin', role: 'admin', mcion: 9999 };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                renderAppView();
            } else {
                alert('Không thể kết nối tới Server Backend trên Render.');
            }
        }
    });
}

function renderStudentDashboard(container) {
    container.innerHTML = `
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold">Chào mừng, ${currentUser.username}! 🎓</h2>
                <p class="text-blue-100 text-sm mt-1">Tài khoản học viên | Số xu Mcion: <span class="font-bold text-amber-300">${currentUser.mcion || 0}</span></p>
            </div>
            <button id="logout-btn" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">Đăng xuất</button>
        </div>
        <div class="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <h3 class="text-lg font-bold mb-4">Danh sách bài thi khả dụng</h3>
            <p class="text-sm text-gray-500">Chưa có bài thi nào được khởi tạo. Vui lòng đợi thông báo từ giáo viên.</p>
        </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="bg-gray-800 text-white rounded-2xl p-6 shadow-lg flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold">Quản Trị Viên (Admin Dashboard) 👑</h2>
                <p class="text-gray-400 text-sm mt-1">Quản lý hệ thống đề thi và học viên toàn trường.</p>
            </div>
            <button id="logout-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">Đăng xuất</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
                <p class="text-sm text-gray-400">Tổng học sinh</p>
                <h4 class="text-3xl font-bold mt-1">1,240</h4>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
                <p class="text-sm text-gray-400">Tổng đề thi</p>
                <h4 class="text-3xl font-bold mt-1">85</h4>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-amber-500">
                <p class="text-sm text-gray-400">Điểm trung bình</p>
                <h4 class="text-3xl font-bold mt-1">7.8</h4>
            </div>
        </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function logout() {
    currentUser = null;
    currentAuthToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    renderAppView();
}