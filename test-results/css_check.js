#!/usr/bin/env node
const https = require('https');

const FRONTEND = 'https://goodswap.goodclaw.org';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET' }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.status, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function run() {
  // Get the page HTML to find CSS file URLs
  console.log('Fetching homepage...');
  const page = await fetch(FRONTEND);

  const cssUrls = (page.body.match(/\/_next\/static\/[^"']+\.css[^"']*/g) || [])
    .map(u => FRONTEND + u.split('"')[0].split("'")[0])
    .filter((u, i, a) => a.indexOf(u) === i);

  console.log('CSS files found:', cssUrls.length);

  for (const cssUrl of cssUrls) {
    console.log(`\nFetching: ${cssUrl}`);
    const css = await fetch(cssUrl);
    console.log(`  Status: ${css.status}, size: ${css.body.length} chars`);

    // Check for hidden and sm:flex
    const hasHidden = css.body.includes('.hidden') || /\.hidden[^-]/.test(css.body);
    const hasSm = css.body.includes('sm\\:flex') || css.body.includes('sm:flex');
    const hiddenRule = css.body.match(/\.hidden\{[^}]+\}/)?.[0] || css.body.match(/\.hidden [^{]*\{[^}]+\}/)?.[0];
    const smFlexSample = css.body.match(/.{50}sm.{5}flex.{50}/)?.[0];

    console.log(`  Has .hidden class: ${hasHidden}`);
    console.log(`  Has sm:flex: ${hasSm}`);
    console.log(`  .hidden rule: ${hiddenRule || 'NOT FOUND'}`);
    console.log(`  sm:flex sample: ${smFlexSample || 'NOT FOUND'}`);

    // Check for breakpoint
    const smBreakpoint = css.body.match(/@media[^{]*640[^{]*\{[^}]+\.sm\\:flex[^}]+\}/)?.[0] ||
                         css.body.match(/@media.{0,30}640.{0,50}/)?.[0];
    console.log(`  sm breakpoint: ${smBreakpoint || 'NOT FOUND'}`);
  }
}

run().catch(console.error);
