import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'


function ProductDetail({ addToCart }) {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setProduct(null)
    setAdded(false)

    axios
      .get('http://127.0.0.1:8000/api/produits')
      .then((response) => {
        const products = response.data
        const foundProduct = products.find(
          (item) => item.slug === slug
        )

        if (foundProduct) {
          setProduct(foundProduct)
        } else {
          setError(true)
        }
      })
      .catch((err) => {
        console.error('Erreur de chargement:', err)
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return <p className="product-detail-message">Chargement...</p>
  }

  if (error || !product) {
    return (
      <section className="product-detail-section">
        <div className="container">
          <h2>Produit introuvable</h2>
          <Link to="/">Retour à la boutique</Link>
        </div>
      </section>
    )
  }

  const imageUrl = product.images?.[0]?.image
    ? `http://127.0.0.1:8000/storage/${product.images[0].image}`
    : null

  const handleAddToCart = () => {
    addToCart(product)
    setAdded(true)
  }

  return (
    <section className="product-detail-section">
      <div className="container">
        <Link to="/#produits" className="back-to-products">
          ← Retour aux produits
        </Link>

        <div className="product-detail-grid">
          <div className="product-detail-image">
            {imageUrl ? (
              <img src={imageUrl} alt={product.nom} />
            ) : (
              <p>Image non disponible</p>
            )}
          </div>

          <div className="product-detail-info">
            <p className="product-category">
              {product.categorie?.nom}
            </p>

            <h1>{product.nom}</h1>

            <div className="product-detail-prices">
              <span className="product-detail-price">
                {Number(product.prix).toFixed(2)} DH
              </span>

              {Number(product.ancien_prix) > Number(product.prix) && (
                <span className="product-detail-old-price">
                  {Number(product.ancien_prix).toFixed(2)} DH
                </span>
              )}
            </div>

            <p className="product-detail-description">
              {product.description || 'Aucune description disponible.'}
            </p>

            <p className="product-detail-stock">
              {product.stock > 0
                ? 'Disponible en stock'
                : 'Rupture de stock'}
            </p>

            <button
              className="add-cart-button"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              Ajouter au panier
            </button>

            {added && (
              <div className="product-added-message">
                <p>✓ Produit ajouté au panier.</p>

                <button
                  className="view-cart-button"
                  onClick={() => navigate('/?panier=ouvrir')}
                >
                  Voir mon panier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductDetail