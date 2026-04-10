import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropZone } from "@/components/FileDropZone";
import { Link } from "react-router-dom";
import {
  Shield, Zap, Eye, Upload, Sparkles, Download,
  FileImage, FileText, File, Lock, Clock, Archive, Wifi,
} from "lucide-react";

const features = [
  { icon: FileImage, title: "Images", desc: "Strip EXIF & GPS from JPG, PNG, TIFF, and HEIC files." },
  { icon: FileText, title: "PDF & Office", desc: "Remove metadata from PDFs, DOCX, XLSX, and PPTX files." },
  { icon: File, title: "Audio, Video & Text", desc: "Clean MP3, MP4, MOV, JSON, XML, and TXT files." },
  { icon: Archive, title: "ZIP Archives", desc: "Upload a ZIP and clean every supported file inside." },
  { icon: Zap, title: "Batch Processing", desc: "Upload multiple files and clean them all at once." },
  { icon: Lock, title: "Privacy Controls", desc: "Choose exactly which metadata to strip with enterprise presets." },
  { icon: Eye, title: "Audit Reports", desc: "Download a full report of what metadata was found and removed." },
  { icon: Wifi, title: "Works Offline", desc: "Install as an app. All processing happens on your device." },
];

const steps = [
  { icon: Upload, title: "Upload", desc: "Drag & drop or select your files." },
  { icon: Sparkles, title: "Clean", desc: "We detect and remove all removable metadata." },
  { icon: Download, title: "Download", desc: "Get your clean file instantly." },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Protect Your Privacy
          </Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6">
            Strip metadata.{" "}
            <span className="text-primary">Protect your privacy.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload images, documents, audio, and video files to remove hidden metadata — GPS
            coordinates, author names, ID3 tags, and more. Files auto-delete after 1 hour.
          </p>

          <div className="max-w-xl mx-auto mb-8">
            <FileDropZone
              onFilesSelected={() => {}}
              compact
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="glow-primary text-base px-8">
                Get Started Free
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-base px-8">
                View Pricing
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            3 free cleans per day • No account required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">
            Everything you need to clean your files
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Support for the most common file types with full transparency into what's removed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-lg p-6 hover:border-primary/30 transition-colors">
                <f.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-heading font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-accent/20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Three simple steps to a cleaner, safer file.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 glow-primary-sm">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground font-medium mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-heading font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Pay per use</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            No subscriptions. Buy credit packs and use them whenever you need. Each file clean costs 1 credit.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">3 free cleans per day without an account</span>
          </div>
          <Link to="/pricing">
            <Button size="lg" variant="outline">See All Plans</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
