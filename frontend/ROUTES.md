# DefiCity Routes Structure

## Route Overview

DefiCity ตอนนี้แบ่งเป็น 2 routes หลัก:

### 1. `/` (Root) - Landing Page
**Path:** `src/app/page.tsx`

**Purpose:** หน้า Landing Page สำหรับผู้เยี่ยมชมทั่วไป

**Features:**
- แสดง WelcomeScreen (landing page) เสมอ
- ไม่มี authentication check
- ปุ่มทั้งหมด redirect ไปที่ `/app`
- เหมาะสำหรับการแนะนำเกมและ onboarding

**Components:**
- Animated hero section with isometric buildings
- Feature cards
- DeFi protocol explanations
- Multiple CTAs

**User Flow:**
```
User visits "/"
  → Sees landing page
    → Clicks "Start Building Now"
      → Redirects to "/app"
```

### 2. `/app` - Game Application
**Path:** `src/app/app/page.tsx`

**Purpose:** หน้าแอปพลิเคชันจริงสำหรับผู้เล่น (ไม่ต้อง login)

**Features:**
- **ไม่บังคับ authentication** - เข้าเล่นได้เลย
- ถ้า authenticated แต่ไม่มี SmartWallet → แสดง CreateWalletScreen
- แสดงเกมทั้งในกรณี authenticated และ not authenticated

**Components:**
- GameCanvas (PixiJS game)
- TopBar (user info)
- BottomBar (building selection)
- Sidebar (wallet info, deposit/withdraw)

**User Flow:**
```
User visits "/app"
  → Show game interface ทันที ✅

  → (Optional) If user wants to save progress:
    → Click login from TopBar
    → Authenticate with Privy

  → If authenticated BUT NO SmartWallet:
    → Show CreateWalletScreen
    → Create wallet via SmartWalletFactory

  → If authenticated AND HAS SmartWallet:
    → Full game features unlocked
    → Can deposit, withdraw, save progress
```

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Route: "/" (Landing)
│   ├── app/
│   │   └── page.tsx          # Route: "/app" (Game)
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── game/
│   │   ├── WelcomeScreen.tsx    # Used in "/" route
│   │   ├── CreateWalletScreen.tsx # Used in "/app" route
│   │   ├── GameCanvas.tsx       # Used in "/app" route
│   │   ├── TopBar.tsx
│   │   └── BottomBar.tsx
│   │
│   └── landing/
│       ├── IsometricBuilding.tsx
│       ├── ParticleField.tsx
│       └── FeatureCard.tsx
```

## Authentication Flow

### Landing Page (`/`)
```typescript
// NO authentication required
export default function Home() {
  return <WelcomeScreen />
}
```

**WelcomeScreen behavior:**
- All CTA buttons → `router.push('/app')`
- No direct login on landing page
- User must click button to go to `/app` first

### App Page (`/app`)
```typescript
// NO authentication required - accessible to everyone
export default function AppPage() {
  const { ready, authenticated } = usePrivy()

  // Check wallet status (only if authenticated)
  if (authenticated && !hasWallet) {
    return <CreateWalletScreen />
  }

  // Show game (works with or without auth)
  return <GameInterface />
}
```

## User Journey Examples

### First-time User (No Login Required)
1. Visit `https://deficity.app/` → Sees landing page
2. Scroll through features
3. Click "Start Building Now" → Navigate to `/app`
4. `/app` shows game immediately ✅ (can play without login)
5. **Optional:** Click login from TopBar to save progress
6. If login → Create SmartWallet → Full features unlocked

### Returning User (with wallet)
1. Visit `https://deficity.app/` → Sees landing page
2. Click any CTA → Navigate to `/app`
3. Game loads with saved session
4. Full features available immediately

### Direct App Access
1. User visits `https://deficity.app/app` directly
2. Game loads immediately ✅ (no redirect)
3. Can play without authentication
4. Login optional for saving progress

## Development URLs

```bash
npm run dev
```

- Landing Page: `http://localhost:3000/`
- Game App: `http://localhost:3000/app`

## Key Changes from Previous Structure

### Before:
```
/ → if (!authenticated) show WelcomeScreen
  → if (authenticated && !wallet) show CreateWalletScreen
  → if (authenticated && wallet) show Game
```

### After:
```
/ → Always show WelcomeScreen (landing)

/app → Show game immediately (no auth required) ✅
     → if (authenticated && !wallet) show CreateWalletScreen
     → if (authenticated && wallet) show Game with full features
```

## Benefits

✅ **SEO Friendly** - Landing page always accessible without auth
✅ **Clear Separation** - Marketing vs Application
✅ **Better UX** - Users can explore features before committing
✅ **Shareable Landing** - Can share landing page URL without auth requirements
✅ **Fast Loading** - Landing page doesn't require auth checks
✅ **Play Without Login** - Users can try the game immediately at `/app` 🎮
✅ **Lower Barrier** - No authentication required to start playing
✅ **Progressive Enhancement** - Login adds features, not required for basic gameplay

## Testing Checklist

- [ ] Visit `/` → Should always show landing page
- [ ] Click "Start Building Now" → Should navigate to `/app`
- [ ] Visit `/app` without auth → Should show game immediately ✅ (no redirect)
- [ ] Visit `/app` directly → Game loads without login required ✅
- [ ] Login at `/app` (when already playing) → Should show CreateWalletScreen if no wallet
- [ ] Create wallet at `/app` → Should unlock full game features
- [ ] Refresh `/app` with active session → Should stay on game
- [ ] Play `/app` without logging in → Game should work (limited features)
