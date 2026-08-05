import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { api } from "@/lib/api";
import { BarangayMonthlyReport } from "@/types/reports";


function DetailLabelValue({ label, value, flex = 1, valueColor = "#1e293b", }: {
  label: string;
  value: string;
  flex?: number;
  valueColor?: string;
}) {
  return (
    <View style={{ flex, marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: "#94a3b8",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: valueColor }}>
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
    <View
      style={{
        flex: 1,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={16} color="#16a34a" />
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#334155" }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
        ~ {valueKg} Kg
      </Text>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
        marginTop: 4,
      }}
    >
      <MaterialCommunityIcons name={icon as any} size={16} color="#16a34a" />
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: "#16a34a",
          letterSpacing: 0.5,
        }}
      >
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
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (!report || loadError) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <Text style={{ color: "#64748b", fontSize: 14 }}>Report not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "#1d4ed8", fontWeight: "600" }}>Go Back</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>Report Details</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: bannerBg, paddingHorizontal: 16, paddingVertical: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialCommunityIcons name={bannerIcon as any} size={18} color={bannerText} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: bannerText }}>{statusLabel}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: "600", color: bannerText }}>{formattedEntryDate}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 }}>
        <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f1f5f9" }}>
          <SectionHeader icon="information-outline" title="REPORT DETAILS" />

          <View style={{ marginTop: 4 }}>
            <DetailLabelValue label="REPORT MONTH" value={formattedMonth} />
            <View style={{ flexDirection: "row" }}>
              <DetailLabelValue label="ENTRY DATE" value={formattedEntryDate} />
              <DetailLabelValue label="LOCATION" value={report.barangay_details?.barangay_name ?? ""} />
            </View>
            <View style={{ flexDirection: "row" }}>
              <DetailLabelValue label="AMOUNT SOLD (RECYCLABLES)" value={`₱ ${Number(report.amount_sold ?? 0).toFixed(2)}`} />
              <DetailLabelValue label="STATUS" value={statusLabel} valueColor={bannerText} />
            </View>
            {report.remarks ? <DetailLabelValue label="REMARKS" value={report.remarks} /> : null}
          </View>

          <View style={{ height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 }} />

          <SectionHeader icon="trash-can-outline" title="WASTE COLLECTED (KG)" />
          <View style={{ gap: 10, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <WasteCard icon="leaf" label="Biodegradable" valueKg={report.biodegradable_kg || 0} />
              <WasteCard icon="recycle" label="Recyclable" valueKg={report.recyclables_kg || 0} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <WasteCard icon="delete-outline" label="Residual" valueKg={report.residual_waste_kg || 0} />
              <WasteCard icon="archive-outline" label="Special" valueKg={report.special_waste_kg || 0} />
            </View>
          </View>

          {hasAttachment && (
            <>
              <View style={{ height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 }} />
              <SectionHeader icon="paperclip" title="ATTACHMENTS" />
              <View style={{ marginBottom: 12, gap: 10 }}>
                {beforePhotos.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Before Clearing</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {beforePhotos.map((m) => (
                        <Image key={m.media} source={{ uri: m.file_url ?? undefined }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                      ))}
                    </View>
                  </View>
                )}
                {afterPhotos.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>After Clearing</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {afterPhotos.map((m) => (
                        <Image key={m.media} source={{ uri: m.file_url ?? undefined }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {isDraft && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/new-report",
                      params: { barangay: String(report.barangay), report_month: report.report_month },
                    } as any)
                  }
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingVertical: 12 }}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="#334155" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155" }}>Continue Draft</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => Alert.alert("Export", "Exporting report to PDF...")}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12 }}
              >
                <MaterialCommunityIcons name="tray-arrow-up" size={18} color="white" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "white" }}>Export to PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}