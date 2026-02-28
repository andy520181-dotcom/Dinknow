#!/usr/bin/env python3
"""
从SVG数据生成tabBar PNG图标
基于用户提供的SVG图标设计
"""

from PIL import Image, ImageDraw
import math

# 图标配置
SIZE = 81
SCALE = SIZE / 81
# 增大图标内容尺寸的比例因子
CONTENT_SCALE = 1.15  # 增大15%使图标内容更明显
NORMAL_COLOR = (142, 142, 147)  # iOS灰色 #8E8E93
ACTIVE_COLOR = (0, 122, 255)    # iOS蓝色 #007AFF

def draw_circle_with_compass(draw, size, color, active=False):
    """绘制广场图标 - 圆圈带罗盘"""
    center = size // 2
    # 外圆 - 进一步增大半径使图标更大更明显
    radius = int(38 * SCALE * CONTENT_SCALE)
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 outline=color, width=int(4 * SCALE * CONTENT_SCALE))
    
    # 内部罗盘设计
    compass_size = int(15 * SCALE)
    # 绘制中心点 - 增大中心点
    dot_radius = int(7 * SCALE * CONTENT_SCALE)
    draw.ellipse([center - dot_radius, center - dot_radius, center + dot_radius, center + dot_radius],
                 fill=color if active else color, outline=color)
    
    # 绘制指针（简化的罗盘指针）
    # 上方指针 - 增大指针长度
    pointer_len = int(22 * SCALE * CONTENT_SCALE)
    draw.line([(center, center), (center, center - pointer_len)], fill=color, width=int(4 * SCALE * CONTENT_SCALE))
    # 绘制箭头 - 增大箭头
    arrow_size = int(7 * SCALE * CONTENT_SCALE)
    draw.polygon([
        (center, center - pointer_len),
        (center - arrow_size, center - pointer_len + arrow_size),
        (center + arrow_size, center - pointer_len + arrow_size)
    ], fill=color)

def draw_circle_with_plus(draw, size, color, active=False):
    """绘制发起活动图标 - 圆圈带加号"""
    center = size // 2
    # 外圆 - 进一步增大半径使图标更大更明显
    radius = int(38 * SCALE * CONTENT_SCALE)
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 outline=color, width=int(4 * SCALE * CONTENT_SCALE))
    
    # 加号 - 进一步增大加号尺寸
    line_len = int(28 * SCALE * CONTENT_SCALE)
    line_width = int(4 * SCALE * CONTENT_SCALE)
    # 水平线
    draw.line([(center - line_len, center), (center + line_len, center)], 
              fill=color, width=line_width)
    # 垂直线
    draw.line([(center, center - line_len), (center, center + line_len)], 
              fill=color, width=line_width)
    
    # 绘制圆形端点 - 增大端点
    cap_radius = int(2 * SCALE * CONTENT_SCALE)
    for x, y in [
        (center - line_len, center), (center + line_len, center),
        (center, center - line_len), (center, center + line_len)
    ]:
        draw.ellipse([x - cap_radius, y - cap_radius, x + cap_radius, y + cap_radius], fill=color)

def draw_profile_icon(draw, size, color, active=False):
    """绘制个人图标 - 头像和肩膀"""
    center_x = size // 2
    
    # 头部（圆圈） - 进一步增大头部
    head_y = int(22 * SCALE * CONTENT_SCALE)
    head_radius = int(15 * SCALE * CONTENT_SCALE)
    draw.ellipse([center_x - head_radius, head_y - head_radius,
                  center_x + head_radius, head_y + head_radius],
                 outline=color, width=int(4 * SCALE * CONTENT_SCALE))
    
    # 身体（半圆弧） - 进一步增大身体
    body_start_y = int(38 * SCALE * CONTENT_SCALE)
    arc_radius = int(28 * SCALE * CONTENT_SCALE)
    arc_top = body_start_y - int(4 * SCALE)
    
    # 使用多段线近似半圆弧
    points = []
    for angle in range(180, 361, 5):
        rad = math.radians(angle)
        x = center_x + arc_radius * math.cos(rad)
        y = arc_top + arc_radius + arc_radius * math.sin(rad)
        points.append((x, y))
    
    if len(points) > 1:
        for i in range(len(points) - 1):
            draw.line([points[i], points[i + 1]], fill=color, width=int(4 * SCALE * CONTENT_SCALE))

def generate_icon(filename, draw_func, is_active):
    """生成单个图标"""
    # 使用3倍尺寸渲染，然后缩小以获得更好的质量
    render_size = SIZE * 3
    img = Image.new('RGBA', (render_size, render_size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    color = ACTIVE_COLOR if is_active else NORMAL_COLOR
    draw_func(draw, render_size, color, is_active)
    
    # 缩小到目标尺寸（使用LANCZOS获得最佳质量）
    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    
    # 保存
    output_path = f'src/static/tabbar/{filename}'
    img.save(output_path, 'PNG')
    print(f'✅ Generated: {output_path}')

def main():
    print('🎨 Generating tabBar icons from SVG designs...')
    print()
    
    # 广场图标（罗盘）
    generate_icon('square.png', draw_circle_with_compass, False)
    generate_icon('square-active.png', draw_circle_with_compass, True)
    
    # 发起活动图标（加号）
    generate_icon('create.png', draw_circle_with_plus, False)
    generate_icon('create-active.png', draw_circle_with_plus, True)
    
    # 个人图标（人物）
    generate_icon('profile.png', draw_profile_icon, False)
    generate_icon('profile-active.png', draw_profile_icon, True)
    
    print()
    print('🎉 All icons generated successfully!')
    print(f'📁 Icons saved to: src/static/tabbar/')

if __name__ == '__main__':
    main()
