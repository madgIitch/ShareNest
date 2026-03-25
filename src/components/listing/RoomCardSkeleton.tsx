import { View } from "react-native";
import Skeleton from "../ui/Skeleton";

export default function RoomCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden">
      <View className="h-48 bg-gray-200" />
      <View className="p-4 gap-2">
        <Skeleton height={20} className="w-3/4" />
        <Skeleton height={14} className="w-1/2" />
        <View className="flex-row gap-2 mt-2">
          <Skeleton height={24} width={80} rounded />
          <Skeleton height={24} width={80} rounded />
        </View>
      </View>
    </View>
  );
}
