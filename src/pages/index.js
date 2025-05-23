import Head from 'next/head';
import { FiBookOpen, FiUsers, FiFileText, FiClock, FiShield, FiAward, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Online Exam Portal</title>
        <meta name="description" content="Comprehensive online examination management platform" />
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 p-1.5">
            <img 
              src="https://mimitmalout.ac.in/NIELIT.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent hidden sm:inline-block">
            Online Exam Portal
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      <main className="flex flex-col items-center w-full pt-20">
        <div className="w-full max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="w-24 h-24 rounded-xl bg-primary/10 p-3">
                <img 
                  src="https://mimitmalout.ac.in/NIELIT.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl font-bold text-foreground mb-4"
            >
              Online Exam{' '}
              <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                Portal
              </span>
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-muted mb-8 max-w-2xl mx-auto"
            >
              A comprehensive platform for conducting and managing online examinations
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button 
                onClick={() => router.push('/login')}
                className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg"
              >
                Start Now
              </button>
            </motion.div>
          </div>

          <div className="mt-24">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              System Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: FiBookOpen,
                  title: "Exam Creation",
                  description: "Create and schedule exams with customizable question types and time limits."
                },
                {
                  icon: FiUsers,
                  title: "Student Portal",
                  description: "Easy access for students to view and take scheduled examinations."
                },
                {
                  icon: FiFileText,
                  title: "Question Management",
                  description: "Create, edit, and organize questions with various formats and difficulty levels."
                },
                {
                  icon: FiClock,
                  title: "Time Management",
                  description: "Automated timing system with countdown and auto-submission features."
                },
                {
                  icon: FiShield,
                  title: "Anti-Cheating",
                  description: "Advanced security measures to maintain exam integrity and prevent cheating."
                },
                {
                  icon: FiAward,
                  title: "Result Analysis",
                  description: "Instant grading and detailed performance analytics for students."
                },
                {
                  icon: FiCalendar,
                  title: "Schedule Management",
                  description: "Organize and manage exam schedules with conflict prevention."
                },
                {
                  icon: FiCheckCircle,
                  title: "Auto Grading",
                  description: "Automated grading system for objective questions with instant results."
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
                >
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 border-t border-border bg-card mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-muted">
          <p>
            Powered by{' '}
            <span className="font-semibold text-primary">Next.js</span>
            {' '}and{' '}
            <span className="font-semibold text-primary">Appwrite</span>
          </p>
        </div>
      </footer>
    </div>
  );
} 