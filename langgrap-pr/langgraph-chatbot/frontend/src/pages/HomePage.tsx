import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { features } from "@/constants/features";
import { Feature } from "@/constants/features";
import { generateSessionId } from "@/utils/helper/generateSessionId";

function HomePage() {
  return (
    <div className="relative flex flex-col bg-gradient-to-br from-background via-muted/40 to-background text-foreground transition-colors duration-500">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-purple-500/10 to-secondary/20 blur-3xl opacity-50"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Floating Blobs */}
      <motion.div
        className="absolute top-[-10rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-primary/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-12rem] right-[-12rem] h-[32rem] w-[32rem] rounded-full bg-secondary/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Hero Section */}
      <header className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent drop-shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to ChatSphere
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-lg md:text-2xl text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Your AI-powered assistant for smarter, faster, and more engaging
          conversations.
        </motion.p>
        <motion.div
          className="mt-6 flex flex-col items-center gap-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to={`/chat?sessionId=${generateSessionId()}`}>
            <Button
              size="lg"
              className="px-10 py-6 text-lg rounded-2xl shadow-lg border dark:border-gray-800 transition-all hover:shadow-2xl cursor-pointer"
            >
              Start Chatting 🚀
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="relative py-20 px-6 bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          {features.map(
            ({ icon: Icon, title, desc, color }: Feature, i: number) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-8 rounded-3xl shadow-lg border bg-card hover:shadow-2xl transition-all"
              >
                <Icon className={`h-14 w-14 mx-auto mb-5 ${color}`} />
                <h3 className="text-2xl font-semibold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
