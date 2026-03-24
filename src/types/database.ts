export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ListingType = "offer" | "search";
export type ListingStatus = "active" | "paused" | "rented" | "draft";
export type RequestStatus = "pending" | "invited" | "offered" | "accepted" | "assigned" | "denied";
export type ConnectionStatus = "pending" | "accepted";
export type ContractType = "long_term" | "temporary" | "flexible";
export type BedType = "single" | "double" | "bunk";

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
          push_token: string | null;
          notif_messages: boolean;
          notif_requests: boolean;
          notif_friendz: boolean;
          created_at: string;
          // Lifestyle fields
          birth_year: number | null;
          occupation: string | null;
          languages: string[] | null;
          photos: string[] | null;
          schedule: "madrugador" | "nocturno" | "flexible" | null;
          cleanliness: number | null; // 1-5
          noise_level: number | null; // 1-5
          has_pets: boolean | null;
          smokes: boolean | null;
          works_from_home: boolean | null;
          guests_frequency: "nunca" | "a veces" | "frecuente" | null;
          // Search preferences
          looking_for: "room" | "flat" | "both" | null;
          budget_min: number | null;
          budget_max: number | null;
          move_in_date: string | null;
          preferred_cities: string[] | null;
          flatmate_prefs: Json | null;
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
          push_token?: string | null;
          notif_messages?: boolean;
          notif_requests?: boolean;
          notif_friendz?: boolean;
          created_at?: string;
          birth_year?: number | null;
          occupation?: string | null;
          languages?: string[] | null;
          photos?: string[] | null;
          schedule?: "madrugador" | "nocturno" | "flexible" | null;
          cleanliness?: number | null;
          noise_level?: number | null;
          has_pets?: boolean | null;
          smokes?: boolean | null;
          works_from_home?: boolean | null;
          guests_frequency?: "nunca" | "a veces" | "frecuente" | null;
          looking_for?: "room" | "flat" | "both" | null;
          budget_min?: number | null;
          budget_max?: number | null;
          move_in_date?: string | null;
          preferred_cities?: string[] | null;
          flatmate_prefs?: Json | null;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          city?: string | null;
          verified_at?: string | null;
          push_token?: string | null;
          notif_messages?: boolean;
          notif_requests?: boolean;
          notif_friendz?: boolean;
          birth_year?: number | null;
          occupation?: string | null;
          languages?: string[] | null;
          photos?: string[] | null;
          schedule?: "madrugador" | "nocturno" | "flexible" | null;
          cleanliness?: number | null;
          noise_level?: number | null;
          has_pets?: boolean | null;
          smokes?: boolean | null;
          works_from_home?: boolean | null;
          guests_frequency?: "nunca" | "a veces" | "frecuente" | null;
          looking_for?: "room" | "flat" | "both" | null;
          budget_min?: number | null;
          budget_max?: number | null;
          move_in_date?: string | null;
          preferred_cities?: string[] | null;
          flatmate_prefs?: Json | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string | null;
          address: string;
          street_number: string | null;
          city_id: string | null;
          place_id: string | null;
          lat: number | null;
          lng: number | null;
          postal_code: string | null;
          floor: string | null;
          has_elevator: boolean;
          total_m2: number | null;
          total_rooms: number | null;
          images: Json; // common area photos
          bills_config: Json; // { agua, luz, gas, internet, limpieza, comunidad, calefaccion }
          house_rules: string[] | null;
          household_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string | null;
          address: string;
          street_number?: string | null;
          city_id?: string | null;
          place_id?: string | null;
          lat?: number | null;
          lng?: number | null;
          postal_code?: string | null;
          floor?: string | null;
          has_elevator?: boolean;
          total_m2?: number | null;
          total_rooms?: number | null;
          images?: Json;
          bills_config?: Json;
          house_rules?: string[] | null;
          household_id?: string | null;
        };
        Update: {
          name?: string | null;
          address?: string;
          street_number?: string | null;
          postal_code?: string | null;
          floor?: string | null;
          has_elevator?: boolean;
          total_m2?: number | null;
          total_rooms?: number | null;
          images?: Json;
          bills_config?: Json;
          house_rules?: string[] | null;
          household_id?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string | null; // new - links to properties table
          type: ListingType;
          title: string;
          description: string | null;
          city: string;
          city_id: string | null;
          district: string | null;
          place_id: string | null;
          street: string | null;
          street_number: string | null;
          postal_code: string | null;
          price: number;
          size_m2: number | null; // m2 of the room
          rooms: number | null;   // number of roommates
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
          // New fields
          min_stay_months: number | null;
          contract_type: ContractType | null;
          bed_type: BedType | null;
          has_private_bath: boolean | null;
          has_wardrobe: boolean | null;
          has_desk: boolean | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          property_id?: string | null;
          type?: ListingType;
          title: string;
          description?: string | null;
          city: string;
          city_id?: string | null;
          district?: string | null;
          place_id?: string | null;
          street?: string | null;
          street_number?: string | null;
          postal_code?: string | null;
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
          min_stay_months?: number | null;
          contract_type?: ContractType | null;
          bed_type?: BedType | null;
          has_private_bath?: boolean | null;
          has_wardrobe?: boolean | null;
          has_desk?: boolean | null;
        };
        Update: {
          property_id?: string | null;
          type?: ListingType;
          title?: string;
          description?: string | null;
          city?: string;
          city_id?: string | null;
          district?: string | null;
          place_id?: string | null;
          street?: string | null;
          street_number?: string | null;
          postal_code?: string | null;
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
          min_stay_months?: number | null;
          contract_type?: ContractType | null;
          bed_type?: BedType | null;
          has_private_bath?: boolean | null;
          has_wardrobe?: boolean | null;
          has_desk?: boolean | null;
        };
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          listing_id: string;
          requester_id: string;
          owner_id: string;
          status: RequestStatus;
          message: string | null;
          presentation_message: string | null; // new - shown in candidates view
          is_boosted: boolean;                  // new - true if Superfriendz active at send time
          offered_at: string | null;
          offer_terms: Json | null;
          requester_confirmed_at: string | null;
          owner_confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          requester_id: string;
          owner_id: string;
          status?: RequestStatus;
          message?: string | null;
          presentation_message?: string | null;
          is_boosted?: boolean;
          offered_at?: string | null;
          offer_terms?: Json | null;
          requester_confirmed_at?: string | null;
          owner_confirmed_at?: string | null;
        };
        Update: {
          status?: RequestStatus;
          presentation_message?: string | null;
          offered_at?: string | null;
          offer_terms?: Json | null;
          requester_confirmed_at?: string | null;
          owner_confirmed_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string | null;
          request_id: string | null;
          participant_a: string;
          participant_b: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          request_id?: string | null;
          participant_a: string;
          participant_b: string;
        };
        Update: {
          last_message_at?: string | null;
          last_message_preview?: string | null;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: "ios" | "android";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: "ios" | "android";
        };
        Update: never;
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: ConnectionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: ConnectionStatus;
        };
        Update: {
          status?: ConnectionStatus;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_system: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_system?: boolean;
        };
        Update: {
          read_at?: string | null;
          is_system?: boolean;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          listing_id: string | null;
          name: string;
          created_by: string | null;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          name: string;
          created_by?: string | null;
          invite_code?: string;
          created_at?: string;
        };
        Update: { name?: string; listing_id?: string | null };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
          leaving_date: string | null;
          leaving_reason: "contract_end" | "manual" | null;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: "admin" | "member";
          leaving_date?: string | null;
          leaving_reason?: "contract_end" | "manual" | null;
        };
        Update: {
          role?: "admin" | "member";
          leaving_date?: string | null;
          leaving_reason?: "contract_end" | "manual" | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          paid_by: string;
          amount: number;
          category: "luz" | "agua" | "gas" | "internet" | "comida" | "limpieza" | "otros";
          description: string | null;
          receipt_url: string | null;
          date: string;
          split_type: "equal" | "custom";
          created_at: string;
        };
        Insert: {
          household_id: string;
          paid_by: string;
          amount: number;
          category?: "luz" | "agua" | "gas" | "internet" | "comida" | "limpieza" | "otros";
          description?: string | null;
          receipt_url?: string | null;
          date?: string;
          split_type?: "equal" | "custom";
        };
        Update: {
          description?: string | null;
          receipt_url?: string | null;
        };
        Relationships: [];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          is_settled: boolean;
          settled_at: string | null;
          settled_by: string | null;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          amount: number;
          is_settled?: boolean;
          settled_at?: string | null;
          settled_by?: string | null;
        };
        Update: {
          is_settled?: boolean;
          settled_at?: string | null;
          settled_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      active_requests_count: {
        Row: {
          requester_id: string;
          active_count: number;
        };
      };
      listings_with_property: {
        Row: {
          id: string;
          owner_id: string;
          type: ListingType;
          title: string;
          description: string | null;
          price: number;
          size_m2: number | null;
          rooms: number | null;
          available_from: string | null;
          is_furnished: boolean;
          pets_allowed: boolean;
          smokers_allowed: boolean;
          status: ListingStatus;
          images: string[];
          created_at: string;
          updated_at: string;
          search_vector: unknown;
          min_stay_months: number | null;
          contract_type: ContractType | null;
          bed_type: BedType | null;
          has_private_bath: boolean | null;
          has_wardrobe: boolean | null;
          has_desk: boolean | null;
          city: string;
          district: string | null;
          city_id: string | null;
          place_id: string | null;
          street: string | null;
          street_number: string | null;
          postal_code: string | null;
          lat: number | null;
          lng: number | null;
          property_id: string;
          property_name: string | null;
          property_address: string | null;
          property_street_number: string | null;
          property_floor: string | null;
          property_postal_code: string | null;
          property_city_id: string | null;
          property_place_id: string | null;
          property_lat: number | null;
          property_lng: number | null;
          property_has_elevator: boolean;
          property_total_m2: number | null;
          property_total_rooms: number | null;
          property_bills_config: Json;
          property_house_rules: string[] | null;
          property_images: Json;
          property_household_id: string | null;
        };
      };
    };
    Functions: {
      get_mutual_friends: {
        Args: { p_user_a: string; p_user_b: string };
        Returns: { id: string; full_name: string | null; avatar_url: string | null; username: string | null; verified_at: string | null }[];
      };
      get_connection_degree: {
        Args: { p_viewer: string; p_target: string };
        Returns: number | null;
      };
      search_users: {
        Args: { p_query: string; p_limit?: number };
        Returns: { id: string; full_name: string | null; avatar_url: string | null; username: string | null; verified_at: string | null; city: string | null }[];
      };
      join_household_by_code: {
        Args: { p_code: string };
        Returns: string;
      };
      create_household: {
        Args: { p_name: string; p_listing_id?: string | null };
        Returns: string;
      };
      my_household: {
        Args: Record<string, never>;
        Returns: { id: string; name: string; invite_code: string; listing_id: string | null; created_by: string; created_at: string; member_role: string }[];
      };
      send_offer: {
        Args: { p_request_id: string; p_offer_terms?: Json };
        Returns: string;
      };
      accept_offer: {
        Args: { p_request_id: string };
        Returns: string;
      };
      accept_request_chat: {
        Args: { p_request_id: string };
        Returns: string;
      };
      rollback_offer_to_invited: {
        Args: { p_request_id: string; p_actor_id?: string | null };
        Returns: string;
      };
      deny_request: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      withdraw_request: {
        Args: { p_request_id: string };
        Returns: string;
      };
      confirm_assignment: {
        Args: { p_request_id: string };
        Returns: { conversation_id: string; household_id: string | null; assignment_completed: boolean }[];
      };
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
        Returns: Database["public"]["Views"]["listings_with_property"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

