import { motion } from "motion/react";
import { GlassCard } from "./GlassCard";
import { Button } from "../ui/button";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const handleDemoLogin = () => {
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_40px_rgba(167,139,250,0.6)] mb-4">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-4xl mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            LaserLock
          </h1>
          <p className="text-muted-foreground">Focus. Flow. Freedom.</p>
        </motion.div>

        {/* Demo Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard glow>
            <div className="mb-6 text-center">
              <h2 className="text-primary mb-2">Cal Hacks Demo</h2>
              <p className="text-sm text-muted-foreground">
                Experience the power of LaserLock focus tracking
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleDemoLogin}
                className="w-full h-16 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white shadow-[0_0_20px_rgba(167,139,250,0.4)]"
              >
                Enter Demo Mode
              </Button>

              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>✨ Pre-configured with demo data</p>
                <p>🚀 No signup required</p>
                <p>📊 Real-time distraction tracking</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Empowering neurodiverse minds to thrive
        </motion.p>
      </div>
    </div>
  );
}
