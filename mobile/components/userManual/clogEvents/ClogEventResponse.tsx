import React, { useState } from "react";
import { View, Text, Image, Pressable, Modal } from "react-native";
import {
  CheckCircle2,
  ClipboardCheck,
  Users,
  FileText,
  ZoomIn,
  X,
  Lightbulb,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";

const responseImages = [
  {
    title: "Mark Event as Responded",
    description:
      "Open the clog event details and locate the Timeline section. Tap Mark as Responded to begin recording the response.",
    source: require("../../../assets/images/userManual/clogEvents/clog-response-timeline.png"),
  },
  {
    title: "Response Details Form",
    description:
      "The Response Details form allows you to enter the date and time of response, assign personnel, and describe the action taken.",
    source: require("../../../assets/images/userManual/clogEvents/clog-response-form.png"),
  },
  {
    title: "Assign Personnel",
    description:
      "Tap Assign personnel to select saved names or enter new personnel. You can also use the same personnel as the last report when available.",
    source: require("../../../assets/images/userManual/clogEvents/clog-assign-personnel.png"),
  },
  {
    title: "Submit Response",
    description:
      "After assigning personnel and describing the action taken, review the information and tap Submit Response.",
    source: require("../../../assets/images/userManual/clogEvents/clog-submit-response.png"),
  },
  {
    title: "Response Confirmation",
    description:
      "Once submitted successfully, the event is marked as responded. Choose Continue to Report to proceed or Later to return to it another time.",
    source: require("../../../assets/images/userManual/clogEvents/clog-response-success.png"),
  },
];

type ClogEventResponseProps = {
  expanded: boolean;
  onPress: () => void;
};

export default function ClogEventResponse({
  expanded,
  onPress,
}: ClogEventResponseProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <ManualSection
      title="RESPONDING TO A CLOG EVENT"
      number={5}
      icon={<ClipboardCheck size={20} color="#203D70" />}
      description="Learn how to record a response to a detected clog event, assign personnel, document the action taken, and proceed to the report."
      expanded={expanded}
      onPress={onPress}
    >
      <View className="px-5 pb-3 pt-4">
        {/* INTRODUCTION */}
        <View className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <ClipboardCheck size={23} color="#203D70" />
          </View>

          <Text className="mb-1 text-sm font-bold text-slate-800">
            Recording a Clog Event Response
          </Text>

          <Text className="text-xs leading-5 text-slate-500">
            Once a clog event has been detected, authorized users can record the
            response by providing the response date and time, assigning
            personnel, and describing the clearing or maintenance action taken.
          </Text>
        </View>

        {/* INSTRUCTIONS */}
        <View className="mb-5">
          <Text className="mb-3 text-xs font-bold tracking-wider text-slate-700">
            HOW TO RESPOND TO A CLOG EVENT
          </Text>

          <ManualStep number={1}>
            Open the Clog Events section and select the detected event you want
            to respond to.
          </ManualStep>

          <ManualStep number={2}>
            Review the event information and scroll down to the Timeline
            section. Tap Mark as Responded.
          </ManualStep>

          <ManualStep number={3}>
            In the Response Details form, review the date and time responded.
            You may change it if the response happened earlier.
          </ManualStep>

          <ManualStep number={4}>
            Tap Assign personnel to select the people involved in the response.
            You can choose saved names, use the same personnel as the last
            report when available, or add new names.
          </ManualStep>

          <ManualStep number={5}>
            Enter the work performed in the Action Taken field. Provide a clear
            description of the clearing or maintenance activity.
          </ManualStep>

          <ManualStep number={6}>
            Review the required information and tap Submit Response to save the
            response.
          </ManualStep>

          <ManualStep number={7}>
            After the confirmation appears, select Continue to Report to proceed
            with report creation, or Later to return to it another time.
          </ManualStep>
        </View>

        {/* SCREENSHOT GUIDE */}
        <View className="mb-4">
          <Text className="text-xs font-bold tracking-wider text-slate-700">
            RESPONSE PROCESS GUIDE
          </Text>

          <Text className="mt-1 text-[10px] leading-4 text-slate-400">
            Refer to the screenshots below to understand each stage of the
            response process. Tap any image to enlarge it.
          </Text>
        </View>

        {/* SCREENSHOT CARDS */}
        {responseImages.map((item, index) => (
          <View
            key={item.title}
            className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* IMAGE HEADER */}
            <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3">
              <View className="mr-2 flex-1 flex-row items-center">
                <View className="mr-2 h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  {index === 0 && <CheckCircle2 size={15} color="#203D70" />}
                  {index === 1 && <ClipboardCheck size={15} color="#203D70" />}
                  {index === 2 && <Users size={15} color="#203D70" />}
                  {index === 3 && <FileText size={15} color="#203D70" />}
                  {index === 4 && <CheckCircle2 size={15} color="#16A34A" />}
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
            Make sure the assigned personnel and action taken are accurate
            before submitting. The response is not saved until you submit the
            form. Responding also marks the clog event as cleared.
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
              source={responseImages[selectedImage].source}
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
