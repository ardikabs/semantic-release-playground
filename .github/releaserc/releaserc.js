const { execSync } = require('child_process');

/**
 * Helper to fetch and sort maintenance branches (e.g., release/v1.7, release/v1.10)
 */
const getSortedMaintenanceBranches = () => {
  try {
    const branches = execSync('git branch -r')
      .toString()
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.includes('origin/release/v'))
      .map(b => b.replace('origin/', ''));

    return branches.sort((a, b) => {
      const vA = a.replace('release/v', '').split('.').map(Number);
      const vB = b.replace('release/v', '').split('.').map(Number);
      for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
        if ((vA[i] || 0) > (vB[i] || 0)) return -1;
        if ((vA[i] || 0) < (vB[i] || 0)) return 1;
      }
      return 0;
    });
  } catch (e) {
    return [];
  }
};

const currentBranch = process.env.GITHUB_REF_NAME;
const isManual = process.env.IS_MANUAL_RELEASE === 'true';
const maintenanceBranches = getSortedMaintenanceBranches();
const latestMaintenance = maintenanceBranches[0];

// --- Branch Logic ---
let branchConfig = [];

if (currentBranch === 'main') {
  if (isManual) {
    // 1. MANUAL MODE: main is the Stable branch.
    // This allows you to cut v1.7.0 directly from main.
    branchConfig.push({ name: 'main' });
  } else {
    // 2. RC MODE: 'stable' is the baseline, 'main' is the prerelease.
    // This allows main to produce v1.7.0-rc.1.
    branchConfig.push({ name: 'stable' });
    branchConfig.push({ name: 'main', prerelease: 'rc' });
  }
  // Include maintenance pattern for context
  branchConfig.push({ name: 'release/v+([0-9]).+([0-9])' });
}
else if (currentBranch === latestMaintenance) {
  // Scenario: Patching the LATEST release branch
  // We omit 'main' here to prevent semantic-release from blocking
  // the patch due to higher RC versions existing on main.
  branchConfig.push({ name: currentBranch });
}
else {
  // Scenario: Patching OLDER maintenance tracks
  // Include main as a reference, but restrict this branch to its specific range.
  branchConfig.push({ name: 'main'});
  const versionPrefix = currentBranch.replace('release/v', '');
  branchConfig.push({
    name: currentBranch,
    range: `${versionPrefix}.x`,
    channel: versionPrefix
  });
}

// --- Full Configuration ---
module.exports = {
  tagFormat: "v${version}",
  branches: branchConfig,
  plugins: [
    [
      "./.github/releaserc/plugins/scope-filter.cjs",
      {
        excludeScopes: ["charts", "release"],
      }
    ],
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { scope: "charts", release: false },
          { scope: "release", release: false },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          scope: ["app", "deps"],
          types: [
            { type: "feat", section: "✨ Features", hidden: false },
            { type: "fix", section: "🐛 Bug Fixes", hidden: false },
            { type: "perf", section: "⚡ Performance Improvements", hidden: false },
            { type: "chore", section: "🧹 Miscellaneous", hidden: false },
            { type: "refactor", section: "🛠️ Code Refactoring", hidden: false }
          ]
        }
      }
    ],
    [
      "@semantic-release/exec",
      {
        verifyReleaseCmd: "./hack/verify-release.sh ${nextRelease.type}",
        prepareCmd: "echo ${nextRelease.version} > VERSION",
        generateNotesCmd: "./hack/sync-version.sh ${nextRelease.version} app",
        publishCmd: "./hack/create-dist.sh ${nextRelease.version}",
        successCmd: "./hack/post-release-branch.sh ${nextRelease.version}"
      }
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "VERSION",
          "charts/dummy/Chart.yaml",
          "charts/dummy/README.gotmpl"
        ],
        message: "chore(release): ${nextRelease.version} [skip ci]\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          { path: "dist/dummy/**/magic-script-*" }
        ]
      }
    ]
  ]
};