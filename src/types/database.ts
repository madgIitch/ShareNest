export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ListingType = "offer" | "search";
export type ListingStatus = "active" | "paused" | "rented";
export type RequestStatus = "pending" | "accepted" | "denied";
export type ConnectionStatus = "pending" | "accepted";

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
          city_id: string | null;
          district: string | null;
          place_id: string | null;
          street: string | null;
          street_number: string | null;
          postal_code: string | null;
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
        };
        Update: {
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
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          requester_id: string;
          owner_id: string;
          status?: RequestStatus;
          message?: string | null;
        };
        Update: {
          status?: RequestStatus;
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
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
        };
        Update: {
          read_at?: string | null;
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
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: "admin" | "member";
        };
        Update: { role?: "admin" | "member" };
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
        };
        Insert: {
          expense_id: string;
          user_id: string;
          amount: number;
          is_settled?: boolean;
        };
        Update: { is_settled?: boolean; settled_at?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
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
      my_household: {
        Args: Record<string, never>;
        Returns: { id: string; name: string; invite_code: string; listing_id: string | null; created_by: string; created_at: string; member_role: string }[];
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
        Returns: Database["public"]["Tables"]["listings"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
