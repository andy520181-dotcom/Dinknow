#!/usr/bin/env python3
"""
生成高质量iOS风格的tabBar图标（PNG格式，81x81px）
使用3x分辨率渲染，然后缩放以获得更好的抗锯齿效果
"""

from PIL import Image, ImageDraw
import os
from pathlib import Path

# 图标目录
ICON_DIR = Path(__file__).parent.parent / "src" / "static" / "tabbar"
ICON_DIR.mkdir(parents=True, exist_ok=True)

# iOS颜色
IOS_BLUE = "#007AFF"
IOS_GRAY = "#8E8E93"
WHITE = "#FFFFFF"
TRANSPARENT = (0, 0, 0, 0)

# 渲染尺寸（3x分辨率，提高质量）
RENDER_SIZE = 243  # 81 * 3
FINAL_SIZE = 81

def create_icon(name, draw_func_normal, draw_func_active):
    """创建高质量图标（普通和选中状态）"""
    # 使用3x分辨率渲染
    render_size = RENDER_SIZE
    
    # 普通状态（灰色线条）
    img_normal = Image.new('RGBA', (render_size, render_size), TRANSPARENT)
    draw_normal = ImageDraw.Draw(img_normal)
    draw_func_normal(draw_normal, render_size, IOS_GRAY)
    # 高质量缩放到最终尺寸
    img_normal = img_normal.resize((FINAL_SIZE, FINAL_SIZE), Image.LANCZOS)
    img_normal.save(ICON_DIR / f"{name}.png", "PNG", optimize=True)
    print(f"✅ 生成: {name}.png")
    
    # 选中状态（蓝色填充）
    img_active = Image.new('RGBA', (render_size, render_size), TRANSPARENT)
    draw_active = ImageDraw.Draw(img_active)
    draw_func_active(draw_active, render_size, IOS_BLUE)
    # 高质量缩放到最终尺寸
    img_active = img_active.resize((FINAL_SIZE, FINAL_SIZE), Image.LANCZOS)
    img_active.save(ICON_DIR / f"{name}-active.png", "PNG", optimize=True)
    print(f"✅ 生成: {name}-active.png")

def draw_square_normal(draw, size, color):
    """绘制广场图标（普通状态）- 指南针造型"""
    scale = size / 81
    center = size // 2
    radius = int(22 * scale)
    line_width = int(4.5 * scale)
    
    # 绘制圆形外框
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 outline=color, width=line_width)
    
    # 绘制指南针指针（菱形）
    pointer_len = int(14 * scale)
    points = [
        (center, center - pointer_len),  # 上
        (center + int(5 * scale), center),  # 右
        (center, center + pointer_len),  # 下
        (center - int(5 * scale), center),  # 左
    ]
    
    # 绘制指针轮廓
    for i in range(4):
        draw.line([points[i], points[(i + 1) % 4]], fill=color, width=line_width)
    
    # 绘制中心点
    center_radius = int(3 * scale)
    draw.ellipse([center - center_radius, center - center_radius, 
                  center + center_radius, center + center_radius], fill=color)

def draw_square_active(draw, size, color):
    """绘制广场图标（选中状态）- 填充指南针"""
    scale = size / 81
    center = size // 2
    radius = int(22 * scale)
    
    # 绘制填充圆形
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 fill=color)
    
    # 绘制白色指针
    pointer_len = int(14 * scale)
    points = [
        (center, center - pointer_len),  # 上
        (center + int(5 * scale), center),  # 右
        (center, center + pointer_len),  # 下
        (center - int(5 * scale), center),  # 左
    ]
    
    # 填充上半部分（白色）
    draw.polygon([points[0], points[1], (center, center)], fill=WHITE)
    draw.polygon([points[0], points[3], (center, center)], fill=WHITE)

def draw_create_normal(draw, size, color):
    """绘制创建图标（普通状态）- 精美圆圈加号"""
    scale = size / 81
    center = size // 2
    radius = int(20 * scale)
    line_width = int(4.5 * scale)  # 加粗线条
    line_len = int(14 * scale)  # 加长线条
    cap_width = int(8 * scale)  # 端点加粗
    
    # 绘制圆圈
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 outline=color, width=line_width)
    
    # 绘制加号（带圆角端点效果）
    # 横线
    draw.line([(center - line_len, center), (center + line_len, center)], 
              fill=color, width=line_width)
    # 横线端点（圆形）
    draw.ellipse([center - line_len - cap_width//2, center - cap_width//2,
                  center - line_len + cap_width//2, center + cap_width//2], fill=color)
    draw.ellipse([center + line_len - cap_width//2, center - cap_width//2,
                  center + line_len + cap_width//2, center + cap_width//2], fill=color)
    
    # 竖线
    draw.line([(center, center - line_len), (center, center + line_len)], 
              fill=color, width=line_width)
    # 竖线端点（圆形）
    draw.ellipse([center - cap_width//2, center - line_len - cap_width//2,
                  center + cap_width//2, center - line_len + cap_width//2], fill=color)
    draw.ellipse([center - cap_width//2, center + line_len - cap_width//2,
                  center + cap_width//2, center + line_len + cap_width//2], fill=color)

def draw_create_active(draw, size, color):
    """绘制创建图标（选中状态）- 精美填充圆圈加号"""
    scale = size / 81
    center = size // 2
    radius = int(22 * scale)  # 略微增大
    line_width = int(5 * scale)  # 加粗白色线条
    line_len = int(14 * scale)
    cap_width = int(9 * scale)
    
    # 绘制填充圆圈
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 fill=color)
    
    # 绘制白色加号（带圆角端点）
    # 横线
    draw.line([(center - line_len, center), (center + line_len, center)], 
              fill=WHITE, width=line_width)
    # 横线端点
    draw.ellipse([center - line_len - cap_width//2, center - cap_width//2,
                  center - line_len + cap_width//2, center + cap_width//2], fill=WHITE)
    draw.ellipse([center + line_len - cap_width//2, center - cap_width//2,
                  center + line_len + cap_width//2, center + cap_width//2], fill=WHITE)
    
    # 竖线
    draw.line([(center, center - line_len), (center, center + line_len)], 
              fill=WHITE, width=line_width)
    # 竖线端点
    draw.ellipse([center - cap_width//2, center - line_len - cap_width//2,
                  center + cap_width//2, center - line_len + cap_width//2], fill=WHITE)
    draw.ellipse([center - cap_width//2, center + line_len - cap_width//2,
                  center + cap_width//2, center + line_len + cap_width//2], fill=WHITE)

def draw_profile_normal(draw, size, color):
    """绘制个人图标（普通状态）- 简洁人物轮廓"""
    scale = size / 81
    center_x = size // 2
    head_y = int(24 * scale)
    head_radius = int(12 * scale)
    body_width = int(24 * scale)
    body_start_y = int(38 * scale)
    body_end_y = int(60 * scale)
    line_width = int(4.5 * scale)
    
    # 绘制头部（圆圈）
    draw.ellipse([center_x - head_radius, head_y - head_radius, 
                  center_x + head_radius, head_y + head_radius], 
                 outline=color, width=line_width)
    
    # 绘制身体（半圆弧）
    arc_radius = int(24 * scale)
    arc_top = body_start_y - int(6 * scale)
    draw.arc([center_x - arc_radius, arc_top, 
              center_x + arc_radius, arc_top + arc_radius * 2], 
             start=0, end=180, fill=color, width=line_width)

def draw_profile_active(draw, size, color):
    """绘制个人图标（选中状态）- 简洁填充人物"""
    scale = size / 81
    center_x = size // 2
    head_y = int(24 * scale)
    head_radius = int(12 * scale)
    body_start_y = int(38 * scale)
    
    # 绘制头部（填充圆圈）
    draw.ellipse([center_x - head_radius, head_y - head_radius, 
                  center_x + head_radius, head_y + head_radius], 
                 fill=color)
    
    # 绘制身体（填充半圆）
    arc_radius = int(24 * scale)
    arc_top = body_start_y - int(6 * scale)
    draw.ellipse([center_x - arc_radius, arc_top, 
                  center_x + arc_radius, arc_top + arc_radius * 2], 
                 fill=color)

def main():
    """主函数"""
    print("开始生成高质量iOS风格tabBar图标...\n")
    print(f"渲染尺寸: {RENDER_SIZE}x{RENDER_SIZE}px (3x)")
    print(f"最终尺寸: {FINAL_SIZE}x{FINAL_SIZE}px\n")
    
    # 生成图标
    create_icon("square", draw_square_normal, draw_square_active)
    create_icon("create", draw_create_normal, draw_create_active)
    create_icon("profile", draw_profile_normal, draw_profile_active)
    
    print("\n✅ 所有高质量图标生成完成！")
    print(f"图标位置: {ICON_DIR}")
    print("提示: 使用3x分辨率渲染并缩放，获得更好的抗锯齿效果")

if __name__ == "__main__":
    main()
