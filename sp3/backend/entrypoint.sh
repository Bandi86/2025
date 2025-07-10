#!/bin/sh

# Alkalmazza az adatbázis migrációkat
echo "Applying database migrations..."
npx prisma migrate deploy

# Indítsa el az alkalmazást
echo "Starting the application..."
exec "$@"
