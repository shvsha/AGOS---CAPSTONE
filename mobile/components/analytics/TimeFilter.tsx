import { Pressable, Text, View } from "react-native";

interface Props {
  selected: string;
  onSelect: (value: string) => void;
}

const filters = ["24h", "7d", "30d"];

export default function TimeFilter({ selected, onSelect }: Props) {
  return (
    <View className="flex-row mb-4">
      {filters.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onSelect(filter)}
          className={`mr-3 px-5 py-2 rounded-full ${
            selected === filter
              ? "bg-[#2C8198]"
              : "bg-white border border-slate-300"
          }`}
        >
          <Text
            className={`text-[12px] ${
              selected === filter
                ? "text-white font-semibold"
                : "text-slate-500"
            }`}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
