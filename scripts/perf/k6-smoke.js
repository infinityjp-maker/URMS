import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.URMS_API_BASE ?? 'http://127.0.0.1:3000';

export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

const headers = {
  Accept: 'application/json',
  'X-URMS-Mode': 'operate',
};

export default function smoke() {
  check(http.get(`${BASE}/health`, { headers }), {
    'health status 200': (response) => response.status === 200,
  });

  check(http.get(`${BASE}/v1/context`, { headers }), {
    'context status 200': (response) => response.status === 200,
  });

  check(http.get(`${BASE}/v1/perception`, { headers }), {
    'perception status 200': (response) => response.status === 200,
  });

  sleep(0.1);
}
