import { useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api'

function Commande({ cart = [], viderPanier }) {
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    ville: '',
    adresse: '',
  })

  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sous-total des produits
  const sousTotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.prix || 0) * Number(item.quantity || 0),
    0
  )

  // Calcul automatique de la livraison
  const villeNormalisee = form.ville
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const estCasa = [
    'casablanca',
    'casa',
    'الدار البيضاء',
  ].includes(villeNormalisee)

  const fraisLivraison =
    sousTotal >= 500 ? 0 : estCasa ? 20 : 40

  const totalFinal = sousTotal + fraisLivraison

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })

    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setErreur(false)
    setLoading(true)

    try {
      const commandeData = {
        nom_complet: form.nom.trim(),
        telephone: form.telephone.trim(),
        ville: form.ville.trim(),
        adresse: form.adresse.trim(),
        articles: cart.map((item) => ({
          produit_id: Number(item.id),
          quantite: Number(item.quantity),
        })),
      }

      const response = await fetch(`${API_URL}/commandes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(commandeData),
      })

      const data = await response.json()

      if (!response.ok) {
        const erreursValidation = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : data.message

        throw new Error(
          erreursValidation || 'Impossible d’enregistrer la commande.'
        )
      }

      setMessage(
        `Commande enregistrée avec succès ! Numéro : ${
          data.commande?.id ?? ''
        }. Total à payer : ${Number(
          data.total_final ?? totalFinal
        ).toFixed(2)} DH. Paiement à la livraison.`
      )

      viderPanier?.()

      setForm({
        nom: '',
        telephone: '',
        ville: '',
        adresse: '',
      })
    } catch (error) {
      setErreur(true)
      setMessage(
        error.message ||
          'Erreur de connexion. Vérifiez que le serveur Laravel est démarré.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <section className="commande-section">
        <h1>Votre panier est vide</h1>
        <p>Ajoutez des produits avant de passer commande.</p>
        <Link to="/" className="commande-back">
          Retour aux produits
        </Link>
      </section>
    )
  }

  return (
    <section className="commande-section">
      <Link to="/" className="commande-back">
        ← Continuer mes achats
      </Link>

      <h1>Finaliser ma commande</h1>
      <p className="commande-subtitle">
        Remplissez vos informations pour préparer votre commande.
      </p>

      <div className="commande-grid">
        <form className="commande-form" onSubmit={handleSubmit}>
          <h2>Informations de livraison</h2>

          <label htmlFor="nom">Nom complet</label>
          <input
            id="nom"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            placeholder="Votre nom complet"
            maxLength={255}
            required
          />

          <label htmlFor="telephone">Numéro de téléphone</label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            value={form.telephone}
            onChange={handleChange}
            placeholder="06XXXXXXXX"
            pattern="[0-9 +()-]{9,30}"
            maxLength={30}
            required
          />

          <label htmlFor="ville">Ville</label>
          <input
            id="ville"
            name="ville"
            value={form.ville}
            onChange={handleChange}
            placeholder="Ex. Casablanca, Rabat, Fès..."
            maxLength={255}
            required
          />

          <label htmlFor="adresse">Adresse complète</label>
          <textarea
            id="adresse"
            name="adresse"
            value={form.adresse}
            onChange={handleChange}
            placeholder="Quartier, rue, numéro..."
            rows="3"
            maxLength={1000}
            required
          />

          <div className="commande-payment">
            <strong>Mode de paiement</strong>
            <p>💵 Paiement à la livraison</p>
          </div>

          <button
            type="submit"
            className="commande-submit"
            disabled={loading}
          >
            {loading ? 'Envoi en cours...' : 'Confirmer la commande'}
          </button>

          {message && (
            <p
              className="commande-message"
              role="status"
              style={{
                color: erreur ? '#dc2626' : '#16a34a',
              }}
            >
              {message}
            </p>
          )}
        </form>

        <aside className="commande-summary">
          <h2>Résumé de la commande</h2>

          {cart.map((item) => (
            <div className="commande-item" key={item.id}>
              <div>
                <strong>{item.nom}</strong>
                <p>Quantité : {item.quantity}</p>
              </div>

              <span>
                {(
                  Number(item.prix || 0) * Number(item.quantity || 0)
                ).toFixed(2)}{' '}
                DH
              </span>
            </div>
          ))}

          <div className="commande-total">
            <span>Sous-total</span>
            <strong>{sousTotal.toFixed(2)} DH</strong>
          </div>

          <div className="commande-total">
            <span>Livraison</span>
            <strong>
              {sousTotal >= 500
                ? 'Gratuite'
                : `${fraisLivraison.toFixed(2)} DH`}
            </strong>
          </div>

          {sousTotal < 500 && (
            <p className="commande-note">
              {estCasa
                ? 'Livraison à Casablanca : 20 DH.'
                : 'Livraison hors Casablanca : 40 DH.'}
              {` Ajoutez ${(500 - sousTotal).toFixed(
                2
              )} DH d’achats pour bénéficier de la livraison gratuite.`}
            </p>
          )}

          {sousTotal >= 500 && (
            <p className="commande-note">
              Félicitations ! Vous bénéficiez de la livraison gratuite.
            </p>
          )}

          <div className="commande-total">
            <strong>Total à payer</strong>
            <strong>{totalFinal.toFixed(2)} DH</strong>
          </div>

          <p className="commande-note">
            Paiement à la livraison. Le montant final sera confirmé lors de
            l’enregistrement de votre commande.
          </p>
        </aside>
      </div>
    </section>
  )
}

export default Commande
