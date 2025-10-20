import React, { useEffect, useState } from 'react';
import dataStorage from '../services/dataStorageAdapter';

const DataInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🚀 初始化数据存储...');

        // 初始化数据存储适配器
        const result = await dataStorage.initialize();

        if (result.migratedCount > 0) {
          setMigrationStatus({
            success: result.success,
            count: result.migratedCount,
            errorCount: result.errorCount || 0,
          });

          console.log(`✅ 数据初始化完成: 迁移 ${result.migratedCount} 条记录`);
        } else {
          console.log('✅ 数据初始化完成: 无需迁移');
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('❌ 数据初始化失败:', error);
        setIsInitialized(true); // 即使失败也继续，使用 localStorage
      }
    };

    initializeData();
  }, []);

  // 显示迁移状态（可选）
  if (migrationStatus && migrationStatus.count > 0) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: migrationStatus.success ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '14px',
          zIndex: 9999,
        }}
      >
        {migrationStatus.success
          ? `✅ 已迁移 ${migrationStatus.count} 条记录到云端`
          : `⚠️ 迁移失败，${migrationStatus.errorCount} 条记录未迁移`}
      </div>
    );
  }

  // 渲染子组件
  return children;
};

export default DataInitializer;
