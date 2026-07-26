const appId = process.env.APP_ID || "com.example.electronTemplate";
const productName = process.env.APP_NAME || "Electron Template";
const channel = process.env.RELEASE_CHANNEL || "latest";
const macSigningEnabled = process.env.MAC_SIGN === "true";

function resolvePublish() {
  const provider = process.env.UPDATE_PROVIDER || "generic";

  if (provider === "none") {
    return null;
  }

  if (provider === "github") {
    const slug = process.env.UPDATE_REPOSITORY || process.env.GITHUB_REPOSITORY;
    if (!slug) return null;
    const [owner, repo] = slug.split("/");
    if (!owner || !repo) return null;
    return [
      {
        provider: "github",
        owner,
        repo,
        releaseType: channel === "latest" ? "release" : "prerelease",
        ...(channel === "latest" ? {} : { channel })
      }
    ];
  }

  const url = process.env.UPDATE_URL;
  if (!url) {
    return null;
  }

  return [
    {
      provider: "generic",
      url,
      ...(channel === "latest" ? {} : { channel })
    }
  ];
}

module.exports = {
  appId,
  productName,
  artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
  asar: true,
  icon: "build/icon",
  directories: {
    output: "release",
    buildResources: "build"
  },
  files: [
    "package.json",
    "node_modules/**/*",
    "apps/desktop/dist/**/*",
    "apps/local-backend/dist/**/*",
    "apps/renderer/dist/**/*"
  ],
  extraResources: [
    {
      from: "build/icon.ico",
      to: "icon.ico"
    },
    {
      from: "build/icon.png",
      to: "icon.png"
    }
  ],
  extraMetadata: {
    main: "apps/desktop/dist/main.cjs"
  },
  publish: resolvePublish(),
  mac: {
    target: ["dmg", "zip"],
    category: "public.app-category.productivity",
    ...(macSigningEnabled ? {} : { identity: null })
  },
  win: {
    icon: "build/icon.ico",
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ]
  },
  linux: {
    icon: "build/icon.png",
    target: ["AppImage"],
    category: "Utility"
  },
  nsis: {
    installerIcon: "build/icon.ico",
    uninstallerIcon: "build/icon.ico",
    installerHeaderIcon: "build/icon.ico",
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    deleteAppDataOnUninstall: true,
    runAfterFinish: true
  }
};
