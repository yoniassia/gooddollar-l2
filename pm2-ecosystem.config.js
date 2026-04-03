// PM2 Ecosystem Config — GoodDollar L2 Services
// Usage: pm2 start pm2-ecosystem.config.js && pm2 save && pm2 startup
//
// Before running: kill unsupervised GoodSwap PIDs 735615 735627 735628
module.exports = {
  apps: [
    {
      name: 'goodswap',
      script: 'npx',
      args: 'next start -p 3100',
      cwd: '/home/goodclaw/gooddollar-l2/frontend',
      restart_delay: 3000,
      max_restarts: 10,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'goodperps',
      script: 'dist/index.js',
      cwd: '/home/goodclaw/gooddollar-l2/backend/perps',
      restart_delay: 3000,
      max_restarts: 10,
      env: { NODE_ENV: 'production', PORT: '8082' },
    },
    {
      name: 'goodpredict',
      script: 'dist/index.js',
      cwd: '/home/goodclaw/gooddollar-l2/backend/predict',
      restart_delay: 3000,
      max_restarts: 10,
      env: { NODE_ENV: 'production' },
    },
  ],
};
