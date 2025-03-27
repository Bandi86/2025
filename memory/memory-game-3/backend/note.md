guide url: https://medium.com/@gabrieldrouin/node-js-2025-guide-how-to-setup-express-js-with-typescript-eslint-and-prettier-b342cd21c30d
npm init -y
npm i express
typescript: npm i -D typescript @types/node @types/express @tsconfig/node22
create ts conf: npx tsc --init
npm i -D tsx

edit package.json
 "scripts": {
    "dev": "tsx --watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint --fix .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "echo \"Error: no test specified\" && exit 1",
  },

Integrating Node.js with PostgreSQL
With both Node.js and PostgreSQL installed, it’s time to integrate them:

1. **Install pg Module**: Use npm to install the ‘pg’ module, which is a PostgreSQL client for Node.js:
2. npm install pg
3. npm i --save-dev @types/pg



