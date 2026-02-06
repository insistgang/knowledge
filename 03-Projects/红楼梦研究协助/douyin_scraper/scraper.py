# -*- coding: utf-8 -*-
import os
import json
import asyncio
import re
from urllib.parse import unquote
from datetime import datetime
from playwright.async_api import async_playwright, Response
from loguru import logger

from config import DATA_DIR, COOKIES_FILE, HONGXUE_KEYWORDS, USE_LOCAL_CHROME


# 最新的 Chrome User Agent (模拟真实浏览器)
LATEST_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'


class DouyinScraper:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.api_data = []
        self._is_closed = False

    async def start(self, headless=False):
        """启动浏览器，带完整反检测措施"""
        logger.info("启动浏览器...")
        self.playwright = await async_playwright().start()

        # 浏览器启动参数
        launch_args = [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--start-maximized',
        ]

        if USE_LOCAL_CHROME:
            # 使用本地安装的 Chrome 浏览器
            logger.info("使用本地 Chrome 浏览器")
            self.browser = await self.playwright.chromium.launch(
                channel="chrome",  # 使用系统 Chrome
                headless=headless,
                args=launch_args,
            )
        else:
            # 使用 Playwright 自带的 Chromium
            logger.info("使用 Playwright 内置浏览器")
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=launch_args + [
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                ],
            )

        # 创建浏览器上下文
        self.context = await self.browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent=LATEST_USER_AGENT,
            locale='zh-CN',
            timezone_id='Asia/Shanghai',
            # 设置权限
            permissions=['geolocation'],
        )

        # 注入反检测脚本
        await self._inject_anti_detection()

        self.page = await self.context.new_page()

        # 监听响应和页面关闭事件
        self.page.on('response', self._on_response)
        self.page.on('close', lambda: setattr(self, '_is_closed', True))

        # 尝试加载 Cookie
        loaded = await self._load_cookies()
        if loaded:
            logger.info("已加载保存的登录状态")

        self._is_closed = False
        logger.info("浏览器启动完成")

    async def _inject_anti_detection(self):
        """注入反自动化检测脚本（本地Chrome需要较少的伪装）"""
        anti_detect_script = """
        // 隐藏 webdriver 属性
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

        // 移除自动化相关属性
        delete navigator.__proto__.webdriver;
        """
        await self.context.add_init_script(anti_detect_script)

    def _check_browser(self):
        """检查浏览器是否仍然可用"""
        if self._is_closed or not self.page or self.page.is_closed():
            raise RuntimeError("浏览器已关闭，请重新启动程序")

    async def _on_response(self, response: Response):
        """监听 API 响应，提取视频数据"""
        url = response.url
        # 用户主页视频列表 API
        if 'aweme/v1/web/aweme/post' in url or '/aweme/post' in url:
            try:
                data = await response.json()
                if 'aweme_list' in data:
                    count = len(data['aweme_list'])
                    self.api_data.extend(data['aweme_list'])
                    logger.info(f"[API] 用户主页 - 拦截到 {count} 条视频")
            except Exception as e:
                logger.debug(f"解析 aweme/post 响应失败: {e}")
        # 搜索视频 API
        elif 'aweme/v1/web/search' in url or '/search/item/' in url:
            try:
                data = await response.json()
                items = data.get('data', [])
                count = 0
                for item in items:
                    if 'aweme_info' in item:
                        self.api_data.append(item['aweme_info'])
                        count += 1
                if count > 0:
                    logger.info(f"[API] 搜索结果 - 拦截到 {count} 条视频")
            except Exception as e:
                logger.debug(f"解析 search 响应失败: {e}")

    async def stop(self):
        """停止浏览器并保存状态"""
        try:
            if self.context:
                await self._save_cookies()
        except Exception as e:
            logger.debug(f"保存 cookies 时出错: {e}")
        try:
            if self.browser:
                await self.browser.close()
        except:
            pass
        try:
            if self.playwright:
                await self.playwright.stop()
        except:
            pass

    async def _load_cookies(self):
        """加载保存的 Cookie"""
        if not os.path.exists(COOKIES_FILE):
            return False

        try:
            with open(COOKIES_FILE, 'r', encoding='utf-8') as f:
                cookies = json.load(f)

            if cookies:
                # 过滤掉过期和无效的 cookie
                now = datetime.now().timestamp()
                valid_cookies = [
                    c for c in cookies
                    if not c.get('expires') or c.get('expires', now + 1) > now
                ]
                await self.context.add_cookies(valid_cookies)
                logger.info(f"加载了 {len(valid_cookies)} 个 cookies")
                return True
        except Exception as e:
            logger.warning(f"加载 cookies 失败: {e}")

        return False

    async def _save_cookies(self):
        """保存 Cookie 到文件"""
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            cookies = await self.context.cookies()

            with open(COOKIES_FILE, 'w', encoding='utf-8') as f:
                json.dump(cookies, f, ensure_ascii=False, indent=2)

            logger.info(f"保存了 {len(cookies)} 个 cookies")
        except Exception as e:
            logger.warning(f"保存 cookies 失败: {e}")

    async def goto(self, url, wait=3):
        """导航到指定 URL"""
        self._check_browser()
        logger.info(f"导航到: {url}")
        await self.page.goto(url, timeout=60000, wait_until='domcontentloaded')
        await asyncio.sleep(wait)

    async def check_login_status(self):
        """检查是否已登录"""
        try:
            # 检查是否有头像元素（表示已登录）
            avatar = await self.page.query_selector('[class*="avatar"], [class*="user-avatar"]')
            if avatar:
                return True

            # 检查 Cookie 中的关键登录标识
            cookies = await self.context.cookies()
            for cookie in cookies:
                if cookie.get('name') in ['sessionid', 'sessionid_ss', 'passport_csrf_token']:
                    if cookie.get('value'):
                        return True

            return False
        except:
            return False

    async def login(self, timeout=180):
        """打开登录页面等待扫码登录"""
        print("=" * 50)
        print("请在浏览器中扫码登录抖音")
        print("提示：使用抖音 App 扫描二维码")
        print("=" * 50)

        await self.goto("https://www.douyin.com/")
        start = datetime.now()

        while (datetime.now() - start).seconds < timeout:
            if await self.check_login_status():
                print("登录成功!")
                await self._save_cookies()
                return True

            # 检查是否在登录页面（如果有登录按钮说明还没登录）
            login_btn = await self.page.query_selector('text=登录')
            if login_btn:
                await asyncio.sleep(3)

        print("登录超时，请重试")
        return False

    async def search_user(self, name):
        """搜索用户"""
        self.api_data = []
        # 使用用户搜索页面
        await self.goto(f"https://www.douyin.com/search/{name}?type=user")
        print(f"\n已搜索用户 [{name}]")
        print("=" * 50)
        print("请在浏览器中点击搜索结果中的用户，进入其主页")
        print("进入主页后，使用 scroll 命令滚动加载视频")
        print("=" * 50)

    async def search_video(self, keyword):
        """搜索视频"""
        self.api_data = []
        await self.goto(f"https://www.douyin.com/search/{keyword}?type=video")
        print(f"\n已搜索关键词 [{keyword}]")
        print("使用 scroll 命令滚动加载更多结果")

    async def scroll(self, times=5):
        """滚动页面加载更多内容"""
        self._check_browser()
        print(f"开始滚动 {times} 次...")

        for i in range(times):
            if self.page.is_closed():
                raise RuntimeError("浏览器已关闭")

            # 平滑滚动
            await self.page.evaluate('''
                window.scrollBy({
                    top: window.innerHeight,
                    behavior: 'smooth'
                })
            ''')

            # 随机延迟，模拟真人操作
            import random
            delay = random.uniform(1.5, 3)
            await asyncio.sleep(delay)

        print(f"滚动完成，当前已拦截 {len(self.api_data)} 条视频数据")

    def get_videos(self):
        """从拦截的 API 数据中提取视频信息"""
        videos = []
        seen = set()

        for item in self.api_data:
            vid = str(item.get('aweme_id', ''))
            if not vid or vid in seen:
                continue
            seen.add(vid)

            stats = item.get('statistics', {})
            desc = item.get('desc', '')
            author = item.get('author', {})

            is_hx, kws = check_hongxue(desc)

            videos.append({
                'video_id': vid,
                'desc': desc,
                'author': author.get('nickname', ''),
                'likes': stats.get('digg_count', 0),
                'comments': stats.get('comment_count', 0),
                'shares': stats.get('share_count', 0),
                'collects': stats.get('collect_count', 0),
                'is_hongxue': is_hx,
                'keywords': kws,
                'play_count': stats.get('play_count', 0),
            })

        logger.info(f"提取了 {len(videos)} 条唯一视频")
        return videos

    def clear(self):
        """清空当前拦截的数据"""
        self.api_data = []
        logger.info("已清空拦截数据")


def check_hongxue(text):
    """检查文本是否包含红学关键词"""
    if not text:
        return False, ""
    matched = [kw for kw in HONGXUE_KEYWORDS if kw in text]
    return len(matched) > 0, ",".join(matched)
