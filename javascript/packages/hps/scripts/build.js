/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const { spawn } = require("node:child_process");
const semver = require("semver");
const { engines } = require("../package.json");
const versionValid = semver.satisfies(process.version, engines.node);

function watchError(child) {
    child.on("error", (error) => {
      console.error(error);
      process.exit(1);
    });
    child.on("exit", (code, signal) => {
      if (code !== 0) {
        process.exit(code);
      }
    });
}

// The native addon is optional: index.ts falls back to the pure JS path when it
// is absent. A missing build toolchain must not fail the consumer's install.
function watchOptional(child) {
    child.on("error", () => {
      console.warn("hps: native addon build skipped, using the JavaScript fallback");
    });
    child.on("exit", (code) => {
      if (code !== 0) {
        console.warn("hps: native addon build failed, using the JavaScript fallback");
      }
    });
}

if (versionValid) {
  const gyp = spawn("npx", ["node-gyp", "rebuild"], { stdio: 'inherit', shell: true });
  watchOptional(gyp);
}

// The install lifecycle only compiles the addon: published tarballs already
// carry dist/, and typescript is not a dependency of this package.
if (!process.argv.includes("--native-only")) {
  watchError(spawn("npx", ["tsc"], { stdio: 'inherit', shell: true }));
}
