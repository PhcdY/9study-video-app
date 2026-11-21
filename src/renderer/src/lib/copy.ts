// Toan bo chu tieng Viet tren giao dien. Khong dung thuat ngu ky thuat (git, terminal, npm, sandbox...).
import type { ErrorCode, MachineCheck, SetupStepId, TaskId } from '../../../shared/types'
import type {
  AiStatus,
  ApprovalTitle,
  ChatErrorCode,
  ChipId,
  StatusLabel,
  VideoStage
} from '../../../shared/video'

export const copy = {
  appName: 'NiniStudio',
  appNameMain: 'Nini',
  appNameAccent: 'Studio',
  setupTitle: 'Chuẩn bị máy',
  progress: (done: number, total: number) => `Xong ${done} / ${total} bước`,
  stepOf: (n: number, total: number) => `Bước ${n} / ${total}`,
  optional: 'tuỳ chọn',
  appDoes: 'App tự làm',
  youDo: 'Bạn chỉ cần',
  retry: 'Thử lại',
  cancel: 'Dừng lại',
  skip: 'Bỏ qua, làm sau',
  canLeave: 'Bạn có thể để app chạy và làm việc khác.',
  loading: 'Đang xem máy đã chuẩn bị tới đâu…',
  appUpdate: {
    pill: 'Cập nhật app',
    title: (v: string) => `Bản app ${v} đã sẵn sàng`,
    sub: (cur: string) => `Đã tải xong · bạn đang dùng ${cur}`,
    whatsNew: 'Có gì mới',
    seeAll: 'Xem tất cả',
    restartNow: 'Khởi động lại ngay',
    later: 'Để sau',
    restartAnyway: 'Vẫn khởi động lại',
    note: 'Bài của bạn giữ nguyên. Để sau thì app tự cập nhật khi bạn tắt app.',
    busy: (titles: string[]) =>
      `AI đang làm việc ở bài ${titles.map((x) => `"${x}"`).join(', ')}. Khởi động lại bây giờ sẽ dừng việc đó.`,
    ready: (v: string) => `${v} đã tải xong`,
    whatsNewIn: (v: string) => `Có gì mới trong ${v}`,
    restart: 'Khởi động lại để cập nhật'
  },

  steps: {
    thuMuc: {
      nav: 'Chọn chỗ lưu',
      title: 'Chọn chỗ lưu',
      desc: 'App cần một thư mục để lưu bộ công cụ làm video và các bài của bạn.',
      appDoes: 'Tạo thư mục và kiểm tra ổ đĩa còn đủ chỗ (cần khoảng 15 GB).',
      youDo: 'Giữ thư mục gợi ý, hoặc chọn thư mục khác không dấu, không dấu cách.',
      primary: 'Dùng thư mục này',
      secondary: 'Đổi thư mục',
      fieldLabel: 'Thư mục lưu',
      existingTitle: 'Máy bạn đã có bộ công cụ',
      existingDesc:
        'App tìm thấy bộ công cụ làm video trên máy. Dùng luôn bộ này thì không phải tải lại, bài cũ của bạn vẫn giữ nguyên.',
      existingReady: 'Đã cài đủ, dùng được ngay',
      existingPartial: 'Cần cài thêm thư viện (vài phút)',
      useExisting: 'Dùng bộ có sẵn',
      newInstead: 'Tải bộ mới vào chỗ khác',
      backToExisting: 'Dùng bộ có sẵn trên máy'
    },
    taiDuAn: {
      nav: 'Tải bộ công cụ',
      title: 'Tải bộ công cụ về máy',
      desc: 'Bộ công cụ gồm các mẫu hình, luật viết kịch bản và trợ lý làm video, luôn ở bản mới nhất.',
      appDoes: 'Tải bộ công cụ bản mới nhất vào thư mục bạn vừa chọn.',
      youDo: 'Bấm Bắt đầu tải rồi chờ khoảng 1–2 phút.',
      primary: 'Bắt đầu tải',
      running: 'Đang tải bộ công cụ…'
    },
    caiThuVien: {
      nav: 'Cài thư viện',
      title: 'Cài thư viện',
      desc: 'Các thư viện giúp dựng hình, ghép giọng đọc và xuất video.',
      appDoes: 'Cài thư viện làm video và trình duyệt dùng để xuất video.',
      youDo: 'Bấm Cài đặt rồi để app chạy, khoảng 3–5 phút.',
      primary: 'Cài đặt',
      running: 'Đang cài thư viện…',
      detail: {
        thuVien: 'Đang cài thư viện…',
        trinhDuyet: 'Đang tải trình duyệt xuất video…'
      } as Record<string, string>
    },
    dangNhap: {
      nav: 'Đăng nhập ChatGPT',
      title: 'Đăng nhập ChatGPT',
      desc: 'Trợ lý AI dùng luôn tài khoản ChatGPT bạn đang có (Free, Plus hay Pro đều được). Không tốn thêm tiền.',
      appDoes: 'Mở trang đăng nhập của OpenAI trong trình duyệt của bạn.',
      youDo: 'Đăng nhập tài khoản ChatGPT, rồi bấm Tiếp tục.',
      primary: 'Đăng nhập',
      running: 'Đang chuẩn bị…',
      waiting: 'Đang chờ bạn đăng nhập trên trình duyệt…',
      waitingSub: 'App tự chuyển sang bước tiếp theo khi xong. Không cần quay lại bấm gì.',
      reopen: 'Mở lại trang đăng nhập',
      safeMode: 'Đang chuẩn bị chỗ làm việc an toàn cho trợ lý AI…',
      noAccount: 'Chưa có tài khoản ChatGPT?',
      signedIn: (email: string) => `Đã đăng nhập: ${email}`
    },
    keyGiong: {
      nav: 'Key giọng đọc',
      title: 'Key giọng đọc Vivibe',
      desc: 'Key Vivibe dùng để tạo giọng đọc cho video. Chưa có thì bỏ qua, thêm sau trong Cài đặt.',
      appDoes: 'Gọi thử Vivibe để chắc key dùng được, rồi lưu lại trên máy bạn.',
      youDo: 'Dán key Vivibe vào ô bên dưới.',
      primary: 'Kiểm tra và lưu',
      running: 'Đang kiểm tra key…',
      fieldLabel: 'Key Vivibe',
      placeholder: 'Dán key vào đây',
      whereToGet: 'Lấy key ở đâu?',
      saved: (masked: string) => `Đã lưu key ${masked}`
    },
    googleDrive: {
      nav: 'Google Drive',
      title: 'Google Drive',
      desc: 'Video làm xong và góp ý cho đội đều đi qua Google Drive.',
      appDoes:
        'Tải bộ cài Google Drive cho máy tính từ trang của Google, kiểm tra đúng file của Google rồi mở bộ cài.',
      youDo:
        'Windows hỏi "Cho phép cài?" thì bấm Có. Cửa sổ Drive hiện ra thì đăng nhập Google bằng tài khoản đội đã chia sẻ thư mục cho bạn.',
      primary: 'Tải và cài Google Drive',
      running: 'Đang cài Google Drive…',
      selfInstall: 'Tôi tự cài Drive',
      waiting: 'App tự thấy khi bạn cài và đăng nhập xong.'
    },
    gopY: {
      nav: 'Thư mục góp ý chung',
      title: 'Thư mục góp ý chung',
      desc: 'Khi thấy lỗi lặp lại, bạn gửi góp ý vào thư mục này. Người phụ trách bộ công cụ đọc ở đó rồi sửa cho cả đội.',
      appDoes: 'Tìm thư mục 9Study_GopY trong Google Drive trên máy, mỗi vài giây một lần.',
      youDo: 'Làm theo 4 bước bên dưới để thư mục của đội hiện trong Drive của bạn.',
      primary: 'Tìm lại',
      running: 'Đang tìm…',
      searching:
        'Chưa thấy thư mục 9Study_GopY trong Drive của bạn. App đang tìm lại mỗi vài giây.',
      found: (dir: string) => `Đã kết nối: ${dir}`,
      open: 'Mở thư mục của đội',
      step1: 'Mở thư mục góp ý của đội trên trình duyệt.',
      step2: 'Drive báo chưa có quyền thì bấm "Yêu cầu quyền truy cập", chờ người phụ trách duyệt.',
      step3:
        'Vào được thư mục rồi thì bấm chuột phải vào tên thư mục › Sắp xếp › Thêm lối tắt › Drive của tôi.',
      step4: 'Quay lại app. Khoảng nửa phút sau app tự thấy thư mục.',
      pickOther: 'Chọn thư mục khác',
      later: 'Bỏ qua, làm sau'
    },
    noiLuu: {
      nav: 'Nơi lưu video',
      title: 'Nơi lưu video',
      desc: 'Video làm xong sẽ được lưu vào đây.',
      appDoesDrive:
        'Đã tìm thấy Google Drive trên máy. Lưu vào Drive để video tự đồng bộ lên mạng.',
      appDoesLocal: 'Không thấy Google Drive trên máy, nên gợi ý một thư mục ngay trên máy.',
      youDo: 'Giữ chỗ gợi ý, hoặc chọn chỗ khác.',
      primary: 'Lưu vào đây',
      secondary: 'Đổi chỗ lưu',
      fieldLabel: 'Chỗ lưu video'
    },
    kiemTra: {
      nav: 'Kiểm tra máy',
      title: 'Kiểm tra máy',
      desc: 'Kiểm tra lần cuối xem mọi thứ đã chạy được chưa.',
      appDoes: 'Thử từng công cụ và xem ổ đĩa còn đủ chỗ không.',
      youDo: 'Bấm Kiểm tra và chờ vài giây.',
      primary: 'Kiểm tra',
      running: 'Đang kiểm tra…'
    }
  } satisfies Record<SetupStepId, unknown>,

  tasks: {
    taiBoCongCu: { label: 'Tải bộ công cụ làm video', hint: 'khoảng 10 MB' },
    layDanhSachBan: { label: 'Xem các bản đã phát hành', hint: 'vài giây' },
    chuyenBanMoi: { label: 'Chuyển sang bản mới nhất', hint: 'vài giây' },
    taiThuVien: { label: 'Tải thư viện dựng video', hint: 'khoảng 350 gói' },
    caiThuVien: { label: 'Cài thư viện vào máy', hint: 'khoảng 1 phút' },
    taiTrinhDuyet: { label: 'Tải trình duyệt dùng để xuất video', hint: 'khoảng 280 MB trên ổ' },
    dangNhap: { label: 'Đăng nhập tài khoản ChatGPT', hint: 'bạn đăng nhập trên trình duyệt' },
    cheDoAnToan: { label: 'Bật chế độ an toàn cho trợ lý AI', hint: 'vài giây' },
    taiDrive: { label: 'Tải bộ cài Google Drive', hint: 'khoảng 300 MB' },
    caiDrive: { label: 'Cài Google Drive', hint: 'bấm Có khi Windows hỏi' },
    dangNhapDrive: { label: 'Đăng nhập Google trên cửa sổ Drive', hint: 'bạn làm' },
    chepBoCongCu: { label: 'Chép bộ công cụ và video sang thư mục mới', hint: 'vài phút' },
    nhanTroChuyen: { label: 'Gắn trò chuyện cũ vào video', hint: 'vài giây' },
    congCredit: { label: 'Cộng credit Vivibe đã dùng', hint: 'vài giây' }
  } satisfies Record<TaskId, { label: string; hint: string }>,
  gopYCheck: {
    why: {
      chuaCo: () => 'Chưa kết nối thư mục góp ý của đội.',
      khongCoDrive: () => 'Máy chưa có Google Drive, hoặc Drive đang tắt.',
      ngoaiDrive: (dir?: string) =>
        `Thư mục ${dir ?? ''} không nằm trong Google Drive nên không đồng bộ cho đội.`,
      khongPhaiCuaDoi: (dir?: string) =>
        `Thư mục ${dir ?? ''} không phải thư mục chung của đội (có thể là thư mục bạn tự tạo).`,
      mat: (dir?: string) => `Không thấy thư mục ${dir ?? ''}. Google Drive có thể đang tắt.`
    },
    warnTitle: 'Góp ý của bạn chưa tới được đội',
    fix: 'Sửa giúp tôi',
    ok: 'Đã kết nối',
    wrong: 'Chưa đúng',
    mark: 'Đánh dấu thư mục của đội',
    banner: 'Chưa kết nối thư mục góp ý của đội.',
    bannerSub: 'Góp ý và báo lỗi của bạn chưa tới được người phụ trách.',
    connect: 'Kết nối ngay',
    later: 'Để sau',
    title: 'Kết nối thư mục góp ý của đội',
    sub: 'App kiểm tra lại vài giây một lần. Làm xong bước nào, bước đó tự tích.',
    s1: 'Google Drive đã cài và đăng nhập',
    s1Ok: (drive: string) => `Thấy ${drive}`,
    s1No: 'Chưa thấy Google Drive trên máy.',
    installDrive: 'Cài Google Drive',
    s2: 'Thêm thư mục của đội vào Drive của tôi',
    s2Lines: [
      'Bấm "Mở thư mục của đội" (xin quyền nếu Drive hỏi).',
      'Chuột phải vào thư mục 9Study_GopY › Sắp xếp › Thêm lối tắt › Drive của tôi.'
    ],
    s3: 'App nhận ra thư mục của đội',
    s3Wait: (drive?: string) =>
      drive ? `Đang chờ thư mục xuất hiện trong ${drive}…` : 'Đang chờ…',
    s3NotTeam:
      'Thư mục này chưa có dấu của đội. Nếu đúng là thư mục chung, nhờ người phụ trách bấm "Đánh dấu thư mục của đội".',
    pickManual: 'Chọn thư mục bằng tay',
    close: 'Đóng',
    done: 'Đã kết nối đúng thư mục của đội.'
  },
  legacy: {
    title: 'Bạn đã làm video trước đây',
    found: (dir: string) => `App tìm thấy bộ công cụ cũ ở ${dir}. Nhận lại những gì bạn muốn giữ:`,
    scanning: 'Đang tìm dữ liệu cũ…',
    scanned: (done: number, total: number) => `Đã đọc ${done} / ${total} cuộc trò chuyện`,
    scanFail: 'Chưa đọc được thư mục này. Thử chọn lại thư mục.',
    videos: (n: number) => `${n} video bạn đã làm`,
    videosSub: (unfinished: number) =>
      unfinished
        ? `Kịch bản, storyboard, giọng đọc. ${unfinished} video còn dở hiện ở "Bài của bạn" để làm tiếp.`
        : 'Kịch bản, storyboard, giọng đọc, video đã xuất.',
    copyVideos: 'Chép các video chưa có sang thư mục đang dùng',
    key: 'Key giọng đọc Vivibe',
    keySub: 'Lấy từ file .env của thư mục cũ.',
    keyHave: 'Đã có',
    chats: (n: number) => `${n} cuộc trò chuyện với AI`,
    chatsSub: (codex: number, claude: number) =>
      [
        codex ? `${codex} cuộc với Codex mở tiếp được` : '',
        claude ? `${claude} cuộc với Claude Code chỉ xem lại` : ''
      ]
        .filter(Boolean)
        .join(', ') + '. Gắn vào đúng video.',
    voice: 'Credit Vivibe đã dùng',
    voiceSub: (runs: number, since?: number) =>
      `${runs} lần tạo giọng trong trò chuyện cũ${
        since
          ? `, từ ${String(new Date(since).getMonth() + 1).padStart(2, '0')}/${new Date(since).getFullYear()}`
          : ''
      }. Cộng vào thống kê theo tháng và theo video.`,
    chars: (n: number) => `≈ ${n.toLocaleString('vi-VN')} ký tự`,
    size: (b: number) =>
      b >= 1024 ** 3
        ? `${(b / 1024 ** 3).toFixed(1).replace('.', ',')} GB`
        : `${Math.max(1, Math.round(b / 1024 ** 2))} MB`,
    copyWarn: (target: string) =>
      `Tên thư mục cũ có dấu cách hoặc có dấu, dễ lỗi khi xuất video. App chép sang ${target}, thư mục cũ giữ nguyên.`,
    take: 'Nhận dữ liệu',
    pickOther: 'Chọn thư mục khác',
    fresh: 'Bắt đầu mới, không nhận',
    running: 'Đang nhận dữ liệu cũ',
    doneTitle: 'Đã nhận dữ liệu cũ',
    tileVideos: 'video',
    tileChats: 'cuộc trò chuyện cũ',
    tileChars: 'ký tự Vivibe đã dùng',
    tileKey: 'key giọng đọc',
    keyNone: 'Chưa có',
    nothing: 'Thư mục này không có video, trò chuyện hay key nào để nhận.',
    continue: 'Tiếp tục cài đặt',
    oldStill: (dir: string, size: string) => `Thư mục cũ ${dir} vẫn còn · ${size}`,
    oldStillSub: (target: string) => `Mọi thứ đã chép sang ${target} và kiểm tra đủ file.`,
    oldRemove: 'Bỏ thư mục cũ',
    oldConfirm: (dir: string) => `Chuyển ${dir} vào Thùng rác?`,
    oldConfirmLines: [
      'Video, giọng đọc, key đã có ở thư mục mới.',
      'Lấy lại được trong Thùng rác của Windows.',
      'Trò chuyện cũ vẫn xem được trong app.'
    ],
    oldConfirmBtn: 'Chuyển vào Thùng rác',
    oldKeep: 'Giữ lại',
    oldWindows: 'Thư mục quá lớn so với Thùng rác thì Windows hỏi trước khi xoá hẳn.',
    oldRemoved: 'Đã chuyển thư mục cũ vào Thùng rác.',
    oldNotRemoved: 'Thư mục cũ vẫn còn (bạn đã huỷ hoặc Windows chưa chuyển được).',
    settingsRow: 'Dữ liệu từ thư mục cũ',
    settingsOpen: 'Nhận dữ liệu cũ',
    settingsPick: 'Thư mục cũ',
    settingsBrowse: 'Chọn thư mục…',
    oldChats: (n: number) => `Trò chuyện cũ · ${n}`,
    generalChats: (n: number) => `Trò chuyện cũ chung · ${n}`,
    source: { codex: 'Codex', claude: 'Claude Code' },
    viewOnly: (src: string, date: string) => `Trò chuyện cũ với ${src} · ${date} · chỉ xem`,
    back: 'Về trò chuyện hiện tại',
    resume: 'Mở tiếp',
    resuming: 'Đang mở…',
    resumeFail: 'Codex không mở lại được cuộc này. Bạn vẫn xem lại được.',
    viewing: 'Đang xem trò chuyện cũ',
    view: 'Xem',
    close: 'Đóng',
    you: 'Bạn',
    ai: 'AI'
  },
  taskStatus: {
    waiting: 'Chờ',
    skipped: 'Máy đã có sẵn',
    error: 'Bị lỗi',
    version: (v: string) => `Bản ${v}`,
    sandboxOff: 'Chưa bật được, AI sẽ hỏi trước mỗi việc'
  },
  willDo: 'Những gì app sẽ làm',
  doing: 'Đang làm',
  didDo: 'Đã làm',
  mb: (n: number) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`,
  goi: (n: number) => `${n.toLocaleString('vi-VN')} gói`,
  speed: (n: number) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB/giây`,

  checks: {
    oDia: 'Ổ chứa bài còn trống',
    oC: 'Ổ C còn trống',
    node: 'Công cụ dựng video',
    python: 'Công cụ kiểm kịch bản',
    git: 'Công cụ giữ các bản',
    troLy: 'Trợ lý AI',
    trinhDuyet: 'Trình duyệt xuất video',
    hopCat: 'Chế độ an toàn của trợ lý AI'
  } satisfies Record<MachineCheck['id'], string>,
  checkWarn: {
    oC: 'Ổ C sắp đầy, máy có thể chậm khi xuất video.',
    trinhDuyet: 'Chưa có trình duyệt xuất video. App sẽ tải khi bạn xuất video lần đầu.',
    hopCat: 'Trợ lý AI sẽ hỏi bạn trước mỗi việc. Vẫn làm video bình thường.'
  } as Partial<Record<MachineCheck['id'], string>>,
  gb: (n: string) => `${n} GB`,

  ready: {
    title: 'Máy bạn đã sẵn sàng',
    desc: 'Mọi thứ đã chuẩn bị xong. Từ giờ bạn chỉ cần mở app và bắt đầu làm video.',
    primary: 'Bắt đầu làm video',
    homeTitle: 'Video của tôi',
    homeSoon: 'Màn làm video đang được hoàn thiện ở bản sau.'
  },

  errors: {
    mang: 'Không kết nối được mạng. Kiểm tra wifi rồi thử lại.',
    thuMucCoDau:
      'Tên thư mục có dấu tiếng Việt. Hãy chọn thư mục không dấu, ví dụ D:\\9Study\\VideoAI.',
    thuMucCoDauCach:
      'Tên thư mục có dấu cách. Hãy chọn thư mục viết liền, ví dụ D:\\9Study\\VideoAI.',
    thuMucOneDrive: 'Thư mục này nằm trong OneDrive, dễ lỗi khi đồng bộ. Hãy chọn chỗ khác.',
    thuMucHeThong:
      'Không lưu được ở chỗ này. Hãy chọn một thư mục trên ổ D hoặc C, ví dụ D:\\9Study\\VideoAI.',
    thuMucCoSan: 'Thư mục này đã có file khác. Hãy chọn một thư mục trống.',
    khongGhiDuoc: 'App không ghi được vào chỗ này. Hãy chọn chỗ khác.',
    khongDuCho: 'Ổ đĩa còn chưa tới 15 GB trống. Hãy dọn bớt hoặc chọn ổ khác.',
    caiThuVienLoi: 'Cài thư viện chưa xong. Thử lại thường sẽ được.',
    taiTrinhDuyetLoi: 'Chưa tải được trình duyệt xuất video. Thử lại thường sẽ được.',
    dangNhapLoi: 'Chưa đăng nhập được. Bấm Thử lại để mở lại trang đăng nhập.',
    keySai: 'Key này không dùng được. Kiểm tra lại đã chép đủ key chưa.',
    keyTrong: 'Bạn chưa dán key.',
    mayChuaSan: 'Máy còn thiếu vài thứ, xem danh sách bên dưới.',
    taiDriveLoi:
      'Chưa thấy Google Drive trên máy. Cài và đăng nhập xong thì bấm Thử lại, hoặc bấm "Tôi tự cài Drive".',
    driveKhongHopLe:
      'File tải về không phải bộ cài của Google nên app không mở. Bấm "Tôi tự cài Drive" để tải từ trang Google.',
    chuaThayGopY: 'Chưa thấy thư mục góp ý trong Drive. Làm theo các bước bên dưới.',
    khongRo: 'Có lỗi ngoài dự kiến. Bấm Thử lại; nếu vẫn lỗi, hãy báo cho người phụ trách.'
  } satisfies Record<ErrorCode, string>,

  // ---------- Video cua toi ----------
  nav: { videos: 'Video', settings: 'Cài đặt', guide: 'Hướng dẫn' },
  home: {
    continueTitle: 'Làm tiếp',
    continueBtn: 'Làm tiếp',
    allTitle: (n: number) => `Bài của bạn · ${n}`,
    samplesTitle: (n: number) => `Video mẫu của bộ công cụ · ${n}`,
    samplesHint: 'Video làm sẵn để xem cách làm. Bạn mở xem được, nhưng đừng sửa.',
    search: 'Tìm bài',
    allSubjects: 'Tất cả môn',
    newVideo: 'Làm video mới',
    emptyTitle: 'Chưa có video nào',
    emptyDesc:
      'Bấm Làm video mới để bắt đầu. AI sẽ cùng bạn viết kịch bản, duyệt hình rồi tạo giọng đọc.',
    colLesson: 'Bài',
    colSubject: 'Môn',
    colStep: 'Bước',
    colStatus: 'Trạng thái',
    step: (n: number, name: string) => `Bước ${n}/3 · ${name}`,
    noScript: 'Chưa có kịch bản',
    exported: 'Đã xuất video',
    ai: {
      dang: 'Đang chạy',
      cho: 'Chờ bạn duyệt',
      dung: 'Đã dừng',
      loi: 'Gặp lỗi'
    } satisfies Record<AiStatus, string>,
    colUpdated: 'Cập nhật',
    drop: 'Bỏ video',
    dropTitle: 'Bỏ video đang dở này?',
    dropDesc: 'Cuộc trò chuyện với AI về video này cũng mất. Không lấy lại được.',
    dropCancel: 'Giữ lại',
    colActions: 'Thao tác',
    dropLabel: (t: string) => `Bỏ video đang dở: ${t}`,
    updatedAt: (ms: number) => {
      const d = new Date(ms)
      const now = new Date()
      if (d.toDateString() === now.toDateString())
        return `Sửa lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay`
      return `Sửa ngày ${d.toLocaleDateString('vi-VN')}`
    },
    shortDate: (ms: number) => {
      const d = new Date(ms)
      return d.toDateString() === new Date().toDateString()
        ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    },
    toolkit: (v?: string) => (v ? `Bộ công cụ bản ${v}` : 'Bộ công cụ'),
    savedAt: (p: string) => `Video lưu tại ${p}`,
    lop: (n?: number) => (n ? `Lớp ${n}` : ''),
    loai: (l?: string) => (l === 'hien-tuong' ? 'Hiện tượng' : l === 'bai-hoc' ? 'Bài học' : '')
  },
  stage: {
    kichBan: 'Kịch bản',
    duyetHinh: 'Duyệt hình',
    giongDoc: 'Giọng đọc và xuất',
    daXuat: 'Đã xuất'
  } satisfies Record<VideoStage, string>,
  stageStatus: {
    kichBan: 'Đang viết kịch bản',
    duyetHinh: 'Đang duyệt hình',
    giongDoc: 'Đang làm giọng đọc',
    daXuat: 'Đã xuất video'
  } satisfies Record<VideoStage, string>,

  // ---------- Lam video moi ----------
  newVideo: {
    title: 'Làm video mới',
    back: 'Video của tôi',
    part1: 'Video về bài nào',
    part2: 'Giọng đọc Vivibe',
    part2Hint: 'Đổi được tới trước khi tạo giọng ở bước 3',
    part3: 'Tuỳ chọn nâng cao',
    part3Hint: 'Không bắt buộc',
    subject: 'Môn',
    lop: 'Lớp',
    loai: 'Loại video',
    baiHoc: 'Bài học',
    baiHocHint: 'Dạy đủ một bài SGK',
    hienTuong: 'Hiện tượng',
    hienTuongHint: 'Trả lời một câu "vì sao"',
    bai: 'Bài trong SGK',
    baiPick: 'Chọn bài',
    baiOther: 'Bài khác (gõ tên bài)',
    baiPlaceholder: 'Ví dụ: Bài 1. Tính đơn điệu và cực trị của hàm số',
    hasCard: 'Đã có thẻ bài học cho bài này. AI dạy đủ các mục trong thẻ.',
    noCard: 'Chưa có thẻ bài học cho bài này. AI sẽ soạn thẻ cùng bạn trước.',
    cauHoi: 'Câu hỏi "vì sao" của video',
    cauHoiPlaceholder: 'Ví dụ: Vì sao muối làm đá tan nhanh hơn?',
    yBanChat: 'Ý bản chất muốn học sinh hiểu (không bắt buộc)',
    yBanChatHint: 'Để trống thì AI đề xuất 2–3 góc nhìn cho bạn chọn.',
    voiceSuggested: (mon: string) => `Gợi ý cho ${mon}`,
    voiceDesc: {
      'nam - c Bình': 'Dứt khoát, logic. Hợp Toán, Lý, Hóa, Sinh.',
      'nữ - c Nhi': 'Ấm, truyền cảm. Hợp Sử, Địa, Văn, KTPL.',
      'anh-male': 'Giọng bản xứ, chuẩn phát âm. Hợp Tiếng Anh.'
    } as Record<string, string>,
    voiceOther: 'Giọng khác trên tài khoản Vivibe của bạn (gõ tên giọng)',
    voicePerScene:
      'Đổi giọng theo nhân vật hoặc theo cảnh (ví dụ hội thoại tiếng Anh dùng giọng bản xứ)',
    viewer: 'Người xem',
    exams: 'Kỳ thi nhắm tới',
    daHoc: 'Học sinh đã học gì',
    chuaHoc: 'Chưa học gì',
    studentHint: '"Học sinh ảo" dùng đúng hai ô này để đọc thử kịch bản như người xem thật.',
    videoTruoc: 'Video trước trong chuỗi',
    videoTruocNone: 'Không có',
    videoTruocHint: 'AI đọc video đó để không dạy lại và nối tiếp đúng chỗ.',
    story: 'Cách kể',
    moDau: 'Mở đầu bằng',
    moDauOpts: {
      aiChon: 'Để AI chọn',
      hienTuong: 'Hiện tượng đời thực',
      cauDeThi: 'Một câu đề thi',
      hieuSai: 'Cách hiểu sai phổ biến'
    },
    goiYMoDau: 'Gợi ý hiện tượng / câu hỏi mở đầu',
    viDu: 'Ví dụ xuyên suốt muốn dùng',
    doDai: 'Độ dài',
    doDaiOpts: { ai: 'Để AI chọn (2:30–4:00)', gon: 'Gọn, khoảng 2:30', ky: 'Kỹ, khoảng 4:00' },
    examContent: 'Nội dung thi',
    loiHayMac: 'Lỗi học sinh hay mắc',
    loiHayMacHint: 'Thành đoạn "Bẫy thường gặp" trong video.',
    dangBaiThi: 'Dạng bài trong đề thi muốn có',
    dangBaiThiHint: 'Thành đoạn "Trong đề thi".',
    docs: 'Tài liệu và ghi chú',
    attach: 'Chọn ảnh SGK, câu đề thi, ảnh chụp bảng… (ảnh hoặc PDF)',
    attachBtn: 'Chọn tệp',
    ghiChu: 'Ghi chú khác cho AI',
    submit: 'Bắt đầu viết kịch bản',
    cancel: 'Huỷ',
    remember: 'App nhớ lựa chọn này cho video sau.',
    whatNext: 'Bấm xong thì sao?',
    whatNextSteps: [
      'AI đọc SGK và trình Bảng nội dung: dạy gì, ở đoạn nào, bằng hình gì.',
      'Bạn gạch hoặc thêm ý. Đây là lúc sửa rẻ nhất.',
      'AI viết kịch bản, tự kiểm tra lỗi và nhờ "học sinh ảo" đọc thử.'
    ],
    whatNextNote:
      'Bước 1 và 2 không tốn credit giọng đọc. Giọng chỉ được tạo ở bước 3, sau khi bạn đồng ý.',
    needBai: 'Hãy chọn hoặc gõ tên bài.',
    needCauHoi: 'Hãy gõ câu hỏi của video.'
  },

  // ---------- Man mot video ----------
  workspace: {
    readWrong: 'Đọc sai',
    back: 'Về Video của tôi',
    newTitle: 'Video mới',
    newSub: 'AI đang soạn Bảng nội dung',
    tabs: {
      kichBan: 'Kịch bản',
      storyboard: 'Storyboard',
      chuyenDong: 'Xem chuyển động',
      giongDoc: 'Nghe thử',
      thanhPham: 'Thành phẩm'
    },
    noScript: 'Chưa có kịch bản. AI sẽ tạo sau khi bạn duyệt Bảng nội dung.',
    scene: (n?: number) => (n ? `Cảnh ${n}` : ''),
    colLine: 'Câu',
    colSpeak: 'Lời đọc',
    colText: 'Chữ trên hình',
    noStoryboard:
      'Chưa có storyboard. Duyệt kịch bản xong, AI sẽ dựng bản nháp và xuất storyboard.',
    storyboardStale: 'Hình vừa sửa chưa có trong storyboard này. Xuất lại để xem bản mới.',
    storyboardStaleBusy:
      'Hình vừa sửa chưa có trong storyboard này. AI làm xong mà vẫn vậy thì bấm "Xuất lại storyboard".',
    studioStart: 'Mở bản xem chuyển động',
    studioStarting: 'Đang mở bản xem chuyển động… lần đầu mất khoảng 10–30 giây.',
    studioError: 'Chưa mở được bản xem chuyển động. Bấm thử lại; nếu vẫn lỗi, hãy gửi báo lỗi.',
    studioHint: 'Chọn tên video ở cột trái của khung bên dưới để xem.',
    noAudio: 'Chưa có giọng đọc. Duyệt hình xong, AI sẽ tạo các câu nghe thử.',
    audioCount: (n: number) => `${n} câu đã có giọng đọc`,
    noFinal: 'Chưa xuất video. Nghe giọng đọc ổn thì bấm "Xuất video" bên khung chat.',
    openFolder: 'Mở thư mục',
    retry: 'Thử lại'
  },
  chat: {
    label: 'Trò chuyện với trợ lý AI',
    placeholder: 'Nhắn cho AI, ví dụ: cảnh 3 đổi màu đường cong sang chàm',
    send: 'Gửi',
    stop: 'Dừng',
    thinking: 'AI đang làm…',
    empty: 'Nhắn cho AI hoặc bấm một nút gợi ý bên dưới.',
    resumeDraft: 'Làm tiếp kịch bản',
    you: 'Bạn',
    status: {
      docTaiLieu: 'Đang đọc tài liệu',
      timTaiLieu: 'Đang tìm trong tài liệu',
      kiemKichBan: 'Đang kiểm tra kịch bản',
      xuatStoryboard: 'Đang xuất storyboard',
      kiemBoCuc: 'Đang kiểm tra bố cục',
      chupAnh: 'Đang chụp ảnh soát',
      taoGiong: 'Đang tạo giọng đọc',
      canTu: 'Đang căn lời với giọng đọc',
      xuatVideo: 'Đang xuất video',
      kiemLoi: 'Đang kiểm tra lỗi',
      suaFile: 'Đang sửa bài',
      xemBan: 'Đang xem các bản',
      hocSinhAo: 'Học sinh ảo đang đọc thử',
      lamViec: 'Đang làm việc'
    } satisfies Record<StatusLabel, string>,
    // "Đang kiểm tra kịch bản" -> "Đã kiểm tra kịch bản"; "Học sinh ảo đang đọc thử" -> "... đã đọc thử"
    statusDone: (label: string, n: number) => {
      const done =
        label === 'Đang làm việc'
          ? 'Đã làm xong'
          : label.replace(/^Đang /, 'Đã ').replace(/ đang /, ' đã ')
      return n > 1 ? `${done} (${n} việc)` : done
    },
    statusFailed: (label: string) =>
      `${label.replace(/^Đang /, '').replace(/^./, (c) => c.toUpperCase())}: có việc chưa chạy được`,
    approval: {
      congCu: 'AI muốn dùng công cụ của bộ công cụ',
      taoGiong: 'Tạo giọng đọc cho bài',
      taoLaiGiong: 'Tạo lại giọng đọc cho vài câu',
      xuatVideo: 'Xuất video',
      doiBan: 'Đổi phiên bản bộ công cụ',
      caiThuVien: 'Cài thêm thư viện',
      mang: 'Truy cập mạng',
      suaFile: 'Sửa file trong bài',
      lenhLa: 'AI muốn chạy lệnh này'
    } satisfies Record<ApprovalTitle, string>,
    costly: 'Việc này tốn credit Vivibe',
    costlyHint: 'Chỉ đồng ý khi các câu nghe thử đã ổn.',
    // "Đang kiểm tra kịch bản" -> "Cho phép AI kiểm tra kịch bản"
    approvalTool: (viec: string) => `Cho phép AI ${viec.replace(/^Đang\s+/, '')}`,
    accept: 'Đồng ý',
    acceptAlways: 'Luôn cho phép việc này',
    decline: 'Để sau',
    accepted: 'Đã đồng ý',
    acceptedAlways: 'Đã cho phép cho cả buổi làm việc',
    declined: 'Đã từ chối',
    errors: {
      hetLuot: 'Đã dùng hết Usage của ChatGPT. Chờ tới giờ Usage làm mới rồi nhắn lại.',
      mang: 'Mất kết nối mạng giữa chừng. Kiểm tra wifi rồi nhắn lại.',
      chuaDangNhap: 'Phiên đăng nhập ChatGPT đã hết. Vào Cài đặt để đăng nhập lại.',
      khongRo: 'AI gặp lỗi ngoài dự kiến. Nhắn lại thường sẽ được; nếu vẫn lỗi, hãy gửi báo lỗi.'
    } satisfies Record<ChatErrorCode, string>,
    chips: {
      duyetKichBan: 'Duyệt kịch bản, sang bước 2',
      kiemKichBan: 'Kiểm tra lại kịch bản',
      hocSinhAoKichBan: 'Nhờ học sinh ảo đọc thử',
      duyetHinh: 'Duyệt hình, sang bước 3',
      xuatLaiStoryboard: 'Xuất lại storyboard',
      hocSinhAoHinh: 'Nhờ học sinh ảo xem',
      nghiOnDungHoanChinh: 'Giọng ổn, dựng bản hoàn chỉnh',
      xuatVideo: 'Xuất video',
      xuatLaiVideo: 'Xuất lại video'
    } satisfies Record<ChipId, string>
  },

  // Chon model va muc suy nghi: giu chu tieng Anh nhu app Codex goc
  ai: {
    model: 'Model',
    effort: 'Reasoning effort',
    defaultModel: 'Default',
    defaultModelHint: 'Recommended set of models',
    defaultTag: '(default)',
    effortName: (id: string): string =>
      ({
        none: 'None',
        minimal: 'Minimal',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        xhigh: 'Extra high',
        max: 'Max',
        ultra: 'Ultra'
      })[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
    settingsTitle: 'AI làm bài',
    settingsHint: 'Bài mới dùng lựa chọn này. Bài đã chọn riêng trong khung chat thì giữ nguyên.',
    settingsEmpty:
      'Chưa lấy được danh sách model. Kiểm tra mạng và đăng nhập ChatGPT rồi mở lại Cài đặt.'
  },

  // ---------- Moc 3 ----------
  usage: {
    title: 'Usage',
    chatgpt: 'ChatGPT',
    // Ten goi theo dung cach OpenAI viet: ChatGPT Free / Plus / Pro / Business...
    plan: (p?: string) => {
      if (!p) return 'ChatGPT'
      const name: Record<string, string> = { edu: 'Edu', team: 'Team', k12: 'K-12' }
      return `ChatGPT ${name[p.toLowerCase()] ?? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}`
    },
    // Do dai cua so tinh luot: 300 phut = 5 gio, 10080 = tuan, 43200 = 30 ngay
    windowShort: (m: number | null) =>
      !m ? '' : m <= 60 * 24 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`,
    windowLong: (m: number | null) =>
      !m
        ? 'Limit'
        : m <= 60 * 24
          ? `${Math.round(m / 60)}-hour limit`
          : m === 60 * 24 * 7
            ? 'Weekly limit'
            : `${Math.round(m / 1440)}-day limit`,
    used: (n: number) => `${n}% used`,
    resets: (ms: number) => {
      const d = new Date(ms)
      const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      if (d.toDateString() === new Date().toDateString()) return `Resets at ${t}`
      return `Resets ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${t}`
    },
    unknown: 'Chưa đọc được Usage. Thử lại sau ít phút.',
    hint: 'Di chuột hoặc bấm để xem đủ các hạn mức',
    manage: 'Xem trong Cài đặt'
  },
  bug: {
    descLabel: 'Chuyện gì xảy ra?',
    optional: '(không bắt buộc)',
    descPh: 'Ví dụ: bấm Xuất video thì chạy tới 80% rồi báo lỗi, thử 2 lần vẫn vậy.',
    shotsTitle: 'Ảnh gửi kèm',
    shotsSub: 'Ảnh app tự chụp lúc lỗi và ảnh bạn thêm từ máy. Bỏ tick ảnh nào không muốn gửi.',
    shotsHint:
      'App chỉ chụp cửa sổ của app (không chụp màn hình khác), giữ 3 lần gần nhất. Bỏ tick ảnh nào không muốn gửi.',
    addImage: 'Thêm ảnh từ máy',
    addImageSub: 'hoặc dán Ctrl+V, kéo thả vào đây',
    adding: 'Đang thêm ảnh…',
    yourImage: 'Ảnh của bạn',
    removeImage: (name: string) => `Bỏ ảnh ${name}`,
    addFail: {
      khongPhaiAnh: (name: string) =>
        `“${name}” không phải ảnh nên chưa thêm được. Chọn file .png hoặc .jpg, mỗi ảnh dưới 15 MB.`,
      quaLon: (name: string) =>
        `Ảnh “${name}” lớn quá (trên 15 MB). Chụp lại nhỏ hơn hoặc chọn ảnh khác.`,
      quaNhieu: () => 'Đã đủ 6 ảnh. Bỏ bớt một ảnh rồi thêm ảnh khác.',
      loi: (name: string) => `Chưa thêm được ảnh “${name}”. Thử lại nhé.`
    },
    shotAlt: (t: string) => `Cửa sổ app lúc ${t}`,
    shotPick: (t: string) => `Gửi kèm ảnh lúc ${t}`,
    time: (ms: number) => {
      const d = new Date(ms)
      const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      return d.toDateString() === new Date().toDateString()
        ? hm
        : `${hm} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    },
    when: (ms: number) => {
      const d = new Date(ms)
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    },
    privacy:
      'Gửi vào thư mục chung, mục Báo lỗi (khác chỗ góp ý). Gồm nhật ký của app và thông tin máy. Key Vivibe và mật khẩu đã được che.',
    noDir:
      'Chưa có thư mục góp ý chung nên chưa gửi thẳng được. Bấm "Lưu ra Desktop" rồi gửi file cho người phụ trách.',
    send: 'Gửi cho người phụ trách',
    sending: 'Đang gửi…',
    saveDesktop: 'Lưu ra Desktop thay vì gửi',
    sent: 'Đã gửi báo lỗi. Người phụ trách sẽ thấy khi Drive đồng bộ xong.',
    fail: 'Chưa gửi được. Thử lại sau ít phút, hoặc bấm "Lưu ra Desktop".',
    mine: (n: number) => `Báo lỗi đã gửi · ${n}`,
    noDesc: '(Không có mô tả)',
    status: { moi: 'Chưa xem', dangXem: 'Đang xem', daXuLy: 'Đã xử lý' },
    // Hop thu nguoi bao tri
    tabFeedback: (n: number) => `Góp ý về video${n ? ` · ${n} mới` : ''}`,
    tabBugs: (n: number) => `Báo lỗi app${n ? ` · ${n} mới` : ''}`,
    empty: 'Chưa có báo lỗi nào.',
    listLabel: 'Danh sách báo lỗi',
    meta: (who: string, when: string, app: string, kit?: string) =>
      [`${who} · ${when}`, `app ${app}`, kit ? `bộ công cụ bản ${kit}` : '']
        .filter(Boolean)
        .join(' · '),
    sentAt: (who: string, when: string) => `${who} gửi lúc ${when}`,
    statusLabel: 'Trạng thái',
    tileApp: 'App',
    tileKit: 'Bộ công cụ',
    tileKitValue: (v?: string) => (v ? `Bản ${v}` : 'Chưa rõ'),
    tileC: 'Ổ C còn trống',
    tileErrors: 'Lỗi trong nhật ký',
    times: (n: number) => `${n} lần`,
    lastErrors: 'Dòng lỗi gần nhất trong nhật ký',
    noErrors: 'Nhật ký không có dòng lỗi nào.',
    shots: 'Ảnh lúc báo lỗi',
    openLog: 'Mở cả nhật ký',
    openFolder: 'Mở thư mục',
    markDone: 'Đánh dấu đã xử lý',
    ai: {
      title: 'Nhờ AI xử lý lỗi này',
      inApp: 'Trợ lý AI trong app',
      inAppSub:
        'Mở cuộc trò chuyện, AI đọc nhật ký, ảnh lúc lỗi, thông tin máy rồi nói lỗi do đâu và cách sửa.',
      open: 'Mở trò chuyện',
      ext: 'Claude Code hoặc ChatGPT',
      extSub:
        'Chép sẵn lời nhờ kèm đường dẫn thư mục báo lỗi, các dòng lỗi và thông tin máy. Dán vào nơi bạn sửa mã app.',
      copy: 'Chép lời nhờ',
      copied: 'Đã chép. Dán vào Claude Code hoặc ChatGPT.'
    }
  },
  vivibe: {
    title: 'Đã dùng',
    popTitle: 'VIVIBE · GIỌNG ĐỌC',
    pickMonth: 'Chọn tháng',
    monthName: (m: string) => {
      const [y, mo] = m.split('-')
      return `Tháng ${Number(mo)}/${y}`
    },
    charsSent: 'ký tự đã dùng',
    sentIn: (month: string, prev: string) =>
      `ký tự đã gửi Vivibe trong ${month.toLowerCase()} · tháng trước ${prev}`,
    used: 'Đang dùng trong video',
    unused: 'Không dùng',
    unusedHint: '(tạo lại, câu đã xoá, video bỏ dở)',
    none: 'Tháng này chưa tạo giọng đọc nào.',
    colVideo: 'Video',
    colSent: 'Đã tạo',
    colUsed: 'Đang dùng',
    colUnused: 'Không dùng',
    runs: (n: number) => `${n} lần tạo`,
    dropped: 'Đã bỏ',
    how: '"Đã tạo": app cộng số ký tự mỗi lần tạo giọng đọc (Vivibe tính credit theo ký tự), kể cả video đang dở hay đã bỏ. "Đang dùng": số ký tự của các câu đang nằm trong video. Chỉ tính trên máy này, từ bản app 0.1.4. Số dư tài khoản xem trên trang Vivibe.'
  },
  version: {
    banner: (v: string) => `Bản ${v} đã sẵn sàng.`,
    bannerAction: 'Xem và cập nhật',
    dismiss: 'Ẩn thông báo',
    dialogTitle: 'Cập nhật bộ công cụ',
    fromTo: (from: string, to: string) => `Bản ${from} → Bản ${to}`,
    released: (d?: string) => {
      const m = d && /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
      return d ? ` · phát hành ${m ? `${m[3]}/${m[2]}/${m[1]}` : d}` : ''
    },
    whatsNew: 'Có gì mới',
    fixes: 'Sửa lỗi',
    moreGroups: (n: number) => `và thay đổi riêng của ${n} môn`,
    kept: 'Bài của bạn được giữ nguyên:',
    keptDesc: 'các video đang làm và góp ý bạn đã dạy AI. Video đã xuất không bị đụng tới.',
    needAi:
      'Bạn đã dạy AI sửa một số file của bộ công cụ (hoặc đang dùng bản thử nghiệm). Để giữ an toàn bài của bạn, AI sẽ cùng bạn cập nhật trong một cuộc trò chuyện.',
    needApp: (v: string) => `Bản mới cần app NiniStudio ${v} trở lên. Hãy cập nhật app trước.`,
    later: 'Để sau',
    update: 'Cập nhật, khoảng 1 phút',
    updateWithAi: 'Nhờ AI cập nhật',
    updating: 'Đang cập nhật…',
    steps: { doiBan: 'Chuyển sang bản mới', caiThuVien: 'Cài thêm thư viện (nếu cần)' },
    done: (v: string) => `Đã lên bản ${v}.`,
    close: 'Đóng',
    errors: {
      mang: 'Không kết nối được mạng. Kiểm tra wifi rồi thử lại.',
      canAppMoi: 'Bản mới cần app mới hơn. Hãy cập nhật app trước.',
      khongRo: 'Cập nhật chưa xong. Bài của bạn vẫn nguyên. Bấm Thử lại, hoặc nhờ AI cập nhật.'
    },
    current: (v?: string, branch?: string) =>
      branch ? `Bản thử nghiệm (${branch})` : v ? `Bản ${v}` : 'Chưa rõ bản',
    upToDate: 'Đang dùng bản mới nhất.',
    noNotes: 'Bản này chưa có mô tả.',
    hasNew: (v: string) => `Đã có bản ${v}.`,
    offline: 'Chưa kiểm tra được bản mới (chưa có mạng).'
  },
  assistant: {
    phienBan: 'Cập nhật bộ công cụ cùng AI',
    phienBanSub: 'AI giữ nguyên bài của bạn khi đổi bản',
    gopY: 'Sửa bộ công cụ theo góp ý',
    gopYSub: (branch: string) => `Nhánh ${branch}`,
    baoLoi: 'Xử lý báo lỗi cùng AI',
    baoLoiSub: 'AI chỉ đọc nhật ký và ảnh lúc lỗi, không sửa file'
  },
  feedback: {
    open: 'Góp ý cho đội',
    here: 'Góp ý tại đây',
    title: 'Góp ý cho đội',
    lead: 'Gửi cho người phụ trách bộ công cụ khi lỗi lặp ở nhiều video. Sửa riêng video này thì nhắn AI là đủ.',
    close: 'Đóng',
    back: 'Quay lại video',
    spot: 'Chỗ bị lỗi',
    spotNone: 'Chưa chọn',
    pickAgain: 'Chọn lại',
    pickHint: 'Tua video tới chỗ lỗi rồi bấm "Lấy chỗ này", hoặc chọn câu bên dưới.',
    pickHere: 'Lấy chỗ này',
    pickLine: 'Chọn câu',
    at: (label: string) => `Tại ${label}`,
    speak: 'Lời đọc:',
    onScreen: 'Chữ trên hình:',
    noVideo: 'Video chưa xuất. Chọn câu bị lỗi ở danh sách bên dưới.',
    kind: 'Loại lỗi',
    kinds: { hinh: 'Hình', giong: 'Giọng đọc', noiDung: 'Nội dung kiến thức', loiApp: 'Lỗi app' },
    kindsShort: { hinh: 'Hình', giong: 'Giọng đọc', noiDung: 'Nội dung', loiApp: 'Lỗi app' },
    desc: 'Mô tả',
    descPh: 'Lỗi gì, ở đâu, đã gặp ở video nào khác chưa.',
    scope: 'Nên sửa ở đâu',
    scopeChung: 'Luật chung',
    scopeChungHint: 'lỗi sẽ lặp ở video khác',
    scopeVideo: 'Chỉ video này',
    scopeVideoHint: 'để đội biết',
    attach: 'Gửi kèm',
    attachNames: {
      doan: 'Đoạn 20 giây quanh chỗ lỗi',
      storyboard: 'Ảnh storyboard của câu này',
      audio: 'Audio của câu này',
      nguon: 'Kịch bản và nguồn video',
      dayAi: (n: number) => `Điều bạn đã dạy AI (${n} thay đổi)`,
      caVideo: 'Cả video thành phẩm'
    },
    total: (size: string) => `Gói ${size} lưu vào thư mục Drive`,
    safe: 'Key Vivibe và mật khẩu không bao giờ nằm trong gói.',
    cancel: 'Huỷ',
    send: 'Gửi góp ý',
    sending: 'Đang đóng gói…',
    loading: 'Đang tải…',
    sent: 'Đã gửi góp ý. Người phụ trách sẽ thấy khi Drive đồng bộ xong.',
    needDir: 'Chưa chọn thư mục góp ý chung.',
    needDirHint: 'Chọn thư mục 9Study_GopY trong Google Drive (hoặc thư mục Drive để app tạo).',
    pickDir: 'Chọn thư mục',
    fail: 'Chưa gửi được góp ý.',
    retry: 'Thử lại',
    needDesc: 'Viết vài chữ mô tả lỗi.',
    status: { moi: 'Mới', dangSua: 'Đang sửa', daSua: 'Đã sửa', khongSua: 'Không sửa' },
    fixedIn: (v: string) => `Đã sửa trong bản ${v}`,
    mine: 'Góp ý đã gửi',
    mineEmpty: 'Bạn chưa gửi góp ý nào.',
    size: (b: number) =>
      b >= 1024 * 1024
        ? `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
        : `${Math.max(1, Math.round(b / 1024))} KB`
  },
  guide: {
    title: 'Hướng dẫn',
    search: 'Tìm trong hướng dẫn',
    noResult: (q: string) => `Không thấy mục nào có "${q}".`,
    clear: 'Xoá tìm kiếm',
    views: { cards: 'Thẻ', read: 'Đọc một trang' },
    viewLabel: 'Kiểu xem',
    onThisPage: 'Trên trang này',
    stepCount: (n: number) => `${n} bước`,
    readTime: (min: number) => `khoảng ${min} phút đọc`,
    results: (n: number) => `${n} kết quả`,
    zoom: 'Phóng to ảnh',
    close: 'Đóng',
    tip: 'Mẹo',
    groups: { batDau: 'Bắt đầu', chinhVideo: 'Chỉnh video', doi: 'Đội và hỗ trợ' },
    sections: [
      {
        id: 'cai-dat-lan-dau',
        group: 'batDau',
        title: 'Cài đặt lần đầu',
        lead: 'Lần đầu mở app, app dẫn bạn qua từng bước. Mỗi bước có nút làm giúp, bạn chỉ cần bấm và đăng nhập.',
        steps: [
          {
            t: 'Làm theo từng bước',
            d: 'App tự tải bộ công cụ và cài thư viện. Bước nào lỗi thì bấm "Thử lại" hoặc "Sửa giúp tôi".',
            shot: 'setup'
          },
          {
            t: 'Đã làm video trước khi có app?',
            d: 'App tìm thấy thư mục bộ công cụ cũ thì hỏi bạn nhận lại video, key Vivibe, trò chuyện cũ với AI và credit Vivibe đã dùng. Làm lại được ở Cài đặt › Thư mục › "Nhận dữ liệu cũ".',
            tip: 'Trò chuyện cũ với Codex mở tiếp được ngay trong video. Trò chuyện với Claude Code chỉ xem lại được.'
          },
          {
            t: 'Đăng nhập ChatGPT',
            d: 'Trình duyệt mở trang ChatGPT. Đăng nhập xong thì quay lại app, bước này tự xong.'
          },
          {
            t: 'Dán key giọng đọc Vivibe',
            d: 'Key chỉ lưu trên máy bạn. Chưa có key thì bỏ qua, dán sau trong Cài đặt › Giọng đọc Vivibe.'
          },
          {
            t: 'Google Drive và thư mục góp ý',
            d: 'App tải và mở bộ cài Google Drive. Sau đó mở thư mục của đội và thêm lối tắt vào Drive của tôi.',
            tip: 'Hai bước này bỏ qua được. Bỏ qua thì vẫn làm video bình thường, chỉ chưa gửi được góp ý.'
          },
          {
            t: 'Kiểm tra máy',
            d: 'App chạy thử một lượt. Thấy "Máy bạn đã sẵn sàng" là xong.'
          }
        ]
      },
      {
        id: 'lam-video',
        group: 'batDau',
        title: 'Làm một video',
        lead: 'Mỗi video đi qua 3 bước: kịch bản, hình, giọng đọc. AI làm, bạn duyệt. Hai bước đầu không tốn credit.',
        steps: [
          {
            t: 'Bấm "Làm video mới"',
            d: 'Ở trang Video, bấm "Làm video mới".',
            shot: 'home',
            mark: 'Bấm ở đây'
          },
          {
            t: 'Chọn môn, lớp, bài',
            d: 'Điền tên bài rồi bấm "Bắt đầu viết kịch bản". AI viết kịch bản trong vài phút.',
            shot: 'new',
            mark: 'Bấm ở đây',
            tip: 'Ý bản chất để trống thì AI đề xuất 2–3 góc nhìn cho bạn chọn.'
          },
          {
            t: 'Đọc kịch bản, nhắn AI sửa',
            d: 'Kịch bản nằm ở tab Kịch bản. Muốn đổi gì thì nhắn, ví dụ "câu 2 cảnh 3 nói ngắn lại".',
            shot: 'script',
            mark: 'Nhắn AI ở đây'
          },
          {
            t: 'Duyệt hình ở Storyboard',
            d: 'Kịch bản ổn thì bấm "Duyệt kịch bản, sang bước 2". AI dựng hình. Hình ổn thì bấm "Duyệt hình, sang bước 3".',
            shot: 'storyboard'
          },
          {
            t: 'Nghe thử giọng đọc',
            d: 'AI tạo giọng (tốn credit Vivibe, app hỏi trước). Câu nào đọc sai thì bấm "Đọc sai" ở tab Nghe thử.',
            shot: 'audio'
          },
          {
            t: 'Xuất video',
            d: 'Giọng ổn thì bấm "Giọng ổn, dựng bản hoàn chỉnh" rồi "Xuất video". Video nằm ở tab Thành phẩm.',
            shot: 'final'
          }
        ]
      },
      {
        id: 'form-video-moi',
        group: 'batDau',
        title: 'Điền form "Làm video mới"',
        lead: 'Chỉ tên bài là bắt buộc. Điền thêm thì video sát ý bạn hơn và AI ít hỏi lại.',
        steps: [
          {
            t: 'Môn, lớp, loại video',
            d: 'Bài học giảng một bài trong sách; hiện tượng giải thích một chuyện ngoài đời bằng kiến thức của bài.',
            shot: 'new'
          },
          {
            t: 'Ý bản chất',
            d: 'Điều cốt lõi học sinh phải hiểu sau video. Để trống thì AI đề xuất 2–3 góc nhìn cho bạn chọn.'
          },
          {
            t: 'Giọng đọc',
            d: 'App chọn sẵn giọng mặc định của môn. Đổi được tới trước khi tạo giọng ở bước 3.'
          },
          {
            t: 'Học sinh đã học / chưa học',
            d: 'Học sinh ảo dùng đúng hai ô này để đọc thử kịch bản như người xem thật.'
          },
          {
            t: 'Video trước trong chuỗi',
            d: 'AI đọc video đó để không dạy lại và nối tiếp đúng chỗ.'
          },
          {
            t: 'Lỗi hay mắc, dạng bài thi',
            d: '"Lỗi hay mắc" thành đoạn "Bẫy thường gặp", "Dạng bài thi" thành đoạn "Trong đề thi".'
          }
        ]
      },
      {
        id: 'ai-xin-phep',
        group: 'batDau',
        title: 'Khi AI xin phép',
        lead: 'Việc tốn credit (tạo giọng đọc) hoặc cần mạng thì AI hỏi bạn trước, ngay trong khung chat.',
        steps: [
          {
            t: 'Đọc dòng mô tả',
            d: 'Thấy đúng việc bạn vừa nhờ thì bấm "Đồng ý".'
          },
          {
            t: 'Không chắc thì để sau',
            d: 'Bấm "Để sau" rồi hỏi AI việc đó để làm gì. AI không làm khi bạn chưa đồng ý.'
          },
          {
            t: 'Việc tốn credit',
            d: 'Có dòng "Việc này tốn credit Vivibe". Chỉ đồng ý khi các câu nghe thử đã ổn.'
          }
        ]
      },
      {
        id: 'kich-ban',
        group: 'chinhVideo',
        title: 'Kịch bản',
        lead: 'Kịch bản chia theo cảnh và câu. Lời đọc là câu AI sẽ đọc, chữ trên hình là chữ hiện trong video.',
        steps: [
          {
            t: 'Đọc ở tab Kịch bản',
            d: 'Đọc to từng câu xem có giống lời giảng không. Chữ trên hình nên ngắn hơn lời đọc.',
            shot: 'script'
          },
          {
            t: 'Nhắn AI sửa',
            d: 'Nói rõ chỗ: "câu 2 cảnh 3 nói ngắn lại". Sửa nhiều chỗ thì gom vào một tin nhắn.'
          },
          {
            t: 'Nhờ học sinh ảo đọc thử',
            d: 'Bấm "Nhờ học sinh ảo đọc thử". AI đọc như học sinh thật và chỉ chỗ khó hiểu.'
          },
          {
            t: 'Duyệt kịch bản',
            d: 'Ổn thì bấm "Duyệt kịch bản, sang bước 2". Sau đó vẫn nhắn AI sửa kịch bản được.'
          }
        ]
      },
      {
        id: 'storyboard',
        group: 'chinhVideo',
        title: 'Storyboard và chuyển động',
        lead: 'Storyboard là ảnh từng câu, chụp lúc câu đó đã hiện đủ. Xem chuyển động để thấy video chạy thật.',
        steps: [
          {
            t: 'Xem ảnh từng câu',
            d: 'Tab Storyboard xếp ảnh theo cảnh. Đây là bản nháp, thời gian ước theo số chữ.',
            shot: 'storyboard'
          },
          {
            t: 'Nhắn AI sửa hình',
            d: 'Ví dụ "cảnh 3 đổi màu đường cong sang chấm". Sửa xong bấm "Xuất lại storyboard" để xem ảnh mới.'
          },
          {
            t: 'Xem chuyển động',
            d: 'Tab "Xem chuyển động" › "Mở bản xem chuyển động". Lần đầu mất khoảng 10–30 giây.',
            shot: 'motion',
            mark: 'Bấm ở đây'
          },
          {
            t: 'Duyệt hình',
            d: 'Hình ổn thì bấm "Duyệt hình, sang bước 3". Chưa tốn credit.'
          }
        ]
      },
      {
        id: 'giong-doc',
        group: 'chinhVideo',
        title: 'Giọng đọc và xuất',
        lead: 'Giọng đọc là bước duy nhất tốn credit Vivibe. App hỏi trước mỗi lần tạo giọng.',
        steps: [
          {
            t: 'Đồng ý tạo giọng',
            d: 'AI hỏi "Tạo giọng đọc cho bài". Đọc lại kịch bản lần cuối rồi bấm "Đồng ý".'
          },
          {
            t: 'Nghe thử',
            d: 'Tab Nghe thử có từng câu. Câu nào đọc sai thì bấm "Đọc sai" ngay cạnh câu đó.',
            shot: 'audio'
          },
          {
            t: 'Xuất video',
            d: 'Bấm "Giọng ổn, dựng bản hoàn chỉnh" rồi "Xuất video". Video ở tab Thành phẩm và trong thư mục lưu video.',
            shot: 'final'
          },
          {
            t: 'Xem credit đã dùng',
            d: 'Bấm Usage góc trên bên phải. Chi tiết theo tháng, theo video ở Cài đặt › Giọng đọc Vivibe.',
            shot: 'usage',
            tip: '"Đã tạo" là số ký tự app gửi Vivibe, kể cả video bỏ dở. "Đang dùng" là số ký tự các câu đang nằm trong video.'
          }
        ]
      },
      {
        id: 'gop-y',
        group: 'doi',
        title: 'Góp ý cho đội',
        lead: 'Lỗi chỉ ở video này thì nhắn AI sửa là đủ. Lỗi lặp ở nhiều video thì góp ý để người phụ trách sửa cho cả đội.',
        steps: [
          {
            t: 'Bấm "Góp ý cho đội"',
            d: 'Nút ở góc trên màn làm video, hoặc "Góp ý tại đây" khi xem video.',
            shot: 'feedback'
          },
          {
            t: 'Chọn chỗ lỗi, viết vài chữ',
            d: 'Chọn loại lỗi, nói lỗi gì rồi gửi. Mặc định chỉ gửi đoạn 20 giây quanh chỗ lỗi cho nhẹ Drive.'
          },
          {
            t: 'Xem góp ý đã sửa gì',
            d: 'Cài đặt › Góp ý cho đội › Xem. Bấm góp ý đã sửa để đọc tóm tắt. Còn dùng bản cũ thì bấm "Lên bản N".',
            shot: 'sent'
          }
        ]
      },
      {
        id: 'thu-muc-gop-y',
        group: 'doi',
        title: 'Thư mục góp ý chung',
        lead: 'Góp ý và báo lỗi đi qua một thư mục Google Drive của đội. Mỗi máy cần nối thư mục này một lần.',
        steps: [
          {
            t: 'Mở thư mục của đội',
            d: 'Cài đặt › Góp ý cho đội › "Mở thư mục của đội". Drive hỏi quyền thì bấm xin quyền.',
            shot: 'settingsFeedback',
            mark: 'Bấm ở đây'
          },
          {
            t: 'Thêm lối tắt vào Drive của tôi',
            d: 'Chuột phải vào thư mục › Sắp xếp › Thêm lối tắt › Drive của tôi. App tự thấy sau khoảng nửa phút.'
          },
          {
            t: 'Ghi tên của bạn',
            d: 'Tên hiện trong góp ý để đội biết ai gửi.',
            shot: 'settingsName'
          }
        ]
      },
      {
        id: 'bao-loi',
        group: 'doi',
        title: 'Khi app báo lỗi',
        lead: 'Thường chỉ cần bấm nút app đưa ra: Thử lại, Sửa giúp tôi. Vẫn lỗi thì gửi báo lỗi cho người phụ trách.',
        steps: [
          {
            t: 'Bấm nút app đưa ra',
            d: 'Mỗi thông báo lỗi có nút sửa. Bấm thử trước khi báo lỗi.'
          },
          {
            t: 'Gửi báo lỗi',
            d: 'Cài đặt › Hỗ trợ › "Gửi báo lỗi". Viết vài chữ, tick ảnh muốn gửi, bấm "Gửi cho người phụ trách".',
            shot: 'bug',
            tip: 'Mỗi lần hiện lỗi, app tự chụp cửa sổ app (không chụp màn hình khác) và giữ 3 lần gần nhất. Key Vivibe và mật khẩu đã được che.'
          },
          {
            t: 'Chưa có thư mục chung',
            d: 'Bấm "Lưu ra Desktop" rồi gửi file đó cho người phụ trách.'
          },
          {
            t: 'Máy chậm, ổ C đầy',
            d: 'Cài đặt › Ổ đĩa › Dọn. Ảnh nháp và storyboard tạo lại được bất cứ lúc nào.'
          }
        ]
      },
      {
        id: 'cai-dat',
        group: 'doi',
        title: 'Cài đặt',
        lead: 'Những chỗ bạn hay đổi trong Cài đặt.',
        steps: [
          {
            t: 'Giọng đọc',
            d: 'Giọng mặc định theo môn: form "Làm video mới" chọn sẵn giọng này. Tốc độ đọc chung chỉ đổi khi nghe cả bài thấy nhanh hoặc chậm.',
            shot: 'settingsVoice'
          },
          {
            t: 'Khi nào AI hỏi trước',
            d: '"Việc tốn credit hoặc cần mạng": sửa kịch bản, dựng hình AI tự làm. "Mọi lệnh": chắc nhất nhưng phải bấm đồng ý nhiều lần.'
          },
          {
            t: 'Tự dọn bộ nhớ AI',
            d: 'Sau mỗi bước AI dọn bớt bộ nhớ: nhanh hơn, đỡ tốn Usage ChatGPT. Quyết định quan trọng vẫn được giữ.'
          },
          {
            t: 'Ổ đĩa',
            d: 'Ảnh nháp và storyboard tạo lại được. File tạm xoá được khi không đang xuất video.'
          }
        ]
      },
      {
        id: 'len-ban',
        group: 'doi',
        title: 'Lên bản mới',
        lead: 'Bộ công cụ có bản mới khi đội sửa xong góp ý. Đổi bản thì bài của bạn vẫn giữ nguyên.',
        steps: [
          {
            t: 'Xem bản mới có gì',
            d: 'Trang Video hiện thông báo khi có bản mới. Bấm "Xem bản mới" để đọc có gì mới.'
          },
          {
            t: 'Đổi bản',
            d: 'Cài đặt › Phiên bản: bấm tên bản để xem bản đó có gì, rồi "Lên bản N" hoặc "Quay lại bản N".',
            shot: 'settingsVersion'
          },
          {
            t: 'Bản app mới',
            d: 'Tải ngầm, cài khi bạn mở lại app. Thấy nút "Khởi động lại" ở góc trên thì bấm khi rảnh.'
          }
        ]
      },
      {
        id: 'bao-tri',
        group: 'doi',
        title: 'Người bảo trì',
        lead: 'Chỉ dành cho máy người phụ trách bộ công cụ. Bật "Chế độ người bảo trì" trong Cài đặt › Góp ý cho đội.',
        steps: [
          {
            t: 'Gộp góp ý thành một lần sửa',
            d: 'Tick nhiều góp ý. "Chỗ sửa dự kiến" app đoán theo loại lỗi và môn, Codex tự kiểm lại.'
          },
          {
            t: 'Đặt tên và chọn bản',
            d: 'Tên nhánh tự đặt theo quy ước [môn]_fix_[mô tả]. "Đưa vào bản" chọn bản chưa phát hành, hoặc "+ Tạo bản mới".'
          },
          {
            t: 'Sửa ngay hoặc để sau',
            d: '"Lưu lần sửa, làm sau": góp ý chuyển sang "Đang sửa", CTV thấy trạng thái này. Phát hành bản đó xong, app tự đổi sang "Đã sửa trong bản N".'
          },
          {
            t: 'Xem lại đã sửa gì',
            d: 'Tab Xong: nhật ký phiên bản, bài học AI ghi lại và các file đã đổi. Ghi một dòng tóm tắt để CTV đọc.',
            shot: 'inbox'
          },
          {
            t: 'Báo lỗi app',
            d: 'Tab "Báo lỗi app" tách khỏi góp ý: xem ảnh lúc lỗi, nhật ký, rồi đánh dấu đã xử lý.'
          }
        ]
      }
    ]
  },
  inbox: {
    nav: 'Góp ý',
    mode: 'Chế độ người bảo trì',
    tabs: { moi: 'Mới', dangSua: 'Đang sửa', xong: 'Xong' },
    empty: 'Chưa có góp ý nào ở đây.',
    noDir: 'Chưa chọn thư mục góp ý chung. Vào Cài đặt › Góp ý để chọn.',
    tickHint: 'Tick nhiều góp ý để gộp thành một lần sửa.',
    pick: (t: string) => `Chọn góp ý: ${t}`,
    general: 'Luật chung',
    sentBy: (who: string, when: string) => `${who} gửi · ${when}`,
    version: (v: string) => `bản ${v}`,
    app: (v: string) => `app ${v}`,
    voice: (v: string) => `giọng ${v}`,
    statusLabel: 'Trạng thái',
    wrote: (who: string) => `${who} viết`,
    meta: (kind: string, scope: string, size: string) =>
      `Loại: ${kind} · Nên sửa: ${scope} · Gói ${size}`,
    scopeChung: 'luật chung',
    scopeVideo: 'chỉ video này',
    taught: (who: string, n: number) => `AI trên máy ${who} đã học${n ? ` (${n} thay đổi)` : ''}`,
    taughtNone: 'Không gửi kèm điều đã dạy AI.',
    storyboard: (label: string) => `Storyboard · ${label}`,
    noClip: 'Không có đoạn video.',
    fullVideo: 'Xem cả video',
    toFix: 'Chuyển thành việc sửa skill',
    openFolder: 'Mở thư mục gói',
    toFixHint: (branch: string) =>
      `Mở Codex trong bộ công cụ của bạn, kèm sẵn gói này, trên nhánh ${branch}`,
    picked: (n: number) => `Đã chọn ${n} góp ý`,
    unpick: 'Bỏ chọn',
    batchTitle: (n: number) => `Gộp ${n} góp ý thành một lần sửa`,
    batchSub: (who: string, kinds: number, spots: number) =>
      `Từ ${who} · ${kinds} loại lỗi · dự kiến chạm ${spots} chỗ trong bộ công cụ`,
    and: ' và ',
    remove: (t: string) => `Bỏ khỏi lần sửa: ${t}`,
    guessHint: '"Chỗ sửa dự kiến" app đoán theo loại lỗi và môn. Codex sẽ tự kiểm lại.',
    batchName: 'Tên lần sửa',
    branch: 'Nhánh',
    branchHint: 'Tự đặt theo quy ước [môn]_fix_[mô tả].',
    target: 'Đưa vào bản',
    targetOpt: (v: string) => `Bản ${v} (chưa phát hành)`,
    newVersion: '+ Tạo bản mới…',
    newVersionLabel: 'Số của bản mới',
    createVersion: 'Tạo',
    targetHint: (n: number, v: string) =>
      `Phát hành xong, đổi ${n} góp ý sang "Đã sửa trong bản ${v}".`,
    codexGets: 'Codex sẽ nhận',
    gets1: (n: number, size: string) =>
      `${n} gói góp ý (${size}): video, storyboard, audio, lời CTV và những gì AI trên máy họ đã học.`,
    gets2:
      'Yêu cầu sửa skill chung, không sửa video của CTV, mỗi góp ý ghi một dòng vào .agents/lessons.md.',
    gets3: 'Thêm dòng vào mục "Chưa phát hành" của CHANGELOG.md bằng lời thường.',
    openCodex: (n: number) => `Mở Codex với ${n} góp ý`,
    saveLater: 'Lưu lần sửa, làm sau',
    saveHint: (n: number) => `Cả ${n} chuyển sang "Đang sửa". CTV thấy trạng thái này.`,
    saved: 'Đã lưu lần sửa.',
    openChat: 'Mở cuộc trò chuyện sửa',
    markFixed: (v: string) => `Đánh dấu đã sửa trong bản ${v}`,
    fixed: {
      title: (v?: string) => (v ? `Đã sửa trong bản ${v}` : 'Đã sửa'),
      sub: (name: string, n: number, date?: string) =>
        [`lần sửa "${name}"`, `${n} góp ý`, date].filter(Boolean).join(' · '),
      summary: 'TÓM TẮT CỦA BẠN',
      summaryPh: 'Một dòng cho người gửi biết đã sửa gì',
      summaryAdd: 'Thêm tóm tắt',
      summaryEdit: 'Sửa tóm tắt',
      save: 'Lưu',
      changelog: 'Ghi vào nhật ký phiên bản',
      lessons: 'Bài học AI ghi lại',
      none: 'Không có',
      files: (n: number) => `File trong bộ công cụ đã đổi · ${n}`,
      since: (v: string) => `so với bản ${v}`,
      loading: 'Đang đọc lần sửa…',
      notFound: 'Máy này không có lần sửa này.',
      reopen: 'Mở lại góp ý',
      original: 'Xem góp ý gốc',
      hideOriginal: 'Ẩn góp ý gốc',
      more: (n: number) => `+${n} dòng nữa`
    }
  },
  settings: {
    nav: 'Cài đặt',
    title: 'Cài đặt',
    folders: 'Thư mục',
    project: 'Thư mục dự án',
    projectDesc: 'Bộ công cụ và các bài bạn đang làm.',
    output: 'Nơi lưu video thành phẩm',
    outputDrive: 'Google Drive · tự đồng bộ lên mạng',
    open: 'Mở thư mục',
    change: 'Đổi',
    voice: 'Giọng đọc Vivibe',
    key: 'Key Vivibe',
    keyNone: 'Chưa có key. Thêm để tạo giọng đọc.',
    keyLocal: 'Chỉ lưu trên máy bạn, không gửi đi đâu khác.',
    changeKey: 'Đổi key',
    addKey: 'Thêm key',
    save: 'Kiểm tra và lưu',
    cancel: 'Huỷ',
    ai: 'Trợ lý AI',
    account: 'Tài khoản',
    logout: 'Đăng xuất',
    logoutConfirm: 'Đăng xuất khỏi ChatGPT? Muốn dùng trợ lý AI lại thì phải đăng nhập lại.',
    versions: 'Phiên bản',
    toolkit: 'Bộ công cụ làm video',
    appName: (v: string) => `App NiniStudio · ${v}`,
    viewUpdate: 'Xem bản mới',
    support: 'Hỗ trợ',
    recheck: 'Chạy lại kiểm tra máy',
    rechecking: 'Đang kiểm tra…',
    bugReport: 'Gửi báo lỗi',
    bugReportDesc:
      'App gặp lỗi lạ thì bấm "Gửi báo lỗi". App gửi nhật ký, thông tin máy và ảnh lúc lỗi cho người phụ trách. Key và mật khẩu đã được che.',
    bugReportDone: (p: string) => `Đã tạo ${p}. Gửi file này cho người phụ trách.`,
    bugReportFail: 'Chưa tạo được file báo lỗi. Thử lại sau ít phút.',
    working: 'Đang làm…',
    askTitle: 'Khi nào AI phải hỏi bạn trước',
    askCredit: 'Việc tốn credit hoặc cần mạng',
    askCreditTag: 'Khuyên dùng',
    askCreditDesc: 'Tạo giọng đọc, đổi phiên bản. Sửa kịch bản và dựng hình thì AI tự làm.',
    askAll: 'Mọi lệnh',
    askAllDesc: 'Chắc chắn nhất nhưng phải bấm đồng ý nhiều lần.',
    autoCompact: 'Tự dọn bộ nhớ AI sau mỗi bước',
    autoCompactDesc:
      'AI nhanh hơn và đỡ tốn Usage ChatGPT. Các quyết định quan trọng vẫn được giữ.',
    autoUpdate: 'Tự tải bản app mới',
    autoUpdateDesc: 'Tải ngầm, cài khi bạn mở lại app.',
    feedback: 'Góp ý cho đội',
    feedbackDir: 'Thư mục góp ý chung',
    feedbackDirOk: 'Đã kết nối · thư mục do đội chia sẻ',
    feedbackDirNone: 'Chưa kết nối',
    pick: 'Chọn',
    authorName: 'Tên của bạn',
    authorNameDesc: 'Hiện trong góp ý để đội biết ai gửi.',
    authorNamePh: 'Ví dụ: Lan',
    sent: (n: number) => `Góp ý đã gửi · ${n}`,
    sentSummary: (fixed: number, waiting: number) =>
      [fixed ? `${fixed} đã sửa` : '', waiting ? `${waiting} đang chờ xử lý` : '']
        .filter(Boolean)
        .join(' · ') || 'Chưa có góp ý nào',
    view: 'Xem',
    hide: 'Ẩn',
    fullVideo: 'Luôn gửi kèm cả video thành phẩm',
    fullVideoDesc: 'Mặc định chỉ gửi đoạn 20 giây quanh chỗ lỗi cho nhẹ Drive.',
    maintainer: 'Chế độ người bảo trì',
    keyOk: 'Đang dùng được',
    recheckKey: 'Kiểm tra lại',
    defaultVoice: 'Giọng mặc định theo môn',
    defaultVoiceDesc: 'Màn "Làm video mới" tự chọn sẵn giọng này. Đổi từng video vẫn được.',
    voiceGroups: { tuNhien: 'Toán, Lý, Hóa, Sinh', xaHoi: 'Sử, Địa, Văn, KTPL', anh: 'Tiếng Anh' },
    speed: 'Tốc độ đọc chung',
    speedDesc:
      'Chỉ đổi khi nghe cả bài thấy nhanh hoặc chậm. Đoạn nào nhanh quá thì nhờ AI chia câu ngắn hơn, đừng giảm tốc độ.',
    speedValue: (v: number) => `${v.toFixed(2).replace(/0$/, '').replace('.', ',')}×`,
    allVersions: 'Các bản',
    allVersionsDesc: 'Bấm tên bản để xem bản đó có gì. Đổi bản thì bài của bạn vẫn giữ nguyên.',
    versionName: (v: string) => `Bản ${v}`,
    versionDate: (d?: string) => {
      const m = d && /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : (d ?? '')
    },
    inUse: 'Đang dùng',
    newest: 'Mới nhất',
    goBack: (v: string) => `Quay lại bản ${v}`,
    goUp: (v: string) => `Lên bản ${v}`,
    usingVersion: (v: string) => `Bạn đang dùng bản ${v}`,
    switchConfirm: (v: string) => `Chuyển sang bản ${v}? Bài của bạn giữ nguyên.`,
    switchDone: (v: string) => `Đã chuyển sang bản ${v}.`,
    switchFail: 'Chưa đổi được bản. Bài của bạn vẫn nguyên. Thử lại sau ít phút.',
    disk: 'Ổ đĩa',
    drafts: (size: string) => `Ảnh nháp và storyboard · ${size}`,
    draftsDesc: 'Tạo lại được bất cứ lúc nào. Không đụng tới video thành phẩm.',
    temp: (size: string) => `File tạm khi xuất video · ${size}`,
    tempDesc: 'Xoá được khi không đang xuất video.',
    lowC: (gb: number) => `Ổ C còn ${gb} GB. Nên dọn để xuất video không bị lỗi.`,
    clean: 'Dọn',
    cleanConfirm: 'Xoá luôn? Lần sau AI sẽ tạo lại khi cần.',
    cleaning: 'Đang dọn…',
    guide: 'Xem hướng dẫn',
    maintainerDesc:
      'Hiện mục "Góp ý" để xem và xử lý góp ý của mọi người. Chỉ bật trên máy người phụ trách bộ công cụ.'
  },
  chatResize: 'Kéo để đổi độ rộng khung chat',
  estimate: (lines: number, chars: number) =>
    `Khoảng ${lines.toLocaleString('vi-VN')} câu · ${chars.toLocaleString('vi-VN')} ký tự (credit Vivibe tính theo số ký tự)`
}
