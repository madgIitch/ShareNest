import type { Database } from "./database";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingWithPropertyRow = Database["public"]["Views"]["listings_with_property"]["Row"];
export type ListingWithProperty = ListingWithPropertyRow;
