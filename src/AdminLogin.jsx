
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@alvario.ma')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const seConnecter = async (event) => {
    event.preventDefault()
    setErreur('')
    setLoading(true)

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/login',
        {
          email,
          mot_de_passe: motDePasse,
        },
        {
          headers: { Accept: 'application/json' },
        }
      )

      const utilisateur = response.data.utilisateur

      if (utilisateur?.role !== 'admin') {
        setErreur('Ce compte ne possède pas les droits administrateur.')
        return
      }

      localStorage.setItem(
        'alvario-admin-token',
        response.data.token
      )

      navigate('/admin', { replace: true })
    } catch (error) {
      setErreur(
        error.response?.data?.message ||
        'Connexion impossible. Vérifiez votre email et mot de passe.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={seConnecter}>
        <p className="admin-login-brand">ALVARIO</p>
        <h1>Administration</h1>
        <p>Connectez-vous pour gérer votre boutique.</p>

        <label htmlFor="admin-email">Adresse email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="admin-password">Mot de passe</label>
        <input
          id="admin-password"
          type="password"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          autoComplete="current-password"
          required
        />

        {erreur && <p className="admin-login-error" role="alert">{erreur}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}

export default AdminLogin