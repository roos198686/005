Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile("d:\babykylin_scmj\backup_ui_split_1018_1225\atlas\beimi-1.png")
Write-Host ("源图尺寸: {0}x{1}" -f $src.Width, $src.Height)

# 旋转帧:plist的textureRect是图集里的存储区域,取出后逆时针旋转90度还原(与之前验证正确的返回按钮同一算法)
$jobs = @(
    @{ name = "按钮_button1.png";        x = 1204; y = 891; w = 388; h = 128 },
    @{ name = "按钮_user-agreement.png"; x = 1446; y = 890; w = 330; h = 53  }
)
$outDir = "d:\babykylin_scmj\client\assets\resources\images\ui\beimi-1"
foreach ($j in $jobs) {
    # 旋转帧在图集中的实际占用区域:宽高互换
    $rectW = $j.h; $rectH = $j.w
    if ($j.x + $rectW -gt $src.Width -or $j.y + $rectH -gt $src.Height) {
        Write-Host ("{0} 区域越界! x={1} y={2} w={3} h={4}" -f $j.name, $j.x, $j.y, $rectW, $rectH)
        continue
    }
    $bmp = New-Object System.Drawing.Bitmap($rectW, $rectH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rectW, $rectH)), (New-Object System.Drawing.Rectangle($j.x, $j.y, $rectW, $rectH)), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone)
    $out = Join-Path $outDir $j.name
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host ("已重切: {0} -> {1}x{2} 大小 {3}" -f $j.name, $j.w, $j.h, (Get-Item $out).Length)
}
$src.Dispose()
