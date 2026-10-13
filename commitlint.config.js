// Enforces Conventional Commits, e.g. "feat(products): add search by sku".
// Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
export default {
  extends: ['@commitlint/config-conventional'],
};
