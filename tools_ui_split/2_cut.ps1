# 按 frames.json 从图集切出单帧 PNG（还原旋转+按原尺寸画布+按偏移粘贴）
param([string]$FramesJson = "d:\babykylin_scmj\tools_ui_split\frames.json")

Add-Type -AssemblyName System.Drawing
$frames = Get-Content $FramesJson -Raw -Encoding UTF8 | ConvertFrom-Json
$srcCache = @{}
$done = 0; $fail = 0

foreach ($f in $frames) {
    try {
        if (-not $srcCache.ContainsKey($f.srcImg)) {
            $srcCache[$f.srcImg] = [System.Drawing.Bitmap]::FromFile($f.srcImg)
        }
        $src = $srcCache[$f.srcImg]
        $rx = [int]$f.rect.x; $ry = [int]$f.rect.y; $rw = [int]$f.rect.w; $rh = [int]$f.rect.h

        # 提取图集区域
        $tile = New-Object System.Drawing.Bitmap $rw, $rh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($tile)
        $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $rw, $rh), (New-Object System.Drawing.Rectangle $rx, $ry, $rw, $rh), [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()

        # 还原旋转（TexturePacker rotated=true 表示存储时顺时针转了90°，还原需逆时针90°）
        if ($f.rotated) { $tile.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }

        $cw = [Math]::Max(1, [int]$f.rawW); $ch = [Math]::Max(1, [int]$f.rawH)
        if ($cw -eq $tile.Width -and $ch -eq $tile.Height -and [int]$f.pasteX -eq 0 -and [int]$f.pasteY -eq 0) {
            $canvas = $tile
        } else {
            $canvas = New-Object System.Drawing.Bitmap $cw, $ch, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $g2 = [System.Drawing.Graphics]::FromImage($canvas)
            $g2.Clear([System.Drawing.Color]::Transparent)
            $g2.DrawImage($tile, [int]$f.pasteX, [int]$f.pasteY, $tile.Width, $tile.Height)
            $g2.Dispose()
            $tile.Dispose()
        }

        if (-not (Test-Path $f.outDir)) { New-Item -ItemType Directory -Path $f.outDir -Force | Out-Null }
        $outPath = Join-Path $f.outDir $f.outFile
        $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Dispose()
        $done++
    } catch {
        $fail++
        Write-Host "失败: $($f.outDir)/$($f.outFile) => $($_.Exception.Message)"
    }
}

foreach ($k in $srcCache.Keys) { $srcCache[$k].Dispose() }
Write-Host "切图完成: $done 成功, $fail 失败"
