#!/bin/bash

# Ensure core/parser.js is valid
sed -i 's/export { defaultRegistry, PluginRegistry };/export { getRules as defaultRegistry } from ".\/validation-engine.js";/g' core/parser.js
sed -i '/export { ValidationPlugin }/d' core/parser.js
sed -i '/export \* from "\.\/plugins\/index\.js";/d' core/parser.js

# Ensure rules export 'check' instead of 'test' because validation-engine.js expects 'check'
find core/rules -type f -name "*.js" -exec sed -i 's/    test: (/    check: (/g' {} +

# Let's fix missing imports in validation rules and tests
