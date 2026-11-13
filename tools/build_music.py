#!/usr/bin/env python3
"""Baut public/music aus einem Ordner mit Unterordnern (je Ordner = eine Playlist).
Aufruf: python3 build_music.py <Lieder-Ordner> <public/music> <NSFW-CODE>
Der Ordner NSFW wird mit AES-256-GCM verschlüsselt (Schlüssel aus dem Code, PBKDF2-SHA256, 200000 Runden).
Ohne den Code sind Titel und Audio dieser Playlist nicht lesbar."""
import sys, os, re, json, shutil, unicodedata
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
src, out, code = sys.argv[1], sys.argv[2], sys.argv[3]
SECRET = 'nsfw'
def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-') or 'x'
def title(fn): return re.sub(r'\.(mp3|ogg|m4a|wav|opus|aac)$', '', fn, flags=re.I)
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
pls = []
for folder in sorted(os.listdir(src)):
    d = os.path.join(src, folder)
    if not os.path.isdir(d): continue
    files = sorted(f for f in os.listdir(d) if re.search(r'\.(mp3|ogg|m4a|wav|opus|aac)$', f, re.I))
    if not files: continue
    if folder.lower() == SECRET:
        salt = os.urandom(16)
        key = PBKDF2HMAC(hashes.SHA256(), 32, salt, 200000).derive(code.encode())
        aes = AESGCM(key); nd = os.path.join(out, 'n'); os.makedirs(nd)
        lst = []
        for i, f in enumerate(files):
            iv = os.urandom(12); data = open(os.path.join(d, f), 'rb').read()
            open(os.path.join(nd, f'{i:02d}.bin'), 'wb').write(iv + aes.encrypt(iv, data, None))
            lst.append({'title': title(f), 'file': f'n/{i:02d}.bin'})
        iv = os.urandom(12)
        open(os.path.join(nd, 'list.bin'), 'wb').write(salt + iv + aes.encrypt(iv, json.dumps(lst, ensure_ascii=False).encode(), None))
        continue
    sd = slug(folder); os.makedirs(os.path.join(out, sd))
    tr = []
    for i, f in enumerate(files):
        ext = f.rsplit('.', 1)[1].lower(); name = f'{i:02d}-{slug(title(f))[:40]}.{ext}'
        shutil.copy2(os.path.join(d, f), os.path.join(out, sd, name))
        tr.append({'title': title(f), 'file': f'{sd}/{name}'})
    pls.append({'id': sd, 'name': folder.replace('Choise', 'Choice'), 'tracks': tr})
json.dump({'playlists': pls}, open(os.path.join(out, 'playlist.json'), 'w'), ensure_ascii=False, indent=1)
print(sum(len(p['tracks']) for p in pls), 'Titel in', len(pls), 'Playlists; NSFW verschlüsselt')
