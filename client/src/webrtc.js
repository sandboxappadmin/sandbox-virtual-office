import SimplePeer from 'simple-peer';
import { socket } from './socket.js';

let localStream = null;
let peer = null;
let currentCallTarget = null;

const localVideo  = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const callOverlay = document.getElementById('call-overlay');
const remoteName  = document.getElementById('remote-name');
const toggleMic   = document.getElementById('toggle-mic');
const toggleCam   = document.getElementById('toggle-cam');
const endCallBtn  = document.getElementById('end-call-btn');

// ── Get user media ──────────────────────────────────────────────────────────
export async function getLocalStream() {
  if (localStream) return localStream;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideo) localVideo.srcObject = localStream;
  } catch (err) {
    console.warn('Camera/mic not available:', err.message);
    localStream = null;
  }
  return localStream;
}

// ── Initiate call ───────────────────────────────────────────────────────────
export async function startCall(targetId, targetName) {
  if (peer) return; // already in call
  currentCallTarget = targetId;
  await getLocalStream();

  peer = new SimplePeer({ initiator: true, trickle: true, stream: localStream || undefined });

  peer.on('signal', (offer) => {
    socket.emit('rtc-offer', { targetId, offer });
  });

  peer.on('stream', (stream) => {
    remoteVideo.srcObject = stream;
  });

  peer.on('close', () => cleanupCall());
  peer.on('error', () => cleanupCall());

  showCallUI(targetName);
}

// ── Receive offer ───────────────────────────────────────────────────────────
export async function receiveOffer(fromId, fromName, offer) {
  if (peer) return;
  currentCallTarget = fromId;
  await getLocalStream();

  peer = new SimplePeer({ initiator: false, trickle: true, stream: localStream || undefined });

  peer.on('signal', (answer) => {
    socket.emit('rtc-answer', { targetId: fromId, answer });
  });

  peer.on('stream', (stream) => {
    remoteVideo.srcObject = stream;
  });

  peer.on('close', () => cleanupCall());
  peer.on('error', () => cleanupCall());

  peer.signal(offer);
  showCallUI(fromName);
}

// ── Receive answer ──────────────────────────────────────────────────────────
export function receiveAnswer(answer) {
  if (peer) peer.signal(answer);
}

// ── ICE candidate ───────────────────────────────────────────────────────────
export function receiveIceCandidate(candidate) {
  if (peer) peer.signal(candidate);
}

// ── End call ─────────────────────────────────────────────────────────────────
export function endCall() {
  if (currentCallTarget) {
    socket.emit('call-ended', { targetId: currentCallTarget });
  }
  cleanupCall();
}

function cleanupCall() {
  if (peer) { peer.destroy(); peer = null; }
  currentCallTarget = null;
  if (remoteVideo) remoteVideo.srcObject = null;
  if (callOverlay) callOverlay.style.display = 'none';
}

function showCallUI(name) {
  remoteName.textContent = name || 'Remote';
  callOverlay.style.display = 'block';
}

// ── Controls ────────────────────────────────────────────────────────────────
let micOn = true;
let camOn = true;

toggleMic?.addEventListener('click', () => {
  if (!localStream) return;
  micOn = !micOn;
  localStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  toggleMic.classList.toggle('muted', !micOn);
  toggleMic.textContent = micOn ? '🎤' : '🔇';
});

toggleCam?.addEventListener('click', () => {
  if (!localStream) return;
  camOn = !camOn;
  localStream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  toggleCam.classList.toggle('muted', !camOn);
  toggleCam.textContent = camOn ? '📷' : '🚫';
});

endCallBtn?.addEventListener('click', endCall);

export function isInCall() { return peer !== null; }
export function getCurrentCallTarget() { return currentCallTarget; }
