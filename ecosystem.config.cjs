// Memory grows steadily under real traffic (measured: ~276MB right after
// restart -> ~460MB after 23 minutes, with ZERO errors logged in that
// window - ruling out failed-request cleanup as the cause). At that rate
// it reaches the 1.5-2GB+ this app has repeatedly been observed at within
// a few hours. This looks like this Hydrogen/Oxygen bundle's real SSR
// memory profile under this app's actual traffic, not a single fixable
// bug the way the earlier missing `duplex: 'half'` issue was (that one
// remains fixed - see server.hostinger.js's global fetch patch, confirmed
// still active and not recurring).
//
// The VPS has only 4GB total RAM shared across 7 apps, so rather than
// letting this one grow unbounded and threaten the others, max_memory_restart
// auto-recycles it once it crosses a safe ceiling - the same tradeoff any
// production Node deployment makes for a leak that isn't cheaply fixable
// in a large third-party minified bundle.
module.exports = {
  apps: [
    {
      name: 'lite-digilog-pk',
      script: 'server.hostinger.js',
      cwd: '/docker/lite-digilog-pk/app',
      interpreter: 'node',
      max_memory_restart: '800M',
    },
  ],
};
