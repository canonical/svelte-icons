# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
Contributor guidance: use the standard sections (Added, Changed, Fixed, ...) only for changes that affect consumers of the published package, e.g.:
  - icons added, removed, or renamed (after bumping @canonical/ds-assets)
  - changes to component props, exports, types, or rendering
  - peer dependency changes (e.g. supported Svelte versions)

List internal changes (build scripts, metadata.json, Storybook, CI, dev dependencies) under a trailing "Internal" section.

When @canonical/ds-assets is changed, note the version used under the release heading, e.g.:
  Icons sourced from `@canonical/ds-assets@0.10.0-experimental.8`.
-->

## [Unreleased]

## [0.1.0] - 2026-10-23

Icons sourced from `@canonical/ds-assets@0.44.1`.

### Added

- Icons:
  - `ChartIcon`
  - `ClipboardChartIcon`
  - `ClipboardIcon`
  - `ClipboardListIcon`
  - `CollapseSideNavIcon`
  - `CutIcon`
  - `DarkThemeIcon`
  - `DevtoolsIcon`
  - `DevtoolsOffIcon`
  - `ExpandSideNavIcon`
  - `FitToScreenIcon`
  - `ImageRegistriesIcon`
  - `KeyboardIcon`
  - `KeyboardOffIcon`
  - `LayoutGridIcon`
  - `LightThemeIcon`
  - `MaximizeIcon`
  - `MinimizeIcon`
  - `PasteIcon`
  - `ResizeIcon`
  - `ResizeOffIcon`
  - `RotateLeftIcon`
  - `RotateRightIcon`
  - `ScreenRecordIcon`
  - `ScreenshotIcon`
  - `StopFillIcon`
  - `SwapIcon`
  - `SystemThemeIcon`
  - `TableIcon`
  - `VolumeDownIcon`
  - `VolumeMuteIcon`
  - `VolumeUpIcon`

### Changed

- Icons no longer render a redundant nested `<svg>` element inside their `<symbol>`, reducing markup size.
- Icons:
  - `CopyIcon`
  - `FullscreenIcon`
  - `InProgressIcon`
  - `StopIcon`

### Removed

- **BREAKING:** Icons:
  - `ToggleSideNavIcon` (use `CollapseSideNavIcon` or `ExpandSideNavIcon` instead)

### Internal

- After successful npm publishing, create a `v<version>` tag and GitHub release linking to the changelog at the published commit.
- Generate icon metadata from rendered icon images, using any OpenAI-compatible Chat Completions endpoint (OpenRouter by default, or a custom `--base-url` such as Ollama or llama.cpp).
- Regenerate tags for all icons in `metadata.json`.
- Store SVG hashes in `metadata.json` so only new or changed icons are re-tagged; drop filenames and stale entries.
- Add a `check:metadata` script, run by `bun run check` and CI, which fails when `metadata.json` is out of sync with `@canonical/ds-assets`.
- Bump `@canonical/ds-assets` from `0.10.0-experimental.8` to `0.44.1`.

## [0.0.9] - 2026-01-09

Icons sourced from `@canonical/ds-assets@0.10.0-experimental.8`.

### Added

- Icons (baseline for tracking future additions and removals):
  - `AddCanvasIcon`
  - `AddLogicalVolumeIcon`
  - `AddPartitionIcon`
  - `AnchorIcon`
  - `ApplicationsIcon`
  - `ArchiveIcon`
  - `ArrowBottomLeftIcon`
  - `ArrowBottomRightIcon`
  - `ArrowDownIcon`
  - `ArrowLeftIcon`
  - `ArrowRightIcon`
  - `ArrowTopLeftIcon`
  - `ArrowTopRightIcon`
  - `ArrowUpIcon`
  - `BackToTopIcon`
  - `BlueprintIcon`
  - `BookIcon`
  - `BugIcon`
  - `BundleIcon`
  - `CanvasIcon`
  - `CertificateIcon`
  - `CertificationIcon`
  - `ChangeVersionIcon`
  - `CheckmarkIcon`
  - `ChevronDownIcon`
  - `ChevronLeftIcon`
  - `ChevronRightIcon`
  - `ChevronUpIcon`
  - `CloseIcon`
  - `ClusterHostIcon`
  - `CodeIcon`
  - `CommentsIcon`
  - `ConnectedIcon`
  - `ContainersIcon`
  - `ControllersIcon`
  - `CopyIcon`
  - `CursorIcon`
  - `DebugIcon`
  - `DeleteIcon`
  - `DesktopIcon`
  - `DisconnectedIcon`
  - `DownloadIcon`
  - `DragIcon`
  - `EditIcon`
  - `EmailIcon`
  - `ErrorFillIcon`
  - `ErrorIcon`
  - `ExportIcon`
  - `ExposedIcon`
  - `ExternalLinkIcon`
  - `FacebookIcon`
  - `FileBlankIcon`
  - `FileIcon`
  - `FilterIcon`
  - `FolderIcon`
  - `ForkIcon`
  - `FullscreenIcon`
  - `GiftIcon`
  - `GithubIcon`
  - `HelpIcon`
  - `HideIcon`
  - `HighlightOffIcon`
  - `HighlightOnIcon`
  - `HomeIcon`
  - `ImageIcon`
  - `ImportIcon`
  - `InProgressIcon`
  - `InformationIcon`
  - `InstagramIcon`
  - `IsoIcon`
  - `LinkIcon`
  - `LinkedinIcon`
  - `LocationIcon`
  - `LockedIcon`
  - `LogOutIcon`
  - `MachinesIcon`
  - `MapIcon`
  - `MenuContextualIcon`
  - `MenuIcon`
  - `MinusIcon`
  - `ModelsIcon`
  - `MountIcon`
  - `NotificationsIcon`
  - `NotificationsOffIcon`
  - `OpenTerminalIcon`
  - `PauseIcon`
  - `PinIcon`
  - `PlansIcon`
  - `PlayFillIcon`
  - `PlayIcon`
  - `PlayPendingIcon`
  - `PlusIcon`
  - `PodsIcon`
  - `PowerOffIcon`
  - `PowerOnIcon`
  - `PriorityCriticalIcon`
  - `PriorityHighIcon`
  - `PriorityLowIcon`
  - `PriorityMediumIcon`
  - `PriorityNegligibleIcon`
  - `PriorityUnknownIcon`
  - `PrivateKeyIcon`
  - `ProfilesIcon`
  - `QueuedIcon`
  - `RepositoryIcon`
  - `RestartIcon`
  - `RevisionsIcon`
  - `RssIcon`
  - `SearchIcon`
  - `SecurityErrorIcon`
  - `SecurityIcon`
  - `SecurityTickIcon`
  - `SecurityWarningIcon`
  - `SelectAddIcon`
  - `SelectIcon`
  - `SelectRemoveIcon`
  - `SettingsIcon`
  - `ShareIcon`
  - `ShowIcon`
  - `SingleHostIcon`
  - `SnapshotIcon`
  - `SnoozeIcon`
  - `SpinnerIcon`
  - `StarredIcon`
  - `StarredOffIcon`
  - `StatisticsIcon`
  - `StatusIcon`
  - `StopIcon`
  - `SuccessFillIcon`
  - `SuccessIcon`
  - `SwitcherDashboardIcon`
  - `SwitcherEnvironmentsIcon`
  - `SwitcherIcon`
  - `TagIcon`
  - `ThumbsDownIcon`
  - `ThumbsUpIcon`
  - `TidyIcon`
  - `TimedOutIcon`
  - `ToggleSideNavIcon`
  - `UnitsIcon`
  - `UnlockedIcon`
  - `UnmountIcon`
  - `UploadIcon`
  - `UsbIcon`
  - `UserGroupIcon`
  - `UserIcon`
  - `UserProfileIcon`
  - `WaitingIcon`
  - `WarningFillIcon`
  - `WarningIcon`
  - `WebsiteIcon`
  - `XIcon`
  - `YoutubeIcon`

[Unreleased]: https://github.com/canonical/svelte-icons/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/canonical/svelte-icons/compare/ad699f7...v0.1.0
[0.0.9]: https://github.com/canonical/svelte-icons/commit/ad699f7
