import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

const cities = ["All", "Mandaluyong", "Taguig", "Manila", "Quezon City", "Makati"];
const niches = ["All", "Local/Community-based", "University Theater Group"];

interface TheaterGroup {
  id: string;
  name: string;
  city: string;
  niche: string;
  description: string;
}

const mockGroups: TheaterGroup[] = [
  { id: "1", name: "RTU Drama Ensemble", city: "Mandaluyong", niche: "University Theater Group", description: "Rizal Technological University's premier theater group." },
  { id: "2", name: "Manila Repertory", city: "Manila", niche: "Local/Community-based", description: "Bringing classic Filipino stories to life since 1985." },
  { id: "3", name: "Makati Arts Guild", city: "Makati", niche: "Local/Community-based", description: "Contemporary theater for the modern audience." },
  { id: "4", name: "QC Theater Company", city: "Quezon City", niche: "Local/Community-based", description: "Quezon City's community theater initiative." },
  { id: "5", name: "Taguig Players", city: "Taguig", niche: "Local/Community-based", description: "Young and dynamic theater collective from BGC." },
  { id: "6", name: "UP Repertory", city: "Quezon City", niche: "University Theater Group", description: "University of the Philippines' flagship theater org." },
];

const Directory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedNiche, setSelectedNiche] = useState("All");

  const filteredGroups = mockGroups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "All" || group.city === selectedCity;
    const matchesNiche = selectedNiche === "All" || group.niche === selectedNiche;
    return matchesSearch && matchesCity && matchesNiche;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Theater Directory
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore theater groups across Metro Manila
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12 space-y-6"
          >
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search theater groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-card border-secondary/30 focus:border-secondary"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground text-sm mr-2 self-center">City:</span>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 text-sm border transition-all duration-300 ${
                      selectedCity === city
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-secondary/30 text-muted-foreground hover:border-secondary/60"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-muted-foreground text-sm mr-2 self-center">Type:</span>
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => setSelectedNiche(niche)}
                  className={`px-4 py-2 text-sm border transition-all duration-300 ${
                    selectedNiche === niche
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-secondary/30 text-muted-foreground hover:border-secondary/60"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Groups Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/group/${group.id}`}>
                  <div className="bg-card border border-secondary/20 p-6 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/20 flex items-center justify-center text-2xl">
                        🎭
                      </div>
                      <span className="text-xs text-secondary uppercase tracking-wider">
                        {group.niche.split("/")[0]}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-secondary transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">{group.description}</p>
                    <div className="flex items-center gap-2 text-secondary/70 text-sm">
                      <span>📍</span>
                      <span>{group.city}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No theater groups found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Directory;
