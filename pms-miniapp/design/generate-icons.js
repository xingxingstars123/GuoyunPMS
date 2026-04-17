const fs = require('fs');
const path = require('path');

// SVG图标定义
const icons = {
  home: {
    inactive: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20L24 8L40 20V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V20Z" stroke="#7A7E83" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 40V24H30V40" stroke="#7A7E83" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    active: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20L24 8L40 20V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V20Z" stroke="#4A90E2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 40V24H30V40" stroke="#4A90E2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  message: {
    inactive: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 24C40 32.8366 32.8366 40 24 40C21.5 40 19.1667 39.5 17 38.6667L8 40L9.33333 31C8.5 28.8333 8 26.5 8 24C8 15.1634 15.1634 8 24 8C32.8366 8 40 15.1634 40 24Z" stroke="#7A7E83" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    active: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 24C40 32.8366 32.8366 40 24 40C21.5 40 19.1667 39.5 17 38.6667L8 40L9.33333 31C8.5 28.8333 8 26.5 8 24C8 15.1634 15.1634 8 24 8C32.8366 8 40 15.1634 40 24Z" stroke="#4A90E2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  calendar: {
    inactive: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="32" height="30" rx="2" stroke="#7A7E83" stroke-width="2.5"/>
      <line x1="8" y1="17" x2="40" y2="17" stroke="#7A7E83" stroke-width="2.5"/>
      <line x1="15" y1="10" x2="15" y2="17" stroke="#7A7E83" stroke-width="2.5"/>
      <line x1="22" y1="10" x2="22" y2="17" stroke="#7A7E83" stroke-width="2.5"/>
      <line x1="29" y1="10" x2="29" y2="17" stroke="#7A7E83" stroke-width="2.5"/>
      <line x1="36" y1="10" x2="36" y2="17" stroke="#7A7E83" stroke-width="2.5"/>
      <circle cx="15" cy="25" r="1.5" fill="#7A7E83"/>
      <circle cx="22" cy="25" r="1.5" fill="#7A7E83"/>
      <circle cx="29" cy="25" r="1.5" fill="#7A7E83"/>
      <circle cx="36" cy="25" r="1.5" fill="#7A7E83"/>
      <circle cx="15" cy="32" r="1.5" fill="#7A7E83"/>
      <circle cx="22" cy="32" r="1.5" fill="#7A7E83"/>
    </svg>`,
    active: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="32" height="30" rx="2" stroke="#4A90E2" stroke-width="2.5"/>
      <line x1="8" y1="17" x2="40" y2="17" stroke="#4A90E2" stroke-width="2.5"/>
      <line x1="15" y1="10" x2="15" y2="17" stroke="#4A90E2" stroke-width="2.5"/>
      <line x1="22" y1="10" x2="22" y2="17" stroke="#4A90E2" stroke-width="2.5"/>
      <line x1="29" y1="10" x2="29" y2="17" stroke="#4A90E2" stroke-width="2.5"/>
      <line x1="36" y1="10" x2="36" y2="17" stroke="#4A90E2" stroke-width="2.5"/>
      <circle cx="15" cy="25" r="1.5" fill="#4A90E2"/>
      <circle cx="22" cy="25" r="1.5" fill="#4A90E2"/>
      <circle cx="29" cy="25" r="1.5" fill="#4A90E2"/>
      <circle cx="36" cy="25" r="1.5" fill="#4A90E2"/>
      <circle cx="15" cy="32" r="1.5" fill="#4A90E2"/>
      <circle cx="22" cy="32" r="1.5" fill="#4A90E2"/>
    </svg>`
  },
  finance: {
    inactive: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="28" width="8" height="12" rx="1" stroke="#7A7E83" stroke-width="2.5"/>
      <rect x="20" y="18" width="8" height="22" rx="1" stroke="#7A7E83" stroke-width="2.5"/>
      <rect x="30" y="8" width="8" height="32" rx="1" stroke="#7A7E83" stroke-width="2.5"/>
    </svg>`,
    active: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="28" width="8" height="12" rx="1" stroke="#4A90E2" stroke-width="2.5"/>
      <rect x="20" y="18" width="8" height="22" rx="1" stroke="#4A90E2" stroke-width="2.5"/>
      <rect x="30" y="8" width="8" height="32" rx="1" stroke="#4A90E2" stroke-width="2.5"/>
    </svg>`
  },
  mine: {
    inactive: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="16" r="8" stroke="#7A7E83" stroke-width="2.5"/>
      <path d="M8 40C8 31.1634 15.1634 24 24 24C32.8366 24 40 31.1634 40 40" stroke="#7A7E83" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    active: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="16" r="8" stroke="#4A90E2" stroke-width="2.5"/>
      <path d="M8 40C8 31.1634 15.1634 24 24 24C32.8366 24 40 31.1634 40 40" stroke="#4A90E2" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  }
};

// 创建输出目录
const outputDir = path.join(__dirname, '..', 'static', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 保存SVG文件
Object.keys(icons).forEach(name => {
  const inactiveFile = path.join(outputDir, `${name}.svg`);
  const activeFile = path.join(outputDir, `${name}-active.svg`);
  
  fs.writeFileSync(inactiveFile, icons[name].inactive);
  fs.writeFileSync(activeFile, icons[name].active);
  
  console.log(`✅ Generated ${name}.svg and ${name}-active.svg`);
});

console.log('\n🎉 All SVG icons generated successfully!');
console.log(`📁 Output directory: ${outputDir}`);
console.log('\n📝 Next steps:');
console.log('1. Use browser tool to convert SVG to PNG (81x81px for tabBar icons)');
console.log('2. Or use online tool: https://svgtopng.com/');
console.log('3. Replace the PNG files in static/images/');
