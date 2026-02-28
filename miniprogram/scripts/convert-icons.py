#!/usr/bin/env python3
"""
将SVG图标转换为PNG格式（81x81px）
用于微信小程序tabBar图标
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
    import cairosvg
except ImportError:
    print("需要安装依赖: pip install Pillow cairosvg")
    sys.exit(1)

# 图标目录
ICON_DIR = Path(__file__).parent.parent / "src" / "static" / "tabbar"

def convert_svg_to_png(svg_path, png_path, size=81):
    """将SVG转换为PNG"""
    try:
        # 使用cairosvg转换为PNG
        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            output_width=size,
            output_height=size
        )
        print(f"✅ 转换成功: {svg_path.name} -> {png_path.name}")
        return True
    except Exception as e:
        print(f"❌ 转换失败 {svg_path.name}: {e}")
        return False

def main():
    """主函数"""
    if not ICON_DIR.exists():
        print(f"❌ 图标目录不存在: {ICON_DIR}")
        return
    
    svg_files = list(ICON_DIR.glob("*.svg"))
    if not svg_files:
        print("❌ 未找到SVG文件")
        return
    
    print(f"找到 {len(svg_files)} 个SVG文件，开始转换...\n")
    
    success_count = 0
    for svg_file in svg_files:
        png_file = svg_file.with_suffix('.png')
        if convert_svg_to_png(svg_file, png_file):
            success_count += 1
    
    print(f"\n✅ 转换完成: {success_count}/{len(svg_files)}")

if __name__ == "__main__":
    main()
