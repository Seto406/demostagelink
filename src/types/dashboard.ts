export interface CastMember {
  name: string;
  role: string;
}

export interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  niche: "local" | "university" | null;
  ticket_link: string | null;
  poster_url: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  production_status: "ongoing" | "completed" | "draft";
  created_at: string;
  deleted_at?: string | null;
  genre: string | null;
  director: string | null;
  duration: string | null;
  tags: string[] | null;
  cast_members: CastMember[] | null;
  price: number | null;
  is_featured?: boolean;
}
