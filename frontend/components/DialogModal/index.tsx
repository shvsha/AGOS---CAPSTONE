// shadcn
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type DialogModalProps = {
  open: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  color: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: React.ReactNode;
  cancelLabel?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  loading?: boolean;
}

export function DialogModal({
  open,
  onClose,
  onConfirm,
  color,
  icon: Icon,
  iconColor,
  title,
  description,
  cancelLabel,
  confirmLabel,
  loading = false,
}: DialogModalProps) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onClose}>
      <DialogContent className={`!max-w-[300px] sm:!max-w-[380px] bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)] ${!onClose || loading ? '[&>button]:hidden' : '[&>button]:cursor-pointer'}`}>
        <DialogHeader>
          <div className="flex items-center gap-3 ">
            <div className="p-2 rounded-lg" style={{ backgroundColor: color }}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" color={iconColor} />
            </div>
            <DialogTitle className="font-bold text-[#122A48] text-base sm:text-lg">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col">
          <DialogDescription className="text-[#122A48] text-[12px] sm:text-[15px] text-justify">
            {description}
          </DialogDescription>

          {(cancelLabel || confirmLabel) && (
            <>
              <hr className="my-3 mb-4" />
              <div className="flex gap-3 justify-end">
                {cancelLabel && (
                  <Button
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-lg border border-[#C6C6C8] px-4 h-8 sm:h-9 cursor-pointer text-[11px] sm:text-sm bg-transparent hover:bg-[#edebeb] text-[#727272] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelLabel}
                  </Button>
                )}
                {confirmLabel && (
                  <Button
                    onClick={onConfirm}
                    disabled={loading}
                    className="rounded-lg border border-[#C6C6C8] px-4 h-8 sm:h-9 cursor-pointer text-[11px] sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ backgroundColor: iconColor }}
                  >
                    {confirmLabel}
                  </Button>
                )}
              </div>
            </>
          )}

          {!cancelLabel && !confirmLabel && (
            <div>
              <hr className="my-3 mb-5" />
              <p className="text-[#727272] text-xs text-right font-semibold mt-3">Saving...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}