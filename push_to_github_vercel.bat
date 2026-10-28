@echo off
chcp 65001 >nul
title PMATH EDUCATION TOOLS - Đẩy Project Lên GitHub & Deploy Vercel
color 0B

echo ============================================================================
echo        PMATH EDUCATION TOOLS v2.5 - CHUẨN BỊ DEPLOY LÊN VERCEL
echo ============================================================================
echo.
cd /d "%~dp0"

echo [1/4] Kiểm tra trạng thái Git cục bộ...
git add .
git commit -m "Ready for Vercel production deployment" >nul 2>&1
echo       ✓ Toàn bộ mã nguồn đã được đóng gói sạch sẽ vào nhánh 'main'.
echo.

echo [2/4] Kết nối với GitHub Repository của bạn:
echo       (Nếu chưa tạo Repo, hãy vào https://github.com/new tạo 1 Repo trống tên: pmath-tools)
echo.
set /p REPO_URL="👉 Dán đường dẫn GitHub Repo của bạn (VD: https://github.com/username/pmath-tools.git): "

if "%REPO_URL%"=="" (
    echo.
    echo [!] Bạn chưa nhập đường dẫn GitHub Repo. Hãy chạy lại file này khi đã có link!
    pause
    exit /b
)

echo.
echo [3/4] Đang đẩy mã nguồn lên GitHub (%REPO_URL%)...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Có lỗi khi đẩy lên GitHub. Hãy kiểm tra lại quyền đăng nhập Git hoặc link Repo.
    pause
    exit /b
)

echo.
echo ============================================================================
echo [4/4] ✓ ĐÃ ĐẨY LÊN GITHUB THÀNH CÔNG!
echo       Đang mở trang Vercel để bạn chọn Repo và bấm "Deploy"...
echo ============================================================================
start "" "https://vercel.com/new"
pause
