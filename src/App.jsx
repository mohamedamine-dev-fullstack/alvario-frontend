
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import ProductDetail from './ProductDetail.jsx'
import Commande from './Commande.jsx'
import Admin from './Admin.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminCommandeDetail from './AdminCommandeDetail.jsx'
import './App.css'

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('alvario-cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/categories')
      .then((response) => setCategories(response.data))
      .catch((error) =>
        console.error('Erreur lors du chargement des catégories:', error)
      )

    axios
      .get('http://127.0.0.1:8000/api/produits')
      .then((response) => setProducts(response.data))
      .catch((error) =>
        console.error('Erreur lors du chargement des produits:', error)
      )
  }, [])

  useEffect(() => {
     localStorage.setItem('alvario-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('panier') === 'ouvrir') {
      setCartOpen(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory
      ? Number(product.categorie_id) === Number(selectedCategory)
      : true

    const matchesSearch = (product.nom || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      )

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentCart, { ...product, quantity: 1 }]
    })

    setCartOpen(true)
  }

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    )
  }

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.prix) * item.quantity,
    0
  )

  const cartQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
    setMenuOpen(false)

    setTimeout(() => {
      document.getElementById('produits')?.scrollIntoView({
        behavior: 'smooth',
      })
    }, 50)
  }

  const showAllProducts = () => {
    setSelectedCategory(null)

    document.getElementById('produits')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  const closeMenu = () => setMenuOpen(false)

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchTerm('')
  }

  const HomePage = (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="container header-content">
          <a
            href="#categories"
            className="logo-container"
            onClick={closeMenu}
          >
            <img
              src="/logo-alvario.jpeg"
              alt="Alvario - Men's Essentials"
              className="logo-image"
            />
          </a>

          <nav className="nav">
            <a href="#categories">Catégories</a>
            <a href="#produits">Produits</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Recherche"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              ⌕
            </button>

            <button
              className="icon-button"
              aria-label="Panier"
              onClick={() => setCartOpen(!cartOpen)}
            >
              🛒
              {cartQuantity > 0 && (
                <span className="cart-count">{cartQuantity}</span>
              )}
            </button>

            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-bar">
            <div className="container">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#categories" onClick={closeMenu}>Catégories</a>
          <a href="#produits" onClick={closeMenu}>Produits</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>

        {cartOpen && (
          <div className="cart-panel">
            <div className="container">
              <div className="cart-header">
                <h3>Votre panier</h3>
                <button
                  onClick={() => setCartOpen(false)}
                  className="cart-close"
                  aria-label="Fermer le panier"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="empty-cart">Votre panier est vide.</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div className="cart-item" key={item.id}>
                        <img
                          src={
                            item.images?.[0]?.image
                              ? `http://127.0.0.1:8000/storage/${item.images[0].image}`
                              : ''
                          }
                          alt={item.nom}
                        />

                        <div className="cart-item-info">
                          <h4>{item.nom}</h4>
                          <p className="cart-item-price">
                            {Number(item.prix).toFixed(2)} DH
                          </p>

                          <div className="cart-quantity">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              aria-label={`Diminuer ${item.nom}`}
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => increaseQuantity(item.id)}
                              aria-label={`Augmenter ${item.nom}`}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          className="remove-cart-item"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Supprimer ${item.nom}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="cart-total">
                    <span>Total</span>
                    <strong>{cartTotal.toFixed(2)} DH</strong>
                  </div>

                 <button
                   className="checkout-button"
                   onClick={() => {
                     setCartOpen(false)
                     navigate('/commande')
                   }}
                 >
                     Passer la commande
                 </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* CATÉGORIES */}
        <section id="categories" className="categories-section">
          <div className="container">
            <div className="section-heading">
              <p>NOS CATÉGORIES</p>
            </div>

            <div className="categories-grid">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="category-image">
                    <img
                      src={`http://127.0.0.1:8000/storage/${category.image}`}
                      alt={category.nom}
                    />
                  </div>
                  <h3>{category.nom}</h3>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUITS */}
        <section id="produits" className="products-section">
          <div className="container">
            <div className="section-heading section-heading-row">
              <div>
                <p>NOS PRODUITS</p>
                <h2>
                  {selectedCategory
                    ? categories.find(
                        (category) =>
                          Number(category.id) === Number(selectedCategory)
                      )?.nom
                    : 'Tous les produits'}
                </h2>
              </div>

              {selectedCategory && (
                <button
                  className="secondary-button"
                  onClick={showAllProducts}
                >
                  Voir tous les produits →
                </button>
              )}
            </div>

            <div className="products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <Link
                      to={`/produit/${product.slug}`}
                      className="product-detail-link"
                      onClick={() => {
                        setSelectedCategory(null)
                        closeSearch()
                        setMenuOpen(false)
                        setCartOpen(false)
                      }}
                    >
                      <div className="product-image">
                        <img
                          src={
                            product.images?.[0]?.image
                              ? `http://127.0.0.1:8000/storage/${product.images[0].image}`
                              : ''
                          }
                          alt={product.nom}
                        />
                      </div>

                      <div className="product-info">
                        <p className="product-category">
                          {product.categorie?.nom}
                        </p>
                        <h3>{product.nom}</h3>
                        <p className="product-price">
                          {Number(product.prix).toFixed(2)} DH
                        </p>
                      </div>
                    </Link>

                    <div className="product-info">
                      <button
                        className="add-cart-button"
                        onClick={() => addToCart(product)}
                      >
                        Ajouter au panier
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="no-products">Aucun produit trouvé.</p>
              )}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="contact-section">
          <div className="container contact-content">
            <p>ALVARIO</p>
            <h2>
              Une question ?
              <br />
              Contactez-nous.
            </h2>
            <a href="mailto:contact@alvario.ma" className="primary-button">
              Nous contacter
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-content">
          <div>
            <h3>ALVARIO</h3>
            <p>Boutique en ligne pour homme.</p>
          </div>
          <p>© 2026 Alvario. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={HomePage} />
      
      <Route
        path="/produit/:slug"
        element={<ProductDetail addToCart={addToCart} />}
      />
      
      <Route
        path="/commande"
        element={
          <Commande
            cart={cart}
            viderPanier={() => setCart([])}
          />
        }
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin"
        element={<Admin />}
      />

      <Route
        path="/admin/commandes/:id"
        element={<AdminCommandeDetail />}
      />

    </Routes>
  )
}

export default App