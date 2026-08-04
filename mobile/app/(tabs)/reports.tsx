import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { listDrafts, ReportDraft } from "@/lib/reportDrafts";
import { BarangayMonthlyReport } from "@/types/reports";

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View
      className="flex-1 rounded-xl border border-[#f1f5f9] bg-white p-3.5"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text className="mb-1.5 text-xs font-medium text-[#475569]">
        {label}
      </Text>
      <Text className="text-xl font-bold text-[#0f172a]">
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: "Draft" | "Pending" | "Reviewed" }) {
  let bgColor = "#e0f2fe";
  let textColor = "#0369a1";

  if (status === "Draft") {
    bgColor = "#fef3c7";
    textColor = "#b45309";
  } else if (status === "Reviewed") {
    bgColor = "#dcfce7";
    textColor = "#15803d";
  }

  return (
    <View
      className="shrink-0 self-start rounded-xl px-2.5 py-1"
      style={{ backgroundColor: bgColor }}
    >
      <Text className="text-[11px] font-semibold" style={{ color: textColor }}>
        {status}
      </Text>
    </View>
  );
}

function formatMonth(reportMonth: string) {
  const d = new Date(reportMonth);
  if (isNaN(d.getTime())) return reportMonth;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Unified row type so drafts (local) and submitted reports (backend) can render in one list
type ReportRow =
  | { kind: "draft"; key: string; draft: ReportDraft }
  | { kind: "submitted"; key: string; report: BarangayMonthlyReport };

export default function ReportsListScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [drafts, setDrafts] = useState<ReportDraft[]>([]);
  const [reports, setReports] = useState<BarangayMonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [localDrafts, res] = await Promise.all([
        listDrafts(),
        api.get("/api/barangay-reports/"),
      ]);
      setDrafts(localDrafts);
      setReports(res.results ?? res);
    } catch (err: any) {
      setError(err?.error ?? "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh every time this screen comes into focus (e.g. after saving a draft or submitting)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalReports = drafts.length + reports.length;
  const draftsCount = drafts.length;
  const submittedCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending").length;

  const rows: ReportRow[] = [
    ...drafts.map((d): ReportRow => ({ kind: "draft", key: `draft-${d.barangay}-${d.report_month}`, draft: d })),
    ...reports.map((r): ReportRow => ({ kind: "submitted", key: `report-${r.monthly_report_id}`, report: r })),
  ].sort((a, b) => {
    const aDate = a.kind === "draft" ? a.draft.updated_at : a.report.submitted_at;
    const bDate = b.kind === "draft" ? b.draft.updated_at : b.report.submitted_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const getTotalKg = (r: { recyclables_kg: number; biodegradable_kg: number; residual_waste_kg: number; special_waste_kg: number | null }) =>
    r.recyclables_kg + r.biodegradable_kg + r.residual_waste_kg + (r.special_waste_kg ?? 0);

  const goToDraft = (draft: ReportDraft) => {
    router.push({
      pathname: "/new-report",
      params: { barangay: String(draft.barangay), report_month: draft.report_month },
    } as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8fafc]">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <ScrollView contentContainerClassName="p-4 pb-8">

        {/* Header Bar */}
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-lg font-bold text-[#122A48]" numberOfLines={2}>
            Clearing Operations Report
          </Text>

          <TouchableOpacity
            onPress={() => {
              const now = new Date();
              const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
              router.push({
                pathname: "/new-report",
                params: { barangay: String(user?.barangay_id ?? ""), report_month: reportMonth },
              } as any);
            }}
            className="shrink-0 flex-row items-center gap-1.5 rounded-lg bg-[#1d4ed8] px-3.5 py-2"
          >
            <MaterialCommunityIcons name="plus" size={18} color="white" />
            <Text className="text-[13px] font-semibold text-white">Add report</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text className="mb-3 text-xs text-[#dc2626]">{error}</Text>
        ) : null}

        {/* Metric Cards Grid */}
        <View className="mb-5 gap-2.5">
          <View className="flex-row gap-2.5">
            <MetricCard label="Total reports" value={totalReports} />
            <MetricCard label="Submitted" value={submittedCount} />
          </View>
          <View className="flex-row gap-2.5">
            <MetricCard label="Drafts" value={draftsCount} />
            <MetricCard label="Pending review" value={pendingCount} />
          </View>
        </View>

        <Text className="mb-3 text-sm font-semibold text-[#122A48]">
          Recent Reports
        </Text>

        {/* Reports Cards List */}
        <View className="gap-3">
          {rows.length === 0 && (
            <Text className="mt-5 text-center text-[13px] text-[#94a3b8]">
              No reports yet this period.
            </Text>
          )}

          {rows.map((row) => {
            const isDraft = row.kind === "draft";
            const monthLabel = isDraft ? formatMonth(row.draft.report_month) : formatMonth(row.report.report_month);
            const totalKg = isDraft ? getTotalKg(row.draft) : getTotalKg(row.report);
            const status: "Draft" | "Pending" | "Reviewed" = isDraft ? "Draft" : row.report.status;
            const filesCount = isDraft
              ? row.draft.before_photos.length + row.draft.after_photos.length
              : row.report.media.length;

            return (
              <TouchableOpacity
                key={row.key}
                activeOpacity={0.9}
                onPress={() => {
                  if (isDraft) {
                    goToDraft(row.draft);
                  } else {
                    router.push({
                      pathname: "/view-report",
                      params: { id: String(row.report.monthly_report_id) },
                    } as any);
                  }
                }}
                style={{
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                }}
                className="rounded-xl border border-[#e2e8f0] bg-white p-3.5"
              >
                {/* Header Row */}
                <View className="mb-2.5 flex-row items-start justify-between gap-2">
                  <View className="flex-1 flex-row items-start gap-2">
                    <MaterialCommunityIcons
                      name={isDraft ? "clipboard-text-outline" : "checkbox-marked-circle-outline"}
                      size={20}
                      color={isDraft ? "#d97706" : "#16a34a"}
                      style={{ marginTop: 2 }}
                    />
                    <Text className="flex-1 shrink text-sm font-semibold leading-5 text-[#0f172a]">
                      {monthLabel} Report
                    </Text>
                  </View>

                  <StatusBadge status={status} />
                </View>

                {/* Sub Metadata Row */}
                <View className="mb-3.5 flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="scale-balance" size={14} color="#64748b" />
                    <Text className="text-[11px] text-[#64748b]">{totalKg.toFixed(2)} kg</Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="paperclip" size={14} color="#64748b" />
                    <Text className="text-[11px] text-[#64748b]">
                      {filesCount} {filesCount === 1 ? "file" : "files"}
                    </Text>
                  </View>
                </View>

                <View className="mb-3 h-px bg-[#f1f5f9]" />

                {/* Card Action Buttons */}
                <View className="flex-row gap-2">
                  {isDraft ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        goToDraft(row.draft);
                      }}
                      className="flex-1 flex-row items-center justify-center gap-1 rounded-md bg-[#15803d] py-1.5"
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="white" />
                      <Text className="text-xs font-semibold text-white">Continue draft</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: "/view-report",
                          params: { id: String(row.report.monthly_report_id) },
                        } as any);
                      }}
                      className="flex-1 flex-row items-center justify-center gap-1 rounded-md border border-[#cbd5e1] py-1.5"
                    >
                      <MaterialCommunityIcons name="eye-outline" size={14} color="#475569" />
                      <Text className="text-xs font-medium text-[#475569]">View</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}