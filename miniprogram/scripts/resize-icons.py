#!/usr/bin/env python3
"""
调整PNG图标到81x81像素
"""

from PIL import Image
import os
from pathlib import Path

# 图标映射：源文件 -> 目标文件名
ICON_MAPPING = {
    'guangchang-a2ab4ad3-9271-42f6-94d5-1d33e5fd3f20.png': 'square.png',
    'guangchang-2-c8ad4837-bc4f-47f5-984a-19be7225bb51.png': 'square-active.png',
    'faqihuodong_-76bd4d04-88d7-4095-9c0f-1f50109f7214.png': 'create.png',
    'faqihuodong_-2-18ec0d19-425b-49b0-8fe2-dffc4504ee2c.png': 'create-active.png',
    'my-81a23bec-5dc9-4835-8972-c7ca4eb2100a.png': 'profile.png',
    'my-2-e45bdb5b-d334-41da-b7de-4b98167b8e61.png': 'profile-active.png',
}

TARGET_SIZE = 81
ASSETS_DIR = Path('/Users/andy/.cursor/projects/Users-andy-Desktop-Dinknow-miniprogram/assets')
TABBAR_DIR = Path(__file__).parent.parent / 'src' / 'static' / 'tabbar'

def resize_and_save(source_path, target_path, size=TARGET_SIZE):
    """调整图片大小并保存"""
    try:
        # 打开图片
        img = Image.open(source_path)
        
        # 转换为RGBA模式（支持透明背景）
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 使用LANCZOS高质量缩放
        img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # 保存
        img_resized.save(target_path, 'PNG', optimize=True)
        print(f'✅ {source_path.name} -> {target_path.name} ({size}x{size})')
        return True
    except Exception as e:
        print(f'❌ 处理 {source_path.name} 失败: {e}')
        return False

def main():
    print('🔄 开始处理图标文件...')
    print(f'📁 源文件目录: {ASSETS_DIR}')
    print(f'📁 目标目录: {TABBAR_DIR}')
    print()
    
    # 确保目标目录存在
    TABBAR_DIR.mkdir(parents=True, exist_ok=True)
    
    success_count = 0
    
    # 处理每个图标
    for source_name, target_name in ICON_MAPPING.items():
        source_path = ASSETS_DIR / source_name
        target_path = TABBAR_DIR / target_name
        
        if not source_path.exists():
            print(f'⚠️  源文件不存在: {source_name}')
            continue
        
        if resize_and_save(source_path, target_path):
            success_count += 1
    
    print()
    print(f'✅ 成功处理 {success_count}/{len(ICON_MAPPING)} 个图标')
    print(f'📁 图标已保存到: {TABBAR_DIR}')
    
    # 删除旧文件
    print()
    print('🗑️  删除旧版本文件...')
    
    old_files = [
        'square.svg',
        'square-active.svg',
        'create.svg',
        'create-active.svg',
        'profile.svg',
        'profile-active.svg',
    ]
    
    deleted_count = 0
    for old_file in old_files:
        old_path = TABBAR_DIR / old_file
        if old_path.exists():
            old_path.unlink()
            print(f'✅ 已删除: {old_file}')
            deleted_count += 1
    
    print(f'✅ 已删除 {deleted_count} 个旧SVG文件')
    print()
    print('🎉 图标处理完成！')

if __name__ == '__main__':
    main()
