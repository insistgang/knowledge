# -*- coding: utf-8 -*-
"""
测试脚本 - 验证各模块是否正常工作
"""
import asyncio
import sys

async def test_browser():
    """测试浏览器启动"""
    print("=" * 50)
    print("测试1: 浏览器启动")
    print("=" * 50)
    
    from playwright.async_api import async_playwright
    
    try:
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("✓ 浏览器启动成功")
        
        # 测试访问百度（国内可访问）
        print("  尝试访问 baidu.com...")
        await page.goto("https://www.baidu.com", timeout=15000)
        title = await page.title()
        print(f"  ✓ 页面标题: {title}")
        
        await browser.close()
        await pw.stop()
        print("✓ 浏览器关闭成功")
        return True
        
    except Exception as e:
        print(f"✗ 浏览器测试失败: {e}")
        return False


async def test_douyin_access():
    """测试抖音访问"""
    print()
    print("=" * 50)
    print("测试2: 抖音网页访问")
    print("=" * 50)
    
    from playwright.async_api import async_playwright
    
    try:
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True)
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        # 反检测
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        """)
        
        page = await context.new_page()
        
        print("  尝试访问 douyin.com...")
        response = await page.goto("https://www.douyin.com/", timeout=30000)
        
        print(f"  响应状态: {response.status}")
        
        # 等待一下
        await asyncio.sleep(2)
        
        # 检查页面内容
        content = await page.content()
        
        if '抖音' in content or 'douyin' in content.lower():
            print("  ✓ 抖音页面加载成功")
        else:
            print("  ? 页面内容不确定")
        
        # 检查是否有登录要求
        if '登录' in content:
            print("  ⚠ 页面包含登录提示（这是正常的）")
        
        await browser.close()
        await pw.stop()
        return True
        
    except Exception as e:
        print(f"✗ 抖音访问测试失败: {e}")
        return False


async def test_scraper_class():
    """测试Scraper类"""
    print()
    print("=" * 50)
    print("测试3: DouyinScraper类")
    print("=" * 50)
    
    from scraper import DouyinScraper
    
    scraper = DouyinScraper()
    
    try:
        print("  启动scraper...")
        await scraper.start()
        print("  ✓ scraper启动成功")
        
        print("  访问抖音首页...")
        await scraper.goto("https://www.douyin.com/")
        print("  ✓ 页面访问成功")
        
        print("  尝试获取视频...")
        videos = await scraper.get_page_videos()
        print(f"  获取到 {len(videos)} 个视频")
        
        await scraper.stop()
        print("  ✓ scraper关闭成功")
        return True
        
    except Exception as e:
        print(f"✗ Scraper测试失败: {e}")
        try:
            await scraper.stop()
        except:
            pass
        return False


async def main():
    """主测试"""
    print("""
╔══════════════════════════════════════════════════════╗
║              抖音爬虫 - 测试脚本                       ║
╚══════════════════════════════════════════════════════╝
    """)
    
    results = []
    
    # 测试1
    results.append(await test_browser())
    
    # 测试2
    results.append(await test_douyin_access())
    
    # 测试3
    results.append(await test_scraper_class())
    
    # 汇总
    print()
    print("=" * 50)
    print("测试结果汇总")
    print("=" * 50)
    
    tests = ["浏览器启动", "抖音访问", "Scraper类"]
    for name, passed in zip(tests, results):
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"  {name}: {status}")
    
    if all(results):
        print()
        print("全部测试通过! 可以运行 python main.py")
    else:
        print()
        print("部分测试失败，请检查错误信息")
    
    return all(results)


if __name__ == '__main__':
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
