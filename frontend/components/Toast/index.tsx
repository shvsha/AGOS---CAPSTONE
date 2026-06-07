import { Check } from "lucide-react";
import { IoMdCloseCircleOutline } from "react-icons/io"

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastProps {
  toasts: Toast[]
  onRemove: (id: number) => void
}

export function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 md:top-6 md:right-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 w-max">
      {toasts.map(toast => {
        const isError = toast.type === 'error'
        const color   = isError ? '#BB2325' : '#CDE3DE'

        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-[#FAFCFDE6] rounded-lg shadow-2xl px-3 py-3 min-w-[270px] md:min-w-[270px] min-w-[80vw]"
          >
            <div className="rounded-lg p-1.5 flex-shrink-0" style={{ backgroundColor: color }}>
              {isError
                ? <IoMdCloseCircleOutline size={16} color="white" />
                : <Check size={20} className="text-[#2C7B3C]" />
              }
            </div>
            <div>
              <p className="font-semibold text-sm text-[#2C7B3C]">{isError ? 'Error!' : 'SUCCESS!'}</p>
              <p className="text-[#122A48] text-xs ">{toast.message}</p>
            </div>

            <button
              onClick={() => onRemove(toast.id)}
              className="text-[#727272] hover:text-[#4f4e4e] cursor-pointer ml-2 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}