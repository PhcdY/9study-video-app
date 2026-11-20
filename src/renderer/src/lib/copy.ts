// Toan bo chu tieng Viet tren giao dien. Khong dung thuat ngu ky thuat (git, terminal, npm, sandbox...).
import type { ErrorCode, MachineCheck, SetupStepId, TaskId } from '../../../shared/types'

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
  } satisfies Record<ErrorCode, string>
}
