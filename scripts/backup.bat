@echo off
REM Obsidian 知识库备份脚本
REM 双击运行，自动提交并推送到 GitHub

cd /d E:\000\knowledge

echo ========================================
echo   Obsidian 知识库备份到 GitHub
echo ========================================
echo.

REM 获取当前日期
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TODAY=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%

echo [%DATE% %TIME%] 开始备份...
echo.

REM 添加所有更改
git add .
echo   - 文件已添加到暂存区

REM 提交
git commit -m "%TODAY%"
echo   - 提交完成: %TODAY%

REM 推送
git push
echo   - 推送完成
echo.
echo ========================================
echo   备份成功！
echo ========================================
echo.

pause
