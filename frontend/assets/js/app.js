// frontend/assets/js/app.js - Quản lý giao diện SPA, Đăng nhập & Đăng ký học viên

// Xác định API URL linh hoạt giữa môi trường Localhost và Render Cloud
export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentAuthToken = localStorage.getItem('token') || null;

// Khởi chạy ứng dụng khi DOM đã load xong
document.addEventListener('DOMContentLoaded', () => {
    renderAppView();
});

// Điều phối hiển thị các View chính dựa trên trạng thái đăng nhập
export function renderAppView() {
    const appView = document.getElementById('app-view');
    const userInfoHeader = document.getElementById('user-info');
    if (!appView) return;

    if (!currentUser) {
        if (userInfoHeader) userInfoHeader.innerHTML = '';
        renderLoginView(appView); // Mặc định hiển thị form đăng nhập
    } else {
        if (userInfoHeader) {
            userInfoHeader.innerHTML = `
                <span>Xin chào, <b>${currentUser.username}</b></span>
                <button id="logout-btn" class="ml-3 text-red-500 hover:text-red-700 font-semibold text-xs">Đăng xuất</button>
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
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg mt-10">
            <h2 class="text-2xl font-bold mb-6 text-center">Xin mời đăng nhập</h2>
            
            <div id="auth-message" class="hidden mb-4 p-3 rounded-lg text-sm"></div>

            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                    <input type="text" id="username" placeholder="Nhập tên đăng nhập" required 
                           class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input type="password" id="password" placeholder="Nhập mật khẩu" required 
                           class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition shadow-md">
                    Đăng Nhập
                </button>
            </form>

            <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Chưa có tài khoản học viên? 
                <button id="go-to-register" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1">Đăng ký ngay</button>
            </div>
        </div>
    `;

    // Gắn sự kiện xử lý đăng nhập
    document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
    // Chuyển sang màn hình đăng ký
    document.getElementById('go-to-register').addEventListener('click', () => renderRegisterView(container));
}

// --- 2. GIAO DIỆN ĐĂNG KÝ HỌC VIÊN MỚI ---
function renderRegisterView(container) {
    container.innerHTML = `
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg mt-10">
            <h2 class="text-2xl font-bold mb-2 text-center">Đăng Ký Học Viên</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Tạo tài khoản mới để tham gia học tập.</p>
            
            <div id="auth-message" class="hidden mb-4 p-3 rounded-lg text-sm"></div>

            <form id="register-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Họ và tên</label>
                    <input type="text" id="reg-fullname" placeholder="Nguyễn Văn A" required 
                           class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Tên đăng nhập</label>
                    <input type="text" id="reg-username" placeholder="nguyenvana" required 
                           class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input type="password" id="reg-password" placeholder="Ít nhất 6 ký tự" required 
                           class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition shadow-md">
                    Xác Nhận Đăng Ký
                </button>
            </form>

            <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Đã có tài khoản? 
                <button id="go-to-login" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1">Đăng nhập</button>
            </div>
        </div>
    `;

    // Gắn sự kiện xử lý đăng ký gửi lên Backend API
    document.getElementById('register-form').addEventListener('submit', handleRegisterSubmit);
    // Quay lại màn hình đăng nhập
    document.getElementById('go-to-login').addEventListener('click', () => renderLoginView(container));
}

// --- 3. XỬ LÝ LOGIC API ---

// Xử lý gửi yêu cầu Đăng nhập
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
            currentUser = { username: data.username, role: data.role, mcion: data.mcion };
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

// Xử lý gửi yêu cầu Đăng ký học viên mới tới API /api/register
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

// Hàm hiển thị thông báo lỗi/thành công trực quan
function showNotification(element, message, type) {
    element.classList.remove('hidden');
    if (type === 'success') {
        element.className = 'mb-4 p-3 rounded-lg text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    } else {
        element.className = 'mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
    element.innerText = message;
}

// --- 4. DASHBOARD PHÂN QUYỀN ---
function renderStudentDashboard(container) {
    container.innerHTML = `
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center mt-6">
            <div>
                <h2 class="text-2xl font-bold">Chào mừng học viên, ${currentUser.username}! 🎓</h2>
                <p class="text-blue-100 text-sm mt-1">Nền tảng học tập trực tuyến đang sẵn sàng cho bạn.</p>
            </div>
        </div>
    `;
}

function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="bg-gray-800 text-white rounded-2xl p-6 shadow-lg flex justify-between items-center mt-6">
            <div>
                <h2 class="text-2xl font-bold">Bảng Điều Kiển Quản Trị (Admin Dashboard) 👑</h2>
                <p class="text-gray-400 text-sm mt-1">Quản lý toàn bộ hệ thống học viên và đề thi.</p>
            </div>
        </div>
    `;
}

// Xử lý Đăng xuất
function handleLogout() {
    currentUser = null;
    currentAuthToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    renderAppView();
}