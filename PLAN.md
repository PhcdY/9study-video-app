# App làm video cho cộng tác viên — Kế hoạch

> Trạng thái: Mốc 0 và phần lớn Mốc 1 xong trên máy dev; cả hai chờ thử trên máy ảo sạch. Viết ngày 19/11/2026 dựa trên nhánh `main-codex` (bản 2 + "Chưa phát hành"). Cập nhật 20/11/2026: chốt phạm vi bản 1 gọn (mục 1b) và thời gian thực tế (mục 6).
> Tên tạm của app: **9Study Video** (đổi sau).

---

## 1. Tổng quan

App desktop cho Windows. Cộng tác viên (CTV) cài một file, bấm theo từng bước, rồi làm video bằng nút bấm và khung chat. Không phải cài Node/Python/Git, không mở VS Code hay Terminal, không gõ lệnh, không cần tài khoản GitHub.

Bên trong, app chỉ "đóng gói lại" những thứ repo đã có:
- **Codex** (trợ lý AI): chạy ngầm bằng `codex app-server`. CTV đăng nhập bằng tài khoản ChatGPT của chính mình. Codex vẫn tự đọc `AGENTS.md`, `.agents/skills/`, `.codex/agents/` như hiện tại, **không phải viết lại skill nào**.
- **Repo `remotion_claudecode`**: repo public nên app clone thẳng, không cần đăng nhập GitHub. CTV chỉ kéo về, không bao giờ đẩy lên.
- **Remotion Studio, storyboard, script Python**: app tự chạy rồi hiện kết quả ngay trong cửa sổ.

### Tính năng (bản 1)

**A. Cài đặt lần đầu** (các bước sáng lần lượt, app tự nhận ra bước nào đã xong):
1. Chọn chỗ lưu. Mặc định `D:\9Study\VideoAI`: không dấu, không dấu cách, tránh ổ C và thư mục OneDrive.
2. Tải dự án: clone `main-codex`, rồi tự chuyển sang bản phát hành số lớn nhất. Có thanh tiến trình.
3. Cài thư viện: `npm install` và tải sẵn trình duyệt render của Remotion. Có thanh tiến trình.
4. Đăng nhập ChatGPT: app mở trình duyệt, CTV bấm "Tiếp tục", app tự nhận ra khi đăng nhập xong.
5. Key giọng đọc Vivibe (có thể bỏ qua, làm sau): dán key, app gọi thử để kiểm tra, rồi tự ghi vào `.env`.
6. Nơi lưu video: app tự dò ổ Google Drive và gợi ý, rồi ghi `OUTPUT_DIR` vào `.env`.
6b. Thư mục góp ý (tuỳ chọn): nhận ra thư mục `9Study_GopY` mà đội đã chia sẻ trên Drive.
7. Kiểm tra máy: đủ dung lượng trống, các công cụ chạy được. Xong thì hiện "Máy bạn đã sẵn sàng".

**B. Màn hình chính — "Video của tôi"**
- Danh sách video đọc từ `src/videos/*/script.json`: tên, môn, lớp, đang ở bước nào.
- App suy ra bước hiện tại từ file có sẵn: có kịch bản → có storyboard → có audio → đã xuất MP4.
- Nút **Làm video mới**: form 3 phần. App ghép tất cả thành câu lệnh rồi gọi `$viet-kich-ban`.
  - *Video về bài nào*: môn, lớp, loại video (bài học / hiện tượng), bài SGK (báo có thẻ bài học chưa), ý bản chất.
  - *Giọng đọc Vivibe*: 3 giọng của roster, có nút nghe mẫu và gợi ý theo môn; giọng khác lấy từ tài khoản Vivibe (`--list-voices`); tuỳ chọn đổi giọng theo cảnh.
  - *Tuỳ chọn nâng cao* (gập được, đều không bắt buộc):
    - Kỳ thi (đi vào `exams`).
    - Học sinh đã học gì / chưa học gì (tiền đề cho học sinh ảo).
    - Video trước trong chuỗi.
    - Kiểu mở đầu và gợi ý hiện tượng, ví dụ xuyên suốt.
    - Độ dài.
    - Lỗi hay mắc (đoạn "Bẫy thường gặp"), dạng bài thi (đoạn "Trong đề thi").
    - Tài liệu đính kèm, ghi chú khác.
- Mở lại video cũ thì tiếp tục đúng cuộc trò chuyện cũ của video đó.

**C. Màn hình một video**
- Trên cùng là thanh 3 bước: **Kịch bản → Duyệt hình → Giọng đọc và xuất video**.
- **Bên trái: khung chat Codex.**
  - Chữ chạy dần như ChatGPT, hiện được công thức.
  - Các lệnh AI chạy được gom thành một dòng trạng thái, ví dụ "Đang kiểm tra kịch bản…".
  - Mỗi bước có nút gợi ý thay cho prompt mẫu: "Duyệt kịch bản, sang bước 2", "Xuất lại storyboard", "Tạo giọng đọc"…
- **Bên phải: các tab xem kết quả.**
  - *Kịch bản*: bảng dễ đọc (cảnh, lời đọc, chữ trên hình) lấy từ `script.json`.
  - *Storyboard*: nhúng `out/_lam-viec/<id>/storyboard/index.html`.
  - *Xem chuyển động*: app tự chạy `npm run dev` và nhúng Remotion Studio, CTV không phải mở Terminal.
  - *Thành phẩm*: phát MP4 ngay trong app, kèm nút "Mở thư mục".
- **Khi AI xin quyền**, hiện thẻ hỏi bằng tiếng Việt. Ví dụ: "Tạo giọng đọc cho 58 câu, khoảng 4.200 credit Vivibe. Đồng ý?"
- **Nghe thử giọng đọc**: phát thẳng các file mp3 mà skill `tao-audio` bắt nghe, không phải dò đường dẫn.
- **Tự dọn bộ nhớ AI**: xong mỗi bước app tự thu gọn cuộc trò chuyện (thay cho việc gõ `/compact`).

**D. Phiên bản bộ công cụ**
- Góc trên hiện "Bản 2". Khi có bản mới thì hiện "Có bản 3" kèm phần "có gì mới" đọc từ `CHANGELOG.md`, và nút **Cập nhật**.
- Khi cập nhật, app tự đổi bản nếu an toàn. Nếu CTV đã sửa file của bộ công cụ, app giao cho skill `phien-ban` xử lý (chi tiết ở mục 5).

**E. Tiện ích**
- **Thanh lượt dùng ChatGPT**, ví dụ "Đã dùng 60%, làm mới lúc 14:00", để CTV không bị hết lượt bất ngờ giữa chừng.
- **Nút "Gửi báo lỗi"**: gom log thành một file zip ra Desktop để gửi cho bạn.
- **App tự cập nhật**: tải ngầm bản mới, rồi hiện "Khởi động lại để cập nhật".

**F. Màn Cài đặt** (nút trên thanh đầu màn "Video của tôi")
- **Thư mục**: thư mục dự án (mở, chuyển sang ổ khác) và nơi lưu video thành phẩm (`OUTPUT_DIR`, nhận ra Google Drive).
- **Giọng đọc**: key Vivibe (che bớt, kiểm tra lại, đổi), giọng mặc định theo nhóm môn, tốc độ đọc chung (`tts_config.json`, kèm lời dặn đừng giảm tốc để chữa câu dài).
- **Trợ lý AI**: tài khoản ChatGPT và lượt còn lại, đăng xuất; khi nào AI phải hỏi trước (việc tốn credit hoặc cần mạng / mọi lệnh); tự dọn bộ nhớ AI sau mỗi bước.
- **Phiên bản**: bản bộ công cụ (xem bản mới, quay lại bản trước), phiên bản app và tự tải bản app mới.
- **Ổ đĩa**: dung lượng ảnh nháp/storyboard và file tạm khi xuất video, kèm nút dọn; cảnh báo khi ổ C sắp đầy.
- **Hỗ trợ**: chạy lại kiểm tra máy, gửi báo lỗi, xem hướng dẫn.
- **Góp ý**: thư mục góp ý chung, số góp ý đã gửi và trạng thái, luôn kèm cả video hay không, bật chế độ người bảo trì.

**G. Góp ý cho đội** (để người bảo trì sửa skill chung)
- **Kênh**: thư mục Google Drive chung `9Study_GopY` do người bảo trì chia sẻ. App ghi gói vào đó, Drive for Desktop tự đồng bộ. Không cần server hay token. Màn cài đặt lần đầu có bước "Thư mục góp ý" (tuỳ chọn).
- **Phía CTV**:
  - Có nút "Góp ý cho đội" ở thanh đầu màn làm video và trên từng ảnh storyboard. Xem video thành phẩm thì bấm "Góp ý tại đây" để lấy mốc thời gian, rồi dùng `scripts/beat_at.py` đổi ra cảnh và câu.
  - Form: chỗ lỗi (tự điền), loại lỗi (hình / giọng đọc / nội dung / lỗi app), mô tả, nên sửa ở đâu (luật chung / chỉ video này), chọn file gửi kèm.
  - Gói gồm: đoạn 20 giây quanh chỗ lỗi (cả video là tuỳ chọn), ảnh storyboard và audio của câu đó, `script.json` và thư mục nguồn `src/videos/<slug>/`, những gì CTV đã dạy AI (thay đổi trong `.agents/`, `FEEDBACK.md`), bản bộ công cụ, bản app, giọng đã dùng.
  - Gói không bao giờ chứa `.env` hay key.
- **Phía người bảo trì** (bật "Chế độ người bảo trì" trong Cài đặt):
  - Có thêm mục "Góp ý" với danh sách góp ý chia theo trạng thái (mới / đang sửa / xong).
  - Màn chi tiết: video tua sẵn đúng giây, ảnh storyboard, nghe đúng câu audio, lời CTV viết, những gì AI trên máy CTV đã học.
  - Các nút: "Chuyển thành việc sửa skill" (mở Codex trong repo kèm sẵn gói, trên nhánh `all_fix_…`), "Mở trong Studio" (chép nguồn video vào repo để xem chuyển động), "Mở thư mục gói".
  - Chọn trạng thái "Đã sửa trong bản N", CTV thấy được trong mục Góp ý đã gửi.
  - **Gộp nhiều góp ý thành một lần sửa**:
    - Tick nhiều góp ý trong danh sách, kể cả từ nhiều CTV và nhiều loại lỗi.
    - Màn gộp hiện:
      - Từng góp ý kèm chỗ sửa dự kiến (skill, gói môn, `phonetic_dict.json`), app đoán theo loại lỗi và môn.
      - Tên lần sửa, tên nhánh tự đặt theo quy ước `[môn]_[tag]_[mô tả]`, chọn đưa vào bản nào.
    - Nút "Mở Codex với N góp ý": Codex nhận đủ các gói và được dặn sửa skill chung (không sửa video của CTV), ghi `lessons.md`, thêm dòng vào mục "Chưa phát hành" của `CHANGELOG.md`.
    - Có thể "Lưu lần sửa, làm sau". Các góp ý trong lần sửa chuyển "Đang sửa". Khi phát hành bản đó, cả nhóm tự chuyển "Đã sửa trong bản N".
    - Thêm khoảng 1–2 ngày so với hộp thư một góp ý.
- **Công sức**: phía CTV 3–4 ngày, phía người bảo trì 4–5 ngày. Bản tối giản: mỗi gói kèm một file `index.html` để mở bằng trình duyệt, mất 1–2 ngày, làm ở Mốc 3.

**Để sau bản 1:** form góp ý gửi thẳng cho đội, dọn ổ đĩa, bản cho Mac, chạy nhiều video song song.

## 1b. Phạm vi bản 1 (bản "chạy được")

Chốt 20/11/2026: mục tiêu là app vận hành được cho CTV, không làm đủ mọi tiện ích ở mục 1. Những gì không có trong cột "Làm" thì để sau khi CTV đã dùng thật.

| Phần | Làm ở bản 1 | Để sau |
| :--- | :--- | :--- |
| A. Cài đặt lần đầu | Bước 1–7 | Bước 6b (thư mục góp ý) |
| B. Video của tôi | Danh sách, suy ra bước, form "Làm video mới" (cả phần nâng cao, đều là ô chữ), 3 giọng roster + nghe mẫu, mở lại đúng cuộc trò chuyện | Lấy giọng từ tài khoản Vivibe (`--list-voices`), đổi giọng theo cảnh |
| C. Màn một video | Toàn bộ | — |
| D. Phiên bản bộ công cụ | Hiện bản, "có gì mới", nút Cập nhật (tầng 1 tự đổi, tầng 2 giao `$phien-ban`) | Quay lại bản trước |
| E. Tiện ích | Gửi báo lỗi (zip), app tự cập nhật, thanh lượt dùng nếu Codex trả sẵn số liệu | — |
| F. Màn Cài đặt | Tối giản: mở thư mục dự án, đổi nơi lưu video, đổi key Vivibe, đăng xuất ChatGPT, chạy lại kiểm tra máy, gửi báo lỗi | Chuyển ổ, giọng mặc định theo môn, tốc độ đọc, quyền AI, quay lại bản, dọn ổ đĩa |
| G. Góp ý cho đội | Không làm. Tạm dùng "Gửi báo lỗi" | Toàn bộ (8–11 ngày) |
| Chữ ký số | Không. Kèm ảnh hướng dẫn qua SmartScreen | Cân nhắc khi phát rộng |

---

## 2. Những điều cần biết khi chưa build app bao giờ

Bạn không cần tự code, nhưng cần nắm mấy điều này để ra lệnh cho AI đúng và không bị lạc.

1. **App desktop có 2 nửa.**
   - *Phần lõi* (main process) chạy Node, được làm mọi thứ: chạy lệnh, đọc ghi file, mở Codex, git.
   - *Phần giao diện* (renderer) chỉ là một trang web React.
   - Hai nửa nói chuyện qua *IPC*. Giao diện không tự chạy lệnh mà nhờ phần lõi làm hộ.
   - Hiểu điểm này thì đọc được AI đang sửa chỗ nào.
2. **"Chạy trên máy mình" khác "chạy trên máy CTV".** Máy bạn có sẵn Node, Git, Python, Codex nên cái gì cũng chạy. Máy CTV thì trống trơn. Mọi bản phát hành phải được thử trên **một máy Windows sạch**. Windows 11 Home không có Windows Sandbox, nên dùng máy ảo VirtualBox (miễn phí) hoặc mượn máy một CTV.
3. **Đóng gói là một việc riêng, khá mất công.** Từ code ra file `Setup.exe`, rồi chữ ký số, rồi tự cập nhật. Phải làm từ tuần đầu, đừng để cuối.
4. **Tiến trình con phải tắt sạch.** App sẽ chạy ngầm Codex và Remotion Studio. Tắt app mà không tắt chúng thì máy CTV đầy tiến trình "ma", lần sau mở bị báo cổng 3000 đang bận.
5. **Giao việc cho AI theo từng mẩu nhỏ, có tiêu chí xong rõ ràng.**
   - Không bảo "làm app cho t".
   - Bảo kiểu: "Làm `GitService.clone()`: clone repo public vào thư mục X, báo % tiến trình, lỗi mạng thì trả thông báo tiếng Việt. Xong khi: chạy thử trên thư mục trống thấy đủ file."
   - Mỗi mẩu một commit, hỏng thì quay lại được.
6. **Giữ một file `PLAN.md` và `AGENTS.md` trong repo app.** AI đọc lại mỗi phiên, không quên quyết định cũ. Chính file này là bản đầu của `PLAN.md`.

---

## 3. Chuẩn bị trước khi code

- [ ] Tạo repo mới `9study-video-app`, **tách khỏi** repo video.
  - Lý do: app và bộ công cụ cập nhật theo nhịp khác nhau.
  - CTV clone repo video không nên kéo theo code app.
- [ ] Chọn chỗ phát hành app: GitHub Releases của repo app.
  - Repo app phải public, hoặc có một repo public riêng chỉ chứa file phát hành, để app tự cập nhật mà không cần token.
- [ ] Trên máy bạn: Node 22 LTS, Git (đã có).
- [ ] Một máy Windows sạch để thử: máy ảo VirtualBox chạy Windows 11 bản dùng thử, hoặc mượn máy CTV.
- [ ] Một tài khoản ChatGPT thử (Plus) và một key Vivibe thử.
- [ ] Trong repo video, thêm file `app-compat.json` ở gốc: `{ "minAppVersion": "1.0.0" }`.
  - Khi bộ công cụ đổi cấu trúc mà app cũ không hiểu, app thấy file này và nhắc CTV cập nhật app.

---

## 4. Tech stack

| Thành phần | Là gì / làm gì ở đây | Vì sao chọn | Phương án khác |
| :--- | :--- | :--- | :--- |
| **Electron** | Khung làm app desktop bằng web (VS Code, Slack, Codex app cũng dùng). Lo cửa sổ, chạy tiến trình, file. | Mọi thứ cần gọi (Codex, npm, Remotion) đều là Node. AI viết Electron rất thạo vì có nhiều code mẫu nhất. | **Tauri**: app nhẹ hơn (~10 MB so với ~100 MB) nhưng phần lõi viết bằng Rust, AI hay sai hơn. App đằng nào cũng mang theo Node nên lợi thế nhẹ không còn. |
| **electron-vite** | Bộ khung dựng sẵn cho Electron + React + TypeScript. | Có sẵn cấu trúc main/renderer chuẩn, sửa code thấy ngay. | Electron Forge: cũng tốt, ít tích hợp Vite hơn. |
| **React + TypeScript** | Giao diện. | Cùng React với Remotion trong repo. TypeScript giúp AI ít sai kiểu dữ liệu. | Vue/Svelte: không lợi gì thêm ở đây. |
| **Tailwind + shadcn/ui** | Bộ giao diện đẹp sẵn (nút, thẻ, hộp thoại, tiến trình). | UI đẹp ngay mà không cần tự thiết kế; AI dùng rất thạo. | Mantine, Ant Design: nặng và "công sở" hơn. |
| **Codex app-server** (`@openai/codex`, ghim cố định phiên bản) | Lõi trợ lý AI mà extension VS Code cũng dùng. App chạy `codex app-server` rồi nói chuyện qua stdin/stdout (JSON-RPC). | Có sẵn đăng nhập ChatGPT, lịch sử hội thoại, xin quyền chạy lệnh/sửa file, luồng chữ chạy dần, thu gọn hội thoại, đọc lượt dùng. App chỉ cần vẽ giao diện. | **Codex SDK** (`@openai/codex-sdk`): gọn hơn nhưng OpenAI khuyên dùng cho tự động hoá. Không có luồng xin quyền và đăng nhập cho app tự làm. |
| **Node 22 portable** (đóng gói kèm) | Chạy `npm`, Remotion, các script `.mjs`. | CTV không phải cài. Bản zip của nodejs.org giải nén là chạy. | Bắt CTV tự cài: chính là cái đang muốn bỏ. |
| **Python 3.12 embeddable** (đóng gói kèm) | Chạy `check_script.py`, `vivibe_tts.py`… | Các script chỉ dùng thư viện chuẩn (đã kiểm tra), nên bản embeddable ~15 MB là đủ. | Cài Python bằng winget: cần quyền admin, dễ lỗi PATH. |
| **dugite** | Git đóng gói sẵn (GitHub Desktop đang dùng). | Git thật, nên skill `phien-ban` và Codex chạy lệnh `git` bình thường. | isomorphic-git: Git viết bằng JS, thiếu lệnh, Codex không dùng được. |
| **electron-builder** (NSIS, cài theo từng người dùng) | Đóng gói ra `Setup.exe`. | Cài vào thư mục người dùng nên **không hỏi quyền admin**. | MSIX, Squirrel: rắc rối hơn với auto-update. |
| **electron-updater** | App tự cập nhật từ GitHub Releases. | Đi cặp với electron-builder, gần như không phải cấu hình. | Tự viết: không đáng. |
| **electron-store, electron-log, chokidar** | Lưu cài đặt; ghi log; theo dõi file đổi (kịch bản, storyboard mới). | Nhỏ, phổ biến. | — |

---

## 5. Kiến trúc

```
┌──────────── Giao diện (React) ────────────┐
│ Cài đặt │ Video của tôi │ Màn video (chat + tab xem) │ Phiên bản │
└──────────────────┬───────────────────────┘
                   │ IPC (có kiểu TypeScript)
┌──────────────────┴───── Phần lõi (Node) ─────────────────────┐
│ RuntimeService  : đường dẫn Node/Python/Git đóng gói, dựng PATH │
│ SetupService    : các bước cài đặt, kiểm tra máy               │
│ CodexService    : chạy `codex app-server`, JSON-RPC, đăng nhập, │
│                   thread theo từng video, thẻ xin quyền, lượt dùng│
│ ProjectService  : quét src/videos, đọc script.json, suy ra bước │
│ StudioService   : bật/tắt `npm run dev`, tìm cổng, tắt sạch     │
│ VersionService  : đọc tag + CHANGELOG, đổi bản an toàn          │
│ UpdateService   : app tự cập nhật                               │
└───────┬───────────────┬───────────────┬───────────────────────┘
   codex.exe       node / npm       python / git (đều đóng gói kèm)
        └───── cùng chạy trong D:\9Study\VideoAI (repo) ─────┘
```

### Các quyết định quan trọng

- **PATH riêng cho mọi tiến trình con.**
  - App đặt thư mục `bin/` của mình lên đầu PATH, trong đó có `node`, `npm`, `git`, `python` và **một file `py.cmd`** trỏ về Python đóng gói.
  - Lý do: `AGENTS.md` dặn Codex dùng `py scripts/...`, mà bản Python embeddable không có lệnh `py`.
  - Thiếu shim này thì Codex chạy đâu lỗi đó.
- **`CODEX_HOME` riêng của app** (`%APPDATA%\9Study Video\codex`): tách đăng nhập và lịch sử khỏi Codex khác trên máy (nếu có).
- **Mỗi video một cuộc trò chuyện (thread).**
  - App lưu `threadId` theo slug và mở lại đúng thread đó.
  - Xong mỗi bước, app gọi `thread/compact/start` để thu gọn.
  - Nút bước 2 và bước 3 gọi rõ `$dung-video <slug>` hoặc `$tao-audio <slug>`, để Codex chọn đúng skill.
- **Quyền của Codex.**
  - Sandbox: cho sửa trong thư mục dự án (`workspace-write`). Xin quyền: khi cần (`on-request`).
  - App bắt các yêu cầu `item/commandExecution/requestApproval` và `item/fileChange/requestApproval` rồi hiện thẻ tiếng Việt.
  - Có bảng dịch các lệnh quen thuộc:

    | Lệnh | Hiện cho CTV |
    | :--- | :--- |
    | `vivibe_tts.py` | "Tạo giọng đọc (tốn credit)" |
    | `remotion render` | "Xuất video" |
    | `git switch` | "Đổi phiên bản" |
    | lệnh lạ | Hiện nguyên văn kèm "AI muốn chạy lệnh này" |

  - **Không bao giờ để mặc định toàn quyền.**
- **Đổi phiên bản theo 2 tầng.**
  - Nếu `git status` sạch hoặc chỉ có thư mục video mới (`??`): app tự `git switch --detach refs/tags/<số>`, rồi chạy `npm install` nếu `package-lock.json` đổi. Nhanh và chắc chắn.
  - Nếu có file của bộ công cụ bị sửa (CTV đã dạy Codex sửa skill hoặc `Root.tsx`): mở một thread riêng gọi `$phien-ban cập nhật lên bản <số>`. Skill này đã viết sẵn cách cất bài và gộp an toàn.
- **Ba thứ cập nhật độc lập:**

  | Cập nhật cái gì | Khi nào | Cách |
  | :--- | :--- | :--- |
  | Bộ công cụ (skill, luật, component) | Thường xuyên, mỗi lần bạn phát hành tag số | Nút "Cập nhật" trong app (D). **Không cần phát hành app mới.** |
  | App (giao diện, tính năng app) | Khi sửa app | electron-updater tự tải, CTV bấm khởi động lại |
  | Codex | Khi OpenAI đổi giao thức hoặc model | Đổi số phiên bản ghim, test, phát hành app mới |

### Cấu trúc thư mục repo app (`9study-video-app`)

```
9study-video-app/
├─ AGENTS.md                  # luật cho AI viết app: stack, quy ước, không thuật ngữ trên UI
├─ PLAN.md                    # bản sao kế hoạch này, cập nhật theo tiến độ
├─ package.json               # electron, electron-vite, react, tailwind, @openai/codex (ghim), dugite…
├─ electron-builder.yml       # đóng gói NSIS per-user, publish GitHub Releases
├─ scripts/
│  └─ fetch-runtimes.mjs      # tải Node portable + Python embeddable vào resources/ lúc build
├─ resources/                 # đi kèm bản cài, không commit file nặng
│  ├─ runtimes/node/ python/  # do fetch-runtimes tải về
│  ├─ bin/py.cmd              # shim lệnh `py` → Python đóng gói
│  └─ icon.ico
├─ src/
│  ├─ main/                   # phần lõi (Node)
│  │  ├─ index.ts             # tạo cửa sổ, đăng ký IPC, tắt sạch tiến trình con khi thoát
│  │  ├─ ipc.ts               # danh sách kênh IPC có kiểu
│  │  ├─ services/
│  │  │  ├─ runtime.ts        # đường dẫn node/python/git/codex, dựng PATH + CODEX_HOME
│  │  │  ├─ setup.ts          # 6 bước cài đặt: check() + run() + tiến trình
│  │  │  ├─ codex/
│  │  │  │  ├─ client.ts      # chạy `codex app-server`, JSON-RPC qua stdio
│  │  │  │  ├─ protocol.ts    # kiểu sinh từ `codex app-server generate-ts`
│  │  │  │  ├─ approvals.ts   # dịch lệnh → câu tiếng Việt cho thẻ xin quyền
│  │  │  │  └─ threads.ts     # mỗi video một thread, lưu threadId theo slug
│  │  │  ├─ project.ts        # quét src/videos, đọc script.json, suy ra bước
│  │  │  ├─ studio.ts         # bật/tắt `npm run dev`, tìm cổng
│  │  │  ├─ version.ts        # tag số + CHANGELOG, đổi bản an toàn / giao $phien-ban
│  │  │  ├─ env-file.ts       # đọc/ghi .env, không log key
│  │  │  └─ updater.ts        # electron-updater
│  │  └─ log.ts               # electron-log, gom zip báo lỗi
│  ├─ preload/index.ts        # cầu nối an toàn main ↔ giao diện (contextBridge)
│  └─ renderer/               # giao diện React
│     ├─ App.tsx              # điều hướng: Setup | Home | Workspace
│     ├─ screens/             # Setup, Home, NewVideo, Workspace, UpdateDialog
│     ├─ components/          # StepList, ApprovalCard, ChatPanel, StoryboardGrid, AudioList, UsageMeter…
│     ├─ components/ui/       # shadcn/ui (button, dialog, tabs, progress…)
│     ├─ lib/copy.ts          # toàn bộ chữ tiếng Việt trên UI ở một chỗ
│     └─ styles/tokens.css    # màu, chữ, bo góc theo brand 9Study
└─ tests/                     # bài thử cho setup, version, approvals
```

Thiết kế giao diện (7 màn): https://claude.ai/artifact/XA873CwpU1C2dhJZUE7rSk

---

## 6. Các mốc

Cách làm: AI viết toàn bộ code; bạn chỉ cài bản mới lên máy sạch, bấm thử, chụp màn hình chỗ hỏng (khoảng 1–2 giờ mỗi ngày). Thời gian chủ yếu nằm ở thử trên máy sạch và sửa lỗi môi trường Windows, không nằm ở viết code. Ước lượng theo phạm vi mục 1b.

| Mốc | Làm gì | Ra được gì | Ngày làm việc |
| :--- | :--- | :--- | :--- |
| **0. Thử kỹ thuật** | Chứng minh 3 chỗ rủi ro nhất chạy được trên **máy sạch**, bằng code thử xấu cũng được | Biết chắc hướng đi đúng trước khi làm UI đẹp | 3–4 |
| **1. Vỏ app và cài đặt** | Khung Electron, màn cài đặt 7 bước, đóng gói `Setup.exe`, tự cập nhật | CTV cài xong, máy sẵn sàng | 5–7 |
| **2. Làm video** | Danh sách video, form video mới, chat Codex, thẻ xin quyền, tab kịch bản/storyboard/Studio/thành phẩm, nghe thử audio | Làm trọn một video trong app, không mở Terminal | 8–12 |
| **3. Hoàn thiện** | Phiên bản, thanh lượt dùng, báo lỗi, Cài đặt tối giản, lỗi tiếng Việt kèm nút sửa, đánh bóng UI | Bản 1.0 | 3–5 |
| **4. Thử thật** | 2–3 CTV dùng 1 tuần, AI sửa song song | Danh sách sửa, rồi phát cho mọi CTV | 1 tuần lịch |

**Tổng: khoảng 5–7 tuần lịch** (suôn sẻ thì ~4 tuần). Bạn tự làm được một video trong app sau khoảng 3–4 tuần (hết Mốc 2). Làm đủ cả F và G như mục 1 thì khoảng 8–10 tuần.

Rủi ro lớn nhất về thời gian: sandbox Codex trên Windows cần quyền admin. Mốc 0 trả lời việc này trong 2 ngày đầu; nếu vướng thì cộng 2–5 ngày. Mốc 0 quan trọng nhất: nếu một trong 3 thứ không chạy, phải biết ngay ngày thứ 2, không phải tuần thứ 3.

---

## 7. Việc cần làm

### Mốc 0 — thử kỹ thuật (làm chi tiết)

Code thử nằm ở `spikes/` (`codex-probe.mjs`, `moc0-test.ps1`, `studio-probe.mjs`, bộ chạy máy ảo `chay-thu.cmd`).

- [x] **Codex**: `initialize` → `account/login/start` (`chatgpt`) → mở `authUrl` → `account/login/completed` → `thread/start` + `turn/start`. Chạy được trên máy dev (20/11).
- [x] **Thẻ xin quyền**: bắt được `item/commandExecution/requestApproval`, trả `accept` thì lệnh chạy.
- [ ] **Sandbox Windows**: máy dev báo `notConfigured` (với `CODEX_HOME` riêng). Chưa chạy `windowsSandbox/setupStart` trên máy dev vì nó đổi quyền hệ thống. **Còn chờ thử trên máy ảo sạch** (bước 4–5 của `chay-thu.cmd`).
- [x] **Runtime đóng gói** (máy dev, PATH sạch chỉ còn runtime đóng gói + thư mục Windows): `npm ci`, `py scripts/check_script.py`, `node scripts/storyboard.mjs` đều chạy. **Còn chờ máy sạch.**
- [x] **Remotion**: `npx remotion browser ensure` và render 2 giây `physics-showcase` chạy được. **Còn chờ máy sạch.**
- [x] **Studio**: `npm run dev -- --port N --no-open` sẵn sàng sau 3 giây; `taskkill /T /F` tắt sạch cả 6 tiến trình, cổng được trả lại. Nhúng vào cửa sổ Electron làm ở Mốc 1.
- [x] Ghi kết quả vào `PLAN.md`.
- [ ] **Chạy `spikes/output/9study-moc0-kit.zip` trên máy ảo sạch**, đọc `ketqua-may-ao.txt`, rồi chốt Mốc 0.

#### Kết quả Mốc 0 trên máy dev (20/11/2026)

| Hạng mục | Kết quả | Hệ quả cho app |
| :--- | :--- | :--- |
| Codex `0.171.0` (ghim) | Đăng nhập ChatGPT (cả tài khoản free), thread, luồng chữ, xin quyền đều chạy. Một lượt ngắn mất 14 giây | Giữ hướng `codex app-server`. Kiểu sinh bằng `generate-ts` (không `--experimental`) đã có đủ hàm cần dùng |
| Mở link đăng nhập | `cmd /c start <url>` cắt link tại dấu `&` → trang báo "thiếu tham số" | App dùng `shell.openExternal` của Electron, không đi qua `cmd` |
| Xin quyền khi **chưa** chuẩn bị sandbox | Codex hỏi quyền cho **mọi** lệnh, kể cả lệnh chỉ đọc (`git status`). Lệnh được bọc trong `powershell.exe -Command '...'` | Phải chuẩn bị sandbox ở màn cài đặt, không thì CTV bị hỏi liên tục. Bảng dịch lệnh phải bóc lệnh thật ra khỏi `powershell -Command` |
| Lượt dùng | `account/rateLimits/read` trả `usedPercent`, `resetsAt` (tài khoản free: chu kỳ 30 ngày) | Thanh lượt dùng làm được, rẻ |
| Node 22.23.5 portable | 100 MB giải nén | — |
| Python 3.12.10 embeddable | 22 MB. Là bản 3.12 cuối có file cài; 3.12.11+ chỉ vá bảo mật, không có bản embeddable | Dùng 3.12.10. Cân nhắc lên 3.13 sau khi thử script |
| Git (dugite 3.3.3, git 2.56.1) | 106 MB | — |
| Shim `py.cmd` | Codex gọi `py scripts/...` chạy đúng Python đóng gói | Giữ |
| Thời gian trên PATH sạch | `npm ci` 139 s, tải trình duyệt render 17 s, storyboard nháp `tiem-can` 112 s, render 2 giây 14 s | Bước "Cài thư viện" cần thanh tiến trình thật, ~2–3 phút |
| `remotion compositions` | Lỗi cả repo khi một video chưa có audio (`public/audio` không commit) | App **không** dùng lệnh này để liệt kê video; quét `src/videos/*/script.json` như đã định |
| `storyboard.mjs` | Ưu tiên Chrome cài sẵn trên máy, máy CTV không có thì dùng trình duyệt Remotion | Phải xác nhận trên máy sạch (không Chrome) |
| Dung lượng Codex | `codex.exe` 407 MB, `codex-code-mode-host.exe` 81 MB, `codex-resources` 46 MB (riêng phần giọng nói ~20 MB) | Bản cài ước ~300–350 MB nén, ~1 GB sau cài. Thử bỏ phần giọng nói và `code-mode-host` ở Mốc 1 |
| `tar` của Git Bash | Hiểu `D:` là máy từ xa | Script build dùng `C:\Windows\System32\tar.exe` |

### Mốc 1 — vỏ app và cài đặt
- [x] Tạo dự án bằng electron-vite (React + TS strict), Tailwind 4, nút/thanh tiến trình kiểu shadcn/ui, khung IPC có kiểu (`src/shared/types.ts`, chỉ các kênh liệt kê mới gọi được).
- [x] `RuntimeService` (`src/main/services/runtime.ts`) + `scripts/fetch-runtimes.mjs`: gom Node, Python, git, Codex vào `resources/runtimes/`, PATH sạch cho tiến trình con, bộ nhớ đệm npm và thư mục tạm đặt cạnh thư mục dự án (không ở ổ C, không dấu).
- [x] `SetupService` (`src/main/services/setup.ts`): 7 bước, mỗi bước `check()` + `run()`, báo tiến trình thật (git theo %, npm đếm gói, trình duyệt render theo %), mã lỗi thay cho chuỗi lỗi thô.
- [x] Màn cài đặt theo mockup: cột bước, "App tự làm / Bạn chỉ cần", lỗi tiếng Việt kèm nút Thử lại, màn "Máy bạn đã sẵn sàng". Xem từng trạng thái trong trình duyệt bằng dữ liệu giả: `npm run dev` rồi mở `http://localhost:5173/?state=dangNhap` (các trạng thái: xem `src/renderer/src/lib/mock-api.ts`).
- [x] Ghi `.env` an toàn (`env-file.ts`): giữ dòng cũ và chữ thích, ghi qua file tạm. Key Vivibe kiểm bằng `vivibe_tts.py --list-voices`, truyền qua biến môi trường, che trong log (`redact.ts`).
- [x] **Tự qua bước máy đã có** (`detect.ts`): chưa có bộ công cụ trong thư mục đã chọn thì dò ổ đĩa (2 cấp) + Desktop/Documents/Downloads tìm repo `remotion_claudecode` có sẵn (chỉ đọc `.git/config`, ~50 ms), gợi ý "Dùng bộ có sẵn" ở bước 1 và bước 2, bộ đã cài đủ xếp đầu. Bộ có sẵn được phép có dấu cách trong đường dẫn và **không bị đổi bản** (có thể đang có bài dở trên nhánh khác). Thư viện coi là đã cài khi `node_modules/.package-lock.json` khớp phiên bản với `package-lock.json` (bỏ gói tuỳ chọn của máy khác) và đã có trình duyệt render, dù cài bằng app hay tự `npm install`. Xong mỗi bước, app đọc lại các bước sau để tự qua bước đã xong (key, nơi lưu video đọc từ `.env` có sẵn). Máy dev tìm thấy 3 bộ, `D:\Video AI` đủ cả thư viện lẫn trình duyệt.
- [x] **Hiện rõ từng phần khi tải/cài** (bản 0.1.1): bước dài chia thành phần (`STEP_TASKS` trong `src/shared/types.ts`). Trước khi chạy hiện "Những gì app sẽ làm" kèm dung lượng ước (bộ công cụ ~10 MB, thư viện ~350 gói, trình duyệt xuất video ~280 MB trên ổ); khi chạy mỗi phần có trạng thái, thanh tiến trình riêng và số liệu thật (MB đã tải + tốc độ của git, số gói npm đã tải, MB trình duyệt của Remotion); phần máy đã có ghi "Máy đã có sẵn".
- [x] Sửa lỗi "App không ghi được vào chỗ này" khi chọn bộ có sẵn ở gốc ổ (`D:\Video AI`): Node trên Windows báo EPERM khi `mkdir` gốc ổ đĩa (`D:\`). Giờ chỉ tạo thư mục khi chưa có, và kiểm quyền bằng cách ghi thử một file nhỏ rồi xoá (`fs-util.ts`).
- [x] Chỉ chạy một bản app: bản mở sau thoát gọn. Lúc khởi động dọn Codex mồ côi (tiến trình cha đã chết). Thử thật: `codex app-server` tự thoát khi mất kết nối với app, nên mồ côi hiếm; phần dọn để phòng hờ.
- [x] Bước tải chạy thật (người dùng tự bấm trên máy dev): tải vào `D:\9Study\VideoAI` trong ~5 giây, tự chuyển sang bản 3.
- [x] Bước đăng nhập chuẩn bị luôn sandbox Windows (chế độ không cần admin); chưa sẵn sàng thì chỉ cảnh báo ở bước Kiểm tra máy.
- [x] Đóng gói bằng electron-builder (NSIS cài theo người dùng): `npm run build:win` ra `release/9study-video-setup-0.1.0.exe` **321 MB** (1,1 GB sau cài). Bản đóng gói chạy được Codex đi kèm; đóng app thì không còn tiến trình con nào.
- [ ] Cài thử `Setup.exe` và chạy đủ 7 bước trên **máy sạch** (chờ máy ảo).
- [ ] Gắn electron-updater: đã có code (`updater.ts`, nguồn GitHub Releases của `PhcdY/9study-video-app`). Hiện báo 404 vì chưa có bản phát hành nào (hoặc repo đang private). Còn: để repo public, phát 0.1.0 rồi 0.1.1, xem máy sạch tự lên 0.1.1.
- [ ] Thử bỏ `codex-code-mode-host.exe` (81 MB) khỏi bản cài.

Bài thử: `npm test` (13 bài: luật thư mục, chọn bản, tiến trình git/npm, `.env`, che key, trích tham số). Chưa có bài thử chạy thật các bước tải/cài (cần mạng, làm trên máy ảo).

### Mốc 2, 3: chia việc chi tiết khi xong mốc 1, dựa trên kết quả mốc 0.

---

## 8. Rủi ro và cách giảm

| Rủi ro | Mức | Cách giảm |
| :--- | :--- | :--- |
| **Giao thức Codex app-server thay đổi** (một phần còn "experimental") | Cao | Ghim phiên bản Codex trong app. Sinh kiểu TS bằng `codex app-server generate-ts`. Không dùng API experimental. Mỗi lần nâng Codex chạy lại bài thử mốc 0. |
| **Sandbox Codex trên Windows** cần cài đặt thêm hoặc quyền admin | Cao, chưa rõ | Thử ở mốc 0 trên máy sạch. Nếu vướng thì đưa bước chuẩn bị sandbox vào màn cài đặt. |
| **SmartScreen** chặn app chưa ký ("Windows đã bảo vệ máy tính của bạn") | Chắc chắn gặp | Bản 1: chấp nhận, kèm ảnh hướng dẫn bấm "Thêm thông tin → Vẫn chạy" (chỉ lần cài đầu). Sau đó cân nhắc chữ ký số: chứng chỉ OV vài trăm USD/năm, hoặc dịch vụ ký trên cloud (cần kiểm tra cá nhân ở VN có đăng ký được không). |
| **Đường dẫn có dấu hoặc dấu cách** (`C:\Users\Nguyễn…`, `Video AI`) làm npm/Python lỗi | Trung bình | Mặc định thư mục không dấu, không cách. Bật `git config core.longpaths true`. Đặt `TEMP` và cache npm vào thư mục không dấu nếu tên người dùng có dấu. |
| **Hết ổ C**: bundle tạm của Remotion từng ăn 5,2 GB (xem `scripts/lib/bundle.mjs`) | Trung bình | Màn cài đặt kiểm tra dung lượng trống. Thêm nút dọn `out/_lam-viec` và thư mục tạm cũ. |
| **Hết lượt ChatGPT Plus**: skill rất dài (`viet-kich-ban` ~53 KB, `dung-video` ~55 KB, `lessons.md` ~51 KB) | Trung bình | Thanh lượt dùng, tự thu gọn sau mỗi bước, mỗi video một thread. Về lâu dài nên tỉa skill (lợi cho cả người không dùng app). |
| **CTV tự sửa file bộ công cụ** rồi cập nhật bị xung đột | Thấp | Tầng 2 của đổi phiên bản: giao cho skill `phien-ban`, vốn đã có quy trình cất bài và gộp. |
| **Repo video đổi cấu trúc**, app cũ đọc sai | Trung bình | File `app-compat.json`. Khi đổi chỗ để `script.json`, `out/`, storyboard thì phải tăng `minAppVersion`. |
| **Code AI viết mà bạn không đọc được** | Trung bình | Mỗi service một file, TypeScript strict. Bắt AI viết bài thử nhỏ cho `SetupService`, `VersionService`. Luôn thử trên máy sạch trước khi phát. Commit nhỏ. |
| **Phình phạm vi** ("đầy đủ tiện nghi") | Cao | Chỉ làm đúng danh sách tính năng bản 1. Ý mới ghi vào mục "Để sau", làm sau khi CTV đã dùng thật. |

---

## 9. Tối ưu

- **Ít bước cho CTV.** Mọi thứ máy dò được thì không hỏi: thư mục, Google Drive, bản mới nhất, cổng Studio. Mỗi bước chỉ còn một nút chính.
- **Tiết kiệm lượt ChatGPT.**
  - Mỗi video một thread, thu gọn sau mỗi bước.
  - Nút gọi đúng `$skill`, để Codex không phải tự đoán rồi đọc nhầm skill.
  - Không nạp tài liệu 3D/Maps khi không cần (AGENTS.md đã dặn).
- **Nhanh.**
  - Chỉ bật Codex khi mở màn video.
  - Giữ Remotion Studio chạy suốt phiên làm việc, không bật tắt mỗi lần xem.
  - Trình duyệt render tải sẵn ở bước cài đặt, không đợi đến lần render đầu.
- **Ít việc bảo trì.**
  - App không chứa luật làm video. Luật vẫn ở skill trong repo.
  - Bạn sửa skill như bây giờ, phát hành tag số, CTV bấm "Cập nhật". App chỉ phải phát hành lại khi đổi giao diện hoặc Codex.
- **Một nguồn sự thật.** App suy trạng thái từ file trong repo (script, storyboard, audio, mp4), không giữ cơ sở dữ liệu riêng. CTV dùng Codex ngoài app thì app vẫn hiểu đúng.

---

## 10. Câu hỏi đã chốt (20/11/2026)

- Tên app: tạm giữ **9Study Video**. Icon làm ở Mốc 3.
- Chữ ký số: **chưa** ở bản 1, chấp nhận cảnh báo SmartScreen kèm ảnh hướng dẫn.
- Góp ý của CTV: **để sau**. Bản 1 dùng nút "Gửi báo lỗi".
- Chế độ người phát triển: **không làm**. App chỉ cho chọn bản số.
