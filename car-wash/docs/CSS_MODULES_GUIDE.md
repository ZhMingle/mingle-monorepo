# 🎨 CSS模块化指南

## ✅ 已完成的重构

### 1. CSS模块化转换
- **旧方式**: `import './CarWashPage.css'`
- **新方式**: `import styles from './CarWashPage.module.css'`

### 2. 类名转换
- **旧方式**: `className="car-wash-container"`
- **新方式**: `className={styles.container}`

### 3. 文件结构
```
src/pages/carwash/
├── CarWashPage.jsx
├── CarWashPage.module.css  ✅ 新的模块化CSS
└── CarWashPage.css         ❌ 已删除
```

## 🔧 CSS模块化的优势

### 1. 避免样式冲突
- **作用域隔离**: 每个模块的CSS都有独立的作用域
- **类名唯一性**: 自动生成唯一的类名
- **全局污染**: 不会影响其他组件的样式

### 2. 更好的维护性
- **组件化**: CSS与组件紧密关联
- **可读性**: 类名更加语义化
- **重构安全**: 修改不会影响其他组件

### 3. 开发体验
- **智能提示**: IDE提供类名自动补全
- **类型安全**: TypeScript支持
- **热重载**: 样式修改实时生效

## 📝 使用示例

### 基本用法
```jsx
import styles from './CarWashPage.module.css';

function CarWashPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>标题</h1>
      <button className={styles.captureBtn}>按钮</button>
    </div>
  );
}
```

### 多个类名
```jsx
// 方式1: 模板字符串
<div className={`${styles.serviceItem} ${styles.notesItem}`}>

// 方式2: 数组join
<div className={[styles.serviceItem, styles.notesItem].join(' ')}>

// 方式3: 条件类名
<button className={`${styles.btn} ${isActive ? styles.active : ''}`}>
```

### 动态类名
```jsx
const [isSelected, setIsSelected] = useState(false);

<div className={`${styles.option} ${isSelected ? styles.selected : ''}`}>
```

## 🎯 最佳实践

### 1. 命名规范
- **组件名**: `CarWashPage.module.css`
- **类名**: 使用camelCase，如 `cameraSection`
- **语义化**: 类名要有明确含义

### 2. 样式组织
```css
/* 容器样式 */
.container { }

/* 组件样式 */
.cameraSection { }
.cameraControls { }
.cameraButtons { }

/* 状态样式 */
.selected { }
.disabled { }
.loading { }
```

### 3. 响应式设计
```css
/* 移动端优化 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}
```

## 🔍 调试技巧

### 1. 查看生成的类名
在浏览器开发者工具中，你会看到类似这样的类名：
```html
<div class="CarWashPage_container__abc123">
```

### 2. 样式覆盖
如果需要覆盖模块化样式，可以使用：
```css
/* 全局样式文件 */
:global(.CarWashPage_container__abc123) {
  /* 覆盖样式 */
}
```

### 3. 调试工具
- **React DevTools**: 查看组件结构
- **浏览器DevTools**: 查看生成的CSS
- **Vite HMR**: 热重载支持

## 🚀 迁移指南

### 从传统CSS迁移
1. **重命名文件**: `Component.css` → `Component.module.css`
2. **更新导入**: `import './Component.css'` → `import styles from './Component.module.css'`
3. **更新类名**: `className="class-name"` → `className={styles.className}`
4. **测试功能**: 确保所有样式正常工作

### 常见问题
1. **类名冲突**: 使用CSS模块化自动解决
2. **全局样式**: 使用`:global()`包装
3. **第三方库**: 继续使用传统方式

## 📚 相关资源

- [CSS Modules官方文档](https://github.com/css-modules/css-modules)
- [Vite CSS模块支持](https://vitejs.dev/guide/features.html#css-modules)
- [React CSS模块化最佳实践](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/)

---

**总结**: CSS模块化提供了更好的样式隔离和组件化开发体验，是现代React应用的最佳实践。
