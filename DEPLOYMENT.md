# SRIX Pathfinder Deployment Checklist

## Pre-deploy

- [ ] Run `npx ts-node src/scripts/generateIcons.ts`
- [ ] Verify `public/icons/icon-192.png`, `public/icons/icon-512.png`, and `public/icons/apple-touch-icon.png` exist
- [ ] Verify `public/manifest.json` is valid JSON
- [ ] Install production dependencies with `NODE_ENV=production npm install`
- [ ] Test PWA install on Android Chrome
- [ ] Test PWA install on iOS Safari (Add to Home Screen)
- [ ] Test offline mode by loading the app, turning off wifi, and navigating
- [ ] Test QR scanner on a real mobile device
- [ ] Test voice guidance on a real mobile device with a user tap gesture
- [ ] Verify `/qr-generator` prints correctly
- [ ] Run Lighthouse and target PWA score > 90

## QR code printing

- [ ] Visit `/qr-generator`
- [ ] Print each floor separately
- [ ] Laminate before placing in the building
- [ ] Place QR codes at eye level near junctions
- [ ] Verify QR scan works from 50cm and 100cm

## Calibration

- [ ] Walk a known corridor with Live Track enabled
- [ ] Compare SVG units against real meters
- [ ] Update `SVG_UNITS_PER_METER` in `src/lib/tracking/pdr.ts` if needed
- [ ] Redeploy with the updated constant

## Release checks

- [ ] Confirm PWA install prompt appears
- [ ] Confirm offline fallback page loads when network is unavailable
- [ ] Confirm voice controls persist across reloads
- [ ] Confirm onboarding only shows once per user
- [ ] Confirm error boundary recovers from component failures
