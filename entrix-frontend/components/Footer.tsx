import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-6 mt-12 border-t border-border">
      <div className="container flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <Image src="/css-logo.png" alt="CSS Club Logo" width={40} height={40} />
          <span className="font-bold text-lg">CSS Club Sportif Sfaxien</span>
        </div>
        <div className="text-sm mt-4 md:mt-0">
          &copy; {new Date().getFullYear()} CSS Club Sportif Sfaxien. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 