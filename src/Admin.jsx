
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

const API = 'http://127.0.0.1:8000/api'

function Admin() {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalCommandes, setTotalCommandes] = useState(0)


  const token = localStorage.getItem('alvario-admin-token')

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    axios
      .get(`${API}/admin/commandes?page=${currentPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      .then((response) => {
        setCommandes(response.data.data || [])
        setCurrentPage(response.data.current_page || 1)
        setLastPage(response.data.last_page || 1)
        setTotalCommandes(response.data.total || 0)
      })
      .catch((error) => {
        if (error.response?.status === 401 ||
            error.response?.status === 403) {
          localStorage.removeItem('alvario-admin-token')
          navigate('/admin/login', { replace: true })
          return
        }

        setErreur('Impossible de charger les commandes.')
      })
      .finally(() => setLoading(false))
  }, [token, navigate, currentPage])

  const modifierStatut = async (id, statut) => {
    try {
      const response = await axios.patch(
        `${API}/admin/commandes/${id}/statut`,
        { statut },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      )

      setCommandes((current) =>
        current.map((commande) =>
          commande.id === id
            ? response.data.commande
            : commande
        )
      )
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Erreur lors de la modification du statut.'
      )
    }
  }

  const deconnexion = () => {
    localStorage.removeItem('alvario-admin-token')
    navigate('/admin/login')
  }

  const commandesFiltrees = commandes.filter((commande) => {
    const terme = recherche.trim().toLowerCase()

    const correspondRecherche =
      String(commande.id).includes(terme) ||
      (commande.nom_complet || '').toLowerCase().includes(terme) ||
      String(commande.telephone || '').includes(terme)

    const correspondStatut =
      statutFiltre === '' || commande.statut === statutFiltre

    return correspondRecherche && correspondStatut
  })

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
           <img src="/logo-alvario.jpeg" alt="Alvario" />
           <h2>Administration</h2>
        </div>

        <button onClick={deconnexion}>
          Déconnexion
        </button>
      </header>

      <section className="admin-content">
        <h2>Gestion des commandes</h2>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <p>Total commandes</p>
            <h3>{commandes.length}</h3>
          </div>

          <div className="admin-stat-card">
            <p>En attente</p>
            <h3>
               {commandes.filter((c) => c.statut === 'en_attente').length}
            </h3>
          </div>

          <div className="admin-stat-card">
            <p>Confirmées</p>
            <h3>
               {commandes.filter((c) => c.statut === 'confirmee').length}
            </h3>
          </div>

          <div className="admin-stat-card">
            <p>Commandes livrées</p>
            <h3>
               {commandes.filter((c) => c.statut === 'livree').length}
            </h3>
          </div>
        </div>

        {loading && <p>Chargement des commandes...</p>}

        {erreur && <p role="alert">{erreur}</p>}

        {!loading && !erreur && commandes.length === 0 && (
          <p>Aucune commande pour le moment.</p>
        )}
        
        
        {!loading && !erreur && commandes.length > 0 && (
          <div className="admin-filters">
            <input
                type="text"
                placeholder="Rechercher par numéro, nom ou téléphone..."
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                aria-label="Rechercher une commande"
            />

            <select
                value={statutFiltre}
                onChange={(event) => setStatutFiltre(event.target.value)}
                aria-label="Filtrer par statut"
            >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirmee">Confirmée</option>
                <option value="en_preparation">En préparation</option>
                <option value="expediee">Expédiée</option>
                <option value="livree">Livrée</option>
                <option value="annulee">Annulée</option>
            </select>

            <button
                type="button"
                onClick={() => {
                  setRecherche('')
                  setStatutFiltre('')
                }}
            >
               Réinitialiser
            </button>
          </div>
        )}

        {!loading && commandes.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Ville</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Détails</th>
                </tr>
              </thead>

              <tbody>
                {commandesFiltrees.map((commande) => (
                  <tr key={commande.id}>
                    <td>#{commande.id}</td>
                    <td>{commande.nom_complet}</td>
                    <td>{commande.telephone}</td>
                    <td>{commande.ville}</td>
                    <td>
                      {Number(commande.prix_total).toFixed(2)} DH
                    </td>
                    <td>
                      <select
                        value={commande.statut}
                        onChange={(event) =>
                          modifierStatut(
                            commande.id,
                            event.target.value
                          )
                        }
                        aria-label={`Statut commande ${commande.id}`}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="confirmee">Confirmée</option>
                        <option value="en_preparation">En préparation</option>
                        <option value="expediee">Expédiée</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-details-button"
                        onClick={() => navigate(`/admin/commandes/${commande.id}`)}
                      >
                         Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-pagination">
                <span>
                  Page {currentPage} sur {lastPage} — {totalCommandes} commandes
                </span>

                <div className="admin-pagination-buttons">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                    >
                       Précédent
                    </button>

                    <button
                      type="button"
                      disabled={currentPage >= lastPage}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                       Suivant
                    </button>
                </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default Admin