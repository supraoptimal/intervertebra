// 22-item ERAS bundle for lumbar fusion surgery.
//
// Source: ERAS Society lumbar fusion consensus
//   Debono B, Wainwright TW, Wang MY, et al.
//   "Consensus statement for perioperative care in lumbar spinal fusion:
//    Enhanced Recovery After Surgery (ERAS) Society recommendations."
//   The Spine Journal. 2021;21(5):729-752.
//
// Each item has a stable `id` (slug) so disabling and re-enabling preserves
// historical compliance entries that reference the id.

export const SEED_ERAS_ITEMS = [
  // ───────────────────────── PREOPERATIVE ─────────────────────────
  {
    id: 'preop-education',
    phase: 'preoperative',
    shortLabel: 'Patient education',
    description:
      'Structured patient education and expectation-setting prior to admission.',
    evidenceLevel: 'strong',
  },
  {
    id: 'preop-smoking-cessation',
    phase: 'preoperative',
    shortLabel: 'Smoking cessation',
    description:
      'Smoking cessation counselling, ideally ≥4 weeks pre-op where feasible.',
    evidenceLevel: 'strong',
  },
  {
    id: 'preop-alcohol-cessation',
    phase: 'preoperative',
    shortLabel: 'Alcohol cessation',
    description: 'Alcohol cessation counselling for at-risk drinkers.',
    evidenceLevel: 'moderate',
  },
  {
    id: 'preop-nutrition',
    phase: 'preoperative',
    shortLabel: 'Nutritional optimisation',
    description: 'Nutritional screening and correction of deficits pre-op.',
    evidenceLevel: 'moderate',
  },
  {
    id: 'preop-anaemia',
    phase: 'preoperative',
    shortLabel: 'Anaemia screening',
    description: 'Anaemia screening and correction prior to surgery.',
    evidenceLevel: 'strong',
  },
  {
    id: 'preop-glycaemic',
    phase: 'preoperative',
    shortLabel: 'Glycaemic optimisation',
    description: 'Glycaemic optimisation in patients with diabetes.',
    evidenceLevel: 'moderate',
  },
  {
    id: 'preop-prehab',
    phase: 'preoperative',
    shortLabel: 'Prehabilitation',
    description: 'Structured pre-operative exercise programme.',
    evidenceLevel: 'moderate',
  },
  {
    id: 'preop-psych',
    phase: 'preoperative',
    shortLabel: 'Psychological screening',
    description:
      'Screening for depression, anxiety, and pain catastrophising pre-op.',
    evidenceLevel: 'moderate',
  },
  {
    id: 'preop-cho-loading',
    phase: 'preoperative',
    shortLabel: 'Carbohydrate loading',
    description: 'Clear carbohydrate drink up to 2h pre-op.',
    evidenceLevel: 'strong',
  },
  {
    id: 'preop-fasting',
    phase: 'preoperative',
    shortLabel: 'Fasting minimisation',
    description: 'Clear fluids permitted up to 2h, solids up to 6h pre-op.',
    evidenceLevel: 'strong',
  },
  {
    id: 'preop-discharge-planning',
    phase: 'preoperative',
    shortLabel: 'Discharge planning',
    description: 'Discharge planning initiated pre-admission.',
    evidenceLevel: 'moderate',
  },

  // ───────────────────────── INTRAOPERATIVE ────────────────────────
  {
    id: 'intra-multimodal-anaesthesia',
    phase: 'intraoperative',
    shortLabel: 'Multimodal anaesthesia',
    description: 'Multimodal opioid-sparing anaesthetic technique.',
    evidenceLevel: 'strong',
  },
  {
    id: 'intra-tranexamic-acid',
    phase: 'intraoperative',
    shortLabel: 'Tranexamic acid',
    description: 'Tranexamic acid administered to reduce blood loss.',
    evidenceLevel: 'strong',
  },
  {
    id: 'intra-normothermia',
    phase: 'intraoperative',
    shortLabel: 'Normothermia',
    description: 'Active warming to maintain perioperative normothermia.',
    evidenceLevel: 'strong',
  },
  {
    id: 'intra-fluid-therapy',
    phase: 'intraoperative',
    shortLabel: 'Goal-directed fluids',
    description: 'Goal-directed intra-operative fluid therapy.',
    evidenceLevel: 'moderate',
  },
  {
    id: 'intra-antibiotic-prophylaxis',
    phase: 'intraoperative',
    shortLabel: 'Antibiotic prophylaxis',
    description: 'Antibiotic prophylaxis with correct timing and redosing.',
    evidenceLevel: 'strong',
  },
  {
    id: 'intra-ponv-prophylaxis',
    phase: 'intraoperative',
    shortLabel: 'PONV prophylaxis',
    description:
      'Multimodal post-operative nausea and vomiting prophylaxis.',
    evidenceLevel: 'strong',
  },
  {
    id: 'intra-avoid-drains-catheter',
    phase: 'intraoperative',
    shortLabel: 'Avoid routine drains/catheter',
    description:
      'Avoidance of routine surgical drains and urinary catheter where feasible.',
    evidenceLevel: 'moderate',
  },

  // ───────────────────────── POSTOPERATIVE ─────────────────────────
  {
    id: 'postop-early-mobilisation',
    phase: 'postoperative',
    shortLabel: 'Early mobilisation',
    description: 'Out of bed on day 0 or day 1 post-op.',
    evidenceLevel: 'strong',
  },
  {
    id: 'postop-multimodal-analgesia',
    phase: 'postoperative',
    shortLabel: 'Multimodal analgesia',
    description: 'Multimodal opioid-sparing post-operative analgesia.',
    evidenceLevel: 'strong',
  },
  {
    id: 'postop-early-oral-intake',
    phase: 'postoperative',
    shortLabel: 'Early oral intake',
    description: 'Early resumption of oral intake post-op.',
    evidenceLevel: 'strong',
  },
  {
    id: 'postop-early-removal',
    phase: 'postoperative',
    shortLabel: 'Early removal of lines',
    description: 'Early (≤24h) removal of urinary catheters and surgical drains.',
    evidenceLevel: 'moderate',
  },
];

export const PHASES = [
  { id: 'preoperative', label: 'Preoperative' },
  { id: 'intraoperative', label: 'Intraoperative' },
  { id: 'postoperative', label: 'Postoperative' },
  { id: 'post-discharge', label: 'Post-discharge' },
];

export const PHASE_ORDER = PHASES.map((p) => p.id);

export const SEED_PROCEDURE_TYPES = [
  '1-2 level lumbar fusion',
  'MIS-TLIF',
  'Decompression only',
  'Other',
];
