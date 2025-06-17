import { useRef, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface UseWebRTCCallOptions {
  roomId: string;
  isCaller: boolean;
  contact: { id: string; name: string; avatarUrl?: string };
  currentUser: any;
  onCallEnd: () => void;
}

export type CallStatus = 'connecting' | 'ringing' | 'accepted' | 'declined' | 'ended';

export interface CallDiagnostics {
  iceState: string;
  connectionState: string;
  hasRelay: boolean;
  bitrate: number;
  remoteTracks: Array<{
    kind: string;
    label: string;
    readyState: string;
    enabled: boolean;
  }>;
  localTracks: Array<{
    kind: string;
    label: string;
    readyState: string;
    enabled: boolean;
  }>;
  warning: string;
  iceCandidates: {
    host: number;
    srflx: number;
    relay: number;
  };
  selectedCandidatePair: any;
}

export interface UseWebRTCCallReturn {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  pipVideoRef: React.RefObject<HTMLVideoElement>;
  status: CallStatus;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  showCameraOverlay: boolean;
  error: string | null;
  remoteVideoError: string | null;
  diagnostics: CallDiagnostics;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleCameraOverlay: () => void;
  endCall: () => void;
  declineCall: () => void;
  acceptCall: () => void;
  retryCall: () => void;
  switchCamera: () => void;
  muteRemote: () => void;
  hasLocalTracks: () => boolean;
}

const TURN_CONFIG = {
  urls: import.meta.env.VITE_TURN_URL || 'turn:34.40.51.208:3478',
  username: import.meta.env.VITE_TURN_USERNAME || 'akesha',
  credential: import.meta.env.VITE_TURN_CREDENTIAL || 'admin'
};
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];
const ICE_SERVERS = [
  ...STUN_SERVERS,
  TURN_CONFIG
];

const SOCKET_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3001';

const MAX_RECONNECT_ATTEMPTS = 3;
const TURN_CHECK_TIMEOUT = 10000; // 10 seconds
const CONNECTION_TIMEOUT = 30000; // 30 seconds

export function useWebRTCCall(options: UseWebRTCCallOptions): UseWebRTCCallReturn {
  const { roomId, isCaller, contact, currentUser, onCallEnd } = options;

  const isCallerRef = useRef(isCaller);
  const isInitializedRef = useRef(false);
  const isCleanupInProgressRef = useRef(false);
  const callConfigRef = useRef({
    roomId,
    isCaller,
    contact,
    currentUser
  });

  useEffect(() => {
    if (isCallerRef.current !== isCaller) {
      isCallerRef.current = isCaller;
    }
  }, [isCaller]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraOverlayStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);
  const appliedCandidates = useRef<RTCIceCandidate[]>([]);
  const isRemoteDescriptionSet = useRef<boolean>(false);
  const reconnectAttempts = useRef<number>(0);
  const turnCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const isRemoteMuted = useRef<boolean>(false);
  const handleReconnectionRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const [status, setStatus] = useState<CallStatus>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [iceConnectionState, setIceConnectionState] = useState<string>('new');
  const [lastProcessedAnswer, setLastProcessedAnswer] = useState<string>('');
  const [remoteVideoError, setRemoteVideoError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<CallDiagnostics>({
    iceState: '',
    connectionState: '',
    hasRelay: false,
    bitrate: 0,
    remoteTracks: [],
    localTracks: [],
    warning: '',
    iceCandidates: {
      host: 0,
      srflx: 0,
      relay: 0
    },
    selectedCandidatePair: null
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

  // --- Core callbacks ---

  const cleanup = useCallback(() => {
    console.log('[CallModal] Cleanup started, current state:', {
      signalingState: pcRef.current?.signalingState,
      connectionState: pcRef.current?.connectionState,
      iceConnectionState: pcRef.current?.iceConnectionState
    });

    // Не выполняем cleanup если соединение активно
    if (pcRef.current?.connectionState === 'connected' || 
        pcRef.current?.iceConnectionState === 'connected') {
      console.log('[CallModal] Skipping cleanup - connection is active');
      return;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setConnectionState('new');
    setIceConnectionState('new');
    setDiagnostics({
      iceState: '',
      connectionState: '',
      hasRelay: false,
      bitrate: 0,
      remoteTracks: [],
      localTracks: [],
      warning: '',
      iceCandidates: { host: 0, srflx: 0, relay: 0 },
      selectedCandidatePair: null
    });
  }, []);

  const checkMediaDevices = async () => {
    const results = { camera: false, microphone: false, screen: false };
    // Проверка камеры
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stream && stream.getVideoTracks().length > 0) results.camera = true;
      stream.getTracks().forEach(t => t.stop());
    } catch {}
    // Проверка микрофона
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream && stream.getAudioTracks().length > 0) results.microphone = true;
      stream.getTracks().forEach(t => t.stop());
    } catch {}
    // Проверка экрана
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (stream && stream.getVideoTracks().length > 0) results.screen = true;
        stream.getTracks().forEach(t => t.stop());
      } catch {}
    } else {
      results.screen = false;
    }
    return results;
  };

  const initializeMediaStream = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (!stream) throw new Error('Не удалось получить доступ к камере и микрофону');
      if (stream.getVideoTracks().length === 0) throw new Error('Камера не найдена или не работает');
      if (stream.getAudioTracks().length === 0) throw new Error('Микрофон не найден или не работает');
      localStreamRef.current = stream;
      setError(null);
      return stream;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка доступа к устройствам';
      setError(msg);
      toast.error(
        msg + '\n' +
        'Проверьте, что камера и микрофон подключены и не заняты другим приложением.\n' +
        'Разрешите доступ в настройках браузера.\n' +
        'Проверьте настройки приватности вашей ОС.'
      );
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidates.current = [];
    isRemoteDescriptionSet.current = false;

    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls: import.meta.env.VITE_TURN_URL || 'turn:34.40.51.208:3478',
          username: import.meta.env.VITE_TURN_USERNAME || 'akesha',
          credential: import.meta.env.VITE_TURN_CREDENTIAL || 'admin'
        },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    };

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Add transceivers with optimized settings
    pc.addTransceiver('audio', { 
      direction: 'sendrecv',
      streams: []
    });

    pc.addTransceiver('video', { 
      direction: 'sendrecv',
      streams: []
    });

    // Set bandwidth constraints
    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      const params = sender.getParameters();
      if (!params.encodings) {
        params.encodings = [{}];
      }
      params.encodings[0].maxBitrate = 1000000; // 1000 kbps
      params.encodings[0].maxFramerate = 20;    // 20 FPS
      sender.setParameters(params);
    }

    pc.onicecandidate = (event) => {
      console.log('[WebRTC] onicecandidate:', event.candidate);
      if (event.candidate && pc.signalingState !== 'closed') {
        if (event.candidate.candidate) {
          const candidateType = event.candidate.candidate.split(' ')[7];
          setDiagnostics(prev => ({
            ...prev,
            iceCandidates: {
              ...prev.iceCandidates,
              [candidateType]: (prev.iceCandidates[candidateType] || 0) + 1
            }
          }));
        }
        socketRef.current?.emit('ice-candidate', event.candidate, callConfigRef.current.roomId, callConfigRef.current.currentUser.uid);
      }
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
      console.log('[WebRTC] iceConnectionState:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
        handleReconnectionRef.current?.();
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      console.log('[WebRTC] connectionState:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        handleReconnectionRef.current?.();
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] signalingState:', pc.signalingState);
      if (pc.signalingState === 'closed') {
        cleanup();
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack:', event.track, event.streams);
      if (event.track.kind === 'video') {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
      if (event.track.kind === 'audio') {
        // Можно добавить обработку аудио, если нужно
      }
    };
    return pc;
  }, [cleanup]);

  // --- Новый: включение/выключение overlay-камеры во время screen sharing ---
  const toggleCameraOverlay = useCallback(async () => {
    if (!isScreenSharing) return;
    if (!showCameraOverlay) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraOverlayStreamRef.current = camStream;
        camStream.getVideoTracks().forEach((track) => {
          pcRef.current?.addTrack(track, camStream);
        });
        setShowCameraOverlay(true);
      } catch (err) {
        setError('Не удалось включить камеру поверх экрана');
      }
    } else {
      if (cameraOverlayStreamRef.current) {
        cameraOverlayStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          const sender = pcRef.current?.getSenders().find((s) => s.track === track);
          if (sender) pcRef.current?.removeTrack(sender);
        });
        cameraOverlayStreamRef.current = null;
      }
      setShowCameraOverlay(false);
    }
  }, [isScreenSharing, showCameraOverlay]);

  // --- Screen share ---
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        // Заменить video-трек камеры на экран через replaceTrack
        if (pcRef.current) {
          const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          const screenTrack = screenStream.getVideoTracks()[0];
          if (videoSender && screenTrack) {
            await videoSender.replaceTrack(screenTrack);
          }
        }
        setIsScreenSharing(true);
        setShowCameraOverlay(false);
        screenStream.getVideoTracks()[0].onended = async () => {
          setIsScreenSharing(false);
          // Вернуть камеру
          if (pcRef.current && localStreamRef.current) {
            const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoSender && camTrack) {
              await videoSender.replaceTrack(camTrack);
            }
          }
        };
      } catch (err) {
        setIsScreenSharing(false);
        setShowCameraOverlay(false);
      }
    } else {
      setIsScreenSharing(false);
      setShowCameraOverlay(false);
      // Остановить screen-трек
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      // Вернуть камеру
      if (pcRef.current && localStreamRef.current) {
        const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }
      }
    }
  }, [isScreenSharing]);

  // --- Остальные методы (mute/camera etc) стандартные ---
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        if (track.label.toLowerCase().includes('screen')) return; // не трогать screen share
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  const endCall = useCallback(async () => {
    try {
      const callRef = doc(db, "calls", callConfigRef.current.roomId);
      await setDoc(callRef, {
        status: 'ended',
        endedAt: new Date().toISOString(),
        callerId: callConfigRef.current.currentUser.uid,
        calleeId: callConfigRef.current.contact.id,
        roomId: callConfigRef.current.roomId
      }, { merge: true });
    } catch (err) {}
    cleanup();
    setStatus('ended');
    onCallEnd();
  }, [cleanup, onCallEnd]);

  const declineCall = useCallback(async () => {
    try {
      const callRef = doc(db, "calls", callConfigRef.current.roomId);
      await setDoc(callRef, {
        status: 'declined',
        declinedAt: new Date().toISOString(),
        callerId: callConfigRef.current.currentUser.uid,
        calleeId: callConfigRef.current.contact.id,
        roomId: callConfigRef.current.roomId
      }, { merge: true });
    } catch (err) {}
    endCall();
  }, [endCall]);

  const acceptCall = useCallback(async () => {
    try {
      const callRef = doc(db, "calls", callConfigRef.current.roomId);
      await setDoc(callRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        callerId: callConfigRef.current.currentUser.uid,
        calleeId: callConfigRef.current.contact.id,
        roomId: callConfigRef.current.roomId
      }, { merge: true });
      setStatus('accepted');
    } catch (err) {}
  }, []);

  const retryCall = useCallback(() => {
    cleanup();
    reconnectAttempts.current = 0;
    setError(null);
    handleReconnectionRef.current?.();
  }, [cleanup]);

  const switchCamera = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      if (videoDevices.length < 2) {
        setError('Дополнительная камера не найдена');
        return;
      }
      const currentTrack = localStreamRef.current?.getVideoTracks()[0];
      const currentDeviceId = currentTrack?.getSettings().deviceId;
      const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId);
      if (nextDevice) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: nextDevice.deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender && currentTrack) {
          await sender.replaceTrack(newVideoTrack);
          currentTrack.stop();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
            await localVideoRef.current.play().catch(() => {});
          }
          localStreamRef.current = newStream;
        }
      }
    } catch (err) {
      setError('Не удалось переключить камеру');
    }
  }, []);

  const muteRemote = useCallback(() => {
    if (remoteVideoRef.current?.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      isRemoteMuted.current = !isRemoteMuted.current;
    }
  }, []);

  // Add ICE candidate handling functions
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed') return;

    try {
      if (!isRemoteDescriptionSet.current) {
        pendingCandidates.current.push(candidate);
        return;
      }

      await pcRef.current.addIceCandidate(candidate);
      appliedCandidates.current.push(candidate);
    } catch (err) {
      console.error('[CallModal] Error adding ICE candidate:', err);
    }
  }, []);

  const applyPendingCandidates = useCallback(async () => {
    if (!pcRef.current || !isRemoteDescriptionSet.current) return;

    for (const candidate of pendingCandidates.current) {
      try {
        await pcRef.current.addIceCandidate(candidate);
        appliedCandidates.current.push(candidate);
      } catch (err) {
        console.error('[CallModal] Error applying pending ICE candidate:', err);
      }
    }
    pendingCandidates.current = [];
  }, []);

  // --- Effects and signaling ---

  useEffect(() => {
    if (isInitializedRef.current) return;
    if (isCleanupInProgressRef.current) return;
    isInitializedRef.current = true;

    let mounted = true;

    console.log('[CallModal] Initializing call with config:', {
      roomId,
      isCaller: isCallerRef.current,
      contactId: contact.id,
      currentUserId: currentUser.uid
    });

    const start = async () => {
      try {
        // Проверка устройств перед стартом
        const mediaCheck = await checkMediaDevices();
        if (!mediaCheck.camera) throw new Error('Камера не найдена или не работает');
        if (!mediaCheck.microphone) throw new Error('Микрофон не найден или не работает');
        if (!mediaCheck.screen) console.warn('Внимание: демонстрация экрана недоступна');
        const stream = await initializeMediaStream();
        if (!stream) throw new Error('Не удалось получить MediaStream');
        if (!mounted) return;

        console.log('[CallModal] Media stream initialized:', {
          hasVideo: stream.getVideoTracks().length > 0,
          hasAudio: stream.getAudioTracks().length > 0,
          tracks: stream.getTracks().map(t => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState
          }))
        });

        const pc = createPeerConnection();
        if (!mounted) return;

        if (stream) {
          console.log('[CallModal] Adding local tracks to peer connection');
          stream.getTracks().forEach(track => {
            if (pc.signalingState !== 'closed') {
              console.log('[CallModal] Adding track:', {
                kind: track.kind,
                label: track.label,
                enabled: track.enabled
              });
              pc.addTrack(track, stream);
            }
          });
        }

        if (isCallerRef.current) {
          console.log('[CallModal] Creating offer as caller');
          try {
            const offer = await pc.createOffer();
            console.log('[CallModal] Offer created:', {
              type: offer.type,
              sdp: offer.sdp?.substring(0, 100) + '...'
            });

            await pc.setLocalDescription(offer);
            console.log('[CallModal] Local description set (offer)');

            console.log('[CallModal] Sending offer to room:', roomId);
            socketRef.current?.emit('offer', offer, roomId, currentUser.uid);
          } catch (err) {
            console.error('[CallModal] Error creating/setting offer:', err);
            throw err;
          }
        }

      } catch (err) {
        console.error('[CallModal] Error in start():', err);
        setError(err instanceof Error ? err.message : 'Не удалось начать звонок. Проверьте доступ к камере и микрофону.');
        onCallEnd();
      }
    };

    if (!socketRef.current) {
      console.log('[CallModal] Creating new socket connection');
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        console.log('[CallModal] Socket connected, joining room:', roomId);
        socketRef.current?.emit('join-room', roomId, currentUser.uid);
      });

      socketRef.current.on('user-joined', (userId: string) => {
        console.log('[CallModal] User joined:', userId);
      });

      socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit, from: string) => {
        console.log('[SOCKET] offer from', from, offer);
        try {
          if (!pcRef.current) {
            console.warn('[CallModal] No peer connection for offer, creating...');
            createPeerConnection();
          }
          if (!pcRef.current) {
            console.error('[CallModal] Still no peer connection for offer');
            return;
          }

          console.log('[CallModal] Current state before setting remote description:', {
            signalingState: pcRef.current.signalingState,
            iceConnectionState: pcRef.current.iceConnectionState,
            connectionState: pcRef.current.connectionState
          });

          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          isRemoteDescriptionSet.current = true;
          console.log('[CallModal] Remote description set (offer)');

          const answer = await pcRef.current.createAnswer();
          console.log('[CallModal] Answer created:', {
            type: answer.type,
            sdp: answer.sdp?.substring(0, 100) + '...'
          });

          await pcRef.current.setLocalDescription(answer);
          console.log('[CallModal] Local description set (answer)');

          console.log('[CallModal] Sending answer to room:', roomId);
          socketRef.current?.emit('answer', answer, roomId, currentUser.uid);
        } catch (err) {
          console.error('[CallModal] Error handling offer:', err);
        }
      });

      socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit, from: string) => {
        console.log('[SOCKET] answer from', from, answer);
        try {
          if (!pcRef.current) {
            console.error('[CallModal] No peer connection for answer');
            return;
          }

          if (lastProcessedAnswer === answer.sdp) {
            console.log('[CallModal] Duplicate answer received, ignoring');
            return;
          }

          console.log('[CallModal] signalingState before setRemoteDescription:', pcRef.current.signalingState);
          if (pcRef.current.signalingState !== 'have-local-offer') {
            console.warn('[CallModal] Not in have-local-offer state, skipping setRemoteDescription for answer');
            return;
          }

          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setLastProcessedAnswer(answer.sdp || '');
          isRemoteDescriptionSet.current = true;
          console.log('[CallModal] signalingState after setRemoteDescription:', pcRef.current.signalingState);
          console.log('[CallModal] Remote description set (answer)');

          await applyPendingCandidates();
        } catch (err) {
          console.error('[CallModal] Error handling answer:', err);
        }
      });

      socketRef.current.on('ice-candidate', async (candidate: RTCIceCandidate, from: string) => {
        console.log('[SOCKET] ice-candidate from', from, candidate);
        await addIceCandidate(candidate);
      });
    }

    start();

    return () => {
      console.log('[CallModal] Cleanup started');
      mounted = false;
      isCleanupInProgressRef.current = true;
      if (status === 'ended' || status === 'declined') {
        cleanup();
        isInitializedRef.current = false;
      }
      isCleanupInProgressRef.current = false;
    };
  }, [roomId, contact, currentUser, onCallEnd, cleanup, createPeerConnection, initializeMediaStream, status, addIceCandidate, applyPendingCandidates]);

  // --- Diagnostics (оставить по желанию, не обязательно) ---

  const hasLocalTracks = useCallback(() => {
    return !!localStreamRef.current && localStreamRef.current.getTracks().length > 0;
  }, []);

  // --- Обновление diagnostics (битрейт, треки) ---
  useEffect(() => {
    let interval: any;
    if (pcRef.current) {
      interval = setInterval(async () => {
        const stats = await pcRef.current!.getStats();
        let bitrate = 0;
        let localTracks: any[] = [];
        let remoteTracks: any[] = [];
        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.kind === 'video' && report.bytesSent) {
            bitrate += report.bytesSent;
          }
          if (report.type === 'track' && report.kind) {
            if (report.remoteSource) remoteTracks.push(report);
            else localTracks.push(report);
          }
        });
        setDiagnostics(d => ({
          ...d,
          bitrate,
          localTracks,
          remoteTracks
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pcRef.current]);

  // В useEffect для socket.io добавим обработку ошибок
  useEffect(() => {
    if (!socketRef.current) return;

    const handleError = (error: Error) => {
      console.error('[CallModal] Socket error:', error);
      // Не выполняем cleanup при временных ошибках
      if (!error.message.includes('transport error')) {
        cleanup();
      }
    };

    socketRef.current.on('error', handleError);
    socketRef.current.on('connect_error', handleError);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('error', handleError);
        socketRef.current.off('connect_error', handleError);
      }
    };
  }, [cleanup]);

  return {
    localVideoRef,
    remoteVideoRef,
    pipVideoRef,
    status,
    isMuted,
    isCameraOff,
    isScreenSharing,
    showCameraOverlay,
    error,
    remoteVideoError,
    diagnostics,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    toggleCameraOverlay,
    endCall,
    declineCall,
    acceptCall,
    retryCall,
    switchCamera,
    muteRemote,
    hasLocalTracks
  };
}