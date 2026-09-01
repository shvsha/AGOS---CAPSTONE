import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/lib/api";

// temp test
const DEV_BYPASS_END_OF_MONTH = true;

interface SubmitReportModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reportMonth: string | null;
  summary: {
    location: string;
    wasteTypeSummary: string;
    totalKg: number;
    attachmentsCount: number;
    responder: string;
    entryDate?: Date;
  };
}

// Helper: Checks if a given date is the last day of its month
function isLastDayOfMonth(date: Date): boolean {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() === lastDay;
}

// Helper: Formats the last date of the month (e.g., "October 31, 2026")
function getLastDayFormatted(date: Date): string {
  const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return lastDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SubmitReportModal({ visible, onClose, onConfirm, reportMonth, summary, }: SubmitReportModalProps) {
  const targetDate = summary.entryDate || new Date();

  const isEndOfMonth = isLastDayOfMonth(targetDate);
  // const isEndOfMonth = DEV_BYPASS_END_OF_MONTH || isLastDayOfMonth(targetDate);

  const [checking, setChecking] = useState(true);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (!visible || !reportMonth) return;

    let cancelled = false;
    setChecking(true);

    api
      .get(`/api/barangay-reports/mine/?report_month=${reportMonth}`)
      .then((report) => {
        if (cancelled) return;
        setIsAlreadySubmitted(report.status !== "Draft");
      })
      .catch((err) => {
        // 404 = no report yet this month, so nothing to block on
        if (!cancelled) setIsAlreadySubmitted(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, reportMonth]);

  const [bypassRequested, setBypassRequested] = useState(false);
  const [showBypassConfirm, setShowBypassConfirm] = useState(false);

  const isSubmissionBlocked = checking || (!isEndOfMonth && !bypassRequested) || isAlreadySubmitted;

  const formattedMonth = targetDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const iconBgClass = checking
    ? "bg-[#f1f5f9]"
    : isSubmissionBlocked
    ? "bg-[#fef2f2]"
    : "bg-[#dcfce7]";

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-[#0f172a]/60 px-5"
          onPress={onClose}
        >
          <Pressable
            className="w-full rounded-3xl border border-[#f1f5f9] bg-white p-5"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header Icon & Title */}
            <View className="mb-4 items-center">
              <View
                className={`mb-2.5 h-12 w-12 items-center justify-center rounded-full ${iconBgClass}`}
              >
                {checking ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <MaterialCommunityIcons
                    name={isSubmissionBlocked ? "alert-circle-outline" : "file-check-outline"}
                    size={26}
                    color={isSubmissionBlocked ? "#dc2626" : "#16a34a"}
                  />
                )}
              </View>

              <Text className="text-lg font-extrabold text-[#0f172a]">
                {checking
                  ? "Checking..."
                  : !isEndOfMonth
                  ? "Submission Not Allowed Yet"
                  : isAlreadySubmitted
                  ? "Monthly Limit Reached"
                  : "Confirm Submission"}
              </Text>
              <Text className="mt-0.5 text-center text-xs text-[#64748b]">
                {checking
                  ? "Verifying this month's submission status..."
                  : !isEndOfMonth
                  ? `Reports can only be submitted on the last day of the month.`
                  : isAlreadySubmitted
                  ? `Only 1 report per barangay is permitted per month.`
                  : `Review summary before submitting for ${formattedMonth}`}
              </Text>
            </View>

            {/* WARNING 1: Not End of Month */}
            {!checking && !isEndOfMonth && !bypassRequested && (
              <View className="mb-4 flex-row items-center gap-2.5 rounded-xl border border-[#ffedd5] bg-[#fff7ed] p-3">
                <MaterialCommunityIcons name="calendar-clock" size={22} color="#c2410c" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#9a3412]">End-of-Month Rule Active</Text>
                  <Text className="mt-0.5 text-[11px] text-[#c2410c]">
                    Submissions for {formattedMonth} will open on{" "}
                    <Text className="font-bold">{getLastDayFormatted(targetDate)}</Text>.
                  </Text>
                  <Pressable onPress={() => setShowBypassConfirm(true)} className="mt-2 self-start">
                    <Text className="text-[11px] font-bold text-[#c2410c] underline">
                      Submit anyway
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* WARNING 2: Already Submitted This Month */}
            {!checking && isEndOfMonth && isAlreadySubmitted && (
              <View className="mb-4 flex-row items-center gap-2.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                <MaterialCommunityIcons name="information" size={20} color="#dc2626" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#991b1b]">
                    Already Submitted for {formattedMonth}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-[#b91c1c]">
                    A report for "{summary.location}" already exists for this month.
                  </Text>
                </View>
              </View>
            )}

            {/* Summary Details */}
            <View className="mb-[18px] gap-2 rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
              <View className="flex-row justify-between">
                <Text className="text-xs text-[#64748b]">Location:</Text>
                <Text className="text-xs font-bold text-[#0f172a]">
                  {summary.location || "N/A"}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-[#64748b]">Responder:</Text>
                <Text className="text-xs font-semibold text-[#334155]">
                  {summary.responder || "N/A"}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-[#64748b]">Waste Types:</Text>
                <Text className="text-xs font-semibold text-[#334155]">
                  {summary.wasteTypeSummary}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-[#64748b]">Total Waste Collected:</Text>
                <Text className="text-xs font-bold text-[#16a34a]">
                  {summary.totalKg.toFixed(2)} kg
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-[#64748b]">Evidence Photos:</Text>
                <Text className="text-xs font-semibold text-[#334155]">
                  {summary.attachmentsCount} file(s)
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 items-center rounded-xl border border-[#cbd5e1] py-3"
              >
                <Text className="text-[13px] font-semibold text-[#475569]">
                  {isSubmissionBlocked ? "Close" : "Cancel"}
                </Text>
              </TouchableOpacity>

              {!isSubmissionBlocked && (
                <TouchableOpacity
                  onPress={onConfirm}
                  className="flex-1 items-center rounded-xl bg-[#16a34a] py-3"
                >
                  <Text className="text-[13px] font-bold text-white">
                    Confirm & Submit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* bypas confirmation modal */}
      <Modal animationType="fade" transparent visible={showBypassConfirm} onRequestClose={() => setShowBypassConfirm(false)}>
        <Pressable className="flex-1 items-center justify-center bg-[#0f172a]/60 px-5" onPress={() => setShowBypassConfirm(false)}>
          <Pressable className="w-full rounded-3xl border border-[#f1f5f9] bg-white p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-extrabold text-[#0f172a] mb-1">Submit before month-end?</Text>
            <Text className="text-xs text-[#64748b] mb-4">
              The end-of-month rule exists to keep one report per barangay per cycle. Are you sure you want to bypass it?
            </Text>
            <View className="flex-row gap-2.5">
              <TouchableOpacity onPress={() => setShowBypassConfirm(false)} className="flex-1 items-center rounded-xl border border-[#cbd5e1] py-3">
                <Text className="text-[13px] font-semibold text-[#475569]">No, cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setBypassRequested(true); setShowBypassConfirm(false); }}
                className="flex-1 items-center rounded-xl bg-[#c2410c] py-3"
              >
                <Text className="text-[13px] font-bold text-white">Yes, bypass</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
    
  );
}