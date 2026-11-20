// Toan bo chu tieng Viet tren giao dien. Khong dung thuat ngu ky thuat (git, terminal, npm, sandbox...).
import type { ErrorCode, MachineCheck, SetupStepId, TaskId } from '../../../shared/types'
import type {
  ApprovalTitle,
  ChatErrorCode,
  ChipId,
  StatusLabel,
  VideoStage
} from '../../../shared/video'

export const copy = {
  appName: '9Study',
  appNameAccent: 'Video',
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
  updateReady: (v: string) => `Bản app mới ${v} đã tải xong.`,
  restartToUpdate: 'Khởi động lại để cập nhật',

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
      desc: 'Trợ lý AI làm video dùng luôn gói ChatGPT bạn đang có. Không tốn thêm tiền.',
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
    cheDoAnToan: { label: 'Bật chế độ an toàn cho trợ lý AI', hint: 'vài giây' }
  } satisfies Record<TaskId, { label: string; hint: string }>,
  taskStatus: {
    waiting: 'Chờ',
    skipped: 'Máy đã có sẵn',
    error: 'Bị lỗi',
    version: (v: string) => `Bản ${v}`,
    sandboxOff: 'Chưa bật được, AI sẽ hỏi trước mỗi việc'
  },
  willDo: 'Những gì app sẽ làm',
  doing: 'Đang làm',
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
    khongRo: 'Có lỗi ngoài dự kiến. Bấm Thử lại; nếu vẫn lỗi, hãy báo cho người phụ trách.'
  } satisfies Record<ErrorCode, string>,

  // ---------- Video cua toi ----------
  nav: { videos: 'Video', settings: 'Cài đặt' },
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
    colStage: 'Trạng thái',
    colUpdated: 'Cập nhật',
    nextStep: {
      kichBan: 'Việc tiếp theo: đọc kịch bản và duyệt với AI.',
      duyetHinh: 'Việc tiếp theo: xem storyboard và duyệt hình. Chưa tốn credit.',
      giongDoc: 'Việc tiếp theo: nghe thử giọng đọc rồi xuất video.',
      daXuat: 'Video đã xuất xong. Mở để xem hoặc xuất lại.'
    } satisfies Record<VideoStage, string>,
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
    part3Hint: 'Không bắt buộc. Điền càng nhiều, video càng sát ý bạn và AI càng ít phải hỏi lại.',
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
      hetLuot: 'Đã hết lượt dùng ChatGPT. Chờ tới lúc làm mới lượt rồi nhắn lại.',
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

  // ---------- Moc 3 ----------
  usage: {
    title: 'Usage',
    chatgpt: 'Tài khoản ChatGPT',
    plan: (p?: string) => (p ? `Gói ${p.charAt(0).toUpperCase()}${p.slice(1)}` : 'Gói ChatGPT'),
    // Do dai cua so tinh luot: 300 phut = 5 gio, 10080 = tuan, 43200 = 30 ngay
    windowShort: (m: number | null) =>
      !m
        ? ''
        : m <= 60 * 24
          ? `${Math.round(m / 60)}h`
          : m <= 60 * 24 * 7
            ? 'Tuần'
            : `${Math.round(m / 1440)} ngày`,
    windowLong: (m: number | null) =>
      !m
        ? 'Hạn mức'
        : m <= 60 * 24
          ? `Hạn mức ${Math.round(m / 60)} giờ`
          : m <= 60 * 24 * 7
            ? 'Hạn mức tuần'
            : `Hạn mức ${Math.round(m / 1440)} ngày`,
    used: (n: number) => `Đã dùng ${n}%`,
    resets: (ms: number) => {
      const d = new Date(ms)
      const same = d.toDateString() === new Date().toDateString()
      const t = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      return same
        ? `Làm mới lúc ${t} hôm nay`
        : `Làm mới ${t} ngày ${d.toLocaleDateString('vi-VN')}`
    },
    unknown: 'Chưa đọc được lượt dùng.',
    manage: 'Xem trong Cài đặt'
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
    needApp: (v: string) => `Bản mới cần app 9Study Video ${v} trở lên. Hãy cập nhật app trước.`,
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
    hasNew: (v: string) => `Đã có bản ${v}.`,
    offline: 'Chưa kiểm tra được bản mới (chưa có mạng).'
  },
  assistant: {
    phienBan: 'Cập nhật bộ công cụ cùng AI',
    phienBanSub: 'AI giữ nguyên bài của bạn khi đổi bản',
    gopY: 'Sửa bộ công cụ theo góp ý',
    gopYSub: (branch: string) => `Nhánh ${branch}`
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
    markFixed: (v: string) => `Đánh dấu đã sửa trong bản ${v}`
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
    signedIn: (email: string, plan?: string) =>
      `Đã đăng nhập ChatGPT${plan ? ` · gói ${plan}` : ''}${email ? ` · ${email}` : ''}`,
    logout: 'Đăng xuất',
    logoutConfirm: 'Đăng xuất khỏi ChatGPT? Muốn dùng trợ lý AI lại thì phải đăng nhập lại.',
    versions: 'Phiên bản',
    toolkit: 'Bộ công cụ làm video',
    appName: (v: string) => `App 9Study Video · ${v}`,
    viewUpdate: 'Xem bản mới',
    support: 'Hỗ trợ',
    recheck: 'Chạy lại kiểm tra máy',
    rechecking: 'Đang kiểm tra…',
    bugReport: 'Gửi báo lỗi',
    bugReportDesc:
      '"Gửi báo lỗi" gom nhật ký thành một file trên Desktop để bạn gửi cho người phụ trách. Key và mật khẩu không nằm trong đó.',
    bugReportDone: (p: string) => `Đã tạo ${p}. Gửi file này cho người phụ trách.`,
    bugReportFail: 'Chưa tạo được file báo lỗi. Thử lại sau ít phút.',
    working: 'Đang làm…',
    askTitle: 'Khi nào AI phải hỏi bạn trước',
    askCredit: 'Việc tốn credit hoặc cần mạng',
    askCreditTag: ' · khuyên dùng',
    askCreditDesc: 'Tạo giọng đọc, đổi phiên bản. Sửa kịch bản và dựng hình thì AI tự làm.',
    askAll: 'Mọi lệnh',
    askAllDesc: 'Chắc chắn nhất nhưng phải bấm đồng ý nhiều lần.',
    autoCompact: 'Tự dọn bộ nhớ AI sau mỗi bước',
    autoCompactDesc: 'AI nhanh hơn và đỡ tốn lượt ChatGPT. Các quyết định quan trọng vẫn được giữ.',
    autoUpdate: 'Tự tải bản app mới',
    autoUpdateDesc: 'Tải ngầm, cài khi bạn mở lại app.',
    feedback: 'Góp ý cho đội',
    feedbackDir: 'Thư mục góp ý chung',
    feedbackDirOk: 'Đã kết nối · thư mục do đội chia sẻ',
    feedbackDirNone: 'Chưa chọn. Chọn thư mục 9Study_GopY trong Google Drive.',
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
    maintainerDesc:
      'Hiện mục "Góp ý" để xem và xử lý góp ý của mọi người. Chỉ bật trên máy người phụ trách bộ công cụ.'
  },
  chatResize: 'Kéo để đổi độ rộng khung chat',
  estimate: (lines: number, chars: number) =>
    `Khoảng ${lines.toLocaleString('vi-VN')} câu · ${chars.toLocaleString('vi-VN')} ký tự (credit Vivibe tính theo số ký tự)`
}
