# Deploy Railway

App nay da duoc chuan bi de chay tren Railway voi:

- `PORT` tu Railway
- SQLite luu trong volume
- upload anh luu trong volume

## 1. Day code len GitHub

Tao repo moi tren GitHub, sau do up source code len.

## 2. Tao project tren Railway

1. Vao Railway
2. Chon `New Project`
3. Chon `Deploy from GitHub repo`
4. Chon repo cua ban

Railway se tu nhan Node.js va chay `npm start`.

## 3. Tao Volume

Trong service cua app:

1. Chon `Volumes`
2. Tao 1 volume moi
3. Mount path de la:

`/data`

## 4. Khai bao bien moi truong

Them cac bien sau trong Railway:

- `DATA_DIR=/data`
- `DB_PATH=/data/raovat-v3.db`
- `UPLOAD_DIR=/data/uploads`

## 5. Deploy

Redeploy service.

Khi chay thanh cong, app se:

- tao DB tai `/data/raovat-v3.db`
- tao thu muc upload tai `/data/uploads`
- phuc vu anh upload qua duong dan `/uploads/...`

## 6. Luu y

- Neu ban muon giu du lieu hien tai tu may local, hay copy file `raovat-v3.db` len volume hoac import du lieu sau.
- Neu khong copy DB cu, app se tu seed demo data moi.
- Sau deploy lan dau, nho vao app kiem tra dang nhap admin va tinh nang upload anh.
