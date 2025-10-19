import React, { useState, useEffect } from 'react';
import { List, SearchBar, Empty, Card, Button, Image, Space, Tag, Modal } from 'antd-mobile';
import dataStorage from '../../services/dataStorage';

const HistoryTab = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = dataStorage.getAllRecords();
    setRecords(allRecords);
  };

  const handleDelete = (record) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      dataStorage.deleteRecord(record.id);
      loadRecords();
    }
  };

  const filteredRecords = records.filter(record => 
    record.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatArrayValue = (arr) => {
    return arr && arr.length > 0 ? arr.join(', ') : '-';
  };

  const handleShowImage = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
          📋 服务历史
        </h2>
        <SearchBar
          placeholder="搜索车牌号..."
          value={searchTerm}
          onChange={setSearchTerm}
          style={{ '--background': '#f5f5f5' }}
        />
      </div>

      <div style={{ 
        textAlign: 'right', 
        marginBottom: '16px', 
        color: '#666', 
        fontSize: '14px' 
      }}>
        共 {filteredRecords.length} 条记录
      </div>

      {filteredRecords.length === 0 ? (
        <Empty description="暂无服务记录" />
      ) : (
        <List>
          {filteredRecords.map((record, index) => (
            <List.Item key={index}>
              <Card>
                <div style={{ padding: '8px 12px', minHeight: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        color: record.image ? '#1890ff' : '#333',
                        cursor: record.image ? 'pointer' : 'default',
                        textDecoration: record.image ? 'underline' : 'none'
                      }}
                      onClick={() => record.image && handleShowImage(record.image)}
                    >
                      🚗 {record.licensePlate}
                    </div>
                    <Button
                      size="mini"
                      color="danger"
                      onClick={() => handleDelete(record)}
                    >
                      删除
                    </Button>
                  </div>
                  
                  <div style={{ marginBottom: '4px', fontSize: '13px', color: '#666' }}>
                    📅 {record.date}
                  </div>
                  
                  <Space wrap style={{ fontSize: '12px' }}>
                    {formatArrayValue(record.serviceRecord.interior) !== '-' && (
                      <Tag color="blue" style={{ fontSize: '12px' }}>
                        内饰: {formatArrayValue(record.serviceRecord.interior)}
                      </Tag>
                    )}
                    {formatArrayValue(record.serviceRecord.exterior) !== '-' && (
                      <Tag color="green" style={{ fontSize: '12px' }}>
                        外观: {formatArrayValue(record.serviceRecord.exterior)}
                      </Tag>
                    )}
                  </Space>
                  
                  {record.serviceRecord.notes && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                      📝 {record.serviceRecord.notes}
                    </div>
                  )}
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
              <Image
                src={selectedImage}
                alt="车辆照片"
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            </div>
          )
        }
        closeOnMaskClick
      />
    </div>
  );
};

export default HistoryTab;

