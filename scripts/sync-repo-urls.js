const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");

const TARGET_FILES = {
  readme: path.join(ROOT_DIR, "README.md"),
  packageJson: path.join(ROOT_DIR, "package.json"),
  playground: path.join(
    ROOT_DIR,
    "example/smilesdrawer.surge.sh/playground.html"
  )
};

// Matches any previous owner for this repo name
const PAGES_URL_RE = /https:\/\/[\w-]+\.github\.io\/SmilesDrawer/g;
const REPO_URL_RE = /https:\/\/github\.com\/[\w-]+\/SmilesDrawer/g;

function parseRemoteUrl() {
  var raw;
  try {
    raw = execSync("git remote get-url origin", {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }).trim();
  } catch (err) {
    throw new Error("Could not read git remote origin: " + err.message);
  }

  // SSH: git@github.com:Owner/Repo.git
  var sshMatch = raw.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // HTTPS: https://github.com/Owner/Repo.git
  var httpsMatch = raw.match(
    /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?$/
  );
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  throw new Error("Could not parse owner/repo from remote URL: " + raw);
}

function syncRepoUrls() {
  var info = parseRemoteUrl();
  var pagesUrl = "https://" + info.owner.toLowerCase() + ".github.io/" + info.repo;
  var repoUrl = "https://github.com/" + info.owner + "/" + info.repo;

  var anyChanged = false;

  // README.md
  if (fs.existsSync(TARGET_FILES.readme)) {
    var readme = fs.readFileSync(TARGET_FILES.readme, "utf8");
    var updatedReadme = readme
      .replace(PAGES_URL_RE, pagesUrl)
      .replace(REPO_URL_RE, repoUrl);
    if (updatedReadme !== readme) {
      fs.writeFileSync(TARGET_FILES.readme, updatedReadme);
      anyChanged = true;
    }
  }

  // package.json — update repository field
  if (fs.existsSync(TARGET_FILES.packageJson)) {
    var pkgRaw = fs.readFileSync(TARGET_FILES.packageJson, "utf8");
    var pkg = JSON.parse(pkgRaw);
    var expectedRepo = repoUrl + ".git";
    if (pkg.repository !== expectedRepo) {
      pkg.repository = expectedRepo;
      // Preserve trailing newline style of original file
      var newPkgRaw = JSON.stringify(pkg, null, 2) + "\n";
      fs.writeFileSync(TARGET_FILES.packageJson, newPkgRaw);
      anyChanged = true;
    }
  }

  // playground.html
  if (fs.existsSync(TARGET_FILES.playground)) {
    var playground = fs.readFileSync(TARGET_FILES.playground, "utf8");
    var updatedPlayground = playground
      .replace(PAGES_URL_RE, pagesUrl)
      .replace(REPO_URL_RE, repoUrl);
    if (updatedPlayground !== playground) {
      fs.writeFileSync(TARGET_FILES.playground, updatedPlayground);
      anyChanged = true;
    }
  }

  return anyChanged;
}

module.exports = { syncRepoUrls };

if (require.main === module) {
  try {
    var changed = syncRepoUrls();
    if (changed) {
      console.log("Repository URLs updated.");
    } else {
      console.log("Repository URLs already up to date.");
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
