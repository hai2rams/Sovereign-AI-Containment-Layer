#!/usr/bin/env npx tsx
/** M0 stub — no demo execution. */
const scenario = process.argv.find((a) => a.startsWith('--scenario='))?.split('=')[1] ?? 'golden-path';
console.log(`[M0] run-demo stub — scenario=${scenario} (no execution)`);
