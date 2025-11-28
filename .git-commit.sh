#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configure git user from .env
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

# Add all changes
git add .

# Create commit message
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update project files"
fi

# Commit with message
git commit -m "$COMMIT_MSG"

# Push to GitHub
git push origin main

echo "✅ Changes committed and pushed as $GITHUB_USERNAME <$GITHUB_EMAIL>"
