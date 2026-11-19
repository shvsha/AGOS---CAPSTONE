import React, { useState } from "react";
import { Image, Text, View, Pressable } from "react-native";
import ImageViewing from "react-native-image-viewing";
import {
  CalendarRange,
  FileCheck2,
  AlertCircle,
  Users,
  Send,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export default function SubmissionPeriods({ expanded, onPress }: Props) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const periodsImage = require("../../../assets/images/userManual/reports/submission-periods.png");

  const periodDetailsImage = require("../../../assets/images/userManual/reports/submission-period-details.png");

  const screenshots = [
    {
      uri: Image.resolveAssetSource(periodsImage).uri,
    },
    {
      uri: Image.resolveAssetSource(periodDetailsImage).uri,
    },
  ];

  const openImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageVisible(true);
  };

  return (
    <ManualSection
      number={3}
      title="SUBMITTING REPORTS TO MENRO"
      description="View half-month submission periods, review included clearing operation reports, and submit verified reports to MENRO."
      icon={<Send size={18} color="#203D70" />}
      expanded={expanded}
      onPress={onPress}
    >
      {/* SCREEN 1: SUBMISSION PERIODS */}

      <View className="mx-5 mt-5">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          1. Submission Periods
        </Text>

        <Pressable
          onPress={() => openImage(0)}
          className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
        >
          <View className="relative">
            <Image
              source={periodsImage}
              resizeMode="contain"
              className="h-[500px] w-full"
              style={{ backgroundColor: "#F8FAFC" }}
            />

            <View className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-2">
              <Text className="text-[10px] font-semibold text-white">
                🔍 Tap to enlarge
              </Text>
            </View>
          </View>

          <View className="border-t border-slate-100 px-4 py-3">
            <Text className="text-center text-xs font-semibold text-slate-700">
              Submission Periods
            </Text>

            <Text className="mt-1 text-center text-[10px] text-slate-400">
              Displays available and previously submitted reporting periods.
            </Text>
          </View>
        </Pressable>
      </View>

      {/* SCREEN 1 INSTRUCTIONS */}

      <View className="mx-5 mt-4">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          How to View Submission Periods
        </Text>

        <ManualStep number={1}>
          <Text>
            From the Canal Monitoring Reports page, tap View periods under the
            Submit to MENRO section.
          </Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Review the available half-month reporting periods, their submission
            deadlines, and current statuses.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>
            Identify the current reporting period marked Open. Previously
            submitted periods display their submission status and date.
          </Text>
        </ManualStep>

        <ManualStep number={4}>
          <Text>
            Tap Open on the reporting period you want to review to access its
            submission details.
          </Text>
        </ManualStep>
      </View>

      {/* SCREEN 2: PERIOD DETAILS */}

      <View className="mx-5 mt-6">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          2. Submission Period Details
        </Text>

        <Pressable
          onPress={() => openImage(1)}
          className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
        >
          <View className="relative">
            <Image
              source={periodDetailsImage}
              resizeMode="contain"
              className="h-[560px] w-full"
              style={{ backgroundColor: "#F8FAFC" }}
            />

            <View className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-2">
              <Text className="text-[10px] font-semibold text-white">
                🔍 Tap to enlarge
              </Text>
            </View>
          </View>

          <View className="border-t border-slate-100 px-4 py-3">
            <Text className="text-center text-xs font-semibold text-slate-700">
              Submission Period Details
            </Text>

            <Text className="mt-1 text-center text-[10px] text-slate-400">
              Shows the submission summary, included reports, and signatories.
            </Text>
          </View>
        </Pressable>
      </View>

      {/* SCREEN 2 INSTRUCTIONS */}

      <View className="mx-5 mt-4">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          How to Review Submission Details
        </Text>

        <ManualStep number={1}>
          <Text>
            Check the reporting period and its due date displayed at the top of
            the screen.
          </Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Read any warning messages. These indicate missing signatories,
            unverified reports, or reporting periods that have not yet ended.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>
            Review the Summary section to see the total number of verified
            reports, collected waste weight, average response time, and incident
            severity.
          </Text>
        </ManualStep>

        <ManualStep number={4}>
          <Text>
            Check the Reports Included section to identify the clearing
            operation reports included in the submission. Review their barangay,
            sensor node, date, waste weight, and severity level.
          </Text>
        </ManualStep>

        <ManualStep number={5}>
          <Text>
            Scroll down to the Signatories section to check whether the required
            signatories are available.
          </Text>
        </ManualStep>

        <ManualStep number={6}>
          <Text>
            Once all submission requirements are satisfied, tap Submit to MENRO
            to submit the verified reports.
          </Text>
        </ManualStep>
      </View>

      {/* IMPORTANT INFORMATION */}

      <View className="mx-5 mt-6">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          Important Sections
        </Text>

        {/* SUMMARY */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-green-50">
              <FileCheck2 size={18} color="#16A34A" />
            </View>

            <Text className="text-xs font-bold text-slate-700">Summary</Text>
          </View>

          <Text className="ml-12 mt-1 text-[10px] leading-4 text-slate-500">
            Presents the reporting period's total reports, waste collected,
            average response time, and severity. Unverified reports are excluded
            from the submission.
          </Text>
        </View>

        {/* WARNINGS */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={18} color="#DC2626" />
            </View>

            <Text className="text-xs font-bold text-slate-700">
              Submission Warnings
            </Text>
          </View>

          <Text className="ml-12 mt-1 text-[10px] leading-4 text-slate-500">
            Displays reminders about missing signatories, unverified reports,
            and reporting period deadlines.
          </Text>
        </View>

        {/* SIGNATORIES */}

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-blue-50">
              <Users size={18} color="#2563EB" />
            </View>

            <Text className="text-xs font-bold text-slate-700">
              Signatories
            </Text>
          </View>

          <Text className="ml-12 mt-1 text-[10px] leading-4 text-slate-500">
            Shows the required signatories for the submission. Missing
            signatories must be addressed before the submission can proceed.
          </Text>
        </View>
      </View>

      {/* TIP */}

      <View className="mx-5 mt-5">
        <ManualTip>
          Before submitting reports to MENRO, make sure that all included
          clearing operation reports are verified and the required signatories
          are available. Check the submission deadline to avoid late
          submissions.
        </ManualTip>
      </View>

      {/* FULLSCREEN IMAGE VIEWER */}

      <ImageViewing
        images={screenshots}
        imageIndex={selectedImageIndex}
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
