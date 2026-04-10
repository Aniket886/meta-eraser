import { Link } from "react-router-dom";
import metacleanLogo from "@/assets/metaclean-logo.png";

const Footer = () => (
  <footer className="border-t border-border/50 bg-background">
    <div className="container mx-auto px-4 py-6 md:py-12">
      {/* Mobile: compact 2-col layout, Desktop: 4-col */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 md:col-span-1 space-y-2">
          <div className="flex items-center gap-2">
            <img src={metacleanLogo} alt="MetaClean" className="h-6 w-6" />
            <span className="text-lg font-heading font-bold">MetaClean</span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Strip metadata from your files. Protect your privacy.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs md:text-sm font-semibold font-heading">Product</h4>
          <div className="space-y-1">
            <Link to="/" className="block text-xs md:text-sm text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/pricing" className="block text-xs md:text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/dashboard" className="block text-xs md:text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs md:text-sm font-semibold font-heading">Supported Files</h4>
          <div className="space-y-0.5 text-xs md:text-sm text-muted-foreground">
            <p>JPG, PNG, TIFF, HEIC</p>
            <p>PDF, DOCX, XLSX, PPTX</p>
            <p>MP3, MP4, MOV</p>
            <p>JSON, XML, TXT, ZIP</p>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 space-y-2">
          <h4 className="text-xs md:text-sm font-semibold font-heading">Legal</h4>
          <div className="flex md:flex-col gap-3 md:gap-1">
            <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
            <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-border/50 text-center text-xs md:text-sm text-muted-foreground space-y-0.5">
        <p>&copy; {new Date().getFullYear()} MetaClean. All rights reserved.</p>
        <p>Developed by <span className="text-foreground font-medium">Aniket Tegginamath</span></p>
      </div>
    </div>
  </footer>
);

export default Footer;
