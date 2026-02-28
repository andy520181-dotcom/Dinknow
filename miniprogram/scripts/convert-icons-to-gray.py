#!/usr/bin/env python3
"""
将普通状态的图标转换为灰色
确保未选中状态显示为灰色
"""

from PIL import Image
import os
from pathlib import Path

# 图标文件列表（普通状态，需要转换为灰色）
NORMAL_ICONS = [
    'square.png',
    'create.png',
    'profile.png'
]

# iOS灰色 #8E8E93 (RGB: 142, 142, 147)
GRAY_COLOR = (142, 142, 147)

TABBAR_DIR = Path(__file__).parent.parent / 'src' / 'static' / 'tabbar'

def convert_to_grayscale_with_color(img_path, target_color):
    """将图片转换为灰度，然后应用目标颜色"""
    try:
        # 打开图片
        img = Image.open(img_path)
        
        # 转换为RGBA模式
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 转换为灰度
        gray = img.convert('L')
        
        # 创建新的RGBA图片
        result = Image.new('RGBA', img.size)
        
        # 获取像素数据
        pixels = img.load()
        gray_pixels = gray.load()
        result_pixels = result.load()
        
        # 遍历每个像素
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, a = pixels[x, y]
                gray_value = gray_pixels[x, y]
                
                # 如果原像素是透明的，保持透明
                if a == 0:
                    result_pixels[x, y] = (0, 0, 0, 0)
                else:
                    # 根据灰度值应用目标颜色
                    # 使用灰度值作为alpha混合因子
                    factor = gray_value / 255.0
                    new_r = int(target_color[0] * factor)
                    new_g = int(target_color[1] * factor)
                    new_b = int(target_color[2] * factor)
                    result_pixels[x, y] = (new_r, new_g, new_b, a)
        
        return result
    except Exception as e:
        print(f'❌ 处理 {img_path.name} 失败: {e}')
        return None

def convert_icon_to_gray(icon_name):
    """转换单个图标为灰色"""
    icon_path = TABBAR_DIR / icon_name
    
    if not icon_path.exists():
        print(f'⚠️  文件不存在: {icon_name}')
        return False
    
    try:
        # 转换为灰色
        gray_img = convert_to_grayscale_with_color(icon_path, GRAY_COLOR)
        
        if gray_img:
            # 保存（覆盖原文件）
            gray_img.save(icon_path, 'PNG', optimize=True)
            print(f'✅ 已转换: {icon_name} -> 灰色 (#8E8E93)')
            return True
        return False
    except Exception as e:
        print(f'❌ 转换 {icon_name} 失败: {e}')
        return False

def main():
    print('🔄 开始将普通状态图标转换为灰色...')
    print(f'📁 图标目录: {TABBAR_DIR}')
    print(f'🎨 目标颜色: #8E8E93 (iOS灰色)')
    print()
    
    success_count = 0
    
    for icon_name in NORMAL_ICONS:
        if convert_icon_to_gray(icon_name):
            success_count += 1
    
    print()
    print(f'✅ 成功转换 {success_count}/{len(NORMAL_ICONS)} 个图标')
    print()
    print('🎉 转换完成！')
    print('📝 普通状态图标现在应该是灰色的了')
    print('💡 请重新构建项目查看效果')

if __name__ == '__main__':
    main()
