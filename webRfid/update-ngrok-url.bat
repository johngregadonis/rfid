@echo off
for /f "tokens=*" %%i in ('curl -s http://127.0.0.1:4040/api/tunnels ^| jq -r ".tunnels[0].public_url"') do set NGROK_URL=%%i
echo BACKEND_URL=%NGROK_URL% > .env
echo Updated backend URL to %NGROK_URL%
