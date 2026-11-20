import React, { useState } from "react";
import { Image, Text, View, Pressable } from "react-native";

import {
  AlertTriangle,
  Trash2,
  Droplets,
  Radio,
  ClipboardList,
  CalendarDays,
} from "lucide-react-native";

import ImageViewing from "react-native-image-viewing";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

const filterCategories = [
  {
    title: "Clog Alerts",
    description: "Filters detected canal obstruction events.",
    icon: <Trash2 size={17} color="#D97706" />,
    items: [
      {
        name: "Low",
        description: "Displays alerts for low-level clog detection.",
        color: "#EAB308",
      },
      {
        name: "Moderate",
        description: "Displays alerts for moderate clog detection.",
        color: "#F97316",
      },
      {
        name: "Critical",
        description: "Displays alerts for critical clog detection.",
        color: "#DC2626",
      },
    ],
  },
  {
    title: "Water Level Alerts",
    description: "Filters alerts related to changes in water level.",
    icon: <Droplets size={17} color="#2563EB" />,
    items: [
      {
        name: "Water Level Rising",
        description: "Displays alerts indicating a rising water level.",
        color: "#2563EB",
      },
    ],
  },
  {
    title: "Device Alerts",
    description: "Filters alerts concerning sensor node conditions.",
    icon: <Radio size={17} color="#7C3AED" />,
    items: [
      {
        name: "Node Offline",
        description: "The sensor node is not currently connected.",
        color: "#7C3AED",
      },
      {
        name: "Low Battery",
        description: "The sensor node has a low battery level.",
        color: "#D97706",
      },
      {
        name: "Weak Signal",
        description: "The sensor node has a weak connection signal.",
        color: "#D97706",
      },
      {
        name: "Sensor Failure",
        description: "A sensor malfunction or failure is detected.",
        color: "#DC2626",
      },
      {
        name: "Inspection Request",
        description: "The device requires inspection or checking.",
        color: "#2563EB",
      },
    ],
  },
  {
    title: "Report Alerts",
    description: "Filters reminders and notifications about reports.",
    icon: <ClipboardList size={17} color="#0891B2" />,
    items: [
      {
        name: "Report Due Soon",
        description: "Displays reports approaching their due date.",
        color: "#D97706",
      },
      {
        name: "Overdue",
        description: "Displays reports that have passed their due date.",
        color: "#DC2626",
      },
    ],
  },
  {
    title: "Waste Type Alerts",
    description: "Filters waste-related records according to their status.",
    icon: <Trash2 size={17} color="#0D9488" />,
    items: [
      {
        name: "Approved",
        description: "Displays waste records that have been approved.",
        color: "#16A34A",
      },
      {
        name: "Rejected",
        description: "Displays waste records that have been rejected.",
        color: "#DC2626",
      },
    ],
  },
];

export default function AlertFilter({ expanded, onPress }: Props) {
  const [isImageVisible, setIsImageVisible] = useState(false);

  const filterImage = require("../../../assets/images/userManual/alerts/alert-filter.png");

  return (
    <>
      <ManualSection
        number={5}
        title="FILTERING ALERTS"
        description="Allows users to filter alerts according to their category and selected date range."
        icon={<AlertTriangle size={18} color="#203D70" />}
        expanded={expanded}
        onPress={onPress}
      >
        <View className="mt-5 px-5">
          {/* INTRODUCTION */}
          <Text className="mb-4 text-[12px] leading-5 text-slate-600">
            The Alert Filter allows users to narrow down the displayed
            notifications by selecting a specific alert category, corresponding
            alert type, and date range. This makes it easier to locate and
            review specific events recorded by the monitoring system.
          </Text>

          {/* FILTER SCREENSHOT */}
          <View className="mb-5">
            <Text className="mb-2 text-[13px] font-bold text-slate-800">
              Alert Filter Preview
            </Text>

            <Text className="mb-3 text-[10px] text-slate-500">
              Tap the image to view the filter interface in fullscreen.
            </Text>

            <Pressable
              onPress={() => setIsImageVisible(true)}
              className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
            >
              <View className="relative items-center bg-slate-50 p-2">
                <Image
                  source={filterImage}
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
                  Alert Filter Options
                </Text>

                <Text className="mt-1 text-center text-[10px] text-slate-400">
                  Available alert categories and date selection.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* AVAILABLE ALERT FILTERS */}
          <Text className="mb-2 text-[13px] font-bold text-slate-800">
            AVAILABLE ALERT FILTERS
          </Text>

          <Text className="mb-4 text-[11px] leading-5 text-slate-500">
            The available filters depend on the type of alert received by the
            system. Each category contains corresponding alert types that users
            can select. Not all filters will have records at all times.
          </Text>

          {/* FILTER CATEGORIES */}
          {filterCategories.map((category) => (
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

              {/* FILTER OPTIONS */}
              <View className="p-3">
                {category.items.map((item, index) => (
                  <View
                    key={item.name}
                    className={`flex-row items-start py-2 ${
                      index !== category.items.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <View
                      className="mr-3 mt-1 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />

                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-slate-700">
                        {item.name}
                      </Text>

                      <Text className="mt-0.5 text-[10px] leading-4 text-slate-500">
                        {item.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* DATE RANGE */}
          <Text className="mb-3 mt-2 text-[13px] font-bold text-slate-800">
            DATE RANGE FILTER
          </Text>

          <View className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <View className="flex-row items-center border-b border-slate-100 bg-slate-50 px-4 py-3">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white">
                <CalendarDays size={17} color="#2563EB" />
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-bold text-slate-800">
                  Filter by Date
                </Text>

                <Text className="mt-0.5 text-[10px] text-slate-500">
                  Select the period of alerts to display.
                </Text>
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row items-center justify-between border-b border-slate-100 py-3">
                <Text className="text-[11px] font-semibold text-slate-500">
                  START DATE
                </Text>

                <Text className="text-[11px] font-semibold text-[#203D70]">
                  Selected starting date
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[11px] font-semibold text-slate-500">
                  END DATE
                </Text>

                <Text className="text-[11px] font-semibold text-[#203D70]">
                  Selected ending date
                </Text>
              </View>

              <Text className="mt-2 text-[10px] leading-4 text-slate-500">
                Choose a start date and end date to display alerts recorded
                within the selected period.
              </Text>
            </View>
          </View>

          {/* HOW TO FILTER ALERTS */}
          <Text className="mb-3 text-[13px] font-bold text-slate-800">
            HOW TO FILTER ALERTS
          </Text>

          <ManualStep number={1}>
            <Text>
              Tap the Filter icon located at the upper-right corner of the
              Alerts screen.
            </Text>
          </ManualStep>

          <ManualStep number={2}>
            <Text>
              Select the alert category you want to filter, such as Clogs, Water
              Level, Devices, Reports, or Waste Types.
            </Text>
          </ManualStep>

          <ManualStep number={3}>
            <Text>
              Choose the corresponding filter under the selected category.
              Available options depend on the type of alert received by the
              system.
            </Text>
          </ManualStep>

          <ManualStep number={4}>
            <Text>
              To filter alerts by date, select the START DATE and END DATE to
              specify the period you want to view.
            </Text>
          </ManualStep>

          <ManualStep number={5}>
            <Text>
              Apply the selected filters to display alerts matching your chosen
              categories and date range.
            </Text>
          </ManualStep>

          {/* TIP */}
          <ManualTip>
            The available alert filters depend on the notifications generated by
            the system. Some categories may have no available records if no
            corresponding alerts have been received. You can also use the date
            range to narrow down the alerts displayed.
          </ManualTip>
        </View>
      </ManualSection>

      {/* FULLSCREEN FILTER IMAGE */}
      <ImageViewing
        images={[
          {
            uri: Image.resolveAssetSource(filterImage).uri,
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
