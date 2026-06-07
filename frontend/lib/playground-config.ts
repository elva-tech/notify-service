import {
  buildCurlCommand,
  type PlaygroundEndpoint,
  type PlaygroundSection,
  type PlaygroundTab,
} from '@/lib/playground-config-core';

export type { PlaygroundEndpoint, PlaygroundSection, PlaygroundTab };
export { buildCurlCommand };

function jsonSample(value: object): string {
  return JSON.stringify(value, null, 2);
}

export const PLAYGROUND_TABS: PlaygroundTab[] = [
  {
    id: 'sms',
    label: 'SMS',
    sections: [
      {
        id: 'sms-otp',
        title: 'OTP APIs (SMS)',
        endpoints: [
          {
            id: 'sms-otp-send',
            method: 'POST',
            path: '/otp/send',
            title: 'POST /otp/send',
            description:
              'ELVA generates a 6-digit OTP, stores it securely, and sends it via SMS (DLT when OTP_DLT_ENABLED=true and app mapping has dltEnabled).',
            sampleJson: jsonSample({ appId: 'your-app-id', apiKey: 'your-secret-key', phone: '919876543210' }),
          },
          {
            id: 'sms-otp-resend',
            method: 'POST',
            path: '/otp/resend',
            title: 'POST /otp/resend',
            description: 'Revoke the previous OTP and send a new one to the same phone number.',
            sampleJson: jsonSample({ appId: 'your-app-id', apiKey: 'your-secret-key', phone: '919876543210' }),
          },
          {
            id: 'sms-otp-verify',
            method: 'POST',
            path: '/otp/verify',
            title: 'POST /otp/verify',
            description: 'Verify the OTP the user received.',
            sampleJson: jsonSample({ appId: 'your-app-id', apiKey: 'your-secret-key', phone: '919876543210', otp: '123456' }),
          },
        ],
      },
      {
        id: 'sms-notify',
        title: 'Notify API (SMS)',
        endpoints: [
          {
            id: 'sms-notify-legacy',
            method: 'POST',
            path: '/notify',
            title: 'POST /notify (legacy SMS)',
            description: 'Send direct SMS with a free-text message (Fast2SMS route q).',
            sampleJson: jsonSample({
              appId: 'your-app-id',
              apiKey: 'your-secret-key',
              channel: 'SMS',
              to: ['919876543210'],
              message: 'Your task is approved',
            }),
          },
          {
            id: 'sms-notify-template',
            method: 'POST',
            path: '/notify',
            title: 'POST /notify (DLT template)',
            description: 'Send DLT templated SMS. Use appId matching a registered business; set templateKey and variables from GET /platform/businesses/:id/templates.',
            sampleJson: jsonSample({
              appId: 'your-app-id',
              apiKey: 'your-secret-key',
              channel: 'SMS',
              to: ['919876543210'],
              templateKey: 'YOUR_TEMPLATE_KEY',
              variables: { customerName: 'Arun', businessName: 'eNandi', orderId: 'ORD-2026-001' },
            }),
          },
        ],
      },
    ],
  },
  {
    id: 'email',
    label: 'EMAIL',
    sections: [
      {
        id: 'email-otp',
        title: 'OTP APIs (EMAIL)',
        endpoints: [
          {
            id: 'email-otp-send',
            method: 'POST',
            path: '/otp/send',
            title: 'POST /otp/send',
            description: 'ELVA generates an OTP and emails it to the user.',
            sampleJson: jsonSample({ appId: 'your-app-id', apiKey: 'your-secret-key', channel: 'EMAIL', email: 'user@example.com' }),
          },
          {
            id: 'email-otp-verify',
            method: 'POST',
            path: '/otp/verify',
            title: 'POST /otp/verify',
            description: 'Verify the OTP from the email.',
            sampleJson: jsonSample({ appId: 'your-app-id', apiKey: 'your-secret-key', email: 'user@example.com', otp: '123456' }),
          },
        ],
      },
      {
        id: 'email-notify',
        title: 'Notify API (EMAIL)',
        endpoints: [
          {
            id: 'email-notify-html',
            method: 'POST',
            path: '/notify',
            title: 'POST /notify (HTML)',
            description: 'Send EMAIL notification with direct HTML content.',
            sampleJson: jsonSample({
              appId: 'your-app-id',
              apiKey: 'your-secret-key',
              channel: 'EMAIL',
              to: ['user@example.com'],
              subject: 'Welcome',
              html: '<h1>Hello</h1>',
            }),
          },
        ],
      },
    ],
  },
];
