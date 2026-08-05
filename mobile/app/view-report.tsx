import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { api } from "@/lib/api";
import { BarangayMonthlyReport } from "@/types/reports";


function DetailLabelValue({ label, value, flex = 1, valueColor = "#122A48", }: {
  label: string;
  value: string;
  flex?: number;
  valueColor?: string;
}) {
  return (
    <View className="mb-3" style={{ flex }}>
      <Text className="mb-1 text-[10px] font-bold uppercase text-[#94a3b8]">
        {label}
      </Text>
      <Text className="text-[13px] font-bold" style={{ color: valueColor }}>
        {value || "—"}
      </Text>
    </View>
  );
}

function WasteCard({ icon, label, valueKg, }: {
  icon: string;
  label: string;
  valueKg: number;
}) {
  return (
    <View className="flex-1 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View className="mb-1.5 flex-row items-center gap-1.5">
        <MaterialCommunityIcons name={icon as any} size={16} color="#16a34a" />
        <Text className="text-xs font-semibold text-[#122A48]">
          {label}
        </Text>
      </View>
      <Text className="text-lg font-extrabold text-[#122A48]">
        ~ {valueKg} Kg
      </Text>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View className="mb-3 mt-1 flex-row items-center gap-1.5">
      <MaterialCommunityIcons name={icon as any} size={16} color="#16a34a" />
      <Text className="text-xs font-bold tracking-wide text-[#16a34a]">
        {title}
      </Text>
    </View>
  );
}


export default function ViewReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const [report, setReport] = useState<BarangayMonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!params.id) {
      setIsLoading(false);
      setLoadError(true);
      return;
    }
    api
      .get(`/api/barangay-reports/${params.id}/`)
      .then((data) => setReport(data))
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8fafc]">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (!report || loadError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8fafc]">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-sm text-[#64748b]">Report not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-3">
          <Text className="font-semibold text-[#1d4ed8]">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isDraft = report.status === "Draft";

  const statusConfig = {
    Draft: { bg: "#fef3c7", text: "#b45309", icon: "clipboard-text-outline", label: "Draft" },
    Pending: { bg: "#e0f2fe", text: "#0369a1", icon: "clock-outline", label: "Pending" },
    Reviewed: { bg: "#bbf7d0", text: "#15803d", icon: "check-circle-outline", label: "Reviewed" },
  } as const;
  const { bg: bannerBg, text: bannerText, icon: bannerIcon, label: statusLabel } = statusConfig[report.status];

  const beforePhotos = report.media.filter((m) => m.media_category === "Before_Clearing");
  const afterPhotos = report.media.filter((m) => m.media_category === "After_Clearing");
  const hasAttachment = beforePhotos.length > 0 || afterPhotos.length > 0;

  const formattedMonth = new Date(report.report_month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const formattedEntryDate = new Date(report.clearing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-[#122A48] -ml-7">Report Details</Text>
        <View></View>
      </View>

      <View className="flex-row items-center justify-between px-4 py-2.5" style={{ backgroundColor: bannerBg }}>
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name={bannerIcon as any} size={18} color={bannerText} />
          <Text className="text-[13px] font-bold" style={{ color: bannerText }}>{statusLabel}</Text>
        </View>
        <Text className="text-xs font-semibold" style={{ color: bannerText }}>{formattedEntryDate}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-3.5 pt-3 pb-6">
        <View className="rounded-2xl border border-[#f1f5f9] bg-white p-4 "
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <SectionHeader icon="information-outline" title="REPORT DETAILS" />

          <View className="mt-1 ">
            <DetailLabelValue label="REPORT MONTH" value={formattedMonth} />
            <View className="flex-row">
              <DetailLabelValue label="ENTRY DATE" value={formattedEntryDate} />
              <DetailLabelValue label="LOCATION" value={report.barangay_details?.barangay_name ?? ""} />
            </View>
            <View className="flex-row">
              <DetailLabelValue label="AMOUNT SOLD" value={`₱ ${Number(report.amount_sold ?? 0).toFixed(2)}`} />
              <DetailLabelValue label="STATUS" value={statusLabel} valueColor={bannerText} />
            </View>
            <View className="flex-row">
              <DetailLabelValue
                label="SUBMITTED BY"
                value={report.submitted_by_details ? `${report.submitted_by_details.first_name} ${report.submitted_by_details.last_name}` : ""}
              />
              <DetailLabelValue
                label="VERIFIED BY"
                value={report.verified_by_details ? `${report.verified_by_details.first_name} ${report.verified_by_details.last_name}` : ""}
              />
            </View>
            {report.remarks ? <DetailLabelValue label="NARRATIVE REPORT" value={report.remarks} /> : null}
          </View>

          <View className="my-3 h-px bg-[#f1f5f9]" />

          <SectionHeader icon="trash-can-outline" title="WASTE COLLECTED (KG)" />
          <View className="mb-3 gap-2.5">
            <View className="flex-row gap-2.5">
              <WasteCard icon="leaf" label="Biodegradable" valueKg={report.biodegradable_kg || 0} />
              <WasteCard icon="recycle" label="Recyclable" valueKg={report.recyclables_kg || 0} />
            </View>
            <View className="flex-row gap-2.5">
              <WasteCard icon="delete-outline" label="Residual" valueKg={report.residual_waste_kg || 0} />
              <WasteCard icon="archive-outline" label="Special" valueKg={report.special_waste_kg || 0} />
            </View>
          </View>

          {hasAttachment && (
            <>
              <View className="my-3 h-px bg-[#f1f5f9]" />
              <SectionHeader icon="paperclip" title="ATTACHMENTS" />
              <View className="mb-3 gap-2.5">
                {beforePhotos.length > 0 && (
                  <View>
                    <Text className="mb-1.5 text-[11px] font-semibold text-[#122A48]">Before Clearing</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {beforePhotos.map((m) => (
                        <Image key={m.media} source={{ uri: m.file_url ?? undefined }} className="h-20 w-20 rounded-[10px]" />
                      ))}
                    </View>
                  </View>
                )}
                {afterPhotos.length > 0 && (
                  <View>
                    <Text className="mb-1.5 text-[11px] font-semibold text-[#122A48]">After Clearing</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {afterPhotos.map((m) => (
                        <Image key={m.media} source={{ uri: m.file_url ?? undefined }} className="h-20 w-20 rounded-[10px]" />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          <View className="mt-4">
            <View className="flex-row gap-2.5">
              {isDraft && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/new-report",
                      params: { barangay: String(report.barangay), report_month: report.report_month },
                    } as any)
                  }
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-[#cbd5e1] bg-[#f1f5f9] py-3"
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="#334155" />
                  <Text className="text-[13px] font-semibold text-[#334155]">Continue Draft</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => Alert.alert("Export", "Exporting report to PDF...")}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] bg-[#16a34a] py-3"
              >
                <MaterialCommunityIcons name="tray-arrow-up" size={18} color="white" />
                <Text className="text-[13px] font-semibold text-white">Export to PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}