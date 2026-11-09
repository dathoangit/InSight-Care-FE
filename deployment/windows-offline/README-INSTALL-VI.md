# Cài đặt InSight Care FE offline trên Windows Server

Mô hình giống BE: build trên máy có mạng → ZIP → copy lên server → 1 lệnh cài
(WinSW). FE **không cần PostgreSQL**.

Bundle chứa:

- Next.js `output: 'standalone'` (`server.js`);
- `.next/static` và `public`;
- Node.js portable x64 (`runtime\node.exe`);
- WinSW (`app\InSightCare-FE.exe` + XML);
- VC++ Redistributable (tuỳ chọn);
- `install.ps1`, `uninstall.ps1`, `smoke-test.ps1`.

Máy chủ không cần Yarn, Docker hay Internet.

## Khác BE

| | BE | FE |
|---|---|---|
| Chạy bằng | `node dist/main.js` | `node server.js` (standalone) |
| Database | PostgreSQL | Không |
| Env quan trọng | `.env` runtime | `NEXT_PUBLIC_API_URL` bake lúc **build** |
| Port gợi ý | 8081 | 3000 |

> Đổi IP BE sau khi build FE → phải **build lại FE**.

## 1. Chốt URL BE trước khi build

`NEXT_PUBLIC_API_URL` được đóng vào JavaScript trình duyệt lúc build.

- Chỉ mở browser trên chính Windows Server: `http://127.0.0.1:8081` dùng được.
- User mở FE từ máy khác trong LAN: dùng IP LAN của BE, ví dụ
  `http://192.168.1.20:8081`.
- Không dùng `localhost`/`127.0.0.1` cho trường hợp truy cập từ máy khác.

BE phải CORS cho origin FE, ví dụ `http://192.168.1.20:3000`.

FE gọi trực tiếp `POST <NEXT_PUBLIC_API_URL>/auth/login` từ browser.

## 2. Tạo bundle trên máy Windows x64 có Internet

```powershell
cd C:\path\to\InSight-Care-FE
Set-ExecutionPolicy -Scope Process Bypass
.\deployment\windows-offline\build-offline-bundle.ps1 `
  -ApiUrl 'http://192.168.1.20:8081' `
  -Port 3000
```

Nếu PowerShell chặn `yarn`, dùng `yarn.cmd` đã được script gọi sẵn.

Kết quả:

```text
dist-offline\InSightCare-FE-offline\
dist-offline\InSightCare-FE-offline.zip
```

Cấu trúc ZIP:

```text
InSightCare-FE-offline/
  runtime/node.exe
  app/
    server.js
    .next/static/
    public/
    InSightCare-FE.exe
    InSightCare-FE.xml
    logs/
  install.ps1
  uninstall.ps1
  smoke-test.ps1
  README-INSTALL-VI.md
  bundle-manifest.json
```

Không đưa mật khẩu / token / `.env` thật vào ZIP.

## 3. Thử trên máy build (không cần service)

```powershell
cd .\dist-offline\InSightCare-FE-offline
$env:PORT = '3000'
$env:HOSTNAME = '0.0.0.0'
.\runtime\node.exe .\app\server.js
```

Smoke test (cửa sổ khác):

```powershell
.\smoke-test.ps1 `
  -FrontendBaseUrl 'http://127.0.0.1:3000' `
  -BackendBaseUrl 'http://127.0.0.1:8081'
```

Login admin tương tác (không lưu credential):

```powershell
.\smoke-test.ps1 `
  -FrontendBaseUrl 'http://127.0.0.1:3000' `
  -BackendBaseUrl 'http://127.0.0.1:8081' `
  -TestAdminLogin
```

## 4. Copy lên server (RDP)

1. Remote Desktop vào server.
2. Options → Local Resources → More → tick ổ có ZIP.
3. Copy `InSightCare-FE-offline.zip` sang server, ví dụ `F:\`.

## 5. Cài trên server (Admin PowerShell)

```powershell
Expand-Archive -LiteralPath 'F:\InSightCare-FE-offline.zip' -DestinationPath 'F:\' -Force
Set-ExecutionPolicy -Scope Process Bypass
cd F:\InSightCare-FE-offline
.\install.ps1 -AppPort 3000
```

Mặc định cài vào `C:\InSightCare\FE`. Đổi thư mục:

```powershell
.\install.ps1 -InstallRoot 'D:\InSightCare\FE' -AppPort 3000
```

Script sẽ:

- copy toàn bộ bundle vào thư mục cài;
- mở firewall TCP cho port FE;
- cài/start service `InSightCare-FE`;
- auto restart + rolling logs.

## 6. Kiểm tra sau cài

```powershell
sc.exe query InSightCare-FE
Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing

.\smoke-test.ps1 `
  -FrontendBaseUrl 'http://127.0.0.1:3000' `
  -BackendBaseUrl 'http://127.0.0.1:8081'
```

Trình duyệt:

- `http://<IP-server>:3000/`
- `http://<IP-server>:3000/login`

Log: `C:\InSightCare\FE\app\logs`

## 7. Gỡ cài đặt

```powershell
.\uninstall.ps1
```

Giữ file/log:

```powershell
.\uninstall.ps1 -KeepFiles
```

## 8. Checklist bàn giao

- [ ] Bundle build trên Windows x64
- [ ] `bundle-manifest.json` có đúng `publicApiUrl`
- [ ] Port FE 3000 trống
- [ ] Firewall TCP 3000 mở
- [ ] BE 8081 đang chạy
- [ ] BE CORS cho `http://<IP-server>:3000`
- [ ] `/`, `/login`, `/api/health` OK
- [ ] Login admin OK
- [ ] Service `InSightCare-FE` = Running
- [ ] Không cần PostgreSQL / Stack Builder cho FE

## 9. PostgreSQL

PostgreSQL Stack Builder **không liên quan FE**. FE chỉ chạy Node/Next và gọi BE
qua HTTP.
