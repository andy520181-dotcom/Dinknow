#!/usr/bin/env python3
"""
将SVG图标转换为PNG格式
用于微信小程序tabBar图标
"""

import os
import sys
from pathlib import Path

try:
    import cairosvg
    use_cairosvg = True
except ImportError:
    use_cairosvg = False
    print("cairosvg not found, trying alternative method...")

def convert_svg_to_png_cairosvg(svg_path, png_path, size=81):
    """使用cairosvg转换SVG到PNG"""
    cairosvg.svg2png(
        url=svg_path,
        write_to=png_path,
        output_width=size,
        output_height=size
    )
    print(f"✅ Converted: {svg_path} -> {png_path}")

def convert_svg_to_png_alternative(svg_path, png_path, size=81):
    """使用其他方法转换SVG到PNG（如果cairosvg不可用）"""
    try:
        from PIL import Image
        import subprocess
        
        # 尝试使用 rsvg-convert (librsvg)
        result = subprocess.run([
            'rsvg-convert',
            '-w', str(size),
            '-h', str(size),
            '-f', 'png',
            '-o', png_path,
            svg_path
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Converted: {svg_path} -> {png_path}")
            return
        
        raise Exception("rsvg-convert failed")
        
    except Exception as e:
        print(f"❌ Failed to convert {svg_path}: {e}")
        print("Please install cairosvg: pip3 install cairosvg")
        print("Or install librsvg: brew install librsvg (macOS)")

def main():
    # 获取项目根目录
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    tabbar_dir = project_root / 'src' / 'static' / 'tabbar'
    
    if not tabbar_dir.exists():
        print(f"❌ Error: {tabbar_dir} does not exist")
        sys.exit(1)
    
    # SVG文件列表
    svg_files = [
        'square.svg',
        'square-active.svg',
        'create.svg',
        'create-active.svg',
        'profile.svg',
        'profile-active.svg'
    ]
    
    print("🔄 Converting SVG icons to PNG...")
    print(f"📁 Working directory: {tabbar_dir}")
    print()
    
    success_count = 0
    fail_count = 0
    
    for svg_file in svg_files:
        svg_path = str(tabbar_dir / svg_file)
        png_file = svg_file.replace('.svg', '.png')
        png_path = str(tabbar_dir / png_file)
        
        if not Path(svg_path).exists():
            print(f"⚠️  Warning: {svg_file} not found, skipping...")
            continue
        
        try:
            if use_cairosvg:
                convert_svg_to_png_cairosvg(svg_path, png_path, size=81)
            else:
                convert_svg_to_png_alternative(svg_path, png_path, size=81)
            success_count += 1
        except Exception as e:
            print(f"❌ Failed to convert {svg_file}: {e}")
            fail_count += 1
    
    print()
    print(f"✅ Successfully converted: {success_count} files")
    if fail_count > 0:
        print(f"❌ Failed to convert: {fail_count} files")
    
    print()
    print("🎉 Conversion complete!")
    print(f"📁 PNG files saved to: {tabbar_dir}")

if __name__ == '__main__':
    main()
