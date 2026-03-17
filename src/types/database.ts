export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ListingType = "offer" | "search";
export type ListingStatus = "active" | "paused" | "rented";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone: string | null;
          city: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          city?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          city?: string | null;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          owner_id: string;
          type: ListingType;
          title: string;
          description: string | null;
          city: string;
          district: string | null;
          price: number;
          size_m2: number | null;
          rooms: number | null;
          available_from: string | null;
          is_furnished: boolean;
          pets_allowed: boolean;
          smokers_allowed: boolean;
          lat: number | null;
          lng: number | null;
          status: ListingStatus;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          type?: ListingType;
          title: string;
          description?: string | null;
          city: string;
          district?: string | null;
          price: number;
          size_m2?: number | null;
          rooms?: number | null;
          available_from?: string | null;
          is_furnished?: boolean;
          pets_allowed?: boolean;
          smokers_allowed?: boolean;
          lat?: number | null;
          lng?: number | null;
          status?: ListingStatus;
          images?: string[];
        };
        Update: {
          type?: ListingType;
          title?: string;
          description?: string | null;
          city?: string;
          district?: string | null;
          price?: number;
          size_m2?: number | null;
          rooms?: number | null;
          available_from?: string | null;
          is_furnished?: boolean;
          pets_allowed?: boolean;
          smokers_allowed?: boolean;
          lat?: number | null;
          lng?: number | null;
          status?: ListingStatus;
          images?: string[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_listings: {
        Args: {
          p_query?:          string | null;
          p_city?:           string | null;
          p_type?:           "offer" | "search" | null;
          p_price_min?:      number | null;
          p_price_max?:      number | null;
          p_size_min?:       number | null;
          p_pets?:           boolean | null;
          p_smokers?:        boolean | null;
          p_available_from?: string | null;
          p_lat?:            number | null;
          p_lng?:            number | null;
          p_radius_km?:      number | null;
          p_cursor?:         string | null;
          p_limit?:          number | null;
        };
        Returns: Database["public"]["Tables"]["listings"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
