import React from "react";
import { Text, View } from "react-native";
import {
  CalendarDays,
  ChevronDown,
  Filter,
  Calendar,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export default function SensorHistoryFilters({ expanded, onPress }: Props) {
  const statuses = [
    { label: "All", count: 0, active: true },
    { label: "Normal", count: 0, active: false },
    { label: "Warning", count: 0, active: false },
    { label: "Critical", count: 0, active: false },
  ];

  return (
    <ManualSection
      number={3}
      title="FILTERING SENSOR RECORDS"
      description="Learn how to filter sensor readings and health history using status categories and date ranges."
      icon={<Filter size={18} color="#203D70" />}
      expanded={expanded}
      onPress={onPress}
    >
      {/* Introduction */}
      <View className="mt-5 px-5">
        <Text className="mb-4 text-sm leading-6 text-slate-600">
          The filtering feature allows users to find specific sensor readings
          and health records more easily. Users can filter records according to
          their status or select a specific date range to display records within
          a desired period.
        </Text>

        {/* Status Filters Illustration */}
        <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="mb-3 text-xs font-bold text-[#203D70]">
            SENSOR STATUS FILTERS
          </Text>

          <View className="flex-row flex-wrap items-center justify-between gap-y-3">
            {statuses.map((status) => (
              <View
                key={status.label}
                className={`rounded-full px-3 py-2.5 ${
                  status.active ? "bg-[#142D46]" : "bg-[#F1F5F9]"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    status.active ? "text-white" : "text-slate-600"
                  }`}
                >
                  {status.label} ({status.count})
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
            <Text className="text-[11px] leading-5 text-slate-500">
              Select a status category to display only the records that match
              the selected condition.
            </Text>
          </View>
        </View>

        {/* Status Filter Explanation */}
        <View className="mt-5">
          <Text className="mb-3 text-sm font-bold text-[#203D70]">
            UNDERSTANDING THE STATUS FILTERS
          </Text>

          <View className="mb-2 flex-row items-center rounded-xl bg-white p-3">
            <View className="mr-3 h-3 w-3 rounded-full bg-[#142D46]" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">All</Text>
              <Text className="mt-1 text-[11px] leading-5 text-slate-500">
                Displays all available sensor records regardless of their
                status.
              </Text>
            </View>
          </View>

          <View className="mb-2 flex-row items-center rounded-xl bg-white p-3">
            <View className="mr-3 h-3 w-3 rounded-full bg-green-500" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">Normal</Text>
              <Text className="mt-1 text-[11px] leading-5 text-slate-500">
                Displays records with normal sensor conditions.
              </Text>
            </View>
          </View>

          <View className="mb-2 flex-row items-center rounded-xl bg-white p-3">
            <View className="mr-3 h-3 w-3 rounded-full bg-amber-500" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">Warning</Text>
              <Text className="mt-1 text-[11px] leading-5 text-slate-500">
                Displays records that indicate warning conditions and may
                require attention.
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-xl bg-white p-3">
            <View className="mr-3 h-3 w-3 rounded-full bg-red-600" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">Critical</Text>
              <Text className="mt-1 text-[11px] leading-5 text-slate-500">
                Displays records with critical conditions that require immediate
                attention.
              </Text>
            </View>
          </View>
        </View>

        {/* Date Range Selector Illustration */}
        <View className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="mb-3 text-xs font-bold text-[#203D70]">
            DATE RANGE SELECTOR
          </Text>

          <View className="flex-row items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-3">
            <CalendarDays size={16} color="#64748B" />

            <Text className="mx-2 text-[11px] font-semibold text-[#142D46]">
              Nov 1, 2026 - Nov 7, 2026
            </Text>

            <ChevronDown size={15} color="#64748B" />
          </View>

          <Text className="mt-3 text-center text-[11px] leading-5 text-slate-500">
            Tap the date range selector to open the date filtering options.
          </Text>
        </View>

        {/* Date Filter Bottom Sheet Illustration */}
        <View className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-[#EEF3F8]">
          <View className="p-4">
            <Text className="mb-3 text-xs font-bold text-[#203D70]">
              FILTER BY DATE
            </Text>

            {/* Start Date */}
            <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-3 py-4">
              <Text className="text-[11px] font-semibold text-slate-500">
                START DATE
              </Text>

              <View className="flex-row items-center">
                <Text className="mr-2 text-[11px] font-semibold text-[#142D46]">
                  Nov 1, 2026
                </Text>
                <Calendar size={16} color="#64748B" />
              </View>
            </View>

            {/* End Date */}
            <View className="flex-row items-center justify-between bg-white px-3 py-4">
              <Text className="text-[11px] font-semibold text-slate-500">
                END DATE
              </Text>

              <View className="flex-row items-center">
                <Text className="mr-2 text-[11px] font-semibold text-[#142D46]">
                  Nov 7, 2026
                </Text>
                <Calendar size={16} color="#64748B" />
              </View>
            </View>

            {/* Clear and Apply */}
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1 items-center rounded-xl border border-slate-200 bg-white py-3">
                <Text className="text-xs font-bold text-slate-500">Clear</Text>
              </View>

              <View className="flex-1 items-center rounded-xl bg-[#142D46] py-3">
                <Text className="text-xs font-bold text-white">Apply</Text>
              </View>
            </View>
          </View>

          <View className="border-t border-slate-200 bg-white px-4 py-3">
            <Text className="text-center text-[10px] text-slate-400">
              Date filtering options
            </Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View className="mt-6 px-4">
        <Text className="mb-3 text-sm font-bold text-[#203D70]">
          HOW TO FILTER SENSOR RECORDS
        </Text>

        <ManualStep number={1}>
          <Text>
            Open the Sensor Nodes screen and select the desired sensor node.
          </Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Choose either the Readings or Health tab, depending on the records
            you want to view.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>
            Under the status filters, select All, Normal, Warning, or Critical
            to display records according to their corresponding status.
          </Text>
        </ManualStep>

        <ManualStep number={4}>
          <Text>
            Tap the date range selector located below the status filters to open
            the Filter by date panel.
          </Text>
        </ManualStep>

        <ManualStep number={5}>
          <Text>
            Select START DATE to choose the beginning of the period you want to
            view.
          </Text>
        </ManualStep>

        <ManualStep number={6}>
          <Text>
            Select END DATE to choose the last date of the desired period.
          </Text>
        </ManualStep>

        <ManualStep number={7}>
          <Text>
            Tap Clear to reset the date selection to its default range.
          </Text>
        </ManualStep>

        <ManualStep number={8}>
          <Text>
            Tap Apply to confirm the selected dates. The displayed records and
            date range will update according to your selected filters.
          </Text>
        </ManualStep>
      </View>

      {/* Tip */}
      <View className="mx-5 mt-5">
        <ManualTip>
          <Text>
            You can combine a status filter with a date range to narrow down the
            records you want to review. If no records match your selected
            filters, the application will display an empty-state message.
          </Text>
        </ManualTip>
      </View>
    </ManualSection>
  );
}
