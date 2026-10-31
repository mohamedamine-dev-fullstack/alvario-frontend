
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

const API = 'http://127.0.0.1:8000/api'
const vide = { nom: '', slug: '', image: '' }

function AdminCategories() {
  const navigate = useNavigate()
  const token = localStorage.getItem('alvario-admin-token')
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(vide)
  const [editionId, setEditionId] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const chargerCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`)
      setCategories(Array.isArray(response.data) ? response.data : [])
    } catch {
      setErreur('Impossible de charger les catégories.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    chargerCategories()
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

  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')

    try {
      const donnees = new FormData()
      donnees.append('nom', form.nom.trim())
      donnees.append('slug', form.slug.trim())

      if (imageFile) {
        donnees.append('image', imageFile)
      }

      if (editionId) {
        donnees.append('_method', 'PUT')

        await axios.post(
          `${API}/categories/${editionId}`,
          donnees,
          { headers }
        )
      } else {
        await axios.post(
          `${API}/categories`,
          donnees,
          { headers }
        )
      }

      setMessage(editionId ? 'Catégorie modifiée avec succès.' : 'Catégorie ajoutée avec succès.')
      reinitialiser()
      setChargement(true)
      await chargerCategories()
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('alvario-admin-token')
        navigate('/admin/login', { replace: true })
        return
      }

      const erreursValidation = error.response?.data?.errors
      setErreur(
        erreursValidation
          ? Object.values(erreursValidation).flat().join(' ')
          : error.response?.data?.message || 'Erreur lors de l’enregistrement.'
      )
    }
  }

  const modifier = (categorie) => {
    setEditionId(categorie.id)
    setImageFile(null)
    setImagePreview(
      categorie.image
        ? `http://127.0.0.1:8000/storage/${categorie.image}`
        : ''
    )
    setForm({
      nom: categorie.nom ?? '',
      slug: categorie.slug ?? '',
      image: categorie.image ?? '',
    })
    setErreur('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const supprimer = async (categorie) => {
    if (!window.confirm(`Supprimer la catégorie « ${categorie.nom} » ?`)) return

    setErreur('')
    setMessage('')

    try {
      await axios.delete(`${API}/categories/${categorie.id}`, { headers })
      setCategories((liste) => liste.filter((c) => c.id !== categorie.id))

      if (editionId === categorie.id) reinitialiser()
      setMessage('Catégorie supprimée.')
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('alvario-admin-token')
        navigate('/admin/login', { replace: true })
        return
      }

      setErreur(
        error.response?.data?.message ||
        'Impossible de supprimer cette catégorie. Vérifie si des produits y sont associés.'
      )
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img src="/logo-alvario.jpeg" alt="Alvario" />
          <h2>Gestion des catégories</h2>
        </div>
        <button type="button" onClick={() => navigate('/admin')}>
          Retour aux commandes
        </button>
      </header>

      <section className="admin-content">
        <h2>{editionId ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h2>

        {erreur && <p role="alert">{erreur}</p>}
        {message && <p role="status">{message}</p>}

        <form className="admin-form" onSubmit={enregistrer}>
          <label>
            Nom de la catégorie
            <input name="nom" value={form.nom} onChange={changerChamp} required maxLength={255} />
          </label>

          <label>
            Slug
            <input name="slug" value={form.slug} onChange={changerChamp} required maxLength={255} />
          </label>

          <label>
            Image de la catégorie
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
            <img
              src={imagePreview}
              alt="Aperçu de la catégorie"
              style={{
                width: 150,
                height: 150,
                objectFit: 'contain',
               }}
            />
          )}

          <div className="admin-form-actions">
            <button type="submit">{editionId ? 'Enregistrer les modifications' : 'Ajouter la catégorie'}</button>
            {editionId && <button type="button" onClick={reinitialiser}>Annuler</button>}
          </div>
        </form>

        <h2>Liste des catégories ({categories.length})</h2>

        {chargement ? (
          <p>Chargement...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Image</th><th>Nom</th><th>Slug</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {categories.map((categorie) => (
                  <tr key={categorie.id}>
                    <td>
                      {categorie.image ? (
                        <img
                          src={`http://127.0.0.1:8000/storage/${categorie.image}`}
                          alt={categorie.nom}
                          style={{ width: 55, height: 55, objectFit: 'contain' }}
                        />
                      ) : '—'}
                    </td>
                    <td>{categorie.nom}</td>
                    <td>{categorie.slug}</td>
                    <td>
                      <button type="button" onClick={() => modifier(categorie)}>Modifier</button>{' '}
                      <button type="button" onClick={() => supprimer(categorie)}>Supprimer</button>
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

export default AdminCategories
