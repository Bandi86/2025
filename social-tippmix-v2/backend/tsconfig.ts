{
  "compilerOptions": {
    "module": "commonjs",
    "target": "esnext",
    "moduleResolution": "node",
    "sourceMap": true,
    "outDir": "dist",
    "allowJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noImplicitAny": false,
    "noImplicitThis": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": false,
    "lib": ["dom", "es6"],
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "exclude": [
    "node_modules",
    "dist"
  ],
  "include": [
    "src/**/*.ts",
    "tests/**/*.spec.ts"
  ],
  "files": [
    "src/index.ts"
  ]
}
