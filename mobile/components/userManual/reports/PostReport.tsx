import React, { useState } from "react";
import { View, Text, Image, Pressable, Modal } from "react-native";
import {
  CheckCircle2,
  ClipboardList,
  Trash2,
  PlusCircle,
  Camera,
  ZoomIn,
  X,
  Lightbulb,
  ClipboardCheck,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";

const postReportImages = [
  {
    title: "Review Response and Sensor Information",
    description:
      "The Post-Report form displays the response details recorded during the pre-report, including the barangay, purok, detected date, severity, assigned personnel, and action taken. It also shows the canal condition readings collected by the sensors. These recorded details cannot be edited.",
    source: require("../../../assets/images/userManual/reports/post-report-response.png"),
  },
  {
    title: "Enter Waste Composition",
    description:
      "Under Waste Composition, enter the estimated weight in kilograms for each waste category collected during the clearing operation. Any category left blank will automatically be recorded as 0 when submitted. The system automatically calculates the total waste collected.",
    source: require("../../../assets/images/userManual/reports/post-report-waste.png"),
  },
  {
    title: "Add Other Waste",
    description:
      "If the collected waste does not belong to the available categories, tap Add other waste. Select an existing waste type or enter a new name using letters only. Newly added waste types will be reviewed by MENRO before becoming available to other barangays.",
    source: require("../../../assets/images/userManual/reports/post-report-other-waste.png"),
  },
  {
    title: "Complete the Post-Report",
    description:
      "Review the automatically calculated total waste collected and enter any additional remarks if necessary. Upload the required Before Cleanup and After Cleanup photos. You may also attach additional evidence. Once all required information is provided, tap Complete Post-Report to submit, or Save Draft to continue later.",
    source: require("../../../assets/images/userManual/reports/post-report-completion.png"),
  },
];

type PostReportProps = {
  expanded: boolean;
  onPress: () => void;
};

export default function PostReport({ expanded, onPress }: PostReportProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <ManualSection
      title="COMPLETING A POST-REPORT"
      number={6}
      icon={<ClipboardCheck size={20} color="#203D70" />}
      description="Learn how to record waste composition, document the clearing operation, upload cleanup photos, and submit the post-report."
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
            Recording a Post-Report
          </Text>

          <Text className="text-xs leading-5 text-slate-500">
            After responding to a detected clog event, barangay personnel can
            complete the post-report to document the clearing operation. This
            includes reviewing the recorded response and sensor information,
            entering the waste composition, recording the total waste collected,
            and uploading cleanup documentation.
          </Text>
        </View>

        {/* INSTRUCTIONS */}
        <View className="mb-5">
          <Text className="mb-3 text-xs font-bold tracking-wider text-slate-700">
            HOW TO COMPLETE A POST-REPORT
          </Text>

          <ManualStep number={1}>
            After submitting the clog event response, select Continue to Report
            to proceed to the Post-Report form.
          </ManualStep>

          <ManualStep number={2}>
            Review the Response and Canal Condition information. These details
            are automatically retrieved from the pre-report and sensor readings.
            They cannot be edited.
          </ManualStep>

          <ManualStep number={3}>
            Under Waste Composition, enter the estimated weight in kilograms for
            each applicable waste category, such as Plastic, Food Wrapper, Paper
            / Cardboard, Glass, Organic, and other listed categories.
          </ManualStep>

          <ManualStep number={4}>
            If a waste type is not included in the available categories, tap Add
            other waste. Select an existing type or enter a new waste name. New
            waste types must be reviewed and approved by MENRO.
          </ManualStep>

          <ManualStep number={5}>
            Proceed to the Barangay Response section. Review the Waste Collected
            total, which is automatically calculated based on the entered waste
            composition. You may also provide additional information in the
            Remarks field.
          </ManualStep>

          <ManualStep number={6}>
            Upload the required Before Cleanup and After Cleanup photos to
            document the condition of the canal before and after the clearing
            operation. You may also upload Additional Evidence if necessary.
          </ManualStep>

          <ManualStep number={7}>
            Review the information and uploaded photos. Tap Complete Post-Report
            to submit the report, or Save Draft if you want to continue
            completing it later.
          </ManualStep>
        </View>

        {/* SCREENSHOT GUIDE */}
        <View className="mb-4">
          <Text className="text-xs font-bold tracking-wider text-slate-700">
            POST-REPORT PROCESS GUIDE
          </Text>

          <Text className="mt-1 text-[10px] leading-4 text-slate-400">
            Refer to the screenshots below to understand each stage of
            completing a post-report. Tap any image to enlarge it.
          </Text>
        </View>

        {/* SCREENSHOT CARDS */}
        {postReportImages.map((item, index) => (
          <View
            key={item.title}
            className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* IMAGE HEADER */}
            <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3">
              <View className="mr-2 flex-1 flex-row items-center">
                <View className="mr-2 h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  {index === 0 && <ClipboardList size={15} color="#203D70" />}
                  {index === 1 && <Trash2 size={15} color="#203D70" />}
                  {index === 2 && <PlusCircle size={15} color="#203D70" />}
                  {index === 3 && <Camera size={15} color="#16A34A" />}
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
            Make sure to enter the correct estimated weight for each waste
            category and upload clear Before and After Cleanup photos. Remember
            that the sensor readings and response details are automatically
            recorded and cannot be edited. Use Save Draft if you are not yet
            ready to submit the report.
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
              source={postReportImages[selectedImage].source}
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
