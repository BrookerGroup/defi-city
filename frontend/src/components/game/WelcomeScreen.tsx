'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Mail, Loader2 } from 'lucide-react'
import { FaGoogle, FaTwitter, FaDiscord, FaApple } from 'react-icons/fa'

export function WelcomeScreen() {
  const { ready, login } = usePrivy()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl">🏙️</div>
          <CardTitle className="text-3xl">Welcome to DeFi City</CardTitle>
          <CardDescription className="text-base">
            Build your city, earn real crypto rewards!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🏛️</div>
              <div className="text-xs text-muted-foreground">Build</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs text-muted-foreground">Earn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-xs text-muted-foreground">Play</div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={login}
            >
              <Wallet className="mr-3 h-5 w-5" />
              Connect Wallet
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={login}
            >
              <Mail className="mr-3 h-5 w-5" />
              Continue with Email
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="h-12"
                onClick={login}
                title="Google"
              >
                <FaGoogle className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="h-12"
                onClick={login}
                title="Twitter"
              >
                <FaTwitter className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="h-12"
                onClick={login}
                title="Discord"
              >
                <FaDiscord className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="h-12"
                onClick={login}
                title="Apple"
              >
                <FaApple className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
