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

  // const __dirname = dirname(fileURLToPath(import.meta.url));
  //
  // const currentRef = process.env.VERCEL_GIT_COMMIT_REF || 'main';
  //
  // console.log(`Deploying to: ${currentRef}`);
  // console.log(`Fetching remote...`);
  //
  // childProcess.execSync('git fetch');
  // const commitHash = childProcess
  //   .execSync('git rev-parse HEAD~1')
  //   .toString()
  //   .trim();
  //
  // console.log(`Commit hash: ${commitHash}`);
  //
  // if (!currentRef || !commitHash) {
  //   console.log('Exit with error code 0: Could not find commit hash or ref');
  //   process.exit(0);
  // }
  //
  // console.log('Fetching package.json versions...');
  //
  // const previousPackageJson = childProcess
  //   .execSync(`git show ${commitHash}:./package.json`)
  //   .toString();
  // const {version: previousVersion} = JSON.parse(previousPackageJson);
  // const {version: currentVersion} = JSON.parse(
  //   fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
  // );
  //
  // const updated = previousVersion !== currentVersion;
  //
  // console.log(`Previous version: ${previousVersion}`);
  // console.log(`Current version: ${currentVersion}`);
  //
  // if (currentRef === 'main') {
  //   if (updated) {
  //     console.log('Starting deployment');
  //     process.exit(1);
  //   } else {
  //     console.log('Skipping build since package.json has not been updated');
  //     process.exit(0);
  //   }
  // }
  //
  // process.exit(1);
}

checkRelease();
