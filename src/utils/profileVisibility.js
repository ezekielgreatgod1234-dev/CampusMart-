import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * PROFILE VISIBILITY HELPERS
 *
 * The owner's choice is saved in users/{uid}.settings.profileVisibility
 * (private to the owner) AND copied to publicProfiles/{uid}.profileVisibility
 * (readable by other signed-in users) so other people's screens can obey it.
 *
 *   public  -> everyone, every campus
 *   campus  -> only students of the SAME campus as the owner
 *   private -> only the owner
 *
 * A profile that has never chosen a visibility is treated as "public"
 * so existing stores don't suddenly lock.
 */

export const VISIBILITY = {
  PUBLIC: "public",
  CAMPUS: "campus",
  PRIVATE: "private",
};

// Add more spellings here if students type their campus differently.
// Every spelling in a group counts as the same campus.
const CAMPUS_ALIASES = [
  [
    "absu",
    "abia state university",
    "abia state university uturu",
    "abia state university, uturu",
  ],
];

const clean = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function normalizeCampus(raw) {
  const c = clean(raw);
  if (!c) return "";
  for (const group of CAMPUS_ALIASES) {
    if (group.some((g) => clean(g) === c)) return clean(group[0]);
  }
  return c;
}

export function sameCampus(a, b) {
  const x = normalizeCampus(a);
  const y = normalizeCampus(b);
  return Boolean(x) && Boolean(y) && x === y;
}

export function getCampusOf(data = {}) {
  return String(
    data.campus || data.profile?.campus || data.school || ""
  ).trim();
}

export function getVisibilityOf(data = {}) {
  const v = String(
    data.profileVisibility || data.settings?.profileVisibility || ""
  )
    .trim()
    .toLowerCase();
  if (v === VISIBILITY.PRIVATE || v === VISIBILITY.CAMPUS) return v;
  return VISIBILITY.PUBLIC;
}

/**
 * Can the viewer see the owner's picture, cover photo and products?
 * Returns { allowed, reason, visibility, ownerCampus }
 * reason: "owner" | "public" | "same-campus" | "private" | "campus"
 */
export function canViewProfile({ ownerId, owner, viewerId, viewerCampus }) {
  const visibility = getVisibilityOf(owner || {});
  const ownerCampus = getCampusOf(owner || {});

  if (viewerId && ownerId && String(viewerId) === String(ownerId)) {
    return { allowed: true, reason: "owner", visibility, ownerCampus };
  }
  if (visibility === VISIBILITY.PUBLIC) {
    return { allowed: true, reason: "public", visibility, ownerCampus };
  }
  if (visibility === VISIBILITY.PRIVATE) {
    return { allowed: false, reason: "private", visibility, ownerCampus };
  }
  if (sameCampus(ownerCampus, viewerCampus)) {
    return { allowed: true, reason: "same-campus", visibility, ownerCampus };
  }
  return { allowed: false, reason: "campus", visibility, ownerCampus };
}

/**
 * Copy the visibility (and campus) to publicProfiles so other users'
 * screens can enforce it.
 */
export async function syncProfileVisibility(db, uid, visibility, campus) {
  if (!db || !uid) return;
  const fields = {
    profileVisibility: visibility,
    updatedAt: serverTimestamp(),
  };
  if (campus) fields.campus = String(campus).trim();
  await setDoc(doc(db, "publicProfiles", uid), fields, { merge: true });
}

/* ---------------------------------------------------------------------
 * LIST FILTERING (Browse, Recommended, ...)
 *
 * Hides products of sellers whose profile the viewer is not allowed to see.
 * Results are cached for a few minutes to save Firestore reads, and if a
 * profile can't be read the product is shown (we can't know it is locked).
 * ------------------------------------------------------------------- */

const CACHE_MS = 5 * 60 * 1000;
const publicProfileCache = new Map(); // uid -> { at, data }
const viewerCampusCache = new Map(); // uid -> { at, campus }

async function loadPublicProfiles(db, ids) {
  const out = new Map();

  await Promise.all(
    ids.map(async (id) => {
      const cached = publicProfileCache.get(id);
      if (cached && Date.now() - cached.at < CACHE_MS) {
        out.set(id, cached.data);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "publicProfiles", id));
        const data = snap.exists() ? snap.data() || {} : null;
        publicProfileCache.set(id, { at: Date.now(), data });
        out.set(id, data);
      } catch {
        out.set(id, null);
      }
    })
  );

  return out;
}

async function getViewerCampus(db, uid) {
  if (!uid) return "";
  const cached = viewerCampusCache.get(uid);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.campus;

  let campus = "";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) campus = getCampusOf(snap.data() || {});
  } catch {
    campus = "";
  }
  viewerCampusCache.set(uid, { at: Date.now(), campus });
  return campus;
}

/** Call after the owner changes visibility so their own screens refresh. */
export function clearVisibilityCache() {
  publicProfileCache.clear();
  viewerCampusCache.clear();
}

export async function filterVisibleItems(
  db,
  items,
  { viewerId, ownerKey = "sellerId" } = {}
) {
  const list = Array.isArray(items) ? items : [];
  const me = String(viewerId || "");

  const ids = [
    ...new Set(
      list
        .map((item) => String(item?.[ownerKey] || ""))
        .filter((id) => id && id !== me)
    ),
  ];
  if (!ids.length) return list;

  const profiles = await loadPublicProfiles(db, ids);

  const needsCampus = ids.some(
    (id) => getVisibilityOf(profiles.get(id) || {}) === VISIBILITY.CAMPUS
  );
  const viewerCampus = needsCampus ? await getViewerCampus(db, me) : "";

  return list.filter((item) => {
    const ownerId = String(item?.[ownerKey] || "");
    if (!ownerId) return true;

    return canViewProfile({
      ownerId,
      owner: profiles.get(ownerId) || null,
      viewerId: me,
      viewerCampus,
    }).allowed;
  });
}