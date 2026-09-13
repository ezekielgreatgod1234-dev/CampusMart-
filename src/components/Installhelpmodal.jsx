import { FiDownload, FiShare, FiMoreVertical, FiPlusSquare, FiX } from "react-icons/fi";

/* =========================================================
   INSTALL HELP MODAL

   Shown instead of a native install prompt when the browser
   hasn't exposed a `beforeinstallprompt` event (common on
   localhost, iOS Safari, or browsers that don't support it).
   Walks the user through adding CampusMart to their device
   manually, styled to match the rest of the app.
========================================================= */

const InstallStep = ({ number, icon: Icon, children }) => (
  <div className="flex items-start gap-3">
    <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-xs font-bold">
      {number}
    </div>

    <div className="flex items-center gap-2 pt-0.5">
      {Icon && <Icon className="text-green-600 shrink-0" size={15} />}
      <p className="text-sm leading-6 text-gray-600">{children}</p>
    </div>
  </div>
);

const InstallHelpModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-gray-100 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <FiDownload size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Install CampusMart
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Add the app to your home screen for quick access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition shrink-0"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* ANDROID / CHROME / EDGE */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Android · Chrome · Edge
            </p>

            <div className="space-y-3">
              <InstallStep number="1" icon={FiMoreVertical}>
                Tap the <span className="font-semibold text-gray-800">menu icon</span> (⋮) in the top-right corner of your browser.
              </InstallStep>

              <InstallStep number="2" icon={FiPlusSquare}>
                Select the desktop screen and then tap<span className="font-semibold text-gray-800">"Install app"</span> or <span className="font-semibold text-gray-800">"Add to Home screen"</span>.
              </InstallStep>

              <InstallStep number="3" icon={FiDownload}>
                Confirm, and CampusMart will appear on your home screen like any other app.
              </InstallStep>
            </div>
          </div>

          {/* iOS / SAFARI */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              iPhone · iPad (Safari)
            </p>

            <div className="space-y-3">
              <InstallStep number="1" icon={FiShare}>
                Tap the <span className="font-semibold text-gray-800">Share</span> icon in the bottom toolbar.
              </InstallStep>

              <InstallStep number="2" icon={FiPlusSquare}>
                Scroll down and select <span className="font-semibold text-gray-800">"Add to Home Screen"</span>.
              </InstallStep>

              <InstallStep number="3" icon={FiDownload}>
                Tap <span className="font-semibold text-gray-800">"Add"</span> in the top-right corner to finish.
              </InstallStep>
            </div>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs leading-5 text-green-700">
              Once installed, CampusMart opens in its own window without browser
              tabs or address bars — just like a native app.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallHelpModal;