import { spawnSync } from 'node:child_process';

process.env.NEXT_STANDALONE = 'true';

const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
