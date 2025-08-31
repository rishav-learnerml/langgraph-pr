import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative pt-5 text-center text-muted-foreground border-t bg-background/80 backdrop-blur-lg mt-2">
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 1 }}
    >
      © {new Date().getFullYear()} ChatSphere. All rights reserved.
    </motion.p>
  </footer>
  )
}

export default Footer