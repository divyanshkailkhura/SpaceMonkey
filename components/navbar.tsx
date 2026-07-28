"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, Telescope, LogOut, User } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Star Map", href: "/map" },
    { name: "Events", href: "/events" },
    { name: "Community", href: "/community" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-800/20 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Telescope className="h-8 w-8 text-purple-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            SpaceMonkey
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {session?.user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <User className="h-4 w-4" />
                {session.user.name ?? session.user.email}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {session?.user ? (
                  <>
                    <Link
                      href="/profile"
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setIsOpen(false)
                        signOut()
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button asChild className="mt-4">
                    <Link href="/auth" onClick={() => setIsOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}