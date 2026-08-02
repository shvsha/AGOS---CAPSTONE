import { Text, View } from "react-native";

interface Props {
  title: string;
  incidents: number;
  description: string;
  percentage: number;
  color: string;
}

export default function ReasonCard({
  title,
  incidents,
  description,
  percentage,
  color,
}: Props) {
  return (
    <View
      className="bg-white rounded-2xl p-4 flex-1"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        elevation: 4,
      }}
    >
      <Text className="font-semibold text-[14px] text-slate-700">{title}</Text>

      <Text className="text-4xl font-bold mt-4" style={{ color }}>
        {incidents}
      </Text>

      <Text className="text-[11px] text-slate-500 mt-3">{description}</Text>

      <View className="h-2 bg-slate-200 rounded-full mt-5 overflow-hidden">
        <View
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            height: "100%",
          }}
        />
      </View>

      <Text className="text-[11px] text-slate-500 mt-2">
        {percentage}% of events
      </Text>
    </View>
  );
}
