// backend/server.js - Đã bổ sung API /api/admin/stats cho Admin Dashboard
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- 1. KẾT NỐI MONGODB ATLAS ---
if (!MONGODB_URI) {
    console.error('❌ Thiếu biến môi trường MONGODB_URI!');
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');
            initDefaultAdmin();
        })
        .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));
}

// --- 2. SCHEMAS & MODELS (Cơ sở dữ liệu) ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    fullname: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'student' },
    avatar: { type: String, default: '' },
    mcion: { type: Number, default: 0 },
    inventory: { type: [String], default: [] }
}, { timestamps: true });

const ExamSchema = new mongoose.Schema({
    examCode: { type: String, required: true, unique: true },
    title: { type: String, default: '' },
    subject: { type: String, default: 'Toán' },
    grade: { type: String, default: 'Lớp 1' },
    timeLimit: { type: Number, default: 30 },
    questions: { type: Array, default: [] }
}, { timestamps: true });

const HistorySchema = new mongoose.Schema({
    id: { type: String, default: () => uuidv4() },
    username: { type: String, required: true },
    fullname: { type: String, default: '' },
    examCode: { type: String, required: true },
    examTitle: { type: String, default: '' },
    subject: { type: String, default: '' },
    grade: { type: String, default: '' },
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    time: { type: String, default: '' },
    earnedMcion: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Exam = mongoose.model('Exam', ExamSchema);
const History = mongoose.model('History', HistorySchema);

// --- 3. KHỞI TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH ---
async function initDefaultAdmin() {
    try {
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (!existingAdmin) {
            const hash = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                fullname: 'Administrator',
                passwordHash: hash,
                role: 'admin'
            });
            console.log('👑 Đã tạo tài khoản Admin mặc định (user: admin / pass: admin123)');
        }
    } catch (e) {
        console.error('Lỗi khi khởi tạo Admin mặc định:', e);
    }
}

// --- 4. API ENDPOINTS ---

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'EduSystem API is running successfully!' });
});

// Đăng ký tài khoản học sinh
app.post('/api/register', async (req, res) => {
    try {
        const { fullname, username, password } = req.body;
        if (!fullname || !username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin đăng ký!' });
        }

        const safeUsername = username.trim().toLowerCase();
        const exists = await User.findOne({ username: safeUsername });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại trên hệ thống!' });
        }

        const hash = await bcrypt.hash(password, 10);
        await User.create({
            username: safeUsername,
            fullname: fullname.trim(),
            passwordHash: hash,
            role: 'student'
        });

        res.json({ success: true, message: 'Đăng ký tài khoản thành công!' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Đăng nhập phân quyền
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });
        }

        const safeUsername = username.trim().toLowerCase();
        const user = await User.findOne({ username: safeUsername });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
        }

        if (role && user.role !== role) {
            return res.status(401).json({ success: false, message: 'Sai vai trò đăng nhập hệ thống!' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu đăng nhập không chính xác!' });
        }

        const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            avatar: user.avatar,
            mcion: user.mcion,
            inventory: user.inventory
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- API QUẢN LÝ ĐỀ THI ---
app.get('/api/exams', async (req, res) => {
    try {
        const { subject, grade } = req.query;
        let filter = {};
        if (subject) filter.subject = subject;
        if (grade) filter.grade = grade;

        const exams = await Exam.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, exams });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/exams', async (req, res) => {
    try {
        const { examCode, title, subject, grade, timeLimit, questions } = req.body;
        if (!examCode || !subject || !grade || !questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin và tạo ít nhất 1 câu hỏi!' });
        }

        const safeCode = examCode.trim().toUpperCase();
        const exists = await Exam.findOne({ examCode: safeCode });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Mã đề thi này đã tồn tại trên hệ thống!' });
        }

        const newExam = await Exam.create({
            examCode: safeCode,
            title: title || `Đề thi ${subject} - ${grade}`,
            subject,
            grade,
            timeLimit: Number(timeLimit) || 30,
            questions
        });

        res.json({ success: true, message: 'Thêm đề thi mới thành công!', exam: newExam });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.delete('/api/exams/:examCode', async (req, res) => {
    try {
        const { examCode } = req.params;
        await Exam.deleteOne({ examCode });
        res.json({ success: true, message: 'Đã xóa đề thi thành công!' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- API KẾT QUẢ THI & LỊCH SỬ ---
app.post('/api/results', async (req, res) => {
    try {
        const { username, examCode, examTitle, subject, grade, score, correctCount, totalQuestions } = req.body;
        if (!username || !examCode) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin học viên hoặc mã đề thi!' });
        }

        const user = await User.findOne({ username });
        const newHistory = await History.create({
            username,
            fullname: user ? user.fullname : username,
            examCode,
            examTitle: examTitle || `Đề thi ${examCode}`,
            subject: subject || 'Toán',
            grade: grade || 'Lớp 1',
            correctCount: Number(correctCount) || 0,
            totalQuestions: Number(totalQuestions) || 0,
            score: Number(score) || 0,
            time: new Date().toLocaleTimeString('vi-VN')
        });

        res.json({ success: true, message: 'Đã lưu lịch sử thi thành công!', history: newHistory });
    } catch (e) {
        console.error('Lỗi lưu kết quả:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/results', async (req, res) => {
    try {
        const { username, search } = req.query;
        let filter = {};

        if (username) filter.username = username;
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { username: regex },
                { fullname: regex },
                { examCode: regex },
                { subject: regex }
            ];
        }

        const results = await History.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, results });
    } catch (e) {
        console.error('Lỗi lấy lịch sử:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const { examCode } = req.query;
        let filter = {};
        if (examCode) filter.examCode = examCode;

        const rankings = await History.find(filter)
            .sort({ score: -1, createdAt: 1 })
            .limit(50);

        res.json({ success: true, rankings });
    } catch (e) {
        console.error('Lỗi lấy bảng xếp hạng:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- API THỐNG KÊ DASHBOARD ADMIN (MỚI) ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        // 1. Tổng học sinh (chỉ đếm role student)
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // 2. Tổng đề thi
        const totalExams = await Exam.countDocuments({});
        
        // 3. Tổng lượt thi
        const totalAttempts = await History.countDocuments({});
        
        // 4. Điểm trung bình toàn hệ thống
        const avgResult = await History.aggregate([
            { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]);
        const averageScore = avgResult.length > 0 ? parseFloat(avgResult[0].avgScore.toFixed(2)) : 0;

        // 5. Top học sinh xuất sắc nhất (lấy top 5 bài điểm cao nhất)
        const topStudents = await History.find()
            .sort({ score: -1, createdAt: 1 })
            .limit(5);

        // Dữ liệu cho biểu đồ: Lượt thi theo môn học
        const attemptsBySubject = await History.aggregate([
            { $group: { _id: '$subject', count: {$sum: 1 } } }
        ]);

        // Dữ liệu cho biểu đồ: Đề thi theo môn học
        const examsBySubject = await Exam.aggregate([
            { $group: { _id: '$subject', count: {$sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalExams,
                totalAttempts,
                averageScore,
                topStudents,
                attemptsBySubject,
                examsBySubject
            }
        });
    } catch (e) {
        console.error('Lỗi khi lấy thống kê admin:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- 5. CẤU HÌNH PHỤC VỤ FRONT-END ---
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server Backend đang chạy mượt mà tại cổng ${PORT}`);
});
