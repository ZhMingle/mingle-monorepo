import React, { useState, useEffect } from 'react';
import { List, SearchBar, Empty, Card, Image, Space, Tag, Modal } from 'antd-mobile';
import dataStorage from '../../services/dataStorageAdapter';
import './HistoryTab.css';

const HistoryTab = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const allRecords = await dataStorage.getAllRecords();
      setRecords(allRecords);
    } catch (error) {
      console.error('加载记录失败:', error);
      setRecords([]);
    }
  };

  const filteredRecords = records.filter(record =>
    record.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatArrayValue = arr => {
    return arr && arr.length > 0 ? arr.join(', ') : '-';
  };

  const handleShowImage = imageSrc => {
    setSelectedImage(imageSrc);
  };

  return (
    <div style={{ padding: '12px', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>📋 服务历史</h2>
        <SearchBar
          placeholder="搜索车牌号..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ '--background': '#f5f5f5' }}
        />
      </div>

      <div
        style={{
          textAlign: 'right',
          marginBottom: '12px',
          color: '#666',
          fontSize: '12px',
        }}
      >
        共 {filteredRecords.length} 条记录
      </div>

      {filteredRecords.length === 0 ? (
        <Empty description="暂无服务记录" />
      ) : (
        <List>
          {filteredRecords.map((record, index) => (
            <List.Item key={index} style={{ padding: 0 }}>
              <Card style={{ padding: 0 }}>
                <div className="history-record-card" style={{ padding: '4px 8px' }}>
                  {/* 一行显示所有信息 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'nowrap',
                    }}
                  >
                    {/* 车牌号 */}
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: record.image ? '#1890ff' : '#333',
                        cursor: record.image ? 'pointer' : 'default',
                        textDecoration: record.image ? 'underline' : 'none',
                        minWidth: '80px',
                        flexShrink: 0,
                      }}
                      onClick={() => record.image && handleShowImage(record.image)}
                    >
                      🚗 {record.licensePlate}
                    </div>

                    {/* 日期 */}
                    <div style={{ fontSize: '10px', color: '#999', minWidth: '28px', flexShrink: 0 }}>
                      {new Date(record.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                    </div>

                    {/* 清洗人员标签 */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', flex: 1 }}>
                      {formatArrayValue(record.serviceRecord.interior) !== '-' && (
                        <Tag color="blue" style={{ fontSize: '9px', padding: '1px 3px', margin: 0 }}>
                          内饰: {formatArrayValue(record.serviceRecord.interior)}
                        </Tag>
                      )}
                      {formatArrayValue(record.serviceRecord.exterior) !== '-' && (
                        <Tag color="green" style={{ fontSize: '9px', padding: '1px 3px', margin: 0 }}>
                          外观: {formatArrayValue(record.serviceRecord.exterior)}
                        </Tag>
                      )}
                    </div>

                    {/* 备注 */}
                    {record.serviceRecord.notes && (
                      <div
                        style={{
                          fontSize: '9px',
                          color: '#666',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flexShrink: 1,
                        }}
                      >
                        📝 {record.serviceRecord.notes}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          ))}
        </List>
      )}

      {/* 图片预览Modal */}
      <Modal
        visible={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        content={
          selectedImage && (
            <div style={{ textAlign: 'center' }}>
              <Image src={selectedImage} alt="车辆照片" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            </div>
          )
        }
        closeOnMaskClick
      />
    </div>
  );
};

export default HistoryTab;
