#!/bin/sh
# Push a short-lived test-* tag to trigger GitHub Actions docker-e2e deploy.
set -eu
cd "$(dirname "$0")/.."

TAG=test-$(date +'%m.%d.%Y')

git push origin "HEAD:refs/tags/$TAG"
git push --delete origin "$TAG"
