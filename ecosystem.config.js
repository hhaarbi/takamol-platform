/**
 * PM2 Ecosystem Configuration — تكامل Real Estate Platform
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production   # zero-downtime reload
 *   pm2 save                                          # persist across reboots
 */
module.exports = {
  apps: [
    {
      name: "takamol",
      // Path after `pnpm build` (esbuild → dist/index.js)
      script: "./dist/index.js",
      cwd: "/var/www/takamol",

      // Load .env file automatically
      env_file: "/var/www/takamol/.env",

      // Production environment
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Development environment (for local testing with PM2)
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },

      // ─── Performance ──────────────────────────────────────
      instances: "max",         // use all CPU cores
      exec_mode: "cluster",     // cluster mode for load balancing
      max_memory_restart: "1G", // restart if memory exceeds 1GB

      // ─── Logs ─────────────────────────────────────────────
      log_file:        "/var/log/takamol/combined.log",
      out_file:        "/var/log/takamol/out.log",
      error_file:      "/var/log/takamol/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs:      true,

      // ─── Restart Policy ───────────────────────────────────
      watch:           false,
      autorestart:     true,
      max_restarts:    10,
      restart_delay:   4000,  // 4s between restarts
      min_uptime:      "10s", // must stay up 10s to be considered stable
      kill_timeout:    5000,  // 5s graceful shutdown
      listen_timeout:  10000, // 10s to start listening
    },
  ],
};
