import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 bg-background">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-heading font-bold">MetaClean</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Strip metadata from your files. Protect your privacy.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold font-heading">Product</h4>
          <div className="space-y-2">
            <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold font-heading">Supported Files</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>JPG, PNG, TIFF, HEIC</p>
            <p>PDF, DOCX, XLSX, PPTX</p>
            <p>MP3, MP4, MOV</p>
            <p>JSON, XML, TXT, ZIP</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold font-heading">Legal</h4>
          <div className="space-y-2">
            <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
            <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground space-y-1">
        <p>&copy; {new Date().getFullYear()} MetaClean. All rights reserved.</p>
        <p>Developed by <span className="text-foreground font-medium">Aniket Tegginamath</span></p>
      </div>
    </div>
  </footer>
);

export default Footer;
