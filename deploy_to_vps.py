import os
import sys
import time
import paramiko

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = '54.39.22.90'
USER = 'ubuntu'
PASS = 'Ritesh0909op@@@'
REMOTE_DIR = '/www/wwwroot/embed-service'
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

print(f"[*] Connecting to VPS {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=22, username=USER, password=PASS, timeout=20, banner_timeout=30)

# Create remote directory structure
print(f"[*] Ensuring remote directory structure in {REMOTE_DIR} exists...")
ssh.exec_command(f"echo '{PASS}' | sudo -S mkdir -p {REMOTE_DIR}/public/js/jwplayer")
ssh.exec_command(f"echo '{PASS}' | sudo -S chown -R ubuntu:ubuntu {REMOTE_DIR}")

# Open SFTP
sftp = ssh.open_sftp()

def upload_recursive(local_path, remote_path):
    if os.path.isfile(local_path):
        remote_file_dir = os.path.dirname(remote_path)
        try:
            sftp.stat(remote_file_dir)
        except IOError:
            sftp.mkdir(remote_file_dir)
        print(f"[*] Uploading {os.path.relpath(local_path, LOCAL_DIR)} ({os.path.getsize(local_path)} bytes)...")
        sftp.put(local_path, remote_path)
    elif os.path.isdir(local_path):
        try:
            sftp.stat(remote_path)
        except IOError:
            sftp.mkdir(remote_path)
        for item in os.listdir(local_path):
            if item in ['node_modules', '.git']:
                continue
            upload_recursive(os.path.join(local_path, item), f"{remote_path}/{item}")

files_and_dirs = [
    'package.json',
    '.env',
    'server.js',
    'landingHtml.js',
    'jwPlayerHtml.js',
    'volumeBooster.js',
    'public'
]

for item in files_and_dirs:
    l_p = os.path.join(LOCAL_DIR, item)
    r_p = f"{REMOTE_DIR}/{item}"
    if os.path.exists(l_p):
        upload_recursive(l_p, r_p)
    else:
        print(f"[!] Warning: {item} not found locally.")

sftp.close()

# Update ownership to www:www
print("[*] Setting ownership to www:www...")
ssh.exec_command(f"echo '{PASS}' | sudo -S chown -R www:www {REMOTE_DIR} && sudo chmod -R 775 {REMOTE_DIR}")

# Check dependencies only if needed
print("[*] Ensuring directory permissions...")
ssh.exec_command(f"echo '{PASS}' | sudo -S chown -R www:www {REMOTE_DIR} && sudo chmod -R 775 {REMOTE_DIR}")

# Restart node server on VPS
print("[*] Restarting embed-service on VPS via aaPanel script...")
kill_cmd = f"echo '{PASS}' | sudo -S kill -9 $(sudo lsof -t -i:4010) 2>/dev/null || true; sleep 1; echo '{PASS}' | sudo -S bash /www/server/nodejs/vhost/scripts/embed_hindi.sh"
stdin, stdout, stderr = ssh.exec_command(kill_cmd)
time.sleep(3)

# Verify health and port 4010
print("\n[*] Verifying live health and JW Player asset response on VPS:")
stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:4010/health")
health_out = stdout.read().decode('utf-8', errors='replace')
print("Health:", health_out)

stdin, stdout, stderr = ssh.exec_command("curl -s -I http://127.0.0.1:4010/js/jwplayer/jwplayer.js | head -n 3")
static_out = stdout.read().decode('utf-8', errors='replace')
print("JW Player Static Asset Header:\n", static_out)

stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:4010/embed/ani/132405/1 | grep -i 'jwplayer' | head -n 5")
embed_test = stdout.read().decode('utf-8', errors='replace')
print("Embed Player HTML Verification:\n", embed_test)

ssh.close()
print("\n✅ Deployment to VPS Complete! JW Player 8 is now live on https://embed.anixohindi.cc")
