const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbywOXzardpCqz0Lv7IAAFABGFBset2SgVZRC6_Kvf9c1TXQPHTxa0kp9h8wKy2_oqwv/exec';
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let totalQuestions = 10;
let selectedAnswer = null;
let quizStarted = false;
let answerRecord = [];
let userId = null;
let timeLimit = 30;
let timer;
let timeLeft;

document.getElementById('startButton').addEventListener('click', startQuiz);
document.getElementById('submitAnswer').addEventListener('click', submitAnswer);

const instructionsButton = document.getElementById('instructionsButton');
const instructionsModal = document.getElementById('instructionsModal');
const closeButton = document.querySelector('.close');

instructionsButton.onclick = function() {
  instructionsModal.style.display = "block";
}

closeButton.onclick = function() {
  instructionsModal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == instructionsModal) {
    instructionsModal.style.display = "none";
  }
}

const questionCountOptions = document.querySelectorAll('.question-count-option');
questionCountOptions.forEach(option => {
  option.addEventListener('click', () => {
    questionCountOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    totalQuestions = parseInt(option.dataset.count);
    updateStartButtonState();
  });
});

const timeOptions = document.querySelectorAll('.time-option');
timeOptions.forEach(option => {
  option.addEventListener('click', () => {
    timeOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    timeLimit = parseInt(option.dataset.time);
    updateStartButtonState();
  });
});

function updateStartButtonState() {
  const questionSelected = document.querySelector('.question-count-option.selected');
  const timeSelected = document.querySelector('.time-option.selected');
  document.getElementById('startButton').disabled = !(questionSelected && timeSelected);
}

function startQuiz() {
  document.getElementById('startContainer').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('quizContainer').classList.add('fade-in');
  quizStarted = true;
  answerRecord = [];
  userId = generateUserId();
  fetchQuestions();
}

function fetchQuestions() {
  showLoadingAnimation();
  fetch(`${SCRIPT_URL}?action=getQuestions&count=${totalQuestions}`)
    .then(response => response.json())
    .then(questions => {
      currentQuestions = shuffleArray(questions);
      currentQuestionIndex = 0;
      correctAnswers = 0;
      hideLoadingAnimation();
      displayQuestion();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('獲取題目時出錯，請稍後再試。');
      hideLoadingAnimation();
    });
}

function showLoadingAnimation() {
  document.getElementById('loadingContainer').style.display = 'flex';
  document.getElementById('questionContainer').style.display = 'none';
  document.getElementById('submitAnswer').style.display = 'none';
}

function hideLoadingAnimation() {
  document.getElementById('loadingContainer').style.display = 'none';
  document.getElementById('questionContainer').style.display = 'block';
  document.getElementById('submitAnswer').style.display = 'block';
}

function startTimer() {
  timeLeft = timeLimit;
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (selectedAnswer === null) {
        selectRandomAnswer();
      }
      submitAnswer();
    }
  }, 1000);
}

function selectRandomAnswer() {
  const options = document.querySelectorAll('.option-button');
  const randomIndex = Math.floor(Math.random() * options.length);
  const randomOption = options[randomIndex];
  selectAnswer(randomOption, randomOption.textContent);
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('timer');
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerElement.textContent = `剩餘時間: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  timerElement.style.color = timeLeft <= 10 ? 'red' : 'var(--primary-color)';
}

function displayQuestion() {
  const question = currentQuestions[currentQuestionIndex];
  const questionText = document.getElementById('questionText');
  const optionsList = document.getElementById('optionsList');
  const audioQuestion = document.getElementById('audioQuestion');
  const imageQuestion = document.getElementById('imageQuestion');
  const submitButton = document.getElementById('submitAnswer');
  const resultDiv = document.getElementById('result');

  questionText.textContent = `問題 ${currentQuestionIndex + 1}: ${question.question}`;
  optionsList.innerHTML = '';
  selectedAnswer = null;
  submitButton.disabled = true;
  submitButton.textContent = '提交答案';
  resultDiv.textContent = '';
  resultDiv.style.backgroundColor = 'transparent';
  resultDiv.classList.remove('fade-in');

  // Hide both audio and image by default
  audioQuestion.style.display = 'none';
  imageQuestion.style.display = 'none';

  if (question.type === 'audio') {
    audioQuestion.src = question.audioUrl;
    audioQuestion.style.display = 'block';
  } else if (question.type === 'image' && question.imageUrl) {
    imageQuestion.src = question.imageUrl;
    imageQuestion.style.display = 'block';
  }

  question.options = shuffleArray(question.options);
  question.options.forEach(option => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.classList.add('option-button');
    if (typeof option === 'object' && option.imageUrl) {
      button.classList.add('has-image');
      const img = document.createElement('img');
      img.src = option.imageUrl;
      img.alt = option.text || 'Option Image';
      img.classList.add('option-image');
      button.appendChild(img);
      if (option.text) {
        const span = document.createElement('span');
        span.textContent = option.text;
        button.appendChild(span);
      }
      button.onclick = () => selectAnswer(button, option.text || option.imageUrl);
    } else {
      button.textContent = option;
      button.onclick = () => selectAnswer(button, option);
    }
    li.appendChild(button);
    optionsList.appendChild(li);
  });

  updateProgressBar();
  startTimer();
  const questionContainer = document.getElementById('questionContainer');
  questionContainer.classList.add('question-fade-in');
  setTimeout(() => {
    questionContainer.classList.remove('question-fade-in');
  }, 500);
}

function selectAnswer(button, answer) {
  const options = document.querySelectorAll('.option-button');
  options.forEach(opt => opt.classList.remove('selected'));
  button.classList.add('selected');
  selectedAnswer = answer;
  document.getElementById('submitAnswer').disabled = false;
}

function submitAnswer() {
  clearInterval(timer);
  if (selectedAnswer === null) {
    selectRandomAnswer();
  }

  const submitButton = document.getElementById('submitAnswer');
  submitButton.disabled = true;
  submitButton.innerHTML = '提交中 <span class="loading-spinner"></span>';

  const optionButtons = document.querySelectorAll('.option-button');
  optionButtons.forEach(button => {
    button.disabled = true;
  });

  const question = currentQuestions[currentQuestionIndex];
  fetch(`${SCRIPT_URL}`, {
    method: 'POST',
    body: new URLSearchParams({
      'action': 'checkAnswer',
      'questionId': question.id,
      'answer': selectedAnswer,
      'userId': userId
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.correct) {
      correctAnswers++;
      displayCorrectAnswerEffect();
    } else {
      displayIncorrectAnswerEffect();
    }
    displayResult(result.correct, result.correctAnswer);
    answerRecord.push({
      question: question.question,
      userAnswer: selectedAnswer,
      correctAnswer: result.correctAnswer,
      isCorrect: result.correct
    });
    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex < currentQuestions.length) {
        displayQuestion();
      } else {
        displayFinalResult();
      }
    }, 1500);
  })
  .catch(error => {
    console.error('Error:', error);
    alert('檢查答案時出錯，請稍後再試。');
  })
  .finally(() => {
    submitButton.innerHTML = '提交答案';
  });
}

function displayResult(isCorrect, correctAnswer) {
  const resultDiv = document.getElementById('result');
  resultDiv.classList.remove('fade-in');
  void resultDiv.offsetWidth;
  resultDiv.classList.add('fade-in');
  if (isCorrect) {
    resultDiv.textContent = '答對了！做得好！';
    resultDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
    resultDiv.style.color = '#4CAF50';
  } else {
    resultDiv.textContent = `答錯了。正確答案是：${correctAnswer}`;
    resultDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
    resultDiv.style.color = '#e74c3c';
    resultDiv.classList.add('shake');
    setTimeout(() => resultDiv.classList.remove('shake'), 820);
  }
}

function displayFinalResult() {
  const app = document.getElementById('app');
  const percentage = (correctAnswers / totalQuestions * 100).toFixed(2);
  let message = '';
  let emoji = '';
  if (percentage >= 90) {
    message = '太厲害了！你是閩南語大師！';
    emoji = '🏆';
  } else if (percentage >= 70) {
    message = '表現得很好！繼續努力！';
    emoji = '👍';
  } else if (percentage >= 50) {
    message = '還不錯，再接再厲！';
    emoji = '💪';
  } else {
    message = '加油！practice makes perfect！';
    emoji = '📚';
  }
  let answerRecordHTML = '<div id="answerRecord"><h3>答題記錄：</h3>';
  answerRecord.forEach((record, index) => {
    answerRecordHTML += `
      <div class="record-item">
        <span class="question">${index + 1}. ${record.question}</span>
        <span class="result ${record.isCorrect ? 'correct' : 'incorrect'}">
          ${record.isCorrect ? '正確' : '錯誤'}
        </span>
      </div>
    `;
  });
  answerRecordHTML += '</div>';
  app.innerHTML = `
    <h1>測驗結束 ${emoji}</h1>
    <div id="finalResult" class="fade-in">
      <p>你答對了 ${correctAnswers} 題，共 ${totalQuestions} 題</p>
      <p>正確率：${percentage}%</p>
      <p>${message}</p>
      ${answerRecordHTML}
      <button id="retryButton">再測一次</button>
    </div>
  `;
  if (percentage >= 80) {
    createConfetti();
  }
  document.getElementById('retryButton').addEventListener('click', () => {
    window.location.reload();
  });
}

function updateProgressBar() {
  const progress = document.getElementById('progress');
  const percentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  progress.style.width = `${percentage}%`;
}

function displayCorrectAnswerEffect() {
  const selectedButton = document.querySelector('.option-button.selected');
  if(selectedButton) {
    selectedButton.classList.add('correct-answer');
  }
}

function displayIncorrectAnswerEffect() {
  const selectedButton = document.querySelector('.option-button.selected');
  if(selectedButton) {
    selectedButton.classList.add('incorrect-answer');
  }
}

function createConfetti() {
  const confettiCount = 200;
  const container = document.body;
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
    container.appendChild(confetti);
    setTimeout(() => {
      container.removeChild(confetti);
    }, 5000);
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getDeviceInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  if (userAgent.includes('win')) return 'Windows';
  if (userAgent.includes('mac')) return 'macOS';
  if (userAgent.includes('linux')) return 'Linux';
  const brands = {
    apple: /iphone|ipad|ipod/i,
    samsung: /samsung/i,
    huawei: /huawei/i,
    xiaomi: /xiaomi/i,
    oppo: /oppo/i,
    vivo: /vivo/i,
    lg: /lg/i,
    sony: /sony/i,
    asus: /asus/i,
    nokia: /nokia/i,
    motorola: /motorola/i,
    htc: /htc/i,
  };
  for (const [brand, regex] of Object.entries(brands)) {
    if (regex.test(userAgent)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }
  return 'Unknown';
}

document.addEventListener('DOMContentLoaded', () => {
  const deviceInfo = getDeviceInfo();
  const deviceInfoElement = document.getElementById('deviceInfo');
  if (['Windows', 'macOS', 'Linux'].includes(deviceInfo)) {
    deviceInfoElement.textContent = `您正在使用 ${deviceInfo} 系統`;
  } else {
    deviceInfoElement.textContent = `您正在使用 ${deviceInfo} 裝置`;
  }
  document.addEventListener('copy', function(e) {
    e.preventDefault();
    alert('抱歉，為了維護測驗公平性，不允許複製文字。');
  });
  document.addEventListener('paste', function(e) {
    e.preventDefault();
    alert('抱歉，為了維護測驗公平性，不允許貼上文字。');
  });
  window.addEventListener('beforeunload', function(e) {
    if (quizStarted && currentQuestionIndex < totalQuestions) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});