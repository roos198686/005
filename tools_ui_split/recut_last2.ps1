Add-Type -AssemblyName System.Drawing
$out = "d:\babykylin_scmj\client\assets\resources\images\ui"
$jobs = @(
    @{ src = "d:\babykylin_scmj\backup_ui_split_1018_1225\atlas\PopupScene.png"; x = 1181; y = 945; w = 226; h = 54; dst = "$out\PopupScene\PopupScene15.png" },
    @{ src = "d:\babykylin_scmj\backup_ui_split_1018_1225\atlas\setting.png";    x = 890;  y = 206; w = 220; h = 42; dst = "$out\setting\setting9.png"    }
)
foreach ($j in $jobs) {
    $src = [System.Drawing.Bitmap]::FromFile($j.src)
    $rw = $j.h; $rh = $j.w  # 旋转帧:区域宽高互换
    $bmp = New-Object System.Drawing.Bitmap($rw, $rh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rw, $rh)), (New-Object System.Drawing.Rectangle($j.x, $j.y, $rw, $rh)), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone)
    $bmp.Save($j.dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose(); $src.Dispose()
    Write-Host "重切完成: $($j.dst)"
}
