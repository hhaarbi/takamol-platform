/**
 * PM2 Ecosystem Configuration
 * تشغيل: pm2 start ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: "realestate-bot",
      // المسار الصحيح بعد pnpm build (esbuild → dist/index.js)
      script: "./dist/index.js",
      cwd: "/var/www/realestate-bot",

      // بيئة الإنتاج
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // إعدادات الأداء
      instances: "max",          // استخدام جميع CPU cores
      exec_mode: "cluster",      // cluster mode للـ load balancing
      max_memory_restart: "1G",  // إعادة التشغيل عند تجاوز 1GB RAM

      // إعدادات الـ logs
      log_file: "/var/log/realestate-bot/combined.log",
      out_file: "/var/log/realestate-bot/out.log",
      error_file: "/var/log/realestate-bot/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // إعادة التشغيل التلقائي
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      min_uptime: "10s",
      kill_timeout: 5000,
      listen_timeout: 10000,

      // بيئة التطوير (للاختبار المحلي)
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};
