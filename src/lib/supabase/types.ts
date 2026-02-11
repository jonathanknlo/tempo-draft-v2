export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          code: string;
          status: 'waiting' | 'coin_toss' | 'drafting' | 'complete';
          player1_name: string | null;
          player2_name: string | null;
          first_picker: string | null;
          current_pick: number;
          total_picks: number;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          status?: 'waiting' | 'coin_toss' | 'drafting' | 'complete';
          player1_name?: string | null;
          player2_name?: string | null;
          first_picker?: string | null;
          current_pick?: number;
          total_picks?: number;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          status?: 'waiting' | 'coin_toss' | 'drafting' | 'complete';
          player1_name?: string | null;
          player2_name?: string | null;
          first_picker?: string | null;
          current_pick?: number;
          total_picks?: number;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          is_first_picker: boolean | null;
          session_id: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          is_first_picker?: boolean | null;
          session_id?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          is_first_picker?: boolean | null;
          session_id?: string | null;
          joined_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          room_id: string;
          opponent: string;
          venue: 'Coca-Cola Coliseum' | 'Scotiabank Arena';
          game_date: string;
          game_time: string;
          is_marquee: boolean;
          is_family: boolean;
          picked_by: string | null;
          picked_at: string | null;
          pick_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          opponent: string;
          venue: 'Coca-Cola Coliseum' | 'Scotiabank Arena';
          game_date: string;
          game_time: string;
          is_marquee?: boolean;
          is_family?: boolean;
          picked_by?: string | null;
          picked_at?: string | null;
          pick_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          opponent?: string;
          venue?: 'Coca-Cola Coliseum' | 'Scotiabank Arena';
          game_date?: string;
          game_time?: string;
          is_marquee?: boolean;
          is_family?: boolean;
          picked_by?: string | null;
          picked_at?: string | null;
          pick_number?: number | null;
          created_at?: string;
        };
      };
      picks: {
        Row: {
          id: string;
          room_id: string;
          game_id: string;
          player_id: string;
          pick_number: number;
          picked_at: string;
          undone_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          game_id: string;
          player_id: string;
          pick_number: number;
          picked_at?: string;
          undone_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          game_id?: string;
          player_id?: string;
          pick_number?: number;
          picked_at?: string;
          undone_at?: string | null;
        };
      };
    };
  };
}

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type Pick = Database['public']['Tables']['picks']['Row'];
