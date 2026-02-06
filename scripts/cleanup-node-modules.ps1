# 清理竞赛目录中的 node_modules，释放空间
# 保留源代码和配置文件，删除可恢复的依赖

$competitionsPath = "04-Competitions"
$totalFreed = 0
$deletedCount = 0

Write-Host "=== 开始清理 node_modules ===" -ForegroundColor Green

Get-ChildItem $competitionsPath -Recurse -Directory -Filter "node_modules" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        $totalFreed += $size
        $deletedCount++
        
        Write-Host "删除: $($_.FullName) ($([math]::Round($size,2)) MB)" -ForegroundColor Yellow
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "跳过: $($_.FullName) (可能正在使用)" -ForegroundColor Red
    }
}

# 同时清理 .git 中的大文件缓存（可选）
Write-Host "`n=== 清理完成 ===" -ForegroundColor Green
Write-Host "删除文件夹数: $deletedCount" -ForegroundColor Cyan
Write-Host "释放空间: $([math]::Round($totalFreed,2)) MB ($([math]::Round($totalFreed/1024,2)) GB)" -ForegroundColor Cyan
Write-Host "`n提示: node_modules 可以通过 npm install 重新安装" -ForegroundColor Gray

Read-Host "按 Enter 键退出"
