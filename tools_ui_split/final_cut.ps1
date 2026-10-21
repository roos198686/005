Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile("d:\babykylin_scmj\backup_ui_split_1018_1225\atlas\beimi-1.png")
$outDir = "d:\babykylin_scmj\tools_ui_split\probe"
# 区域=宽高互换, 逆时针90(Rotate270)还原正向
$jobs = @(
    @{ name = "final_button1.png";   x = 1204; y = 891; w = 388; h = 128 },
    @{ name = "final_agreement.png"; x = 1446; y = 890; w = 330; h = 53  }
)
foreach ($j in $jobs) {
    $rw = $j.h; $rh = $j.w
    $bmp = New-Object System.Drawing.Bitmap($rw, $rh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rw, $rh)), (New-Object System.Drawing.Rectangle($j.x, $j.y, $rw, $rh)), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone)
    $bmp.Save((Join-Path $outDir $j.name), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
$src.Dispose()
Write-Host "done"
