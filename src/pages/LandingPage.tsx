import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MousePointer2,
  Users,
  Zap,
  Shield,
  Monitor,
  Sparkles,
  ArrowRight,
  Check,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { MainLayout } from '@/layouts';
import { Button } from '@/components/ui';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function LandingPage() {
  return (
    <MainLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush-50 via-white to-lavender-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blush-100/40 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blush-50 border border-blush-100 mb-6">
              <Sparkles className="w-4 h-4 text-blush-500" />
              <span className="text-sm font-medium text-blush-700">Now in public beta</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Collaborate visually,
              <br />
              <span className="text-gradient">create together</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              A beautiful whiteboard for teams to brainstorm, plan, and bring ideas to life
              in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Start for free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Free forever
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blush-200/30 via-lavender-200/30 to-blush-200/30 rounded-3xl blur-2xl" />
            <div className="relative glass-card p-2 shadow-xl">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden aspect-[16/9]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/20 text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Interactive canvas preview</p>
                    <p className="text-sm opacity-60 mt-2">Start a board to see the full experience</p>
                  </div>
                </div>
                <canvas className="w-full h-full opacity-10" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to collaborate
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for modern teams
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: MousePointer2,
                title: 'Infinite Canvas',
                description: 'Unlimited space to express your ideas. Pan, zoom, and draw freely.',
                color: 'from-blush-100 to-blush-50',
                iconColor: 'text-blush-500',
              },
              {
                icon: Users,
                title: 'Real-time Collaboration',
                description: 'See cursors, edits, and comments as they happen. Work together seamlessly.',
                color: 'from-lavender-100 to-lavender-50',
                iconColor: 'text-lavender-500',
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Optimized for performance. No lag, no delays, just smooth creativity.',
                color: 'from-amber-100 to-amber-50',
                iconColor: 'text-amber-500',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your boards are encrypted and private. Share only with who you choose.',
                color: 'from-green-100 to-green-50',
                iconColor: 'text-green-500',
              },
              {
                icon: Sparkles,
                title: 'Beautiful Design',
                description: 'A premium, elegant interface that makes collaboration a joy.',
                color: 'from-blue-100 to-blue-50',
                iconColor: 'text-blue-500',
              },
              {
                icon: Monitor,
                title: 'Works Everywhere',
                description: 'Desktop, tablet, or mobile. Your boards are always accessible.',
                color: 'from-teal-100 to-teal-50',
                iconColor: 'text-teal-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="glass-card p-6 card-hover"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-gradient-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple as 1, 2, 3
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in minutes, not hours
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create a board',
                description: 'Start with a blank canvas or choose a template.',
              },
              {
                step: '02',
                title: 'Invite your team',
                description: 'Share a link and collaborate in real-time.',
              },
              {
                step: '03',
                title: 'Bring ideas to life',
                description: 'Draw, write, and create together seamlessly.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative glass-card p-8 text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blush-400 to-lavender-400 text-white text-sm font-semibold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Built for modern teams
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                From design reviews to sprint planning, CollabBoard helps your team move faster
                and stay aligned.
              </p>
              <ul className="space-y-4">
                {[
                  'Infinite canvas for unlimited creativity',
                  'Real-time multi-user editing',
                  'Export to PNG or JSON',
                  'Beautiful, intuitive interface',
                  'Works on any device',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blush-100 to-lavender-100 rounded-3xl blur-2xl opacity-50" />
              <div className="relative glass-card overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">App preview</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-blush-50 via-lavender-50 to-blush-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to create something amazing?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join teams already using CollabBoard to collaborate better.
            </p>
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get started for free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blush-400 to-lavender-400 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-800">CollabBoard</span>
              </div>
              <p className="text-sm text-gray-500">
                A beautiful collaborative whiteboard for modern teams.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-blush-600">Features</a></li>
                <li><a href="#" className="hover:text-blush-600">Pricing</a></li>
                <li><a href="#" className="hover:text-blush-600">Templates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blush-600">About</a></li>
                <li><a href="#" className="hover:text-blush-600">Blog</a></li>
                <li><a href="#" className="hover:text-blush-600">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blush-600">Privacy</a></li>
                <li><a href="#" className="hover:text-blush-600">Terms</a></li>
                <li><a href="#" className="hover:text-blush-600">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} CollabBoard. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}
