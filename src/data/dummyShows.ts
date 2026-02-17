
export interface CastMember {
  name: string;
  role: string;
}

export interface ShowDetails {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  ticket_link: string | null;
  poster_url: string | null;
  niche: "local" | "university" | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  genre: string | null;
  director: string | null;
  duration: string | null;
  tags: string[] | null;
  cast_members: CastMember[] | null;
  price: number | null;
  reservation_fee?: number | null;
  collect_balance_onsite?: boolean | null;
  producer_id: {
    id: string;
    group_name: string | null;
    username: string | null;
    description: string | null;
    founded_year: number | null;
    niche: "local" | "university" | null;
    avatar_url?: string | null;
  } | null;
}

export const dummyShows: ShowDetails[] = [
  {
    id: "demo-msb",
    title: "Mula sa Buwan",
    description: "Mula sa Buwan is a heartbreaking musical about love and ideals. Set in 1940s Manila, the musical features wide-eyed dreamers, fools, and misfits. Through the eyes of the poet Cyrano, the play tells the story of unrequited love for his childhood friend, Roxane. As war looms over the city, their lives are forever changed.",
    date: "2026-11-20T19:00:00Z",
    venue: "Samsung Performing Arts Theater",
    city: "Makati",
    ticket_link: "https://ticketworld.com.ph",
    poster_url: "https://upload.wikimedia.org/wikipedia/en/5/52/Mula_sa_Buwan_2022_Poster.jpg",
    niche: "local",
    status: "approved",
    created_at: new Date().toISOString(),
    genre: "Musical, Drama, Historical",
    director: "Pat Valera",
    duration: "2 hours 30 mins",
    tags: ["Original Filipino Musical", "Cyrano de Bergerac", "Love Story"],
    cast_members: [
      { name: "Myke Salomon", role: "Cyrano" },
      { name: "Gab Pangilinan", role: "Roxane" },
      { name: "Markki Stroem", role: "Christian" }
    ],
    price: 1500,
    reservation_fee: 25,
    collect_balance_onsite: true,
    producer_id: {
      id: "demo-producer-1",
      group_name: "Barefoot Theatre Collaborative",
      username: "barefootcollab",
      description: "A Manila-based theater company dedicated to staging original Filipino musicals.",
      founded_year: 2015,
      niche: "local",
      avatar_url: "https://ui-avatars.com/api/?name=Barefoot+Theatre&background=random"
    }
  },
  {
    id: "demo-aheb",
    title: "Ang Huling El Bimbo",
    description: "A story of friendship, love, and forgiveness told through the songs of the Eraserheads. Three friends reunite after twenty years to confront their past and a tragedy that tore them apart. A hit musical that has captivated audiences across generations.",
    date: "2026-12-05T20:00:00Z",
    venue: "Newport Performing Arts Theater",
    city: "Pasay",
    ticket_link: "https://ticketworld.com.ph",
    poster_url: "https://upload.wikimedia.org/wikipedia/en/8/87/Ang_Huling_El_Bimbo_Musical_Poster.jpg",
    niche: "local",
    status: "approved",
    created_at: new Date().toISOString(),
    genre: "Jukebox Musical, Drama",
    director: "Dexter Santos",
    duration: "3 hours",
    tags: ["Eraserheads", "OPM", "Musical"],
    cast_members: [
      { name: "Gab Pangilinan", role: "Young Joy" },
      { name: "Gian Magdangal", role: "Hector" },
      { name: "Topper Fabregas", role: "Young Anthony" }
    ],
    price: 2000,
    reservation_fee: 25,
    collect_balance_onsite: true,
    producer_id: {
      id: "demo-producer-2",
      group_name: "Full House Theater Company",
      username: "fullhousetheater",
      description: "Resident theater company of Newport World Resorts.",
      founded_year: 2010,
      niche: "local",
      avatar_url: "https://ui-avatars.com/api/?name=Full+House&background=random"
    }
  },
  {
    id: "demo-dekada",
    title: "Dekada '70",
    description: "Based on the acclaimed novel by Lualhati Bautista, this musical follows the Bartolome family as they navigate the tumultuous era of Martial Law in the Philippines. A powerful story of a mother's awakening and a family's struggle for freedom.",
    date: "2026-09-21T19:00:00Z",
    venue: "Areté, Ateneo de Manila University",
    city: "Quezon City",
    ticket_link: "https://ticket2me.net",
    poster_url: "https://ticket2me.net/images/posters/dekada70.jpg", // Fallback if broken: https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Dekada_70_film_poster.jpg/220px-Dekada_70_film_poster.jpg
    niche: "local",
    status: "approved",
    created_at: new Date().toISOString(),
    genre: "Musical, Historical Drama",
    director: "Pat Valera",
    duration: "2 hours 15 mins",
    tags: ["Martial Law", "History", "Family"],
    cast_members: [
      { name: "Stella Cañete-Mendoza", role: "Amanda Bartolome" },
      { name: "Juliene Mendoza", role: "Julian Bartolome" }
    ],
    price: 1200,
    reservation_fee: 25,
    collect_balance_onsite: true,
    producer_id: {
      id: "demo-producer-3",
      group_name: "Black Box Productions",
      username: "blackboxprod",
      description: "Creating thought-provoking and socially relevant theater.",
      founded_year: 2018,
      niche: "local",
      avatar_url: "https://ui-avatars.com/api/?name=Black+Box&background=random"
    }
  },
  {
    id: "demo-test-ticket",
    title: "Test Production (20 PHP)",
    description: "A test production for verifying low-cost ticket transactions.",
    date: "2026-12-30T19:00:00Z",
    venue: "Test Venue",
    city: "Test City",
    ticket_link: null,
    poster_url: null,
    niche: "local",
    status: "approved",
    created_at: new Date().toISOString(),
    genre: "Test",
    director: "QA Tester",
    duration: "1 hour",
    tags: ["Test", "QA"],
    cast_members: [],
    price: 20, // 20 PHP
    reservation_fee: 20, // Full reservation for cheap ticket
    collect_balance_onsite: false,
    producer_id: {
      id: "demo-producer-test",
      group_name: "Test Group",
      username: "testgroup",
      description: "Group for testing",
      founded_year: 2026,
      niche: "local",
      avatar_url: null
    }
  }
];
