Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile("d:\babykylin_scmj\backup_ui_split_1018_1225\atlas\beimi-1.png")
$outDir = "d:\babykylin_scmj\tools_ui_split\probe"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
# 两种解读都试:A=按plist字面区域不旋转 B=宽高互换后逆时针90(已试过是空白)
$jobs = @(
    @{ name = "button1_literal.png";        x = 1204; y = 891; w = 388; h = 128; rot = $false },
    @{ name = "agreement_literal.png";      x = 1446; y = 890; w = 330; h = 53;  rot = $false },
    @{ name = "button1_swap_cw.png";        x = 1204; y = 891; w = 388; h = 128; rot = $true  },
    @{ name = "agreement_swap_cw.png";      x = 1446; y = 890; w = 330; h = 53;  rot = $true  }
)
foreach ($j in $jobs) {
    if ($j.rot) { $rw = $j.h; $rh = $j.w } else { $rw = $j.w; $rh = $j.h }
    if ($j.x + $rw -gt $src.Width -or $j.y + $rh -gt $src.Height) { Write-Host "$($j.name) 越界"; continue }
    $bmp = New-Object System.Drawing.Bitmap($rw, $rh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rw, $rh)), (New-Object System.Drawing.Rectangle($j.x, $j.y, $rw, $rh)), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    if ($j.rot) { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
    $bmp.Save((Join-Path $outDir $j.name), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "$($j.name) done"
}
$src.Dispose()
