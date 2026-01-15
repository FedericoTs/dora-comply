import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'DORA Comply - AI-Powered DORA Compliance Platform'
export const size = {
  width: 1200,
  height: 600,
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
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
            }}
          >
            <span style={{ color: 'white', fontSize: '44px', fontWeight: 'bold' }}>D</span>
          </div>
          <span style={{ color: 'white', fontSize: '52px', fontWeight: 'bold' }}>
            DORA Comply
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#059669',
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '20px',
          }}
        >
          AI-Powered DORA Compliance Platform
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '32px',
          }}
        >
          {['AI Document Parsing', '15 RoI Templates', 'Incident Tracking'].map((feature) => (
            <div
              key={feature}
              style={{
                background: 'rgba(5, 150, 105, 0.2)',
                border: '1px solid #059669',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#10b981',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
