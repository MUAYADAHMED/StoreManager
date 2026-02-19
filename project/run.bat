@echo off
REM تشغيل خادم StoreManager

echo.
echo ╔════════════════════════════════════════╗
echo ║   📱 StoreManager - تشغيل الخادم      ║
echo ╚════════════════════════════════════════╝
echo.

REM تحقق من وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ خطأ: Node.js غير مثبت!
    echo.
    echo حمّل Node.js من: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM شغّل الخادم
echo ✅ تشغيل الخادم...
echo.
node server.js

pause
