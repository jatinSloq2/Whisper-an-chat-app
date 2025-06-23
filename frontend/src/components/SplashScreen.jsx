import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = () => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-gradient-to-br from-gray-100 via-purple-50 to-gray-200 text-purple-500 flex flex-col items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
      >
        {/* Glow Animation Background */}
        <motion.div
          className="absolute w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1.5 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />

        {/* SVG Logo with Pulse */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          className="mb-4 relative"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-400 blur-xl opacity-30 animate-pulse"
          />
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            <rect width="24" height="24" rx="6" fill="#8338ec" />
            <path
              d="M6 10C6 8.34315 7.34315 7 9 7H15C16.6569 7 18 8.34315 18 10V14C18 15.6569 16.6569 17 15 17H12.4142L10 19.4142V17H9C7.34315 17 6 15.6569 6 14V10Z"
              fill="white"
            />
          </svg>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7, ease: "easeOut" }}
          className="text-2xl font-semibold tracking-wide text-purple-700"
        >
          Whisper
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="text-sm text-neutral-800 absolute bottom-6"
        >
          By Jatin Singh
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
