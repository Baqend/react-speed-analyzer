set DOMAIN=%1

echo "%DOMAIN%"

rmdir /S /Q %TMP%\makefast-profile

"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir="%TMP%\\makefast-profile" --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure="http://%DOMAIN%" --disable-web-security --host-rules="MAP %DOMAIN% 127.0.0.1" --no-first-run --disable-infobars

rmdir /S /Q %TMP%\makefast-profile
