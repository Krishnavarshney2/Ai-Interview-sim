export default function Footer() {
  return (
    <footer className="bg-[#0b1326] w-full py-12 border-t border-[#424656]/20">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 w-full max-w-7xl mx-auto gap-6 font-label text-sm uppercase tracking-widest">
        <div className="text-[#dae2fd]/40">
          © 2024 Luminal Intelligence. All rights reserved.
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-[#dae2fd]/40 hover:text-[#afc6ff] transition-colors">
            Documentation
          </a>
          <a href="#" className="text-[#dae2fd]/40 hover:text-[#afc6ff] transition-colors">
            GitHub
          </a>
          <a href="#" className="text-[#dae2fd]/40 hover:text-[#afc6ff] transition-colors">
            Privacy
          </a>
          <a href="#" className="text-[#dae2fd]/40 hover:text-[#afc6ff] transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
