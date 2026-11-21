// Ten noi bo cua app. Phai nap dau tien trong index.ts (truoc log va moi service).
// Ten hien thi da doi sang NiniStudio, nhung thu muc du lieu (%APPDATA%\9Study Video: dang nhap
// ChatGPT, cai dat, lich su chat, nhat ky) giu nguyen de ban cu cap nhat len khong mat gi.
import { app } from 'electron'

export const INTERNAL_NAME = '9Study Video'

app.setName(INTERNAL_NAME)
app.setPath('userData', `${app.getPath('appData')}\\${INTERNAL_NAME}`)
