// frontend/assets/js/exam.js - Logic phòng thi trực tuyến

export function initExamRoom(examData) {
    console.log('📝 Khởi tạo phòng thi trực tuyến:', examData);
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let timeLeft = examData.timeLimit ? examData.timeLimit * 60 : 1800; // Mặc định 30 phút

    // Chạy đồng hồ đếm ngược
    const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.');
            submitExam(examData, userAnswers);
            return;
        }
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

function submitExam(examData, userAnswers) {
    console.log('📤 Đã nộp bài thi với các đáp án:', userAnswers);
    // Xử lý logic chấm điểm và cộng thưởng Mcion
}