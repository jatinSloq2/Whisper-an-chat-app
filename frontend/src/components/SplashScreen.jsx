import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = () => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-gray-100 text-purple-500 flex flex-col items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
      >
        {/* Custom SVG Logo Animation */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          className="mb-4"
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-purple-600"
          >
            <rect width="24" height="24" rx="6" fill="#8338ec" />
            <path
              d="M6 10C6 8.34315 7.34315 7 9 7H15C16.6569 7 18 8.34315 18 10V14C18 15.6569 16.6569 17 15 17H12.4142L10 19.4142V17H9C7.34315 17 6 15.6569 6 14V10Z"
              fill="white"
            />
          </svg>
          {/* <img src={Logo} alt="Logo" className="w-20 h-20 object-contain" /> */}
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          className="text-xl font-bold tracking-wide text-purple-600"
        >
          Whisper
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="text-md text-neutral-900 fixed bottom-5 "
        >
          By Jatin Singh
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
