Add-Type -AssemblyName System.Drawing
$jobs = Get-Content "d:\babykylin_scmj\tools_ui_split\recut_jobs.json" -Raw | ConvertFrom-Json
$cache = @{}
foreach ($j in $jobs) {
    $srcPath = $j.src
    if (-not $cache.ContainsKey($srcPath)) { $cache[$srcPath] = [System.Drawing.Bitmap]::FromFile($srcPath) }
    $src = $cache[$srcPath]
    $info = $j.info
    if ($info.rotated) { $rw = [int]$info.h; $rh = [int]$info.w } else { $rw = [int]$info.w; $rh = [int]$info.h }
    $x = [int]$info.x; $y = [int]$info.y
    if ($x + $rw -gt $src.Width -or $y + $rh -gt $src.Height) { Write-Host "越界跳过: $($j.out)"; continue }
    $bmp = New-Object System.Drawing.Bitmap($rw, $rh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rw, $rh)), (New-Object System.Drawing.Rectangle($x, $y, $rw, $rh)), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    if ($info.rotated) { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    $bmp.Save($j.out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "重切完成: $($j.out)"
}
foreach ($k in $cache.Keys) { $cache[$k].Dispose() }
