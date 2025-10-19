import React, { useState } from 'react';
import './CarWashPage.css';
import CameraCapture from '../../components/CameraCapture';
import BottomNav from '../../components/BottomNav';
import HistoryTab from './HistoryTab';
import ProfileTab from './ProfileTab';
import licensePlateService from '../../services/licensePlateService';
import dataStorage from '../../services/dataStorage';

const CarWashPage = () => {
  const [activeTab, setActiveTab] = useState('carwash');
  const [licensePlate, setLicensePlate] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [serviceRecord, setServiceRecord] = useState({
    mileage: 'normal', // 里程: 正常(默认) / 超了
    tires: 'normal', // 轮胎: 正常(默认) / 平了
    oil: 'normal', // 机油: 正常(默认) / 少了
    wipers: 'normal', // 雨刮: 正常(默认) / 坏了
    interior: [], // 内饰: 多选
    exterior: [], // 外观: 多选
    notes: '', // 备注
  });

  // 打开摄像头
  const handleOpenCamera = async () => {
    // 检查摄像头权限
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('您的浏览器不支持摄像头功能，请使用现代浏览器或 HTTPS 协议');
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
        alert('License plate recognition failed. Please enter manually.');
      }
    } catch (error) {
      console.error('License plate recognition failed:', error);
      alert('License plate recognition failed. Please enter manually.');
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
              alert('License plate recognition failed. Please enter manually.');
            }
          } catch (error) {
            console.error('License plate recognition failed:', error);
            alert('License plate recognition failed. Please enter manually.');
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
  const handleSaveRecord = () => {
    if (!licensePlate) {
      alert('请先输入或识别车牌号');
      return;
    }

    const record = {
      licensePlate,
      image: capturedImage,
      serviceRecord,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('zh-CN'),
    };

    // 保存到本地存储
    const result = dataStorage.addRecord(record);

    if (result.success) {
      alert('记录保存成功！');

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
      alert('保存失败，请重试');
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
            <div className="captured-image">
              <img src={capturedImage} alt="Captured license plate" />
            </div>
          )}
        </div>

        <div className="license-input">
          <label>车牌号码:</label>
          <input
            type="text"
            value={licensePlate}
            onChange={handleLicensePlateChange}
            placeholder="输入车牌号或拍照识别"
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

          {/* 内饰（多选） */}
          <div className="service-item">
            <label>内饰:</label>
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

          {/* 外观（多选） */}
          <div className="service-item">
            <label>外观:</label>
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

        <button className="save-btn" onClick={handleSaveRecord} disabled={!licensePlate}>
          💾 保存记录
        </button>
      </div>

      {/* 摄像头组件 */}
      {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={handleCloseCamera} />}
    </>
  );

  return (
    <div className="car-wash-container">
      {/* 根据选中的 tab 显示不同内容 */}
      {activeTab === 'carwash' && renderCarWashForm()}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'profile' && <ProfileTab />}

      {/* 底部导航 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default CarWashPage;
