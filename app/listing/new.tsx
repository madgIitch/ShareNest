import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { ListingWizard } from "../../src/components/listing/ListingWizard";
import { useMyListings } from "../../src/hooks/useListings";
import { useMyProperties } from "../../src/hooks/useProperties";
import { useIsSuperfriendz } from "../../src/hooks/useSubscription";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors } from "../../src/theme";

export default function NewListingScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string | string[] }>();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: isSuper = false, isLoading: loadingTier } = useIsSuperfriendz();
  const { data: myProperties = [], isLoading: loadingProps } = useMyProperties(userId);
  const { data: myListings = [], isLoading: loadingListings } = useMyListings(userId);

  if (loadingTier || loadingProps || loadingListings) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const normalizedPropertyId = Array.isArray(propertyId) ? propertyId[0] : propertyId;
  const forcedProperty = normalizedPropertyId ? myProperties.find((p) => p.id === normalizedPropertyId) ?? null : null;
  const existingProperty = forcedProperty ?? (!isSuper && myProperties.length > 0 ? myProperties[0] : null);
  const hasRoomsInSelectedProperty = !!existingProperty
    && myListings.some((l) => l.property_id === existingProperty.id);
  const startAtStep = existingProperty && hasRoomsInSelectedProperty ? 6 : 1;

  return (
    <ListingWizard
      startAtStep={startAtStep}
      existingProperty={existingProperty}
      existingCityName={existingProperty?.city?.name ?? null}
    />
  );
}
