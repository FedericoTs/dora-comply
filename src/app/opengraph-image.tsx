import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'DORA Comply - AI-Powered DORA Compliance Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo/Brand Mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
            }}
          >
            <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold' }}>D</span>
          </div>
          <span style={{ color: 'white', fontSize: '56px', fontWeight: 'bold' }}>
            DORA Comply
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#059669',
            fontSize: '32px',
            fontWeight: '600',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          AI-Powered DORA Compliance Platform
        </div>

        {/* Description */}
        <div
          style={{
            color: '#9ca3af',
            fontSize: '24px',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          Automate vendor assessments, generate the Register of Information,
          and manage ICT incident reporting for EU financial institutions.
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '48px',
          }}
        >
          {['AI Document Parsing', '15 RoI Templates', 'Incident Tracking'].map((feature) => (
            <div
              key={feature}
              style={{
                background: 'rgba(5, 150, 105, 0.2)',
                border: '1px solid #059669',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#10b981',
                fontSize: '18px',
                fontWeight: '500',
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Deadline reminder */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '8px',
            padding: '12px 20px',
            color: '#fca5a5',
            fontSize: '16px',
          }}
        >
          DORA Enforcement: January 17, 2026
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
