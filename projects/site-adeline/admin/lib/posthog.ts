import "server-only";

// Lit les données analytics envoyées par le site public (app/) via PostHog,
// avec la clé personnelle (lecture seule) — jamais exposée au navigateur.
// Requêtes en HogQL (SQL-like) via l'API Query de PostHog :
// https://posthog.com/docs/api/query

export type DayCount = { day: string; visitors: number; views: number };
export type TopPage = { url: string; views: number };
export type CategoryCount = { category: string; count: number };
export type ProductViewCount = { productId: string; productName: string; views: number };
export type TrafficSource = { source: string; visits: number };
export type DeviceCount = { device: string; visits: number };

function configured(): boolean {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID && process.env.POSTHOG_HOST);
}

async function queryHogQL<T extends unknown[]>(sql: string): Promise<T[]> {
  const host = process.env.POSTHOG_HOST;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const key = process.env.POSTHOG_PERSONAL_API_KEY;

  const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: sql } }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PostHog query failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.results ?? [];
}

// Une seule ligne par jour même sans événement (LEFT JOIN sur une série de
// dates générée) aurait été plus propre, mais HogQL/ClickHouse ne supporte
// pas generate_series ici — on remplit les jours manquants côté JS.
export async function getVisitsByDay(days: number): Promise<DayCount[]> {
  if (!configured()) return [];
  const rows = await queryHogQL<[string, number, number]>(`
    SELECT toDate(timestamp) AS day, count(DISTINCT properties.$session_id) AS visitors, count() AS views
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY day
    ORDER BY day
  `);

  const byDay = new Map(rows.map(([day, visitors, views]) => [day, { visitors, views }]));
  const result: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = byDay.get(key);
    result.push({ day: key, visitors: found?.visitors ?? 0, views: found?.views ?? 0 });
  }
  return result;
}

export async function getTopPages(days: number, limit = 6): Promise<TopPage[]> {
  if (!configured()) return [];
  const rows = await queryHogQL<[string, number]>(`
    SELECT properties.$pathname AS url, count() AS views
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY AND properties.$pathname IS NOT NULL
    GROUP BY url
    ORDER BY views DESC
    LIMIT ${limit}
  `);
  return rows.map(([url, views]) => ({ url, views }));
}

// Part-to-whole par catégorie boutique, sur l'événement custom
// `category_viewed` (voir components/TrackEvent.tsx côté site public).
export async function getCategoryBreakdown(days: number): Promise<CategoryCount[]> {
  if (!configured()) return [];
  const rows = await queryHogQL<[string, number]>(`
    SELECT properties.category AS category, count() AS n
    FROM events
    WHERE event = 'category_viewed' AND timestamp >= now() - INTERVAL ${days} DAY AND properties.category IS NOT NULL
    GROUP BY category
    ORDER BY n DESC
  `);
  return rows.map(([category, count]) => ({ category, count }));
}

export async function getRecentVisitorCount(minutes = 5): Promise<number> {
  if (!configured()) return 0;
  const rows = await queryHogQL<[number]>(`
    SELECT count(DISTINCT properties.$session_id)
    FROM events
    WHERE timestamp >= now() - INTERVAL ${minutes} MINUTE
  `);
  return rows[0]?.[0] ?? 0;
}

export async function getTotalProductViews(days: number): Promise<number> {
  if (!configured()) return 0;
  const rows = await queryHogQL<[number]>(`
    SELECT count()
    FROM events
    WHERE event = 'product_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
  `);
  return rows[0]?.[0] ?? 0;
}

// Fenêtre décalée (ex. jours 30-60 dans le passé) pour calculer une
// variation vs période précédente sans réinventer une requête dédiée.
export async function getTotalProductViewsBetween(daysAgoStart: number, daysAgoEnd: number): Promise<number> {
  if (!configured()) return 0;
  const rows = await queryHogQL<[number]>(`
    SELECT count()
    FROM events
    WHERE event = 'product_viewed'
      AND timestamp >= now() - INTERVAL ${daysAgoStart} DAY
      AND timestamp < now() - INTERVAL ${daysAgoEnd} DAY
  `);
  return rows[0]?.[0] ?? 0;
}

// Quelles pièces précises génèrent le plus de vues — pas juste le total par
// catégorie déjà affiché. `product_viewed` porte déjà product_id/product_name
// (voir TrackEvent sur la fiche produit, app/app/boutique/[category]/[slug]/page.tsx).
export async function getTopViewedProducts(days: number, limit = 8): Promise<ProductViewCount[]> {
  if (!configured()) return [];
  const rows = await queryHogQL<[string, string, number]>(`
    SELECT properties.product_id AS product_id, properties.product_name AS product_name, count() AS views
    FROM events
    WHERE event = 'product_viewed' AND timestamp >= now() - INTERVAL ${days} DAY AND properties.product_id IS NOT NULL
    GROUP BY product_id, product_name
    ORDER BY views DESC
    LIMIT ${limit}
  `);
  return rows.map(([productId, productName, views]) => ({ productId, productName, views }));
}

// D'où viennent les visiteuses (recherche Google, réseaux sociaux, direct...)
// — $referring_domain est une propriété standard PostHog, déjà capturée sur
// chaque $pageview sans code supplémentaire de notre côté. PostHog vaut
// "$direct" (littéral) pour un accès direct, jamais NULL en pratique, mais
// les deux cas sont couverts par prudence.
export async function getTrafficSources(days: number, limit = 6): Promise<TrafficSource[]> {
  if (!configured()) return [];
  const rows = await queryHogQL<[string, number]>(`
    SELECT
      multiIf(
        properties.$referring_domain IS NULL OR properties.$referring_domain IN ('', '$direct'),
        'Accès direct',
        properties.$referring_domain
      ) AS source,
      count(DISTINCT properties.$session_id) AS visits
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY source
    ORDER BY visits DESC
    LIMIT ${limit}
  `);
  return rows.map(([source, visits]) => ({ source, visits }));
}

// $device_type ("Desktop"/"Mobile"/"Tablet") est aussi une propriété
// standard PostHog calculée depuis le user-agent, capturée automatiquement.
export async function getDeviceBreakdown(days: number): Promise<DeviceCount[]> {
  if (!configured()) return [];
  const rows = await queryHogQL<[string, number]>(`
    SELECT properties.$device_type AS device, count(DISTINCT properties.$session_id) AS visits
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY AND properties.$device_type IS NOT NULL
    GROUP BY device
    ORDER BY visits DESC
  `);
  return rows.map(([device, visits]) => ({ device, visits }));
}

export function isPostHogConfigured(): boolean {
  return configured();
}
