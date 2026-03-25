import { View } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export default function Skeleton({
  width,
  height = 16,
  rounded = false,
  className = "",
}: SkeletonProps) {
  return (
    <View
      className={`bg-gray-200 ${rounded ? "rounded-full" : "rounded-lg"} ${className}`}
      style={[
        typeof width === "number" ? { width } : {},
        { height },
      ]}
    />
  );
}
