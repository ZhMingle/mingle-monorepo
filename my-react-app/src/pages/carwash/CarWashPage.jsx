import React, { useState } from 'react';
import './CarWashPage.css';

const CarWashPage = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceRecord, setServiceRecord] = useState({
    rego: '',
    engineOil: '',
    wipers: '',
    tires: '',
    interior: '',
    exterior: ''
  });

  // 拍照功能
  const handleCapturePhoto = async () => {
    setIsLoading(true);
    try {
      // 这里会集成摄像头拍照功能
      // 暂时模拟拍照
      const mockImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
      setCapturedImage(mockImage);
      
      // 模拟车牌识别
      setTimeout(() => {
        setLicensePlate('ABC123');
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('拍照失败:', error);
      setIsLoading(false);
    }
  };

  // 手动输入车牌号
  const handleLicensePlateChange = (e) => {
    setLicensePlate(e.target.value.toUpperCase());
  };

  // 服务记录更新
  const handleServiceChange = (category, value) => {
    setServiceRecord(prev => ({
      ...prev,
      [category]: value
    }));
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
      date: new Date().toLocaleDateString('zh-CN')
    };

    console.log('保存记录:', record);
    // 这里会保存到数据库
    alert('记录保存成功！');
    
    // 重置表单
    setLicensePlate('');
    setCapturedImage(null);
    setServiceRecord({
      rego: '',
      engineOil: '',
      wipers: '',
      tires: '',
      interior: '',
      exterior: ''
    });
  };

  return (
    <div className="car-wash-container">
      <h1 className="page-title">🚗 洗车记录管理系统</h1>
      
      {/* 拍照和车牌识别区域 */}
      <div className="camera-section">
        <h2>📷 车牌识别</h2>
        <div className="camera-controls">
          <button 
            className="capture-btn"
            onClick={handleCapturePhoto}
            disabled={isLoading}
          >
            {isLoading ? '识别中...' : '📷 拍照识别车牌'}
          </button>
          
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
        <h2>📋 服务记录</h2>
        
        <div className="service-form">
          <div className="service-item">
            <label>Rego:</label>
            <div className="service-options">
              <button 
                className={`option-btn ${serviceRecord.rego === 'better' ? 'active' : ''}`}
                onClick={() => handleServiceChange('rego', 'better')}
              >
                更好
              </button>
              <button 
                className={`option-btn ${serviceRecord.rego === 'add' ? 'active' : ''}`}
                onClick={() => handleServiceChange('rego', 'add')}
              >
                添加
              </button>
            </div>
          </div>

          <div className="service-item">
            <label>机油:</label>
            <div className="service-options">
              <button 
                className={`option-btn ${serviceRecord.engineOil === 'better' ? 'active' : ''}`}
                onClick={() => handleServiceChange('engineOil', 'better')}
              >
                更好
              </button>
              <button 
                className={`option-btn ${serviceRecord.engineOil === 'add' ? 'active' : ''}`}
                onClick={() => handleServiceChange('engineOil', 'add')}
              >
                添加
              </button>
            </div>
          </div>

          <div className="service-item">
            <label>雨刮器:</label>
            <div className="service-options">
              <button 
                className={`option-btn ${serviceRecord.wipers === 'normal' ? 'active' : ''}`}
                onClick={() => handleServiceChange('wipers', 'normal')}
              >
                正常
              </button>
              <button 
                className={`option-btn ${serviceRecord.wipers === 'damaged' ? 'active' : ''}`}
                onClick={() => handleServiceChange('wipers', 'damaged')}
              >
                损坏
              </button>
            </div>
          </div>

          <div className="service-item">
            <label>轮胎:</label>
            <div className="service-options">
              <button 
                className={`option-btn ${serviceRecord.tires === 'replace' ? 'active' : ''}`}
                onClick={() => handleServiceChange('tires', 'replace')}
              >
                更换
              </button>
            </div>
          </div>

          <div className="service-item">
            <label>内饰:</label>
            <div className="service-options">
              <button 
                className={`option-btn ${serviceRecord.interior === 'staff1' ? 'active' : ''}`}
                onClick={() => handleServiceChange('interior', 'staff1')}
              >
                员工A
              </button>
              <button 
                className={`option-btn ${serviceRecord.interior === 'staff2' ? 'active' : ''}`}
                onClick={() => handleServiceChange('interior', 'staff2')}
              >
                员工B
              </button>
            </div>
          </div>

          <div className="service-item">
            <label>外观:</label>
            <div className="service-options">
              <button 
                className={`option-btn ${serviceRecord.exterior === 'staff1' ? 'active' : ''}`}
                onClick={() => handleServiceChange('exterior', 'staff1')}
              >
                员工A
              </button>
              <button 
                className={`option-btn ${serviceRecord.exterior === 'staff2' ? 'active' : ''}`}
                onClick={() => handleServiceChange('exterior', 'staff2')}
              >
                员工B
              </button>
            </div>
          </div>
        </div>

        <button 
          className="save-btn"
          onClick={handleSaveRecord}
          disabled={!licensePlate}
        >
          💾 保存记录
        </button>
      </div>
    </div>
  );
};

export default CarWashPage;
