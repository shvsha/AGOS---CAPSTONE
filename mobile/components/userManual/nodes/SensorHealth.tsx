import React from "react";
import { Text, View } from "react-native";
import {
  ArrowLeft,
  Activity,
  Cpu,
  CalendarDays,
  ChevronDown,
  Radio,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export default function SensorHealth({ expanded, onPress }: Props) {
  return (
    <ManualSection
      number={2}
      title="SENSOR HEALTH"
      description="Monitor the device health and connection status of deployed sensor nodes."
      icon={<Cpu size={18} color="#203D70" />}
      expanded={expanded}
      onPress={onPress}
    >
      {/* Description and Screenshot */}
      <View className="mt-5 px-5">
        <Text className="mb-3 text-sm leading-6 text-slate-600">
          The Sensor Health screen provides information about the current
          condition of a selected sensor node. It displays the latest device
          health check, including battery level, signal strength, water sensor
          status, and installed firmware version. Users can also review previous
          health checks through the Health History section.
        </Text>

        {/* Sensor Health Screenshot Preview */}
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
              {/* Dynamic Island */}
              <View
                className="items-center justify-center bg-white"
                style={{ height: "7%" }}
              >
                <View className="h-7 w-1/3 rounded-full bg-black" />
              </View>

              {/* Application Screen */}
              <View className="flex-1 bg-[#EEF3F8]">
                {/* Device Header */}
                <View className="flex-row items-center px-4 pt-2 pb-5">
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

                {/* Navigation Tabs */}
                <View className="flex-row border-b border-slate-200">
                  {/* Readings Tab */}
                  <View className="w-1/2 items-center py-3">
                    <View className="flex-row items-center">
                      <Activity size={17} color="#94A3B8" />
                      <Text className="ml-2 text-[12px] font-semibold text-slate-400">
                        Readings
                      </Text>
                    </View>
                  </View>

                  {/* Health Tab */}
                  <View className="w-1/2 items-center border-b-[3px] border-[#142D46] py-3">
                    <View className="flex-row items-center">
                      <Cpu size={17} color="#142D46" />
                      <Text className="ml-2 text-[12px] font-bold text-[#142D46]">
                        Health
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Latest Check Card */}
                <View className="mx-2.5 mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {/* Card Header */}
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[13px] font-bold text-[#142D46]">
                        Latest Check
                      </Text>

                      <Text className="mt-1 text-[11px] text-slate-400">
                        Oct 20, 2026 1:18 PM
                      </Text>
                    </View>

                    <View className="rounded-full bg-[#E6F7ED] px-3 py-1.5">
                      <Text className="text-[10px] font-bold text-green-700">
                        Normal
                      </Text>
                    </View>
                  </View>

                  {/* Health Information - Row 1 */}
                  <View className="mt-3 flex-row">
                    {/* Battery */}
                    <View className="mr-2 flex-1 rounded-2xl bg-[#F8FAFC] p-3">
                      <Text className="text-[10px] font-medium text-slate-400">
                        Battery
                      </Text>

                      <Text className="mt-1 text-[16px] font-bold text-[#142D46]">
                        3.65 V
                      </Text>

                      <Text className="mt-1 text-[10px] text-slate-500">
                        54% charge
                      </Text>
                    </View>

                    {/* Signal */}
                    <View className="flex-1 rounded-2xl bg-[#F8FAFC] p-3">
                      <Text className="text-[10px] font-medium text-slate-400">
                        Signal
                      </Text>

                      <Text className="mt-1 text-[16px] font-bold text-[#142D46]">
                        -65 dBm
                      </Text>

                      <Text className="mt-1 text-[10px] text-slate-500">
                        Excellent
                      </Text>
                    </View>
                  </View>

                  {/* Health Information - Row 2 */}
                  <View className="mt-2 flex-row">
                    {/* Water Sensor */}
                    <View className="mr-2 flex-1 rounded-2xl bg-[#F8FAFC] p-3">
                      <Text className="text-[10px] font-medium text-slate-400">
                        Water Sensor
                      </Text>

                      <Text className="mt-1 text-[16px] font-bold text-[#142D46]">
                        OK
                      </Text>
                    </View>

                    {/* Firmware */}
                    <View className="flex-1 rounded-2xl bg-[#F8FAFC] p-3">
                      <Text className="text-[10px] font-medium text-slate-400">
                        Firmware
                      </Text>

                      <Text className="mt-1 text-[16px] font-bold text-[#142D46]">
                        1.0.0
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Health History */}
                <View className="mt-5 px-2.5">
                  <Text className="text-[15px] font-bold text-[#142D46]">
                    Health History
                  </Text>

                  {/* Status Filters */}
                  <View className="mt-3 flex-row items-center justify-between">
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

                  {/* Date Range */}
                  <View className="mt-3 items-center">
                    <View className="flex-row items-center rounded-full border border-slate-200 bg-white px-3 py-2">
                      <CalendarDays size={15} color="#64748B" />

                      <Text className="mx-2 text-[11px] font-semibold text-[#142D46]">
                        Nov 1, 2026 - Nov 4, 2026
                      </Text>

                      <ChevronDown size={15} color="#64748B" />
                    </View>
                  </View>

                  {/* Empty State */}
                  <View className="mt-8 items-center px-2">
                    <Text className="text-center text-[11px] leading-5 text-slate-400">
                      No health checks in Nov 1, 2026 - Nov 4, 2026.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Screenshot Caption */}
          <View className="border-t border-slate-100 px-4 py-3">
            <Text className="text-center text-xs font-semibold text-slate-700">
              Sensor Health Screen
            </Text>

            <Text className="mt-1 text-center text-[10px] text-slate-400">
              Sample interface displaying the latest health check and health
              history of sensor node SN-1.
            </Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View className="mt-5 px-4">
        <Text className="mb-3 text-sm font-bold text-[#203D70]">
          HOW TO CHECK SENSOR HEALTH
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
            Select the Health tab to view the latest health check of the
            selected sensor node.
          </Text>
        </ManualStep>

        <ManualStep number={4}>
          <Text>
            Review the Battery information to check the current battery voltage
            and remaining charge.
          </Text>
        </ManualStep>

        <ManualStep number={5}>
          <Text>
            Check the Signal information to determine the connection strength of
            the sensor node.
          </Text>
        </ManualStep>

        <ManualStep number={6}>
          <Text>
            Review the Water Sensor status and Firmware version to verify the
            sensor's condition and software information.
          </Text>
        </ManualStep>

        <ManualStep number={7}>
          <Text>
            Scroll down to Health History to view previous health checks. Use
            the status filters and date range to find specific records.
          </Text>
        </ManualStep>
      </View>

      {/* Tip */}
      <View className="mx-5 mt-5">
        <ManualTip>
          <Text>
            Regularly check the battery level and signal strength of your sensor
            nodes. This helps identify possible connectivity or power-related
            issues before they affect data collection.
          </Text>
        </ManualTip>
      </View>
    </ManualSection>
  );
}
