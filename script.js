// State aplikasi
let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let quizCompleted = false;
let timer = null;
let timeLeft = 0;
let startTime = null;

// Elemen DOM
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const quizContainer = document.getElementById('quizContainer');
const resultContainer = document.getElementById('resultContainer');
const reviewContainer = document.getElementById('reviewContainer');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const questionNumberEl = document.getElementById('questionNumber');
const questionTextEl = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const quizTitle = document.getElementById('quizTitle');

// Muat soal dari file JSON
async function loadQuestions() {
    try {
        loadingEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        
        // Ambil data dari file JSON
        const response = await fetch('questions.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        quizData = await response.json();
        
        // Inisialisasi state
        userAnswers = new Array(quizData.questions.length).fill(null);
        timeLeft = quizData.metadata.timeLimit * 60; // konversi ke detik
        
        // Tampilkan metadata
        quizTitle.textContent = quizData.metadata.title;
        totalQuestionsEl.textContent = quizData.questions.length;
        
        // Mulai quiz
        startTimer();
        displayQuestion();
        
        loadingEl.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error:', error);
        showError('Gagal memuat soal. Pastikan file questions.json tersedia.');
    }
}

// Mulai timer
function startTimer() {
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('Waktu habis! Quiz akan segera berakhir.');
            showResult();
            return;
        }
        
        timeLeft--;
        updateTimerDisplay();
    }, 1000);
    
    startTime = new Date();
}

// Update tampilan timer
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Hitung waktu pengerjaan
function getTimeTaken() {
    if (!startTime) return '00:00';
    
    const endTime = new Date();
    const diffInSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Tampilkan soal
function displayQuestion() {
    if (!quizData) return;
    
    const question = quizData.questions[currentQuestionIndex];
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    questionNumberEl.textContent = `Soal ${currentQuestionIndex + 1}`;
    questionTextEl.textContent = question.question;

    // Generate options
    let optionsHtml = '';
    question.options.forEach((option, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index;
        const selectedClass = isSelected ? 'selected' : '';
        optionsHtml += `<div class="option ${selectedClass}" onclick="selectOption(${index})">${option}</div>`;
    });
    optionsContainer.innerHTML = optionsHtml;

    // Update tombol navigasi
    updateNavigationButtons();
}

// Pilih opsi jawaban
function selectOption(optionIndex) {
    if (quizCompleted) return;

    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Hapus class selected dari semua option
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Tambah class selected ke option yang dipilih
    document.querySelectorAll('.option')[optionIndex].classList.add('selected');
    
    updateScore();
}

// Update skor
function updateScore() {
    if (!quizData) return;
    
    score = 0;
    userAnswers.forEach((answer, index) => {
        if (answer !== null && answer === quizData.questions[index].correctAnswer) {
            score++;
        }
    });
    scoreEl.textContent = score;
}

// Navigasi ke soal sebelumnya
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// Navigasi ke soal selanjutnya
function nextQuestion() {
    if (currentQuestionIndex < quizData.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

// Update tombol navigasi
function updateNavigationButtons() {
    if (!quizData) return;
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.questions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// Tampilkan hasil quiz
function showResult() {
    clearInterval(timer);
    
    // Cek apakah semua soal sudah dijawab
    const unansweredQuestions = userAnswers.filter(answer => answer === null).length;
    
    if (unansweredQuestions > 0) {
        if (!confirm(`Masih ada ${unansweredQuestions} soal yang belum dijawab. Apakah Anda yakin ingin menyelesaikan quiz?`)) {
            startTimer();
            return;
        }
    }

    quizCompleted = true;
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    const totalQuestions = quizData.questions.length;
    const correctAnswers = score;
    const wrongAnswers = totalQuestions - correctAnswers;
    const percentage = (correctAnswers / totalQuestions) * 100;

    document.getElementById('finalScore').textContent = `${correctAnswers}/${totalQuestions}`;
    document.getElementById('totalQuestionsResult').textContent = totalQuestions;
    document.getElementById('correctAnswers').textContent = correctAnswers;
    document.getElementById('wrongAnswers').textContent = wrongAnswers;
    document.getElementById('percentage').textContent = `${percentage.toFixed(1)}%`;
    document.getElementById('timeTaken').textContent = getTimeTaken();

    let message = '';
    if (percentage >= 90) {
        message = '🌟 Luar biasa! Kamu sangat pintar matematika!';
    } else if (percentage >= 70) {
        message = '👍 Bagus! Terus tingkatkan belajarmu!';
    } else if (percentage >= 50) {
        message = '📚 Cukup baik, tapi perlu lebih banyak latihan!';
    } else {
        message = '💪 Jangan menyerah! Ayo belajar lagi!';
    }
    document.getElementById('resultMessage').textContent = message;
}

// Tampilkan pembahasan soal
function showReview() {
    resultContainer.classList.add('hidden');
    reviewContainer.classList.remove('hidden');
    
    let reviewHtml = '';
    
    quizData.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        reviewHtml += `
            <div class="review-item">
                <div class="review-question">Soal ${index + 1}: ${question.question}</div>
                <div class="review-answer correct-answer">✓ Jawaban benar: ${question.options[question.correctAnswer]}</div>
        `;
        
        if (userAnswer !== null) {
            const answerStatus = isCorrect ? 'correct-answer' : 'wrong-answer';
            reviewHtml += `<div class="review-answer ${answerStatus}">➤ Jawaban Anda: ${question.options[userAnswer]}</div>`;
        } else {
            reviewHtml += `<div class="review-answer wrong-answer">➤ Jawaban Anda: Tidak dijawab</div>`;
        }
        
        reviewHtml += `<div class="review-explanation">📖 Penjelasan: ${question.explanation}</div>`;
        reviewHtml += `</div>`;
    });
    
    document.getElementById('reviewContent').innerHTML = reviewHtml;
}

// Kembali ke hasil dari pembahasan
function backToResult() {
    reviewContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
}

// Mulai ulang quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(quizData.questions.length).fill(null);
    score = 0;
    quizCompleted = false;
    timeLeft = quizData.metadata.timeLimit * 60;
    
    clearInterval(timer);
    startTimer();
    
    resultContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    displayQuestion();
    scoreEl.textContent = '0';
}

// Tampilkan error
function showError(message) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Jalankan inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadQuestions);