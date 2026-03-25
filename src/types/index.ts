export type { Database, Json } from "./database";

export type RoomListing = import("./database").Database["public"]["Tables"]["room_listings"]["Row"];
export type SeekerListing = import("./database").Database["public"]["Tables"]["seeker_listings"]["Row"];
export type Profile = import("./database").Database["public"]["Tables"]["profiles"]["Row"];
export type Request = import("./database").Database["public"]["Tables"]["requests"]["Row"];
export type Conversation = import("./database").Database["public"]["Tables"]["conversations"]["Row"];
export type Message = import("./database").Database["public"]["Tables"]["messages"]["Row"];
export type Connection = import("./database").Database["public"]["Tables"]["connections"]["Row"];
export type Household = import("./database").Database["public"]["Tables"]["households"]["Row"];
export type Expense = import("./database").Database["public"]["Tables"]["expenses"]["Row"];
