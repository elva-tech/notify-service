export interface PlaygroundEndpoint {
  id: string;
  method: 'POST';
  path: string;
  title: string;
  description: string;
  sampleJson: string;
}

export interface PlaygroundSection {
  id: string;
  title: string;
  endpoints: PlaygroundEndpoint[];
}

export interface PlaygroundTab {
  id: 'sms' | 'email';
  label: string;
  sections: PlaygroundSection[];
}

export function buildCurlCommand(baseUrl: string, path: string, json: string): string {
  const compact = JSON.stringify(JSON.parse(json));
  return `curl -X POST ${baseUrl}${path} \\
  -H "Content-Type: application/json" \\
  -d '${compact}'`;
}
