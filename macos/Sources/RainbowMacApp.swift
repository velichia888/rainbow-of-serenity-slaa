import SwiftUI
import AppKit
import WebKit

// Rainbow for macOS: native SwiftUI navigation, Mac menus and one persistent WebKit
// data store. Private entries remain local to this Mac and are NOT synced with iOS.
private enum RecoveryPage: String, CaseIterable, Identifiable {
    case home, checkin, affirmations, readings, meetings, community

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "My Recovery"
        case .checkin: return "Daily Check-In"
        case .affirmations: return "Affirmations"
        case .readings: return "Readings"
        case .meetings: return "Meetings"
        case .community: return "Community"
        }
    }

    var symbol: String {
        switch self {
        case .home: return "house"
        case .checkin: return "square.and.pencil"
        case .affirmations: return "heart.text.square"
        case .readings: return "book.closed"
        case .meetings: return "calendar"
        case .community: return "person.3"
        }
    }

    // Fixed allowlist; navigation code never evaluates user-generated JavaScript.
    var panelID: String {
        switch self {
        case .home: return "panel-counter"
        case .checkin: return "panel-checkin"
        case .affirmations: return "panel-affirm"
        case .readings: return "panel-meditate"
        case .meetings: return "panel-meeting"
        case .community: return "panel-community"
        }
    }

    var shortcut: KeyEquivalent {
        switch self {
        case .home: return "1"
        case .checkin: return "2"
        case .affirmations: return "3"
        case .readings: return "4"
        case .meetings: return "5"
        case .community: return "6"
        }
    }
}

@MainActor
private final class RecoveryWindow: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    @Published var selected: RecoveryPage = .home
    @Published var problem: String?

    let webView: WKWebView
    private let webRoot: URL?
    private var didStart = false
    private var isReady = false
    private var requestedPage: RecoveryPage = .home

    override init() {
        let root = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true)
        webRoot = root

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()  // persistent storage on this Mac
        config.preferences.javaScriptCanOpenWindowsAutomatically = false

        let desktopStyle = #"""
        (function () {
          var node = document.createElement('style');
          node.textContent = [
            'body.has-tabbar { padding-bottom: 22px !important; }',
            'body.has-tabbar nav.tabbar { display: none !important; }',
            'body.has-tabbar .app-header { display: none !important; }',
            'body.has-tabbar main { max-width: 880px !important; padding: 32px 36px 70px !important; }',
            'body.has-tabbar .ros-home-actions { grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); }',
            'body.has-tabbar .quick-exit { bottom: 16px !important; }',
            'body.has-tabbar textarea { min-height: 76px; }'
          ].join('\\n');
          (document.head || document.documentElement).appendChild(node);
        })();
        """#
        config.userContentController.addUserScript(WKUserScript(
            source: desktopStyle, injectionTime: .atDocumentEnd, forMainFrameOnly: true
        ))

        webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = true
        super.init()
        webView.navigationDelegate = self
        webView.uiDelegate = self
    }

    func start() {
        guard !didStart else { return }
        didStart = true
        guard let webRoot else {
            problem = "Rainbow's bundled recovery pages could not be located."
            return
        }
        let home = webRoot.appendingPathComponent("index.html")
        guard FileManager.default.fileExists(atPath: home.path) else {
            problem = "The recovery dashboard is missing from this Mac build."
            return
        }
        webView.loadFileURL(home, allowingReadAccessTo: webRoot)
    }

    func show(_ page: RecoveryPage) {
        selected = page
        requestedPage = page
        guard isReady else { return }

        if webView.url?.lastPathComponent != "index.html" {
            isReady = false
            if let webRoot {
                webView.loadFileURL(webRoot.appendingPathComponent("index.html"), allowingReadAccessTo: webRoot)
            }
            return
        }

        let js = "document.querySelector('.tab-btn[data-panel=\\"" + page.panelID + "\\"]')?.click();"
        webView.evaluateJavaScript(js) { [weak self] _, error in
            if let error { self?.problem = "Unable to open that recovery section: \\(error.localizedDescription)" }
        }
    }

    func quickExit() {
        NSApp.hide(nil)
        if let url = URL(string: "https://weather.com/") { NSWorkspace.shared.open(url) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        problem = nil
        isReady = webView.url?.lastPathComponent == "index.html"
        if isReady { show(requestedPage) }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        problem = "A recovery page could not load: \\(error.localizedDescription)"
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        problem = "A recovery page could not open: \\(error.localizedDescription)"
    }

    private func openOutside(_ url: URL) {
        guard ["https", "http", "mailto"].contains(url.scheme?.lowercased() ?? "") else { return }
        NSWorkspace.shared.open(url)
    }

    // Keep the embedded app on its bundled local files. Zoom, external resources
    // and mail links use the user's preferred Mac apps/browser instead.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else {
            decisionHandler(.cancel)
            return
        }
        if url.isFileURL {
            guard let webRoot else { decisionHandler(.cancel); return }
            let candidate = url.standardizedFileURL.resolvingSymlinksInPath()
            let directory = webRoot.standardizedFileURL.resolvingSymlinksInPath().path + "/"
            guard candidate.path.hasPrefix(directory) else { decisionHandler(.cancel); return }
            if ["ics", "pdf"].contains(candidate.pathExtension.lowercased()) {
                NSWorkspace.shared.open(candidate)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
            return
        }
        if action.navigationType == .linkActivated || action.targetFrame == nil {
            openOutside(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if url.isFileURL { webView.loadFileURL(url, allowingReadAccessTo: webRoot ?? url) }
            else { openOutside(url) }
        }
        return nil
    }

    // Needed by the existing recovery-plan deletion confirmation.
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "Rainbow of Serenity"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Confirm")
        alert.addButton(withTitle: "Cancel")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = "Rainbow of Serenity"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.runModal()
        completionHandler()
    }
}

private struct EmbeddedRecoveryView: NSViewRepresentable {
    @ObservedObject var model: RecoveryWindow

    func makeNSView(context: Context) -> WKWebView {
        model.start()
        return model.webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}

private struct RecoveryDesktopView: View {
    @ObservedObject var model: RecoveryWindow

    var body: some View {
        NavigationSplitView {
            List(RecoveryPage.allCases, selection: $model.selected) { page in
                Label(page.title, systemImage: page.symbol)
                    .tag(page)
            }
            .listStyle(.sidebar)
            .navigationTitle("Rainbow of Serenity")
            .frame(minWidth: 205)
        } detail: {
            VStack(spacing: 0) {
                if let problem = model.problem {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle")
                        Text(problem)
                        Spacer()
                        Button("Reload") { model.webView.reload() }
                    }
                    .padding(10)
                    .foregroundStyle(.red)
                }
                EmbeddedRecoveryView(model: model)
            }
            .navigationTitle(model.selected.title)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: model.quickExit) {
                        Label("Quick Exit", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                    .help("Hide Rainbow and open a neutral website")
                }
            }
        }
        .onChange(of: model.selected) { newValue in model.show(newValue) }
        .frame(minWidth: 940, minHeight: 640)
    }
}

@main
private struct RainbowOfSerenityMac: App {
    @StateObject private var model = RecoveryWindow()

    var body: some Scene {
        WindowGroup("Rainbow of Serenity") {
            RecoveryDesktopView(model: model)
        }
        .defaultSize(width: 1080, height: 740)
        .commands {
            CommandMenu("Recovery") {
                ForEach(RecoveryPage.allCases) { page in
                    Button(page.title) { model.show(page) }
                        .keyboardShortcut(page.shortcut, modifiers: .command)
                }
                Divider()
                Button("Quick Exit") { model.quickExit() }
                    .keyboardShortcut("x", modifiers: [.command, .shift])
            }
        }
    }
}
