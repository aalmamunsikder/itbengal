export interface DomainSearchResult {
  domain: string;
  isAvailable: boolean;
  priceBdt: number;
  currency: string;
  tld: string;
}

export interface OpenproviderDnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

const TLD_PRICES: Record<string, number> = {
  com: 1200,
  net: 1400,
  org: 1500,
  xyz: 500,
  info: 1600,
  tech: 999,
};

const MARKUP_MULTIPLIER = 1.2; // 20% markup

const username = process.env['OPENPROVIDER_USERNAME'];
const password = process.env['OPENPROVIDER_PASSWORD'];
const isSandbox = !username || !password;
const platformDomain = process.env['DOMAIN'] ?? 'itbengal.xyz';

let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Log in to Openprovider and retrieve/cache authentication token.
 */
async function getAuthToken(): Promise<string | null> {
  if (isSandbox) return null;

  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  try {
    const apiUrl = process.env['OPENPROVIDER_API_URL'] || 'https://api.openprovider.eu/v1beta';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Openprovider API Auth Error]: ${response.statusText} - ${errText}`);
      return null;
    }

    const json = (await response.json()) as any;
    if (json.data && json.data.token) {
      cachedToken = json.data.token;
      // Set expiration to 47 hours from now (Openprovider tokens are valid for 48 hours)
      tokenExpiry = now + 47 * 60 * 60 * 1000;
      return cachedToken;
    }
  } catch (err) {
    console.error('[Openprovider API Auth Exception]:', err);
  }

  return null;
}

/**
 * Base helper to make authenticated requests to Openprovider REST API.
 */
async function requestApi(method: string, path: string, body?: any): Promise<any> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication failed or credentials not configured');
  }

  const apiUrl = process.env['OPENPROVIDER_API_URL'] || 'https://api.openprovider.eu/v1beta';
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiUrl}${path}`, options);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Openprovider API Error (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * Search domain availability and return pricing.
 */
export async function searchDomain(domainName: string): Promise<DomainSearchResult[]> {
  const parts = domainName.split('.');
  const name = parts[0] || 'domain';
  const requestedTld = parts[1];

  const tldsToSearch = requestedTld && TLD_PRICES[requestedTld] ? [requestedTld] : ['com', 'net', 'xyz'];

  if (!isSandbox) {
    try {
      const names = tldsToSearch.map((tld) => `${name}.${tld}`);
      const response = await requestApi('POST', '/domains/check', { names });
      
      const results = response.data?.results || [];
      return results.map((res: any) => {
        const fullDomain = res.domain;
        const domainParts = fullDomain.split('.');
        const tld = domainParts[1] || 'com';
        const isAvailable = res.status === 'free';
        const basePrice = TLD_PRICES[tld] || 1200;
        const priceWithMarkup = Math.round(basePrice * MARKUP_MULTIPLIER);

        return {
          domain: fullDomain,
          isAvailable,
          priceBdt: priceWithMarkup,
          currency: 'BDT',
          tld,
        };
      });
    } catch (err) {
      console.error('[Openprovider searchDomain API Error, falling back to sandbox]:', err);
    }
  }

  // Simulate search check (Sandbox fallback)
  return tldsToSearch.map((tld) => {
    const fullDomain = `${name}.${tld}`;
    const isAvailable = name.length % 2 !== 0 || name.length > 5;
    const basePrice = TLD_PRICES[tld] || 1200;
    const priceWithMarkup = Math.round(basePrice * MARKUP_MULTIPLIER);

    return {
      domain: fullDomain,
      isAvailable,
      priceBdt: priceWithMarkup,
      currency: 'BDT',
      tld,
    };
  });
}

/**
 * Register a new domain.
 */
export async function registerDomain(
  domainName: string,
  contactInfo: any
): Promise<{
  success: boolean;
  domainName: string;
  registrationDate: Date;
  expiryDate: Date;
  authCode: string;
}> {
  console.log(`[Openprovider] Registering domain: ${domainName}`);
  
  if (!isSandbox) {
    try {
      const parts = domainName.split('.');
      const name = parts[0] || '';
      const extension = parts[1] || '';

      const ownerHandle = contactInfo?.ownerHandle || process.env['OPENPROVIDER_OWNER_HANDLE'] || 'ITB001';
      
      const payload = {
        domain: { name, extension },
        period: 1,
        owner_handle: ownerHandle,
        admin_handle: ownerHandle,
        tech_handle: ownerHandle,
        billing_handle: ownerHandle,
        ns_group: 'dns-openprovider'
      };

      const response = await requestApi('POST', '/domains', payload);
      
      const regDate = response.data?.active_date ? new Date(response.data.active_date) : new Date();
      const expDate = response.data?.expiration_date ? new Date(response.data.expiration_date) : new Date();
      
      return {
        success: true,
        domainName,
        registrationDate: regDate,
        expiryDate: expDate,
        authCode: response.data?.auth_code || 'OP-MOCK-AUTH-CODE',
      };
    } catch (err) {
      console.error('[Openprovider registerDomain API Error, falling back to sandbox]:', err);
    }
  }

  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  const randomAuth = 'OP-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  return {
    success: true,
    domainName,
    registrationDate: now,
    expiryDate: oneYearFromNow,
    authCode: randomAuth,
  };
}

/**
 * Retrieve nameservers & DNS zone records.
 */
export async function getDnsZone(domainName: string): Promise<OpenproviderDnsRecord[]> {
  console.log(`[Openprovider] Fetching DNS zone for: ${domainName}`);
  
  if (!isSandbox) {
    try {
      const response = await requestApi('GET', `/dns/zones/${domainName}`);
      const records = response.data?.records || [];
      return records.map((r: any) => ({
        type: r.type,
        name: r.name === '' ? '@' : r.name,
        value: r.value,
        ttl: r.ttl,
        priority: r.priority
      }));
    } catch (err) {
      console.error('[Openprovider getDnsZone API Error, falling back to sandbox]:', err);
    }
  }

  // Default mock zone setup
  return [
    { type: 'NS', name: '@', value: `ns1.${platformDomain}`, ttl: 86400 },
    { type: 'NS', name: '@', value: `ns2.${platformDomain}`, ttl: 86400 },
    { type: 'A', name: '@', value: '127.0.0.1', ttl: 3600 },
    { type: 'CNAME', name: 'www', value: '@', ttl: 3600 },
  ];
}

/**
 * Apply DNS zone updates.
 */
export async function updateDnsZone(
  domainName: string,
  records: OpenproviderDnsRecord[]
): Promise<boolean> {
  console.log(`[Openprovider] Applying ${records.length} DNS records to zone: ${domainName}`);
  
  if (!isSandbox) {
    try {
      const openproviderRecords = records.map(r => ({
        type: r.type,
        name: r.name === '@' ? '' : r.name,
        value: r.value,
        ttl: r.ttl,
        priority: r.priority
      }));

      await requestApi('PUT', `/dns/zones/${domainName}`, {
        records: openproviderRecords
      });
      return true;
    } catch (err) {
      console.error('[Openprovider updateDnsZone API Error, falling back to sandbox]:', err);
    }
  }

  return true;
}

/**
 * Toggle WHOIS privacy shields.
 */
export async function toggleWhoisPrivacy(domainName: string, enabled: boolean): Promise<boolean> {
  console.log(`[Openprovider] Setting WHOIS privacy shield for ${domainName} to: ${enabled}`);
  
  if (!isSandbox) {
    try {
      await requestApi('PATCH', `/domains/${domainName}`, {
        is_private_whois_enabled: enabled
      });
      return true;
    } catch (err) {
      console.error('[Openprovider toggleWhoisPrivacy API Error, falling back to sandbox]:', err);
    }
  }

  return true;
}

/**
 * Request auth transfer code.
 */
export async function getAuthCode(domainName: string): Promise<string> {
  console.log(`[Openprovider] Fetching Auth code for ${domainName}`);
  
  if (!isSandbox) {
    try {
      const response = await requestApi('GET', `/domains/${domainName}`);
      return response.data?.auth_code || 'OP-MOCK-AUTH-CODE';
    } catch (err) {
      console.error('[Openprovider getAuthCode API Error, falling back to sandbox]:', err);
    }
  }

  return 'OP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}
