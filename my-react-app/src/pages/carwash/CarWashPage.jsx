import React, { useState, useEffect, useRef } from 'react';
import './CarWashPage.css';
import CameraCapture from '../../components/CameraCapture';
import BottomNav from '../../components/BottomNav';
import HistoryTab from './HistoryTab';
import ProfileTab from './ProfileTab';
import licensePlateService from '../../services/licensePlateService';
import dataStorage from '../../services/dataStorageAdapter';
import { Toast } from 'antd-mobile';

const CarWashPage = () => {
  const [activeTab, setActiveTab] = useState('carwash');
  const [licensePlate, setLicensePlate] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const containerRef = useRef(null);
  const [serviceRecord, setServiceRecord] = useState({
    mileage: 'normal', // 里程: 正常(默认) / 超了
    tires: 'normal', // 轮胎: 正常(默认) / 平了
    oil: 'normal', // 机油: 正常(默认) / 少了
    wipers: 'normal', // 雨刮: 正常(默认) / 坏了
    interior: [], // 内饰: 多选
    exterior: [], // 外观: 多选
    notes: '', // 备注
  });

  // 动态获取并设置顶部和底部的安全区域高度
  useEffect(() => {
    const adjustPadding = () => {
      if (containerRef.current) {
        // 获取视口顶部偏移（状态栏高度）
        const rect = containerRef.current.getBoundingClientRect();
        const topOffset = rect.top;

        // 获取底部导航栏高度
        const bottomNav = document.querySelector('.bottom-nav');
        const bottomHeight = bottomNav ? bottomNav.offsetHeight : 60;

        // 动态设置 padding
        containerRef.current.style.paddingTop = `${Math.max(20, topOffset + 10)}px`;
        containerRef.current.style.paddingBottom = `${bottomHeight + 20}px`;
      }
    };

    // 初始调整
    adjustPadding();

    // 监听窗口大小变化
    window.addEventListener('resize', adjustPadding);
    window.addEventListener('orientationchange', adjustPadding);

    // 延迟调整，确保 DOM 完全加载
    const timer = setTimeout(adjustPadding, 100);

    return () => {
      window.removeEventListener('resize', adjustPadding);
      window.removeEventListener('orientationchange', adjustPadding);
      clearTimeout(timer);
    };
  }, [activeTab]);

  // 清空图片和车牌号
  const handleClearImage = () => {
    setCapturedImage(null);
    setLicensePlate('');
    console.log('🗑️ 已清空图片和车牌号');
  };

  // 打开摄像头
  const handleOpenCamera = async () => {
    // 检查摄像头权限
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.show({
        icon: 'fail',
        content: '您的浏览器不支持摄像头功能，请使用现代浏览器或 HTTPS 协议',
        duration: 3000,
      });
      return;
    }

    setShowCamera(true);
  };

  // Handle camera capture
  const handleCameraCapture = async imageData => {
    setCapturedImage(imageData);
    setShowCamera(false);

    // Start license plate recognition
    setIsLoading(true);
    try {
      // Convert image data to base64 (remove data URL prefix)
      const base64Image = imageData.split(',')[1];
      const result = await licensePlateService.recognizeLicensePlate(base64Image);

      if (result.success) {
        setLicensePlate(result.plateNumber);
        console.log(`Detected plate: ${result.plateNumber}, confidence: ${(result.confidence * 100).toFixed(1)}%`);
      } else {
        // Show specific error message
        Toast.show({
          icon: 'fail',
          content: result.error || '车牌识别失败，请手动输入',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('License plate recognition failed:', error);
      Toast.show({
        icon: 'fail',
        content: '车牌识别失败，请手动输入',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭摄像头
  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  // Handle file upload
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async e => {
          const imageData = e.target.result;
          setCapturedImage(imageData);

          // Start license plate recognition
          setIsLoading(true);
          try {
            // Convert image data to base64 (remove data URL prefix)
            const base64Image = imageData.split(',')[1];
            const result = await licensePlateService.recognizeLicensePlate(base64Image);

            if (result.success) {
              setLicensePlate(result.plateNumber);
              console.log(
                `Detected plate: ${result.plateNumber}, confidence: ${(result.confidence * 100).toFixed(1)}%`
              );
            } else {
              // Show specific error message
              Toast.show({
                icon: 'fail',
                content: result.error || '车牌识别失败，请手动输入',
                duration: 3000,
              });
            }
          } catch (error) {
            console.error('License plate recognition failed:', error);
            Toast.show({
              icon: 'fail',
              content: '车牌识别失败，请手动输入',
              duration: 3000,
            });
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // 手动输入车牌号
  const handleLicensePlateChange = e => {
    setLicensePlate(e.target.value.toUpperCase());
  };

  // 服务记录更新
  const handleServiceChange = (category, value) => {
    setServiceRecord(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  // 多选处理（内饰和外观）
  const handleMultiSelectChange = (category, value) => {
    setServiceRecord(prev => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value) // 取消选择
        : [...currentValues, value]; // 添加选择

      return {
        ...prev,
        [category]: newValues,
      };
    });
  };

  // 快捷标签处理
  const handleQuickTag = tag => {
    setServiceRecord(prev => {
      const currentNotes = prev.notes || '';

      if (currentNotes.includes(tag)) {
        // 如果已包含该标签，则移除
        const newNotes = currentNotes
          .replace(new RegExp(tag + '[,\\s]*', 'g'), '')
          .replace(/^,\s*|,\s*$/g, '')
          .trim();
        return {
          ...prev,
          notes: newNotes,
        };
      } else {
        // 如果未包含该标签，则添加
        const newNotes = currentNotes ? `${currentNotes}, ${tag}` : tag;
        return {
          ...prev,
          notes: newNotes,
        };
      }
    });
  };

  // 保存记录
  const handleSaveRecord = async () => {
    if (!licensePlate) {
      Toast.show({
        icon: 'fail',
        content: '请先输入或识别车牌号',
        duration: 2000,
      });
      return;
    }

    // 开始加载动画
    setIsLoading(true);

    try {
      const record = {
        licensePlate,
        image: capturedImage,
        serviceRecord,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('zh-CN'),
      };

      // 保存到存储（可能是 localStorage 或 Firebase）
      const result = await dataStorage.addRecord(record);

      if (result.success) {
        Toast.show({
          icon: 'success',
          content: '记录保存成功！',
          duration: 2000,
        });

        // 重置表单
        setLicensePlate('');
        setCapturedImage(null);
        setServiceRecord({
          mileage: 'normal',
          tires: 'normal',
          oil: 'normal',
          wipers: 'normal',
          interior: [],
          exterior: [],
          notes: '',
        });
      } else {
        Toast.show({
          icon: 'fail',
          content: `保存失败: ${result.error || '请重试'}`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('保存记录失败:', error);
      Toast.show({
        icon: 'fail',
        content: '保存失败，请重试',
        duration: 2000,
      });
    } finally {
      // 结束加载动画
      setIsLoading(false);
    }
  };

  // 渲染洗车表单内容
  const renderCarWashForm = () => (
    <>
      {/* 拍照和车牌识别区域 */}
      <div className="camera-section">
        <div className="camera-controls">
          <div className="camera-buttons">
            <button className="capture-btn" onClick={handleOpenCamera} disabled={isLoading}>
              {isLoading ? '识别中...' : '📷 拍照'}
            </button>

            <button className="upload-btn" onClick={handleFileUpload} disabled={isLoading}>
              📁 上传
            </button>
          </div>

          {capturedImage && (
            <div className="image-container">
              <div className="captured-image" onClick={() => setShowImageModal(true)} title="点击查看大图">
                <img src={capturedImage} alt="Captured license plate" />
                <div className="image-hint">🔍 点击查看大图</div>
              </div>
              <button className="delete-image-btn" onClick={handleClearImage} title="删除图片">
                🗑️ 删除
              </button>
            </div>
          )}
        </div>

        <div className="license-input">
          <label>车牌号码:</label>
          <input
            type="text"
            value={licensePlate}
            onChange={handleLicensePlateChange}
            placeholder="请输入车牌号"
            maxLength="10"
            className="license-plate-input"
          />
        </div>
      </div>

      {/* 服务记录表单 */}
      <div className="service-section">
        <div className="service-form">
          {/* 里程 */}
          <div className="service-item">
            <label>里程:</label>
            <div className="service-options">
              <button
                className={`option-btn ${serviceRecord.mileage === 'normal' ? 'active' : ''}`}
                onClick={() => handleServiceChange('mileage', 'normal')}
              >
                正常
              </button>
              <button
                className={`option-btn ${serviceRecord.mileage === 'over' ? 'active' : ''}`}
                onClick={() => handleServiceChange('mileage', 'over')}
              >
                超了
              </button>
            </div>
          </div>

          {/* 轮胎 */}
          <div className="service-item">
            <label>轮胎:</label>
            <div className="service-options">
              <button
                className={`option-btn ${serviceRecord.tires === 'normal' ? 'active' : ''}`}
                onClick={() => handleServiceChange('tires', 'normal')}
              >
                正常
              </button>
              <button
                className={`option-btn ${serviceRecord.tires === 'flat' ? 'active' : ''}`}
                onClick={() => handleServiceChange('tires', 'flat')}
              >
                平了
              </button>
            </div>
          </div>

          {/* 机油 */}
          <div className="service-item">
            <label>机油:</label>
            <div className="service-options">
              <button
                className={`option-btn ${serviceRecord.oil === 'normal' ? 'active' : ''}`}
                onClick={() => handleServiceChange('oil', 'normal')}
              >
                正常
              </button>
              <button
                className={`option-btn ${serviceRecord.oil === 'low' ? 'active' : ''}`}
                onClick={() => handleServiceChange('oil', 'low')}
              >
                少了
              </button>
            </div>
          </div>

          {/* 雨刮 */}
          <div className="service-item">
            <label>雨刮:</label>
            <div className="service-options">
              <button
                className={`option-btn ${serviceRecord.wipers === 'normal' ? 'active' : ''}`}
                onClick={() => handleServiceChange('wipers', 'normal')}
              >
                正常
              </button>
              <button
                className={`option-btn ${serviceRecord.wipers === 'broken' ? 'active' : ''}`}
                onClick={() => handleServiceChange('wipers', 'broken')}
              >
                坏了
              </button>
            </div>
          </div>

          {/* 内饰清洗人员（多选） */}
          <div className="service-item">
            <label>内饰清洗:</label>
            <div className="service-options">
              {['Mingle', 'Dao', 'Roger', 'Swing'].map(staff => (
                <button
                  key={staff}
                  className={`option-btn ${serviceRecord.interior.includes(staff) ? 'active' : ''}`}
                  onClick={() => handleMultiSelectChange('interior', staff)}
                >
                  {staff}
                </button>
              ))}
            </div>
          </div>

          {/* 外观清洗人员（多选） */}
          <div className="service-item">
            <label>外观清洗:</label>
            <div className="service-options">
              {['Mingle', 'Dao', 'Roger', 'Swing'].map(staff => (
                <button
                  key={staff}
                  className={`option-btn ${serviceRecord.exterior.includes(staff) ? 'active' : ''}`}
                  onClick={() => handleMultiSelectChange('exterior', staff)}
                >
                  {staff}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div className="service-item notes-item">
            <label>备注:</label>
            <div className="notes-container">
              <input
                type="text"
                className="notes-input"
                value={serviceRecord.notes}
                onChange={e => handleServiceChange('notes', e.target.value)}
                placeholder="输入备注信息..."
              />
              <div className="quick-tags">
                {['保养', '加机油', '换轮胎', '换雨刮'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`quick-tag-btn ${serviceRecord.notes.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleQuickTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="save-btn" onClick={handleSaveRecord} disabled={!licensePlate || isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner">⏳</span>
              保存中...
            </>
          ) : (
            '💾 保存记录'
          )}
        </button>
      </div>

      {/* 摄像头组件 */}
      {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={handleCloseCamera} />}
    </>
  );

  return (
    <div className="car-wash-container" ref={containerRef}>
      {/* 根据选中的 tab 显示不同内容 */}
      {activeTab === 'carwash' && renderCarWashForm()}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'profile' && <ProfileTab />}

      {/* 底部导航 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 图片预览模态框 */}
      {showImageModal && capturedImage && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <div className="image-modal-content">
            <button className="image-modal-close" onClick={() => setShowImageModal(false)}>
              ✕
            </button>
            <img src={capturedImage} alt="License plate preview" />
            <p className="image-modal-hint">点击任意位置关闭</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarWashPage;
