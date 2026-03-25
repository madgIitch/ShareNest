import { View, Text, TouchableOpacity } from "react-native";
import type { RoomListing } from "../../types";
import { formatPrice } from "../../utils/format";

interface RoomCardProps {
  listing: RoomListing;
  onPress?: () => void;
  compact?: boolean;
}

export default function RoomCard({ listing, onPress, compact }: RoomCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="h-48 bg-gray-100" />
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <Text className="text-lg font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
            {listing.title}
          </Text>
          <Text className="text-lg font-bold text-indigo-600">
            {formatPrice(listing.price)}
          </Text>
        </View>
        {listing.address_approx && (
          <Text className="text-sm text-gray-500 mt-1">{listing.address_approx}</Text>
        )}
        {!compact && (
          <View className="flex-row gap-2 mt-3 flex-wrap">
            {listing.allows_pets && (
              <View className="bg-green-50 rounded-full px-2 py-1">
                <Text className="text-xs text-green-700">🐾 Mascotas</Text>
              </View>
            )}
            {listing.has_private_bath && (
              <View className="bg-blue-50 rounded-full px-2 py-1">
                <Text className="text-xs text-blue-700">🚿 Baño privado</Text>
              </View>
            )}
            {listing.is_furnished && (
              <View className="bg-amber-50 rounded-full px-2 py-1">
                <Text className="text-xs text-amber-700">🛋️ Amueblada</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
