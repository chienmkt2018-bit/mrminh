// backend/server.js - Backend hỗ trợ API quản trị và học tập
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Sử dụng nhất quán bcryptjs
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET chưa được cấu hình. Token sẽ mất hiệu lực khi máy chủ khởi động lại; hãy đặt JWT_SECRET trong môi trường triển khai.');
}
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

// --- 2. SCHEMAS & MODELS ---
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
    time: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Exam = mongoose.model('Exam', ExamSchema);
const History = mongoose.model('History', HistorySchema);

// --- 3. MIDDLEWARE XÁC THỰC VÀ PHÂN QUYỀN ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
    }

    jwt.verify(match[1], JWT_SECRET, (err, payload) => {
        if (err || !payload || typeof payload.username !== 'string') {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
        }
        req.user = { username: payload.username };
        next();
    });
};

const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.user.username }).select('username role fullname');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện chức năng quản trị.' });
        }
        req.authUser = user;
        next();
    } catch (error) {
        console.error('Lỗi kiểm tra quyền quản trị:', error);
        res.status(500).json({ success: false, message: 'Không thể xác minh quyền truy cập.' });
    }
};

// --- 4. KHỞI TẠO ADMIN (CHỈ KHI ĐÃ CẤU HÌNH BẰNG BIẾN MÔI TRƯỜNG) ---
async function initDefaultAdmin() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminUsername || !adminPassword) {
        console.log('ℹ️ Bỏ qua tạo Admin mặc định: hãy tạo tài khoản quản trị an toàn hoặc cấu hình ADMIN_USERNAME/ADMIN_PASSWORD.');
        return;
    }

    try {
        const safeUsername = adminUsername.trim().toLowerCase();
        const existingUser = await User.findOne({ username: safeUsername });
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        if (existingUser && existingUser.role !== 'admin') {
            console.error('❌ ADMIN_USERNAME đang trùng với tài khoản không phải Admin. Hãy chọn username quản trị riêng.');
            return;
        }

        if (existingUser) {
            // Khi đã cấu hình biến môi trường, đồng bộ lại mật khẩu Admin để loại bỏ mật khẩu mặc định cũ.
            existingUser.passwordHash = passwordHash;
            await existingUser.save();
            console.log('🔐 Đã cập nhật mật khẩu tài khoản quản trị từ biến môi trường.');
        } else {
            await User.create({
                username: safeUsername,
                fullname: 'Administrator',
                passwordHash,
                role: 'admin'
            });
            console.log('👑 Đã tạo tài khoản quản trị từ biến môi trường.');
        }
    } catch (error) {
        console.error('Lỗi khi khởi tạo Admin:', error);
    }
}

// --- 5. API ENDPOINTS ---

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

// Đăng nhập hệ thống
app.post('/api/login', async (req, res) => {
    const startedAt = Date.now();
    const requestId = Math.random().toString(36).slice(2, 8);
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });
        }

        const safeUsername = String(username).trim().toLowerCase();
        console.log(`[LOGIN:${requestId}] Bắt đầu xác thực username="${safeUsername}", MongoDB state=${mongoose.connection.readyState}`);

        // Không để yêu cầu đăng nhập bị treo trong hàng đợi kết nối MongoDB.
        if (mongoose.connection.readyState !== 1) {
            console.error(`[LOGIN:${requestId}] MongoDB chưa sẵn sàng (state=${mongoose.connection.readyState})`);
            return res.status(503).json({
                success: false,
                message: 'Cơ sở dữ liệu đang kết nối hoặc tạm thời không khả dụng. Vui lòng thử lại sau.'
            });
        }

        console.log(`[LOGIN:${requestId}] Đang tìm tài khoản`);
        const user = await User.findOne({ username: safeUsername }).maxTimeMS(8000).exec();
        console.log(`[LOGIN:${requestId}] Kết quả tìm tài khoản: ${user ? 'found' : 'not found'}; ${Date.now() - startedAt}ms`);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
        }

        console.log(`[LOGIN:${requestId}] Đang kiểm tra mật khẩu`);
        const isMatch = await bcrypt.compare(String(password), user.passwordHash);
        console.log(`[LOGIN:${requestId}] Kiểm tra mật khẩu hoàn tất; ${Date.now() - startedAt}ms`);
        if (!isMatch) {
            console.warn(`[LOGIN:${requestId}] Mật khẩu không khớp; ${Date.now() - startedAt}ms`);
            return res.status(401).json({ success: false, message: 'Mật khẩu đăng nhập không chính xác!' });
        }

        // Chặn tài khoản quản trị cũ nếu vẫn dùng mật khẩu mặc định đã biết.
        if (user.role === 'admin' && await bcrypt.compare('admin123', user.passwordHash)) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản quản trị vẫn dùng mật khẩu mặc định. Hãy đặt ADMIN_USERNAME và ADMIN_PASSWORD an toàn trong Render Environment rồi triển khai lại.'
            });
        }

        const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        console.log(`[LOGIN:${requestId}] Đăng nhập thành công, role=${user.role}; ${Date.now() - startedAt}ms`);
        return res.json({
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
        console.error(`[LOGIN:${requestId}] Lỗi sau ${Date.now() - startedAt}ms:`, e);
        if (!res.headersSent) {
            const timedOut = e && (e.code === 50 || e.code === 'ETIMEOUT' || /timed out|timeout/i.test(e.message || ''));
            return res.status(timedOut ? 504 : 500).json({
                success: false,
                message: timedOut
                    ? 'Truy vấn tài khoản quá thời gian cho phép. Hãy kiểm tra kết nối MongoDB và Render Logs.'
                    : 'Máy chủ gặp lỗi khi xác thực tài khoản. Hãy kiểm tra Render Logs.'
            });
        }
    }
});

// API Đổi mật khẩu (Đã chỉnh sửa khớp với UserSchema và Token payload)
app.put('/api/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    // Kiểm tra mật khẩu mới và xác nhận có khớp không
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' });
    }

    // Tìm user theo username lấy từ token đã được xác thực
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    // Kiểm tra mật khẩu hiện tại có đúng không (so sánh với passwordHash)
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    }

    // Mã hóa mật khẩu mới và lưu vào trường passwordHash
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Lưu lại vào DB
    await user.save();

    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });

  } catch (error) {
    console.error('Lỗi server khi đổi mật khẩu:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau.' });
  }
});

// Quản lý đề thi
// Học viên chỉ nhận nội dung câu hỏi; đáp án chỉ được trả về cho Admin.
app.get('/api/exams', verifyToken, async (req, res) => {
    try {
        const { subject, grade } = req.query;
        const filter = {};
        if (subject) filter.subject = subject;
        if (grade) filter.grade = grade;

        const isAdmin = await User.exists({ username: req.user.username, role: 'admin' });
        const docs = await Exam.find(filter).sort({ createdAt: -1 }).lean();
        const exams = docs.map(exam => {
            if (!isAdmin) {
                exam.questions = (exam.questions || []).map(question => {
                    const { answer, ...publicQuestion } = question || {};
                    return publicQuestion;
                });
            }
            return exam;
        });
        res.json({ success: true, exams });
    } catch (error) {
        console.error('Lỗi tải đề thi:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách đề thi.' });
    }
});

app.post('/api/exams', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { examCode, title, subject, grade, timeLimit, questions } = req.body || {};
        if (typeof examCode !== 'string' || !examCode.trim() || !subject || !grade ||
            !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin và tạo ít nhất 1 câu hỏi!' });
        }

        const safeCode = examCode.trim().toUpperCase();
        const exists = await Exam.findOne({ examCode: safeCode });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Mã đề thi này đã tồn tại!' });
        }

        const sanitizedQuestions = questions.map(question => ({
            question: String(question.question || '').trim(),
            options: Array.isArray(question.options) ? question.options.slice(0, 4).map(option => String(option)) : [],
            answer: String(question.answer || '').toUpperCase()
        }));
        const invalidQuestion = sanitizedQuestions.some(question =>
            !question.question || question.options.length !== 4 ||
            question.options.some(option => !option.trim()) ||
            !['A', 'B', 'C', 'D'].includes(question.answer)
        );
        if (invalidQuestion) {
            return res.status(400).json({ success: false, message: 'Mỗi câu hỏi phải có nội dung, đủ 4 lựa chọn và đáp án A/B/C/D hợp lệ.' });
        }

        const newExam = await Exam.create({
            examCode: safeCode,
            title: title || `Đề thi ${subject} - ${grade}`,
            subject,
            grade,
            timeLimit: Math.max(1, Math.min(240, Number(timeLimit) || 30)),
            questions: sanitizedQuestions
        });
        res.status(201).json({ success: true, message: 'Thêm đề thi mới thành công!', exam: newExam });
    } catch (error) {
        console.error('Lỗi tạo đề thi:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo đề thi.' });
    }
});

app.delete('/api/exams/:examCode', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await Exam.deleteOne({ examCode: String(req.params.examCode).toUpperCase() });
        if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi.' });
        res.json({ success: true, message: 'Đã xóa đề thi thành công!' });
    } catch (error) {
        console.error('Lỗi xóa đề thi:', error);
        res.status(500).json({ success: false, message: 'Không thể xóa đề thi.' });
    }
});

// Lịch sử thi & Kết quả
// Điểm được chấm trên máy chủ; không nhận username/điểm do trình duyệt tự khai báo.
app.post('/api/results', verifyToken, async (req, res) => {
    try {
        const { examCode, answers } = req.body || {};
        if (typeof examCode !== 'string' || !examCode.trim() || !answers || typeof answers !== 'object' || Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu nộp bài không hợp lệ.' });
        }

        const user = await User.findOne({ username: req.user.username }).select('username fullname');
        if (!user) return res.status(401).json({ success: false, message: 'Tài khoản không còn tồn tại. Vui lòng đăng nhập lại.' });

        const exam = await Exam.findOne({ examCode: examCode.trim().toUpperCase() }).lean();
        if (!exam) return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi.' });
        const questions = Array.isArray(exam.questions) ? exam.questions : [];
        if (!questions.length) return res.status(400).json({ success: false, message: 'Đề thi chưa có câu hỏi.' });

        let correctCount = 0;
        questions.forEach((question, index) => {
            if (String(answers[index] || '').toUpperCase() === String(question.answer || '').toUpperCase()) correctCount++;
        });
        const totalQuestions = questions.length;
        const score = Number(((correctCount / totalQuestions) * 10).toFixed(2));

        const history = await History.create({
            username: user.username,
            fullname: user.fullname || user.username,
            examCode: exam.examCode,
            examTitle: exam.title || `Đề thi ${exam.examCode}`,
            subject: exam.subject || '',
            grade: exam.grade || '',
            correctCount,
            totalQuestions,
            score,
            time: new Date().toLocaleTimeString('vi-VN')
        });
        res.status(201).json({
            success: true,
            message: 'Đã chấm và lưu kết quả bài thi.',
            result: { correctCount, totalQuestions, score },
            historyId: history.id
        });
    } catch (error) {
        console.error('Lỗi chấm/lưu kết quả:', error);
        res.status(500).json({ success: false, message: 'Không thể chấm hoặc lưu kết quả bài thi.' });
    }
});

app.get('/api/results', verifyToken, async (req, res) => {
    try {
        const isAdmin = await User.exists({ username: req.user.username, role: 'admin' });
        const { search } = req.query;
        const filter = {};

        if (!isAdmin) {
            filter.username = req.user.username;
        } else if (search) {
            const escapedSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedSearch, 'i');
            filter.$or = [
                { username: regex },
                { fullname: regex },
                { examCode: regex },
                { subject: regex }
            ];
        }

        const results = await History.find(filter).sort({ createdAt: -1 }).limit(isAdmin ? 500 : 100).lean();
        res.json({ success: true, results });
    } catch (error) {
        console.error('Lỗi tải kết quả:', error);
        res.status(500).json({ success: false, message: 'Không thể tải lịch sử thi.' });
    }
});

app.get('/api/leaderboard', verifyToken, async (req, res) => {
    try {
        const { examCode } = req.query;
        let filter = {};
        if (examCode) filter.examCode = examCode;

        const rankings = await History.find(filter)
            .sort({ score: -1, createdAt: 1 })
            .limit(50);

        res.json({ success: true, rankings });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Thống kê Dashboard Admin
app.get('/api/admin/stats', verifyToken, requireAdmin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalExams = await Exam.countDocuments({});
        const totalAttempts = await History.countDocuments({});
        
        const avgResult = await History.aggregate([
            { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]);
        const averageScore = avgResult.length > 0 ? parseFloat(avgResult[0].avgScore.toFixed(2)) : 0;

        const topStudents = await History.find()
            .sort({ score: -1, createdAt: 1 })
            .limit(5);

        const attemptsBySubject = await History.aggregate([
            { $group: { _id: '$subject', count: {$sum: 1 } } }
        ]);

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
        res.status(500).json({ success: false, message: e.message });
    }
});

// Phục vụ Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server Backend đang chạy tại cổng ${PORT}`);
});
