"use client"

// react
import { useState } from "react"
import { useRouter } from "next/navigation"

// shadcn
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// icons
import { ShieldCheck, X } from "lucide-react"

// component
import { DialogModal } from "@/components/DialogModal"
import { SpinnerIcon } from "@/components/SpinnerIcon"

// logo
import Image from "next/image"
import AgosLogo from '../../public/agos-logo.png'

// lib
import { api } from "@/lib/api"
import { syncUser, nextStepFor } from "@/lib/auth"
import { getErrorMessage } from "@/lib/utils"
import { DIALOG_COLOR } from "@/lib/constant"

export default function PrivacyConsent() {
  const router = useRouter()

  const [agreed, setAgreed] = useState<boolean>(false)
  const [isLoadingAgree, setIsLoadingAgree] = useState<boolean>(false)
  const [loadingDialog, setLoadingDialog] = useState<{ open: boolean }>({ open: false })
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const handleProceed = async () => {
    if (!agreed) return

    setIsLoadingAgree(true)
    setLoadingDialog({ open: true })
    try {
      const data = await api.post("/api/auth/agree-privacy/", {})
      syncUser(data.user)
      setLoadingDialog({ open: false })
      const next = nextStepFor(data.user)
      window.location.href = next ?? "/login"
    } catch (err) {
      setLoadingDialog({ open: false })
      setErrorDialog({ open: true, message: getErrorMessage(err) })
    } finally {
      setIsLoadingAgree(false)
    }
  }

  return (
    <>
      <div className="hidden md:flex flex-col">
        <div className="w-screen h-screen flex items-center justify-center">

          <Card className="w-full max-w-[85vw] sm:max-w-[500px] p-2 sm:p-3 sm:py-5 bg-[#FFFAFA] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
            <CardHeader className="items-center justify-center">
              <div className="flex justify-center">
                <Image
                  src={AgosLogo}
                  alt="AGOS Logo"
                  width={90}
                  height={90}
                  className="rounded-full flex-shrink-0 bg-[#CDE3DE]"
                />
              </div>
              <CardTitle className='text-black text-xs sm:text-sm text-center'>AGOS</CardTitle>
              <CardTitle className='text-[#1565BC] font-bold text-sm sm:text-base text-center'>Data Privacy Notice</CardTitle>
              <p className='text-[#122A48] text-[11px] text-xs text-center -mt-1'>
                Please read and agree to the notice below before continuing.
              </p>
            </CardHeader>

            <CardContent>
              <div className="border border-[#C6C6C8] rounded-lg bg-[#CDE3DE1A] p-4 sm:p-5 h-[280px] sm:h-[320px] overflow-y-auto text-[#122A48] text-[11px] text-xs leading-relaxed flex flex-col gap-3 text-justify ">
                <p>This notice is issued in accordance with Republic Act No. 10173, the Data Privacy Act of 2012, and its general data privacy principles of transparency, legitimate purpose, and proportionality (Sec. 11).</p>

                <div>
                  <p className="font-semibold mb-1">Information We Collect</p>
                  <p>As an authorized user of AGOS, we collect and process: your full name, email address, assigned role (Administrator, MENRO,  MENRO Staff, or Barangay Personnel), login activity and timestamps, and IP address for account security and audit purposes.</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Purpose of Collection</p>
                  <p>Your personal information is collected and processed solely for legitimate, declared purposes: authenticating your access to the system, maintaining accountability through system audit logs, sending account-related notices (e.g., credential issuance, password resets), and enabling your assigned responsibilities within the platform. Your data will not be processed in ways incompatible with these stated purposes.</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Your Rights as a Data Subject</p>
                  <p className="mb-1">Under Section 16 of the Data Privacy Act, you have the right to:</p>
                  <ul className="list-disc pl-4 flex flex-col gap-0.5">
                    <li>Be informed that your personal information is being processed, and how;</li>
                    <li>Reasonable access to your personal information, including how and why it is processed;</li>
                    <li>Dispute and request correction of any inaccurate or outdated information about you;</li>
                    <li>Object to processing, and request the suspension, withdrawal, blocking, or destruction of your data under circumstances allowed by law;</li>
                    <li>Be indemnified for damages sustained due to inaccurate, unlawfully obtained, or unauthorized use of your personal information; and</li>
                    <li>Lodge a complaint with the National Privacy Commission.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-1">Security Measures</p>
                  <p>In line with Section 20 of the Act, AGOS implements reasonable organizational, physical, and technical safeguards to protect your personal information against accidental or unlawful destruction, alteration, disclosure, or unauthorized access.</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Retention</p>
                  <p>Your information is retained only for as long as necessary to fulfill the purposes stated above, or as otherwise required for audit, legal, or compliance purposes.</p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#122A48] cursor-pointer shrink-0"
                />
                <span className="text-[#122A48] text-[11px] sm:text-xs text-left">
                  I confirm that I have read and understood this notice, and I freely give my informed consent to the collection and processing of my personal information as described.
                </span>
              </label>
            </CardContent>

            <CardFooter className='justify-center py-0 pb-0 pt-4 flex-col bg-transparent border-none -mt-5 mb-3'>
              <Button
                className='w-full bg-[#122A48] shadow-[0_8px_6px_-4px_rgba(0,0,0,0.3)] py-4 sm:py-4.5 cursor-pointer font-semibold text-[13px] sm:text-[16px] disabled:opacity-50 disabled:cursor-not-allowed'
                onClick={handleProceed}
                disabled={!agreed || isLoadingAgree}
              >
                {isLoadingAgree ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Proceeding...
                  </div>
                ) : "Proceed"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* loading dialog */}
      <DialogModal
        open={loadingDialog.open}
        color={DIALOG_COLOR.lightblue}
        icon={SpinnerIcon}
        iconColor={DIALOG_COLOR.blue}
        title="Recording Consent"
        description="Please wait while we save your response."
      />

      {/* error dialog */}
      <DialogModal
        open={errorDialog.open}
        onConfirm={() => setErrorDialog({ open: false, message: '' })}
        color={DIALOG_COLOR.lightred}
        icon={X}
        iconColor={DIALOG_COLOR.red}
        title="Something Went Wrong"
        description={errorDialog.message}
        confirmLabel="Okay"
      />
    </>
  )
}