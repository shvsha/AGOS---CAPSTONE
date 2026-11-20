import React, { useState } from "react";
import { Image, Text, View, Pressable } from "react-native";
import ImageViewing from "react-native-image-viewing";
import {
  Clock3,
  CalendarDays,
  Scale,
  Paperclip,
  Eye,
  Download,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export default function RecentReports({ expanded, onPress }: Props) {
  const [isImageVisible, setIsImageVisible] = useState(false);

  const recentReportsImage = require("../../../assets/images/userManual/reports/recent-reports.png");

  return (
    <ManualSection
      number={2}
      title="RECENT REPORTS"
      description="Displays previously created clearing operation reports, including their dates, collected waste weight, attached files, and available actions."
      icon={<Clock3 size={18} color="#203D70" />}
      expanded={expanded}
      onPress={onPress}
    >
      {/* SCREENSHOT */}

      <View className="mx-5 mt-5">
        <Pressable
          onPress={() => setIsImageVisible(true)}
          className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
        >
          <View className="relative">
            <Image
              source={recentReportsImage}
              resizeMode="contain"
              className="h-[430px] w-full"
              style={{
                backgroundColor: "#F8FAFC",
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
              Recent Reports
            </Text>

            <Text className="mt-1 text-center text-[10px] text-slate-400">
              Tap to zoom and explore the report list.
            </Text>
          </View>
        </Pressable>
      </View>

      {/* HOW TO REVIEW RECENT REPORTS */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          How to Review Recent Reports
        </Text>

        <ManualStep number={1}>
          <Text>
            Locate the Recent Reports section to view the previously created
            clearing operation reports.
          </Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Check the report title and severity level to identify the type and
            recorded condition of each report.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>
            Review the report date, total collected waste weight in kilograms
            (kg), and the number of attached files.
          </Text>
        </ManualStep>
      </View>

      {/* AVAILABLE ACTIONS */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          Available Report Actions
        </Text>

        {/* VIEW */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-blue-50">
              <Eye size={17} color="#2563EB" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                View Button
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Tap View to open and review the selected clearing operation
                report and its recorded information.
              </Text>
            </View>
          </View>
        </View>

        {/* EXPORT */}

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
              <Download size={17} color="#4F46E5" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Export Button
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Tap Export to generate or download a copy of the selected report
                for documentation.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* REPORT INFORMATION */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          Information Displayed
        </Text>

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <CalendarDays size={17} color="#64748B" />
            <Text className="ml-3 flex-1 text-xs font-bold text-slate-700">
              Report Date
            </Text>
          </View>

          <Text className="ml-7 mt-1 text-[10px] leading-4 text-slate-500">
            Indicates when the clearing operation report was created or
            recorded.
          </Text>
        </View>

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <Scale size={17} color="#64748B" />
            <Text className="ml-3 flex-1 text-xs font-bold text-slate-700">
              Collected Waste Weight
            </Text>
          </View>

          <Text className="ml-7 mt-1 text-[10px] leading-4 text-slate-500">
            Displays the total weight of waste collected during the clearing
            operation, measured in kilograms (kg).
          </Text>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <Paperclip size={17} color="#64748B" />
            <Text className="ml-3 flex-1 text-xs font-bold text-slate-700">
              Attached Files
            </Text>
          </View>

          <Text className="ml-7 mt-1 text-[10px] leading-4 text-slate-500">
            Shows the number of files attached to the report, such as supporting
            photographs and documentation.
          </Text>
        </View>
      </View>

      {/* TIP */}

      <View className="mx-5 mt-5">
        <ManualTip>
          Regularly review your recent reports to keep track of previously
          recorded clearing operations. Use View to check the report details and
          Export to obtain a copy when needed.
        </ManualTip>
      </View>

      {/* FULLSCREEN IMAGE VIEWER */}

      <ImageViewing
        images={[
          {
            uri: Image.resolveAssetSource(recentReportsImage).uri,
          },
        ]}
        imageIndex={0}
        visible={isImageVisible}
        onRequestClose={() => setIsImageVisible(false)}
        presentationStyle="fullScreen"
        backgroundColor="#0F172A"
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </ManualSection>
  );
}
