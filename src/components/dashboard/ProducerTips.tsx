import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Lightbulb } from "lucide-react"

const tips = [
  "Pro Tip: Shows with posters in a 2:3 ratio get 40% more clicks.",
  "Don't forget to export your Guest List 2 hours before curtain call for a smooth front-of-house.",
  "Engage your audience early! Diverse cast announcements can boost ticket sales by 25%.",
  "Ensure your venue map is accurate to reduce attendee confusion on show day.",
  "Review your show analytics weekly to spot trends and optimize your marketing."
]

export function ProducerTips() {
  const [api, setApi] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (!api) {
      return
    }

    const interval = setInterval(() => {
      api.scrollNext()
    }, 10000)

    return () => clearInterval(interval)
  }, [api])

  return (
    <Card className="border-secondary/20 bg-card mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          The Producer’s Corner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel setApi={setApi} opts={{ loop: true }} className="w-full relative group px-1">
          <CarouselContent>
            {tips.map((tip, index) => (
              <CarouselItem key={index}>
                <div className="p-1 flex items-center justify-center min-h-[3rem]">
                  <p className="text-sm text-muted-foreground italic text-center">
                    "{tip}"
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-between w-full absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none px-0 opacity-0 group-hover:opacity-100 transition-opacity">
             <CarouselPrevious className="pointer-events-auto relative left-0 translate-y-0 h-8 w-8 bg-background/80 hover:bg-background border-secondary/20 translate-x-1" />
             <CarouselNext className="pointer-events-auto relative right-0 translate-y-0 h-8 w-8 bg-background/80 hover:bg-background border-secondary/20 -translate-x-1" />
          </div>
        </Carousel>
      </CardContent>
    </Card>
  )
}
