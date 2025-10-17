const errors = [];

const majorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);
if (!Number.isInteger(majorVersion) || majorVersion < 20) {
  errors.push(`Node.js 20 or newer is required. Detected ${process.versions.node}.`);
}

const hasGetRandomValues = typeof globalThis.crypto?.getRandomValues === 'function';
if (!hasGetRandomValues) {
  errors.push('globalThis.crypto.getRandomValues must be available.');
}

if (errors.length > 0) {
  for (const message of errors) {
    console.error(message);
  }
  process.exitCode = 1;
} else {
  console.log('Node.js environment checks passed.');
}
