// src/hooks/useWebRTCCall.ts
import { useRef, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  status: CallStatus;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  error: string | null;
  remoteVideoError: string | null;
  diagnostics: CallDiagnostics;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  endCall: () => void;
  declineCall: () => void;
  acceptCall: () => void;
  retryCall: () => void;
  switchCamera: () => void;
  muteRemote: () => void;
}

// Production TURN configuration
const TURN_CONFIG = {
  urls: import.meta.env.VITE_TURN_URL || 'turn:34.40.51.208:3478',
  username: import.meta.env.VITE_TURN_USERNAME || 'akesha',
  credential: import.meta.env.VITE_TURN_CREDENTIAL || 'admin'
};

// STUN servers configuration
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Combined ICE servers configuration
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

  // Refs for stable references
  const isCallerRef = useRef(isCaller);
  const isInitializedRef = useRef(false);
  const isCleanupInProgressRef = useRef(false);
  const callConfigRef = useRef({
    roomId,
    isCaller,
    contact,
    currentUser
  });

  // Update isCallerRef only when it actually changes
  useEffect(() => {
    if (isCallerRef.current !== isCaller) {
      console.log('[CallModal] Role changed:', { from: isCallerRef.current, to: isCaller });
      isCallerRef.current = isCaller;
    }
  }, [isCaller]);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);
  const appliedCandidates = useRef<RTCIceCandidate[]>([]);
  const isRemoteDescriptionSet = useRef<boolean>(false);
  const remoteMediaStream = useRef<MediaStream>(new MediaStream());
  const reconnectAttempts = useRef<number>(0);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<Notification | null>(null);
  const turnCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const isRemoteMuted = useRef<boolean>(false);
  const handleReconnectionRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // State
  const [status, setStatus] = useState<CallStatus>('connecting');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [iceConnectionState, setIceConnectionState] = useState<string>('new');
  const [isRinging, setIsRinging] = useState(false);
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

  // Callbacks
  const logSignalingState = useCallback((pc: RTCPeerConnection, context: string) => {
    console.log(`[Signaling] ${context}:`, {
      signalingState: pc.signalingState,
      iceConnectionState: pc.iceConnectionState,
      connectionState: pc.connectionState,
      iceGatheringState: pc.iceGatheringState
    });
  }, []);

  const cleanup = useCallback(() => {
    console.log('[CallModal] Cleaning up resources');
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (turnCheckTimeout.current) {
      clearTimeout(turnCheckTimeout.current);
      turnCheckTimeout.current = null;
    }
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = null;
    }
    reconnectAttempts.current = 0;
    isRemoteDescriptionSet.current = false;
    pendingCandidates.current = [];
    appliedCandidates.current = [];
  }, []);

  const initializeMediaStream = useCallback(async () => {
    console.log('[CallModal] Initializing media stream');
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('[CallModal] Got high quality stream:', stream.getTracks());
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        if (localVideoRef.current.srcObject !== stream) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.onloadedmetadata = () => {
            localVideoRef.current?.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error('[CallModal] Error playing local video:', err);
              }
            });
          };
        }
      }

      return stream;
    } catch (err) {
      console.error('[CallModal] Error getting media stream:', err);
      try {
        // Fallback to audio-only
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('[CallModal] Got audio stream:', audioStream.getTracks());
        localStreamRef.current = audioStream;
        setError('Не удалось получить доступ к камере. Продолжаем с аудиозвонком.');
        return audioStream;
      } catch (audioErr) {
        console.error('[CallModal] Error getting audio stream:', audioErr);
        throw audioErr;
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log('[CallModal] Creating peer connection');
    if (pcRef.current) {
      console.log('[CallModal] Closing existing peer connection');
      pcRef.current.close();
      pcRef.current = null;
    }

    // Reset state
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
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    };

    console.log('[CallModal] ICE Configuration:', {
      iceServers: configuration.iceServers.map(server => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential ? '***' : undefined
      })),
      iceTransportPolicy: configuration.iceTransportPolicy,
      iceCandidatePoolSize: configuration.iceCandidatePoolSize,
      bundlePolicy: configuration.bundlePolicy,
      rtcpMuxPolicy: configuration.rtcpMuxPolicy
    });

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Add transceivers first
    pc.addTransceiver('audio', { direction: 'sendrecv' });
    pc.addTransceiver('video', { direction: 'sendrecv' });

    pc.onicecandidate = (event) => {
      console.log('[CallModal] ICE candidate:', event.candidate);
      if (event.candidate && pc.signalingState !== 'closed') {
        if (event.candidate.candidate) {
          const candidateType = event.candidate.candidate.split(' ')[7];
          console.log('[CallModal] ICE candidate type:', candidateType, {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          });
          
          // Update diagnostics with ICE candidate counts
          setDiagnostics(prev => ({
            ...prev,
            iceCandidates: {
              ...prev.iceCandidates,
              [candidateType]: (prev.iceCandidates[candidateType] || 0) + 1
            }
          }));

          // Log TURN usage
          if (candidateType === 'relay') {
            console.log('[CallModal] Using TURN server for relay candidate');
          }
        }
        socketRef.current?.emit('ice-candidate', event.candidate, callConfigRef.current.roomId, callConfigRef.current.currentUser.uid);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('[CallModal] ICE gathering state:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      setIceConnectionState(pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'checking') {
        console.log('[CallModal] ICE checking - gathering candidates');
      } else if (pc.iceConnectionState === 'connected') {
        console.log('[CallModal] ICE connected - connection established');
        if (turnCheckTimeout.current) {
          clearTimeout(turnCheckTimeout.current);
          turnCheckTimeout.current = null;
        }
      } else if (pc.iceConnectionState === 'failed') {
        console.log('[CallModal] ICE connection failed, attempting restart');
        pc.restartIce();
        handleReconnectionRef.current?.();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection State:', pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        console.log('[CallModal] Connection established successfully');
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }
      } else if (pc.connectionState === 'failed') {
        console.log('[CallModal] Connection failed, attempting reconnection');
        handleReconnectionRef.current?.();
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling State:', pc.signalingState);
      if (pc.signalingState === 'closed') {
        console.log('[CallModal] Peer connection closed, cleaning up');
        cleanup();
      }
    };

    pc.ontrack = (event) => {
      console.log('[CallModal] ontrack event:', event);
      if (!event.streams || !event.streams[0]) {
        console.error('[CallModal] No streams in ontrack event');
        return;
      }
      
      const tracks = event.streams[0].getTracks();
      console.log('[CallModal] Received tracks:', tracks.map(t => ({
        kind: t.kind,
        label: t.label,
        readyState: t.readyState,
        enabled: t.enabled
      })));
      
      if (remoteVideoRef.current) {
        console.log('[CallModal] Setting remote video stream');
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.onloadedmetadata = () => {
            remoteVideoRef.current?.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error('[CallModal] Error playing remote video:', err);
                setRemoteVideoError('Error playing video: ' + err.message);
              }
            });
          };
        }
      }
    };

    return pc;
  }, [callConfigRef.current.roomId, callConfigRef.current.currentUser.uid, cleanup]);

  const handleReconnection = useCallback(async () => {
    console.log('[CallModal] Attempting reconnection');
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[CallModal] Max reconnection attempts reached');
      setError('Не удалось установить соединение. Пожалуйста, попробуйте позже.');
      onCallEnd();
      return;
    }

    try {
      reconnectAttempts.current++;
      console.log(`[CallModal] Reconnection attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);

      cleanup();

      const pc = createPeerConnection();
      pcRef.current = pc;

      const stream = await initializeMediaStream();
      if (!stream) {
        throw new Error('Failed to initialize media stream');
      }

      if (callConfigRef.current.isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('offer', offer, callConfigRef.current.roomId, callConfigRef.current.currentUser.uid);
      } else if (pc.signalingState === 'have-remote-offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit('answer', answer, callConfigRef.current.roomId, callConfigRef.current.currentUser.uid);
      }

      console.log('[CallModal] Reconnection attempt completed');
    } catch (err) {
      console.error('[CallModal] Reconnection failed:', err);
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(handleReconnection, 1000 * reconnectAttempts.current);
      } else {
        setError('Не удалось восстановить соединение. Пожалуйста, попробуйте позже.');
        onCallEnd();
      }
    }
  }, [cleanup, createPeerConnection, initializeMediaStream, callConfigRef.current.isCaller, callConfigRef.current.roomId, callConfigRef.current.currentUser.uid, onCallEnd]);

  // Store handleReconnection in ref after it's defined
  handleReconnectionRef.current = handleReconnection;

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 1920,
            height: 1080,
            frameRate: 30
          }
        });
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          const originalVideoTrack = localStreamRef.current?.getVideoTracks()[0];
          await sender.replaceTrack(videoTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
            try { await localVideoRef.current.play(); } catch (err) {}
          }
          screenStreamRef.current = screenStream;
          setIsScreenSharing(true);
          
          videoTrack.onended = async () => {
            if (localStreamRef.current && originalVideoTrack && sender) {
              await sender.replaceTrack(originalVideoTrack);
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
                try { await localVideoRef.current.play(); } catch (err) {}
              }
            }
            setIsScreenSharing(false);
            screenStreamRef.current?.getTracks().forEach(track => track.stop());
          };
        }
      } else {
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (sender && camTrack) {
          await sender.replaceTrack(camTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            try { await localVideoRef.current.play(); } catch (err) {}
          }
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
      setError('Не удалось начать демонстрацию экрана. Пожалуйста, проверьте разрешения браузера.');
    }
  }, [isScreenSharing]);

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
    } catch (err) {
      console.error('Error updating call status:', err);
    }
    
    cleanup();
    setStatus('ended');
    onCallEnd();
  }, [callConfigRef.current.roomId, callConfigRef.current.currentUser.uid, callConfigRef.current.contact.id, cleanup, onCallEnd]);

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
    } catch (err) {
      console.error('Error declining call:', err);
    }
    endCall();
  }, [callConfigRef.current.roomId, callConfigRef.current.currentUser.uid, callConfigRef.current.contact.id, endCall]);

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
    } catch (err) {
      console.error('Error accepting call:', err);
    }
  }, [callConfigRef.current.roomId, callConfigRef.current.currentUser.uid, callConfigRef.current.contact.id]);

  const retryCall = useCallback(() => {
    cleanup();
    reconnectAttempts.current = 0;
    setError(null);
    handleReconnection();
  }, [cleanup, handleReconnection]);

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
            try { await localVideoRef.current.play(); } catch (err) {}
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

  // Function to add ICE candidates
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed') {
      console.log('[CallModal] Cannot add ICE candidate - peer connection closed');
      return;
    }

    try {
      if (!isRemoteDescriptionSet.current) {
        console.log('[CallModal] Remote description not set, storing candidate:', {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          type: candidate.candidate?.split(' ')[7] || 'unknown'
        });
        pendingCandidates.current.push(candidate);
        return;
      }

      console.log('[CallModal] Adding ICE candidate:', {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        type: candidate.candidate?.split(' ')[7] || 'unknown',
        signalingState: pcRef.current.signalingState,
        iceConnectionState: pcRef.current.iceConnectionState
      });

      await pcRef.current.addIceCandidate(candidate);
      console.log('[CallModal] ICE candidate added successfully');
      
      // Update diagnostics
      if (candidate.candidate) {
        const candidateType = candidate.candidate.split(' ')[7];
        setDiagnostics(prev => ({
          ...prev,
          iceCandidates: {
            ...prev.iceCandidates,
            [candidateType]: (prev.iceCandidates[candidateType] || 0) + 1
          }
        }));

        // Log TURN usage
        if (candidateType === 'relay') {
          console.log('[CallModal] Using TURN server for relay candidate');
        }
      }
    } catch (err) {
      console.error('[CallModal] Error adding ICE candidate:', err);
    }
  }, []);

  // Function to apply pending ICE candidates
  const applyPendingCandidates = useCallback(async () => {
    if (!pcRef.current || !isRemoteDescriptionSet.current) {
      console.log('[CallModal] Cannot apply pending candidates - no peer connection or remote description');
      return;
    }

    console.log('[CallModal] Applying pending ICE candidates:', pendingCandidates.current.length);
    for (const candidate of pendingCandidates.current) {
      try {
        await pcRef.current.addIceCandidate(candidate);
        console.log('[CallModal] Applied pending ICE candidate:', {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        });
      } catch (err) {
        console.error('[CallModal] Error applying pending ICE candidate:', err);
      }
    }
    pendingCandidates.current = [];
  }, []);

  // Effects
  useEffect(() => {
    console.log('[CallModal] useEffect START', { roomId, contact, currentUser, isCaller: isCallerRef.current });
    
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('[CallModal] Already initialized, skipping');
      return;
    }

    // Prevent cleanup during initialization
    if (isCleanupInProgressRef.current) {
      console.log('[CallModal] Cleanup in progress, skipping initialization');
      return;
    }

    isInitializedRef.current = true;
    let mounted = true;

    const start = async () => {
      try {
        // Initialize media stream first
        const stream = await initializeMediaStream();
        if (!mounted) return;

        // Create peer connection after media stream is initialized
        const pc = createPeerConnection();
        if (!mounted) return;

        // Add local tracks to peer connection
        if (stream) {
          console.log('[CallModal] Adding local tracks to peer connection:', stream.getTracks());
          stream.getTracks().forEach(track => {
            if (pc.signalingState !== 'closed') {
              console.log('[CallModal] Adding track:', track.kind, track.label);
              pc.addTrack(track, stream);
            }
          });
        }

        // Set up TURN check timeout
        turnCheckTimeout.current = setTimeout(() => {
          if (!diagnostics.hasRelay) {
            console.error('[CallModal] TURN connection check failed');
            setError('Не удалось установить TURN-соединение. Возможны проблемы с сетью.');
          }
        }, TURN_CHECK_TIMEOUT);

        // Set up connection timeout
        connectionTimeout.current = setTimeout(() => {
          if (status === 'connecting') {
            console.error('[CallModal] Connection timeout');
            setError('Собеседник не отвечает. Попробуйте позже.');
            onCallEnd();
          }
        }, CONNECTION_TIMEOUT);

        if (isCallerRef.current) {
          console.log('[CallModal] Creating offer as caller');
          try {
            logSignalingState(pc, 'Before creating offer');
            const offer = await pc.createOffer();
            console.log('[CallModal] Offer created:', {
              type: offer.type,
              sdp: offer.sdp?.substring(0, 100) + '...'
            });
            logSignalingState(pc, 'After creating offer');

            console.log('[CallModal] Setting local description (offer)');
            await pc.setLocalDescription(offer);
            logSignalingState(pc, 'After setting local description (offer)');

            console.log('[CallModal] Sending offer to room:', roomId);
            socketRef.current?.emit('offer', offer, roomId, currentUser.uid);
          } catch (err) {
            console.error('[CallModal] Error creating/setting offer:', err);
            throw err;
          }
        }

      } catch (err) {
        console.error('[CallModal] Error in start():', err);
        if (mounted) {
          setError('Не удалось начать звонок. Пожалуйста, проверьте доступ к камере и микрофону.');
          onCallEnd();
        }
      }
    };

    // Socket event handlers
    if (!socketRef.current) {
      console.log('[CallModal] Creating new socket connection');
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        console.log('[CallModal] Socket connected');
        socketRef.current?.emit('join-room', roomId, currentUser.uid);
      });

      socketRef.current.on('user-joined', (userId: string) => {
        console.log('[CallModal] User joined:', userId);
      });

      socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit, from: string) => {
        console.log('[CallModal] Received offer from:', from);
        try {
          if (!pcRef.current) {
            console.error('[CallModal] No peer connection for offer');
            return;
          }

          console.log('[CallModal] Current state before setting remote description:', {
            signalingState: pcRef.current.signalingState,
            iceConnectionState: pcRef.current.iceConnectionState,
            connectionState: pcRef.current.connectionState
          });

          logSignalingState(pcRef.current, 'Before setting remote description (offer)');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          isRemoteDescriptionSet.current = true;
          logSignalingState(pcRef.current, 'After setting remote description (offer)');

          // Apply any pending ICE candidates
          console.log('[CallModal] Applying pending candidates after offer:', pendingCandidates.current.length);
          await applyPendingCandidates();

          const answer = await pcRef.current.createAnswer();
          logSignalingState(pcRef.current, 'After creating answer');
          
          await pcRef.current.setLocalDescription(answer);
          logSignalingState(pcRef.current, 'After setting local description (answer)');
          
          socketRef.current?.emit('answer', answer, roomId, currentUser.uid);
        } catch (err) {
          console.error('[CallModal] Error handling offer:', err);
        }
      });

      socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit, from: string) => {
        console.log('[CallModal] Received answer from:', from);
        try {
          if (!pcRef.current) {
            console.error('[CallModal] No peer connection for answer');
            return;
          }

          // Prevent duplicate answers
          if (lastProcessedAnswer === answer.sdp) {
            console.log('[CallModal] Duplicate answer received, ignoring');
            return;
          }
          setLastProcessedAnswer(answer.sdp || '');

          console.log('[CallModal] Current state before setting remote description:', {
            signalingState: pcRef.current.signalingState,
            iceConnectionState: pcRef.current.iceConnectionState,
            connectionState: pcRef.current.connectionState
          });

          logSignalingState(pcRef.current, 'Before setting remote description (answer)');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          isRemoteDescriptionSet.current = true;
          logSignalingState(pcRef.current, 'After setting remote description (answer)');

          // Apply any pending ICE candidates
          console.log('[CallModal] Applying pending candidates after answer:', pendingCandidates.current.length);
          await applyPendingCandidates();
        } catch (err) {
          console.error('[CallModal] Error handling answer:', err);
        }
      });

      socketRef.current.on('ice-candidate', async (candidate: RTCIceCandidate, from: string) => {
        console.log('[CallModal] Received ICE candidate from:', from, {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          type: candidate.candidate?.split(' ')[7] || 'unknown'
        });

        if (!pcRef.current) {
          console.error('[CallModal] No peer connection for ICE candidate');
          return;
        }

        console.log('[CallModal] Current signaling state:', pcRef.current.signalingState);
        console.log('[CallModal] Remote description set:', isRemoteDescriptionSet.current);

        await addIceCandidate(candidate);
      });
    }

    start();

    return () => {
      console.log('[CallModal] useEffect CLEANUP (return)');
      mounted = false;
      isCleanupInProgressRef.current = true;
      
      // Only cleanup if we're actually ending the call
      if (status === 'ended' || status === 'declined') {
        console.log('[CallModal] Call ended, cleaning up resources');
        cleanup();
        isInitializedRef.current = false;
      }
      
      isCleanupInProgressRef.current = false;
    };
  }, [roomId, contact, currentUser, onCallEnd, cleanup, createPeerConnection, initializeMediaStream, status, diagnostics.hasRelay, logSignalingState]);

  // Initialize ringtone
  useEffect(() => {
    ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
    ringtoneRef.current.loop = true;
    
    return () => {
      ringtoneRef.current?.pause();
      ringtoneRef.current = null;
    };
  }, []);

  // Diagnostics
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!pcRef.current) return;
      
      try {
        const stats = await pcRef.current.getStats();
        let hasRelay = false;
        let bitrate = 0;
        let remoteTracks = [];
        let localTracks = [];
        let warning = '';
        let selectedCandidatePair = null;

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const localCandidate = stats.get(report.localCandidateId);
            const remoteCandidate = stats.get(report.remoteCandidateId);
            
            selectedCandidatePair = {
              localType: localCandidate?.candidateType,
              remoteType: remoteCandidate?.candidateType,
              state: report.state,
              priority: report.priority,
              localAddress: localCandidate?.address,
              remoteAddress: remoteCandidate?.address,
              localProtocol: localCandidate?.protocol,
              remoteProtocol: remoteCandidate?.protocol
            };
            
            console.log('[CallModal] Selected candidate pair:', selectedCandidatePair);
            
            if (localCandidate?.candidateType === 'relay' || remoteCandidate?.candidateType === 'relay') {
              hasRelay = true;
              console.log('[CallModal] Using TURN relay for connection');
            } else {
              console.log('[CallModal] Using direct connection (host/srflx)');
            }
          }
          
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            bitrate = report.bytesReceived * 8 / 1000;
          }
        });

        // Log all available candidates
        stats.forEach(report => {
          if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
            console.log('[CallModal] Available candidate:', {
              type: report.type,
              candidateType: report.candidateType,
              protocol: report.protocol,
              address: report.address,
              port: report.port,
              priority: report.priority,
              selected: report.selected
            });
          }
        });

        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
          remoteTracks = Array.from((remoteVideoRef.current.srcObject as MediaStream).getTracks()).map(t => ({
            kind: t.kind,
            label: t.label,
            readyState: t.readyState,
            enabled: t.enabled
          }));
        }

        if (localVideoRef.current && localVideoRef.current.srcObject) {
          localTracks = Array.from((localVideoRef.current.srcObject as MediaStream).getTracks()).map(t => ({
            kind: t.kind,
            label: t.label,
            readyState: t.readyState,
            enabled: t.enabled
          }));
        }

        if (!hasRelay && selectedCandidatePair) {
          warning = `Используется прямое соединение (${selectedCandidatePair.localType}→${selectedCandidatePair.remoteType}). TURN не требуется.`;
        }
        if (bitrate === 0) {
          warning = 'Bitrate=0: Видео не передаётся! Проверьте камеру и TURN.';
        }
        if (remoteTracks.length === 0) {
          warning = 'Нет удалённых треков. Проверьте сигналинг и ICE.';
        }
        if (localTracks.length === 0) {
          warning = 'Нет локальных треков. Проверьте доступ к камере/микрофону.';
        }

        setDiagnostics(prev => ({
          ...prev,
          iceState: iceConnectionState,
          connectionState,
          hasRelay,
          bitrate,
          remoteTracks,
          localTracks,
          warning,
          selectedCandidatePair
        }));
      } catch (err) {
        console.error('[CallModal] Error getting stats:', err);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [iceConnectionState, connectionState]);

  return {
    // Refs
    localVideoRef,
    remoteVideoRef,

    // State
    status,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error,
    remoteVideoError,
    diagnostics,

    // Methods
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    endCall,
    declineCall,
    acceptCall,
    retryCall,
    switchCamera,
    muteRemote
  };
}
