import React, { useState } from "react";
import { View, Text, Image, Pressable, Modal } from "react-native";
import {
  LogIn,
  ClipboardList,
  Mail,
  Lock,
  Eye,
  ZoomIn,
  X,
  Lightbulb,
  KeyRound,
} from "lucide-react-native";

import ManualSection from "../common/ManualSection";
import ManualStep from "../common/ManualStep";

const loginImages = [
  {
    title: "AGOS Login Interface",
    description:
      "The Login page serves as the main access point of the AGOS application. It displays the AGOS logo, system name, and login form where authorized users can enter their registered email address and password.",
    source: require("../../../assets/images/userManual/login/login.jpg"),
  },
];

type LoginProps = {
  expanded: boolean;
  onPress: () => void;
};

export default function Login({ expanded, onPress }: LoginProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <ManualSection
      title="ACCESSING THE AGOS SYSTEM"
      number={1}
      icon={<LogIn size={20} color="#203D70" />}
      description="Learn how to log in to AGOS using your registered email address and password."
      expanded={expanded}
      onPress={onPress}
    >
      <View className="px-5 pb-3 pt-4">
        {/* INTRODUCTION */}
        <View className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <ClipboardList size={23} color="#203D70" />
          </View>

          <Text className="mb-1 text-sm font-bold text-slate-800">
            Logging in to AGOS
          </Text>

          <Text className="text-xs leading-5 text-slate-500">
            The AGOS Login page allows authorized users to access the system
            using their registered account credentials. Users must provide their
            email address and password to proceed to their respective
            dashboards.
          </Text>
        </View>

        {/* INSTRUCTIONS */}
        <View className="mb-5">
          <Text className="mb-3 text-xs font-bold tracking-wider text-slate-700">
            HOW TO LOG IN
          </Text>

          <ManualStep number={1}>
            Open the AGOS application using the provided system link. The Login
            page will appear, displaying the AGOS logo, system name, and login
            form.
          </ManualStep>

          <ManualStep number={2}>
            Locate the Email field and enter your registered email address. Make
            sure that you provide the correct email associated with your AGOS
            account.
          </ManualStep>

          <ManualStep number={3}>
            Locate the Password field and enter your registered account
            password. The password will appear as hidden characters for security
            purposes.
          </ManualStep>

          <ManualStep number={4}>
            If you want to check your entered password, tap the eye icon on the
            right side of the Password field to show or hide the password.
          </ManualStep>

          <ManualStep number={5}>
            After entering your email address and password, tap the Login button
            to submit your credentials.
          </ManualStep>

          <ManualStep number={6}>
            Once your credentials are successfully verified, the system will
            redirect you to the dashboard corresponding to your assigned user
            role.
          </ManualStep>

          <ManualStep number={7}>
            If you forget your password, tap the Forgot Password? link below the
            Login button and follow the instructions provided to recover your
            account.
          </ManualStep>
        </View>

        {/* SCREENSHOT GUIDE */}
        <View className="mb-4">
          <Text className="text-xs font-bold tracking-wider text-slate-700">
            LOGIN PAGE GUIDE
          </Text>

          <Text className="mt-1 text-[10px] leading-4 text-slate-400">
            Refer to the screenshot below to familiarize yourself with the AGOS
            login interface. Tap the image to enlarge it.
          </Text>
        </View>

        {/* SCREENSHOT CARDS */}
        {loginImages.map((item, index) => (
          <View
            key={item.title}
            className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* IMAGE HEADER */}
            <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3">
              <View className="mr-2 flex-1 flex-row items-center">
                <View className="mr-2 h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <LogIn size={15} color="#203D70" />
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
            Always use your registered email address and keep your password
            confidential. Make sure that your login credentials are correct
            before tapping the Login button. If you cannot access your account,
            use the Forgot Password? option.
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
              source={loginImages[selectedImage].source}
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
