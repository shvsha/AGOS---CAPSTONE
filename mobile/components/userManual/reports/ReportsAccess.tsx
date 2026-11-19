import React, { useState } from "react";
import { Image, Text, View, Pressable } from "react-native";
import ImageViewing from "react-native-image-viewing";
import {
  FileText,
  Send,
  ChartNoAxesCombined,
  Eye,
  Download,
  PlusCircle,
  CalendarDays,
  Scale,
  Paperclip,
  Clock,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export default function ReportsAccess({ expanded, onPress }: Props) {
  const [isImageVisible, setIsImageVisible] = useState(false);

  const reportsImage = require("../../../assets/images/userManual/reports/reports.png");

  return (
    <ManualSection
      number={1}
      title="REPORTS"
      description="Displays canal monitoring reports, submission periods, reporting performance, and previously created clearing operation reports."
      icon={<FileText size={18} color="#203D70" />}
      expanded={expanded}
      onPress={onPress}
    >
      {/* SCREENSHOT */}

      <View className="mx-5 mt-5">
        <Text className="mb-2 text-sm font-bold text-slate-800">
          Reports Page Overview
        </Text>

        <Pressable
          onPress={() => setIsImageVisible(true)}
          className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
        >
          <View className="relative">
            <Image
              source={reportsImage}
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
              Canal Monitoring Reports
            </Text>

            <Text className="mt-1 text-center text-[10px] text-slate-400">
              Tap to zoom and explore the different sections of the Reports
              page.
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ACCESSING THE REPORTS PAGE */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          How to Access Reports
        </Text>

        <ManualStep number={1}>
          <Text>
            Tap the Reports tab from the bottom navigation menu to open the
            Canal Monitoring Reports page.
          </Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Review the Submit to MENRO section to check the current reporting
            period, submission deadline, and submission status.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>
            Tap View periods to check the available reporting periods and their
            corresponding submission information.
          </Text>
        </ManualStep>
      </View>

      {/* SUBMISSION STATUS */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          Submission Status
        </Text>

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
              <Send size={17} color="#059669" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Submit to MENRO
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Displays the reporting period, submission deadline, and whether
                the report has already been submitted to MENRO.
              </Text>
            </View>
          </View>

          <View className="mt-3 border-t border-slate-100 pt-3">
            <Text className="text-[10px] leading-4 text-slate-500">
              A Submitted status indicates that the reporting period has already
              been submitted and that no submission is currently waiting.
            </Text>
          </View>
        </View>
      </View>

      {/* PERFORMANCE */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          Your Performance
        </Text>

        <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
              <ChartNoAxesCombined size={18} color="#059669" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Performance Summary
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Displays your reporting performance for the selected reporting
                period.
              </Text>
            </View>
          </View>

          <View className="mt-3 border-t border-slate-100 pt-3">
            <Text className="mb-2 text-[10px] leading-4 text-slate-500">
              The performance section includes the following information:
            </Text>

            <Text className="mb-2 text-[10px] leading-4 text-slate-600">
              • Reports – Total number of reports submitted during the period.
            </Text>

            <Text className="mb-2 text-[10px] leading-4 text-slate-600">
              • Waste – Total weight of collected waste, measured in kilograms
              (kg).
            </Text>

            <Text className="mb-2 text-[10px] leading-4 text-slate-600">
              • Average Response – Displays the average response time, when
              available.
            </Text>

            <Text className="text-[10px] leading-4 text-slate-600">
              • Performance Chart – Compares the collected waste across
              different reporting periods.
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-amber-50">
              <Clock size={17} color="#D97706" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Reporting Timeliness
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Shows the number of reporting periods submitted on time and
                identifies periods that require attention due to late
                submission.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* TIP */}

      <View className="mx-5 mt-5">
        <ManualTip>
          Regularly check the submission status and reporting performance to
          keep track of your reporting periods. Use the View button to review
          previously created reports and Export when you need a copy for
          documentation.
        </ManualTip>
      </View>

      {/* FULLSCREEN IMAGE VIEWER */}

      <ImageViewing
        images={[
          {
            uri: Image.resolveAssetSource(reportsImage).uri,
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
