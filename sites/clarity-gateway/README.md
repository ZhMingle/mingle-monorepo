# Clarity learning paths

The Site opens the complete learning path catalog at / and /#roadmap without sign-in. Visitors can search all 27 routes and 642 topics, follow stage goals and official references, read the authored React lessons, and keep reading markers in their own browser. /#roadmap/<path> opens a specific route. There is no separate demo introduction. The catalog is exported from react-mastery/shared, with no learner records, generated AI output or credentials.

The personal workspace stays at /?workspace=1. Sites provides verified request identity; both user ID and an exact configured owner-email match are required before forwarding any personal asset or API to Railway. Bridge and migration endpoints stay blocked. The public catalog never uses the owner's AI bridge. Follow-up prompts explicitly open the visitor's own ChatGPT.

Runtime settings: CLARITY_OWNER_EMAIL, CLARITY_BACKEND_ORIGIN, CLARITY_PROXY_KEY. Keep values in Sites runtime settings.

Checks: node --test gateway.test.mjs and tsc -p learning/tsconfig.json. Build: node scripts/build-gateway.mjs. Refresh the authored catalog with node scripts/export-public-curriculum.mjs <absolute-react-mastery-directory>. Publish the matching pushed source through the Sites workflow.
