import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, ShieldCheck } from "lucide-react";

function HomePage() {

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-background via-muted to-background text-foreground">
      {/* Background Gradient Blobs */}
      <motion.div
        className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary blur-3xl opacity-25"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] h-96 w-96 rounded-full bg-secondary blur-3xl opacity-25"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Hero Section */}
      <header className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.h1
          className="text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to ChatSphere
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-xl md:text-2xl text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Your AI-powered assistant for smarter, faster, and more engaging
          conversations.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-col items-center gap-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/chat">
            <Button
              size="lg"
              className="px-10 py-6 text-lg rounded-2xl shadow-xl dark:border border-gray-200"
            >
              Start Chatting 🚀
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="relative py-20 px-6 bg-background/70 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl shadow-lg border bg-card"
          >
            <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-2">
              Natural Conversations
            </h3>
            <p className="text-muted-foreground">
              Chat like you’re talking to a friend — smooth, intelligent, and
              engaging.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl shadow-lg border bg-card"
          >
            <Sparkles className="h-12 w-12 mx-auto text-secondary mb-4" />
            <h3 className="text-2xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-muted-foreground">
              Powered by cutting-edge AI to give you the best answers, every
              time.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl shadow-lg border bg-card"
          >
            <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your conversations are safe, encrypted, and never shared.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 text-center text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} ChatSphere. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
