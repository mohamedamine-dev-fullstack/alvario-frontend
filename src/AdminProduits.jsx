
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

const API = 'http://127.0.0.1:8000/api'
const vide = {
  categorie_id: '',
  nom: '',
  slug: '',
  description: '',
  prix: '',
  ancien_prix: '',
  stock: '0',
  statut: 'actif',
  image: '',
}

function AdminProduits() {
  const navigate = useNavigate()
  const token = localStorage.getItem('alvario-admin-token')
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }

  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(vide)
  const [editionId, setEditionId] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const chargerDonnees = async () => {
    try {
      const [resProduits, resCategories] = await Promise.all([
        axios.get(`${API}/produits`),
        axios.get(`${API}/categories`),
      ])
      setProduits(Array.isArray(resProduits.data) ? resProduits.data : [])
      setCategories(Array.isArray(resCategories.data) ? resCategories.data : [])
    } catch {
      setErreur('Impossible de charger les produits ou les catégories.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    chargerDonnees()
  }, [])

  const changerChamp = (e) => {
    const { name, value } = e.target
    setForm((ancien) => {
      const suivant = { ...ancien, [name]: value }

      if (name === 'nom' && !editionId) {
        suivant.slug = value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }

      return suivant
    })
  }

  const reinitialiser = () => {
    setForm(vide)
    setEditionId(null)
    setErreur('')
    setMessage('')
    setImageFile(null)
    setImagePreview('')
  }

  const modifier = (produit) => {
    setEditionId(produit.id)
    setImageFile(null)
    setImagePreview(
      produit.images?.[0]?.image
        ? `http://127.0.0.1:8000/storage/${produit.images[0].image}`
        : ''
    )
    setForm({
      categorie_id: String(produit.categorie_id ?? ''),
      nom: produit.nom ?? '',
      slug: produit.slug ?? '',
      description: produit.description ?? '',
      prix: String(produit.prix ?? ''),
      ancien_prix: produit.ancien_prix == null ? '' : String(produit.ancien_prix),
      stock: String(produit.stock ?? 0),
      statut: produit.statut ?? 'actif',
      image: produit.images?.[0]?.image ?? '',
    })
    setErreur('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  
  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')

    try {
      const donnees = new FormData()

      donnees.append('categorie_id', form.categorie_id)
      donnees.append('nom', form.nom.trim())
      donnees.append('slug', form.slug.trim())
      donnees.append('description', form.description.trim())
      donnees.append('prix', form.prix)
      donnees.append('ancien_prix', form.ancien_prix)
      donnees.append('stock', form.stock)
      donnees.append('statut', form.statut)

      if (imageFile) {
        donnees.append('image', imageFile)
      }

      if (editionId) {
        donnees.append('_method', 'PUT')

        await axios.post(
          `${API}/produits/${editionId}`,
          donnees,
          { headers }
        )
      } else {
        await axios.post(
          `${API}/produits`,
          donnees,
          { headers }
        )
      }

      setMessage(
        editionId
          ? 'Produit modifié avec succès.'
          : 'Produit ajouté avec succès.'
      )

      reinitialiser()
      setChargement(true)
      await chargerDonnees()
    } catch (error) {
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem('alvario-admin-token')
        navigate('/admin/login', { replace: true })
        return
      }

      const erreursValidation = error.response?.data?.errors

      setErreur(
        erreursValidation
          ? Object.values(erreursValidation).flat().join(' ')
          : error.response?.data?.message ||
            'Erreur lors de l’enregistrement.'
      )
    }
  }


  const supprimer = async (produit) => {
    if (!window.confirm(`Supprimer le produit « ${produit.nom} » ?`)) return

    setErreur('')
    setMessage('')

    try {
      await axios.delete(`${API}/produits/${produit.id}`, { headers })
      setProduits((liste) => liste.filter((p) => p.id !== produit.id))

      if (editionId === produit.id) reinitialiser()
      setMessage('Produit supprimé.')
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('alvario-admin-token')
        navigate('/admin/login', { replace: true })
        return
      }

      setErreur(error.response?.data?.message || 'Impossible de supprimer ce produit.')
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img src="/logo-alvario.jpeg" alt="Alvario" />
          <h2>Gestion des produits</h2>
        </div>
        <button type="button" onClick={() => navigate('/admin')}>
          Retour aux commandes
        </button>
      </header>

      <section className="admin-content">
        <h2>{editionId ? 'Modifier le produit' : 'Ajouter un produit'}</h2>

        {erreur && <p role="alert">{erreur}</p>}
        {message && <p role="status">{message}</p>}

        <form className="admin-form" onSubmit={enregistrer}>
          <label>
            Catégorie
            <select name="categorie_id" value={form.categorie_id} onChange={changerChamp} required>
              <option value="">Choisir une catégorie</option>
              {categories.map((categorie) => (
                <option key={categorie.id} value={categorie.id}>{categorie.nom}</option>
              ))}
            </select>
          </label>

          <label>
            Nom du produit
            <input name="nom" value={form.nom} onChange={changerChamp} required maxLength={255} />
          </label>

          <label>
            Slug
            <input name="slug" value={form.slug} onChange={changerChamp} required maxLength={255} />
          </label>

          <label>
            Description
            <textarea name="description" value={form.description} onChange={changerChamp} rows={3} />
          </label>

          <div className="admin-form-grid">
            <label>
              Prix (DH)
              <input name="prix" type="number" min="0" step="0.01" value={form.prix} onChange={changerChamp} required />
            </label>

            <label>
              Ancien prix (DH)
              <input name="ancien_prix" type="number" min="0" step="0.01" value={form.ancien_prix} onChange={changerChamp} />
            </label>

            <label>
              Stock
              <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={changerChamp} required />
            </label>

            <label>
              Statut
              <select name="statut" value={form.statut} onChange={changerChamp} required>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="brouillon">Brouillon</option>
              </select>
            </label>
          </div>

          <label>
             Image du produit
             <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                   const fichier = e.target.files?.[0] || null
                   setImageFile(fichier)

                   if (fichier) {
                     setImagePreview(URL.createObjectURL(fichier))
                   }
                }}
             />
          </label>

          {imagePreview && (
            <div>
              <p>Aperçu de l’image :</p>
              <img
                  src={imagePreview}
                  alt="Aperçu du produit"
                  style={{
                    width: 150,
                    height: 150,
                    objectFit: 'contain',
                  }}
              />
            </div>
          )}

          <div className="admin-form-actions">
            <button type="submit">{editionId ? 'Enregistrer les modifications' : 'Ajouter le produit'}</button>
            {editionId && <button type="button" onClick={reinitialiser}>Annuler</button>}
          </div>
        </form>

        <h2>Liste des produits ({produits.length})</h2>

        {chargement ? (
          <p>Chargement...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Image</th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {produits.map((produit) => (
                  <tr key={produit.id}>
                    <td>
                      {produit.images?.[0]?.image ? (
                        <img
                          src={`http://127.0.0.1:8000/storage/${produit.images[0].image}`}
                          alt={produit.nom}
                          style={{ width: 55, height: 55, objectFit: 'contain' }}
                        />
                      ) : '—'}
                    </td>
                    <td>{produit.nom}</td>
                    <td>{produit.categorie?.nom || '—'}</td>
                    <td>{Number(produit.prix).toFixed(2)} DH</td>
                    <td>{produit.stock}</td>
                    <td>
                      <button type="button" onClick={() => modifier(produit)}>Modifier</button>{' '}
                      <button type="button" onClick={() => supprimer(produit)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminProduits
