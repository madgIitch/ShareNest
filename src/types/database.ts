export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          push_token: string | null;
          notif_messages: boolean;
          notif_requests: boolean;
          notif_friendz: boolean;
          stripe_customer_id: string | null;
          birth_year: number | null;
          occupation: string | null;
          languages: string[] | null;
          photos: string[] | null;
          schedule: string | null;
          cleanliness: number | null;
          noise_level: number | null;
          has_pets: boolean | null;
          smokes: boolean | null;
          works_from_home: boolean | null;
          guests_frequency: string | null;
          looking_for: string | null;
          budget_min: number | null;
          budget_max: number | null;
          move_in_date: string | null;
          preferred_cities: string[] | null;
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
          push_token?: string | null;
          notif_messages?: boolean;
          notif_requests?: boolean;
          notif_friendz?: boolean;
          stripe_customer_id?: string | null;
          birth_year?: number | null;
          occupation?: string | null;
          languages?: string[] | null;
          photos?: string[] | null;
          schedule?: string | null;
          cleanliness?: number | null;
          noise_level?: number | null;
          has_pets?: boolean | null;
          smokes?: boolean | null;
          works_from_home?: boolean | null;
          guests_frequency?: string | null;
          looking_for?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          move_in_date?: string | null;
          preferred_cities?: string[] | null;
        };
        Update: {
          id?: string;
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
          stripe_customer_id?: string | null;
          birth_year?: number | null;
          occupation?: string | null;
          languages?: string[] | null;
          photos?: string[] | null;
          schedule?: string | null;
          cleanliness?: number | null;
          noise_level?: number | null;
          has_pets?: boolean | null;
          smokes?: boolean | null;
          works_from_home?: boolean | null;
          guests_frequency?: string | null;
          looking_for?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          move_in_date?: string | null;
          preferred_cities?: string[] | null;
        };
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: Database["public"]["Enums"]["connection_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: Database["public"]["Enums"]["connection_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: Database["public"]["Enums"]["connection_status"];
          created_at?: string;
        };
      };
      room_listings: {
        Row: {
          id: string;
          publisher_id: string;
          title: string;
          description: string | null;
          price: number;
          size_m2: number | null;
          bed_type: Database["public"]["Enums"]["bed_type"] | null;
          has_private_bath: boolean;
          has_wardrobe: boolean;
          has_desk: boolean;
          is_furnished: boolean;
          city_id: string;
          place_id: string | null;
          address_approx: string | null;
          address_full: string | null;
          lat: number | null;
          lng: number | null;
          postal_code: string | null;
          owner_lives_here: boolean;
          flatmates_count: number | null;
          total_rooms: number | null;
          total_m2: number | null;
          floor: string | null;
          has_elevator: boolean;
          allows_pets: boolean;
          allows_smoking: boolean;
          has_quiet_hours: boolean;
          no_parties: boolean;
          bills_config: Json;
          available_from: string | null;
          min_stay_months: number | null;
          contract_type: Database["public"]["Enums"]["contract_type"];
          status: Database["public"]["Enums"]["listing_status"];
          search_vector: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          publisher_id: string;
          title: string;
          description?: string | null;
          price: number;
          size_m2?: number | null;
          bed_type?: Database["public"]["Enums"]["bed_type"] | null;
          has_private_bath?: boolean;
          has_wardrobe?: boolean;
          has_desk?: boolean;
          is_furnished?: boolean;
          city_id: string;
          place_id?: string | null;
          address_approx?: string | null;
          address_full?: string | null;
          lat?: number | null;
          lng?: number | null;
          postal_code?: string | null;
          owner_lives_here?: boolean;
          flatmates_count?: number | null;
          total_rooms?: number | null;
          total_m2?: number | null;
          floor?: string | null;
          has_elevator?: boolean;
          allows_pets?: boolean;
          allows_smoking?: boolean;
          has_quiet_hours?: boolean;
          no_parties?: boolean;
          bills_config?: Json;
          available_from?: string | null;
          min_stay_months?: number | null;
          contract_type?: Database["public"]["Enums"]["contract_type"];
          status?: Database["public"]["Enums"]["listing_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          publisher_id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          size_m2?: number | null;
          bed_type?: Database["public"]["Enums"]["bed_type"] | null;
          has_private_bath?: boolean;
          has_wardrobe?: boolean;
          has_desk?: boolean;
          is_furnished?: boolean;
          city_id?: string;
          place_id?: string | null;
          address_approx?: string | null;
          address_full?: string | null;
          lat?: number | null;
          lng?: number | null;
          postal_code?: string | null;
          owner_lives_here?: boolean;
          flatmates_count?: number | null;
          total_rooms?: number | null;
          total_m2?: number | null;
          floor?: string | null;
          has_elevator?: boolean;
          allows_pets?: boolean;
          allows_smoking?: boolean;
          has_quiet_hours?: boolean;
          no_parties?: boolean;
          bills_config?: Json;
          available_from?: string | null;
          min_stay_months?: number | null;
          contract_type?: Database["public"]["Enums"]["contract_type"];
          status?: Database["public"]["Enums"]["listing_status"];
          updated_at?: string;
        };
      };
      listing_media: {
        Row: {
          id: string;
          publisher_id: string;
          listing_id: string | null;
          url: string;
          zone: Database["public"]["Enums"]["media_zone"];
          address_hash: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          publisher_id: string;
          listing_id?: string | null;
          url: string;
          zone: Database["public"]["Enums"]["media_zone"];
          address_hash?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          publisher_id?: string;
          listing_id?: string | null;
          url?: string;
          zone?: Database["public"]["Enums"]["media_zone"];
          address_hash?: string | null;
          sort_order?: number;
        };
      };
      seeker_listings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          budget_min: number | null;
          budget_max: number | null;
          available_from: string | null;
          min_stay_months: number | null;
          city_ids: string[];
          place_ids: string[];
          has_pets: boolean | null;
          smokes: boolean | null;
          looking_for_flatmate: boolean;
          status: Database["public"]["Enums"]["seeker_status"];
          search_vector: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          available_from?: string | null;
          min_stay_months?: number | null;
          city_ids: string[];
          place_ids?: string[];
          has_pets?: boolean | null;
          smokes?: boolean | null;
          looking_for_flatmate?: boolean;
          status?: Database["public"]["Enums"]["seeker_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          available_from?: string | null;
          min_stay_months?: number | null;
          city_ids?: string[];
          place_ids?: string[];
          has_pets?: boolean | null;
          smokes?: boolean | null;
          looking_for_flatmate?: boolean;
          status?: Database["public"]["Enums"]["seeker_status"];
          updated_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          requester_id: string;
          owner_id: string;
          target_type: Database["public"]["Enums"]["request_target"];
          room_listing_id: string | null;
          seeker_listing_id: string | null;
          status: Database["public"]["Enums"]["request_status"];
          message: string | null;
          presentation_message: string | null;
          is_boosted: boolean;
          offered_at: string | null;
          offer_terms: Json | null;
          requester_confirmed_at: string | null;
          owner_confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          owner_id: string;
          target_type: Database["public"]["Enums"]["request_target"];
          room_listing_id?: string | null;
          seeker_listing_id?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          message?: string | null;
          presentation_message?: string | null;
          is_boosted?: boolean;
          offered_at?: string | null;
          offer_terms?: Json | null;
          requester_confirmed_at?: string | null;
          owner_confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          owner_id?: string;
          target_type?: Database["public"]["Enums"]["request_target"];
          room_listing_id?: string | null;
          seeker_listing_id?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          message?: string | null;
          presentation_message?: string | null;
          is_boosted?: boolean;
          offered_at?: string | null;
          offer_terms?: Json | null;
          requester_confirmed_at?: string | null;
          owner_confirmed_at?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          request_id: string | null;
          participant_a: string;
          participant_b: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          participant_a: string;
          participant_b: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          participant_a?: string;
          participant_b?: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
        };
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
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          is_system?: boolean;
          read_at?: string | null;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          invite_code: string;
          room_listing_id: string | null;
          address: string | null;
          city_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          invite_code: string;
          room_listing_id?: string | null;
          address?: string | null;
          city_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string | null;
          invite_code?: string;
          room_listing_id?: string | null;
          address?: string | null;
          city_id?: string | null;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          leaving_date: string | null;
          leaving_reason: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
          leaving_date?: string | null;
          leaving_reason?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
          leaving_date?: string | null;
          leaving_reason?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          paid_by: string;
          amount: number;
          category: string;
          description: string | null;
          receipt_url: string | null;
          date: string;
          split_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          paid_by: string;
          amount: number;
          category: string;
          description?: string | null;
          receipt_url?: string | null;
          date: string;
          split_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          paid_by?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          receipt_url?: string | null;
          date?: string;
          split_type?: string;
        };
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
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          is_settled?: boolean;
          settled_at?: string | null;
          settled_by?: string | null;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          amount?: number;
          is_settled?: boolean;
          settled_at?: string | null;
          settled_by?: string | null;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: Database["public"]["Enums"]["subscription_tier"];
          status: Database["public"]["Enums"]["subscription_status"];
          product_id: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: Database["public"]["Enums"]["subscription_tier"];
          status: Database["public"]["Enums"]["subscription_status"];
          product_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          product_id?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      active_requests_count: {
        Row: {
          requester_id: string;
          active_count: number;
        };
      };
      cities_with_counts: {
        Row: {
          id: string;
          name: string;
          centroid: string | null;
          bbox: string | null;
          search_count: number;
        };
      };
      household_balances: {
        Row: {
          expense_id: string;
          household_id: string;
          user_id: string;
          amount: number;
          is_settled: boolean;
          paid_by: string;
          net_contribution: number;
        };
      };
    };
    Functions: {
      search_room_listings: {
        Args: {
          p_query?: string;
          p_city_id?: string;
          p_place_id?: string;
          p_price_min?: number;
          p_price_max?: number;
          p_size_min?: number;
          p_allows_pets?: boolean;
          p_allows_smoking?: boolean;
          p_available_from?: string;
          p_lat?: number;
          p_lng?: number;
          p_radius_km?: number;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Database["public"]["Tables"]["room_listings"]["Row"][];
      };
      search_users: {
        Args: {
          p_query: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          username: string | null;
          verified_at: string | null;
          city: string | null;
        }[];
      };
      get_mutual_friends: {
        Args: {
          p_user_a: string;
          p_user_b: string;
        };
        Returns: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          username: string | null;
          verified_at: string | null;
        }[];
      };
      get_connection_degree: {
        Args: {
          p_viewer: string;
          p_target: string;
        };
        Returns: number | null;
      };
      join_household_by_code: {
        Args: {
          p_code: string;
        };
        Returns: string;
      };
      increment_city_count: {
        Args: {
          p_city_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      listing_status: "draft" | "active" | "paused" | "rented";
      seeker_status: "active" | "paused" | "found";
      request_status: "pending" | "invited" | "offered" | "accepted" | "assigned" | "denied";
      request_target: "room_listing" | "seeker_listing";
      connection_status: "pending" | "accepted";
      subscription_tier: "superfriendz";
      subscription_status: "active" | "expired" | "cancelled";
      bed_type: "individual" | "doble" | "litera";
      media_zone: "habitacion" | "cocina" | "bano" | "salon" | "terraza" | "lavadero" | "garaje" | "entrada" | "otro";
      contract_type: "long_term" | "temporary" | "flexible";
    };
  };
};
