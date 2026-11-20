# 9Study Video

App desktop Windows cho cộng tác viên làm video giải thích bản chất: cài đặt từng bước, làm video bằng nút bấm và khung chat với trợ lý AI (Codex, đăng nhập bằng ChatGPT), tự cập nhật bộ công cụ và chính app.

- Kế hoạch: [PLAN.md](PLAN.md)
- Quy ước cho AI và người phát triển: [AGENTS.md](AGENTS.md)
- Bộ công cụ làm video: `PhcdY/remotion_claudecode` (nhánh `main-codex`)

Trạng thái: Mốc 1 (vỏ app, màn cài đặt 7 bước, đóng gói `Setup.exe`, bản 0.1.1) xong trên máy dev, chờ thử trên máy ảo sạch. Code thử kỹ thuật Mốc 0 ở `spikes/`.

## Chạy khi phát triển

```powershell
npm install
npm run fetch-runtimes
npm run dev
```

- `npm run fetch-runtimes`: tải Node, Python, git, Codex đi kèm vào `resources/runtimes/` (không commit).
- Xem giao diện bằng dữ liệu giả trong trình duyệt: mở `http://localhost:5173/?state=dangNhap` khi `npm run dev` đang chạy. Lưu ý: cả `npm run dev` lẫn `electron-vite dev --rendererOnly` đều mở app thật; tắt lệnh bằng cách đóng cửa sổ app, đừng chỉ dừng lệnh (app sẽ chạy ngầm và giữ khoá một bản).
- Kiểm tra trước khi commit: `npm run typecheck`, `npm run lint`, `npm test`.
- Đóng gói: `npm run build:win` ra `release/9study-video-setup-<bản>.exe`.
