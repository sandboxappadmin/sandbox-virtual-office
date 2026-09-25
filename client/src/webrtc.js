import SimplePeer from 'simple-peer';
import { socket } from './socket.js';

let localStream = null;
let peer = null;
let currentCallTarget = null;

const get = (id) => document.getElementById(id);

export async function getLocalStream() {
  if (localStream) return localStream;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const lv = get('local-video');
    if (lv) lv.srcObject = localStream;
  } catch (e) {
    console.warn('No camera/mic:', e.message);
    localStream = null;
  }
  return localStream;
}

export async function startCall(targetId, targetName) {
  if (peer) return;
  currentCallTarget = targetId;
  await getLocalStream();
  peer = new SimplePeer({ initiator: true, trickle: true, stream: localStream || undefined });
  _wireupPeer(peer, targetId, targetName);
  peer.on('signal', (offer) => socket.emit('rtc-offer', { targetId, offer }));
}

export async function receiveOffer(fromId, fromName, offer) {
  if (peer) return;
  currentCallTarget = fromId;
  await getLocalStream();
  peer = new SimplePeer({ initiator: false, trickle: true, stream: localStream || undefined });
  _wireupPeer(peer, fromId, fromName);
  peer.on('signal', (answer) => socket.emit('rtc-answer', { targetId: fromId, answer }));
  peer.signal(offer);
}

export function receiveAnswer(answer) { peer?.signal(answer); }
export function receiveIceCandidate(c) { peer?.signal(c); }

export function endCall() {
  if (currentCallTarget) socket.emit('call-ended', { targetId: currentCallTarget });
  _cleanup();
}

function _wireupPeer(p, targetId, targetName) {
  p.on('stream', (stream) => {
    const rv = get('remote-video');
    const rt = get('remote-tile');
    const rn = get('remote-name');
    if (rv) rv.srcObject = stream;
    if (rt) rt.style.display = '';
    if (rn) rn.textContent = targetName;
    const cs = get('call-status');
    if (cs) cs.textContent = `Connected with ${targetName}`;
  });
  p.on('close', _cleanup);
  p.on('error', _cleanup);

  // show overlay
  const overlay = get('call-overlay');
  const roomName = get('call-room-name');
  if (overlay) overlay.style.display = 'flex';
  if (roomName) roomName.textContent = `Call with ${targetName}`;
  const cs = get('call-status');
  if (cs) cs.textContent = 'Connecting...';
}

function _cleanup() {
  peer?.destroy(); peer = null; currentCallTarget = null;
  const rv = get('remote-video'); if (rv) rv.srcObject = null;
  const rt = get('remote-tile'); if (rt) rt.style.display = 'none';
  const overlay = get('call-overlay'); if (overlay) overlay.style.display = 'none';
}

// Controls
let micOn = true, camOn = true;
document.addEventListener('DOMContentLoaded', () => {
  get('toggle-mic')?.addEventListener('click', () => {
    if (!localStream) return;
    micOn = !micOn;
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
    get('toggle-mic').textContent = micOn ? '🎤' : '🔇';
    get('toggle-mic').classList.toggle('muted', !micOn);
  });
  get('toggle-cam')?.addEventListener('click', () => {
    if (!localStream) return;
    camOn = !camOn;
    localStream.getVideoTracks().forEach(t => t.enabled = camOn);
    get('toggle-cam').textContent = camOn ? '📷' : '🚫';
    get('toggle-cam').classList.toggle('muted', !camOn);
  });
  get('end-call-btn')?.addEventListener('click', endCall);
});

export const isInCall = () => peer !== null;
