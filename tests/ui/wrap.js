/* runs first in the page: callbacks given to MutationObserver, requestAnimationFrame, setTimeout and addEventListener are wrapped so that an error
   inside one is recorded with its real stack (WebKit reports such errors to window.onerror as a bare "Script error.") */
(function () {
  const E = window.__cbErrs = [];
  const wrap = (f) => typeof f !== "function" ? f : function () { try { return f.apply(this, arguments); } catch (e) { E.push(String((e && e.stack) || e).split("\n").slice(0, 4).join(" | ")); throw e; } };
  const MO = window.MutationObserver; window.MutationObserver = function (cb) { return new MO(wrap(cb)); }; window.MutationObserver.prototype = MO.prototype;
  if (window.ResizeObserver) { const RO = window.ResizeObserver; window.ResizeObserver = function (cb) { return new RO(wrap(cb)); }; window.ResizeObserver.prototype = RO.prototype; }
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => raf(wrap(cb));
  const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener, M = new WeakMap();
  EventTarget.prototype.addEventListener = function (t, l, o) { if (typeof l !== "function") return add.call(this, t, l, o); let w = M.get(l); if (!w) { w = wrap(l); M.set(l, w); } return add.call(this, t, w, o); };
  EventTarget.prototype.removeEventListener = function (t, l, o) { return rem.call(this, t, (typeof l === "function" && M.get(l)) || l, o); };
  const st = window.setTimeout.bind(window); window.setTimeout = (cb, ...r) => st(wrap(cb), ...r);
})();
