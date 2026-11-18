# One Clarity application

This gateway publishes the original React app from react-mastery/index.html and src/main.tsx. All visitors receive the same App, sidebar, learning desk, LearningPaths, practice workspace and styles. There is no separate display frontend.

The implementation lives in react-mastery/hosting. Authenticated owner APIs proxy to the existing Railway service. Visitors receive authored curriculum and empty personal records, with topic goals and references rendered by the original practice component. Personal writes, exports and AI stay owner-only. Sign-in returns to the same / application. No backend deployment is needed to publish frontend updates.

From this gateway directory, build with node scripts/build-gateway.mjs and test with node --test gateway.test.mjs. The Site source contains the same original app source and hosting files; build there with node hosting/build.mjs. Publish the matching pushed source through the Sites workflow. Never copy data/, credentials or generated AI records into the Site source.
