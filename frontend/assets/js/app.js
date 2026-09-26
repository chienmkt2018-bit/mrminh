import { initExamRoom } from './exam.js';

console.log('✅ ES Modules đã được khởi tạo thành công!');

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Giả lập kết nối API tới Backend
    alert(`Đang đăng nhập với tài khoản: ${username}`);
});