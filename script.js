const workInput = document.getElementById('workInput');
const breakInput = document.getElementById('breakInput');
const workBgFile = document.getElementById('workBgFile');
const breakBgFile = document.getElementById('breakBgFile');
const workDropZone = document.getElementById('workDropZone');
const breakDropZone = document.getElementById('breakDropZone');
const soundButtons = document.querySelectorAll('.sound-button');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const timeLeft = document.getElementById('timeLeft');
const sessionLabel = document.getElementById('sessionLabel');

const audioMap = {
  rain: new Audio('assets/rain_sound.mp3'),
  cafe: new Audio('assets/cafe_sound.mp3'),
  fire: new Audio('assets/fire_sound.mp3'),
};

let intervalId = null;
let isRunning = false;
let currentSession = 'work';
let selectedSound = 'none';
let workBgData = 'assets/study.JPG';
let breakBgData = 'assets/break.JPG';
let secondsRemaining = Number(workInput.value) * 60;

function stopAllSounds() {
  Object.values(audioMap).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function updateBackground() {
  let backgroundUrl = currentSession === 'work'
    ? workBgData
    : breakBgData;

  if (!backgroundUrl) {
    backgroundUrl = currentSession === 'work'
      ? 'assets/study.JPG'
      : 'assets/break.JPG';
  }

  document.body.style.backgroundImage = `url('${backgroundUrl}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundBlendMode = '';
}

function playBeep() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  const audioCtx = new AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.12;

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.08);

  oscillator.onended = () => {
    audioCtx.close();
  };
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateDisplay() {
  sessionLabel.textContent = currentSession === 'work' ? 'Work Session' : 'Break Session';
  timeLeft.textContent = formatTime(secondsRemaining);
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  currentSession = 'work';
  secondsRemaining = Number(workInput.value) * 60;
  updateDisplay();
  updateBackground();
}

function playSelectedSound() {
  if (selectedSound === 'none') {
    return;
  }

  const sound = audioMap[selectedSound];
  if (!sound) {
    return;
  }

  sound.currentTime = 0;
  sound.volume = 0.65;
  sound.play().catch(() => {
    // Play may be blocked by browser autoplay policies.
  });
}

function setSelectedSound(soundKey) {
  selectedSound = soundKey;
  soundButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.sound === soundKey);
  });
}

function switchSession() {
  currentSession = currentSession === 'work' ? 'break' : 'work';
  secondsRemaining = currentSession === 'work'
    ? Number(workInput.value) * 60
    : Number(breakInput.value) * 60;
  updateDisplay();
  updateBackground();
  playBeep();
}

function tick() {
  if (secondsRemaining <= 0) {
    switchSession();
    return;
  }

  secondsRemaining -= 1;
  updateDisplay();
}

function startTimer() {
  if (isRunning) {
    return;
  }

  if (intervalId) {
    clearInterval(intervalId);
  }

  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  intervalId = setInterval(tick, 1000);
}

function pauseTimer() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

workInput.addEventListener('change', () => {
  const value = Number(workInput.value);
  if (value < 1) {
    workInput.value = 1;
  }
  if (!isRunning && currentSession === 'work') {
    secondsRemaining = Number(workInput.value) * 60;
    updateDisplay();
  }
});

breakInput.addEventListener('change', () => {
  const value = Number(breakInput.value);
  if (value < 1) {
    breakInput.value = 1;
  }
  if (!isRunning && currentSession === 'break') {
    secondsRemaining = Number(breakInput.value) * 60;
    updateDisplay();
  }
});

function handleBgFile(file, target) {
  const reader = new FileReader();
  reader.onload = () => {
    if (target === 'work') {
      workBgData = reader.result;
    } else {
      breakBgData = reader.result;
    }
    if (currentSession === target) {
      updateBackground();
    }
  };
  reader.readAsDataURL(file);
}

function setupDropZone(dropZone, input, target) {
  dropZone.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    if (input.files && input.files[0]) {
      handleBgFile(input.files[0], target);
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleBgFile(file, target);
    }
  });
}

setupDropZone(workDropZone, workBgFile, 'work');
setupDropZone(breakDropZone, breakBgFile, 'break');

soundButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const soundKey = button.dataset.sound;

    if (selectedSound === soundKey) {
      stopAllSounds();
      setSelectedSound('none');
      return;
    }

    stopAllSounds();
    setSelectedSound(soundKey);
    playSelectedSound();
  });
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

window.addEventListener('load', () => {
  resetTimer();
});
