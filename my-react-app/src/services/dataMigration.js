// 数据迁移服务 - 从 localStorage 迁移到 Firebase
import dataStorage from './dataStorage';
import firebaseDataStorage from './firebaseDataStorage';

class DataMigrationService {
  constructor() {
    this.migrationKey = 'dataMigratedToFirebase';
  }

  // 检查是否需要迁移
  needsMigration() {
    const migrated = localStorage.getItem(this.migrationKey);
    return !migrated;
  }

  // 执行迁移
  async migrateData() {
    try {
      console.log('🔄 开始数据迁移...');

      // 获取 localStorage 中的所有记录
      const localRecords = dataStorage.getAllRecords();

      if (localRecords.length === 0) {
        console.log('📭 没有需要迁移的数据');
        this.markMigrationComplete();
        return { success: true, migratedCount: 0 };
      }

      console.log(`📦 找到 ${localRecords.length} 条记录需要迁移`);

      let successCount = 0;
      let errorCount = 0;

      // 逐条迁移记录
      for (const record of localRecords) {
        try {
          const result = await firebaseDataStorage.addRecord(record);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error('迁移记录失败:', record, result.error);
          }
        } catch (error) {
          errorCount++;
          console.error('迁移记录异常:', record, error);
        }
      }

      console.log(`✅ 迁移完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);

      if (successCount > 0) {
        // 标记迁移完成
        this.markMigrationComplete();

        // 可选：清空 localStorage 数据
        // this.clearLocalStorage();
      }

      return {
        success: errorCount === 0,
        migratedCount: successCount,
        errorCount: errorCount,
      };
    } catch (error) {
      console.error('数据迁移失败:', error);
      return {
        success: false,
        error: error.message,
        migratedCount: 0,
        errorCount: 0,
      };
    }
  }

  // 标记迁移完成
  markMigrationComplete() {
    localStorage.setItem(this.migrationKey, 'true');
    console.log('🏁 数据迁移标记为完成');
  }

  // 清空 localStorage 数据（可选）
  clearLocalStorage() {
    try {
      localStorage.removeItem('carWashRecords');
      console.log('🗑️ localStorage 数据已清空');
    } catch (error) {
      console.error('清空 localStorage 失败:', error);
    }
  }

  // 重置迁移状态（用于测试）
  resetMigrationStatus() {
    localStorage.removeItem(this.migrationKey);
    console.log('🔄 迁移状态已重置');
  }
}

const dataMigration = new DataMigrationService();

export default dataMigration;
