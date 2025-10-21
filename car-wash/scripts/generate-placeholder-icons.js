#!/usr/bin/env node

/**
 * 生成 PWA 占位符图标
 * 使用 Canvas 创建简单的占位符图标用于测试
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 生成 PWA 占位符图标...\n');

// 检查是否安装了 canvas 包
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.log('❌ 需要安装 canvas 包来生成 PNG 图标');
  console.log('\n运行以下命令安装：');
  console.log('   npm install canvas --save-dev\n');
  console.log('或者使用在线工具生成图标：');
  console.log('   https://progressier.com/pwa-icons-generator\n');
  process.exit(1);
}

const { createCanvas } = Canvas;

// 图标配置
const icons = [
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
];

const publicDir = path.join(__dirname, '..', 'public');

// 创建图标函数
function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景色（绿色主题）
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, size, size);

  // 绘制圆角矩形背景
  const radius = size * 0.15;
  ctx.fillStyle = '#16a34a';
  roundRect(ctx, 0, 0, size, size, radius);

  // 绘制汽车轮廓（简化版）
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.02;

  // 车身
  const carWidth = size * 0.7;
  const carHeight = size * 0.3;
  const carX = (size - carWidth) / 2;
  const carY = size * 0.45;

  ctx.fillRect(carX, carY, carWidth, carHeight);

  // 车顶
  ctx.beginPath();
  ctx.moveTo(carX + carWidth * 0.2, carY);
  ctx.lineTo(carX + carWidth * 0.35, carY - carHeight * 0.5);
  ctx.lineTo(carX + carWidth * 0.65, carY - carHeight * 0.5);
  ctx.lineTo(carX + carWidth * 0.8, carY);
  ctx.closePath();
  ctx.fill();

  // 车轮
  const wheelRadius = size * 0.08;
  const wheelY = carY + carHeight + wheelRadius * 0.3;

  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.arc(carX + carWidth * 0.25, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(carX + carWidth * 0.75, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  // 水滴（洗车主题）
  ctx.fillStyle = '#3b82f6';
  drawWaterDrop(ctx, carX - size * 0.1, carY - size * 0.15, size * 0.04);
  drawWaterDrop(ctx, carX + carWidth + size * 0.06, carY - size * 0.1, size * 0.04);
  drawWaterDrop(ctx, carX + carWidth / 2, carY - size * 0.2, size * 0.05);

  // 保存文件
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(publicDir, filename);
  fs.writeFileSync(filepath, buffer);

  console.log(`✅ 生成 ${filename} (${size}x${size})`);
}

// 绘制圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// 绘制水滴
function drawWaterDrop(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - size, y - size * 1.5, x, y - size * 2);
  ctx.quadraticCurveTo(x + size, y - size * 1.5, x, y);
  ctx.closePath();
  ctx.fill();
}

// 生成所有图标
try {
  icons.forEach(({ size, filename }) => {
    generateIcon(size, filename);
  });

  console.log('\n✨ 所有图标生成完成！');
  console.log('\n📍 图标位置: public/');
  console.log('   - icon-192.png');
  console.log('   - icon-512.png');
  console.log('   - apple-touch-icon.png');
  console.log('\n💡 提示: 这些是占位符图标，建议使用专业设计的图标替换');
  console.log('   参考: public/ICON-GENERATION-GUIDE.md\n');
} catch (error) {
  console.error('❌ 生成图标时出错:', error.message);
  process.exit(1);
}
