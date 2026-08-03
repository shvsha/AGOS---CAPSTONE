import { Text, View } from "react-native";

interface Props {
  title: string;
  value: number;
}

export default function StatCard({ title, value }: Props) {
  return (
    <View
      className="
        flex-1
        bg-white
        rounded-2xl
        px-4
        py-4
        h-[88px]
        border
        border-slate-100
      "
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text className="text-[12px] text-slate-500">{title}</Text>

      <Text className="text-[30px] font-bold text-[#020224] mt-2">{value}</Text>
    </View>
  );
}
