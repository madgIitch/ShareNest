import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { ListingWizard } from "../../../src/components/listing/ListingWizard";
import { useListing } from "../../../src/hooks/useListings";
import { useProperty } from "../../../src/hooks/useProperties";
import { colors } from "../../../src/theme";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);
  const { data: existingProperty, isLoading: isPropertyLoading } = useProperty(listing?.property_id ?? undefined);

  useEffect(() => {
    console.log("[EditListingScreen] state:", {
      id,
      isLoading,
      isPropertyLoading,
      listingId: listing?.id ?? null,
      listingPropertyId: listing?.property_id ?? null,
      listingCity: listing?.city ?? null,
      listingCityId: listing?.city_id ?? null,
      listingDistrict: listing?.district ?? null,
      listingPostalCode: listing?.postal_code ?? null,
      propertyId: existingProperty?.id ?? null,
      propertyAddress: existingProperty?.address ?? null,
      propertyCityId: existingProperty?.city_id ?? null,
      propertyPostalCode: existingProperty?.postal_code ?? null,
      propertyPlaceId: existingProperty?.place_id ?? null,
      propertyCityName: existingProperty?.city?.name ?? null,
    });
  }, [id, isLoading, isPropertyLoading, listing, existingProperty]);

  if (isLoading || !listing || (listing.property_id && isPropertyLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing.property_id || !existingProperty) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ListingWizard
      initial={listing}
      existingProperty={existingProperty}
      existingCityName={existingProperty?.city?.name ?? null}
    />
  );
}
