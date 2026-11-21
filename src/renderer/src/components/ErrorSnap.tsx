import { useEffect } from 'react'
import { api } from '@/lib/api'

/**
 * Dat canh mot thong bao loi: khi loi hien ra, app chup cua so de gui kem bao loi neu can.
 * Moi `id` chi chup mot lan; khong ve gi len man hinh.
 */
export function ErrorSnap({ id, label }: { id: string; label: string }): null {
  useEffect(() => {
    void api.invoke('app:errorShown', id, label)
  }, [id, label])
  return null
}
