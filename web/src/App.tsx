import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Twitter, Github, MessageCircle } from 'lucide-react'
import './index.css'

// Typewriter effect component
function TypeWriter({ text, delay = 50 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, delay])

  return <>{displayText}</>
}

// Pixel art building component
function PixelBuilding({
  emoji,
  name,
  apy,
  color
}: {
  emoji: string
  name: string
  apy: string
  color: string
}) {
  return (
    <div className="building">
      <div className="building-sprite">{emoji}</div>
      <div className="building-label" style={{ borderColor: color, color }}>
        {name}
        <span className="building-apy">{apy}</span>
      </div>
    </div>
  )
}

function App() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Simulate game loading
    const timer = setTimeout(() => setLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">🏙️</div>
            <span className="logo-text">DEFICITY</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">FEATURES</a></li>
            <li><a href="#how-it-works">HOW TO PLAY</a></li>
            <li><a href="#protocols">PROTOCOLS</a></li>
          </ul>
          <div className="nav-cta">
            <button className="btn btn-secondary">DOCS</button>
            <Link to="/game" className="btn btn-primary">PLAY NOW</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: loaded ? 1 : 0, x: loaded ? 0 : -50 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="hero-badge">
              <span>⭐</span>
              <span>BASE NETWORK • ERC-4337</span>
            </div>
            <h1>
              <TypeWriter text="PLAY DEFI" delay={80} />
              <span className="highlight">
                <TypeWriter text="BUILD WEALTH" delay={80} />
              </span>
            </h1>
            <p className="hero-description">
              Build your crypto portfolio like a retro city builder.
              Each building earns REAL yield from Aave & Aerodrome.
              No seed phrases. No complexity. Just play.
            </p>
            <div className="hero-buttons">
              <Link to="/game">
                <motion.span
                  className="btn btn-primary btn-large"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ display: 'inline-block' }}
                >
                  ▶ START GAME
                </motion.span>
              </Link>
              <motion.button
                className="btn btn-secondary btn-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📺 WATCH DEMO
              </motion.button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">$2.4M</div>
                <div className="stat-label">TVL</div>
              </div>
              <div className="stat">
                <div className="stat-value">12.4%</div>
                <div className="stat-label">AVG APY</div>
              </div>
              <div className="stat">
                <div className="stat-value">5,200</div>
                <div className="stat-label">PLAYERS</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.9 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="city-preview">
              <PixelBuilding emoji="🏛️" name="TOWN HALL" apy="WALLET" color="var(--cyber-cyan)" />
              <PixelBuilding emoji="🏦" name="BANK" apy="5.2% APY" color="var(--neon-green)" />
              <PixelBuilding emoji="🏪" name="SHOP" apy="12.1% APY" color="var(--hot-magenta)" />

              {/* Floating coins */}
              <div className="floating-coin">🪙</div>
              <div className="floating-coin">💎</div>
              <div className="floating-coin">⭐</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glitch"
            >
              SELECT YOUR POWER-UPS
            </motion.h2>
            <p>Level up your DeFi game with these abilities</p>
          </div>

          <div className="features-grid">
            {[
              { icon: '🔐', title: 'SMART WALLET', desc: 'Login with Google or email. No seed phrases. Your keys, your coins. Powered by ERC-4337 magic.', color: 'green' },
              { icon: '📈', title: 'REAL YIELD', desc: 'Every building generates actual returns from battle-tested protocols. Not fake tokens.', color: 'cyan' },
              { icon: '⚡', title: 'GASLESS TX', desc: 'We pay the gas fees. You just play. Zero ETH needed to start your adventure.', color: 'magenta' },
              { icon: '🗺️', title: 'VISUAL MAP', desc: 'See your entire portfolio as a living city. Track yields and manage risk at a glance.', color: 'yellow' },
              { icon: '🛡️', title: 'NON-CUSTODIAL', desc: 'Your funds stay in YOUR wallet. We never touch them. Full transparency, full control.', color: 'orange' },
              { icon: '🔄', title: 'AUTO-COMPOUND', desc: 'Set it and forget it. Buildings auto-reinvest to maximize your score.', color: 'blue' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`feature-icon ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              HOW TO PLAY
            </motion.h2>
            <p>From noob to DeFi hero in 4 easy steps</p>
          </div>

          <div className="steps">
            {[
              { num: 1, title: 'CONNECT', desc: 'Sign in with Google, email, or wallet' },
              { num: 2, title: 'CREATE', desc: 'Smart Wallet deploys automatically' },
              { num: 3, title: 'DEPOSIT', desc: 'Fund with USDC, ETH, or bridge' },
              { num: 4, title: 'BUILD', desc: 'Place buildings & earn yield!' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                className="step"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Protocols Section */}
      <section className="protocols" id="protocols">
        <div className="container">
          <div className="section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              POWER SOURCES
            </motion.h2>
            <p>Your city runs on the best DeFi protocols</p>
          </div>

          <div className="protocols-grid">
            {[
              { logo: '👻', name: 'AAVE', desc: 'Lending & Borrow • 5.2% APY' },
              { logo: '✈️', name: 'AERODROME', desc: 'LP Provide • 15% APY' },
              { logo: '🔵', name: 'BASE', desc: 'L2 • Low Fees' },
            ].map((protocol, i) => (
              <motion.div
                key={protocol.name}
                className="protocol-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="protocol-logo">{protocol.logo}</div>
                <h3>{protocol.name}</h3>
                <p>{protocol.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <motion.div
            className="cta-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>READY PLAYER ONE?</h2>
            <p>Join thousands building their crypto empires</p>
            <Link to="/game">
              <motion.span
                className="btn btn-primary btn-large"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'inline-block' }}
              >
                ▶ INSERT COIN
              </motion.span>
            </Link>
            <div className="press-start">
              PRESS START TO BEGIN
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">🏙️</div>
            <span className="logo-text">DEFICITY</span>
          </div>

          <div className="footer-links">
            <a href="#">DOCS</a>
            <a href="#">BLOG</a>
            <a href="#">TERMS</a>
            <a href="#">PRIVACY</a>
          </div>

          <div className="footer-social">
            <a href="#" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a href="#" aria-label="Discord">
              <MessageCircle size={18} />
            </a>
            <a href="#" aria-label="GitHub">
              <Github size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
