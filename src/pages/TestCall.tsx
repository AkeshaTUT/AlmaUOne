import React, { useRef, useState } from 'react';

export default function TestCall() {
  const [roomId, setRoomId] = useState('test-room');
  const [isCaller, setIsCaller] = useState(false);
  const [started, setStarted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [log, setLog] = useState('');
  const cameraTestRef = useRef(null);
  const screenTestRef = useRef(null);
  const [audioTest, setAudioTest] = useState(false);

  const logMsg = (msg) => {
    setLog((prev) => prev + '\n' + msg);
    console.log(msg);
  };

  // Тест камеры
  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraTestRef.current) cameraTestRef.current.srcObject = stream;
      logMsg('[DeviceTest] Камера работает!');
    } catch (e) {
      logMsg('[DeviceTest] Ошибка камеры: ' + e.name);
      alert('Ошибка камеры: ' + e.name);
    }
  };

  // Тест микрофона
  const testMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioTest(true);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      logMsg('[DeviceTest] Микрофон работает!');
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setAudioTest(false);
        audioCtx.close();
      }, 3000);
    } catch (e) {
      logMsg('[DeviceTest] Ошибка микрофона: ' + e.name);
      alert('Ошибка микрофона: ' + e.name);
    }
  };

  // Тест экрана
  const testScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (screenTestRef.current) screenTestRef.current.srcObject = stream;
      logMsg('[DeviceTest] Демонстрация экрана работает!');
    } catch (e) {
      logMsg('[DeviceTest] Ошибка экрана: ' + e.name);
      alert('Ошибка экрана: ' + e.name);
    }
  };

  const startCall = async () => {
    setIsCaller(true);
    setStarted(true);
    await start(true);
  };

  const acceptCall = async () => {
    setIsCaller(false);
    setStarted(true);
    await start(false);
  };

  async function start(isCaller) {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      logMsg('[TestCall] Получен localStream: ' + localStream.id);
      logMsg('[TestCall] Аудиотреки: ' + localStream.getAudioTracks().length);
      logMsg('[TestCall] Видеотреки: ' + localStream.getVideoTracks().length);
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        logMsg('[TestCall] Получен remoteStream: ' + event.streams[0].id);
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          window.localStorage.setItem(roomId + (isCaller ? '-caller' : '-callee') + '-ice', JSON.stringify(event.candidate));
          logMsg('[TestCall] ICE-кандидат отправлен');
        }
      };
      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        window.localStorage.setItem(roomId + '-offer', JSON.stringify(offer));
        logMsg('[TestCall] Offer создан');
      } else {
        const offerStr = window.localStorage.getItem(roomId + '-offer');
        if (!offerStr) return logMsg('[TestCall] Нет offer');
        const offer = JSON.parse(offerStr);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        logMsg('[TestCall] Offer получен и установлен');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        window.localStorage.setItem(roomId + '-answer', JSON.stringify(answer));
        logMsg('[TestCall] Answer создан');
      }
      if (!isCaller) {
        setTimeout(() => {
          const iceStr = window.localStorage.getItem(roomId + '-caller-ice');
          if (iceStr) {
            pc.addIceCandidate(new RTCIceCandidate(JSON.parse(iceStr)));
            logMsg('[TestCall] ICE-кандидат caller применён');
          }
        }, 2000);
      } else {
        setTimeout(() => {
          const answerStr = window.localStorage.getItem(roomId + '-answer');
          if (answerStr) {
            pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(answerStr)));
            logMsg('[TestCall] Answer получен и установлен');
          }
          const iceStr = window.localStorage.getItem(roomId + '-callee-ice');
          if (iceStr) {
            pc.addIceCandidate(new RTCIceCandidate(JSON.parse(iceStr)));
            logMsg('[TestCall] ICE-кандидат callee применён');
          }
        }, 2000);
      }
    } catch (e) {
      logMsg('[TestCall] Ошибка: ' + e);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8">
      <h1 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">Минимальный WebRTC тест</h1>
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 w-full">
        <input value={roomId} onChange={e => setRoomId(e.target.value)} className="border p-2 rounded-md flex-1 text-sm sm:text-base" placeholder="roomId" />
        <button onClick={startCall} className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base">Создать звонок</button>
        <button onClick={acceptCall} className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base">Принять звонок</button>
      </div>
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 w-full">
        <button onClick={testCamera} className="bg-purple-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base">Тест камеры</button>
        <button onClick={testMic} className="bg-purple-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base">Тест микрофона</button>
        <button onClick={testScreen} className="bg-purple-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base">Тест экрана</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-4 w-full">
        <div className="flex-1">
          <div className="text-xs sm:text-sm mb-1">Локальное видео</div>
          <video ref={localVideoRef} autoPlay playsInline muted width={320} height={180} className="w-full max-w-xs sm:max-w-full rounded bg-[#222]" />
        </div>
        <div className="flex-1">
          <div className="text-xs sm:text-sm mb-1">Remote видео</div>
          <video ref={remoteVideoRef} autoPlay playsInline width={320} height={180} className="w-full max-w-xs sm:max-w-full rounded bg-[#222]" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-4 w-full">
        <div className="flex-1">
          <div className="text-xs sm:text-sm mb-1">Тест камеры</div>
          <video ref={cameraTestRef} autoPlay playsInline muted width={160} height={90} className="w-full max-w-xs sm:max-w-full rounded bg-[#222]" />
        </div>
        <div className="flex-1">
          <div className="text-xs sm:text-sm mb-1">Тест экрана</div>
          <video ref={screenTestRef} autoPlay playsInline muted width={160} height={90} className="w-full max-w-xs sm:max-w-full rounded bg-[#222]" />
        </div>
        <div className="flex-1">
          <div className="text-xs sm:text-sm mb-1">Тест микрофона</div>
          <div className="w-full max-w-xs sm:max-w-full h-16 sm:h-24 rounded bg-[#222] text-white flex items-center justify-center">
            {audioTest ? '🎤 Говорите...' : '—'}
          </div>
        </div>
      </div>
      <pre className="bg-gray-100 p-2 rounded h-32 sm:h-48 overflow-auto text-xs w-full">{log}</pre>
      <div className="text-xs text-gray-500 mt-2">1. Проверьте камеру, микрофон и экран.<br/>2. Откройте эту страницу в двух вкладках, введите одинаковый roomId. В одной нажмите "Создать звонок", в другой — "Принять звонок".</div>
    </div>
  );
} 