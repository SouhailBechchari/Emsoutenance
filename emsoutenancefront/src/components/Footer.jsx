export default function Footer() {
  return (
    <footer className="border-t border-[#2d3748] mt-20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">EMSoutenance</h4>
            <p className="text-[#a0aec0] text-sm">Plateforme de gestion des soutenances académiques</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-[#a0aec0]">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Tarification
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Sécurité
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Ressources</h4>
            <ul className="space-y-2 text-sm text-[#a0aec0]">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-[#a0aec0]">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Confidentialité
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2d3748] pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-[#a0aec0] text-sm">© 2025 EMSoutenance. Tous droits réservés.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="text-[#a0aec0] hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-[#a0aec0] hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-[#a0aec0] hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
