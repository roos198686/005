Add-Type -AssemblyName System.Drawing
$files = Get-Content "d:\babykylin_scmj\tools_ui_split\scan_list.txt"
$blank = @()
foreach ($f in $files) {
    if (-not (Test-Path $f)) { continue }
    try {
        $bmp = [System.Drawing.Bitmap]::FromFile($f)
        $w = $bmp.Width; $h = $bmp.Height
        # 采样至多25个点,若全部透明或全部纯白则判定空白
        $allSame = $true
        $first = $null
        $steps = 5
        for ($ix = 0; $ix -lt $steps -and $allSame; $ix++) {
            for ($iy = 0; $iy -lt $steps -and $allSame; $iy++) {
                $x = [Math]::Min($w - 1, [int]($ix * ($w - 1) / [Math]::Max(1, $steps - 1)))
                $y = [Math]::Min($h - 1, [int]($iy * ($h - 1) / [Math]::Max(1, $steps - 1)))
                $px = $bmp.GetPixel($x, $y)
                if ($null -eq $first) { $first = $px }
                if ($px.A -ne $first.A -or $px.R -ne $first.R -or $px.G -ne $first.G -or $px.B -ne $first.B) { $allSame = $false }
            }
        }
        if ($allSame -and ($first.A -eq 0 -or ($first.R -eq 255 -and $first.G -eq 255 -and $first.B -eq 255))) {
            $blank += "$f [$($w)x$($h)]"
        }
        $bmp.Dispose()
    } catch { Write-Host "读取失败: $f" }
}
Write-Host ("空白图数量: " + $blank.Count)
$blank | ForEach-Object { Write-Host $_ }
