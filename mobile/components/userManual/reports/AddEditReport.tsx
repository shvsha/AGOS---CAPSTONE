import React, { useState } from "react";
import { View, Text, Image, Pressable, Modal } from "react-native";
import {
  ClipboardList,
  Trash2,
  PlusCircle,
  Users,
  Camera,
  CheckCircle2,
  ZoomIn,
  X,
  Lightbulb,
  FileText,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";

const reportImages = [
  {
    title: "Cleanup Details and Canal Condition",
    description:
      "The Cleanup Details section contains the barangay, municipality, and cleanup date and time. The Overall Canal Condition section allows you to record the condition of the canals based on sensor data or manually entered information.",
    source: require("../../../assets/images/userManual/reports/1.png"),
    icon: "details",
  },
  {
    title: "Waste Composition",
    description:
      "Enter the estimated weight of collected waste under the appropriate categories. The system automatically calculates the total waste collected. You can also add other waste types that are not included in the predefined categories.",
    source: require("../../../assets/images/userManual/reports/2.png"),
    icon: "waste",
  },
  {
    title: "Add Other Waste",
    description:
      "Tap Add other waste to open the selection panel. Choose an existing saved waste type or search for and enter a new waste type. Newly submitted types may require MENRO approval.",
    source: require("../../../assets/images/userManual/reports/3.png"),
    icon: "add",
  },
  {
    title: "Barangay Response",
    description:
      "The Barangay Response section allows you to assign the personnel involved in the cleanup and describe the activities performed. The automatically calculated waste total and remarks field are also displayed here.",
    source: require("../../../assets/images/userManual/reports/4.png"),
    icon: "response",
  },
  {
    title: "Assign Personnel",
    description:
      "Tap Assign personnel to open the personnel selection panel. You can select saved names, use the same personnel from the previous report when available, or enter new names.",
    source: require("../../../assets/images/userManual/reports/5.png"),
    icon: "personnel",
  },
  {
    title: "Photos and Report Submission",
    description:
      "Upload photos for Before Cleanup, After Cleanup, and Additional Evidence. Once all required information is completed, tap Complete & Review to proceed or Save Draft to keep the report for later.",
    source: require("../../../assets/images/userManual/reports/6.png"),
    icon: "photos",
  },
];

type AddEditReportProps = {
  expanded: boolean;
  onPress: () => void;
};

export default function AddEditReport({
  expanded,
  onPress,
}: AddEditReportProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const renderImageIcon = (icon: string) => {
    switch (icon) {
      case "details":
        return <ClipboardList size={16} color="#203D70" />;
      case "waste":
        return <Trash2 size={16} color="#203D70" />;
      case "add":
        return <PlusCircle size={16} color="#203D70" />;
      case "response":
        return <Users size={16} color="#203D70" />;
      case "personnel":
        return <Users size={16} color="#203D70" />;
      case "photos":
        return <Camera size={16} color="#16A34A" />;
      default:
        return <FileText size={16} color="#203D70" />;
    }
  };

  return (
    <ManualSection
      title="ADDING AND EDITING A REPORT"
      number={1}
      icon={<ClipboardList size={20} color="#203D70" />}
      description="Learn how to create or update a weekly cleanup report by entering cleanup details, recording canal conditions, documenting collected waste, assigning personnel, and uploading supporting photos."
      expanded={expanded}
      onPress={onPress}
    >
      <View className="px-5 pb-3 pt-4">
        {/* INTRODUCTION */}
        <View className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <ClipboardList size={23} color="#203D70" />
          </View>

          <Text className="mb-1 text-sm font-bold text-slate-800">
            Creating a Weekly Cleanup Report
          </Text>

          <Text className="text-xs leading-5 text-slate-500">
            The Weekly Cleanup Report allows authorized users to document
            cleanup activities, record the condition of canals, estimate
            collected waste, assign personnel, and upload photos as supporting
            evidence.
          </Text>
        </View>

        {/* INSTRUCTIONS */}
        <View className="mb-5">
          <Text className="mb-3 text-xs font-bold tracking-wider text-slate-700">
            HOW TO ADD OR EDIT A REPORT
          </Text>

          <ManualStep number={1}>
            Open the Reports section from the bottom navigation menu. Select the
            option to create a new report or open an existing report that you
            want to edit.
          </ManualStep>

          <ManualStep number={2}>
            Under Cleanup Details, review the barangay and municipality. Enter
            or confirm the date and time of the cleanup.
          </ManualStep>

          <ManualStep number={3}>
            Review the Overall Canal Condition section. Check the available
            sensor information or manually enter the barangay's water level,
            obstruction coverage, and water flow when required.
          </ManualStep>

          <ManualStep number={4}>
            Scroll down to Waste Composition. Enter the estimated weight of
            collected waste under the appropriate categories. The total waste
            collected is calculated automatically.
          </ManualStep>

          <ManualStep number={5}>
            If the collected waste is not included in the available categories,
            tap Add other waste. Select a saved waste type or enter a new one.
          </ManualStep>

          <ManualStep number={6}>
            Under Barangay Response, assign the personnel involved in the
            cleanup. Enter a clear description of the activities performed in
            the Action Taken field.
          </ManualStep>

          <ManualStep number={7}>
            Review the Waste Collected total and enter remarks when necessary.
            Use the Remarks field to describe additional information about the
            cleanup or canal condition.
          </ManualStep>

          <ManualStep number={8}>
            Upload the required Before Cleanup and After Cleanup photos. You may
            also upload Additional Evidence to support the report.
          </ManualStep>

          <ManualStep number={9}>
            Review the information you entered. Tap Complete & Review to proceed
            with the report review, or Save Draft if you want to continue
            working on the report later.
          </ManualStep>
        </View>

        {/* SCREENSHOT GUIDE */}
        <View className="mb-4">
          <Text className="text-xs font-bold tracking-wider text-slate-700">
            REPORT CREATION GUIDE
          </Text>

          <Text className="mt-1 text-[10px] leading-4 text-slate-400">
            Refer to the screenshots below to understand each part of the report
            form. Tap any image to enlarge it.
          </Text>
        </View>

        {/* SCREENSHOT CARDS */}
        {reportImages.map((item, index) => (
          <View
            key={item.title}
            className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* IMAGE HEADER */}
            <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3">
              <View className="mr-2 flex-1 flex-row items-center">
                <View className="mr-2 h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  {renderImageIcon(item.icon)}
                </View>

                <Text className="flex-1 text-[11px] font-bold text-slate-700">
                  {index + 1}. {item.title}
                </Text>
              </View>

              <View className="flex-row items-center rounded-full bg-blue-50 px-2 py-1">
                <ZoomIn size={10} color="#2563EB" />
                <Text className="ml-1 text-[8px] font-bold text-blue-600">
                  ENLARGE
                </Text>
              </View>
            </View>

            {/* IMAGE PREVIEW */}
            <Pressable
              onPress={() => setSelectedImage(index)}
              className="items-center bg-slate-50 px-3 py-3"
            >
              <Image
                source={item.source}
                resizeMode="contain"
                style={{
                  width: "100%",
                  height: 380,
                }}
              />

              <View className="absolute bottom-5 flex-row items-center rounded-full bg-black/60 px-3 py-2">
                <ZoomIn size={12} color="#FFFFFF" />
                <Text className="ml-1.5 text-[9px] font-semibold text-white">
                  Tap image to enlarge
                </Text>
              </View>
            </Pressable>

            {/* DESCRIPTION */}
            <View className="border-t border-slate-100 px-4 py-3">
              <Text className="text-[11px] leading-5 text-slate-500">
                {item.description}
              </Text>
            </View>
          </View>
        ))}

        {/* USER TIP */}
        <View className="mt-1 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <View className="mb-2 flex-row items-center">
            <Lightbulb size={17} color="#B45309" />
            <Text className="ml-2 text-xs font-bold text-amber-800">
              USER TIP
            </Text>
          </View>

          <Text className="text-xs leading-5 text-amber-900">
            Review all report details before submitting. Make sure the assigned
            personnel, waste estimates, cleanup remarks, and supporting photos
            are accurate. Use Save Draft if you are not ready to complete the
            report.
          </Text>
        </View>
      </View>

      {/* FULLSCREEN IMAGE VIEWER */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 items-center justify-center bg-black">
          <Pressable
            onPress={() => setSelectedImage(null)}
            className="absolute right-5 top-12 z-50 h-10 w-10 items-center justify-center rounded-full bg-white/90"
          >
            <X size={22} color="#172B4D" strokeWidth={2.5} />
          </Pressable>

          {selectedImage !== null && (
            <Image
              source={reportImages[selectedImage].source}
              resizeMode="contain"
              style={{
                width: "100%",
                height: "90%",
              }}
            />
          )}

          <View className="absolute bottom-8 left-0 right-0 items-center">
            <View className="rounded-full bg-white/15 px-4 py-2">
              <Text className="text-[10px] text-white">Tap X to close</Text>
            </View>
          </View>
        </View>
      </Modal>
    </ManualSection>
  );
}
