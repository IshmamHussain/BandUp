import { api } from '../api.js';
import { toast } from '../toast.js';

const el = (id) => document.getElementById(id);

let mediaRecorder;
let audioChunks = [];
let audioBlob;
let timerInterval;
let startTime;

// Web Audio API for waveform
let audioCtx;
let analyser;
let animFrameId;

const promptId = new URLSearchParams(window.location.search).get('promptId');
let currentPromptText = '';

async function init() {
  try {
    const prompts = await api.speakingPrompts();
    const prompt = prompts.find(p => p.id == promptId);
    if (!prompt) {
      toast('Prompt not found', 'error');
      return;
    }
    el('part-badge').textContent = prompt.category ? `${prompt.category} – ${prompt.part}` : prompt.part;
    el('prompt-text').textContent = prompt.prompt_text;
    currentPromptText = prompt.prompt_text;
  } catch (err) {
    toast(err.message, 'error');
  }
}

// --- Waveform Visualizer ---
function initWaveform(stream) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  
  const canvas = el('waveform-canvas');
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    animFrameId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    
    // Match canvas internal resolution to displayed size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const w = rect.width;
    const h = rect.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const barCount = 64;
    const barWidth = w / barCount - 2;
    const step = Math.floor(bufferLength / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i * step];
      const barHeight = (val / 255) * (h * 0.85);
      const x = i * (barWidth + 2);
      const y = (h - barHeight) / 2;
      
      // Gradient from brand teal to cyan
      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
      const isDark = document.documentElement.classList.contains('dark');
      gradient.addColorStop(0, isDark ? 'rgba(20,184,166,0.3)' : 'rgba(13,148,136,0.2)');
      gradient.addColorStop(1, isDark ? 'rgba(6,182,212,0.9)' : 'rgba(13,148,136,0.8)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }
  
  draw();
}

function drawIdleWaveform() {
  const canvas = el('waveform-canvas');
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);
  
  const barCount = 64;
  const barWidth = w / barCount - 2;
  const isDark = document.documentElement.classList.contains('dark');
  
  for (let i = 0; i < barCount; i++) {
    const barHeight = 4 + Math.sin(i * 0.3) * 3;
    const x = i * (barWidth + 2);
    const y = (h - barHeight) / 2;
    
    ctx.fillStyle = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(203,213,225,0.7)';
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 2);
    ctx.fill();
  }
}

function stopWaveform() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (audioCtx) audioCtx.close().catch(() => {});
  audioCtx = null;
  analyser = null;
}

// --- Recording ---
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      el('audio-playback').src = URL.createObjectURL(audioBlob);
      
      // Transition to review state
      el('post-recording-actions').classList.remove('hidden');
      el('recording-indicator').classList.add('hidden');
      el('icon-stop').classList.add('hidden');
      el('icon-mic').classList.remove('hidden');
      el('btn-record').classList.add('hidden');
      el('rec-status').classList.add('hidden');
      el('rec-status').classList.remove('flex');
      el('record-hint').classList.add('hidden');
      
      // Reset timer style
      el('timer').classList.remove('timer-recording');
      el('timer').classList.add('text-slate-400', 'dark:text-slate-500');
      
      // Reset record button style
      el('btn-record').classList.remove('bg-red-500', 'hover:bg-red-600', 'recording-glow', 'shadow-red-500/30');
      el('btn-record').classList.add('bg-brand-600', 'hover:bg-brand-700', 'shadow-brand-500/30');
      
      clearInterval(timerInterval);
      stopWaveform();
      drawIdleWaveform();
    };

    mediaRecorder.start();
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    
    // Visual recording state
    el('recording-indicator').classList.remove('hidden');
    el('icon-mic').classList.add('hidden');
    el('icon-stop').classList.remove('hidden');
    el('post-recording-actions').classList.add('hidden');
    el('rec-status').classList.remove('hidden');
    el('rec-status').classList.add('flex');
    el('record-hint').textContent = 'Tap the stop button to finish recording';
    
    // Animate timer
    el('timer').classList.add('timer-recording');
    el('timer').classList.remove('text-slate-400', 'dark:text-slate-500');
    
    // Record button becomes stop style
    el('btn-record').classList.remove('bg-brand-600', 'hover:bg-brand-700', 'shadow-brand-500/30');
    el('btn-record').classList.add('bg-red-500', 'hover:bg-red-600', 'recording-glow', 'shadow-red-500/30');
    
    // Start waveform
    initWaveform(stream);
    
  } catch (err) {
    toast('Microphone access denied or unavailable.', 'error');
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}

function updateTimer() {
  const diff = Math.floor((Date.now() - startTime) / 1000);
  const mins = String(Math.floor(diff / 60)).padStart(2, '0');
  const secs = String(diff % 60).padStart(2, '0');
  el('timer').textContent = `${mins}:${secs}`;
}

// --- Event Listeners ---
el('btn-record').addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
});

el('btn-retake').addEventListener('click', () => {
  el('btn-record').classList.remove('hidden');
  el('post-recording-actions').classList.add('hidden');
  el('timer').textContent = '00:00';
  el('record-hint').textContent = 'Tap the microphone to begin recording';
  el('record-hint').classList.remove('hidden');
  audioBlob = null;
  drawIdleWaveform();
});

el('btn-submit').addEventListener('click', async () => {
  if (!audioBlob) return;
  const btn = el('btn-submit');
  btn.disabled = true;
  btn.innerHTML = `
    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
    Uploading...
  `;

  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('promptId', promptId);
    formData.append('durationSec', Math.floor((Date.now() - startTime) / 1000));
    formData.append('promptText', currentPromptText);
    formData.append('mimeType', audioBlob.type);

    await api.submitSpeaking(formData);
    toast('Audio submitted! The AI is evaluating it.', 'success');
    setTimeout(() => {
      window.location.href = 'speaking.html?tab=history';
    }, 1500);
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      Submit for Evaluation
    `;
  }
});

// Draw idle waveform on load
init();
requestAnimationFrame(() => drawIdleWaveform());
