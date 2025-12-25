'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { RatingManagement } from '@/components/dashboard/rating-management';
import { DriversPage } from '@/components/dashboard/drivers-page';
import { TripsPage } from '@/components/dashboard/trips-page';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Truck,
  Star,
  Shield,
  BarChart3,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from '@/lib/translations';

// Dynamic imports to prevent SSR issues with Leaflet
const DynamicHeatMap = dynamic(
  () => import('@/components/dashboard/heatmap-dashboard').then(mod => ({ default: mod.HeatMapDashboard })),
  { ssr: false, loading: () => <div className="h-[500px] flex items-center justify-center">Loading map...</div> }
);

const DynamicRealTimeTracking = dynamic(
  () => import('@/components/dashboard/realtime-tracking').then(mod => ({ default: mod.RealTimeTracking })),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center">Loading tracking...</div> }
);

export default function AdminDashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="space-y-6"
      >
        {/* Page Header with Language Switcher */}
        <div className="flex items-center justify-between">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <LanguageSwitcher />
          </motion.div>
        </div>

        {/* Main Navigation Tabs with Neomorphism */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 neomorph-sm">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r from-amber-500/20 to-primary/20 data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {tNav('dashboard')}
              </TabsTrigger>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <TabsTrigger
                value="drivers"
                className="data-[state=active]:bg-gradient-to-r from-amber-500/20 to-primary/20 data-[state=active]:text-primary-foreground"
              >
                <Truck className="mr-2 h-4 w-4" />
                {tNav('drivers')}
              </TabsTrigger>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              <TabsTrigger
                value="trips"
                className="data-[state=active]:bg-gradient-to-r from-amber-500/20 to-primary/20 data-[state=active]:text-primary-foreground"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {tNav('trips')}
              </TabsTrigger>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <TabsTrigger
                value="tracking"
                className="data-[state=active]:bg-gradient-to-r from-amber-500/20 to-primary/20 data-[state=active]:text-primary-foreground"
              >
                <Shield className="mr-2 h-4 w-4" />
                {tNav('tracking')}
              </TabsTrigger>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.45, duration: 0.3 }}
            >
              <TabsTrigger
                value="heatmap"
                className="data-[state=active]:bg-gradient-to-r from-amber-500/20 to-primary/20 data-[state=active]:text-primary-foreground"
              >
                <Shield className="mr-2 h-4 w-4" />
                {tNav('heatmap')}
              </TabsTrigger>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <TabsTrigger
                value="ratings"
                className="data-[state=active]:bg-gradient-to-r from-amber-500/20 to-primary/20 data-[state=active]:text-primary-foreground"
              >
                <Star className="mr-2 h-4 w-4" />
                {tNav('ratings')}
              </TabsTrigger>
            </motion.div>
          </TabsList>

          {/* Overview Tab with Animated Stats */}
          <TabsContent value="overview" className="mt-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.55, duration: 0.3 }}
              className="space-y-6"
            >
              {/* Stats Grid with Neomorphism */}
              <div className="grid gap-4 md:grid-cols-4">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <StatCard
                    title={tCommon('total_rides')}
                    value="2,847"
                    change="+12.5%"
                    changeType="increase"
                    icon={MapPin}
                    description={tCommon('in_last_7_days')}
                  />
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  transition={{ delay: 0.65, duration: 0.3 }}
                >
                  <StatCard
                    title={t('active_drivers')}
                    value="156"
                    change="+8.2%"
                    changeType="increase"
                    icon={Truck}
                    description={t('currently_online')}
                  />
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <StatCard
                    title={t('total_revenue')}
                    value="$45,234"
                    change="+15.3%"
                    changeType="increase"
                    icon={BarChart3}
                    description={t('cash_collected')}
                  />
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  transition={{ delay: 0.75, duration: 0.3 }}
                >
                  <StatCard
                    title={t('registered_users')}
                    value="8,421"
                    change="+22.1%"
                    changeType="increase"
                    icon={Users}
                    description={t('active_riders')}
                  />
                </motion.div>
              </div>

              {/* Features Preview with Neomorphism */}
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="neomorph-card neomorph-md p-6 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary neomorph-icon"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MapPin className="h-5 w-5" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {tCommon('tracking').substring(0, 6)}...
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tCommon('heatmap').substring(0, 35)}...
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{tCommon('view_all')}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  transition={{ delay: 0.85, duration: 0.3 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="neomorph-card neomorph-md p-6 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary neomorph-icon"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Shield className="h-5 w-5" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {tCommon('ratings').substring(0, 5)}...
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tCommon('fraud_alerts').substring(0, 30)}...
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary mt-2">
                    <Shield className="h-4 w-4" />
                    <span>{tCommon('view_all')}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="mt-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.9, duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <DriversPage />
              </div>
            </motion.div>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips" className="mt-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 0.95, duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <TripsPage />
              </div>
            </motion.div>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="mt-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 1.0, duration: 0.3 }}
              className="space-y-6"
            >
              <DynamicRealTimeTracking />
            </motion.div>
          </TabsContent>

          {/* Heat Map Tab */}
          <TabsContent value="heatmap" className="mt-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 1.05, duration: 0.3 }}
              className="space-y-6"
            >
              <DynamicHeatMap />
            </motion.div>
          </TabsContent>

          {/* Ratings Tab */}
          <TabsContent value="ratings" className="mt-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: 1.1, duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <RatingManagement />
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
