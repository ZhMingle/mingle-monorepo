import React, { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

const CameraCapture = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // 检查是否支持摄像头
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 使用后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('摄像头访问失败:', err);

      let errorMessage = '无法访问摄像头';

      if (err.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '浏览器不支持摄像头功能，请使用 HTTPS 协议';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用占用';
      }

      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制视频帧到画布
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 转换为 base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // 停止摄像头
    stopCamera();

    // 调用回调函数
    onCapture(imageData);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (error) {
    return (
      <div className="camera-overlay">
        <div className="camera-modal">
          <div className="camera-error">
            <h3>❌ 摄像头错误</h3>
            <p>{error}</p>
            <button onClick={handleClose} className="close-camera-btn">
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-overlay">
      <div className="camera-modal">
        <div className="camera-header">
          <h3>📷 拍照识别车牌</h3>
          <button onClick={handleClose} className="close-camera-btn">
            ✕
          </button>
        </div>

        <div className="camera-content">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />

          <div className="camera-controls">
            <button onClick={capturePhoto} className="capture-btn">
              📸 拍照
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraCapture;
