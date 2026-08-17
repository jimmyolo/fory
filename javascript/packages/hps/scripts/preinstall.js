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

const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const version = process.version;
const semver = require("semver");
const { engines } = require("../package.json");
const versionValid = semver.satisfies(process.version, engines.node);

// Downloaded rather than taken from the node headers: v8-fast-api-calls.h is
// not part of the public header set node ships. A failure here is not fatal,
// the addon build then fails and index.ts falls back to the JavaScript path.
function download(url, dist) {
    return new Promise((resolve) => {
        fs.mkdirSync(path.dirname(dist), { recursive: true });
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                console.warn(`hps: download from ${url} failed with status ${res.statusCode}`);
                return resolve();
            }
            const file = fs.createWriteStream(dist);
            res.pipe(file);
            file.on("finish", () => file.close(() => resolve()));
            file.on("error", (error) => {
                console.warn(`hps: writing ${dist} failed: ${error.message}`);
                resolve();
            });
        }).on("error", (error) => {
            console.warn(`hps: download from ${url} failed: ${error.message}`);
            resolve();
        });
    });
}

async function downloadDeps(urls) {
    await Promise.all(urls.map(({ url, dist }) => download(url, dist)));
}

async function main() {
    await downloadDeps([
        {
            url: `https://raw.githubusercontent.com/nodejs/node/refs/tags/${version}/deps/v8/include/v8-fast-api-calls.h`,
            dist: path.join(__dirname, "..", "includes/v8-fast-api-calls.h")
        }
    ]);
}

if (versionValid) {
    main();
}
