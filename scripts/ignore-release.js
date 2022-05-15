/**
 * Fetch the previous commit and check if root package.json version has changed.
 * If so, when pushing into main the build step on Vercel will not be skipped.
 *
 * This scripts expects that to deploy on "production" branch the merge request
 * created by `release.yml` is merged after syncing the root package.json.
 */
function checkRelease() {
  const currentRef = process.env.VERCEL_GIT_COMMIT_REF || 'main';
  const attachedCommitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';

  console.log('Commit ref:', currentRef);
  console.log('Commit message:', attachedCommitMessage);

  if (currentRef !== 'main') {
    console.log('Starting deployment');
    process.exit(1);
  }

  if (attachedCommitMessage.startsWith('chore(release):')) {
    console.log('Starting deployment');
    process.exit(1);
  } else {
    console.log('Skipping deployment');
    process.exit(0);
  }
}

checkRelease();
