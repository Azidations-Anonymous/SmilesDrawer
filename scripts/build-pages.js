#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const playgroundSourceDir = path.join(rootDir, 'example', 'smilesdrawer.surge.sh');
const pagesDir = path.join(rootDir, 'pages');
const playgroundTargetDir = path.join(pagesDir, 'playground');
const docsOutputDir = path.join(pagesDir, 'docs');
const distDir = path.join(rootDir, 'dist');
const distBundle = path.join(distDir, 'smiles-drawer.js');
const distBundleMin = path.join(distDir, 'smiles-drawer.min.js');
const distBundleMap = path.join(distDir, 'smiles-drawer.min.js.map');

async function pathExists(targetPath) {
    try {
        await fs.promises.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function emptyDir(targetPath) {
    await fs.promises.rm(targetPath, { recursive: true, force: true });
    await fs.promises.mkdir(targetPath, { recursive: true });
}

async function copyRecursive(src, dest) {
    const stats = await fs.promises.stat(src);

    if (stats.isDirectory()) {
        await fs.promises.mkdir(dest, { recursive: true });
        const entries = await fs.promises.readdir(src);

        for (const entry of entries) {
            const from = path.join(src, entry);
            const to = path.join(dest, entry);
            await copyRecursive(from, to);
        }

        return;
    }

    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(src, dest);
}

function runCommand(command, args, options = {}) {
    const spawnOptions = {
        cwd: rootDir,
        stdio: 'inherit',
        ...options,
    };

    if (options.env) {
        spawnOptions.env = { ...process.env, ...options.env };
    } else {
        spawnOptions.env = process.env;
    }

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, spawnOptions);

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
                return;
            }

            resolve();
        });
    });
}

function buildLandingPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SmilesDrawer Playground & Docs</title>
    <style>
        :root {
            color-scheme: light dark;
            font-family: "Segoe UI", Helvetica, Arial, sans-serif;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #0f172a;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #111827 70%, #020617 100%);
            color: #f8fafc;
        }

        main {
            width: min(90vw, 640px);
            background: rgba(15, 23, 42, 0.9);
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: 0 20px 50px rgba(2, 6, 23, 0.6);
            text-align: center;
        }

        h1 {
            margin-top: 0;
            font-size: clamp(2rem, 3vw, 2.75rem);
        }

        p {
            line-height: 1.6;
            color: rgba(248, 250, 252, 0.85);
            margin-bottom: 2rem;
        }

        .links {
            display: grid;
            gap: 1.25rem;
        }

        a {
            display: block;
            padding: 1rem 1.25rem;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 600;
            letter-spacing: 0.03em;
            background: rgba(248, 250, 252, 0.15);
            border: 1px solid rgba(248, 250, 252, 0.25);
            color: #f8fafc;
            transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        a:hover,
        a:focus-visible {
            transform: translateY(-2px);
            background: rgba(248, 250, 252, 0.25);
            border-color: #fbbf24;
        }
    </style>
</head>
<body>
    <main>
        <h1>SmilesDrawer Playground</h1>
        <p>
            Explore the interactive SMILES playground or dive into the API documentation.
            This bundle is ready to deploy directly to GitHub Pages.
        </p>
        <div class="links">
            <a href="./playground/index.html">Interactive Playground</a>
            <a href="./docs/index.html">API Documentation</a>
        </div>
    </main>
</body>
</html>`;
}

async function main() {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    console.log('Building distribution bundle via gulp build …');
    await runCommand(npxCmd, ['gulp', 'build']);

    await emptyDir(pagesDir);

    console.log('Building documentation via gulp doc …');
    await runCommand(npxCmd, ['gulp', 'doc'], {
        env: {
            JSDOC_DEST: docsOutputDir,
        },
    });
    console.log('Docs generated in %s', docsOutputDir);

    console.log('Copying playground assets …');
    await fs.promises.mkdir(playgroundTargetDir, { recursive: true });
    await copyRecursive(path.join(playgroundSourceDir, 'playground.html'), path.join(playgroundTargetDir, 'index.html'));
    await copyRecursive(distBundle, path.join(playgroundTargetDir, 'smiles-drawer.js'));

    if (await pathExists(distBundleMin)) {
        await copyRecursive(distBundleMin, path.join(playgroundTargetDir, 'smiles-drawer.min.js'));
    }

    if (await pathExists(distBundleMap)) {
        await copyRecursive(distBundleMap, path.join(playgroundTargetDir, 'smiles-drawer.min.js.map'));
    }

    console.log('Writing landing page …');
    await fs.promises.writeFile(path.join(pagesDir, 'index.html'), buildLandingPage(), 'utf8');

    console.log('GitHub Pages bundle ready in %s', pagesDir);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
