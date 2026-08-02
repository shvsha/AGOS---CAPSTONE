import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE = 5;

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - MAX_VISIBLE + 1);
  if (start + MAX_VISIBLE - 1 > totalPages) {
    start = Math.max(1, totalPages - MAX_VISIBLE + 1);
  }
  const end = Math.min(totalPages, start + MAX_VISIBLE - 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <View className="flex-row justify-center items-center gap-2 mt-4 mb-2">
      <Pressable
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`w-9 h-9 rounded-full items-center justify-center border border-slate-200 ${
          currentPage === 1 ? "opacity-40" : "bg-white"
        }`}
      >
        <Ionicons name="chevron-back" size={16} color="#334155" />
      </Pressable>

      {pages.map((page) => (
        <Pressable
          key={page}
          onPress={() => onPageChange(page)}
          className={`w-9 h-9 rounded-full items-center justify-center border ${
            page === currentPage
              ? "bg-[#7FA9B8] border-[#7FA9B8]"
              : "bg-white border-slate-200"
          }`}
        >
          <Text
            className={`text-[13px] font-medium ${
              page === currentPage ? "text-white" : "text-slate-600"
            }`}
          >
            {page}
          </Text>
        </Pressable>
      ))}

      <Pressable
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`w-9 h-9 rounded-full items-center justify-center border border-slate-200 ${
          currentPage === totalPages ? "opacity-40" : "bg-white"
        }`}
      >
        <Ionicons name="chevron-forward" size={16} color="#334155" />
      </Pressable>
    </View>
  );
}