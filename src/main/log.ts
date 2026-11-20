import log from 'electron-log/main'

import { redact } from './redact'

export { redact }

log.initialize()
log.transports.file.maxSize = 5 * 1024 * 1024
log.hooks.push((message) => {
  message.data = message.data.map((d) => (typeof d === 'string' ? redact(d) : d))
  return message
})

export default log
