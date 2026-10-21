
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import './Admin.css'

const API = 'http://127.0.0.1:8000/api'

function AdminCommandeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  const token = localStorage.getItem('alvario-admin-token')

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    axios
      .get(`${API}/admin/commandes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      .then((response) => {
        setCommande(response.data.commande || response.data)
      })
      .catch((error) => {
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem('alvario-admin-token')
          navigate('/admin/login', { replace: true })
          return
        }

        setErreur(
          error.response?.data?.message ||
          'Impossible de charger les détails de cette commande.'
        )
      })
      .finally(() => setLoading(false))
  }, [id, token, navigate])

  const formatPrix = (prix) =>
    `${Number(prix || 0).toFixed(2)} DH`

  if (loading) {
    return <main className="admin-page"><p>Chargement...</p></main>
  }

  if (erreur || !commande) {
    return (
      <main className="admin-page">
        <button onClick={() => navigate('/admin')}>
          ← Retour aux commandes
        </button>
        <p role="alert">{erreur || 'Commande introuvable.'}</p>
      </main>
    )
  }

  const articles =
    commande.articles ||
    commande.articles_commande ||
    []

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img src="/logo.png" alt="Alvario" />
          <h1>Détails commande #{commande.id}</h1>
        </div>

        <button onClick={() => navigate('/admin')}>
          ← Retour
        </button>
      </header>

      <section className="admin-content">
        <h2>Informations du client</h2>

        <div className="admin-detail-card">
          <p><strong>Nom complet :</strong> {commande.nom_complet || '—'}</p>
          <p><strong>Téléphone :</strong> {commande.telephone || '—'}</p>
          <p><strong>Ville :</strong> {commande.ville || '—'}</p>
          <p><strong>Adresse :</strong> {commande.adresse || '—'}</p>
          <p><strong>Mode de paiement :</strong> {commande.methode_paiement || '—'}</p>
          <p><strong>Statut :</strong> {commande.statut || '—'}</p>
          <p><strong>Total :</strong> {formatPrix(commande.prix_total)}</p>
        </div>

        <h2>Produits commandés</h2>

        {articles.length === 0 ? (
          <p>Aucun article trouvé pour cette commande.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Sous-total</th>
                </tr>
              </thead>

              <tbody>
                {articles.map((article, index) => {
                  const produit = article.produit || {}
                  const quantite = Number(article.quantite || 0)
                  const prix = Number(article.prix || 0)

                  return (
                    <tr key={article.id || index}>
                      <td>{produit.nom || produit.nom_produit || `Produit #${article.produit_id || ''}`}</td>
                      <td>{quantite}</td>
                      <td>{formatPrix(prix)}</td>
                      <td>{formatPrix(prix * quantite)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminCommandeDetail
