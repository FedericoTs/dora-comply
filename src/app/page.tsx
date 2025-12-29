import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionSelector } from "@/components/region-selector";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Compliance App</h1>
          <RegionSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Region Support</CardTitle>
              <CardDescription>
                US and EU data residency compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This application supports data residency in both the United States
                and European Union regions. Select your preferred region using the
                selector in the header.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supabase Backend</CardTitle>
              <CardDescription>
                Secure and scalable database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Powered by Supabase with separate instances for US and EU regions,
                ensuring your data stays within the required geographical boundaries.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vercel Deployment</CardTitle>
              <CardDescription>
                Edge-optimized hosting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Deployed on Vercel with edge functions in both US (iad1) and EU
                (fra1) regions for optimal performance and compliance.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Configure your environment variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To complete the setup, configure your Supabase credentials in the
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5">.env.local</code>
                file:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
{`# US Region
NEXT_PUBLIC_SUPABASE_URL_US=https://your-us-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_US=your-us-anon-key

# EU Region
NEXT_PUBLIC_SUPABASE_URL_EU=https://your-eu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_EU=your-eu-anon-key`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
