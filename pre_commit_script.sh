node bin/aix-validate.js examples/persona-agent.aix
node bin/aix-validate.js examples/tool-agent.aix
node bin/aix-validate.js examples/hybrid-agent.aix
npm run test
npm run build --prefix apps/studio
