import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform, KeyboardTypeOptions, Image, Modal, ActivityIndicator, Pressable, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SubmitReportModal } from "@/components/reports/SubmitReportModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface PhotoAsset {
  uri: string;
  fileName: string;
  mediaId?: number;
  uploading?: boolean;
}

interface ReportFormState {
  submittedBy: string;
  entryDate: Date;
  bote_kg: number;
  bakal_kg: number;
  papel_kg: number;
  plastic_kg: number;
  karton_kg: number;
  biodegradable_kg: number;
  residual_waste_kg: number;
  special_waste_kg: number;
  amount_sold_bote_plastic: number;
  amount_sold_bakal: number;
  amount_sold_papel_karton: number;
  remarks: string;
  beforePhotos: PhotoAsset[];
  afterPhotos: PhotoAsset[];
}

const INITIAL_STATE: ReportFormState = {
  submittedBy: "",
  entryDate: new Date(),
  bote_kg: 0,
  bakal_kg: 0,
  papel_kg: 0,
  plastic_kg: 0,
  karton_kg: 0,
  biodegradable_kg: 0,
  residual_waste_kg: 0,
  special_waste_kg: 0,
  amount_sold_bote_plastic: 0,
  amount_sold_bakal: 0,
  amount_sold_papel_karton: 0,
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

            {photo.uploading ? (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => onRemove(index)}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5"
              >
                <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
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

function PhotoSourceSheet({ visible, onClose, onTakePhoto, onChooseGallery, }: {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseGallery: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/35 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl px-5 pt-3 pb-8" onPress={(e) => e.stopPropagation()}>
          {/* drag handle */}
          <View className="self-center w-10 h-1 rounded-full bg-[#E2E8F0] mb-4" />

          <Text className="text-sm font-bold text-[#122A48] mb-1">Add Photo</Text>
          <Text className="text-[11px] text-[#94A3B8] mb-3">Choose a source</Text>

          <TouchableOpacity
            onPress={onTakePhoto}
            className="flex-row items-center gap-3 py-3 border-b border-[#F1F5F9]"
          >
            <View className="w-10 h-10 rounded-xl bg-[#dcfce7] items-center justify-center">
              <MaterialCommunityIcons name="camera-outline" size={20} color="#16a34a" />
            </View>
            <Text className="text-[13px] font-semibold text-[#334155]">Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onChooseGallery}
            className="flex-row items-center gap-3 py-3"
          >
            <View className="w-10 h-10 rounded-xl bg-[#dcfce7] items-center justify-center">
              <MaterialCommunityIcons name="image-outline" size={20} color="#16a34a" />
            </View>
            <Text className="text-[13px] font-semibold text-[#334155]">Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 items-center justify-center rounded-xl bg-[#f1f5f9] py-3"
          >
            <Text className="text-[13px] font-semibold text-[#64748B]">Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
  const [monthlyReportId, setMonthlyReportId] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState<"Draft" | "Pending" | "Reviewed" | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [isDraftSavedModalVisible, setIsDraftSavedModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [photoSheetField, setPhotoSheetField] = useState<"beforePhotos" | "afterPhotos" | null>(null);

  useEffect(() => {
    if (!reportMonth) {
      setIsLoadingReport(false);
      return;
    }

    api
      .get(`/api/barangay-reports/mine/?report_month=${reportMonth}`)
      .then((report) => {
        setMonthlyReportId(report.monthly_report_id);
        setReportStatus(report.status);
        setIsEditingDraft(report.status === "Draft");

        const mediaToPhotos = (category: "Before_Clearing" | "After_Clearing"): PhotoAsset[] =>
          (report.media ?? [])
            .filter((m: any) => m.media_category === category)
            .map((m: any) => ({
              uri: m.file_url,
              fileName: m.file_path?.split("/").pop() ?? `photo_${m.media}.jpg`,
              mediaId: m.media,
            }));

        setForm((prev) => ({
          ...prev,
          entryDate: report.clearing_date ? new Date(report.clearing_date) : prev.entryDate,
          bote_kg: report.bote_kg,
          bakal_kg: report.bakal_kg,
          papel_kg: report.papel_kg,
          plastic_kg: report.plastic_kg,
          karton_kg: report.karton_kg,
          biodegradable_kg: report.biodegradable_kg,
          residual_waste_kg: report.residual_waste_kg,
          special_waste_kg: report.special_waste_kg,
          amount_sold_bote_plastic: Number(report.amount_sold_bote_plastic) || 0,
          amount_sold_bakal: Number(report.amount_sold_bakal) || 0,
          amount_sold_papel_karton: Number(report.amount_sold_papel_karton) || 0,
          remarks: report.remarks ?? "",
          beforePhotos: mediaToPhotos("Before_Clearing"),
          afterPhotos: mediaToPhotos("After_Clearing"),
        }));
      })
      .catch((err) => {
        // 404 just means "no report yet this month" — not an error, stay on the empty form
        if (err?.detail !== "Not found.") {
          Alert.alert("Error", "Couldn't load your existing report. Please try again.");
        }
      })
      .finally(() => setIsLoadingReport(false));

    if (user) {
      const nameParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
      setForm((prev) => ({ ...prev, submittedBy: nameParts || user.email || "" }));
    }
  }, [reportMonth, user]);

  const update = <K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalRecyclables = form.bote_kg + form.bakal_kg + form.papel_kg + form.plastic_kg + form.karton_kg;
  const totalCollected =
    totalRecyclables + form.biodegradable_kg + form.residual_waste_kg + form.special_waste_kg;

  const getWasteTypesSummary = () => {
    const types: string[] = [];
    if (totalRecyclables > 0) types.push("Recyclable");
    if (form.biodegradable_kg > 0) types.push("Biodegradable");
    if (form.residual_waste_kg > 0) types.push("Residual");
    if (form.special_waste_kg > 0) types.push("Special Waste");
    return types.length > 0 ? types.join(", ") : "Mixed Waste";
  };

  const ensureDraftExists = async (): Promise<number> => {
    if (monthlyReportId) return monthlyReportId;

    const report = await api.post("/api/barangay-reports/", {
      report_month: reportMonth,
      clearing_date: form.entryDate.toISOString().split("T")[0],
      bote_kg: form.bote_kg,
      bakal_kg: form.bakal_kg,
      papel_kg: form.papel_kg,
      plastic_kg: form.plastic_kg,
      karton_kg: form.karton_kg,
      biodegradable_kg: form.biodegradable_kg,
      residual_waste_kg: form.residual_waste_kg,
      special_waste_kg: form.special_waste_kg,
      amount_sold_bote_plastic: form.amount_sold_bote_plastic,
      amount_sold_bakal: form.amount_sold_bakal,
      amount_sold_papel_karton: form.amount_sold_papel_karton,
      remarks: form.remarks,
      status: "Draft",
    });

    setMonthlyReportId(report.monthly_report_id);
    setReportStatus(report.status);
    return report.monthly_report_id;
  };

  const pickFromGallery = async (field: "beforePhotos" | "afterPhotos") => {
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
    if (result.canceled || result.assets.length === 0) return;
    await uploadPickedAssets(field, result.assets);
  };

  const pickFromCamera = async (field: "beforePhotos" | "afterPhotos") => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow camera access to take evidence photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;
    await uploadPickedAssets(field, result.assets);
  };

  const uploadPickedAssets = async (
    field: "beforePhotos" | "afterPhotos",
    assets: ImagePicker.ImagePickerAsset[]
  ) => {
    const category = field === "beforePhotos" ? "Before_Clearing" : "After_Clearing";
    const pending: PhotoAsset[] = assets.map((asset) => ({
      uri: asset.uri,
      fileName: asset.fileName || asset.uri.split("/").pop() || "evidence_image.jpg",
      uploading: true,
    }));
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ...pending] }));

    try {
      const reportId = await ensureDraftExists();

      for (const photo of pending) {
        const formData = new FormData();
        formData.append("file", { uri: photo.uri, name: photo.fileName, type: "image/jpeg" });
        formData.append("media_type", "Image");
        formData.append("media_category", category);
        formData.append("monthly_report_id", String(reportId));

        const media = await api.upload("/api/report-media/upload/", formData);

        setForm((prev) => ({
          ...prev,
          [field]: prev[field].map((p) =>
            p.uri === photo.uri && p.uploading ? { ...p, uploading: false, mediaId: media.media } : p
          ),
        }));
      }
    } catch (err) {
      Alert.alert("Upload Failed", "One or more photos couldn't be uploaded. Please try again.");
      setForm((prev) => ({ ...prev, [field]: prev[field].filter((p) => !p.uploading) }));
    }
  };

  const removePhoto = async (field: "beforePhotos" | "afterPhotos", index: number) => {
    const photo = form[field][index];
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

    if (photo.mediaId) {
      try {
        await api.delete(`/api/report-media/${photo.mediaId}/`);
      } catch (err) {
        Alert.alert("Error", "Couldn't remove that photo from the server. Please try again.");
        setForm((prev) => ({
          ...prev,
          [field]: [...prev[field].slice(0, index), photo, ...prev[field].slice(index)],
        }));
      }
    }
  };

  const onAddPhoto = (field: "beforePhotos" | "afterPhotos") => {
    setPhotoSheetField(field);
  };

  const handleSaveDraft = async () => {
    if (!reportMonth) {
      Alert.alert("Error", "Missing report month context.");
      return;
    }

    setIsSavingDraft(true);
    try {
      const payload = {
        report_month: reportMonth,
        clearing_date: form.entryDate.toISOString().split("T")[0],
        bote_kg: form.bote_kg,
        bakal_kg: form.bakal_kg,
        papel_kg: form.papel_kg,
        plastic_kg: form.plastic_kg,
        karton_kg: form.karton_kg,
        biodegradable_kg: form.biodegradable_kg,
        residual_waste_kg: form.residual_waste_kg,
        special_waste_kg: form.special_waste_kg,
        amount_sold_bote_plastic: form.amount_sold_bote_plastic,
        amount_sold_bakal: form.amount_sold_bakal,
        amount_sold_papel_karton: form.amount_sold_papel_karton,
        remarks: form.remarks,
      };

      if (monthlyReportId) {
        const report = await api.patch(`/api/barangay-reports/${monthlyReportId}/`, payload);
        setReportStatus(report.status);
      } else {
        const report = await api.post("/api/barangay-reports/", { ...payload, status: "Draft" });
        setMonthlyReportId(report.monthly_report_id);
        setReportStatus(report.status);
      }

      setIsEditingDraft(true);
      setIsDraftSavedModalVisible(true);
    } catch (err: any) {
      const firstFieldError = typeof err === "object" && err !== null ? Object.values(err)[0] : null;
      const message = Array.isArray(firstFieldError) ? firstFieldError[0] : err?.detail;
      Alert.alert("Error", message ?? "Couldn't save draft. Please try again.");
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
      totalRecyclables > 0 ||
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

  const handleConfirmSubmit = async () => {
    if (!reportMonth) {
      Alert.alert("Error", "Missing report month context.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        report_month: reportMonth,
        clearing_date: form.entryDate.toISOString().split("T")[0],
        bote_kg: form.bote_kg,
        bakal_kg: form.bakal_kg,
        papel_kg: form.papel_kg,
        plastic_kg: form.plastic_kg,
        karton_kg: form.karton_kg,
        biodegradable_kg: form.biodegradable_kg,
        residual_waste_kg: form.residual_waste_kg,
        special_waste_kg: form.special_waste_kg,
        amount_sold_bote_plastic: form.amount_sold_bote_plastic,
        amount_sold_bakal: form.amount_sold_bakal,
        amount_sold_papel_karton: form.amount_sold_papel_karton,
        remarks: form.remarks,
        status: "Pending",
      };

      if (monthlyReportId) {
        await api.patch(`/api/barangay-reports/${monthlyReportId}/`, payload);
      } else {
        await api.post("/api/barangay-reports/", payload);
      }

      setIsSubmitModalVisible(false);
      Alert.alert("Report Submitted", "Your report was successfully submitted!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/reports" as any) },
      ]);
    } catch (err: any) {
      setIsSubmitModalVisible(false);
      const firstFieldError = typeof err === "object" && err !== null ? Object.values(err)[0] : null;
      const message = Array.isArray(firstFieldError) ? firstFieldError[0] : err?.detail;
      Alert.alert("Error", message ?? "Couldn't submit report. Please try again.");
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

      {isLoadingReport ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" size="large" />
        </View>
      ) : reportStatus && reportStatus !== "Draft" ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialCommunityIcons name="lock-outline" size={40} color="#94a3b8" />
          <Text className="mt-3 text-center text-sm font-semibold text-[#334155]">
            This month's report is already {reportStatus.toLowerCase()}
          </Text>
          <Text className="mt-1 text-center text-[13px] text-[#64748B]">
            It can no longer be edited from here.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/reports" as any)}
            className="mt-5 rounded-[10px] bg-[#16a34a] px-5 py-2.5"
          >
            <Text className="text-[13px] font-semibold text-white">Back to Reports</Text>
          </TouchableOpacity>
        </View>
      ) : (
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

            {/* Recyclables card */}
            <View className="mb-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <Text className="mb-2.5 text-xs font-bold text-[#334155]">
                Recyclables<Text className="text-[#dc2626]">*</Text>
              </Text>

              <View className="mb-2.5 flex-row gap-2.5">
                <Field label="Bote (Kg)" value={form.bote_kg === 0 ? "" : String(form.bote_kg)} onChangeText={(t) => update("bote_kg", toNumber(t))} placeholder="00.00" keyboardType="decimal-pad" />
                <Field label="Plastic (Kg)" value={form.plastic_kg === 0 ? "" : String(form.plastic_kg)} onChangeText={(t) => update("plastic_kg", toNumber(t))} placeholder="00.00" keyboardType="decimal-pad" />
              </View>
              <View className="mb-3 flex-row gap-2.5">
                <Field label="Amount Sold — Bote/Plastic (₱)" value={form.amount_sold_bote_plastic === 0 ? "" : String(form.amount_sold_bote_plastic)} onChangeText={(t) => update("amount_sold_bote_plastic", toNumber(t))} placeholder="e.g. 20.00" keyboardType="decimal-pad" />
              </View>

              <View className="mb-2.5 flex-row gap-2.5">
                <Field label="Bakal (Kg)" value={form.bakal_kg === 0 ? "" : String(form.bakal_kg)} onChangeText={(t) => update("bakal_kg", toNumber(t))} placeholder="00.00" keyboardType="decimal-pad" />
                <Field label="Amount Sold — Bakal (₱)" value={form.amount_sold_bakal === 0 ? "" : String(form.amount_sold_bakal)} onChangeText={(t) => update("amount_sold_bakal", toNumber(t))} placeholder="e.g. 0.00" keyboardType="decimal-pad" />
              </View>

              <View className="mb-2.5 flex-row gap-2.5">
                <Field label="Papel (Kg)" value={form.papel_kg === 0 ? "" : String(form.papel_kg)} onChangeText={(t) => update("papel_kg", toNumber(t))} placeholder="00.00" keyboardType="decimal-pad" />
                <Field label="Karton (Kg)" value={form.karton_kg === 0 ? "" : String(form.karton_kg)} onChangeText={(t) => update("karton_kg", toNumber(t))} placeholder="00.00" keyboardType="decimal-pad" />
              </View>
              <View className="flex-row gap-2.5">
                <Field label="Amount Sold — Papel/Karton (₱)" value={form.amount_sold_papel_karton === 0 ? "" : String(form.amount_sold_papel_karton)} onChangeText={(t) => update("amount_sold_papel_karton", toNumber(t))} placeholder="e.g. 28.00" keyboardType="decimal-pad" />
              </View>
            </View>

            {/* Other waste card */}
            <View className="mb-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <Text className="mb-2.5 text-xs font-bold text-[#334155]">Other Waste (Kg)</Text>

              <View className="mb-2.5 flex-row gap-2.5">
                <Field
                  label="Biodegradable"
                  required
                  value={form.biodegradable_kg === 0 ? "" : String(form.biodegradable_kg)}
                  onChangeText={(t) => update("biodegradable_kg", toNumber(t))}
                  placeholder="00.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-row gap-2.5">
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
            </View>

            <TotalCollectedCard amount={totalCollected} />

            <View className="mb-3 h-px bg-[#f1f5f9]" />

            <SectionHeader icon="tray-arrow-up" title="UPLOAD EVIDENCE" />
            <Field label="Narrative Report" required value={form.remarks} onChangeText={(t) => update("remarks", t)} placeholder="Give narrative report (min 10 characters)..." multiline numberOfLines={3} />

            <PhotoUploadMulti
              label="Before"
              required
              photos={form.beforePhotos}
              onAdd={() => onAddPhoto("beforePhotos")}
              onRemove={(index) => removePhoto("beforePhotos", index)}
            />
            <PhotoUploadMulti
              label="After"
              required
              photos={form.afterPhotos}
              onAdd={() => onAddPhoto("beforePhotos")}
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
      )}

      <SubmitReportModal
        visible={isSubmitModalVisible}
        onClose={() => setIsSubmitModalVisible(false)}
        onConfirm={handleConfirmSubmit}
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

      <PhotoSourceSheet
        visible={photoSheetField !== null}
        onClose={() => setPhotoSheetField(null)}
        onTakePhoto={() => {
          const field = photoSheetField;
          setPhotoSheetField(null);
          if (field) pickFromCamera(field);
        }}
        onChooseGallery={() => {
          const field = photoSheetField;
          setPhotoSheetField(null);
          if (field) pickFromGallery(field);
        }}
      />

      <DraftSavedModal visible={isDraftSavedModalVisible} onClose={handleDraftSavedClose} />
    </SafeAreaView>
  );
}