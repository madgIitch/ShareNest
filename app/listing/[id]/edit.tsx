import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { ListingWizard } from "../../../src/components/listing/ListingWizard";
import { useListing } from "../../../src/hooks/useListings";
import { colors } from "../../../src/theme";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);

  if (isLoading || !listing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <ListingWizard initial={listing} />;
}
