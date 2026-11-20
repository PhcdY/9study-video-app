# 9Study Video — app desktop cho cộng tác viên

App Windows giúp cộng tác viên (CTV) không rành kỹ thuật làm video giải thích bản chất bằng bộ công cụ trong repo `PhcdY/remotion_claudecode` (nhánh `main-codex`). App chỉ đóng gói lại những thứ repo đó đã có: Codex chạy ngầm, Remotion Studio, các script Python/Node. **Luật làm video không nằm ở đây**: nó ở `AGENTS.md` và `.agents/skills/` của repo video.

Kế hoạch đầy đủ (tính năng, kiến trúc, mốc, rủi ro): `PLAN.md`. Đọc trước khi làm bất cứ việc gì.
Thiết kế giao diện: https://claude.ai/artifact/XA873CwpU1C2dhJZUE7rSk

## Stack
- Electron + electron-vite + React + TypeScript (strict) + Tailwind + shadcn/ui.
- Codex: `codex app-server` (JSON-RPC qua stdio), phiên bản ghim cố định; kiểu sinh bằng `codex app-server generate-ts`. Không dùng API experimental.
- Node 22 portable, Python 3.12 embeddable, git (dugite) đóng gói kèm. Thư mục `bin/` của app đứng đầu PATH của mọi tiến trình con, có `py.cmd` trỏ về Python đóng gói (repo video gọi `py scripts/...`).
- `CODEX_HOME` riêng của app trong `%APPDATA%`.
- electron-builder (NSIS, cài theo từng người dùng, không cần admin) + electron-updater qua GitHub Releases.

## Quy ước
- Chỉ Windows. Đường dẫn mặc định không dấu, không dấu cách (`D:\9Study\VideoAI`).
- Phần lõi (`src/main/`) chia theo service, mỗi service một file. Giao diện (`src/renderer/`) không chạy lệnh, chỉ gọi IPC có kiểu.
- **Chữ trên giao diện:** tiếng Việt, gom hết vào `src/renderer/src/lib/copy.ts`. Không dùng thuật ngữ kỹ thuật (git, stash, terminal, slug, commit) trên UI; nói "bản", "lấy bản mới", "bài của bạn".
- Lỗi hiện cho người dùng: nói chuyện gì xảy ra và đưa nút sửa (Thử lại, Sửa giúp tôi, Gửi báo lỗi). Không hiện chuỗi lỗi thô.
- Không bao giờ ghi key (`VIVIBE_API_KEY`, token) vào log hay gói góp ý.
- Tiến trình con (Codex, `npm run dev`) phải tắt sạch cả cây tiến trình khi thoát app.
- Quyền Codex mặc định: sandbox `workspace-write`, xin quyền `on-request`. Không bao giờ để mặc định toàn quyền.
- Không tự chạy lệnh git đổi phiên bản trong repo video của CTV ngoài luồng đã mô tả ở `PLAN.md` (đổi bản an toàn, còn lại giao skill `phien-ban`).

## Kiểm tra trước khi báo xong
- `npm run typecheck` và `npm run lint` không lỗi; bài thử của service vừa sửa chạy qua.
- Việc đụng tới cài đặt, đóng gói hay runtime: thử trên máy Windows sạch (máy ảo), không chỉ máy dev.
- Commit nhỏ, mỗi việc một commit, lời commit bằng tiếng Việt không dấu theo kiểu `feat(setup): ...`, `fix(codex): ...`.
