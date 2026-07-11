import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain,
  Zap,
  Database,
} from "lucide-react";
import { GlassCard, StatCard, SeverityBadge } from "../components/ui";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 pt-8 pb-12 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold mb-2 bg-gradient-to-r from-text-primary to-brand-accent bg-clip-text text-transparent"
              >
                Incident Response Dashboard
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-text-secondary text-lg"
              >
                AI-powered production log analysis & incident intelligence
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/upload")}
              className="
                flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-brand-primary to-brand-secondary
                hover:from-brand-secondary hover:to-brand-primary
                text-white font-semibold rounded-lg
                transition-all duration-300 shadow-lg
                hover:shadow-xl hover:shadow-brand-primary/30
              "
            >
              <Upload size={20} />
              Upload Logs
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="p-6 space-y-8 max-w-7xl mx-auto"
      >
        {/* Key Metrics */}
        <motion.div variants={item}>
          <h2 className="text-xl font-bold mb-4">Quick Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Database size={24} />}
              label="Files Processed"
              value="1,284"
              change={12}
              trend="up"
            />
            <StatCard
              icon={<AlertTriangle size={24} />}
              label="Active Incidents"
              value="3"
              change={-5}
              trend="down"
            />
            <StatCard
              icon={<Brain size={24} />}
              label="AI Confidence"
              value="94.2%"
              change={2}
              trend="up"
            />
            <StatCard
              icon={<Activity size={24} />}
              label="System Health"
              value="Operational"
              variant="success"
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item}>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <GlassCard>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 8 }}
                  className="flex items-start justify-between p-4 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${i === 1 ? "bg-red-500/20 text-red-400" : i === 2 ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}
                    `}>
                      {i === 1 ? <AlertTriangle size={20} /> : i === 2 ? <Zap size={20} /> : <CheckCircle size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        {i === 1 ? "Critical error in Payment Service" : i === 2 ? "Database connection timeout" : "Incident resolved"}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {i === 1 ? "5 minutes ago" : i === 2 ? "12 minutes ago" : "1 hour ago"}
                      </p>
                    </div>
                  </div>
                  <SeverityBadge
                    severity={i === 1 ? "critical" : i === 2 ? "high" : "low"}
                  />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Upload Section */}
        <motion.div variants={item}>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard
              hover
              className="flex flex-col items-center justify-center py-8 cursor-pointer"
              onClick={() => navigate("/upload")}
            >
              <div className="text-4xl mb-3 opacity-75">
                <Upload size={40} />
              </div>
              <p className="font-semibold text-center">Upload Logs</p>
              <p className="text-xs text-text-muted text-center mt-1">
                Submit new log files for analysis
              </p>
            </GlassCard>
            <GlassCard
              hover
              className="flex flex-col items-center justify-center py-8 cursor-pointer"
              onClick={() => navigate("/incidents")}
            >
              <div className="text-4xl mb-3 opacity-75">
                <AlertTriangle size={40} />
              </div>
              <p className="font-semibold text-center">View Incidents</p>
              <p className="text-xs text-text-muted text-center mt-1">
                Browse all detected incidents
              </p>
            </GlassCard>
            <GlassCard
              hover
              className="flex flex-col items-center justify-center py-8 cursor-pointer"
              onClick={() => navigate("/root-cause")}
            >
              <div className="text-4xl mb-3 opacity-75">
                <Brain size={40} />
              </div>
              <p className="font-semibold text-center">AI Analysis</p>
              <p className="text-xs text-text-muted text-center mt-1">
                Get root cause analysis
              </p>
            </GlassCard>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={item} className="pb-8">
          <h2 className="text-xl font-bold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard>
              <div className="space-y-3">
                <p className="text-sm text-text-muted uppercase tracking-wide">
                  Processing Pipeline
                </p>
                <div className="space-y-2">
                  {["Parse", "Validate", "Normalize", "Analyze"].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent" />
                      <span className="text-sm">{step}</span>
                      <span className="text-xs text-text-muted ml-auto">●●●</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="space-y-3">
                <p className="text-sm text-text-muted uppercase tracking-wide">
                  AI Model Status
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Claude 3.5 Sonnet</span>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Embeddings API</span>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">
                      Offline
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Qdrant Vector DB</span>
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                      Offline
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ModernDashboard;
