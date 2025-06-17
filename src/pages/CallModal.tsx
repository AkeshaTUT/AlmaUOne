import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaPhoneSlash, FaSpinner, FaExclamationTriangle, FaRedo, FaCamera, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { CallConfig } from '@/types/call';

interface CallModalProps {
  callConfig: CallConfig;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ callConfig, onClose }) => {
  const [isWebRTCSupported, setIsWebRTCSupported] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    callState,
    connectionState,
    iceConnectionState,
    diagnostics,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleCameraOverlay,
    localVideoError,
    remoteVideoError,
    showCameraOverlay,
    switchCamera,
    muteRemote,
    hasLocalTracks
  } = useWebRTCCall(callConfig);

  useEffect(() => {
    const hasWebRTC = 'mediaDevices' in navigator && 'RTCPeerConnection' in window;
    setIsWebRTCSupported(hasWebRTC);
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnecting(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleMuteToggle = useCallback(() => {
    toggleMute();
    setIsMuted(!isMuted);
  }, [toggleMute, isMuted]);

  const handleVideoToggle = useCallback(() => {
    toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
  }, [toggleVideo, isVideoEnabled]);

  const handleScreenShareToggle = useCallback(() => {
    toggleScreenShare();
    setIsScreenSharing(!isScreenSharing);
  }, [toggleScreenShare, isScreenSharing]);

  if (isWebRTCSupported === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md text-center">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Браузер не поддерживает видеозвонки</h2>
          <p className="text-gray-600 mb-4">
            Для использования видеозвонков необходимо использовать современный браузер с поддержкой WebRTC.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const isCallActive = callState === 'accepted';
  const hasMediaError = diagnostics.localTracks?.length === 0;
  const hasConnectionError = !isConnecting && diagnostics.remoteTracks?.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-4xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Status Bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              callState === 'accepted' ? 'bg-green-500' :
              callState === 'connecting' ? 'bg-yellow-500' :
              callState === 'ringing' ? 'bg-blue-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {callState === 'accepted' ? 'Соединение установлено' :
                callState === 'connecting' ? 'Установка соединения...' :
                  callState === 'ringing' ? 'Входящий звонок' :
                    'Соединение разорвано'}
            </span>
          </div>
          {diagnostics.warning && (
            <div className="text-red-500 text-sm flex items-center gap-1">
              <FaExclamationTriangle className="w-4 h-4" />
              {diagnostics.warning}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Remote Video */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* PiP video поверх экрана */}
            {isScreenSharing && showCameraOverlay && (
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                className="absolute bottom-4 right-4 w-36 h-28 rounded-lg border-2 border-white shadow-xl pointer-events-none z-10"
                muted
              />
            )}
            {/* Status overlays/ошибки/diagnostics можно добавить по желанию */}
            {remoteVideoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                {remoteVideoError}
              </div>
            )}
          </div>
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {diagnostics.localTracks?.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                <div className="text-center">
                  <FaExclamationTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>Нет доступа к камере/микрофону</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Controls */}
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={handleMuteToggle}
            disabled={!isCallActive}
            className={`p-3 rounded-full ${!isCallActive ? 'bg-gray-200' : isMuted ? 'bg-red-500' : 'bg-green-500'} hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isMuted ? "Включить микрофон" : "Выключить микрофон"}
          >
            {isMuted
              ? <FaMicrophoneSlash className="w-6 h-6 text-white" />
              : <FaMicrophone className="w-6 h-6 text-white" />}
          </button>
          <button
            onClick={handleVideoToggle}
            disabled={!isCallActive}
            className={`p-3 rounded-full ${!isCallActive ? 'bg-gray-200' : !isVideoEnabled ? 'bg-red-500' : 'bg-green-500'} hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!isVideoEnabled ? "Включить видео" : "Выключить видео"}
          >
            {!isVideoEnabled
              ? <FaVideoSlash className="w-6 h-6 text-white" />
              : <FaVideo className="w-6 h-6 text-white" />}
          </button>
          <button
            onClick={handleScreenShareToggle}
            disabled={!isCallActive}
            className={`p-3 rounded-full ${!isCallActive ? 'bg-gray-200' : isScreenSharing ? 'bg-green-500' : 'bg-red-500'} hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isScreenSharing ? "Остановить демонстрацию экрана" : "Начать демонстрацию экрана"}
          >
            <FaDesktop className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={toggleCameraOverlay}
            disabled={!isScreenSharing}
            className={`p-3 rounded-full ${showCameraOverlay ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={showCameraOverlay ? "Отключить камеру поверх" : "Включить камеру поверх"}
          >
            <FaVideo className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={switchCamera}
            disabled={!isCallActive}
            className="p-3 rounded-full bg-gray-200 hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Сменить камеру"
          >
            <FaCamera className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={muteRemote}
            disabled={!isCallActive || hasConnectionError}
            className="p-3 rounded-full bg-gray-200 hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Приглушить собеседника"
          >
            <FaVolumeUp className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
            title="Завершить звонок"
          >
            <FaPhoneSlash className="w-6 h-6" />
          </button>
        </div>
        {/* Bitrate and tracks info */}
        <div className="mt-4 text-sm text-gray-600 flex flex-col items-center">
          <div>Bitrate: <span className="font-semibold">{(diagnostics.bitrate / 1000).toFixed(1)} kbps</span></div>
          <div>Local Tracks: <span className="font-semibold">{diagnostics.localTracks?.length || 0}</span> | Remote Tracks: <span className="font-semibold">{diagnostics.remoteTracks?.length || 0}</span></div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={retryCall}
              className="flex items-center gap-2 text-red-700 hover:text-red-800"
            >
              <FaRedo className="w-4 h-4" />
              Попробовать снова
            </button>
          </div>
        )}
        {/* Diagnostics (по желанию, для разработки) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDiagnostics ? 'Скрыть диагностику' : 'Показать диагностику'}
            </button>
          </div>
        )}
        {process.env.NODE_ENV === 'development' && showDiagnostics && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">Diagnostics:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>ICE State: {diagnostics.iceState}</div>
              <div>Connection State: {diagnostics.connectionState}</div>
              <div>Has Relay: {diagnostics.hasRelay ? 'Yes' : 'No'}</div>
              <div>Bitrate: {diagnostics.bitrate?.toFixed(2)} kbps</div>
            </div>
            <div className="mt-2">
              <div>ICE Candidates:</div>
              <div>Host: {diagnostics.iceCandidates.host}</div>
              <div>SRFLX: {diagnostics.iceCandidates.srflx}</div>
              <div>Relay: {diagnostics.iceCandidates.relay}</div>
            </div>
            {diagnostics.warning && (
              <div className="mt-2 text-red-500">{diagnostics.warning}</div>
            )}
            <div className="mt-2">
              <div>Remote Tracks: {diagnostics.remoteTracks.length}</div>
              <div>Local Tracks: {diagnostics.localTracks.length}</div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}