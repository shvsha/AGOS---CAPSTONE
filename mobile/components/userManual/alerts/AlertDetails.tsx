import React, { useState } from "react";
import { Image, Text, View, Pressable } from "react-native";

import {
  AlertTriangle,
  MapPin,
  Clock3,
  Radio,
  Droplets,
  Trash2,
  Battery,
  Wifi,
  ClipboardList,
  CheckCircle2,
  Wrench,
  Eye,
} from "lucide-react-native";

import ImageViewing from "react-native-image-viewing";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

const alertDetails = [
  {
    title: "Clog Alerts",
    description: "Displays information about the detected canal obstruction.",
    icon: <Trash2 size={17} color="#D97706" />,
    details: [
      "Clog severity or classification (Low, Moderate, or Critical).",
      "Detected location or barangay.",
      "Associated waste type or composition, when available.",
      "Date and time the clog was detected.",
    ],
  },
  {
    title: "Water Level Alerts",
    description:
      "Displays information about changes in the monitored water level.",
    icon: <Droplets size={17} color="#2563EB" />,
    details: [
      "Recorded water level measurement.",
      "Monitoring location or sensor node.",
      "Date and time of detection.",
      "Water level condition or rising status.",
    ],
  },
  {
    title: "Device Alerts",
    description:
      "Displays the condition and technical information of the sensor node.",
    icon: <Radio size={17} color="#7C3AED" />,
    details: [
      "Sensor node identification.",
      "Barangay or deployment location.",
      "Battery level and voltage.",
      "Signal strength and connection quality.",
      "Sensor connection and device status.",
      "Additional diagnostic information, when available.",
    ],
  },
  {
    title: "Report Alerts",
    description: "Displays information about report reminders and deadlines.",
    icon: <ClipboardList size={17} color="#0891B2" />,
    details: [
      "Report identification or title.",
      "Associated report status.",
      "Report due date.",
      "Date and time the notification was generated.",
    ],
  },
  {
    title: "Waste Type Alerts",
    description:
      "Displays information about waste records and their review status.",
    icon: <Trash2 size={17} color="#0D9488" />,
    details: [
      "Waste classification or type.",
      "Associated monitoring location, when available.",
      "Approval or rejection status.",
      "Date and time of the recorded notification.",
    ],
  },
];

export default function AlertDetails({ expanded, onPress }: Props) {
  const [isImageVisible, setIsImageVisible] = useState(false);

  const alertDetailsImage = require("../../../assets/images/userManual/alerts/alert-details.png");

  return (
    <>
      <ManualSection
        number={4}
        title="ALERT DETAILS"
        description="Provides detailed information about a selected alert and the event detected by the monitoring system."
        icon={<Eye size={18} color="#203D70" />}
        expanded={expanded}
        onPress={onPress}
      >
        <View className="mt-5 px-5">
          {/* INTRODUCTION */}
          <Text className="mb-4 text-[12px] leading-5 text-slate-600">
            The Alert Details screen provides additional information about a
            selected notification. It allows users to examine the detected
            event, its associated location, date and time, and other relevant
            information.
          </Text>

          <Text className="mb-4 text-[11px] leading-5 text-slate-500">
            The information displayed varies depending on the type of alert
            received by the system. Each alert provides details relevant to the
            detected event.
          </Text>

          {/* ALERT DETAILS SCREENSHOT */}
          <View className="mb-5">
            <Text className="mb-2 text-[13px] font-bold text-slate-800">
              Alert Details Preview
            </Text>

            <Text className="mb-3 text-[10px] text-slate-500">
              Tap the image to view the details in fullscreen.
            </Text>

            <Pressable
              onPress={() => setIsImageVisible(true)}
              className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
            >
              <View className="relative items-center bg-slate-50 p-2">
                <Image
                  source={alertDetailsImage}
                  resizeMode="contain"
                  style={{
                    width: "100%",
                    height: 430,
                  }}
                />

                <View className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-2">
                  <Text className="text-[10px] font-semibold text-white">
                    🔍 Tap to enlarge
                  </Text>
                </View>
              </View>

              <View className="border-t border-slate-100 px-4 py-3">
                <Text className="text-center text-xs font-semibold text-slate-700">
                  Alert Details
                </Text>

                <Text className="mt-1 text-center text-[10px] text-slate-400">
                  Example of a Node Offline alert and its device information.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* GENERAL INFORMATION */}
          <Text className="mb-3 text-[13px] font-bold text-slate-800">
            GENERAL ALERT INFORMATION
          </Text>

          {/* ALERT TYPE */}
          <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-start">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle size={17} color="#DC2626" />
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-bold text-slate-700">
                  Alert Type
                </Text>

                <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                  Identifies the specific event or condition detected by the
                  monitoring system, such as Node Offline, Water Level Rising,
                  or Critical Clog Detected.
                </Text>
              </View>
            </View>
          </View>

          {/* NODE / LOCATION */}
          <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-start">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <MapPin size={17} color="#2563EB" />
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-bold text-slate-700">
                  Node and Location
                </Text>

                <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                  Identifies the associated sensor node and the barangay or
                  monitored location where the event was detected, when
                  applicable.
                </Text>
              </View>
            </View>
          </View>

          {/* DETECTED TIME */}
          <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-start">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Clock3 size={17} color="#64748B" />
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-bold text-slate-700">
                  Date and Time Detected
                </Text>

                <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                  Shows the date and time when the event was detected or the
                  corresponding notification was generated.
                </Text>
              </View>
            </View>
          </View>

          {/* ALERT-SPECIFIC DETAILS */}
          <Text className="mb-2 mt-5 text-[13px] font-bold text-slate-800">
            DETAILS BASED ON ALERT TYPE
          </Text>

          <Text className="mb-4 text-[11px] leading-5 text-slate-500">
            Different alerts provide different sets of information. The
            following are examples of details that may appear depending on the
            notification received.
          </Text>

          {alertDetails.map((category) => (
            <View
              key={category.title}
              className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              {/* CATEGORY HEADER */}
              <View className="flex-row items-center border-b border-slate-100 bg-slate-50 px-4 py-3">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white">
                  {category.icon}
                </View>

                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-slate-800">
                    {category.title}
                  </Text>

                  <Text className="mt-0.5 text-[10px] leading-4 text-slate-500">
                    {category.description}
                  </Text>
                </View>
              </View>

              {/* DETAILS LIST */}
              <View className="p-4">
                {category.details.map((detail, index) => (
                  <View key={index} className="mb-2 flex-row items-start">
                    <View className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#7FA9B8]" />

                    <Text className="flex-1 text-[10px] leading-5 text-slate-600">
                      {detail}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* DEVICE HEALTH ACTION */}
          <View className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <View className="flex-row items-start">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white">
                <Battery size={17} color="#2563EB" />
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-bold text-slate-800">
                  View Device Health
                </Text>

                <Text className="mt-1 text-[10px] leading-4 text-slate-600">
                  For applicable device-related alerts, users may access the
                  View Device Health option to examine the sensor node's
                  battery, signal, sensor connection, and device status.
                </Text>
              </View>
            </View>
          </View>

          {/* HOW TO VIEW ALERT DETAILS */}
          <Text className="mb-3 text-[13px] font-bold text-slate-800">
            HOW TO VIEW ALERT DETAILS
          </Text>

          <ManualStep number={1}>
            <Text>
              Open the Alerts section from the application's bottom navigation
              menu.
            </Text>
          </ManualStep>

          <ManualStep number={2}>
            <Text>
              Browse the alert list and locate the notification you want to
              examine.
            </Text>
          </ManualStep>

          <ManualStep number={3}>
            <Text>
              Tap the selected alert card to open its detailed information.
            </Text>
          </ManualStep>

          <ManualStep number={4}>
            <Text>
              Review the information displayed, including the alert type,
              location, detection time, and other details relevant to the
              received alert.
            </Text>
          </ManualStep>

          <ManualStep number={5}>
            <Text>
              For applicable device-related alerts, tap View Device Health to
              examine additional sensor node information.
            </Text>
          </ManualStep>

          {/* TIP */}
          <ManualTip>
            The information shown in the Alert Details modal depends on the
            notification received. Device alerts, clog alerts, water level
            alerts, report alerts, and waste-related alerts may each display
            different information and available actions. Review the details
            relevant to the selected notification.
          </ManualTip>
        </View>
      </ManualSection>

      {/* FULLSCREEN IMAGE VIEWER */}
      <ImageViewing
        images={[
          {
            uri: Image.resolveAssetSource(alertDetailsImage).uri,
          },
        ]}
        imageIndex={0}
        visible={isImageVisible}
        onRequestClose={() => setIsImageVisible(false)}
        presentationStyle="fullScreen"
        backgroundColor="#0F172A"
      />
    </>
  );
}
