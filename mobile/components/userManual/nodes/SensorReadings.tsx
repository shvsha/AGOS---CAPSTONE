import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Cpu,
  Radio,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export default function SensorNodes({ expanded, onPress }: Props) {
  return (
    <ManualSection
      number={1}
      title="SENSOR NODES"
      description="View sensor readings and monitor the status of deployed sensor nodes."
      icon={<Radio size={18} color="#203D70" />}
      expanded={expanded}
      onPress={onPress}
    >
      <View className="mt-5 px-5">
        <Text className="mb-3 text-sm leading-6 text-slate-600">
          The Sensor Nodes screen allows users to monitor individual sensor
          nodes deployed across different canal locations. By selecting a sensor
          node, users can view its recorded readings, classify measurements
          according to their status, and check the device's health.
        </Text>

        {/* Sensor Readings Screen Preview */}
        <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <View className="bg-slate-100 p-3">
            {/* Phone Frame */}
            <View
              className="w-full self-center overflow-hidden border-[8px] border-black bg-[#EEF3F8]"
              style={{
                aspectRatio: 686 / 1440,
                borderRadius: 65,
              }}
            >
              {/* Phone Top / Dynamic Island */}
              <View
                className="items-center justify-center bg-white"
                style={{ height: "7%" }}
              >
                <View className="h-7 w-1/3 rounded-full bg-black" />
              </View>

              {/* Application Screen */}
              <View className="flex-1 bg-[#EEF3F8]">
                {/* Device Header */}
                <View className="flex-row items-center px-4 pt-3 pb-5">
                  <ArrowLeft size={27} color="#142D46" strokeWidth={2.5} />

                  <View className="ml-4">
                    <Text className="text-[17px] font-bold text-[#142D46]">
                      SN-1
                    </Text>
                    <Text className="text-[11px] text-slate-500">
                      CH-Poblacion West-1
                    </Text>
                  </View>
                </View>

                {/* Main Tabs */}
                <View className="flex-row border-b border-slate-200">
                  <View className="w-1/2 items-center border-b-[3px] border-[#142D46] py-3">
                    <View className="flex-row items-center">
                      <Activity size={17} color="#142D46" />
                      <Text className="ml-2 text-[12px] font-bold text-[#142D46]">
                        Readings
                      </Text>
                    </View>
                  </View>

                  <View className="w-1/2 items-center py-3">
                    <View className="flex-row items-center">
                      <Cpu size={17} color="#94A3B8" />
                      <Text className="ml-2 text-[12px] font-semibold text-slate-400">
                        Health
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Reading Status Filters */}
                <View className="flex-row items-center justify-around px-2 pt-4">
                  <View className="rounded-full bg-[#142D46] px-4 py-2.5">
                    <Text className="text-[11px] font-bold text-white">
                      All (0)
                    </Text>
                  </View>

                  <Text className="text-[11px] font-semibold text-slate-500">
                    Normal (0)
                  </Text>

                  <Text className="text-[11px] font-semibold text-slate-500">
                    Warning (0)
                  </Text>

                  <Text className="text-[11px] font-semibold text-slate-500">
                    Critical (0)
                  </Text>
                </View>

                {/* Date Range Selector */}
                <View className="items-center px-3 pt-3 pb-3">
                  <View className="flex-row items-center rounded-full border border-slate-200 bg-white px-3 py-2">
                    <CalendarDays size={15} color="#64748B" />

                    <Text className="mx-2 text-[11px] font-semibold text-[#142D46]">
                      Nov 1, 2026 - Nov 4, 2026
                    </Text>

                    <ChevronDown size={15} color="#64748B" />
                  </View>
                </View>

                {/* Reading Statistics */}
                <View className="flex-row px-2">
                  {/* Total Readings */}
                  <View className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Text className="text-[10px] font-semibold text-slate-500">
                      Total Readings
                    </Text>
                    <Text className="mt-2 text-[22px] font-bold text-[#142D46]">
                      0
                    </Text>
                  </View>

                  {/* Normal */}
                  <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Text className="text-[10px] font-semibold text-slate-500">
                      Normal
                    </Text>
                    <Text className="mt-2 text-[22px] font-bold text-green-600">
                      0
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row px-2">
                  {/* Warning */}
                  <View className="mr-2 flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Text className="text-[10px] font-semibold text-slate-500">
                      Warning
                    </Text>
                    <Text className="mt-2 text-[22px] font-bold text-amber-500">
                      0
                    </Text>
                  </View>

                  {/* Critical */}
                  <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Text className="text-[10px] font-semibold text-slate-500">
                      Critical
                    </Text>
                    <Text className="mt-2 text-[22px] font-bold text-red-600">
                      0
                    </Text>
                  </View>
                </View>

                {/* Empty State */}
                <View className="items-center px-3 pt-9">
                  <Text className="text-center text-[11px] leading-5 text-slate-400">
                    No readings found for All status in Nov 1, 2026 - Nov 4,
                    2026.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Screenshot Caption */}
          <View className="border-t border-slate-100 px-4 py-3">
            <Text className="text-center text-xs font-semibold text-slate-700">
              Sensor Readings Screen
            </Text>
            <Text className="mt-1 text-center text-[10px] text-slate-400">
              Sample interface showing the reading statistics of sensor node
              SN-1.
            </Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View className="mt-5 px-4">
        <Text className="mb-3 text-sm font-bold text-[#203D70]">
          HOW TO VIEW SENSOR READINGS
        </Text>

        <ManualStep number={1}>
          <Text>Open the AGOS application and log in to your account.</Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Navigate to the Sensor Nodes section and select the sensor node you
            want to monitor.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>
            Select the Readings tab to view the recorded measurements of the
            selected sensor node.
          </Text>
        </ManualStep>

        <ManualStep number={4}>
          <Text>
            Use the All, Normal, Warning, and Critical filters to view readings
            according to their corresponding status.
          </Text>
        </ManualStep>

        <ManualStep number={5}>
          <Text>
            Select the date range to view readings recorded within a specific
            period.
          </Text>
        </ManualStep>

        <ManualStep number={6}>
          <Text>
            Review the summary cards to see the total readings and the number of
            Normal, Warning, and Critical readings.
          </Text>
        </ManualStep>
      </View>

      {/* Tip */}
      <View className="mx-5 mt-5">
        <ManualTip>
          <Text>
            Regularly monitor sensor readings and their corresponding status.
            Warning and Critical readings may indicate unusual water-level
            conditions that require attention.
          </Text>
        </ManualTip>
      </View>
    </ManualSection>
  );
}
