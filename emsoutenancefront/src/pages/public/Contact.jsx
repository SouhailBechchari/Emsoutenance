import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Contact</h1>
        <p className="text-[#a0aec0] mb-8">
          Besoin d'aide ? Contactez l'administration ou envoyez-nous un message.
        </p>
        <form className="card glass p-6 rounded-lg space-y-4">
          <div>
            <label className="block mb-2">Votre email</label>
            <input type="email" className="w-full p-3 rounded bg-[#1a1f3a] border border-[#2d3748]" placeholder="vous@example.com" />
          </div>
          <div>
            <label className="block mb-2">Sujet</label>
            <input type="text" className="w-full p-3 rounded bg-[#1a1f3a] border border-[#2d3748]" placeholder="Sujet du message" />
          </div>
          <div>
            <label className="block mb-2">Message</label>
            <textarea className="w-full p-3 rounded bg-[#1a1f3a] border border-[#2d3748]" rows={5} placeholder="Votre message..." />
          </div>
          <button type="button" className="btn-primary">Envoyer</button>
        </form>
      </main>
      <Footer />
    </div>
  )
}