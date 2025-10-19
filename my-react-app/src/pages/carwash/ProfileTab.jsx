import React, { useState, useEffect } from 'react';
import dataStorage from '../../services/dataStorage';
import './ProfileTab.css';

const ProfileTab = () => {
  const [stats, setStats] = useState({
    totalRecords: 0,
    uniquePlates: 0,
    todayRecords: 0
  });

  useEffect(() => {
    const statistics = dataStorage.getStatistics();
    setStats(statistics);
  }, []);

  const handleExportData = () => {
    const data = dataStorage.exportData();
    if (data.records.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carwash-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      dataStorage.clearAllData();
      alert('数据已清空');
      window.location.reload();
    }
  };

  return (
    <div className="profile-tab">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <h2>洗车管理系统</h2>
        <p className="profile-subtitle">Car Wash Management</p>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-label">总服务记录</div>
            <div className="stat-value">{stats.totalRecords}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <div className="stat-label">服务车辆</div>
            <div className="stat-value">{stats.uniquePlates}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-label">今日服务</div>
            <div className="stat-value">{stats.todayRecords}</div>
          </div>
        </div>
      </div>

      <div className="menu-section">
        <h3>数据管理</h3>
        
        <button className="menu-item" onClick={handleExportData}>
          <span className="menu-icon">📥</span>
          <span className="menu-text">导出数据</span>
          <span className="menu-arrow">›</span>
        </button>

        <button className="menu-item danger" onClick={handleClearData}>
          <span className="menu-icon">🗑️</span>
          <span className="menu-text">清空数据</span>
          <span className="menu-arrow">›</span>
        </button>
      </div>

      <div className="menu-section">
        <h3>关于</h3>
        
        <div className="info-item">
          <span className="info-label">版本</span>
          <span className="info-value">v1.0.0</span>
        </div>

        <div className="info-item">
          <span className="info-label">功能</span>
          <span className="info-value">车牌识别 + 服务记录</span>
        </div>

        <div className="info-item">
          <span className="info-label">技术栈</span>
          <span className="info-value">React + Baidu AI</span>
        </div>
      </div>

      <div className="footer-note">
        <p>💡 数据存储在本地浏览器</p>
        <p>🔐 请定期导出备份</p>
      </div>
    </div>
  );
};

export default ProfileTab;

