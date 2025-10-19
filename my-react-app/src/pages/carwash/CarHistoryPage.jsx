import React, { useState, useEffect } from 'react';
import './CarHistoryPage.css';

const CarHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 模拟数据 - 实际应用中会从数据库获取
  useEffect(() => {
    const mockRecords = [
      {
        id: 1,
        licensePlate: 'ABC123',
        date: '2024-01-15',
        timestamp: '2024-01-15T10:30:00Z',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        serviceRecord: {
          rego: 'better',
          engineOil: 'add',
          wipers: 'normal',
          tires: '',
          interior: 'staff1',
          exterior: 'staff2'
        }
      },
      {
        id: 2,
        licensePlate: 'ABC123',
        date: '2024-01-10',
        timestamp: '2024-01-10T14:20:00Z',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        serviceRecord: {
          rego: 'add',
          engineOil: 'better',
          wipers: 'damaged',
          tires: 'replace',
          interior: 'staff2',
          exterior: 'staff1'
        }
      },
      {
        id: 3,
        licensePlate: 'DEF456',
        date: '2024-01-12',
        timestamp: '2024-01-12T09:15:00Z',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        serviceRecord: {
          rego: 'better',
          engineOil: 'better',
          wipers: 'normal',
          tires: '',
          interior: 'staff1',
          exterior: 'staff1'
        }
      }
    ];
    setAllRecords(mockRecords);
    setSearchResults(mockRecords);
  }, []);

  // 搜索功能
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults(allRecords);
      return;
    }

    const filtered = allRecords.filter(record =>
      record.licensePlate.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(filtered);
  };

  // 获取车牌号的历史记录
  const getHistoryForPlate = (plate) => {
    return allRecords.filter(record => 
      record.licensePlate.toLowerCase() === plate.toLowerCase()
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // 渲染服务记录详情
  const renderServiceDetails = (serviceRecord) => {
    const services = [];
    
    if (serviceRecord.rego) services.push(`Rego: ${serviceRecord.rego === 'better' ? '更好' : '添加'}`);
    if (serviceRecord.engineOil) services.push(`机油: ${serviceRecord.engineOil === 'better' ? '更好' : '添加'}`);
    if (serviceRecord.wipers) services.push(`雨刮器: ${serviceRecord.wipers === 'normal' ? '正常' : '损坏'}`);
    if (serviceRecord.tires) services.push(`轮胎: 更换`);
    if (serviceRecord.interior) services.push(`内饰: ${serviceRecord.interior === 'staff1' ? '员工A' : '员工B'}`);
    if (serviceRecord.exterior) services.push(`外观: ${serviceRecord.exterior === 'staff1' ? '员工A' : '员工B'}`);
    
    return services.join(', ');
  };

  // 按车牌号分组显示
  const groupedResults = searchResults.reduce((groups, record) => {
    const plate = record.licensePlate;
    if (!groups[plate]) {
      groups[plate] = [];
    }
    groups[plate].push(record);
    return groups;
  }, {});

  return (
    <div className="car-history-container">
      <h1 className="page-title">🔍 车辆历史记录</h1>
      
      {/* 搜索区域 */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="输入车牌号搜索..."
            className="search-input"
          />
          <button className="search-btn">🔍</button>
        </div>
        <p className="search-info">
          找到 {searchResults.length} 条记录
        </p>
      </div>

      {/* 结果列表 */}
      <div className="results-section">
        {Object.keys(groupedResults).length === 0 ? (
          <div className="no-results">
            <p>没有找到相关记录</p>
          </div>
        ) : (
          Object.entries(groupedResults).map(([plate, records]) => (
            <div key={plate} className="plate-group">
              <div className="plate-header">
                <h2 className="plate-number">🚗 {plate}</h2>
                <span className="record-count">共 {records.length} 条记录</span>
              </div>
              
              <div className="records-list">
                {records
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((record) => (
                    <div 
                      key={record.id} 
                      className="record-item"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div className="record-header">
                        <span className="record-date">{record.date}</span>
                        <span className="record-time">
                          {new Date(record.timestamp).toLocaleTimeString('zh-CN')}
                        </span>
                      </div>
                      <div className="record-details">
                        {renderServiceDetails(record.serviceRecord)}
                      </div>
                      {record.image && (
                        <div className="record-image">
                          <img src={record.image} alt="Vehicle" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>记录详情 - {selectedRecord.licensePlate}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-item">
                <label>日期:</label>
                <span>{selectedRecord.date}</span>
              </div>
              
              <div className="detail-item">
                <label>时间:</label>
                <span>{new Date(selectedRecord.timestamp).toLocaleString('zh-CN')}</span>
              </div>
              
              <div className="detail-item">
                <label>服务内容:</label>
                <div className="service-details">
                  {selectedRecord.serviceRecord.rego && (
                    <span className="service-tag">Rego: {selectedRecord.serviceRecord.rego === 'better' ? '更好' : '添加'}</span>
                  )}
                  {selectedRecord.serviceRecord.engineOil && (
                    <span className="service-tag">机油: {selectedRecord.serviceRecord.engineOil === 'better' ? '更好' : '添加'}</span>
                  )}
                  {selectedRecord.serviceRecord.wipers && (
                    <span className="service-tag">雨刮器: {selectedRecord.serviceRecord.wipers === 'normal' ? '正常' : '损坏'}</span>
                  )}
                  {selectedRecord.serviceRecord.tires && (
                    <span className="service-tag">轮胎: 更换</span>
                  )}
                  {selectedRecord.serviceRecord.interior && (
                    <span className="service-tag">内饰: {selectedRecord.serviceRecord.interior === 'staff1' ? '员工A' : '员工B'}</span>
                  )}
                  {selectedRecord.serviceRecord.exterior && (
                    <span className="service-tag">外观: {selectedRecord.serviceRecord.exterior === 'staff1' ? '员工A' : '员工B'}</span>
                  )}
                </div>
              </div>
              
              {selectedRecord.image && (
                <div className="detail-item">
                  <label>照片:</label>
                  <img src={selectedRecord.image} alt="Vehicle" className="detail-image" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarHistoryPage;
