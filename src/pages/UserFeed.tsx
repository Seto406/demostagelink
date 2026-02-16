// ... (Your imports from the prompt, ensuring no duplicate Lucide icons)
import { ProductionModal } from "@/components/dashboard/ProductionModal";

const UserFeed = () => {
  // ... (Your existing state and fetch logic)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-7xl flex gap-8">
        <main className="flex-1 max-w-2xl">
          {profile?.role === "producer" && (
            <Card className="mb-6 cursor-pointer hover:border-secondary/40 transition-all" onClick={() => setShowProductionModal(true)}>
              <CardContent className="p-4 flex gap-4 items-center">
                <Avatar><AvatarImage src={profile.avatar_url || undefined} /><AvatarFallback>P</AvatarFallback></Avatar>
                <div className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-muted-foreground text-sm">
                  Post a new production...
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feed List Here */}
          {shows.map(show => <FeedPost key={show.id} show={show} />)}
        </main>

        <aside className="hidden lg:block w-[300px] space-y-6">
          {profile?.role === "producer" ? (
            <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
              <CardHeader><CardTitle className="text-lg font-serif">Your Stats</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-serif mb-4">{reservationCount} Reservations</p>
                <Link to="/dashboard"><Button className="w-full bg-secondary"><LayoutDashboard className="mr-2" />Dashboard</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif font-bold mb-2">Start Your Group</h3>
                <Button variant="outline" className="w-full" onClick={() => setProducerRequestModal(true)}>Join Now</Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <ProductionModal open={showProductionModal} onOpenChange={setShowProductionModal} />
    </div>
  );
};