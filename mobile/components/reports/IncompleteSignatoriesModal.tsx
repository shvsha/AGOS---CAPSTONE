import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface IncompleteSignatoriesModalProps {
  visible: boolean;
  missingPositions: string[];
  onClose: () => void;
}

export function IncompleteSignatoriesModal({ visible, missingPositions, onClose }: IncompleteSignatoriesModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-[#0f172a]/60 px-6" onPress={onClose}>
        <Pressable
          className="w-full rounded-3xl border border-[#f1f5f9] bg-white p-5"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-3 items-center">
            <View className="mb-2.5 h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <MaterialCommunityIcons name="account-alert-outline" size={22} color="#d97706" />
            </View>
            <Text className="text-base font-extrabold text-[#0f172a]">Can't submit yet</Text>
            <Text className="mt-0.5 text-center text-xs text-[#64748b]">
              Your barangay needs a complete set of active signatories before a report can be submitted.
            </Text>
          </View>

          <View className="mb-3 rounded-xl bg-[#f8fafc] px-3.5 py-2.5">
            <Text className="mb-1 text-[11px] font-semibold text-[#64748b]">
              MISSING {missingPositions.length === 1 ? "POSITION" : "POSITIONS"}
            </Text>
            {missingPositions.map((position) => (
              <View key={position} className="flex-row items-center gap-2 py-1">
                <View className="h-1.5 w-1.5 rounded-full bg-[#d97706]" />
                <Text className="text-[13px] text-[#334155]">{position}</Text>
              </View>
            ))}
          </View>

          <View className="mb-4 flex-row gap-2 rounded-xl bg-[#f0fdf4] px-3.5 py-2.5">
            <MaterialCommunityIcons name="content-save-outline" size={16} color="#16a34a" />
            <Text className="flex-1 text-xs text-[#166534]">
              You can still save this report as a draft. Ask your administrator to assign the missing signatories, then submit it.
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} className="items-center rounded-xl bg-[#16a34a] py-3">
            <Text className="text-[13px] font-bold text-white">Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}