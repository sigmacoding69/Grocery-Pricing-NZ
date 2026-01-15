// Netlify Function: Get latest price documents from Firestore (Firebase Admin SDK)
// Requires env vars:
// - FIREBASE_PROJECT_ID
// - FIREBASE_CLIENT_EMAIL
// - FIREBASE_PRIVATE_KEY  (with \n newlines escaped; we unescape here)
// - FIRESTORE_PRICES_COLLECTION (e.g. "prices" / "egg_prices")
// Optional:
// - FIRESTORE_PRICES_ORDER_BY (default: "created_at")
// - FIRESTORE_PRICES_ORDER_DIR (default: "desc")

const admin = require('firebase-admin');

function mustGetEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function initAdmin() {
  if (admin.apps && admin.apps.length > 0) return admin.app();

  const projectId = mustGetEnv('FIREBASE_PROJECT_ID');
  const clientEmail = mustGetEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = mustGetEnv('FIREBASE_PRIVATE_KEY');
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });

  return admin.app();
}

function formatTimestampLikeConsole(ts) {
  const d = ts.toDate();
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);

  const tzPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland',
    timeZoneName: 'shortOffset',
    hour: 'numeric',
  })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value;

  // Example: "GMT+13" -> "UTC+13"
  const utcOffset = (tzPart || '').replace(/^GMT/, 'UTC');
  return utcOffset ? `${dateStr} ${utcOffset}` : dateStr;
}

function toTypedField(value) {
  if (value == null) return { type: 'null', value: null };

  // Firestore Timestamp (admin SDK)
  if (value instanceof admin.firestore.Timestamp) {
    return { type: 'timestamp', value: formatTimestampLikeConsole(value) };
  }

  if (typeof value === 'string') return { type: 'string', value };
  if (typeof value === 'number') return { type: 'number', value };
  if (typeof value === 'boolean') return { type: 'boolean', value };
  if (Array.isArray(value)) return { type: 'array', value };
  if (typeof value === 'object') return { type: 'map', value };

  return { type: typeof value, value };
}

function allowCors(headers = {}) {
  return {
    ...headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: allowCors() };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: allowCors({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    initAdmin();
    const db = admin.firestore();

    const collectionName = process.env.FIRESTORE_PRICES_COLLECTION;
    if (!collectionName) {
      return {
        statusCode: 500,
        headers: allowCors({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          error: 'Server configuration error',
          message:
            'Missing FIRESTORE_PRICES_COLLECTION. Set it to the Firestore collection that contains your price docs.',
        }),
      };
    }

    const params = event.queryStringParameters || {};
    const limitRaw = params.limit || '50';
    const limit = Math.max(1, Math.min(500, parseInt(limitRaw, 10) || 50));

    const orderBy = params.orderBy || process.env.FIRESTORE_PRICES_ORDER_BY || 'created_at';
    const orderDirRaw = (params.orderDir || process.env.FIRESTORE_PRICES_ORDER_DIR || 'desc').toLowerCase();
    const orderDir = orderDirRaw === 'asc' ? 'asc' : 'desc';

    const snap = await db
      .collection(collectionName)
      .orderBy(orderBy, orderDir)
      .limit(limit)
      .get();

    const items = snap.docs.map((doc) => {
      const data = doc.data() || {};
      const fields = {};
      for (const [k, v] of Object.entries(data)) {
        fields[k] = toTypedField(v);
      }
      return { id: doc.id, fields };
    });

    return {
      statusCode: 200,
      headers: allowCors({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        collection: collectionName,
        orderBy,
        orderDir,
        count: items.length,
        items,
      }),
    };
  } catch (error) {
    console.error('get-prices function error:', error);
    return {
      statusCode: 500,
      headers: allowCors({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

