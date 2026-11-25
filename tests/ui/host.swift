import Cocoa
import WebKit
// A stand-in for questcard's window, for UI tests. It loads a card page in a real WKWebView (the engine the app uses), answers the
// card's messages the way QuestCard.swift does for sizing (compact: the window follows the height the card reports; "layout" full /
// compact; "expand"), waits for the page's robot to set window.__probe.done, and prints one line: RESULT {probe, errs, log, w, h}.
//   host PAGE.html MODE(compact|full) TIMEOUT_SEC [OUT.png]
/// The same mouse handling as QuestCard.swift's CardWebView: the card's header band drags the window, so a click there never reaches the page.
final class TestWebView: WKWebView {
  var dragZone: CGFloat = 0
  var dragY0: CGFloat = 0
  var dragX: ClosedRange<CGFloat> = 0...CGFloat.greatestFiniteMagnitude
  var swallowed = 0
  override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
  override func mouseDown(with event: NSEvent) {
    let p = convert(event.locationInWindow, from: nil)
    let fromTop = isFlipped ? p.y : bounds.height - p.y
    if dragZone > 0, fromTop >= dragY0, fromTop < dragZone, dragX.contains(p.x), let window = window {
      swallowed += 1
      window.performDrag(with: event)   // returns on mouse-up, like the app
      return
    }
    super.mouseDown(with: event)
  }
}

final class Host: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
  var wv: TestWebView!
  let win: NSWindow
  var compact: Bool, width: CGFloat = 440, cardH: CGFloat = 420
  let screenW: CGFloat = 1440, screenH: CGFloat = 900
  var log: [[String: Any]] = []
  let t0 = Date(), timeout: Double, png: String?
  init(_ html: URL, _ compact: Bool, _ timeout: Double, _ png: String?) {
    self.compact = compact; self.timeout = timeout; self.png = png
    win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: screenW, height: screenH), styleMask: [.borderless], backing: .buffered, defer: false)
    super.init()
    let cfg = WKWebViewConfiguration()
    cfg.userContentController.add(self, name: "ql")
    cfg.userContentController.addUserScript(WKUserScript(source: "window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message+' @'+(e.filename||'').split('/').pop()+':'+e.lineno+':'+e.colno+' '+((e.error&&e.error.stack)||'').split('\\n').slice(0,3).join(' | ')),true);window.addEventListener('unhandledrejection',e=>window.__errs.push('rej '+e.reason));const ce=console.error;console.error=(...a)=>{window.__errs.push('console '+a.join(' '));ce(...a)};", injectionTime: .atDocumentStart, forMainFrameOnly: true))
    wv = TestWebView(frame: .zero, configuration: cfg)
    wv.navigationDelegate = self
    let v = NSView(frame: NSRect(x: 0, y: 0, width: screenW, height: screenH))
    v.addSubview(wv); win.contentView = v
    win.acceptsMouseMovedEvents = true
    win.alphaValue = 0.01; win.ignoresMouseEvents = true; win.level = .floating; win.orderFrontRegardless()
    place()
    wv.loadFileURL(html, allowingReadAccessTo: URL(fileURLWithPath: "/"))
  }
  func place() {
    let w = compact ? width : screenW, h = compact ? min(max(cardH, 120), screenH - 40) : screenH
    wv.frame = NSRect(x: compact ? screenW - w : 0, y: screenH - h, width: w, height: h)
  }
  func nativeClick(_ x: CGFloat, _ y: CGFloat) {
    let pt = NSPoint(x: wv.frame.minX + x, y: wv.frame.minY + (wv.frame.height - y))
    let n = win.windowNumber, t = ProcessInfo.processInfo.systemUptime
    func ev(_ type: NSEvent.EventType, _ pressure: Float) -> NSEvent {
      return NSEvent.mouseEvent(with: type, location: pt, modifierFlags: [], timestamp: t, windowNumber: n, context: nil, eventNumber: 0, clickCount: 1, pressure: pressure)!
    }
    win.sendEvent(ev(.mouseMoved, 0))
    NSApp.postEvent(ev(.leftMouseUp, 0), atStart: false)   // queued before the press: a window drag waits for the mouse-up, and a normal click gets it right after the press
    win.sendEvent(ev(.leftMouseDown, 1))
    wv.evaluateJavaScript("window.__swallowed=\(wv.swallowed)", completionHandler: nil)   // how many clicks the window-drag band has taken so far
  }

  func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
    guard let b = m.body as? [String: Any], let a = b["action"] as? String else { return }
    var e = b; e["t"] = Int(Date().timeIntervalSince(t0) * 1000); log.append(e)
    switch a {
    case "ready", "resize": if let h = (b["height"] as? NSNumber)?.doubleValue { cardH = CGFloat(h); place() }
    case "layout": if let md = b["mode"] as? String { compact = md == "compact"; place() }
    case "expand": if let w = (b["width"] as? NSNumber)?.doubleValue { width = min(max(CGFloat(w), 440), 960); place() }
    case "dragzone":
      wv.dragZone = CGFloat((b["height"] as? NSNumber)?.doubleValue ?? 0)
      wv.dragY0 = CGFloat((b["y0"] as? NSNumber)?.doubleValue ?? 0)
      if let x0 = (b["x0"] as? NSNumber)?.doubleValue, let x1 = (b["x1"] as? NSNumber)?.doubleValue, x1 > x0 { wv.dragX = CGFloat(x0)...CGFloat(x1) }
    case "__click":   // a real click: native mouse events through the window, like a hand (x, y in page pixels from the top left)
      if let x = (b["x"] as? NSNumber)?.doubleValue, let y = (b["y"] as? NSNumber)?.doubleValue { nativeClick(CGFloat(x), CGFloat(y)) }
    default: break
    }
    if let d = try? JSONSerialization.data(withJSONObject: e), let s = String(data: d, encoding: .utf8) {
      wv.evaluateJavaScript("(window.__hostLog=window.__hostLog||[]).push(\(s))", completionHandler: nil)
    }
  }
  func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
    Timer.scheduledTimer(withTimeInterval: 0.3, repeats: true) { t in
      w.evaluateJavaScript("JSON.stringify({done: !!(window.__probe && window.__probe.done), probe: window.__probe || null, errs: window.__errs || []})") { r, _ in
        let over = Date().timeIntervalSince(self.t0) > self.timeout
        guard let s = r as? String, let d = s.data(using: .utf8), var o = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] else { if over { print("RESULT {\"timeout\":true}"); exit(2) }; return }
        if (o["done"] as? Bool) == true || over {
          t.invalidate()
          o["log"] = self.log; o["w"] = Int(self.wv.frame.width); o["h"] = Int(self.wv.frame.height); o["swallowed"] = self.wv.swallowed; o["timedOut"] = over
          let finish = {
            if let d = try? JSONSerialization.data(withJSONObject: o), let s = String(data: d, encoding: .utf8) { print("RESULT " + s) }
            exit(0)
          }
          if let p = self.png, p != "-" {
            w.takeSnapshot(with: WKSnapshotConfiguration()) { img, _ in
              if let img = img, let t = img.tiffRepresentation, let r = NSBitmapImageRep(data: t), let png = r.representation(using: .png, properties: [:]) { try? png.write(to: URL(fileURLWithPath: p)) }
              finish()
            }
          } else { finish() }
        }
      }
    }
  }
}
let a = CommandLine.arguments
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let host = Host(URL(fileURLWithPath: a[1]), a[2] == "compact", Double(a[3]) ?? 20, a.count > 4 ? a[4] : nil)
DispatchQueue.main.asyncAfter(deadline: .now() + (Double(a[3]) ?? 20) + 8) { print("RESULT {\"hardTimeout\":true}"); exit(3) }
app.run()
