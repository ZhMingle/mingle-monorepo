// Firebase 数据存储服务
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'carWashRecords';

class FirebaseDataStorageService {
  constructor() {
    this.records = [];
  }

  // 添加新记录
  async addRecord(record) {
    try {
      const recordWithTimestamp = {
        ...record,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), recordWithTimestamp);

      console.log('记录保存成功:', { id: docRef.id, ...recordWithTimestamp });

      return {
        success: true,
        record: { id: docRef.id, ...recordWithTimestamp },
      };
    } catch (error) {
      console.error('保存记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取所有记录
  async getAllRecords() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const records = [];

      querySnapshot.forEach(doc => {
        records.push({
          id: doc.id,
          ...doc.data(),
          // 转换 Firestore 时间戳为字符串
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        });
      });

      this.records = records;
      return records;
    } catch (error) {
      console.error('获取记录失败:', error);
      return [];
    }
  }

  // 删除记录
  async deleteRecord(recordId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, recordId));
      console.log('记录删除成功:', recordId);
      return { success: true };
    } catch (error) {
      console.error('删除记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取统计信息
  async getStatistics() {
    try {
      const records = await this.getAllRecords();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRecords = records.filter(record => {
        const recordDate = new Date(record.createdAt || record.timestamp);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      const uniquePlates = new Set(records.map(record => record.licensePlate));

      return {
        totalRecords: records.length,
        uniquePlates: uniquePlates.size,
        todayRecords: todayRecords.length,
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalRecords: 0,
        uniquePlates: 0,
        todayRecords: 0,
      };
    }
  }

  // 导出数据
  async exportData() {
    try {
      const records = await this.getAllRecords();
      return {
        records,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return {
        records: [],
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    }
  }

  // 清空所有数据
  async clearAllData() {
    try {
      const records = await this.getAllRecords();
      const deletePromises = records.map(record => deleteDoc(doc(db, COLLECTION_NAME, record.id)));

      await Promise.all(deletePromises);
      console.log('所有数据已清空');
      return { success: true };
    } catch (error) {
      console.error('清空数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 按车牌号搜索记录
  async searchByLicensePlate(licensePlate) {
    try {
      const records = await this.getAllRecords();
      return records.filter(record => record.licensePlate.toLowerCase().includes(licensePlate.toLowerCase()));
    } catch (error) {
      console.error('搜索记录失败:', error);
      return [];
    }
  }
}

// 创建单例实例
const firebaseDataStorage = new FirebaseDataStorageService();

export default firebaseDataStorage;
