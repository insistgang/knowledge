# -*- coding: utf-8 -*-
import os
import asyncio
import pandas as pd
from datetime import datetime

from config import DATA_DIR, TARGET_BLOGGERS
from scraper import DouyinScraper

os.makedirs(DATA_DIR, exist_ok=True)


class App:
    def __init__(self):
        self.scraper = DouyinScraper()
        self.all_videos = []

    async def run(self):
        print("\n" + "=" * 50)
        print("    抖音红学视频爬取工具 v4")
        print("=" * 50 + "\n")

        try:
            await self.scraper.start()
            await self.loop()
        finally:
            await self.scraper.stop()

    async def loop(self):
        print("命令列表:")
        commands = [
            ("login", "打开浏览器扫码登录"),
            ("status", "检查登录状态"),
            ("user [名字]", "搜索用户（不输入名字则从列表选择）"),
            ("goto <url>", "直接跳转到指定URL（如用户主页）"),
            ("search [关键词]", "搜索视频"),
            ("scroll [次数]", "滚动页面（默认5次）"),
            ("get", "提取当前拦截的视频数据"),
            ("save", "保存所有收集的数据到CSV"),
            ("clear", "清空当前数据"),
            ("help", "显示帮助"),
            ("q", "退出程序"),
        ]
        for cmd, desc in commands:
            print(f"  {cmd:<15} - {desc}")

        print("\n推荐流程:")
        print("  1. login（首次使用或cookie过期）")
        print("  2. user 大车轱辘（或直接 goto 用户主页URL）")
        print("  3. scroll 20（滚动加载更多）")
        print("  4. get（提取数据）")
        print("  5. save（保存）")
        print()

        while True:
            try:
                cmd = input(">>> ").strip().split(maxsplit=1)
                if not cmd:
                    continue

                action = cmd[0].lower()
                arg = cmd[1] if len(cmd) > 1 else ""

                if action == 'q':
                    break
                elif action == 'login':
                    await self.scraper.login()
                elif action == 'status':
                    is_login = await self.scraper.check_login_status()
                    if is_login:
                        print("✓ 已登录")
                    else:
                        print("✗ 未登录，请先执行 login 命令")
                elif action == 'user':
                    name = arg or self.select_blogger()
                    if name:
                        await self.scraper.search_user(name)
                elif action == 'goto':
                    if arg:
                        await self.scraper.goto(arg)
                        print("已跳转，请使用 scroll 加载内容")
                    else:
                        print("请输入URL，例如: goto https://www.douyin.com/user/...")
                elif action == 'search':
                    await self.scraper.search_video(arg or "红楼梦")
                elif action == 'scroll':
                    times = int(arg) if arg.isdigit() else 5
                    await self.scraper.scroll(times)
                elif action == 'get':
                    videos = self.scraper.get_videos()
                    self.show(videos)
                    for v in videos:
                        if v['video_id'] not in [x['video_id'] for x in self.all_videos]:
                            self.all_videos.append(v)
                    print(f"\n累计收集: {len(self.all_videos)} 条")
                elif action == 'save':
                    self.save()
                elif action == 'clear':
                    self.scraper.clear()
                    self.all_videos = []
                    print("已清空所有数据")
                elif action == 'help':
                    self.show_help()
                else:
                    print(f"未知命令: {action}，输入 help 查看帮助")
            except RuntimeError as e:
                print(f"错误: {e}")
                print("浏览器可能已关闭，请按 q 退出后重新启动程序")
            except Exception as e:
                print(f"发生错误: {e}")

    def select_blogger(self):
        """从预设列表选择博主"""
        print("\n请选择目标博主:")
        for i, name in enumerate(TARGET_BLOGGERS, 1):
            print(f"  {i}. {name}")
        print(f"  0. 输入自定义名字")

        c = input("选择编号或输入名字: ").strip()
        if c.isdigit():
            num = int(c)
            if 1 <= num <= len(TARGET_BLOGGERS):
                return TARGET_BLOGGERS[num - 1]
        return c if c else None

    def show(self, videos):
        """显示视频列表"""
        if not videos:
            print("\n没有获取到数据")
            print("可能原因:")
            print("  1. 未登录或登录已过期")
            print("  2. 没有进入用户主页")
            print("  3. 滚动次数不够")
            print("  4. 该用户没有发布视频")
            return

        print(f"\n本次获取到 {len(videos)} 条视频:")
        print("-" * 60)

        for i, v in enumerate(videos[:15], 1):
            mark = "★" if v['is_hongxue'] else " "
            desc = v['desc'][:40] + "..." if len(v['desc']) > 40 else v['desc']
            print(f"{mark}{i:2}. {desc}")
            print(f"     👍{v['likes']:>6,}  💬{v['comments']:>5,}  🔗{v['shares']:>5,}  @{v['author']}")

        if len(videos) > 15:
            print(f"     ... 还有 {len(videos) - 15} 条")

        hx_count = sum(1 for v in videos if v['is_hongxue'])
        print("-" * 60)
        print(f"红学相关: {hx_count} 条")

    def save(self):
        """保存数据到 CSV"""
        if not self.all_videos:
            print("没有数据可保存")
            return

        df = pd.DataFrame(self.all_videos)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = os.path.join(DATA_DIR, f"videos_{timestamp}.csv")

        df.to_csv(path, index=False, encoding='utf-8-sig')
        print(f"\n已保存 {len(df)} 条到: {path}")

        hx = df[df['is_hongxue'] == True]
        print(f"红学相关: {len(hx)} 条")
        print(f"总点赞数: {df['likes'].sum():,}")
        print(f"总播放数: {df['play_count'].sum():,}")

    def show_help(self):
        """显示详细帮助"""
        print("\n" + "=" * 50)
        print("详细帮助")
        print("=" * 50)
        print("\n1. 登录")
        print("   命令: login")
        print("   说明: 打开浏览器，使用抖音App扫码登录")
        print("   登录成功后会自动保存cookie，下次启动无需重新登录")

        print("\n2. 搜索用户")
        print("   命令: user 大车轱辘")
        print("   说明: 搜索指定用户")
        print("   注意: 搜索后需要在浏览器中手动点击进入用户主页")

        print("\n3. 直接跳转")
        print("   命令: goto <用户主页URL>")
        print("   说明: 如果知道用户主页URL，可以直接跳转")

        print("\n4. 滚动加载")
        print("   命令: scroll 20")
        print("   说明: 滚动页面加载更多视频，建议滚动20次以上")

        print("\n5. 提取数据")
        print("   命令: get")
        print("   说明: 从拦截的API数据中提取视频信息")

        print("\n6. 保存数据")
        print("   命令: save")
        print("   说明: 将所有收集的数据保存为CSV文件")

        print("\n" + "=" * 50)


if __name__ == '__main__':
    try:
        asyncio.run(App().run())
    except KeyboardInterrupt:
        print("\n\n程序已退出")
