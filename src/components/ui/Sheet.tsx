import { View, Modal, TouchableOpacity } from "react-native";
import type { ReactNode } from "react";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Sheet({ visible, onClose, children }: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40"
        activeOpacity={1}
        onPress={onClose}
      />
      <View className="bg-white rounded-t-3xl p-4 pb-8">{children}</View>
    </Modal>
  );
}
