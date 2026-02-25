const path = require("path");
const { Transform } = require("readable-stream");

module.exports = {
  verifyConditions: (pluginConfig, context) => {
    const {
        scopes = [],              // Allow list
        excludeScopes = [],         // Block list
        filterOutMissingScope = false
      } = pluginConfig;

      if (!filterOutMissingScope) scopes.push("");
      const { logger } = context;

      logger.log("Initializing Dual-Filter Scope Plugin...");
      logger.log(`Allowed scopes: ${scopes}`);
      logger.log(`Excluded scopes: ${excludeScopes}`);
      logger.log(`Filter out missing scope: ${filterOutMissingScope}`);

      Object.keys(require.cache)
        .filter((m) =>
          path
            .posix
            .normalize(m.replace(/\\/g, "/"))
            .endsWith("/node_modules/git-log-parser/src/index.js")
        )
        .forEach((moduleName) => {
          const originalParse = require.cache[moduleName].exports.parse;

          require.cache[moduleName].exports.parse = (config, options) => {
            const stream = originalParse(config, options);

            return stream.pipe(
              new Transform({
                objectMode: true,
                transform(chunk, enc, callback) {
                  // Extract scope from Conventional Commit subject
                  const scopeMatch = chunk.subject?.match(/^\w+\((.*?)\):/);
                  const currentScope = scopeMatch ? scopeMatch[1] : "";

                  // 1️⃣ Exclusion (blocklist)
                  if (excludeScopes.includes(currentScope)) {
                    logger.log(
                      `[Filter] ❌ Blocked: ${chunk.commit.short} (scope "${currentScope}")`
                    );
                    return callback();
                  }

                  // 2️⃣ Inclusion (allowlist)
                  if (scopes !== null) {
                    const allowed = [...scopes];

                    if (!filterOutMissingScope && !allowed.includes("")) {
                      allowed.push("");
                    }

                    if (!allowed.includes(currentScope)) {
                      logger.log(
                        `[Filter] ❌ Filtered: ${chunk.commit.short} (scope "${currentScope}")`
                      );
                      return callback();
                    }
                  }

                  this.push(chunk);
                  callback();
                },
              })
            );
          };
        });
  },
};