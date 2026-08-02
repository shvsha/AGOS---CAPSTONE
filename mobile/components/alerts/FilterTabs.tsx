import { Pressable, Text, View } from "react-native";

interface Props {
  selected: string;
  onSelect: (filter: string) => void;
}

const filters = ["All", "Clog", "Water level"];

export default function FilterTabs({ selected, onSelect }: Props) {
  return (
    <View className="px-5 mt-5">
      <View className="bg-white rounded-2xl px-2 py-2 flex-row justify-around">
        {filters.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => onSelect(filter)}
            className={`px-5 py-2 rounded-full ${
              selected === filter ? "bg-[#7FA9B8]" : ""
            }`}
          >
            <Text
              className={`text-[13px] ${
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
    </View>
  );
}
