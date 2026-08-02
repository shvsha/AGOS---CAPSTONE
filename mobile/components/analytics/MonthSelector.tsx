import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedMonth: string;
  onSelect: (month: string) => void;
}

function getMonthOptions() {
  const months = [];
  const year = new Date().getFullYear();
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    });
  }
  return months;
}

export default function MonthSelector({ visible, onClose, selectedMonth, onSelect }: Props) {
  const options = getMonthOptions();

  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable className="flex-1 bg-black/35 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl p-5" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[15px] font-bold text-slate-800">Select Month</Text>

            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const selected = opt.value === selectedMonth;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  className="flex-row items-center py-3 border-b border-slate-100"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                      selected ? "border-[#7FA9B8]" : "border-slate-300"
                    }`}
                  >
                    {selected && <View className="w-2.5 h-2.5 rounded-full bg-[#7FA9B8]" />}
                  </View>
                  <Text
                    className={`text-[14px] ${
                      selected ? "font-semibold text-slate-800" : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}