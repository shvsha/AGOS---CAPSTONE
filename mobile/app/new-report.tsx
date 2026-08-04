import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardTypeOptions, Image, Modal, ActivityIndicator, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { getDraft, saveDraft, deleteDraft } from "@/lib/reportDrafts";
import { SubmitReportModal } from "@/components/reports/SubmitReportModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface PhotoAsset {
  uri: string;
  fileName: string;
}

interface ReportFormState {
  submittedBy: string;
  entryDate: Date;
  recyclables_kg: number;
  biodegradable_kg: number;
  residual_waste_kg: number;
  special_waste_kg: number;
  amount_sold: number;
  remarks: string;
  beforePhotos: PhotoAsset[];
  afterPhotos: PhotoAsset[];
}

const INITIAL_STATE: ReportFormState = {
  submittedBy: "",
  entryDate: new Date(),
  recyclables_kg: 0,
  biodegradable_kg: 0,
  residual_waste_kg: 0,
  special_waste_kg: 0,
  amount_sold: 0,
  remarks: "",
  beforePhotos: [],
  afterPhotos: [],
};

function toNumber(text: string): number {
  const parsed = parseFloat(text);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, numberOfLines = 1, required = false, }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
}) {
  return (
    <View className={`flex-1 ${multiline ? "mb-3" : ""}`}>
      <Text className="mb-1.5 text-xs font-semibold text-[#334155]">
        {label} {required && <Text className="text-[#dc2626]">*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor="#94a3b8"
        className={`rounded-[10px] border border-[#e2e8f0] bg-[#f1f5f9] px-3 py-2.5 text-[13px] text-[#0f172a] ${
          multiline ? "min-h-[70px]" : ""
        }`}
      />
    </View>
  );
}

function DateField({ label, value, onChange, required = false, }: {
  label: string;
  value?: Date | string | null;
  onChange: (date: Date) => void;
  required?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const safeDate =
    value instanceof Date && !isNaN(value.getTime())
      ? value
      : value
      ? new Date(value)
      : new Date();

  const formatted = safeDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View className="flex-1">
      <Text className="mb-1.5 text-xs font-semibold text-[#334155]">
        {label} {required && <Text className="text-[#dc2626]">*</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="flex-row items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-[#f1f5f9] px-3 py-2.5"
      >
        <MaterialCommunityIcons name="calendar-outline" size={18} color="#94a3b8" />
        <Text className="text-[13px] text-[#475569]">{formatted}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={safeDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleDateChange}
        />
      )}
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

// Grid of photo thumbnails for a category (Before / After), each removable, plus an "add" tile
function PhotoUploadMulti({ label, photos, onAdd, onRemove, required = false, }: {
  label: string;
  photos: PhotoAsset[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  required?: boolean;
}) {
  return (
    <View className="mb-3.5">
      <Text className="mb-1.5 text-xs font-semibold text-[#334155]">
        {label} {required && <Text className="text-[#dc2626]">*</Text>}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {photos.map((photo, index) => (
          <View
            key={`${photo.uri}-${index}`}
            className="overflow-hidden rounded-xl border border-[#bbf7d0] bg-[#f0fdf4]"
            style={{ width: 96, height: 96 }}
          >
            <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <TouchableOpacity
              onPress={() => onRemove(index)}
              className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5"
            >
              <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={onAdd}
          className="items-center justify-center rounded-xl border-[1.5px] border-dashed border-[#86efac] bg-[#dcfce7]"
          style={{ width: 96, height: 96 }}
        >
          <MaterialCommunityIcons name="camera-plus-outline" size={22} color="#16a34a" />
          <Text className="mt-1 text-center text-[10px] font-semibold text-[#16a34a]">
            Add Photo{photos.length > 0 ? "s" : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TotalCollectedCard({ amount }: { amount: number }) {
  return (
    <View className="mb-3.5 flex-row items-center justify-between rounded-[10px] border border-dashed border-[#86efac] bg-[#dcfce7] px-3.5 py-2.5">
      <Text className="text-[13px] font-bold text-[#16a34a]">Σ Total collected</Text>
      <Text className="text-[13px] font-bold text-[#16a34a]">{amount.toFixed(2)} kg</Text>
    </View>
  );
}

// Draft Modal
function DraftSavedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-white p-6 items-center">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
            <MaterialCommunityIcons name="content-save-check-outline" size={28} color="#16a34a" />
          </View>
          <Text className="text-base font-extrabold text-[#122A48] mb-1">Draft Saved</Text>
          <Text className="text-[13px] text-[#64748B] text-center mb-5">
            Your report draft has been saved. You can continue editing it anytime from the Reports tab.
          </Text>
          <TouchableOpacity onPress={onClose} className="w-full rounded-xl bg-[#16a34a] py-3 items-center">
            <Text className="text-white font-bold text-sm">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function NewReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barangay?: string; report_month?: string }>();
  const { user } = useAuth();

  const barangayId = params.barangay ? Number(params.barangay) : user?.barangay_id ?? null;
  const reportMonth = params.report_month ?? null;

  const [form, setForm] = useState<ReportFormState>(INITIAL_STATE);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [isDraftSavedModalVisible, setIsDraftSavedModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Load existing draft (if any) for this barangay + month, and prefill submitter name
  useEffect(() => {
    if (barangayId && reportMonth) {
      getDraft(barangayId, reportMonth).then((draft) => {
        if (draft) {
          setIsEditingDraft(true);
          setForm((prev) => ({
            ...prev,
            entryDate: draft.clearing_date ? new Date(draft.clearing_date) : prev.entryDate,
            recyclables_kg: draft.recyclables_kg,
            biodegradable_kg: draft.biodegradable_kg,
            residual_waste_kg: draft.residual_waste_kg,
            special_waste_kg: draft.special_waste_kg,
            amount_sold: Number(draft.amount_sold) || 0,
            remarks: draft.remarks ?? "",
            beforePhotos: draft.before_photos ?? [],
            afterPhotos: draft.after_photos ?? [],
          }));
        }
      });
    }

    if (user) {
      const nameParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
      setForm((prev) => ({ ...prev, submittedBy: nameParts || user.email || "" }));
    }
  }, [barangayId, reportMonth, user]);

  const update = <K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalCollected =
    form.recyclables_kg + form.biodegradable_kg + form.residual_waste_kg + form.special_waste_kg;

  const getWasteTypesSummary = () => {
    const types: string[] = [];
    if (form.recyclables_kg > 0) types.push("Recyclable");
    if (form.biodegradable_kg > 0) types.push("Biodegradable");
    if (form.residual_waste_kg > 0) types.push("Residual");
    if (form.special_waste_kg > 0) types.push("Special Waste");
    return types.length > 0 ? types.join(", ") : "Mixed Waste";
  };

  const pickImages = async (field: "beforePhotos" | "afterPhotos") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload evidence.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos: PhotoAsset[] = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName || asset.uri.split("/").pop() || "evidence_image.jpg",
      }));

      setForm((prev) => ({ ...prev, [field]: [...prev[field], ...newPhotos] }));
    }
  };

  const removePhoto = (field: "beforePhotos" | "afterPhotos", index: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSaveDraft = async () => {
    if (!barangayId || !reportMonth) {
      Alert.alert("Error", "Missing barangay or report month context.");
      return;
    }

    setIsSavingDraft(true);
    try {
      await saveDraft({
        barangay: barangayId,
        report_month: reportMonth,
        clearing_date: form.entryDate.toISOString().split("T")[0],
        recyclables_kg: form.recyclables_kg,
        biodegradable_kg: form.biodegradable_kg,
        residual_waste_kg: form.residual_waste_kg,
        special_waste_kg: form.special_waste_kg,
        amount_sold: String(form.amount_sold),
        remarks: form.remarks,
        before_photos: form.beforePhotos,
        after_photos: form.afterPhotos,
        updated_at: new Date().toISOString(),
      });
      setIsEditingDraft(true);
      setIsDraftSavedModalVisible(true);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDraftSavedClose = () => {
    setIsDraftSavedModalVisible(false);
    // Always land back on the Reports list, regardless of where this screen was opened from
    router.replace("/(tabs)/reports" as any);
  };

  const handleOpenSubmitModal = () => {
    if (!form.submittedBy) {
      Alert.alert("Validation Error", "Please fill in 'Submitted by'.");
      return;
    }

    const hasAtLeastOneWaste =
      form.recyclables_kg > 0 ||
      form.biodegradable_kg > 0 ||
      form.residual_waste_kg > 0 ||
      form.special_waste_kg > 0;

    if (!hasAtLeastOneWaste) {
      Alert.alert(
        "Validation Error",
        "Please enter an amount greater than 0 for at least one waste category."
      );
      return;
    }

    if (!form.remarks.trim() || form.remarks.trim().length < 10) {
      Alert.alert(
        "Validation Error",
        "Please provide a detailed narrative report (at least 10 characters)."
      );
      return;
    }

    if (form.beforePhotos.length === 0 || form.afterPhotos.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please attach at least one 'Before' and one 'After' photo as documentation."
      );
      return;
    }

    setIsSubmitModalVisible(true);
  };

  const uploadPhoto = async (
    photo: PhotoAsset,
    monthlyReportId: number,
    mediaCategory: "Before_Clearing" | "After_Clearing"
  ) => {
    const formData = new FormData();
    // @ts-ignore - React Native's FormData file shape differs from web
    formData.append("file", { uri: photo.uri, name: photo.fileName, type: "image/jpeg" });
    formData.append("media_type", "Image");
    formData.append("media_category", mediaCategory);
    formData.append("monthly_report_id", String(monthlyReportId));

    await api.upload("/api/report-media/upload/", formData);
  };

  const handleConfirmSubmit = async () => {
    if (!barangayId || !reportMonth) {
      Alert.alert("Error", "Missing barangay or report month context.");
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await api.post("/api/barangay-reports/", {
        report_month: reportMonth,
        clearing_date: form.entryDate.toISOString().split("T")[0],
        recyclables_kg: form.recyclables_kg,
        biodegradable_kg: form.biodegradable_kg,
        residual_waste_kg: form.residual_waste_kg,
        special_waste_kg: form.special_waste_kg,
        amount_sold: form.amount_sold,
        remarks: form.remarks,
      });

      // Upload sequentially to keep this simple and easy to debug if one fails
      for (const photo of form.beforePhotos) {
        await uploadPhoto(photo, report.monthly_report_id, "Before_Clearing");
      }
      for (const photo of form.afterPhotos) {
        await uploadPhoto(photo, report.monthly_report_id, "After_Clearing");
      }

      await deleteDraft(barangayId, reportMonth);

      setIsSubmitModalVisible(false);
      Alert.alert("Report Submitted", "Your report was successfully submitted!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/reports" as any) },
      ]);
    } catch (err: any) {
      setIsSubmitModalVisible(false);
      Alert.alert("Submission Failed", err?.report_month?.[0] ?? err?.error ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0f172a" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-[#122A48]">
          {isEditingDraft ? "Edit Report Draft" : "New Clearing Report"}
        </Text>

        <View className="w-7"></View>
      </View>

      <ScrollView className="flex-1 text-[#122A48]" contentContainerClassName="px-3.5 pt-3 pb-6">
        <View className="rounded-2xl border border-[#f1f5f9] bg-white p-3.5"
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >

          <SectionHeader icon="information-outline" title="OPERATIONAL DETAILS" />
          <View className="mb-4 flex-row gap-2.5">
            <Field label="Submitted by" value={form.submittedBy} onChangeText={(t) => update("submittedBy", t)} placeholder="Brgy. Tanod" />
            <DateField label="Entry date" required value={form.entryDate} onChange={(d) => update("entryDate", d)} />
          </View>

          <View className="mb-3 h-px bg-[#f1f5f9]" />

          <SectionHeader icon="trash-can-outline" title="WASTE COLLECTED (KG)" />

          <View className="mb-3 flex-row gap-2.5">
            <Field
              label="Recyclable"
              required
              value={form.recyclables_kg === 0 ? "" : String(form.recyclables_kg)}
              onChangeText={(t) => update("recyclables_kg", toNumber(t))}
              placeholder="00.00"
              keyboardType="decimal-pad"
            />
            <Field
              label="Biodegradable"
              required
              value={form.biodegradable_kg === 0 ? "" : String(form.biodegradable_kg)}
              onChangeText={(t) => update("biodegradable_kg", toNumber(t))}
              placeholder="00.00"
              keyboardType="decimal-pad"
            />
          </View>

          <View className="mb-3.5 flex-row gap-2.5">
            <Field
              label="Residual"
              required
              value={form.residual_waste_kg === 0 ? "" : String(form.residual_waste_kg)}
              onChangeText={(t) => update("residual_waste_kg", toNumber(t))}
              placeholder="00.00"
              keyboardType="decimal-pad"
            />
            <Field
              label="Special Waste"
              required
              value={form.special_waste_kg === 0 ? "" : String(form.special_waste_kg)}
              onChangeText={(t) => update("special_waste_kg", toNumber(t))}
              placeholder="00.00"
              keyboardType="decimal-pad"
            />
          </View>

          <TotalCollectedCard amount={totalCollected} />

          <View className="mb-4">
            <Field label="Amount sold (₱)" value={form.amount_sold === 0 ? "" : String(form.amount_sold)} onChangeText={(t) => update("amount_sold", toNumber(t))} placeholder="e.g. 240.00" keyboardType="decimal-pad" />
          </View>

          <View className="mb-3 h-px bg-[#f1f5f9]" />

          <SectionHeader icon="tray-arrow-up" title="UPLOAD EVIDENCE" />
          <Field label="Narrative Report" required value={form.remarks} onChangeText={(t) => update("remarks", t)} placeholder="Give narrative report (min 10 characters)..." multiline numberOfLines={3} />

          <PhotoUploadMulti
            label="Before"
            required
            photos={form.beforePhotos}
            onAdd={() => pickImages("beforePhotos")}
            onRemove={(index) => removePhoto("beforePhotos", index)}
          />
          <PhotoUploadMulti
            label="After"
            required
            photos={form.afterPhotos}
            onAdd={() => pickImages("afterPhotos")}
            onRemove={(index) => removePhoto("afterPhotos", index)}
          />

          {/* Bottom Actions */}
          <View className="mt-3 flex-row gap-2.5">
            <TouchableOpacity
              onPress={handleSaveDraft}
              disabled={isSavingDraft}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-[#cbd5e1] bg-[#f8fafc] py-3 ${
                isSavingDraft ? "opacity-60" : "opacity-100"
              }`}
            >
              {isSavingDraft ? (
                <ActivityIndicator color="#475569" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#475569" />
                  <Text className="text-[13px] font-semibold text-[#475569]">Save Draft</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenSubmitModal}
              disabled={isSubmitting}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] bg-[#16a34a] py-3 ${
                isSubmitting ? "opacity-60" : "opacity-100"
              }`}
            >
              <MaterialCommunityIcons name="send-outline" size={18} color="white" />
              <Text className="text-[13px] font-semibold text-white">Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SubmitReportModal
        visible={isSubmitModalVisible}
        onClose={() => setIsSubmitModalVisible(false)}
        onConfirm={handleConfirmSubmit}
        barangayId={barangayId}
        reportMonth={reportMonth}
        summary={{
          location: user?.barangay_details?.barangay_name ?? "Your barangay",
          wasteTypeSummary: getWasteTypesSummary(),
          totalKg: totalCollected,
          attachmentsCount: form.beforePhotos.length + form.afterPhotos.length,
          responder: form.submittedBy,
          entryDate: form.entryDate,
        }}
      />

      <DraftSavedModal visible={isDraftSavedModalVisible} onClose={handleDraftSavedClose} />
    </SafeAreaView>
  );
}