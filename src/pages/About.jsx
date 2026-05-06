export default function About() {
  return (
    <div className="prose prose-slate max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">About Inter Vertebra</h1>

      <p className="mt-3 text-sm text-slate-700">
        Inter Vertebra is a small, single-page web app for tracking adherence
        to the <strong>Enhanced Recovery After Surgery (ERAS)</strong> protocol
        for lumbar fusion surgery. It is designed for use as an audit and
        research tool by a small team of orthopaedic surgeons.
      </p>

      <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Source of the 22-item bundle
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        The default checklist is drawn from the ERAS Society lumbar fusion
        consensus statement:
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <em>
          Debono B, Wainwright TW, Wang MY, et al. Consensus statement for
          perioperative care in lumbar spinal fusion: Enhanced Recovery After
          Surgery (ERAS) Society recommendations. The Spine Journal.
          2021;21(5):729–752.
        </em>
      </p>
      <p className="mt-1 text-sm text-slate-700">
        Items can be edited, disabled, reordered, or extended in the Settings
        page so the bundle can be adapted to local practice.
      </p>

      <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        How compliance is calculated
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        For each patient and each item, the user marks <strong>Yes</strong>,{' '}
        <strong>No</strong>, <strong>N/A</strong>, or <strong>Pending</strong>.
        The compliance rate is computed as <code>yes / (yes + no)</code>. N/A
        and Pending entries are excluded from the denominator. This means a
        case with many items not yet recorded will have a stable compliance
        rate as more items are filled in, rather than appearing to drop as
        the denominator grows.
      </p>

      <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Privacy and data handling
      </h2>
      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li>
          <strong>All data is stored locally in your browser</strong> using
          IndexedDB. There is no backend, no authentication, no cloud sync,
          and no analytics. Nothing leaves the device.
        </li>
        <li>
          <strong>
            Do not enter any patient-identifiable information.
          </strong>{' '}
          Use a de-identified internal reference number such as{' '}
          <code>ERAS-001</code> in the Case Number field. The form will warn
          you if it detects something resembling a Hong Kong ID number.
        </li>
        <li>
          <strong>Data can be lost</strong> if the browser&apos;s site data is
          cleared, the browser is uninstalled, or you switch to a different
          device or browser profile. Use the <strong>Export JSON backup</strong>{' '}
          option in Settings to take periodic backups.
        </li>
      </ul>

      <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Disclaimer
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        This is an audit and research tool. It is <strong>not</strong> a
        clinical decision support system, not a medical device, and not a
        substitute for clinical judgement. The information presented is only
        as accurate as the data entered. Use it to track adherence to a
        protocol — not to drive care decisions.
      </p>

      <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Built by
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        Gene Leung. Source available on request. v0.1.0 — MVP.
      </p>
    </div>
  );
}
