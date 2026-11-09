# Cap nhat FE offline tren Windows

Huong dan day du (BE + FE): xem

`InSight-Care-BE/deployment/windows-offline/UPDATE-WINDOWS-VI.md`

Tom tat FE:

1. Build tren may Windows co Internet:

```powershell
cd D:\build\InSight-Care-FE
Set-ExecutionPolicy -Scope Process Bypass
.\deployment\windows-offline\build-offline-bundle.ps1 `
  -ApiUrl 'http://127.0.0.1:8081' `
  -Port 3000
```

2. Copy `dist-offline\InSightCare-FE-offline.zip` sang server.

3. Tren server (Admin PowerShell):

```powershell
Expand-Archive -LiteralPath 'F:\InSightCare-FE-offline.zip' -DestinationPath 'F:\' -Force
Set-ExecutionPolicy -Scope Process Bypass
cd F:\InSightCare-FE-offline
.\install.ps1 -AppPort 3000
```

Neu FE dang dung cong khac (vi du 3002), thay `-AppPort` cho dung.
