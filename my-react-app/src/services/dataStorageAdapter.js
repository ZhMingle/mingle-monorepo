// 数据存储适配器 - 自动选择使用 localStorage 或 Firebase
import dataStorage from './dataStorage';
import firebaseDataStorage from './firebaseDataStorage';
import dataMigration from './dataMigration';

class DataStorageAdapter {
  constructor() {
    this.useFirebase = this.checkFirebaseConfig();
    this.storage = this.useFirebase ? firebaseDataStorage : dataStorage;

    console.log(`📦 使用存储方式: ${this.useFirebase ? 'Firebase' : 'localStorage'}`);
  }

  // 检查 Firebase 配置是否完整
  checkFirebaseConfig() {
    const requiredKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];

    const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);

    if (missingKeys.length > 0) {
      console.warn('⚠️ Firebase 配置不完整，使用 localStorage:', missingKeys);
      return false;
    }

    return true;
  }

  // 初始化 - 检查是否需要迁移数据
  async initialize() {
    if (this.useFirebase && dataMigration.needsMigration()) {
      console.log('🚀 检测到需要迁移数据到 Firebase...');
      const result = await dataMigration.migrateData();

      if (result.success) {
        console.log(`✅ 数据迁移成功: ${result.migratedCount} 条记录`);
      } else {
        console.error('❌ 数据迁移失败:', result.error);
      }

      return result;
    }

    return { success: true, migratedCount: 0 };
  }

  // 代理所有数据存储方法
  async addRecord(record) {
    return await this.storage.addRecord(record);
  }

  async getAllRecords() {
    return await this.storage.getAllRecords();
  }

  async deleteRecord(recordId) {
    return await this.storage.deleteRecord(recordId);
  }

  async getStatistics() {
    return await this.storage.getStatistics();
  }

  async exportData() {
    return await this.storage.exportData();
  }

  async clearAllData() {
    return await this.storage.clearAllData();
  }

  async searchByLicensePlate(licensePlate) {
    return await this.storage.searchByLicensePlate(licensePlate);
  }

  // 获取当前使用的存储方式
  getStorageType() {
    return this.useFirebase ? 'Firebase' : 'localStorage';
  }

  // 手动切换到 Firebase（需要重新加载页面）
  switchToFirebase() {
    if (this.checkFirebaseConfig()) {
      console.log('🔄 切换到 Firebase 存储');
      this.useFirebase = true;
      this.storage = firebaseDataStorage;
      return true;
    }
    return false;
  }

  // 手动切换到 localStorage
  switchToLocalStorage() {
    console.log('🔄 切换到 localStorage');
    this.useFirebase = false;
    this.storage = dataStorage;
  }
}

// 创建单例实例
const dataStorageAdapter = new DataStorageAdapter();

export default dataStorageAdapter;
