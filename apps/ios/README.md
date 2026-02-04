# iOS Messages Extension

1) Create a new iOS App in Xcode and check **Include Messages Extension**.
2) Replace the extension target’s `MessagesViewController.swift` with the file in this folder.
3) Set the backend URL in `fetchSuggestions`.
4) Build + run on device/simulator.

Notes:
- The extension can only read the **current conversation**.
- Messages extensions are more stable in UIKit than SwiftUI.
