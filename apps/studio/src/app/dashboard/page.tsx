"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { PiAuth } from "@/components/pi/PiAuth";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { usePi } from "@/hooks/usePi";
import {
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Smile,
} from "lucide-react";

interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  successRate: number;
  totalRevenue: number;
  avgHappiness: number;
}

function DashboardContent() {
  const { agents, loaded } = useLocalAgents();
  const { isAuthenticated, user } = usePi({ sandbox: true });
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    totalTasks: 0,
    successRate: 0,
    totalRevenue: 0,
    avgHappiness: 0,
  });
  const [realtimeData, setRealtimeData] = useState<any[]>([]);

  // Calculate metrics from agents
  useEffect(() => {
    if (!loaded) return;

    const activeCount = agents.filter((a) => a.status === "online").length;
    const totalTasks = agents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0);
    const avgSuccess = agents.length > 0
      ? agents.reduce((sum, a) => sum + (a.successRate || 0), 0) / agents.length
      : 0;

    setMetrics({
      totalAgents: agents.length,
      activeAgents: activeCount,
      totalTasks,
      successRate: avgSuccess,
      totalRevenue: totalTasks * 0.1, // Mock calculation
      avgHappiness: 7.5, // Mo Gawdat happiness score
    }, []);
  }, [agents, loaded]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = {
        id: Date.now(),
        type: ["task_completed", "agent_deployed", "payment_received"][Math.floor(Math.random() * 3)],
        agent: agents[Math.floor(Math.random() * agents.length)]?.name || "Unknown Agent",
        timestamp: new Date().toISOString(),
      };
      setRealtimeData((prev) => [newEvent, ...prev].slice(0, 10));
    }, 5000);

    return () => clearInterval(interval);
  }, [agents]);

  const statCards = [
    {
      title: "Total Agents",
      value: metrics.totalAgents,
      change: "+12%",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Active Now",
      value: metrics.activeAgents,
      change: `${metrics.activeAgents}/${metrics.totalAgents}`,
      icon: Activity,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: "Tasks Completed",
      value: metrics.totalTasks,
      change: "+23%",
      icon: CheckCircle,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Success Rate",
      value: `${metrics.successRate.toFixed(1)}%`,
      change: "+5.2%",
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Revenue (π)",
      value: metrics.totalRevenue.toFixed(2),
      change: "+18%",
      icon: DollarSign,
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Happiness Score",
      value: metrics.avgHappiness.toFixed(1),
      change: "Mo Gawdat",
      icon: Smile,
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text text-gradient tracking-tight mb-2">
            Agent Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time monitoring and analytics for your AI agents
          </p>
        </motion.div>

        {/* Pi Authentication */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <PiAuth />
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-400 font-medium">{stat.change}</span>
                <span className="text-gray-500">vs last month</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Real-time Activity Feed */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Real-time Activity
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-gray-400">Live</span>
                </div>
              </div>

              <div className="space-y-3">
                {realtimeData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Waiting for activity...</p>
                  </div>
                ) : (
                  realtimeData.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.type === "task_completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : event.type === "agent_deployed"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {event.type === "task_completed" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : event.type === "agent_deployed" ? (
                          <Zap className="w-5 h-5" />
                        ) : (
                          <DollarSign className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {event.type === "task_completed"
                            ? "Task Completed"
                            : event.type === "agent_deployed"
                            ? "Agent Deployed"
                            : "Payment Received"}
                        </p>
                        <p className="text-gray-400 text-xs">{event.agent}</p>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Performance Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-2xl p-6 border border-white/10 mt-6"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                Performance Analytics
              </h2>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>Chart visualization coming soon</p>
                  <p className="text-sm mt-1">Real-time performance metrics</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:brightness-110 transition-all">
                  Deploy New Agent
                </button>
                <button className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">
                  View Marketplace
                </button>
                <button className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">
                  Manage Agents
                </button>
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-panel rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">API Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Pi Network</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">Healthy</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* User Info */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-panel rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-bold text-white mb-4">Account</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white font-medium">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">KYC Status:</span>
                    <span
                      className={`font-medium ${
                        user.kycStatus === "verified"
                          ? "text-emerald-400"
                          : user.kycStatus === "pending"
                          ? "text-yellow-400"
                          : "text-gray-400"
                      }`}
                    >
                      {user.kycStatus.toUpperCase()}
                    </span>
                  </div>
                  {user.piBalance !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Balance:</span>
                      <span className="text-white font-medium">{user.piBalance.toFixed(2)} π</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <SovereignStatusBar />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary boundaryName="DashboardPage">
      <DashboardContent />
    </ErrorBoundary>
  );
}

// Made with Moe Abdelaziz

function.displayName = 'function';
