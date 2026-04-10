import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Code, Zap, Lock, FileText } from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/api/scan",
    description: "Upload a file and receive extracted metadata.",
    request: `curl -X POST https://api.metaclean.dev/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@photo.jpg"`,
    response: `{
  "filename": "photo.jpg",
  "metadata": {
    "GPS Latitude": { "value": "37.7749", "removable": true },
    "Camera Make": { "value": "Canon", "removable": true },
    "ImageWidth": { "value": "4032", "removable": false }
  },
  "warnings": []
}`,
  },
  {
    method: "POST",
    path: "/api/clean",
    description: "Upload a file and receive a cleaned version with metadata stripped.",
    request: `curl -X POST https://api.metaclean.dev/clean \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -o document_clean.pdf`,
    response: "Binary file download (cleaned file)",
  },
  {
    method: "POST",
    path: "/api/clean?audit=true",
    description: "Clean a file and receive a JSON audit report of removed fields.",
    request: `fetch("https://api.metaclean.dev/clean?audit=true", {
  method: "POST",
  headers: { "Authorization": "Bearer YOUR_API_KEY" },
  body: formData,
})`,
    response: `{
  "file": "document_clean.pdf",
  "audit": {
    "removed": 5,
    "kept": 2,
    "fields": [
      { "name": "Author", "status": "removed", "originalValue": "John Doe" },
      { "name": "Page Count", "status": "kept", "reason": "Structural data" }
    ]
  }
}`,
  },
];

const ApiDocs = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12">
            <Badge variant="secondary" className="mb-4">
              <Code className="h-3.5 w-3.5 mr-1.5" />
              Coming Soon
            </Badge>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">API Reference</h1>
            <p className="text-muted-foreground max-w-2xl">
              Integrate MetaClean into your workflow. Scan and clean files programmatically with our REST API.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Zap, title: "Fast", desc: "Process files in under 2 seconds" },
              { icon: Lock, title: "Secure", desc: "Files auto-deleted after processing" },
              { icon: FileText, title: "10+ Formats", desc: "JPG, PNG, PDF, DOCX, XLSX, PPTX, MP3, MP4, MOV" },
            ].map((f) => (
              <div key={f.title} className="glass rounded-lg p-5">
                <f.icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-heading font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Auth */}
          <div className="glass rounded-lg p-6 mb-8">
            <h2 className="text-xl font-heading font-semibold mb-3">Authentication</h2>
            <p className="text-sm text-muted-foreground mb-3">
              All API requests require an API key passed via the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header.
            </p>
            <pre className="bg-background/50 border border-border rounded-md p-4 text-sm overflow-x-auto">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </pre>
          </div>

          {/* Endpoints */}
          <h2 className="text-xl font-heading font-semibold mb-4">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((ep) => (
              <div key={ep.path} className="glass rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border/50">
                  <Badge className="bg-primary/20 text-primary font-mono text-xs">{ep.method}</Badge>
                  <code className="text-sm font-mono text-foreground">{ep.path}</code>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{ep.description}</p>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Request</h4>
                    <pre className="bg-background/50 border border-border rounded-md p-3 text-xs overflow-x-auto">
                      <code>{ep.request}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Response</h4>
                    <pre className="bg-background/50 border border-border rounded-md p-3 text-xs overflow-x-auto">
                      <code>{ep.response}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rate limits */}
          <div className="glass rounded-lg p-6 mt-8">
            <h2 className="text-xl font-heading font-semibold mb-3">Rate Limits</h2>
            <p className="text-sm text-muted-foreground">
              API requests consume credits at the same rate as the dashboard — 1 credit per file.
              Free tier: 3 files per day. Rate limit: 60 requests per minute.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApiDocs;
