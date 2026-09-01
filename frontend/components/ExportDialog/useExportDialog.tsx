"use client"

import { useState } from "react"
import { FileDown } from "lucide-react"
import { DialogModal } from "@/components/DialogModal"
import { SpinnerIcon } from "@/components/SpinnerIcon"
import { DIALOG_COLOR } from "@/lib/constant"

type Step<T> =
  | { step: "idle" }
  | { step: "confirm"; arg: T }
  | { step: "loading"; arg: T }

type UseExportDialogOptions<T> = {
  title?: string
  description?: React.ReactNode | ((arg: T) => React.ReactNode)
  loadingTitle?: string
}

export function useExportDialog<T = void>(
  runExport: (arg: T) => Promise<void>,
  options?: UseExportDialogOptions<T>
) {
  const [state, setState] = useState<Step<T>>({ step: "idle" })

  const requestExport = (arg: T) => setState({ step: "confirm", arg })

  const handleConfirm = async () => {
    if (state.step !== "confirm") return
    setState({ step: "loading", arg: state.arg })
    try {
      await runExport(state.arg)
    } finally {
      setState({ step: "idle" })
    }
  }

  const description =
    state.step === "confirm"
      ? typeof options?.description === "function"
        ? (options.description as (arg: T) => React.ReactNode)(state.arg)
        : options?.description ?? "Are you sure you want to export this as a PDF?"
      : null

  const ExportDialogs = (
    <>
      <DialogModal
        open={state.step === "confirm"}
        onClose={() => setState({ step: "idle" })}
        onConfirm={handleConfirm}
        color={DIALOG_COLOR.lightblue}
        icon={FileDown}
        iconColor={DIALOG_COLOR.blue}
        title={options?.title ?? "Export PDF"}
        description={description}
        cancelLabel="Cancel"
        confirmLabel="Export"
      />
      <DialogModal
        open={state.step === "loading"}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title={options?.loadingTitle ?? "Generating PDF"}
        description="Please wait while your file is prepared."
      />
    </>
  )

  return { requestExport, ExportDialogs }
}