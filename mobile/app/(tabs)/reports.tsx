import React, { useState, useCallback, useRef  } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { BarangayMonthlyReport } from "@/types/reports";
import AlertBellButton from "@/components/alerts/AlertBellButton";

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Shadow } from "react-native-shadow-2";

import { exportPdf } from "@/lib/exportPdf";

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
      <Text className="mb-1.5 text-xs font-medium text-[#122A48]">
        {label}
      </Text>
      <Text className="text-xl font-bold text-[#122A48]">
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


export default function ReportsListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const hasLoadedOnce = useRef(false);
  const insets = useSafeAreaInsets()

  const [reports, setReports] = useState<BarangayMonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [exportingId, setExportingId] = useState<number | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setError("");
    try {
      const res = await api.get("/api/barangay-reports/");
      setReports(res.results ?? res);
      hasLoadedOnce.current = true;
    } catch (err: any) {
      setError(err?.detail ?? "Failed to load reports.");
    } finally {
      isRefresh ? setRefreshing(false) : setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalReports = reports.length;
  const draftsCount = reports.filter((r) => r.status === "Draft").length;
  const submittedCount = reports.filter((r) => r.status !== "Draft").length;
  const pendingCount = reports.filter((r) => r.status === "Pending").length;

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );

  const getTotalKg = (r: BarangayMonthlyReport) =>
    r.recyclables_kg + r.biodegradable_kg + r.residual_waste_kg + (r.special_waste_kg ?? 0);

  const goToReport = (report: BarangayMonthlyReport) => {
    if (report.status === "Draft") {
      router.push({
        pathname: "/new-report",
        params: { barangay: String(report.barangay), report_month: report.report_month },
      } as any);
    } else {
      router.push({
        pathname: "/view-report",
        params: { id: String(report.monthly_report_id) },
      } as any);
    }
  };

  const handleExport = async (report: BarangayMonthlyReport) => {
    setExportingId(report.monthly_report_id);
    try {
      await exportPdf(
        `/api/barangay-reports/${report.monthly_report_id}/export/`,
        `${report.barangay_details?.barangay_name ?? "barangay"}-MRF-${report.report_month}.pdf`
      );
    } catch {
      Alert.alert("Export failed", "Could not generate the PDF. Please try again.");
    } finally {
      setExportingId(null);
    }
  };

  if (isLoading || refreshing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator color="#2F6FED" />
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#122A48" />
        }
        contentContainerClassName="p-4 pb-8"
      >
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-lg font-bold text-[#122A48]" numberOfLines={2}>
            Clearing Operations Report
          </Text>

          <AlertBellButton />
        </View>

        {error ? <Text className="mb-3 text-xs text-[#dc2626]">{error}</Text> : null}

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

        <Text className="mb-3 text-sm font-semibold text-[#122A48]">Recent Reports</Text>

        <View className="gap-3">
          {sortedReports.length === 0 && (
            <Text className="mt-5 text-center text-[13px] text-[#94a3b8]">No reports yet this period.</Text>
          )}

          {sortedReports.map((report) => {
            const isDraft = report.status === "Draft";
            const monthLabel = formatMonth(report.report_month);
            const totalKg = getTotalKg(report);
            const filesCount = report.media.length;

            return (
              <TouchableOpacity
                key={report.monthly_report_id}
                activeOpacity={0.9}
                onPress={() => goToReport(report)}
                style={{
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                }}
                className="rounded-xl border border-[#e2e8f0] bg-white p-3.5"
              >
                <View className="mb-2.5 flex-row items-start justify-between gap-2">
                  <View className="flex-1 flex-row items-center gap-2">
                    <MaterialCommunityIcons
                      name={isDraft ? "clipboard-text-outline" : "checkbox-marked-circle-outline"}
                      size={20}
                      color={isDraft ? "#d97706" : "#16a34a"}
                      style={{ marginTop: 2 }}
                    />
                    <Text className="flex-1 shrink text-sm font-semibold leading-5 text-[#122A48]">
                      {monthLabel} Report
                    </Text>
                  </View>
                  <StatusBadge status={report.status} />
                </View>

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

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      goToReport(report);
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-1 rounded-md py-1.5 ${
                      isDraft ? "bg-[#15803d]" : "border border-[#cbd5e1]"
                    }`}
                  >
                    <MaterialCommunityIcons
                      name={isDraft ? "pencil-outline" : "eye-outline"}
                      size={14}
                      color={isDraft ? "white" : "#475569"}
                    />
                    <Text className={`text-xs font-semibold ${isDraft ? "text-white" : "text-[#475569] font-medium"}`}>
                      {isDraft ? "Continue draft" : "View"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleExport(report);
                    }}
                    disabled={exportingId === report.monthly_report_id}
                    className="flex-1 flex-row items-center justify-center gap-1 rounded-md border border-[#cbd5e1] py-1.5"
                    style={exportingId === report.monthly_report_id ? { opacity: 0.6 } : undefined}
                  >
                    {exportingId === report.monthly_report_id ? (
                      <ActivityIndicator size="small" color="#475569" />
                    ) : (
                      <MaterialCommunityIcons name="tray-arrow-up" size={14} color="#475569" />
                    )}
                    <Text className="text-xs font-medium text-[#475569]">
                      {exportingId === report.monthly_report_id ? "Exporting..." : "Export"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", bottom: 20 + insets.bottom, right: 20 }}>
        <Shadow
          distance={8}
          startColor="#0000001A"
          offset={[0, 4]}
          style={{ borderRadius: 16 }}
        >
          <TouchableOpacity
            onPress={() => {
              const now = new Date();
              const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
              router.push({
                pathname: "/new-report",
                params: { barangay: String(user?.barangay_id ?? ""), report_month: reportMonth },
              } as any);
            }}
            className="flex-row items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-3.5"
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
            <Text className="text-[13px] font-semibold text-white">Add report</Text>
          </TouchableOpacity>
        </Shadow>
      </View>
    </SafeAreaView>
  );
}