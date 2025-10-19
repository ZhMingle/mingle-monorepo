// 数据存储服务
// 使用 localStorage 作为本地存储，实际项目中可以替换为 Firebase 或其他云服务

const STORAGE_KEY = 'carWashRecords';

class DataStorageService {
  constructor() {
    this.records = this.loadRecords();
  }

  // 加载所有记录
  loadRecords() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('加载记录失败:', error);
      return [];
    }
  }

  // 保存所有记录
  saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
      return true;
    } catch (error) {
      console.error('保存记录失败:', error);
      return false;
    }
  }

  // 添加新记录
  addRecord(record) {
    const newRecord = {
      id: Date.now() + Math.random(), // 简单的 ID 生成
      ...record,
      createdAt: new Date().toISOString()
    };

    this.records.unshift(newRecord); // 添加到开头，最新的在前面
    const success = this.saveRecords();
    
    if (success) {
      console.log('记录保存成功:', newRecord);
    }
    
    return { success, record: newRecord };
  }

  // 获取所有记录
  getAllRecords() {
    return [...this.records];
  }

  // 根据车牌号搜索记录
  searchByLicensePlate(plateNumber) {
    if (!plateNumber.trim()) {
      return this.getAllRecords();
    }

    return this.records.filter(record =>
      record.licensePlate.toLowerCase().includes(plateNumber.toLowerCase())
    );
  }

  // 获取指定车牌号的所有记录
  getRecordsByPlate(plateNumber) {
    return this.records.filter(record =>
      record.licensePlate.toLowerCase() === plateNumber.toLowerCase()
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // 更新记录
  updateRecord(id, updates) {
    const index = this.records.findIndex(record => record.id === id);
    if (index !== -1) {
      this.records[index] = { ...this.records[index], ...updates };
      return this.saveRecords();
    }
    return false;
  }

  // 删除记录
  deleteRecord(id) {
    const index = this.records.findIndex(record => record.id === id);
    if (index !== -1) {
      this.records.splice(index, 1);
      return this.saveRecords();
    }
    return false;
  }

  // 获取统计信息
  getStatistics() {
    const totalRecords = this.records.length;
    const uniquePlates = new Set(this.records.map(r => r.licensePlate)).size;
    
    // 按日期统计
    const today = new Date().toDateString();
    const todayRecords = this.records.filter(r => 
      new Date(r.createdAt).toDateString() === today
    ).length;

    // 按车牌号统计记录数
    const plateCounts = this.records.reduce((acc, record) => {
      const plate = record.licensePlate;
      acc[plate] = (acc[plate] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRecords,
      uniquePlates,
      todayRecords,
      plateCounts
    };
  }

  // 导出数据
  exportData() {
    return {
      records: this.records,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // 导入数据
  importData(data) {
    try {
      if (data.records && Array.isArray(data.records)) {
        // 备份现有数据
        const backup = [...this.records];
        
        // 导入新数据
        this.records = data.records;
        
        if (this.saveRecords()) {
          console.log('数据导入成功');
          return { success: true };
        } else {
          // 恢复备份
          this.records = backup;
          return { success: false, error: '保存失败' };
        }
      } else {
        return { success: false, error: '数据格式错误' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 清空所有数据
  clearAllData() {
    this.records = [];
    return this.saveRecords();
  }
}

export default new DataStorageService();
