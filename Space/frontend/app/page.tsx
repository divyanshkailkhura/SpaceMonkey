import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Compass, Calendar, BookOpen, Users, ArrowRight } from "lucide-react"
import { StarBackground } from "@/components/star-background"

export default function HomePage() {
  return (
    <div className="relative">
      <StarBackground />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 py-24 text-center md:py-32">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            SpaceMonkey
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-xl text-muted-foreground md:text-2xl">
          Explore the cosmos, track celestial events, and connect with fellow stargazers
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Link href="/map">Explore Star Map</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-600/10"
          >
            <Link href="/community">Join Community</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Discover the Universe with SpaceMonkey
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Compass className="h-10 w-10 text-purple-500" />}
              title="3D Star Map"
              description="Explore an interactive 3D map of the night sky with detailed information about stars, planets, and constellations."
            />
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-blue-500" />}
              title="Event Tracker"
              description="Never miss a meteor shower, eclipse, or planetary alignment with our celestial event calendar."
            />
            <FeatureCard
              icon={<BookOpen className="h-10 w-10 text-indigo-500" />}
              title="Stargazing Logs"
              description="Record your observations and track your stargazing journey with detailed personal logs."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-violet-500" />}
              title="Community"
              description="Connect with fellow astronomy enthusiasts, share discoveries, and learn from experienced stargazers."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-8 text-center backdrop-blur-sm md:p-12">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to Begin Your Cosmic Journey?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of stargazers who are expanding their knowledge of the universe.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Link href="/auth">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm transition-all hover:border-purple-600/50 hover:shadow-md hover:shadow-purple-500/10">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button variant="link" className="px-0 text-purple-400 hover:text-purple-300">
          Learn more <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
