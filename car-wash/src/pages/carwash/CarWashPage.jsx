import React, { useState, useEffect, useRef } from 'react';
import './CarWashPage.css';
import BottomNav from '../../components/BottomNav';
import HistoryTab from './HistoryTab';
import ProfileTab from './ProfileTab';
import dataStorage from '../../services/dataStorageAdapter';
import { Toast } from 'antd-mobile';

const CarWashPage = () => {
  const [activeTab, setActiveTab] = useState('carwash');
  const [licensePlate, setLicensePlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allLicensePlates, setAllLicensePlates] = useState([]);
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

  // 获取顶部安全区域高度的工具函数
  const getTopSafeAreaHeight = () => {
    // 方法1: 使用CSS环境变量
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0');
    
    // 方法2: 使用window.screen和window.innerHeight计算状态栏高度
    const viewportHeight = window.innerHeight;
    const screenHeight = window.screen.height;
    const statusBarHeight = Math.max(0, screenHeight - viewportHeight);
    
    // Android设备状态栏高度检测的补充方法
    const getAndroidStatusBarHeight = () => {
      // 方法2a: 使用screen.availTop (Android特有)
      const availTop = window.screen.availTop || 0;
      
      // 方法2b: 使用screen.height - screen.availHeight
      const availHeight = window.screen.availHeight;
      const calculatedHeight = screenHeight - availHeight;
      
      // 方法2c: 使用window.outerHeight - window.innerHeight
      const outerHeight = window.outerHeight || 0;
      const outerInnerDiff = Math.max(0, outerHeight - viewportHeight);
      
      // 综合计算，取最大值作为状态栏高度
      const androidStatusBarHeight = Math.max(
        statusBarHeight,
        availTop,
        calculatedHeight,
        outerInnerDiff
      );
      
      return {
        screenHeight,
        viewportHeight,
        availTop,
        availHeight,
        outerHeight,
        calculatedHeight,
        outerInnerDiff,
        finalHeight: androidStatusBarHeight
      };
    };
    
    // 方法3: 使用getBoundingClientRect获取元素位置
    const rect = containerRef.current?.getBoundingClientRect();
    const topOffset = rect ? rect.top : 0;
    
    // 方法4: 检测是否为iOS设备（通常有刘海屏）
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // 方法5: 检测设备像素比（高分辨率设备通常有刘海屏）
    const isHighDPI = window.devicePixelRatio > 2;
    
    // 获取Android设备状态栏高度
    const androidInfo = isAndroid ? getAndroidStatusBarHeight() : null;
    
    // 简化的Android设备顶部安全区域计算
    let calculatedHeight = 0;
    
    if (isAndroid) {
      // Android设备：使用更保守的计算方式
      const androidStatusBarHeight = Math.min(
        statusBarHeight || 0,
        androidInfo?.finalHeight || 0,
        30 // Android设备最大不超过30px
      );
      
      // 只有在确实检测到状态栏时才添加间距
      if (androidStatusBarHeight > 0 && androidStatusBarHeight < 50) {
        calculatedHeight = androidStatusBarHeight;
      } else {
        // 如果检测结果异常，使用固定的小间距
        calculatedHeight = 10;
      }
    } else if (isIOS) {
      // iOS设备：使用CSS安全区域或固定值
      calculatedHeight = safeAreaTop > 0 ? safeAreaTop : 20;
    } else {
      // 其他设备：最小间距
      calculatedHeight = 10;
    }
    
    // 确保不超过合理范围
    calculatedHeight = Math.min(calculatedHeight, 30); // 进一步减少最大高度
    
    return {
      safeAreaTop,
      statusBarHeight,
      topOffset,
      isIOS,
      isAndroid,
      isHighDPI,
      calculatedHeight,
      androidInfo // 包含Android设备状态栏的详细信息
    };
  };

  // 动态获取并设置顶部和底部的安全区域高度
  useEffect(() => {
    const adjustPadding = () => {
      if (containerRef.current) {
        const safeAreaInfo = getTopSafeAreaHeight();
        const actualTopOffset = safeAreaInfo.calculatedHeight;

        // 获取底部导航栏高度
        const bottomNav = document.querySelector('.bottom-nav');
        const bottomHeight = bottomNav ? bottomNav.offsetHeight : 60;

        // 动态设置 padding
        containerRef.current.style.paddingTop = `${actualTopOffset}px`;
        containerRef.current.style.paddingBottom = `${bottomHeight + 20}px`;
        
        // 添加调试信息
        console.log('🔧 顶部安全区域调整:', {
          ...safeAreaInfo,
          actualTopOffset,
          viewportHeight: window.innerHeight,
          screenHeight: window.screen.height,
          finalPadding: `${actualTopOffset}px`,
          recommendation: actualTopOffset > 20 ? '⚠️ 间距可能过大' : '✅ 间距合理',
          deviceInfo: {
            isAndroid: safeAreaInfo.isAndroid,
            isIOS: safeAreaInfo.isIOS,
            userAgent: navigator.userAgent,
            devicePixelRatio: window.devicePixelRatio
          }
        });
      }
    };

    // 初始调整
    adjustPadding();

    // 监听窗口大小变化
    window.addEventListener('resize', adjustPadding);
    window.addEventListener('orientationchange', adjustPadding);
    
    // 监听设备方向变化
    window.addEventListener('orientationchange', () => {
      setTimeout(adjustPadding, 100); // 延迟调整，等待方向变化完成
    });

    // 延迟调整，确保 DOM 完全加载
    const timer = setTimeout(adjustPadding, 100);
    const timer2 = setTimeout(adjustPadding, 500); // 额外延迟调整

    return () => {
      window.removeEventListener('resize', adjustPadding);
      window.removeEventListener('orientationchange', adjustPadding);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [activeTab]);






  // 组件加载时获取所有车牌号
  useEffect(() => {
    loadAllLicensePlates();
  }, []);

  // 获取所有已保存的车牌号
  const loadAllLicensePlates = async () => {
    try {
      const records = await dataStorage.getAllRecords();
      console.log('📊 所有记录:', records);
      const licensePlates = [...new Set(records.map(record => record.licensePlate))].filter(Boolean);
      setAllLicensePlates(licensePlates);
      console.log('📋 已加载车牌号列表:', licensePlates);
      
      // 如果没有数据，添加一些测试数据
      if (licensePlates.length === 0) {
        console.log('⚠️ 没有历史数据，添加测试车牌号');
        const testPlates = ['京A12345', '沪B67890', '粤C11111', '川D22222', '鲁E33333'];
        setAllLicensePlates(testPlates);
      }
    } catch (error) {
      console.error('❌ 加载车牌号失败:', error);
      // 如果加载失败，添加测试数据
      const testPlates = ['京A12345', '沪B67890', '粤C11111', '川D22222', '鲁E33333'];
      setAllLicensePlates(testPlates);
    }
  };

  // 模糊匹配车牌号
  const getSuggestions = (input) => {
    if (!input || input.length < 1) {
      return [];
    }
    
    const inputUpper = input.toUpperCase();
    return allLicensePlates
      .filter(plate => plate.includes(inputUpper))
      .sort((a, b) => {
        // 优先显示完全匹配的，然后是按长度排序
        if (a === inputUpper) return -1;
        if (b === inputUpper) return 1;
        return a.length - b.length;
      })
      .slice(0, 5); // 最多显示5个建议
  };

  // 手动输入车牌号
  const handleLicensePlateChange = e => {
    const value = e.target.value.toUpperCase();
    setLicensePlate(value);
    
    // 获取建议
    const newSuggestions = getSuggestions(value);
    console.log('🔍 输入值:', value);
    console.log('📋 所有车牌号:', allLicensePlates);
    console.log('💡 建议列表:', newSuggestions);
    console.log('👁️ 显示建议:', value.length > 0 && newSuggestions.length > 0);
    
    // 立即更新状态
    setSuggestions(newSuggestions);
    setShowSuggestions(value.length > 0 && newSuggestions.length > 0);
    
    // 强制重新渲染
    setTimeout(() => {
      console.log('🔄 状态更新后 - showSuggestions:', showSuggestions, 'suggestions:', suggestions.length);
    }, 0);
  };

  // 选择建议的车牌号
  const selectSuggestion = (plate) => {
    setLicensePlate(plate);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // 关闭建议列表
  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
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
      <div className="license-input">
        <label>车牌号码:</label>
        <div className="license-input-container">
          <input
            type="text"
            value={licensePlate}
            onChange={handleLicensePlateChange}
            onBlur={() => setTimeout(closeSuggestions, 200)} // 延迟关闭，允许点击建议
            onFocus={() => {
              if (licensePlate && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="请输入车牌号"
            maxLength="10"
            className="license-plate-input"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="license-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
              调试: showSuggestions={showSuggestions.toString()}, suggestions={suggestions.length}
            </div>
          )}
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

    </div>
  );
};

export default CarWashPage;
