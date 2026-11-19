import React, { useState } from "react";
import {
  Image,
  Text,
  View,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import {
  CircleAlert,
  MapPin,
  Activity,
  Droplets,
  Waves,
  Clock,
  CheckCircle,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";
import ManualTip from "../common/ManualTip";

type Props = {
  expanded: boolean;
  onPress: () => void;
};

const eventListImage = require("../../../assets/images/userManual/clogEvents/clog-event-details.png");

const detailedInfoImage = require("../../../assets/images/userManual/clogEvents/detailed-info.png");

const timelineImage = require("../../../assets/images/userManual/clogEvents/event-timeline.png");

const screenshots = [eventListImage, detailedInfoImage, timelineImage];

type ScreenshotCardProps = {
  source: ImageSourcePropType;
  title: string;
  description: string;
  onPress: () => void;
};

function ScreenshotCard({
  source,
  title,
  description,
  onPress,
}: ScreenshotCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <View className="relative">
        <Image
          source={source}
          resizeMode="contain"
          className="h-[430px] w-full"
          style={{ backgroundColor: "#F8FAFC" }}
        />

        <View className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-2">
          <Text className="text-[10px] font-semibold text-white">
            🔍 Tap to enlarge
          </Text>
        </View>
      </View>

      <View className="border-t border-slate-100 px-4 py-3">
        <Text className="text-center text-xs font-bold text-slate-700">
          {title}
        </Text>

        <Text className="mt-1 text-center text-[10px] text-slate-400">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ClogEventDetails({ expanded, onPress }: Props) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const openImage = (index: number) => {
    setSelectedImage(index);
    setIsImageVisible(true);
  };

  const fullscreenImages = screenshots.map((source) => ({
    uri: Image.resolveAssetSource(source).uri,
  }));

  return (
    <ManualSection
      number={3}
      title="CLOG EVENT DETAILS"
      description="Displays complete information about a selected clog event, including its severity, location, monitoring data, and event timeline."
      icon={<CircleAlert size={18} color="#DC2626" />}
      expanded={expanded}
      onPress={onPress}
    >
      {/* CLOG EVENTS LIST SCREENSHOT */}

      <View className="mx-5 mt-5">
        <Text className="mb-2 text-sm font-bold text-slate-800">
          Opening a Clog Event
        </Text>

        <ScreenshotCard
          source={eventListImage}
          title="Clog Events List"
          description="Example of the clog event cards displayed in the Clog Events page."
          onPress={() => openImage(0)}
        />
      </View>

      {/* HOW TO VIEW DETAILS */}

      <View className="mx-5 mt-2">
        <Text className="mb-3 text-sm font-bold text-slate-800">
          How to View Event Details
        </Text>

        <ManualStep number={1}>
          <Text>Open the Clog Events tab from the bottom navigation bar.</Text>
        </ManualStep>

        <ManualStep number={2}>
          <Text>
            Browse the available clog events. You can use the severity filters
            to view All, Critical, Moderate, or Low events.
          </Text>
        </ManualStep>

        <ManualStep number={3}>
          <Text>Tap a clog event card to open its Event Details page.</Text>
        </ManualStep>

        <ManualStep number={4}>
          <Text>
            Review the severity, current status, monitoring information, and
            timeline of the selected event.
          </Text>
        </ManualStep>
      </View>

      {/* DETAILED MONITORING INFORMATION */}

      <View className="mx-5 mt-5">
        <Text className="mb-2 text-sm font-bold text-slate-800">
          Detailed Monitoring Information
        </Text>

        <ScreenshotCard
          source={detailedInfoImage}
          title="Event Monitoring Details"
          description="Highlighted section showing the recorded information of the selected clog event."
          onPress={() => openImage(1)}
        />

        <Text className="mb-3 text-[10px] leading-4 text-slate-500">
          The Event Details page displays the following information associated
          with the selected clog event:
        </Text>

        {/* Severity and Status */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={16} color="#059669" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Severity and Status
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Shows the severity level of the event and whether it has been
                detected, responded to, or cleared.
              </Text>
            </View>
          </View>
        </View>

        {/* Location and Node */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-50">
              <MapPin size={16} color="#2563EB" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Location and Node
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Identifies the monitored location and the sensor node where the
                clog event was detected.
              </Text>
            </View>
          </View>
        </View>

        {/* Classification */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
              <Activity size={16} color="#4F46E5" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Classification
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Displays the recorded waste or clog classification associated
                with the event.
              </Text>
            </View>
          </View>
        </View>

        {/* Reading ID */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-sky-50">
              <Waves size={16} color="#0284C7" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Reading ID
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Identifies the sensor reading associated with the detected clog
                event.
              </Text>
            </View>
          </View>
        </View>

        {/* Water Level and Flow */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-cyan-50">
              <Droplets size={16} color="#0891B2" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Water Level and Flow
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Shows the recorded water level in centimeters (cm) and water
                flow in meters per second (m/s).
              </Text>
            </View>
          </View>
        </View>

        {/* Clog Percentage */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Activity size={16} color="#EA580C" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Clog Percentage
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Displays the estimated percentage of clogging associated with
                the detected event.
              </Text>
            </View>
          </View>
        </View>

        {/* Estimated Weight */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <Activity size={16} color="#059669" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Estimated Weight (AI)
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Shows the AI-estimated weight of the detected waste, measured in
                grams (g).
              </Text>
            </View>
          </View>
        </View>

        {/* Detection Time */}

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Clock size={16} color="#64748B" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Detection Time
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Shows the date and time when the clog event was detected by the
                monitoring system.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* EVENT TIMELINE */}

      <View className="mx-5 mt-5">
        <Text className="mb-2 text-sm font-bold text-slate-800">
          Event Timeline
        </Text>

        <ScreenshotCard
          source={timelineImage}
          title="Event Timeline"
          description="Highlighted section showing the progress and recorded status of the clog event."
          onPress={() => openImage(2)}
        />

        <Text className="mb-3 text-[10px] leading-4 text-slate-500">
          The timeline displays the sequence of events from initial detection to
          the latest recorded status.
        </Text>

        {/* Detected */}

        <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-red-50">
              <CircleAlert size={17} color="#DC2626" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">Detected</Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Indicates when the monitoring system first detected the clog
                event, including its detection date and time.
              </Text>
            </View>
          </View>
        </View>

        {/* Responded */}

        <View className="mb-2 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={17} color="#059669" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700">
                Responded
              </Text>

              <Text className="mt-1 text-[10px] leading-4 text-slate-500">
                Shows the recorded response status of the event. It may include
                response information or indicate that the event was
                automatically cleared.
              </Text>
            </View>
          </View>
        </View>

        {/* Automatic Clearing */}

        <View className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <Text className="text-xs font-bold text-emerald-800">
            Automatic Clearing
          </Text>

          <Text className="mt-1 text-[10px] leading-4 text-emerald-700">
            As shown in the example, an event may automatically clear after
            seven days without a recorded resolution. When this happens, the
            system indicates that no response report is needed.
          </Text>
        </View>
      </View>

      {/* TIP */}

      <View className="mx-5 mt-5">
        <ManualTip>
          Review the event severity, monitoring measurements, and timeline
          before deciding what action should be taken. Check whether the event
          has been responded to or automatically cleared to understand its
          current status.
        </ManualTip>
      </View>

      {/* FULLSCREEN IMAGE VIEWER */}

      <ImageViewing
        images={fullscreenImages}
        imageIndex={selectedImage}
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
